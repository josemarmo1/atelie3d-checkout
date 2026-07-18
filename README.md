# Ateliê 3D — Loja de Chaveiro Único

Loja virtual leve (HTML + CSS + JS puro, sem frameworks) para vender o
Chaveiro Ateliê Indaiá 3D via QR Code no ponto de venda. Cliente escolhe
só a quantidade e paga direto por Pix ou cartão. Hospedada de graça no
GitHub Pages.

## Como funciona

1. O QR Code do ponto de venda aponta pra `index.html?torre=R01`.
2. O cliente escolhe a quantidade de chaveiros (preço fixo R$15).
3. Confirma o pedido → é redirecionado pro checkout da InfinitePay.
4. Paga com **Pix ou cartão de crédito (até 12x)** — são as únicas opções
   do Checkout Integrado da InfinitePay, não tem boleto.
5. Depois de pagar, a InfinitePay manda o cliente de volta pro seu site,
   na página `obrigado.html`, que mostra "Compra confirmada! Retire seus
   chaveiros" com a quantidade e o total certos.

Não existe backend. Tudo roda no navegador do cliente.

---

## 1. Passo a passo: integrar sua conta InfinitePay de verdade

Hoje o projeto está com um `handle` fictício (`atelie3dindaiatuba`) só
pra você testar o visual. Pra rodar de verdade:

### 1.1 Habilitar o Checkout Integrado na sua conta
1. Abra o **app InfinitePay** (ou o site, na área logada).
2. Vá em **Vendas → Checkout**.
3. Toque em **Configurações → Habilitar Checkout Integrado**.
4. Em **Link Integrado → Adicionar URL**, cole o endereço do seu GitHub
   Pages, por exemplo:
   ```
   https://josemarmo1.github.io/atelie3d-checkout
   ```
   Isso autoriza esse domínio a gerar links de pagamento pela sua conta —
   sem isso, o checkout recusa a requisição.

### 1.2 Pegar seu handle (InfiniteTag)
- É o nome de usuário que aparece no canto superior do app InfinitePay
  (o mesmo que forma o seu link `$seuhandle`).
- Copie **sem o `$`**.

### 1.3 Colocar o handle no projeto
Abra `data/torres.json` e troque o campo `handle`:
```json
{
  "codigo": "R01",
  "nome": "Edifício Roccaporena",
  "local": "Indaiatuba, SP",
  "handle": "SEU_HANDLE_AQUI",
  "ativa": true
}
```
Pronto — é o único lugar que precisa mudar. O `js/checkout.js` já monta a
URL certa sozinho, com o produto, a quantidade e o valor calculados na
hora.

### 1.4 Como o link é montado (pra você entender o que está rodando)
Em `js/checkout.js`, a função `gerarLinkPagamento` faz uma requisição POST
direto pra API da InfinitePay (é o método oficial atual — documentado
dentro do próprio app, em Checkout Integrado → Documentação):

```
POST https://api.infinitepay.io/invoices/public/checkout/links
Content-Type: application/json

{
  "handle": "SEU_HANDLE_AQUI",
  "order_nsu": "R01-1737091200000",
  "redirect_url": "https://josemarmo1.github.io/atelie3d-checkout/obrigado.html?qtd=3&total=45.00",
  "items": [
    { "quantity": 3, "price": 1500, "description": "Chaveiro Ateliê Indaiá 3D" }
  ]
}
```
A InfinitePay responde com o link pronto:
```json
{ "url": "https://checkout.infinitepay.com.br/seu_handle?lenc=codigo_unico" }
```
E o app redireciona o cliente pra essa URL — é lá que ele escolhe **Pix ou
cartão de crédito (até 12x)** e paga.

- `price` sempre em **centavos** (R$15,00 → `1500`).
- `order_nsu` é um identificador único do pedido (torre + timestamp).
- `redirect_url` já leva `qtd` e `total` (nossos), e a InfinitePay
  acrescenta os dela por cima: `receipt_url` (link do comprovante),
  `capture_method` (`pix` ou `credit_card`), `order_nsu`, `slug`,
  `transaction_nsu`. A `obrigado.html` já lê tudo isso automaticamente e
  mostra a forma de pagamento e o link do comprovante.

### 1.5 Testar de verdade
1. Suba o projeto no GitHub Pages (passo 3 mais abaixo).
2. Acesse `https://SEU-SITE/?torre=R01` pelo celular.
3. Escolha uma quantidade, confirme, e veja se abre o checkout da
   InfinitePay com o valor certo.
4. Pague com um valor baixo pra testar (ou peça pra alguém de confiança
   testar) e confirme se cai em `obrigado.html` corretamente.

### 1.6 (Opcional, avançado) Confirmar pagamento automaticamente
O fluxo atual confia no redirecionamento — funciona bem para o caso de
"retirar no local", como descrito no briefing. Se no futuro você quiser
ter **certeza automática** de que o Pix caiu antes de liberar o produto
(por exemplo, pra um painel interno de pedidos), a InfinitePay oferece:
- `webhook_url`: a InfinitePay avisa seu servidor quando o pagamento é
  aprovado.
