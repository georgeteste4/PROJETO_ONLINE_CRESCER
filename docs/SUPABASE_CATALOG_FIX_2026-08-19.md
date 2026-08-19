# Correção de criação do catálogo e integração Supabase

**Data:** 19 de agosto de 2026
**Projeto Supabase:** `cskhqoyrqhwlwrrfaemw`
**Repositório:** `georgeteste4/PROJETO_ONLINE_CRESCER`

## Problema identificado

A criação de uma categoria pelo painel administrativo retornava `HTTP 400` no endpoint REST do Supabase:

```json
{
  "code": "23502",
  "message": "null value in column \"id\" of relation \"categories\" violates not-null constraint"
}
```

A causa era estrutural: `categories.id`, `age_stages.id` e `activities.id` são colunas `text` obrigatórias, mas o schema não possuía `DEFAULT` e o adaptador enviava o payload sem gerar um ID quando o formulário criava um registro novo. O mesmo risco existia em importações e no fluxo de aplicação de conteúdo gerado pela Edge Function `admin-ai`.

## Correções aplicadas

### Banco de dados

A migração `database/017_catalog_ids_and_content_rls.sql` foi aplicada com sucesso no Supabase. Ela:

1. Cria `private.is_content_staff()` com `security definer`, `search_path` fixo e acesso apenas para usuários autenticados.
2. Define defaults textuais para novos registros:
   - `category_<uuid>` em `categories.id`;
   - `stage_<uuid>` em `age_stages.id`;
   - `activity_<uuid>` em `activities.id`.
3. Substitui as políticas de escrita amplas por políticas que permitem criar, atualizar e excluir conteúdo somente para `super_admin` e `editor`.
4. Mantém a leitura do catálogo para usuários autenticados.
5. Aplica a mesma restrição a atividades fixadas e importações.

A migração `database/018_harden_notification_trigger.sql` também foi aplicada. Ela fixa `search_path = public, pg_temp` na função privada que atualiza notificações e elimina o alerta correspondente do advisor de segurança.

### Frontend

O adaptador `src/lib/api.js` agora:

- gera IDs textuais quando categorias, fases ou atividades chegam sem `id`;
- normaliza payloads de atividades, materiais, passos, duração e disclaimer;
- valida título, slug, fase e categoria antes do insert;
- aplica a autorização de conteúdo também nas rotas administrativas de edição, exclusão e importação;
- impede duração menor que um minuto;
- mantém compatibilidade com IDs já existentes.

### Conteúdo gerado por IA

A Edge Function `admin-ai` foi publicada na versão 2, mantendo `verify_jwt: true`. A aplicação de jobs agora gera IDs para categorias, fases e atividades quando o modelo não fornecer identificador e rejeita atividades com referências obrigatórias ausentes.

## Testes executados

Foi executado um teste transacional diretamente no banco. O Supabase gerou corretamente IDs como:

```text
category_0ceaff43ffd74d61acdcbcd969576944
stage_ef9bdad9f51c4aab9948f2f193436911
activity_7e6ffed3e8484f09b8f1c04ccb135b4f
```

O teste REST integrado também confirmou:

| Cenário | Resultado |
| --- | --- |
| Moderador tentando criar categoria | Bloqueado pelo RLS |
| Administrador criando categoria sem ID | Criado com `category_<uuid>` |
| Administrador criando fase sem ID | Criado com `stage_<uuid>` |
| Administrador criando atividade sem ID | Criado com `activity_<uuid>` |
| Referências de atividade | `age_stage_id` e `category_id` persistidos corretamente |
| Limpeza dos registros de teste | Executada com sucesso |
| Build React | Aprovado |
| Endpoint Supabase no bundle de produção | `https://cskhqoyrqhwlwrrfaemw.supabase.co` presente |
| Placeholder como configuração ativa | Ausente; o texto restante é apenas fallback defensivo do código |

## GitHub Pages e Supabase

O workflow `.github/workflows/deploy-pages.yml` foi atualizado para injetar no passo de build:

```text
REACT_APP_SUPABASE_URL=https://cskhqoyrqhwlwrrfaemw.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

A chave publicável pode aparecer no bundle do navegador. Chaves de serviço, tokens do OpenRouter, Resend, Mailtrap e segredo do Auth Hook continuam fora do repositório e devem permanecer configurados apenas como secrets no Supabase.

A execução `32309756788` concluiu com sucesso para o commit `dd94cd1`. Os assets diretos publicados retornaram `HTTP 200`, incluindo `index.html`, `manifest.json`, `service-worker.js` e o bundle `main.07be612d.js`. O manifest mantém `start_url` e `scope` em `/PROJETO_ONLINE_CRESCER/`.

O domínio personalizado antigo foi removido da configuração do Pages. A API do GitHub agora informa `cname: null` e o painel mostra a URL padrão:

<https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/>

A CDN do GitHub pode conservar temporariamente um redirecionamento antigo da raiz por alguns minutos. Durante essa janela, os assets diretos já respondem corretamente; após a expiração do cache, a raiz passa a responder sem o redirecionamento. Não é necessário alterar o código para essa expiração.

## PWA e cache

O `public/service-worker.js` foi corrigido para definir `CACHE_NAME` e usa atualmente `crescer-static-v3`. O evento `activate` remove versões anteriores automaticamente. Ao alterar o shell do aplicativo de maneira estrutural, incremente esse valor para invalidar caches antigos.

## Fluxo de atualização contínua

Toda alteração deve seguir este fluxo:

```bash
cd /caminho/do/projeto
npm ci --legacy-peer-deps
npm run build
git add -A
git commit -m "descreva a alteração"
git push origin main
```

O push na branch `main` inicia automaticamente o workflow. Ele instala dependências, injeta a configuração pública do Supabase, compila o CRA, publica o artefato no ambiente `github-pages` e mantém a URL atualizada.

Para acompanhar a publicação:

```bash
gh run list --repo georgeteste4/PROJETO_ONLINE_CRESCER --workflow deploy-pages.yml --limit 5
gh run watch <RUN_ID> --repo georgeteste4/PROJETO_ONLINE_CRESCER
```

Para consultar o estado do Pages:

```bash
gh api repos/georgeteste4/PROJETO_ONLINE_CRESCER/pages
```

Antes de aceitar uma alteração, confirme que `cname` está `null`, que a execução terminou com `success` e que o bundle publicado contém o domínio real do Supabase.
