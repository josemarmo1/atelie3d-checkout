/**
 * checkout.js
 * Integração com o Checkout Integrado da InfinitePay.
 */
const Checkout = (() => {
  "use strict";

  const ENDPOINT_LINKS = "https://api.infinitepay.io/invoices/public/checkout/links";
  const TIMEOUT_MS = 15000;

  function gerarOrderNsu(codigoTorre) {
    return `${codigoTorre}-${Date.now()}`;
  }

  function montarRedirectUrl({ quantidade, totalValor, handle }) {
    const url = new URL(CONFIG.redirectUrl, window.location.href);
    url.searchParams.set("qtd", String(quantidade));
    url.searchParams.set("total", totalValor.toFixed(2));
    url.searchParams.set("handle", handle);
    return url.toString();
  }

  async function fetchComTimeout(url, opcoes, tempoLimite = TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), tempoLimite);

    try {
      return await fetch(url, {
        ...opcoes,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function lerResposta(resposta) {
    const texto = await resposta.text();
    if (!texto) return {};

    try {
      return JSON.parse(texto);
    } catch (_) {
      return { mensagem: texto };
    }
  }

  /**
   * Gera um link de pagamento da InfinitePay.
   * @param {Object} torre objeto contendo codigo e handle
   * @param {Object} produto objeto contendo nome e preco em reais
   * @param {number} quantidade quantidade do produto
   * @returns {Promise<string>} URL do checkout
   */
  async function gerarLinkPagamento(torre, produto, quantidade) {
    if (!torre || typeof torre.handle !== "string" || !torre.handle.trim()) {
      throw new Error("InfiniteTag não configurada para este ponto de venda.");
    }

    if (!produto || typeof produto.preco !== "number" || produto.preco <= 0) {
      throw new Error("Produto ou preço inválido.");
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new Error("Quantidade inválida.");
    }

    const handle = torre.handle.trim().replace(/^\$/, "");
    const totalValor = produto.preco * quantidade;
    const orderNsu = gerarOrderNsu(torre.codigo || "PEDIDO");

    const corpo = {
      handle,
      order_nsu: orderNsu,
      redirect_url: montarRedirectUrl({ quantidade, totalValor, handle }),
      items: [
        {
          quantity: quantidade,
          price: Math.round(produto.preco * 100),
          description: produto.nome,
        },
      ],
    };

    let resposta;
    try {
      resposta = await fetchComTimeout(ENDPOINT_LINKS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(corpo),
      });
    } catch (erro) {
      if (erro.name === "AbortError") {
        throw new Error("A InfinitePay demorou para responder. Tente novamente.");
      }
      throw new Error("Não foi possível conectar à InfinitePay. Verifique sua internet.");
    }

    const dados = await lerResposta(resposta);

    if (!resposta.ok) {
      const detalhe = dados.message || dados.error || dados.mensagem;
      throw new Error(
        detalhe || `InfinitePay recusou a solicitação (status ${resposta.status}).`
      );
    }

    if (!dados || typeof dados.url !== "string" || !dados.url.startsWith("https://")) {
      throw new Error("A InfinitePay não retornou um link de pagamento válido.");
    }

    return dados.url;
  }

  async function irParaPagamento(torre, produto, quantidade) {
    const url = await gerarLinkPagamento(torre, produto, quantidade);
    window.location.assign(url);
  }

  return { gerarLinkPagamento, irParaPagamento, gerarOrderNsu };
})();
