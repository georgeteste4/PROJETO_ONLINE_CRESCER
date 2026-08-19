import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ALLOWED_PROVIDERS = new Set(["native", "resend", "mailtrap"]);
const ALLOWED_EVENTS = new Set(["signup", "invite", "recovery", "magiclink", "email_change", "notification", "test"]);

type Provider = {
  id: string;
  provider: string;
  name: string;
  enabled: boolean;
  from_email: string;
  from_name: string;
  reply_to: string;
  secret_env_name: string;
  config_json: Record<string, unknown>;
};

type EmailMessage = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  event_type: string;
  created_by?: string | null;
};

function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function errorMessage(error: unknown, fallback = "Não foi possível concluir o envio.") {
  if (error instanceof Error && error.message) return error.message.slice(0, 600);
  if (typeof error === "string") return error.slice(0, 600);
  return fallback;
}

function env(name: string) {
  return Deno.env.get(name)?.trim() || "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function serviceClient() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente na Edge Function.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function adminContext(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("Sessão administrativa ausente.");
  const url = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Configuração do Supabase ausente na Edge Function.");
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error("Sua sessão expirou. Entre novamente.");
  const { data: profile, error: profileError } = await client.from("users").select("id, email, name, role, banned").eq("id", authData.user.id).single();
  if (profileError || !profile || profile.banned || profile.role !== "super_admin") throw new Error("Apenas super administradores podem gerenciar provedores de e-mail.");
  return { profile, service: serviceClient() };
}

async function settings(client: ReturnType<typeof createClient>) {
  const { data, error } = await client.from("app_settings").select("key, value_json").limit(100);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((row) => [row.key, row.value_json]));
}

async function activeProvider(client: ReturnType<typeof createClient>, requested?: string) {
  const config = await settings(client);
  const providerName = String(requested || config["email.default_provider"] || "native");
  if (!ALLOWED_PROVIDERS.has(providerName)) throw new Error("Provedor de e-mail inválido.");
  const { data, error } = await client.from("email_providers").select("id, provider, name, enabled, from_email, from_name, reply_to, secret_env_name, config_json").eq("provider", providerName).single();
  if (error || !data) throw new Error("Configuração do provedor não encontrada.");
  return { provider: data as Provider, config };
}

async function logDelivery(client: ReturnType<typeof createClient>, provider: Provider | null, message: EmailMessage, status: "sent" | "failed" | "manual", providerMessageId: string | null, errorMessageValue: string | null) {
  await client.from("email_deliveries").insert({
    provider_id: provider?.id || null,
    event_type: message.event_type,
    recipient: message.to,
    subject: message.subject,
    status,
    provider_message_id: providerMessageId,
    error_message: errorMessageValue,
    created_by: message.created_by || null,
  });
}

async function logAudit(client: ReturnType<typeof createClient>, action: string, resource: string, resourceId: string | null, actor: { id?: string | null; email?: string | null; name?: string | null } | null, details: Record<string, unknown>) {
  await client.from("audit_logs").insert({
    action,
    resource,
    resource_id: resourceId,
    actor_user_id: actor?.id || null,
    actor_email: actor?.email || "sistema",
    actor_name: actor?.name || "Sistema",
    details,
  });
}

