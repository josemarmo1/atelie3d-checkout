/**
 * checkout.js
 * Integração com o Checkout Integrado da InfinitePay (API oficial).
 *
 * Fluxo:
 *  1. POST pra InfinitePay com os itens do pedido -> recebe um link único.
 *  2. Redireciona o cliente pra esse link (Pix ou cartão, aprovação na hora).
 *  3. Depois de pagar, a InfinitePay redireciona de volta pra `redirect_url`
 *     acrescentando: receipt_url, order_nsu, slug, capture_method,
 *     transaction_nsu — a obrigado.html já sabe ler isso.
 *
 * Endpoint oficial (visto direto na documentação dentro do app InfinitePay):
 *   POST https://api.infinitepay.io/invoices/public/checkout/links
 *
 * Corpo da requisição:
 *   { handle, items: [{quantity, price, description}], order_nsu, redirect_url }
 *
 * Resposta:
 *   { "url": "https://checkout.infinitepay.com.br/sua_tag?lenc=codigo_unico" }
 */
const Checkout = (() => {

  const ENDPOINT_LINKS = "https://api.infinitepay.io/invoices/public/checkout/links";

  function gerarOrderNsu(codigoTorre) {
    return `${codigoTorre}-${Date.now()}`;
  }

  function montarRedirectUrl(quantidade, totalValor) {
    const params = new URLSearchParams();
    params.set("qtd", quantidade);
    params.set("total", totalValor.toFixed(2));
    const separador = CONFIG.redirectUrl.includes("?") ? "&" : "?";
    return `${CONFIG.redirectUrl}${separador}${params.toString()}`;
  }

  /**
   * Pede pra InfinitePay gerar o link de pagamento deste pedido.
   * @param {Object} torre - objeto da torre atual (precisa de `handle`)
   * @param {Object} produto - { nome, preco }
   * @param {number} quantidade
   * @returns {Promise<string>} URL do checkout pronta pra redirecionar
   */
  async function gerarLinkPagamento(torre, produto, quantidade) {
    if (!torre || !torre.handle) {
      throw new Error("Torre sem 'handle' da InfinitePay configurado.");
    }
    if (!quantidade || quantidade < 1) {
      throw new Error("Quantidade inválida.");
    }

    const totalValor = produto.preco * quantidade;

    const corpo = {
      handle: torre.handle,
      order_nsu: gerarOrderNsu(torre.codigo),
      redirect_url: montarRedirectUrl(quantidade, totalValor),
      items: [
        {
          quantity: quantidade,
          price: Math.round(produto.preco * 100), // reais -> centavos
          description: produto.nome,
        },
      ],
    };

    const resposta = await fetch(ENDPOINT_LINKS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

    if (!resposta.ok) {
      throw new Error(`InfinitePay recusou a requisição (status ${resposta.status}).`);
    }

    const dados = await resposta.json();
    if (!dados || !dados.url) {
      throw new Error("Resposta da InfinitePay veio sem o link de pagamento.");
    }

    return dados.url;
  }

  /** Gera o link e redireciona o navegador pro checkout da InfinitePay */
  async function irParaPagamento(torre, produto, quantidade) {
    const url = await gerarLinkPagamento(torre, produto, quantidade);
    window.location.href = url;
  }

  return { gerarLinkPagamento, irParaPagamento, gerarOrderNsu };
})();
