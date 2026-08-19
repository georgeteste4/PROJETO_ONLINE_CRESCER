import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_DISCLAIMER = "Conteúdo educativo, não substitui avaliação profissional.";
const ALLOWED_KINDS = new Set(["categories", "age_stages", "activities", "pinned_suggestions"]);

function createTextId(prefix: string, value?: unknown) {
  const candidate = String(value || "").trim();
  if (candidate) return candidate;
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
const CONTENT_ROLES = new Set(["super_admin", "editor"]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorMessage(error: unknown, fallback = "Não foi possível concluir a operação.") {
  if (error instanceof Error && error.message) return error.message.slice(0, 500);
  if (typeof error === "string") return error.slice(0, 500);
  return fallback;
}

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function renderTemplate(template: string, values: Record<string, unknown>) {
  return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => asString(values[key] ?? ""));
}

function unwrapOutput(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).items)) {
    return (value as Record<string, unknown>).items as unknown[];
  }
  return [];
}

function normalizedSchema(schema: unknown) {
  const parsed = schema && typeof schema === "object" ? schema as Record<string, unknown> : null;
  if (parsed?.type === "object") return parsed;
  if (parsed?.type === "array") {
    return {
      type: "object",
      properties: { items: parsed },
      required: ["items"],
      additionalProperties: false,
    };
  }
  return {
    type: "object",
    properties: {
      items: { type: "array", items: { type: "object", additionalProperties: true } },
    },
    required: ["items"],
    additionalProperties: false,
  };
}

function settingValue(settings: Array<Record<string, unknown>>, key: string, fallback: unknown) {
  const row = settings.find((item) => item.key === key);
  return row?.value_json ?? fallback;
}

async function getContext(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("Sessão administrativa ausente.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Configuração do Supabase ausente na Edge Function.");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Sua sessão expirou. Entre novamente.");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, banned")
    .eq("id", authData.user.id)
    .single();
  if (profileError || !profile || profile.banned || !CONTENT_ROLES.has(profile.role)) {
    throw new Error("Você não tem permissão para usar a geração de conteúdo.");
  }

  return { supabase, profile };
}

