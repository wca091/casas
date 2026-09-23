# Painel Multilogin

Três peças independentes:

```
web/        → site estático (GitHub Pages, Cloudflare Pages, etc.)
worker/     → Cloudflare Worker (ponte com o Google Sheets)
extension/  → extensão de navegador (preenche o login no site de destino)
```

## 1. Planilha do Google Sheets

Crie as abas:

**Config** (uma linha por card do painel)
| id | nome        | cor     | aba          | link                              |
|----|-------------|---------|--------------|------------------------------------|
| 1  | Plataforma 1| #3b82f6 | Plataforma1  | https://seu-usuario.github.io/site |

**Plataforma1**, **Plataforma2**, ... (mesmas colunas que você já usa)
| nome aluno | id da plataforma | senha |

Compartilhe a planilha como **"Qualquer pessoa com o link pode ver"** (necessário para o Worker ler via CSV público sem precisar de credenciais). Se as senhas forem reais (não fictícias), veja a nota de segurança no fim.

## 2. Worker (Cloudflare)

1. `npx wrangler init multilogin-worker` (ou crie pelo dashboard da Cloudflare)
2. Substitua o `worker.js` gerado pelo `worker/worker.js` deste projeto
3. Edite `SHEET_ID` no topo do arquivo com o ID da sua planilha (está na URL dela)
4. `npx wrangler deploy`
5. Anote a URL gerada (algo como `https://multilogin-worker.SEU-USUARIO.workers.dev`)

## 3. Site (web/)

1. Abra `web/app.js` e cole a URL do Worker em `WORKER_URL`
2. Suba a pasta `web/` para um repositório Git e ative o GitHub Pages (ou Cloudflare Pages)

## 4. Extensão

1. Abra `chrome://extensions`, ative o "Modo do desenvolvedor"
2. "Carregar sem compactação" → selecione a pasta `extension/`
3. Copie o **ID da extensão** que aparece no card
4. Cole esse ID em `EXTENSION_ID` dentro de `web/app.js`
5. Em `extension/manifest.json`, no campo `externally_connectable.matches`, troque `SEU-USUARIO.github.io` pelo domínio real onde o site vai ficar
6. Recarregue a extensão e republique o site

Depois disso, ao clicar em "Acessar", o painel manda `{id, senha, link}` para a extensão, que abre o link (se houver) e preenche o campo de senha + o campo de texto/telefone logo acima dele.

## Nota de segurança

Esse fluxo (planilha pública + Worker sem autenticação) é adequado para dados fictícios de treinamento, como no seu exemplo. Se um dia usar credenciais reais:
- Restrinja o compartilhamento da planilha e troque a leitura via CSV público por uma **Google Service Account** com a API do Sheets (o Worker guarda a chave como secret, nunca no código)
- Coloque uma senha de acesso na frente do painel (ex: Cloudflare Access) para que só quem deveria ver as contas consiga abrir o site
- Restrinja `ALLOWED_ORIGIN` no Worker e `externally_connectable` na extensão ao domínio exato do painel, em vez de `*`
