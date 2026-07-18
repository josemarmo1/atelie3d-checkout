# Publicar no Cloudflare Workers

Este pacote mantém o visual da loja e altera apenas a camada do checkout.

## Pelo terminal

Abra o terminal dentro desta pasta e execute:

```bash
npm install
npx wrangler login
npm run deploy
```

No primeiro login, o navegador abrirá para autorizar a Cloudflare.
Depois do deploy, o terminal mostrará uma URL `workers.dev`.

Acesse assim:

```text
https://SEU-ENDERECO.workers.dev/?torre=R01
```

Use essa URL no QR Code.

## Arquivos importantes

- `public/`: site original, sem alteração estética.
- `worker.js`: cria o checkout e consulta o pagamento na InfinitePay.
- `wrangler.jsonc`: configura o Worker e os arquivos estáticos.

## InfiniteTag

Confira em `public/data/torres.json` se o campo `handle` está sem `$`.
