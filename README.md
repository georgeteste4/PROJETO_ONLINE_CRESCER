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
| `007_admin_settings_ai_generation.sql` | Configurações editoriais, prompts versionáveis e histórico de jobs de geração em lote, todos protegidos por RLS de staff. |
| `008_invites_configuration_and_acceptance.sql` | Validade configurável, modo de entrega manual, gestão de convites restrita a super_admin e RPC transacional de aceite/promoção. |
| `009_grant_invite_policy_helper.sql` | Permissão mínima para a função auxiliar usada pela policy RLS de convites. |
| `010_email_providers_and_audit.sql` | Provedores nativo/Resend/Mailtrap, registros de entrega, auditoria por triggers e RPC segura de leitura. |
| `011_audit_user_activity.sql` | Amplia a auditoria para conclusões, favoritos e consentimentos do usuário. |
| `012_harden_audit_redaction.sql` | Remove dados pessoais desnecessários dos detalhes dos logs. |
| `013_notifications_support.sql` | Cria campanhas segmentadas, preferências de notificação, caixa de entrada, chamados e mensagens de suporte, além das RPCs transacionais. |
| `014_notifications_support_grants.sql` | Concede apenas as permissões necessárias para o módulo de notificações e suporte. |
| `015_fix_notification_stage_audience.sql` | Corrige a segmentação por fase usando a idade calculada a partir de `children.dob` e `age_stages`. |
| `016_fix_notification_campaign_unique.sql` | Adiciona o índice único que torna a publicação de campanhas idempotente por campanha e usuário. |

As dezesseis migrações já foram aplicadas ao projeto Supabase configurado para este frontend. O seed validado contém **5 categorias, 4 fases e 20 atividades**. Os SQLs anexados foram mantidos como referência, mas não foram executados diretamente porque usavam `password_hash`, IDs `text` e contas de teste que não são compatíveis com o Auth nativo do Supabase.

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

A redefinição de senha administrativa envia o fluxo seguro de recuperação de senha do Supabase para o e-mail do usuário, em vez de gerar ou exibir uma senha. Convites podem criar a conta pelo Auth, mas a atribuição de papéis privilegiados deve permanecer restrita a um operador administrativo e às políticas RLS.

## Geração editorial em lote

O painel administrativo agora possui as rotas `/admin/configuracoes` e `/admin/gerar-ia`. A primeira permite ajustar modelo padrão, limite de lote, atribuição, nome da aplicação e prompts por tipo de conteúdo. A segunda gera rascunhos estruturados para categorias, fases, atividades e sugestões fixas, mantendo o resultado como job para revisão antes da aplicação.

A Edge Function `admin-ai` foi publicada no projeto Supabase com JWT obrigatório. Ela valida o papel `super_admin` ou `editor`, consulta os prompts e configurações via RLS, chama `https://openrouter.ai/api/v1/chat/completions` com `response_format.type = json_schema` e grava o resultado em `ai_generation_jobs`. A chave nunca deve ser colocada no frontend ou nas tabelas públicas. Configure-a como secret da Edge Function com o nome `OPENROUTER_API_KEY` no painel/CLI do Supabase antes de usar a geração real. Sem esse secret, a interface permanece disponível, mas exibirá uma mensagem explicando que a geração ainda não foi habilitada.

Os modelos compatíveis são filtrados pelo catálogo do OpenRouter usando `supported_parameters` com `structured_outputs` ou `response_format`. O resultado deve ser revisado pelo time editorial e, para conteúdo infantil, passar por curadoria profissional antes de uma escala maior.

## E-mail transacional e autenticação

A tela `/admin/configuracoes` agora permite selecionar `Supabase Auth nativo`, `Resend` ou `Mailtrap` como provedor padrão para convites e mensagens transacionais. O provedor de fallback também pode ser definido. As credenciais nunca são salvas em `app_settings`, `email_providers` ou no frontend: a Edge Function `email-service` espera os secrets `RESEND_API_KEY`, `MAILTRAP_API_TOKEN` e, para o Send Email Hook, `SEND_EMAIL_HOOK_SECRET`.

O Resend usa `POST https://api.resend.com/emails` com Bearer token; o Mailtrap usa `POST https://send.api.mailtrap.io/api/send` com `Api-Token`. O botão **Testar** valida o provedor selecionado. O provedor nativo é deliberadamente manual na tela porque o envio é gerenciado pelo SMTP do Supabase Auth; para produção, configure SMTP customizado no projeto Supabase.

Cadastro, recuperação de senha e demais e-mails nativos continuam passando pelo Supabase Auth. Para rotear esses eventos por Resend/Mailtrap, configure a Edge Function `email-service` como **Send Email Hook** em Authentication > Hooks, gere o secret do hook e defina `email.auth_hook_enabled` somente depois de concluir essa configuração. O endpoint está publicado sem JWT obrigatório porque valida a assinatura Standard Webhooks, como exige o Supabase Auth Hook.

Sem as API keys do usuário, Resend/Mailtrap permanecem disponíveis para configuração, mas o teste retorna uma mensagem indicando o secret ausente; isso evita gravar credenciais de forma insegura.

## Auditoria administrativa

