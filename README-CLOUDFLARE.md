# Publicação na Cloudflare Pages

Este projeto usa Cloudflare Pages Functions para intermediar as chamadas à InfinitePay e evitar o bloqueio de CORS do navegador.

## Estrutura adicionada

- `functions/api/checkout.js`: cria o link de pagamento.
- `functions/api/payment-check.js`: confirma o pagamento.
- `wrangler.jsonc`: configuração para publicação.

## Publicar conectando o GitHub

1. Crie uma conta ou entre na Cloudflare.
2. Acesse **Workers & Pages**.
3. Clique em **Create application** e depois **Pages**.
4. Selecione **Connect to Git** e escolha o repositório `atelie3d-checkout`.
5. Em Framework preset, escolha **None**.
6. Deixe o comando de build vazio.
7. Em Build output directory, use `/` ou deixe vazio, conforme a tela permitir.
8. Clique em **Save and Deploy**.

Use a URL gerada pela Cloudflare, por exemplo:

`https://atelie3d-checkout.pages.dev/?torre=R01`

Não use a URL antiga do GitHub Pages para testar o checkout.

## Publicar pelo terminal, sem conectar o GitHub

É necessário Node.js instalado.

```bash
npm install -g wrangler
wrangler login
cd atelie3d-checkout
wrangler pages deploy . --project-name atelie3d-checkout
```

A publicação pelo painel usando somente arrastar e soltar não executa Pages Functions. Para este projeto, conecte o GitHub ou use o Wrangler.
