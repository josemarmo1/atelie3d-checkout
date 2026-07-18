const INFINITEPAY_CHECK_URL = "https://api.infinitepay.io/invoices/public/checkout/payment_check";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json().catch(() => null);
    const { handle, order_nsu, transaction_nsu, slug } = body || {};

    if (![handle, order_nsu, transaction_nsu, slug].every(
      (valor) => typeof valor === "string" && valor.trim()
    )) {
      return json({ error: "Dados insuficientes para confirmar o pagamento." }, 400);
    }

    const resposta = await fetch(INFINITEPAY_CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: handle.trim().replace(/^\$/, ""),
        order_nsu: order_nsu.trim(),
        transaction_nsu: transaction_nsu.trim(),
        slug: slug.trim(),
      }),
    });

    const texto = await resposta.text();
    let dados = {};
    try {
      dados = texto ? JSON.parse(texto) : {};
    } catch {
      dados = { message: texto };
    }

    if (!resposta.ok) {
      return json({
        error: dados.message || dados.error || `Não foi possível confirmar o pagamento (${resposta.status}).`,
      }, resposta.status);
    }

    return json(dados);
  } catch (erro) {
    console.error("Erro no payment_check:", erro);
    return json({ error: "Não foi possível confirmar o pagamento agora." }, 500);
  }
}

export function onRequest() {
  return json({ error: "Método não permitido." }, 405);
}
