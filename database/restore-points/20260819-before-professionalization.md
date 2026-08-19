# Restore point — antes da profissionalização e geração OpenRouter

Data do snapshot: 2026-08-19

## Código

- Repositório: `georgeteste4/PROJETO_ONLINE_CRESCER`
- Branch: `main`
- Commit base: `90a236048fe0626ad0f697202c07a2370bdd3012`
- Tag remota: `restore-before-professionalization-20260819`

Para restaurar o código:

```bash
git fetch --tags origin
git checkout restore-before-professionalization-20260819
```

## Supabase

- Projeto: `cskhqoyrqhwlwrrfaemw`
- Migrações aplicadas antes deste trabalho:
  - `crescer_schema_supabase` — `20260819170937`
  - `crescer_catalog_seed` — `20260819171002`
  - `supabase_auth_admin` — `20260819171517`
  - `004_harden_security_definer` — `20260819171907`
  - `grant_private_is_staff` — `20260819172752`
  - `admin_stats_rls` — `20260819180350`

## Contagem lógica dos dados

| Tabela | Registros |
| --- | ---: |
| `public.users` | 5 |
| `public.children` | 2 |
| `public.age_stages` | 4 |
| `public.categories` | 5 |
| `public.activities` | 20 |
| `public.completions` | 0 |
| `public.favorites` | 0 |

A restauração estrutural deve usar as migrações versionadas em `database/`. As contas Auth não têm senhas exportadas para este snapshot; devem ser recriadas por fluxo seguro de Auth caso seja necessário restaurar um ambiente do zero. Não há chave `service_role`, `sb_secret`, token de usuário ou senha neste arquivo.
