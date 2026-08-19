# Crescer+

Frontend React mobile-first do Crescer+, conectado diretamente ao Supabase por meio de `@supabase/supabase-js`. A autenticação usa Supabase Auth; os dados de perfil, crianças, catálogo, favoritos e conclusões ficam no schema público protegido por Row Level Security.

## Configuração local

Instale as dependências e defina as duas variáveis públicas em `.env.local`:

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
npm start
```

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

A chave publicável é destinada ao navegador. A segurança dos dados depende das políticas RLS aplicadas nas migrações; **não coloque uma chave `service_role` ou `sb_secret` neste frontend**.

## Banco de dados

A pasta `database` contém as migrações na ordem abaixo:

| Arquivo | Finalidade |
| --- | --- |
| `001_crescer_schema_supabase.sql` | Tabelas, vínculos com `auth.users`, trigger de perfil, RLS, permissões e bucket privado para fotos. |
| `002_crescer_catalog_seed.sql` | Categorias, quatro fases de desenvolvimento e 20 atividades educativas com disclaimer. |
| `003_supabase_auth_admin.sql` | Exclusão da própria conta, regras administrativas e prevenção de autoalteração de papel ou banimento. |
| `004_harden_security_definer.sql` | Move funções internas para o schema privado e deixa somente a exclusão autenticada como RPC pública intencional. |
| `005_grant_private_is_staff.sql` | Concede somente aos usuários autenticados a execução interna necessária para as políticas RLS administrativas. |
| `006_admin_stats_rls.sql` | Permite que staff leia conclusões e favoritos para as métricas do painel administrativo. |

As seis migrações já foram aplicadas ao projeto Supabase configurado para este frontend. O seed validado contém **5 categorias, 4 fases e 20 atividades**. Os SQLs anexados foram mantidos como referência, mas não foram executados diretamente porque usavam `password_hash`, IDs `text` e contas de teste que não são compatíveis com o Auth nativo do Supabase.

## Arquitetura de integração

As telas existentes continuam usando a interface `api.get`, `api.post`, `api.put`, `api.patch` e `api.delete`, mas `src/lib/api.js` agora implementa essas operações diretamente via Supabase. Isso evita espalhar consultas pelo componente e mantém uma camada de acesso única para autenticação, crianças, atividades, favoritos, conclusões, progresso e painel administrativo.

O arquivo `src/lib/supabase.js` inicializa o cliente com sessão persistente, renovação automática do token e detecção de retorno de autenticação. O `AuthContext` escuta alterações de sessão e sincroniza o perfil e a criança ativa.

## Desenvolvimento

```bash
npm start
npm run build
```

O projeto usa Create React App com CRACO. O comando `npm install --legacy-peer-deps` é recomendado porque o conjunto original contém conflitos de peer dependencies entre `react-day-picker`, `date-fns` e versões de ESLint.

## Observações de segurança

O frontend não recebe acesso a operações privilegiadas do Auth. A auditoria de segurança do Supabase não encontrou funções internas expostas; permanece apenas o aviso esperado da RPC autenticada de exclusão da própria conta, que valida `auth.uid()` e só remove o usuário da sessão atual.

A redefinição de senha administrativa envia o fluxo seguro de recuperação de senha do Supabase para o e-mail do usuário, em vez de gerar ou exibir uma senha. Convites podem criar a conta pelo Auth, mas a atribuição de papéis privilegiados deve permanecer restrita a um operador administrativo e às políticas RLS; para envio automático de e-mails ou promoção segura de novos administradores, recomenda-se uma Edge Function em uma etapa posterior.

O conteúdo do app é educativo e não substitui avaliação profissional.
