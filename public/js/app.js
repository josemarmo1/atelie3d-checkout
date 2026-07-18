/**
 * app.js
 * Ponto de entrada. Descobre a torre pela URL, carrega o produto único,
 * controla a quantidade escolhida e liga tudo à interface.
 */
(function () {
  "use strict";

  let produto = null;
  let torreAtual = null;
  let quantidade = 0;

  const els = {
    produtoUnico: document.getElementById("produtoUnico"),
    nomeTorre: document.getElementById("nomeTorre"),
    nomeLoja: document.getElementById("nomeLoja"),
    subtituloLoja: document.getElementById("subtituloLoja"),
    linkWhatsapp: document.getElementById("linkWhatsapp"),

    cartBar: document.getElementById("cartBar"),
    cartQtdBadge: document.getElementById("cartQtdBadge"),
    cartLabel: document.getElementById("cartLabel"),
    cartTotal: document.getElementById("cartTotal"),
    btnFinalizarCompra: document.getElementById("btnFinalizarCompra"),

    overlayConfirmacao: document.getElementById("overlayConfirmacao"),
    btnFecharConfirmacao: document.getElementById("btnFecharConfirmacao"),
    resumoConfirmacao: document.getElementById("resumoConfirmacao"),
    totalConfirmacao: document.getElementById("totalConfirmacao"),
    btnIrParaPagamento: document.getElementById("btnIrParaPagamento"),
    btnVoltarResumo: document.getElementById("btnVoltarResumo"),

    toast: document.getElementById("toast"),
  };

  /* ---------------------------------------------------------
     Descobrir a torre pela URL (?torre=R01)
  --------------------------------------------------------- */
  function obterCodigoTorreDaUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("torre") || CONFIG.torrePadrao;
  }

  /* ---------------------------------------------------------
     Quantidade: persistida em localStorage (por torre), pra não
     perder se o cliente sair e voltar antes de pagar
  --------------------------------------------------------- */
  function carregarQuantidade() {
    try {
      const bruto = localStorage.getItem(CONFIG.chaveCarrinho(torreAtual.codigo));
      quantidade = bruto ? Math.max(0, parseInt(bruto, 10) || 0) : 0;
    } catch (e) {
      quantidade = 0;
    }
  }

  function salvarQuantidade() {
    try {
      localStorage.setItem(CONFIG.chaveCarrinho(torreAtual.codigo), String(quantidade));
    } catch (e) {
      // localStorage indisponível (modo privado etc.) — segue só em memória
    }
  }

  /* ---------------------------------------------------------
     Ações de quantidade
  --------------------------------------------------------- */
  function adicionar() {
    quantidade += 1;
    salvarQuantidade();
    render();
  }

  function remover() {
    if (quantidade <= 0) return;
    quantidade -= 1;
    salvarQuantidade();
    render();
  }

  /* ---------------------------------------------------------
     Renderização
  --------------------------------------------------------- */
  function render() {
    UI.renderProdutoUnico(els.produtoUnico, produto, quantidade, {
      onAdicionar: adicionar,
      onRemover: remover,
    });
    UI.atualizarCartBar(els, produto, quantidade);
  }

  /* ---------------------------------------------------------
     Modal de confirmação
  --------------------------------------------------------- */
  function abrirConfirmacao() {
    if (quantidade < 1) return;
    UI.renderResumoConfirmacao(els.resumoConfirmacao, produto, quantidade);
    const totalValor = produto.preco * quantidade;
    els.totalConfirmacao.textContent = UI.formatarPreco(totalValor);
    UI.abrirModal(els.overlayConfirmacao);
  }

  /* ---------------------------------------------------------
     Carregamento inicial (torres + produto)
  --------------------------------------------------------- */
  async function carregarDados() {
    const [respTorres, respProduto] = await Promise.all([
      fetch(CONFIG.torresJson),
      fetch(CONFIG.produtosJson),
    ]);

    if (!respTorres.ok || !respProduto.ok) {
      throw new Error("Falha ao carregar dados da loja.");
    }

    const torres = await respTorres.json();
    produto = await respProduto.json();

    const codigoTorre = obterCodigoTorreDaUrl();
    torreAtual = torres.find((t) => t.codigo === codigoTorre) || torres[0];

    if (!torreAtual) {
      throw new Error("Nenhuma torre cadastrada em torres.json.");
    }
  }

  function preencherCabecalho() {
    els.nomeLoja.textContent = CONFIG.nomeLoja;
    els.subtituloLoja.textContent = CONFIG.subtitulo;
    els.nomeTorre.textContent = torreAtual.nome;
    els.linkWhatsapp.href = `https://wa.me/${CONFIG.whatsapp}`;
  }

  /* ---------------------------------------------------------
     Eventos fixos da interface
  --------------------------------------------------------- */
  function ligarEventos() {
    els.btnFinalizarCompra.addEventListener("click", abrirConfirmacao);

    els.btnFecharConfirmacao.addEventListener("click", () => UI.fecharModal(els.overlayConfirmacao));
    els.btnVoltarResumo.addEventListener("click", () => UI.fecharModal(els.overlayConfirmacao));
    els.overlayConfirmacao.addEventListener("click", (e) => {
      if (e.target === els.overlayConfirmacao) UI.fecharModal(els.overlayConfirmacao);
    });

    els.btnIrParaPagamento.addEventListener("click", async () => {
      els.btnIrParaPagamento.disabled = true;
      els.btnIrParaPagamento.textContent = "Gerando pagamento…";
      try {
        await Checkout.irParaPagamento(torreAtual, produto, quantidade);
        // Se chegou aqui sem redirecionar, algo impediu a navegação —
        // mantemos o botão travado porque o redirect já deveria ter ocorrido.
      } catch (erro) {
        UI.mostrarToast(els.toast, erro.message || "Não foi possível abrir o pagamento. Tente novamente.");
        els.btnIrParaPagamento.disabled = false;
        els.btnIrParaPagamento.textContent = "Ir para pagamento";
        console.error(erro);
      }
    });
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  async function iniciar() {
    try {
      await carregarDados();
      preencherCabecalho();
      carregarQuantidade();
      ligarEventos();
      render();
    } catch (erro) {
      console.error(erro);
      els.produtoUnico.innerHTML = `<div class="estado-mensagem">
        Não foi possível carregar a loja agora. Verifique sua conexão e recarregue a página.
      </div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);

  // Registra o Service Worker (PWA) — se o navegador suportar
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // Sem problema se falhar (ex.: rodando em file:// durante testes)
      });
    });
  }
})();