A página `/admin/auditoria` é exclusiva de `super_admin` e permite filtrar por ação (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `SEND_EMAIL` e `SYSTEM`), recurso, e-mail do ator e período. Os triggers registram mudanças em usuários, crianças, atividades, fases, categorias, convites, configurações, provedores, conclusões, favoritas e consentimentos. Os detalhes removem campos sensíveis conhecidos, incluindo token de convite e senha.

A auditoria possui RLS de leitura restrito a `super_admin`; gravações de mudanças são feitas por função `security definer` e a RPC de leituras explícitas aceita somente `SELECT`, `LOGIN` e `LOGOUT`. O endpoint de e-mail também registra entregas, falhas e uso de fallback em `email_deliveries` e `audit_logs`.

## Instalação como aplicativo

O app agora possui um prompt de instalação contextual para dispositivos móveis. Em navegadores que oferecem `beforeinstallprompt`, o botão abre o diálogo nativo; em iPhone/iPad, exibe as instruções para usar Compartilhar > Adicionar à Tela de Início. O prompt respeita o modo standalone, o evento `appinstalled` e o fechamento pelo usuário. O manifest, o service worker e o `apple-touch-icon` permanecem configurados para `/PROJETO_ONLINE_CRESCER/`.

## Notificações e suporte

A rota protegida `/notificacoes` reúne a caixa de entrada do usuário, preferências de recebimento e o CTA de contato. O `NotificationBell` aparece no início após o login, exibe a contagem de não lidas, atualiza periodicamente e solicita permissão para notificações do navegador quando o ambiente oferece essa capacidade. A funcionalidade não depende de push offline pesado: a instalação PWA usa cache leve do shell estático e as notificações persistidas são entregues pelo Supabase.

A rota `/admin/notificacoes` é exclusiva de `super_admin` e oferece CRUD de campanhas com título, mensagem, ação contextual, estado de rascunho, publicação/agendamento e segmentação por usuário, papel ou fase da criança. A publicação chama `publish_notification_campaign(uuid)`, que calcula a audiência e insere a inbox de forma idempotente com o índice `uq_notifications_campaign_user`. A segmentação por fase usa `(current_date - children.dob) between age_stages.min_days and age_stages.max_days`.

A rota `/suporte` permite abrir chamados com assunto, categoria, prioridade e mensagem, além de acompanhar respostas e status. A rota `/admin/suporte`, acessível a `admin`, `editor`, `moderator` e `super_admin`, lista chamados, filtra por status/prioridade, permite responder publicamente, registrar notas internas e atualizar a prioridade ou o status. Como `support_tickets` possui duas relações com `users`, as consultas usam explicitamente `users!support_tickets_user_id_fkey(email, name)` para evitar a ambiguidade do PostgREST.

As RPCs principais desse módulo são `publish_notification_campaign(uuid)`, `create_support_ticket(text,text,text,text)` e `reply_support_ticket(uuid,text,boolean)`. Foram validados criação e publicação de campanha segmentada, geração de inbox, abertura de chamado, resposta administrativa, leitura e atualização de estado.

## Convites administrativos

A tela `/admin/convites` é exclusiva de `super_admin`. A criação calcula `expires_at` a partir de `app_settings.invites.expiration_days`, gera um link compatível com o subdiretório público e tenta enviar automaticamente pelo provedor padrão; se o provedor nativo estiver selecionado ou houver falha, o link permanece disponível para compartilhamento manual. O prazo inicial é de **7 dias** e pode ser alterado em `/admin/configuracoes` entre 1 e 30 dias.

O convidado pode criar uma conta diretamente pelo link ou entrar com uma conta existente. Em ambos os casos, o Supabase chama a RPC `public.accept_invite(text)`, que valida o token, confere o e-mail autenticado, promove o perfil ao papel convidado e marca o convite como usado em uma transação. Tokens inválidos, expirados ou já utilizados não são expostos pela leitura pública.

A validação automatizada temporária confirmou criação, leitura pública pendente, aceite, promoção para editor e limpeza dos dados de teste. O teste foi executado com as contas de demonstração e não deixou convite ou alteração de papel persistente.

## Verificações recentes

Além do build de produção, foram executados testes de convites e promoção de papel, provedor nativo de e-mail, auditoria de atividades, campanhas de notificações, suporte com resposta administrativa e consulta PostgREST da relação usuário-ticket. O preview público foi atualizado e verificado nas rotas `/notificacoes` e `/suporte`, incluindo formulário de contato, estados vazios e navegação mobile.

## Deploy permanente e atualização contínua

O frontend está preparado para publicação no GitHub Pages em [https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/](https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/). O workflow `.github/workflows/deploy-pages.yml` executa `npm ci --legacy-peer-deps`, `npm run build`, empacota a pasta `build/` e publica o artefato no ambiente `github-pages` a cada push na branch `main`. Ele também aceita execução manual por `workflow_dispatch`.

O procedimento completo, incluindo configuração inicial do Pages, caminho base do Create React App, fallback de rotas, validação, rollback, diagnóstico e proteção de secrets, está em [`docs/GITHUB_PAGES_DEPLOY.md`](docs/GITHUB_PAGES_DEPLOY.md). Para publicar uma alteração, valide localmente com `npm run build`, faça commit e execute `git push origin main`; a atualização online será iniciada automaticamente.

O conteúdo do app é educativo e não substitui avaliação profissional.
