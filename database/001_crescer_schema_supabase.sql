-- Crescer+ / Supabase
-- Schema compatível com o cliente web direto. Senhas são gerenciadas exclusivamente por Supabase Auth.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default 'Família',
  role text not null default 'user' check (role in ('user','moderador','editor','super_admin')),
  banned boolean not null default false,
  accept_terms boolean not null default false,
  active_child_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  nome text not null,
  dob date not null,
  foto_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  drop constraint if exists users_active_child_id_fkey;
alter table public.users
  add constraint users_active_child_id_fkey foreign key (active_child_id) references public.children(id) on delete set null;

create table if not exists public.age_stages (
  id text primary key,
  slug text not null unique,
  titulo text not null,
  descricao text not null,
  min_days integer not null check (min_days >= 0),
  max_days integer not null check (max_days >= min_days),
  dados_gerais text not null default '',
  desenvolvimento text not null default '',
  dicas text not null default '',
  cuidados text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  nome text not null,
  cor text not null,
  icone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text primary key,
  age_stage_id text not null references public.age_stages(id) on delete restrict,
  category_id text not null references public.categories(id) on delete restrict,
  titulo text not null,
  objetivo text not null default '',
  materiais jsonb not null default '[]'::jsonb check (jsonb_typeof(materiais) = 'array'),
  passos jsonb not null default '[]'::jsonb check (jsonb_typeof(passos) = 'array'),
  duracao_min integer not null default 10 check (duracao_min > 0),
  cuidados text not null default '',
  imagem_url text null,
  disclaimer text not null default 'Conteúdo educativo, não substitui avaliação profissional.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (age_stage_id, category_id, titulo)
);

create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  activity_id text not null references public.activities(id) on delete cascade,
  data timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  activity_id text not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (child_id, activity_id)
);

create table if not exists public.pinned_suggestions (
  id uuid primary key default gen_random_uuid(),
  age_stage_id text not null references public.age_stages(id) on delete cascade,
  activity_id text not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (age_stage_id, activity_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('moderador','editor','super_admin')),
  token text not null unique,
  expires_at timestamptz not null,
  invited_by uuid null references public.users(id) on delete set null,
  invited_by_name text not null default 'Admin',
  used boolean not null default false,
  used_at timestamptz null,
  used_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null,
  accepted_at timestamptz not null default now(),
  version text not null default '1.0',
  unique (user_id, consent_type, version)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_imports (
  id uuid primary key default gen_random_uuid(),
  imported_by uuid null references public.users(id) on delete set null,
  source_format text not null check (source_format in ('json','csv')),
  total integer not null default 0,
  created_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_children_user_id on public.children(user_id);
create index if not exists idx_children_dob on public.children(dob);
create index if not exists idx_activities_stage on public.activities(age_stage_id);
create index if not exists idx_activities_category on public.activities(category_id);
create index if not exists idx_completions_child_data on public.completions(child_id, data desc);
create index if not exists idx_favorites_child on public.favorites(child_id);
create index if not exists idx_invites_email_pending on public.invites(email, used, expires_at);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, accept_terms)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Família'),
    coalesce((new.raw_user_meta_data ->> 'accept_terms')::boolean, false)
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    accept_terms = excluded.accept_terms,
    updated_at = now();

  if coalesce((new.raw_user_meta_data ->> 'accept_terms')::boolean, false) then
    insert into public.user_consents (user_id, consent_type, version)
    values (new.id, 'terms_of_use', '1.0')
    on conflict (user_id, consent_type, version) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('super_admin', 'editor', 'moderador')
      and banned = false
  );
$$;

alter table public.users enable row level security;
alter table public.children enable row level security;
alter table public.age_stages enable row level security;
alter table public.categories enable row level security;
alter table public.activities enable row level security;
alter table public.completions enable row level security;
alter table public.favorites enable row level security;
alter table public.pinned_suggestions enable row level security;
alter table public.invites enable row level security;
alter table public.user_consents enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_imports enable row level security;