async function openRouterRequest(path: string, init: RequestInit = {}) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY ainda não foi configurada no Supabase.");
  const response = await fetch(`https://openrouter.ai/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }
  if (!response.ok) {
    const providerError = data?.error && typeof data.error === "object" ? (data.error as Record<string, unknown>).message : data?.message;
    throw new Error(`OpenRouter (${response.status}): ${String(providerError || "resposta inválida")}`);
  }
  return data;
}

async function listModels() {
  const data = await openRouterRequest("/models?output_modalities=text");
  const models = Array.isArray(data.data) ? data.data : [];
  return models
    .filter((model) => {
      const supported = Array.isArray(model.supported_parameters) ? model.supported_parameters : [];
      return supported.includes("structured_outputs") || supported.includes("response_format");
    })
    .map((model) => ({
      id: model.id,
      name: model.name,
      context_length: model.context_length,
      supported_parameters: model.supported_parameters,
      pricing: model.pricing,
      top_provider: model.top_provider,
    }))
    .slice(0, 200);
}

async function generateContent(req: Request, body: Record<string, unknown>, supabase: ReturnType<typeof createClient>, profile: Record<string, unknown>) {
  const kind = String(body.kind || "");
  if (!ALLOWED_KINDS.has(kind)) throw new Error("Tipo de conteúdo inválido.");

  const { data: settings, error: settingsError } = await supabase
    .from("app_settings")
    .select("key, value_json")
    .limit(50);
  if (settingsError) throw new Error(settingsError.message);

  const maxItems = Math.min(20, Math.max(1, Number(settingValue(settings || [], "ai.max_batch_items", 10)) || 10));
  const count = Math.min(maxItems, Math.max(1, Number(body.count) || 1));
  const defaultModel = String(settingValue(settings || [], "ai.default_model", "openai/gpt-4o-mini"));
  const model = String(body.model || defaultModel);
  const promptKey = String(body.prompt_key || `default_${kind}`);
  const { data: prompt, error: promptError } = await supabase
    .from("admin_prompts")
    .select("prompt_key, kind, name, system_prompt, user_prompt, output_schema")
    .eq("prompt_key", promptKey)
    .single();
  if (promptError || !prompt) throw new Error("Template de prompt não encontrado.");
  if (prompt.kind !== kind) throw new Error("O template selecionado não pertence ao tipo escolhido.");

  const requestedContext = body.context && typeof body.context === "object" ? body.context as Record<string, unknown> : {};
  let existingTitles: string[] = [];
  let availableActivities: unknown[] = [];
  if (kind === "activities") {
    let query = supabase.from("activities").select("id, titulo").limit(200);
    if (requestedContext.age_stage_id) query = query.eq("age_stage_id", String(requestedContext.age_stage_id));
    if (requestedContext.category_id) query = query.eq("category_id", String(requestedContext.category_id));
    const { data } = await query;
    existingTitles = (data || []).map((item) => item.titulo).filter(Boolean);
  }
  if (kind === "pinned_suggestions") {
    let query = supabase.from("activities").select("id, age_stage_id, category_id, titulo").limit(200);
    if (requestedContext.age_stage_id) query = query.eq("age_stage_id", String(requestedContext.age_stage_id));
    const { data } = await query;
    availableActivities = data || [];
  }

  const variables = {
    ...requestedContext,
    count,
    age_stage_id: requestedContext.age_stage_id || "",
    category_id: requestedContext.category_id || "",
    existing_titles: existingTitles,
    available_activities: availableActivities,
  };
  const renderedUserPrompt = renderTemplate(String(body.user_prompt || prompt.user_prompt), variables);
  const renderedSystemPrompt = String(body.system_prompt || prompt.system_prompt);
  const inputJson = { ...requestedContext, count, model, prompt_key: promptKey };

  const { data: job, error: jobError } = await supabase
    .from("ai_generation_jobs")
    .insert({
      kind,
      model,
      prompt_key: promptKey,
      system_prompt: renderedSystemPrompt,
      user_prompt: renderedUserPrompt,
      input_json: inputJson,
      output_json: [],
      status: "pending",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (jobError || !job) throw new Error(jobError?.message || "Não foi possível criar o job.");

  try {
    const referer = String(settingValue(settings || [], "ai.http_referer", ""));
    const appTitle = String(settingValue(settings || [], "ai.app_title", "Crescer+ Conteúdo"));
    const data = await openRouterRequest("/chat/completions", {
      method: "POST",
      headers: {
        ...(referer ? { "HTTP-Referer": referer } : {}),
        "X-OpenRouter-Title": appTitle,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: renderedSystemPrompt },
          { role: "user", content: renderedUserPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: `crescer_${kind}`,
            strict: true,
            schema: normalizedSchema(prompt.output_schema),
          },
        },
        provider: { require_parameters: true },
        temperature: 0.7,
        max_tokens: 6000,
        stream: false,
      }),
    });

    const choice = Array.isArray(data.choices) ? data.choices[0] as Record<string, unknown> : null;
    const message = choice?.message && typeof choice.message === "object" ? choice.message as Record<string, unknown> : null;
    const content = typeof message?.content === "string" ? message.content : JSON.stringify(message?.content || "");
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("O modelo retornou um JSON inválido.");
    }
    const output = unwrapOutput(parsed);
    if (!output.length) throw new Error("O modelo não retornou itens para revisão.");

    const { error: updateError } = await supabase
      .from("ai_generation_jobs")
      .update({ status: "generated", output_json: output, completed_at: new Date().toISOString(), error_message: null })
      .eq("id", job.id);
    if (updateError) throw new Error(updateError.message);
    return { job_id: job.id, status: "generated", kind, model, output_json: output };
  } catch (error) {
    await supabase
      .from("ai_generation_jobs")
      .update({ status: "failed", error_message: errorMessage(error), completed_at: new Date().toISOString() })
      .eq("id", job.id);
    throw error;
  }
}

function catalogRows(kind: string, output: unknown[], context: Record<string, unknown>) {
  if (kind === "categories") {
    return output.map((item) => {
      const row = item as Record<string, unknown>;
      const id = createTextId("category", row.id || row.slug);
      return { id, slug: String(row.slug || id), nome: String(row.nome || "Nova categoria"), cor: String(row.cor || "#E87A5D"), icone: String(row.icone || "Sparkles") };
    });
  }
  if (kind === "age_stages") {
    return output.map((item) => {
      const row = item as Record<string, unknown>;
      const id = createTextId("stage", row.id || row.slug);
      return { id, slug: String(row.slug || id), titulo: String(row.titulo || "Nova fase"), descricao: String(row.descricao || ""), min_days: Number(row.min_days) || 0, max_days: Math.max(Number(row.max_days) || 0, Number(row.min_days) || 0), dados_gerais: String(row.dados_gerais || ""), desenvolvimento: String(row.desenvolvimento || ""), dicas: String(row.dicas || ""), cuidados: String(row.cuidados || "") };
    });
  }
  if (kind === "activities") {
    return output.map((item) => {
      const row = item as Record<string, unknown>;
      return { id: createTextId("activity", row.id), age_stage_id: String(row.age_stage_id || context.age_stage_id || ""), category_id: String(row.category_id || context.category_id || ""), titulo: String(row.titulo || "Nova atividade"), objetivo: String(row.objetivo || ""), materiais: Array.isArray(row.materiais) ? row.materiais : [], passos: Array.isArray(row.passos) ? row.passos : [], duracao_min: Math.max(1, Number(row.duracao_min) || 10), cuidados: String(row.cuidados || "Supervisione a criança durante toda a atividade."), imagem_url: row.imagem_url || null, disclaimer: DEFAULT_DISCLAIMER };
    });
  }
  return output.map((item) => {
    const row = item as Record<string, unknown>;
    return { age_stage_id: String(row.age_stage_id || context.age_stage_id || ""), activity_id: String(row.activity_id || "") };
  });
}

async function applyJob(body: Record<string, unknown>, supabase: ReturnType<typeof createClient>) {
  const jobId = String(body.job_id || "");
  if (!jobId) throw new Error("Job não informado.");
  const { data: job, error: jobError } = await supabase
    .from("ai_generation_jobs")
    .select("id, kind, status, output_json, input_json")
    .eq("id", jobId)
    .single();
  if (jobError || !job) throw new Error("Job não encontrado.");
  if (job.status !== "generated") throw new Error("Somente jobs gerados e revisados podem ser aplicados.");

  const context = job.input_json && typeof job.input_json === "object" ? job.input_json as Record<string, unknown> : {};
  const output = unwrapOutput(job.output_json);
  const rows = catalogRows(job.kind, output, context);
  if (!rows.length) throw new Error("O job não contém itens aplicáveis.");
  const hasInvalidReferences = rows.some((row) => {
    const item = row as Record<string, unknown>;
    return !item.age_stage_id || (job.kind === "activities" && (!item.category_id || !item.titulo)) || (job.kind === "pinned_suggestions" && !item.activity_id);
  });
  if (hasInvalidReferences) {
    throw new Error("O conteúdo gerado precisa informar as referências de fase, categoria e atividade.");
  }

  let result: { data: unknown[] | null; error: { message: string } | null };
  if (job.kind === "pinned_suggestions") {
    result = await supabase.from("pinned_suggestions").upsert(rows, { onConflict: "age_stage_id,activity_id", ignoreDuplicates: true }).select("id");
  } else if (job.kind === "categories") {
    result = await supabase.from("categories").insert(rows).select("id");
  } else if (job.kind === "age_stages") {
    result = await supabase.from("age_stages").insert(rows).select("id");
  } else {
    result = await supabase.from("activities").insert(rows).select("id");
  }
  if (result.error) throw new Error(result.error.message);

  const { error: updateError } = await supabase
    .from("ai_generation_jobs")
    .update({ status: "applied", completed_at: new Date().toISOString(), error_message: null })
    .eq("id", jobId);
  if (updateError) throw new Error(updateError.message);
  return { job_id: jobId, status: "applied", created_count: result.data?.length || 0 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const { supabase, profile } = await getContext(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "generate");
    if (action === "models") return jsonResponse({ data: await listModels() });
    if (action === "generate") return jsonResponse({ data: await generateContent(req, body, supabase, profile) });
    if (action === "apply") return jsonResponse({ data: await applyJob(body, supabase) });
    throw new Error("Ação de IA inválida.");
  } catch (error) {
    return jsonResponse({ error: errorMessage(error) }, 400);
  }
});
