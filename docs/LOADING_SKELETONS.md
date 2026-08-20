# Loading skeletons do Crescer+

## Objetivo

O Crescer+ utiliza skeleton loading para comunicar que uma página está sendo preparada antes de exibir listas, cards, indicadores ou detalhes vindos do Supabase. O padrão evita telas vazias, reduz a percepção de espera e mantém a composição visual acolhedora do aplicativo durante consultas assíncronas.

> Skeleton loading é uma representação visual simplificada da estrutura que será preenchida pelo conteúdo real. Ele não substitui mensagens de erro, estados vazios ou indicadores de submissão de formulários.

## Implementação

A implementação compartilhada está em `src/components/LoadingSkeletons.jsx`. O arquivo usa o componente base `src/components/ui/skeleton.jsx`, preserva a paleta quente do Crescer+ com `bg-[#EFE6DF]` e expõe variantes orientadas ao tipo de conteúdo.

| Componente | Uso principal |
| --- | --- |
| `PageLoading` | Fallback genérico com `role="status"` e `aria-live="polite"`. Recebe `variant` como `content`, `dashboard`, `detail`, `form`, `list`, `grid`, `table`, `settings`, `progress` ou `admin-dashboard`. |
| `DashboardSkeleton` | Saudação, card da criança, fase e sugestões do dia. |
| `ListSkeleton` | Biblioteca, notificações, chamados e mensagens. |
| `DetailSkeleton` | Detalhe de atividade e conteúdos com imagem, título e seções. |
| `ProgressSkeleton` | Cards de métricas e área do gráfico de progresso. |
| `AdminTableSkeleton` | Tabelas e listagens de usuários, atividades, convites, auditoria e campanhas. |
| `AdminDashboardSkeleton` | Indicadores e gráficos do painel administrativo. |
| `SettingsSkeleton` | Configurações, provedores de e-mail, prompts e geração editorial. |

## Cobertura por rota

Os guards globais exibem `PageLoading` durante a resolução da sessão e do contexto da criança. As páginas protegidas usam skeleton antes de consultas do catálogo, progresso, suporte, notificações, convite e perfil. As páginas administrativas aplicam variantes específicas antes de carregar dados de usuários, fases, categorias, atividades, convites, sugestões fixas, auditoria, campanhas, suporte, configurações, jobs de IA e indicadores.

Estados de ação, como `Entrando…`, `Salvando…`, `Enviando…`, `Aceitando…`, `Gerando…`, `Testando…` e `Aplicando…`, continuam sendo mantidos nos botões. Esses estados representam uma operação iniciada pelo usuário e não o carregamento inicial de uma página; trocar esses textos por skeleton prejudicaria o feedback da ação.

## Acessibilidade e comportamento

Cada `PageLoading` possui `role="status"`, `aria-live="polite"` e texto somente para leitores de tela. As formas visuais são decorativas com `aria-hidden="true"`, evitando que cada bloco seja anunciado individualmente. O componente mantém áreas de toque e espaçamento próximos ao layout real para reduzir deslocamentos perceptíveis quando o conteúdo chega.

Os skeletons não substituem o tratamento de erro. Após a consulta, a tela deve apresentar uma mensagem acolhedora, uma ação de tentar novamente e, quando aplicável, um estado vazio explicado. Também não devem ser usados para mascarar a demora de uma ação de formulário ou uma operação destrutiva.

## Checklist de manutenção

Ao criar uma nova página que consulta o Supabase, o estado inicial deve começar como `true`, a consulta deve desligá-lo em `finally` e o retorno de carregamento deve acontecer antes da estrutura que depende dos dados. Escolha a variante mais próxima do conteúdo final e mantenha o skeleton dentro do mesmo `AppShell` ou layout administrativo usado pela página.

Antes de publicar, execute:

```bash
npm install --legacy-peer-deps
REACT_APP_SUPABASE_URL="https://seu-projeto.supabase.co" \
REACT_APP_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
npm run build
```

Em seguida, confirme que não há placeholders manuais com `animate-pulse`, `Carregando…` ou `return null` em páginas dinâmicas, exceto o componente base e estados deliberados de submissão. O workflow de deploy continuará sendo acionado por `git push origin main`, conforme `docs/GITHUB_PAGES_DEPLOY.md`.

## Referência de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/components/LoadingSkeletons.jsx` | Variantes reutilizáveis e acessíveis. |
| `src/components/ProtectedRoute.jsx` | Skeleton durante autenticação e resolução da criança. |
| `src/App.js` | Skeleton durante a resolução das rotas públicas e do onboarding. |
| `src/pages/**/*.jsx` | Fallbacks específicos de cada página dinâmica. |
| `docs/CUSTOM_DOMAIN_AND_ENVIRONMENTS.md` | Ambientes, domínio, PWA e publicação. |
| `docs/GITHUB_PAGES_DEPLOY.md` | Deploy contínuo e diagnóstico do workflow. |
