# Deploy permanente do Crescer+ no GitHub Pages

## Objetivo

Este documento descreve a publicação do frontend React do Crescer+ no GitHub Pages e o procedimento para manter a página online e atualizada automaticamente. O endereço permanente planejado para a aplicação é:

> https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/

O GitHub Pages hospeda somente os arquivos estáticos gerados pelo React. A autenticação, o banco de dados, as políticas RLS, as Edge Functions, os uploads e os demais serviços continuam sendo executados diretamente pelo projeto Supabase configurado no frontend. Não existe API PHP intermediária neste fluxo.

## Arquitetura da publicação

A branch `main` é a fonte de publicação. Sempre que um commit chegar a essa branch, o workflow `.github/workflows/deploy-pages.yml` executará o ciclo completo:

| Etapa | Responsabilidade |
| --- | --- |
| Checkout | Baixar o commit recebido na branch `main`. |
| Node.js | Preparar o runtime Node 22 usado pelo projeto. |
| Instalação | Executar `npm ci --legacy-peer-deps` respeitando o lockfile e os conflitos de peer dependencies conhecidos do projeto. |
| Build | Executar `npm run build` e gerar a pasta `build/`. |
| Configuração | Preparar o site para o GitHub Pages e habilitar o recurso quando a conta permitir essa operação. |
| Artifact | Empacotar a pasta `build/` como artefato oficial do Pages. |
| Deploy | Publicar o artefato no ambiente `github-pages`. |

O workflow usa `actions/configure-pages`, `actions/upload-pages-artifact` e `actions/deploy-pages`. A concorrência está configurada para cancelar uma publicação anterior quando uma atualização mais recente chegar, evitando que uma versão antiga sobrescreva a mais nova.

## Requisitos de caminho

Como o repositório é publicado em um subdiretório, o projeto precisa usar o caminho base correto. O `package.json` deve manter:

```json
{
  "homepage": "https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER"
}
```

O valor faz o Create React App gerar referências de JavaScript, CSS, ícones e manifest compatíveis com `/PROJETO_ONLINE_CRESCER/`. O `public/manifest.json`, o `public/service-worker.js`, o `public/404.html` e os ícones também devem manter referências relativas ou o prefixo correto do subdiretório.

Não remova a cópia `public/404.html`. Ela permite que o GitHub Pages devolva o shell da aplicação para rotas internas do React Router, como `/atividades`, `/progresso`, `/perfil`, `/notificacoes` e `/suporte`, quando o usuário acessar diretamente uma URL profunda.

## Atualização automática

A atualização contínua ocorre por evento de push. Não é necessário manter o navegador aberto, executar o build manualmente ou iniciar um servidor local. O fluxo recomendado é:

```bash
git add -A
git commit -m "descrição da alteração"
git push origin main
```

O push inicia automaticamente o workflow. Para acompanhar a publicação pelo terminal:

```bash
gh run list \
  --repo georgeteste4/PROJETO_ONLINE_CRESCER \
  --workflow deploy-pages.yml \
  --limit 5
```

Para abrir os detalhes da execução mais recente:

```bash
gh run view <RUN_ID> \
  --repo georgeteste4/PROJETO_ONLINE_CRESCER \
  --log-failed
```

A publicação também pode ser iniciada manualmente pela aba **Actions**, escolhendo o workflow **Deploy Crescer+ to GitHub Pages** e usando **Run workflow**. O arquivo já declara `workflow_dispatch` para esse caso.

## Como validar uma versão publicada

Depois que o workflow terminar com sucesso, abra:

```text
https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/
```

A validação mínima deve confirmar o carregamento da tela inicial, login e registro, navegação entre as quatro abas, carregamento de dados do Supabase, abertura de uma atividade, marcação como favorita, conclusão, progresso, central de notificações, suporte e instalação PWA quando o navegador oferecer essa opção.

Para confirmar que o Pages está respondendo por HTTP, pode-se executar:

```bash
curl -I https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/
curl -I https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/manifest.json
```

O primeiro comando deve retornar uma resposta HTTP bem-sucedida ou um redirecionamento para uma resposta bem-sucedida. O segundo deve retornar o manifest da aplicação. Após uma publicação, o CDN do GitHub pode levar alguns instantes para refletir a nova versão; aguarde a conclusão do workflow antes de diagnosticar cache.

## Configuração do Supabase

O GitHub Pages não deve receber uma chave `service_role`, `sb_secret` ou qualquer segredo de Edge Function. O build do navegador utiliza apenas as variáveis públicas esperadas pelo projeto:

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

As secrets privadas permanecem no Supabase e não devem ser adicionadas ao repositório:

