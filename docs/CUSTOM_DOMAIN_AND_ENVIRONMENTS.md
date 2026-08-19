# Domínio personalizado e ambientes do Crescer+

**Projeto:** Crescer+
**Repositório:** [`georgeteste4/PROJETO_ONLINE_CRESCER`](https://github.com/georgeteste4/PROJETO_ONLINE_CRESCER)
**Domínio de produção atual:** [`https://app.crescebem.online`](https://app.crescebem.online)
**Projeto Supabase:** `cskhqoyrqhwlwrrfaemw`

Este documento explica como publicar o frontend no domínio personalizado, voltar temporariamente ao domínio padrão do GitHub Pages, executar a aplicação em localhost e configurar outro domínio no futuro. A implementação atual usa assets relativos, detecção automática da base do roteador e uma única configuração pública do Supabase. Portanto, o mesmo build pode funcionar na raiz de um domínio personalizado e no subdiretório padrão de GitHub Project Pages.

## Estado atual

O GitHub Pages está configurado para publicar pela fonte **GitHub Actions**. O domínio personalizado salvo nas configurações do repositório é `app.crescebem.online`. Para um subdomínio, o DNS deve apontar diretamente para `georgeteste4.github.io`, sem acrescentar o nome do repositório, conforme a documentação oficial do GitHub [1].

| Item | Valor atual |
| --- | --- |
| URL principal | `https://app.crescebem.online` |
| URL alternativa do Pages | `https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/` |
| Fonte de publicação | GitHub Actions |
| Workflow | `.github/workflows/deploy-pages.yml` |
| Registro DNS esperado | `CNAME` para o subdomínio `app` |
| Destino DNS | `georgeteste4.github.io` |
| Endpoint Supabase | `https://cskhqoyrqhwlwrrfaemw.supabase.co` |
| Base explícita do projeto | Detectada automaticamente; não é necessária no domínio raiz |

> **Atenção:** se o provedor DNS mostrar um registro `CNAME` com host `crescer`, ele representa normalmente `crescer.crescebem.online`, não `app.crescebem.online`. Para o endereço de produção informado neste documento, o host deve ser `app` — ou `app.crescebem.online`, conforme o formato exigido pelo provedor. O valor deve ser `georgeteste4.github.io`, sem `/PROJETO_ONLINE_CRESCER`.

## Configuração do domínio personalizado

A configuração deve ser feita em duas camadas: primeiro no GitHub Pages e depois no provedor DNS. O GitHub recomenda adicionar o domínio ao Pages antes de configurar o DNS, reduzindo o risco de que um subdomínio seja utilizado por outro site [1]. Alterações de DNS podem levar até 24 horas para propagação [1].

### 1. Salvar o domínio no GitHub Pages

Abra **Settings → Pages** no repositório e selecione **GitHub Actions** como fonte de publicação. Em **Custom domain**, informe exatamente:

```text
app.crescebem.online
```

Clique em **Save**. Quando a publicação é feita por um workflow personalizado de GitHub Actions, o GitHub informa que não é necessário manter um arquivo `CNAME` no repositório; a configuração do domínio é mantida no Pages [1] [2]. Por isso, este projeto não inclui um `public/CNAME` fixo, evitando que o build fique preso a um domínio quando for usado em localhost ou em outro ambiente.

### 2. Criar o registro no provedor DNS

No painel do provedor DNS de `crescebem.online`, crie ou ajuste um registro semelhante a este:

| Tipo | Host/Nome | Valor/Destino | Observação |
| --- | --- | --- | --- |
| `CNAME` | `app` | `georgeteste4.github.io` | Configuração para `app.crescebem.online`. Não incluir o nome do repositório. |

Remova conflitos que usem o mesmo host, como outro `CNAME`, `A`, `AAAA` ou redirecionamento HTTP para `app`. Não utilize um wildcard como `*.crescebem.online`; o GitHub recomenda evitar registros wildcard por risco de takeover [1] [2].

A verificação pode ser feita com:

```bash
dig app.crescebem.online CNAME +short
curl -I https://app.crescebem.online/
```

O primeiro comando deve retornar `georgeteste4.github.io.` ou uma cadeia equivalente gerenciada pelo DNS. Depois da propagação e da emissão do certificado, o segundo deve retornar `200`, `301` ou `302` conforme a política de redirecionamento, mas não deve retornar uma página estacionada, erro de DNS ou certificado inválido.

### 3. Ativar HTTPS

Depois que o DNS estiver correto, aguarde o GitHub disponibilizar a opção **Enforce HTTPS** e habilite-a. A documentação do GitHub informa que a emissão do certificado pode levar algum tempo após a configuração do domínio [1] [2]. Se a opção permanecer indisponível, verifique o DNS, registros CAA e eventuais caches; o GitHub também recomenda remover e adicionar novamente o domínio quando necessário [2].

## Como o frontend escolhe a base da aplicação

O arquivo `src/lib/runtime.js` define a base do aplicativo seguindo esta prioridade:

| Situação | Base calculada | Exemplo de URL final |
| --- | --- | --- |
| Domínio personalizado na raiz | Vazio | `https://app.crescebem.online/login` |
| Outro domínio na raiz | Vazio | `https://staging.exemplo.com/login` |
| GitHub Project Pages | `/PROJETO_ONLINE_CRESCER` | `https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/login` |
| Localhost na raiz | Vazio | `http://localhost:3000/login` |
| Subcaminho definido manualmente | Valor de `REACT_APP_BASE_PATH` | `https://exemplo.com/meu-app/login` |

O `BrowserRouter`, o registro do service worker, os links de convite, os redirects de recuperação de senha, os ícones de notificação e o manifest PWA usam essa mesma lógica. O `package.json` utiliza `homepage: "."`, fazendo o Create React App gerar referências relativas como `./static/js/...` e `./manifest.json`.

## Executar em localhost

### 1. Preparar o ambiente

Na raiz do frontend:

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
```

Edite `.env.local` com a URL e a chave **publicável** do Supabase:

```env
REACT_APP_SUPABASE_URL=https://cskhqoyrqhwlwrrfaemw.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publicavel
```

Não use `service_role`, tokens administrativos, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `MAILTRAP_API_TOKEN` ou `SEND_EMAIL_HOOK_SECRET` no frontend. A chave publicável pode ser entregue ao navegador, mas o banco deve continuar protegido por RLS.

### 2. Iniciar o servidor local

```bash
npm start
```

Acesse:

```text
http://localhost:3000
```

Para testar a build de produção localmente:

```bash
REACT_APP_SUPABASE_URL=https://cskhqoyrqhwlwrrfaemw.supabase.co \
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publicavel \
npm run build
npx serve -s build -l 4173
```

Como o build usa caminhos relativos, ele também pode ser servido em um subdiretório. Para simular o GitHub Project Pages, defina uma base explícita durante a compilação:

```bash
REACT_APP_BASE_PATH=/PROJETO_ONLINE_CRESCER npm run build
```

Em desenvolvimento normal, não defina `REACT_APP_BASE_PATH`; a aplicação deve permanecer na raiz de `localhost:3000`.

## Configuração no Supabase Auth

O domínio usado pelo frontend precisa estar autorizado em **Supabase → Authentication → URL Configuration**. O **Site URL** deve ser o endereço principal de produção:

```text
https://app.crescebem.online
```

Adicione também os redirects necessários:

```text
https://app.crescebem.online/**
https://georgeteste4.github.io/PROJETO_ONLINE_CRESCER/**
http://localhost:3000/**
```

O aplicativo monta dinamicamente os redirects de convite e recuperação de senha. O Supabase exige que a URL usada em `redirectTo` corresponda à lista permitida; o **Site URL** funciona como redirect padrão quando o código não especifica outro endereço [3]. Para produção, prefira URLs exatas; curingas são mais apropriados para desenvolvimento e previews controlados [3].

Após alterar o domínio, teste pelo menos:

| Fluxo | URL esperada |
| --- | --- |
| Login | `https://app.crescebem.online/login` |
| Recuperação de senha | `https://app.crescebem.online/redefinir-senha` |
| Convite | `https://app.crescebem.online/convite/<token>` |
| Termos | `https://app.crescebem.online/termos` |
| Dashboard autenticado | `https://app.crescebem.online/` |

## Lembrete de instalação PWA

O aviso de instalação é exibido somente para usuários autenticados na página **Início**, em dispositivos móveis e quando o navegador ainda não informa que o Crescer+ está instalado. O app usa o evento nativo `beforeinstallprompt` no Android/Chromium e apresenta instruções manuais de **Compartilhar → Adicionar à Tela de Início** no iPhone/iPad.

A periodicidade é controlada pelo administrador em **Administração → Configurações → Instalação do app**. O valor padrão é de **1 dia** e pode ser alterado entre 1 e 365 dias. A configuração é armazenada no Supabase em `app_settings` com a chave `pwa.install_prompt_interval_days`; usuários autenticados podem ler somente essa chave, enquanto a gravação permanece restrita aos papéis administrativos autorizados.

O navegador armazena localmente a data do último aviso em `crescer:pwa-last-prompt-at`. Ao clicar em **Agora não** ou fechar o aviso, o contador começa novamente. Ao instalar, o evento `appinstalled` marca o app como instalado e o aviso deixa de aparecer. Se o usuário limpar os dados do site, o navegador poderá perder esse registro; a detecção `display-mode: standalone` continua sendo usada como proteção principal.

Para alterar o intervalo:

1. Acesse o painel administrativo com um papel autorizado.
2. Abra **Configurações → Instalação do app**.
3. Informe o número de dias desejado e salve.
4. Teste em uma janela móvel que ainda não esteja instalada; em ambiente de desenvolvimento, limpe `localStorage` apenas se precisar repetir o aviso imediatamente.

O frontend consulta a configuração pela rota interna `/pwa/install-config`, que exige sessão Supabase autenticada. Nenhuma chave privada ou tarefa agendada externa é necessária: o lembrete é determinístico, funciona no navegador e reaparece quando o usuário acessa a página Início após o intervalo configurado.

## Usar outro domínio no futuro

Para trocar `app.crescebem.online` por outro subdomínio, por exemplo `staging.crescebem.online`, siga esta ordem:

1. Adicione e verifique o domínio no GitHub Pages em **Settings → Pages → Custom domain**.
2. No DNS, crie `CNAME staging` apontando diretamente para `georgeteste4.github.io`.
3. Aguarde a verificação DNS e habilite HTTPS quando disponível.
4. Adicione o novo domínio aos **Redirect URLs** do Supabase.
5. Teste login, recuperação de senha, convite, PWA e rotas profundas.
6. Somente depois remova o domínio antigo do Pages e do Supabase, caso não precise manter os dois.

Para um domínio raiz, como `crescebem.online`, o DNS não usa CNAME no apex. Use os registros `A`, `AAAA`, `ALIAS` ou `ANAME indicados pelo GitHub e trate o subdomínio separadamente [1].

### Subcaminho diferente

Se a aplicação for publicada em `https://exemplo.com/meu-app/`, defina no ambiente de build:

```bash
REACT_APP_BASE_PATH=/meu-app npm run build
```

A mesma variável deve estar presente no workflow que publica esse ambiente. Não defina `/PROJETO_ONLINE_CRESCER` no build do domínio `app.crescebem.online`, pois o domínio personalizado serve a aplicação na raiz.

## Publicação contínua

Cada push na branch `main` executa automaticamente o workflow:

```bash
git add -A
git commit -m "descreva a alteração"
git push origin main
```

O workflow instala dependências, injeta as variáveis públicas do Supabase, executa o build relativo, publica o artefato no ambiente `github-pages` e mantém o site atualizado. Para acompanhar:

```bash
gh run list --repo georgeteste4/PROJETO_ONLINE_CRESCER --workflow deploy-pages.yml --limit 5
gh run watch <RUN_ID> --repo georgeteste4/PROJETO_ONLINE_CRESCER
```

Se o domínio personalizado estiver em verificação, o deploy do frontend ainda pode terminar com sucesso; a disponibilidade do endereço final depende do DNS e do certificado HTTPS.

## Checklist de diagnóstico

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| `app.crescebem.online` abre página estacionada | DNS aponta para host errado ou cache antigo | Confirmar `CNAME app → georgeteste4.github.io`, remover redirecionamentos e aguardar propagação. |
| GitHub mostra `DNS check unsuccessful` | Registro ainda não propagou ou há conflito | Executar `dig`, revisar host e valor e usar **Check again**. |
| HTTPS indisponível | Certificado ainda não emitido ou DNS incorreto | Corrigir DNS, revisar CAA e aguardar; o GitHub informa que a emissão pode levar até cerca de uma hora em alguns casos [2]. |
| Assets retornam 404 no domínio personalizado | Build usando homepage absoluto antigo | Confirmar `homepage: "."`, build relativo e ausência de `PUBLIC_URL` fixo. |
| Rotas profundas abrem tela vazia | Fallback 404 ou basename incompatível | Confirmar `public/404.html`, `getRuntimeBasePath()` e limpar cache do service worker. |
| Login ou recuperação rejeita redirect | URL ausente no Supabase Auth | Adicionar o domínio e o caminho em **Authentication → URL Configuration** [3]. |
| PWA abre o endereço antigo | Manifest ou cache antigo | Confirmar `start_url: "./"`, incrementar `CACHE_NAME` no service worker e reinstalar o PWA. |
| Domínio `crescer.crescebem.online` funciona, mas `app.crescebem.online` não | Host DNS configurado como `crescer` | Trocar o host para `app` se o endereço desejado for `app.crescebem.online`. |

## Referências

[1]: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site "GitHub Docs — Managing a custom domain for your GitHub Pages site"

[2]: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages "GitHub Docs — Troubleshooting custom domains and GitHub Pages"

[3]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Docs — Redirect URLs"