- `POST https://api.infinitepay.io/invoices/public/checkout/payment_check`: você consulta
  se um pedido específico foi pago.

Ambos exigem um servidor (mesmo que pequeno) porque envolvem lógica que
não pode ficar exposta no navegador do cliente. Isso é um passo futuro —
não é necessário pro fluxo atual funcionar.

---

## 2. Configurar o resto

### `data/produtos.json`
```json
{
  "nome": "Chaveiro Ateliê Indaiá 3D",
  "descricao": "Impresso em 3D na Ateliê 3D, Indaiatuba/SP",
  "preco": 15,
  "imagem": "assets/images/chaveiro.webp"
}
```
Troque a imagem de exemplo pela foto real em `assets/images/chaveiro.webp`
(formato `.webp` recomendado — arquivo pequeno, carrega rápido no 4G). Se
o arquivo não existir, o site mostra um placeholder automaticamente.

### `js/config.js`
- `whatsapp`: número da loja pro botão de dúvidas no rodapé.
- `subtitulo`: a mensagem de boas-vindas do topo.
- `redirectUrl`: calculado automaticamente pra `obrigado.html` no mesmo
  domínio — confirme depois de publicar no GitHub Pages.

---

## 3. Testar localmente

Não dá pra abrir o `index.html` direto no navegador (`file://`) porque o
carregamento dos `.json` é bloqueado por segurança. Suba um servidor
local simples:
```bash
cd atelie3d-checkout
python3 -m http.server 8000
```
Depois acesse `http://localhost:8000/?torre=R01`.

---

## 4. Publicar no GitHub Pages

1. Crie o repositório `atelie3d-checkout` na sua conta (`josemarmo1`).
2. Envie todos os arquivos deste projeto para a branch `main`.
3. No GitHub: **Settings → Pages → Source → Deploy from a branch → main
   → / (root)**.
4. Em alguns minutos a loja estará em:
   `https://josemarmo1.github.io/atelie3d-checkout/`
5. Volte no passo **1.1** e cole essa URL no Link Integrado da
   InfinitePay.

---

## 5. Gerar o QR Code do ponto de venda

A URL é:
```
https://josemarmo1.github.io/atelie3d-checkout/?torre=R01
```
Gere o QR Code dessa URL exata em qualquer gerador gratuito (QR Code
Monkey, ou "gerador de qr code" no Google).

---

## 6. PWA

O site já tem `manifest.json` e um `sw.js` (Service Worker) básico, então
o cliente pode "Adicionar à tela de início" no celular. Troque os ícones
em `assets/icons/` pelos da sua marca quando quiser (192×192 e 512×512).

---

## Estrutura

```
atelie3d-checkout/
├── assets/
│   ├── images/     → chaveiro.webp + placeholder.svg
│   ├── logo/        → logo.png (logo real da marca)
│   └── icons/       → ícones do PWA
├── css/style.css
├── js/
│   ├── config.js     → nome da loja, mensagem de boas-vindas, WhatsApp
│   ├── ui.js         → renderização (card do produto, modal, toast)
│   ├── checkout.js   → integração InfinitePay
│   └── app.js         → orquestração / estado / eventos
├── data/
│   ├── produtos.json  → o produto único (nome, preço, imagem)
│   └── torres.json    → pontos de venda + handle InfinitePay
├── index.html
├── obrigado.html       → "Compra confirmada! Retire seus chaveiros"
├── manifest.json
├── sw.js
├── favicon.ico
└── README.md
```

## Próximos passos sugeridos
- [ ] Trocar `handle` fictício pelo handle real (seção 1)
- [ ] Trocar `assets/images/chaveiro.webp` pela foto real do chaveiro
- [ ] Publicar no GitHub Pages e cadastrar a URL no Link Integrado
- [ ] Gerar e imprimir o QR Code
- [ ] (Futuro) Webhook pra confirmação automática de pagamento

---

## Publicação atual: Vercel (necessária para o checkout)

A API da InfinitePay bloqueia chamadas diretas do navegador por CORS. Por isso,
este projeto inclui duas funções gratuitas da Vercel em `api/`:

- `api/checkout.js`: cria o link de pagamento;
- `api/payment-check.js`: confirma o pagamento no retorno.

### Publicar

1. Envie estes arquivos para o repositório no GitHub.
2. Entre na Vercel e escolha **Add New → Project**.
3. Importe o repositório `atelie3d-checkout`.
4. Não altere as configurações de build; clique em **Deploy**.
5. Use a URL fornecida pela Vercel no QR Code, com `?torre=R01`.

Exemplo:

```text
https://atelie3d-checkout.vercel.app/?torre=R01
```

O GitHub Pages pode continuar existindo, mas o checkout deve ser acessado pela
URL da Vercel para que as funções em `/api` funcionem.