| Secret | Uso |
| --- | --- |
| `OPENROUTER_API_KEY` | Geração editorial em lote pela Edge Function `admin-ai`. |
| `RESEND_API_KEY` | Envio via Resend pela Edge Function `email-service`. |
| `MAILTRAP_API_TOKEN` | Envio via Mailtrap pela Edge Function `email-service`. |
| `SEND_EMAIL_HOOK_SECRET` | Validação do Send Email Hook do Supabase Auth. |

As políticas RLS e as Edge Functions são independentes do provedor de hospedagem do frontend. O Pages não deve ser usado para contornar autenticação ou autorização do Supabase.

## Configuração do GitHub Pages

No repositório, a opção de publicação deve estar definida como **GitHub Actions**, não como `Deploy from a branch`. A configuração pode ser conferida na página:

```text
https://github.com/georgeteste4/PROJETO_ONLINE_CRESCER/settings/pages
```

Se o recurso ainda não estiver habilitado, selecione **Source: GitHub Actions** e salve. O token utilizado pela sessão de automação pode não possuir permissão administrativa para ativar o Pages por API; nesse caso, essa seleção precisa ser feita uma única vez pelo proprietário ou administrador do repositório. Depois disso, os pushes futuros serão automáticos.

O ambiente `github-pages` deve ser criado automaticamente pelo primeiro deploy. Se o repositório exigir aprovação manual, abra a execução na aba **Actions** e aprove o deployment pendente no ambiente informado.

## Diagnóstico de falhas

| Sintoma | Verificação | Correção |
| --- | --- | --- |
| `Get Pages site failed` ou `Not Found` | Abra Settings > Pages e verifique o Source. | Selecione **GitHub Actions** uma única vez e execute novamente o workflow. |
| Build falha no `npm ci` | Confira se `package-lock.json` foi commitado e se o projeto mantém os peer dependencies atuais. | Preserve `npm ci --legacy-peer-deps` no workflow e atualize o lockfile junto com alterações de dependência. |
| Página abre, mas recursos retornam 404 | Verifique `homepage` e o prefixo `/PROJETO_ONLINE_CRESCER/`. | Não use caminhos absolutos apontando para `/static/...`; mantenha `homepage` e manifest compatíveis com o subdiretório. |
| Rota interna retorna 404 ao atualizar o navegador | Confira se `public/404.html` está presente no build. | Preserve `public/404.html` e o fallback usado pelo React Router. |
| Tela carrega sem dados | Verifique `REACT_APP_SUPABASE_URL`, a chave publicável e as políticas RLS. | Corrija a configuração pública do build e valide o Supabase; nunca exponha uma chave privilegiada. |
| Site ainda mostra a versão anterior | Confira a conclusão do workflow e aguarde a propagação do CDN. | Faça uma recarga forçada e valide o hash do bundle em `static/js/`. |

## Política para alterações futuras

Toda nova funcionalidade deve ser desenvolvida em uma branch ou no clone local, validada com `npm run build` e enviada para `main` somente quando estiver pronta. A cada mudança, a documentação deste arquivo deve ser atualizada se houver alteração em rotas, variáveis, workflow, Supabase, PWA ou procedimento de rollback.

Antes de enviar alterações:

```bash
npm install --legacy-peer-deps
npm run build
git diff --check
git status --short
```

Não devem ser commitados `.env`, `.env.local`, `.env.production` ou quaisquer arquivos com tokens. O `.gitignore` do repositório bloqueia esses nomes. O workflow deve continuar publicando somente a pasta `build/`.

## Rollback

O rollback é feito revertendo o commit que introduziu a versão problemática e enviando o novo commit para `main`:

```bash
git log --oneline -10
git revert <COMMIT_PROBLEMATICO>
git push origin main
```

O workflow publicará automaticamente o estado revertido. Para uma correção urgente, também é possível executar manualmente o workflow depois que o commit de rollback estiver no GitHub.

## Histórico desta configuração

A configuração foi preparada para o repositório `georgeteste4/PROJETO_ONLINE_CRESCER`, branch `main`, com deploy por Actions, build CRA e URL de projeto. O commit que introduziu o workflow e esta documentação deve ser mantido no histórico para facilitar auditoria e manutenção.

## Referências

[1]: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages "GitHub Docs — Using custom workflows with GitHub Pages"
[2]: https://github.com/actions/deploy-pages "GitHub Action — deploy-pages"
[3]: https://github.com/actions/configure-pages "GitHub Action — configure-pages"
[4]: https://create-react-app.dev/docs/deployment/ "Create React App — Deployment"