async function sendWithProvider(client: ReturnType<typeof createClient>, provider: Provider, message: EmailMessage) {
  if (!provider.enabled) throw new Error(`O provedor ${provider.name} está desativado.`);
  if (provider.provider === "native") {
    await logDelivery(client, provider, message, "manual", null, "O provedor nativo é entregue pelo SMTP/Auth do Supabase; configure-o no dashboard do projeto.");
    return { provider: provider.provider, status: "manual", message_id: null };
  }
  if (!provider.from_email) throw new Error(`Configure o e-mail remetente do provedor ${provider.name}.`);
  const secretName = provider.provider === "resend" ? "RESEND_API_KEY" : "MAILTRAP_API_TOKEN";
  const secret = env(secretName);
  if (!secret) throw new Error(`${secretName} ainda não foi configurada como secret da Edge Function.`);

  const fromName = provider.from_name ? `${provider.from_name} <${provider.from_email}>` : provider.from_email;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let endpoint: string;
  let body: Record<string, unknown>;
  if (provider.provider === "resend") {
    endpoint = String(provider.config_json?.api_url || "https://api.resend.com/emails");
    headers.Authorization = `Bearer ${secret}`;
    body = { from: fromName, to: [message.to], subject: message.subject, html: message.html, text: message.text, ...(provider.reply_to ? { reply_to: provider.reply_to } : {}) };
  } else {
    endpoint = String(provider.config_json?.api_url || "https://send.api.mailtrap.io/api/send");
    headers["Api-Token"] = secret;
    body = { from: { email: provider.from_email, name: provider.from_name }, to: [{ email: message.to }], subject: message.subject, html: message.html, text: message.text, ...(provider.reply_to ? { reply_to: { email: provider.reply_to } } : {}) };
  }
  const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
  if (!response.ok || data.success === false) {
    const detail = Array.isArray(data.errors) ? data.errors.join("; ") : String((data.error && typeof data.error === "object" ? (data.error as Record<string, unknown>).message : data.error) || data.message || raw || `HTTP ${response.status}`);
    await logDelivery(client, provider, message, "failed", null, detail.slice(0, 600));
    throw new Error(`${provider.name} (${response.status}): ${detail}`);
  }
  const id = provider.provider === "resend" ? String(data.id || "") : Array.isArray(data.message_ids) ? String(data.message_ids[0] || "") : "";
  await logDelivery(client, provider, message, "sent", id || null, null);
  return { provider: provider.provider, status: "sent", message_id: id || null };
}

async function sendMessage(client: ReturnType<typeof createClient>, message: EmailMessage, requested?: string) {
  const { provider, config } = await activeProvider(client, requested);
  try {
    const result = await sendWithProvider(client, provider, message);
    return { ...result, fallback_used: false };
  } catch (primaryError) {
    const fallbackName = String(config["email.fallback_provider"] || "");
    if (fallbackName && fallbackName !== provider.provider && ALLOWED_PROVIDERS.has(fallbackName)) {
      const { provider: fallback } = await activeProvider(client, fallbackName);
      try {
        const result = await sendWithProvider(client, fallback, message);
        await logAudit(client, "SEND_EMAIL", "email_service", message.event_type, { id: message.created_by, email: null, name: null }, { provider: provider.provider, fallback_provider: fallback.provider, fallback_used: true, recipient: message.to });
        return { ...result, fallback_used: true, primary_error: errorMessage(primaryError) };
      } catch (fallbackError) {
        throw new Error(`${errorMessage(primaryError)} Fallback: ${errorMessage(fallbackError)}`);
      }
    }
    throw primaryError;
  }
}

function authLink(supabaseUrl: string, tokenHash: string, action: string, redirectTo: string) {
  if (!tokenHash) return "";
  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify`);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", action);
  url.searchParams.set("redirect_to", redirectTo || supabaseUrl);
  return url.toString();
}

function hookSubject(action: string) {
  const labels: Record<string, string> = { signup: "Confirme seu e-mail no Crescer+", recovery: "Redefina sua senha no Crescer+", invite: "Você recebeu um convite para o Crescer+", magiclink: "Seu acesso ao Crescer+", email_change: "Confirme a alteração do seu e-mail", reauthentication: "Seu código de segurança do Crescer+" };
  return labels[action] || "Atualização importante da sua conta Crescer+";
}

function hookMessage(payload: Record<string, unknown>) {
  const user = (payload.user || {}) as Record<string, unknown>;
  const emailData = (payload.email_data || {}) as Record<string, unknown>;
  const action = String(emailData.email_action_type || "email");
  const email = String(user.email || "");
  const token = String(emailData.token || "");
  const tokenHash = String(emailData.token_hash || "");
  const redirectTo = String(emailData.redirect_to || emailData.site_url || "");
  const link = authLink(env("SUPABASE_URL"), tokenHash, action, redirectTo);
  const title = hookSubject(action);
  const intro = action === "recovery" ? "Recebemos um pedido para redefinir sua senha." : action === "invite" ? "Você foi convidado para fazer parte do painel Crescer+." : action === "signup" ? "Falta só confirmar seu e-mail para começar." : "Há uma nova ação de segurança na sua conta.";
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#3F302C"><h1 style="color:#C9684C">${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p>${link ? `<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#C9684C;color:white;padding:14px 22px;border-radius:28px;text-decoration:none">Continuar no Crescer+</a></p>` : ""}${token ? `<p>Se preferir, use este código: <strong>${escapeHtml(token)}</strong></p>` : ""}<p style="font-size:12px;color:#766862">Se você não solicitou esta ação, ignore esta mensagem.</p></div>`;
  const text = `${intro}\n\n${link ? `Acesse: ${link}\n` : ""}${token ? `Código: ${token}\n` : ""}Se você não solicitou esta ação, ignore esta mensagem.`;
  return { to: email, subject: title, html, text, event_type: ALLOWED_EVENTS.has(action) ? action : "notification" } as EmailMessage;
}

