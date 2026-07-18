/**
 * ui.js
 * Funções de renderização: card do produto único, barra inferior fixa,
 * modal de confirmação e toast. Não guarda estado — só recebe dados e
 * devolve HTML/eventos.
 */
const UI = (() => {

  function formatarPreco(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* ---------------------------------------------------------
     Card do produto único
  --------------------------------------------------------- */
  function renderProdutoUnico(container, produto, quantidade, handlers) {
    container.innerHTML = `
      <div class="produto-unico__imagem-wrap">
        <img class="produto-unico__imagem" src="${produto.imagem}" alt="${produto.nome}"
             onerror="this.src='assets/images/placeholder.svg'" />
      </div>
      <div class="produto-unico__corpo">
        <div class="produto-unico__nome">${produto.nome}</div>
        <div class="produto-unico__descricao">${produto.descricao || ""}</div>
        <div class="produto-unico__preco">${formatarPreco(produto.preco)} <small>/ unidade</small></div>

        <div class="produto-unico__label-qtd">Quantidade</div>
        <div class="stepper-grande">
          <button class="stepper-grande__btn stepper-grande__btn--menos" aria-label="Diminuir quantidade" ${quantidade === 0 ? "disabled" : ""}>−</button>
          <span class="stepper-grande__qtd">${quantidade}</span>
          <button class="stepper-grande__btn stepper-grande__btn--add" aria-label="Adicionar">+</button>
        </div>

        <div class="produto-unico__subtotal">
          Subtotal: <strong>${formatarPreco(produto.preco * quantidade)}</strong>
        </div>
      </div>
    `;

    container.querySelector(".stepper-grande__btn--add")
      .addEventListener("click", handlers.onAdicionar);
    container.querySelector(".stepper-grande__btn--menos")
      .addEventListener("click", handlers.onRemover);
  }

  /* ---------------------------------------------------------
     Barra inferior fixa
  --------------------------------------------------------- */
  function atualizarCartBar(elementos, produto, quantidade) {
    const totalValor = produto.preco * quantidade;

    elementos.cartBar.classList.toggle("visivel", quantidade > 0);
    elementos.cartQtdBadge.textContent = quantidade;
    elementos.cartLabel.textContent = `${quantidade} chaveiro${quantidade === 1 ? "" : "s"}`;
    elementos.cartTotal.textContent = formatarPreco(totalValor);

    return { totalValor };
  }

  /* ---------------------------------------------------------
     Resumo no modal de confirmação
  --------------------------------------------------------- */
  function renderResumoConfirmacao(container, produto, quantidade) {
    container.innerHTML = `
      <div class="item-carrinho">
        <img class="item-carrinho__imagem" src="${produto.imagem}" alt="${produto.nome}"
             onerror="this.src='assets/images/placeholder.svg'" />
        <div class="item-carrinho__info">
          <div class="item-carrinho__nome">${produto.nome}</div>
          <div class="item-carrinho__preco">${quantidade} × ${formatarPreco(produto.preco)} = ${formatarPreco(produto.preco * quantidade)}</div>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     Modais genéricos
  --------------------------------------------------------- */
  function abrirModal(overlay) {
    overlay.classList.add("aberto");
    document.body.style.overflow = "hidden";
  }

  function fecharModal(overlay) {
    overlay.classList.remove("aberto");
    document.body.style.overflow = "";
  }

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */
  let toastTimeout = null;
  function mostrarToast(elementoToast, mensagem) {
    elementoToast.textContent = mensagem;
    elementoToast.classList.add("visivel");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => elementoToast.classList.remove("visivel"), 2200);
  }

  return {
    formatarPreco,
    renderProdutoUnico,
    atualizarCartBar,
    renderResumoConfirmacao,
    abrirModal,
    fecharModal,
    mostrarToast,
  };
})();
