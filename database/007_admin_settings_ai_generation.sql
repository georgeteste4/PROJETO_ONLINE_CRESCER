-- Crescer+ / Supabase — configurações administrativas e geração em lote

create table if not exists public.app_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_by uuid null references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_prompts (
  prompt_key text primary key,
  kind text not null check (kind in ('categories','age_stages','activities','pinned_suggestions')),
  name text not null,
  system_prompt text not null default '',
  user_prompt text not null default '',
  output_schema jsonb not null default '{}'::jsonb,
  updated_by uuid null references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('categories','age_stages','activities','pinned_suggestions')),
  model text not null,
  prompt_key text null references public.admin_prompts(prompt_key) on delete set null,
  system_prompt text not null default '',
  user_prompt text not null default '',
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','generated','applied','failed')),
  error_message text null,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists idx_ai_generation_jobs_created_at on public.ai_generation_jobs(created_at desc);
create index if not exists idx_ai_generation_jobs_created_by on public.ai_generation_jobs(created_by, created_at desc);

alter table public.app_settings enable row level security;
alter table public.admin_prompts enable row level security;
alter table public.ai_generation_jobs enable row level security;

drop policy if exists "app_settings_staff" on public.app_settings;
drop policy if exists "admin_prompts_staff" on public.admin_prompts;
drop policy if exists "ai_generation_jobs_staff" on public.ai_generation_jobs;

create policy "app_settings_staff" on public.app_settings
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "admin_prompts_staff" on public.admin_prompts
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "ai_generation_jobs_staff" on public.ai_generation_jobs
for all to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

insert into public.app_settings (key, value_json)
values
  ('ai.default_model', to_jsonb('openai/gpt-4o-mini'::text)),
  ('ai.max_batch_items', to_jsonb(10)),
  ('ai.require_review', to_jsonb(true)),
  ('ai.http_referer', to_jsonb(''::text)),
  ('ai.app_title', to_jsonb('Crescer+ Conteúdo'::text))
on conflict (key) do nothing;

insert into public.admin_prompts (prompt_key, kind, name, system_prompt, user_prompt, output_schema)
values
  (
    'default_categories',
    'categories',
    'Categorias educativas',
    'Você é um editor de conteúdo educativo para o Crescer+. Escreva em português do Brasil, com linguagem acolhedora, concreta e não clínica. Não faça diagnósticos nem promessas de desenvolvimento. Retorne somente JSON válido no formato solicitado.',
    'Gere {{count}} categorias de atividades para desenvolvimento infantil. Cada item deve ter id estável em snake_case, slug, nome curto, cor hexadecimal acessível e ícone Lucide sugerido. Evite duplicidades e termos clínicos.',
    '{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"slug":{"type":"string"},"nome":{"type":"string"},"cor":{"type":"string"},"icone":{"type":"string"}},"required":["id","slug","nome","cor","icone"],"additionalProperties":false}}'::jsonb
  ),
  (
    'default_age_stages',
    'age_stages',
    'Fases de desenvolvimento',
    'Você é um editor de conteúdo educativo para o Crescer+. Escreva em português do Brasil, com linguagem acolhedora, concreta e não clínica. Não faça diagnósticos nem promessas de desenvolvimento. Retorne somente JSON válido no formato solicitado.',
    'Gere {{count}} fases de desenvolvimento infantil. Cada item deve ter id estável em snake_case, slug, título, descrição, min_days, max_days e textos dados_gerais, desenvolvimento, dicas e cuidados. Os cuidados devem recomendar supervisão e avaliação profissional quando apropriado.',
    '{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"slug":{"type":"string"},"titulo":{"type":"string"},"descricao":{"type":"string"},"min_days":{"type":"integer"},"max_days":{"type":"integer"},"dados_gerais":{"type":"string"},"desenvolvimento":{"type":"string"},"dicas":{"type":"string"},"cuidados":{"type":"string"}},"required":["id","slug","titulo","descricao","min_days","max_days","dados_gerais","desenvolvimento","dicas","cuidados"],"additionalProperties":false}}'::jsonb
  ),
  (
    'default_activities',
    'activities',
    'Atividades educativas',
    'Você é um editor de conteúdo educativo para o Crescer+. Escreva em português do Brasil, com linguagem acolhedora e simples para pais e cuidadores. Não faça diagnósticos, não use linguagem clínica e não prometa resultados. Priorize segurança, supervisão e materiais acessíveis. Retorne somente JSON válido no formato solicitado.',
    'Gere {{count}} atividades para a fase {{age_stage_id}} e categoria {{category_id}}. Cada atividade deve ter id em snake_case, título, objetivo, materiais como lista, passos como lista numerada em texto, duracao_min positiva, cuidados e disclaimer exatamente: Conteúdo educativo, não substitui avaliação profissional. Não repita títulos existentes: {{existing_titles}}.',
    '{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"titulo":{"type":"string"},"objetivo":{"type":"string"},"materiais":{"type":"array","items":{"type":"string"}},"passos":{"type":"array","items":{"type":"string"}},"duracao_min":{"type":"integer"},"cuidados":{"type":"string"},"imagem_url":{"type":["string","null"]},"disclaimer":{"type":"string"}},"required":["id","titulo","objetivo","materiais","passos","duracao_min","cuidados","imagem_url","disclaimer"],"additionalProperties":false}}'::jsonb
  ),
  (
    'default_pinned_suggestions',
    'pinned_suggestions',
    'Sugestões fixas',
    'Você é um curador de conteúdo do Crescer+. Retorne somente JSON válido e selecione apenas IDs existentes no catálogo fornecido. Não invente IDs.',
    'Selecione {{count}} atividades para a fase {{age_stage_id}} dentre o catálogo abaixo. Priorize variedade de categorias e segurança. Catálogo: {{available_activities}}.',
    '{"type":"array","items":{"type":"object","properties":{"age_stage_id":{"type":"string"},"activity_id":{"type":"string"},"rationale":{"type":"string"}},"required":["age_stage_id","activity_id","rationale"],"additionalProperties":false}}'::jsonb
  )
on conflict (prompt_key) do nothing;