async function handleHook(req: Request) {
  const secret = env("SEND_EMAIL_HOOK_SECRET");
  if (!secret) return jsonResponse({ error: { http_code: 503, message: "SEND_EMAIL_HOOK_SECRET não configurado." } }, 503, { "retry-after": "true" });
  const payloadText = await req.text();
  try {
    const webhook = new Webhook(secret.replace(/^v1,whsec_/, ""));
    const payload = webhook.verify(payloadText, Object.fromEntries(req.headers)) as Record<string, unknown>;
    const client = serviceClient();
    const message = hookMessage(payload);
    if (!message.to) throw new Error("O hook não recebeu o e-mail do usuário.");
    const result = await sendMessage(client, message);
    const user = (payload.user || {}) as Record<string, unknown>;
    await logAudit(client, "SEND_EMAIL", "auth_hook", message.event_type, { id: String(user.id || "") || null, email: message.to, name: null }, { provider: result.provider, event_type: message.event_type });
    return jsonResponse({});
  } catch (error) {
    return jsonResponse({ error: { http_code: 500, message: errorMessage(error) } }, 500);
  }
}

async function handleAdmin(req: Request, body: Record<string, unknown>) {
  const { profile, service } = await adminContext(req);
  const action = String(body.action || "");
  if (action === "test") {
    const recipient = String(body.recipient || "").trim();
    if (!recipient) throw new Error("Informe o destinatário do teste.");
    const providerName = String(body.provider || "");
    const { provider } = await activeProvider(service, providerName);
    if (provider.provider === "native") {
      await service.from("email_providers").update({ last_tested_at: new Date().toISOString(), last_test_status: "manual", last_test_message: "O provedor nativo é gerenciado pelo SMTP do Supabase Auth." }).eq("id", provider.id);
      return { provider: provider.provider, status: "manual", message: "Configure o SMTP do Supabase Auth no dashboard do projeto." };
    }
    const result = await sendMessage(service, { to: recipient, subject: "Teste de e-mail — Crescer+", html: "<p>Este é um teste de configuração do Crescer+.</p>", text: "Este é um teste de configuração do Crescer+.", event_type: "test", created_by: profile.id }, provider.provider);
    await service.from("email_providers").update({ last_tested_at: new Date().toISOString(), last_test_status: "ok", last_test_message: "Teste enviado." }).eq("id", provider.id);
    await logAudit(service, "SEND_EMAIL", "email_provider", provider.provider, profile, { test: true, recipient, status: result.status });
    return result;
  }
  if (action === "send") {
    const message = { to: String(body.to || ""), subject: String(body.subject || ""), html: body.html ? String(body.html) : undefined, text: body.text ? String(body.text) : undefined, event_type: ALLOWED_EVENTS.has(String(body.event_type)) ? String(body.event_type) : "notification", created_by: profile.id } as EmailMessage;
    if (!message.to || !message.subject || (!message.html && !message.text)) throw new Error("Destinatário, assunto e conteúdo são obrigatórios.");
    const result = await sendMessage(service, message, body.provider ? String(body.provider) : undefined);
    await logAudit(service, "SEND_EMAIL", "email_service", message.event_type, profile, { provider: result.provider, recipient: message.to, status: result.status });
    return result;
  }
  throw new Error("Ação de e-mail inválida.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);
  const bodyText = await req.text();
  try {
    const parsed = JSON.parse(bodyText || "{}");
    const hasAdminAction = ["test", "send"].includes(String(parsed.action || ""));
    if (!hasAdminAction && !req.headers.get("webhook-signature")) return jsonResponse({ error: "Hook assinado ou ação administrativa obrigatória." }, 401);
    if (hasAdminAction) return jsonResponse({ data: await handleAdmin(new Request(req, { body: bodyText }), parsed) });
    return await handleHook(new Request(req, { body: bodyText }));
  } catch (error) {
    return jsonResponse({ error: errorMessage(error) }, 400);
  }
});