-- Reaplicável: remove políticas do mesmo nome antes de recriá-las.
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "children_select_own" on public.children;
drop policy if exists "children_insert_own" on public.children;
drop policy if exists "children_update_own" on public.children;
drop policy if exists "children_delete_own" on public.children;
drop policy if exists "catalog_select_authenticated" on public.age_stages;
drop policy if exists "categories_select_authenticated" on public.categories;
drop policy if exists "activities_select_authenticated" on public.activities;
drop policy if exists "activities_manage_staff" on public.activities;
drop policy if exists "stages_manage_staff" on public.age_stages;
drop policy if exists "categories_manage_staff" on public.categories;
drop policy if exists "completions_select_own" on public.completions;
drop policy if exists "completions_insert_own" on public.completions;
drop policy if exists "completions_delete_own" on public.completions;
drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;
drop policy if exists "pinned_select_authenticated" on public.pinned_suggestions;
drop policy if exists "pinned_manage_staff" on public.pinned_suggestions;
drop policy if exists "invites_select_pending" on public.invites;
drop policy if exists "invites_manage_staff" on public.invites;
drop policy if exists "consents_select_own" on public.user_consents;
drop policy if exists "consents_insert_own" on public.user_consents;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "imports_manage_staff" on public.activity_imports;

create policy "users_select_own" on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "users_update_own" on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "children_select_own" on public.children for select to authenticated using ((select auth.uid()) = user_id);
create policy "children_insert_own" on public.children for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "children_update_own" on public.children for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "children_delete_own" on public.children for delete to authenticated using ((select auth.uid()) = user_id);

create policy "catalog_select_authenticated" on public.age_stages for select to authenticated using (true);
create policy "categories_select_authenticated" on public.categories for select to authenticated using (true);
create policy "activities_select_authenticated" on public.activities for select to authenticated using (true);
create policy "stages_manage_staff" on public.age_stages for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "categories_manage_staff" on public.categories for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "activities_manage_staff" on public.activities for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "completions_select_own" on public.completions for select to authenticated using (exists (select 1 from public.children c where c.id = child_id and c.user_id = (select auth.uid())));
create policy "completions_insert_own" on public.completions for insert to authenticated with check (exists (select 1 from public.children c where c.id = child_id and c.user_id = (select auth.uid())));
create policy "completions_delete_own" on public.completions for delete to authenticated using (exists (select 1 from public.children c where c.id = child_id and c.user_id = (select auth.uid())));

create policy "favorites_select_own" on public.favorites for select to authenticated using (exists (select 1 from public.children c where c.id = child_id and c.user_id = (select auth.uid())));
create policy "favorites_insert_own" on public.favorites for insert to authenticated with check (exists (select 1 from public.children c where c.id = child_id and c.user_id = (select auth.uid())));
create policy "favorites_delete_own" on public.favorites for delete to authenticated using (exists (select 1 from public.children c where c.id = child_id and c.user_id = (select auth.uid())));

create policy "pinned_select_authenticated" on public.pinned_suggestions for select to authenticated using (true);
create policy "pinned_manage_staff" on public.pinned_suggestions for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "invites_select_pending" on public.invites for select to anon, authenticated using (used = false and expires_at > now());
create policy "invites_manage_staff" on public.invites for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "consents_select_own" on public.user_consents for select to authenticated using ((select auth.uid()) = user_id);
create policy "consents_insert_own" on public.user_consents for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "notifications_select_own" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "notifications_update_own" on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "imports_manage_staff" on public.activity_imports for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

-- Permissões mínimas para a API gerada pelo Supabase.
grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.children to authenticated;
grant select on public.age_stages, public.categories, public.activities, public.pinned_suggestions to authenticated;
grant insert, update, delete on public.age_stages, public.categories, public.activities, public.pinned_suggestions to authenticated;
grant select, insert, delete on public.completions to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.invites to anon, authenticated;
grant select, insert, update, delete on public.invites to authenticated;
grant select, insert on public.user_consents to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.activity_imports to authenticated;

-- Bucket privado opcional para fotos das crianças.
insert into storage.buckets (id, name, public)
values ('child-photos', 'child-photos', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "child_photos_select_own" on storage.objects;
drop policy if exists "child_photos_insert_own" on storage.objects;
drop policy if exists "child_photos_update_own" on storage.objects;
drop policy if exists "child_photos_delete_own" on storage.objects;
create policy "child_photos_select_own" on storage.objects for select to authenticated using (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "child_photos_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "child_photos_update_own" on storage.objects for update to authenticated using (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "child_photos_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

comment on table public.users is 'Perfil público vinculado a auth.users; senhas nunca são armazenadas nesta tabela.';
comment on table public.activities is 'Conteúdo educativo; todo registro deve manter disclaimer não clínico.';
comment on table public.user_consents is 'Registro mínimo de consentimento e termos para LGPD.';
