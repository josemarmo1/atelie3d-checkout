/**
 * config.js
 * Configurações centrais da loja Ateliê 3D.
 * Mude aqui o que for específico do negócio — o resto do app não precisa
 * ser tocado.
 */
const CONFIG = {
  // Nome exibido no topo da loja
  nomeLoja: "Ateliê 3D",
  subtitulo: "Bem-vindo(a)! Escolha seus chaveiros 3D 💜",

  // Caminhos dos arquivos de dados
  produtosJson: "data/produtos.json",
  torresJson: "data/torres.json",

  // Torre usada quando a URL não informa ?torre=XXX (ex.: acesso direto/teste)
  torrePadrao: "R01",

  // Chave usada para salvar o carrinho no localStorage (fica isolado por torre)
  chaveCarrinho: (codigoTorre) => `atelie3d_carrinho_${codigoTorre}`,

  // Link para onde o cliente volta depois de pagar
  // Troque pelo domínio final do GitHub Pages, ex:
  // "https://josemarmo1.github.io/atelie3d-checkout/obrigado.html"
  redirectUrl: window.location.origin + window.location.pathname.replace(/index\.html$/, "") + "obrigado.html",

  // WhatsApp da loja (só números, com DDI+DDD) — usado no rodapé/dúvidas
  whatsapp: "5519999999999",
};
