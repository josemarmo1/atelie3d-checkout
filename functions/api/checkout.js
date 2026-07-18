const INFINITEPAY_LINKS_URL = "https://api.infinitepay.io/invoices/public/checkout/links";

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
    const { handle, order_nsu, redirect_url, items } = body || {};

    if (typeof handle !== "string" || !handle.trim()) {
      return json({ error: "InfiniteTag não informada." }, 400);
    }
    if (typeof order_nsu !== "string" || !order_nsu.trim()) {
      return json({ error: "Identificador do pedido não informado." }, 400);
    }
    if (typeof redirect_url !== "string" || !/^https?:\/\//i.test(redirect_url)) {
      return json({ error: "URL de retorno inválida." }, 400);
    }
    if (!Array.isArray(items) || items.length < 1) {
      return json({ error: "Pedido sem itens." }, 400);
    }

    const itensValidos = items.every((item) =>
      Number.isInteger(item.quantity) && item.quantity > 0 &&
      Number.isInteger(item.price) && item.price > 0 &&
      typeof item.description === "string" && item.description.trim()
    );

    if (!itensValidos) {
      return json({ error: "Os itens do pedido são inválidos." }, 400);
    }

    const resposta = await fetch(INFINITEPAY_LINKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: handle.trim().replace(/^\$/, ""),
        order_nsu: order_nsu.trim(),
        redirect_url,
        items,
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
        error: dados.message || dados.error || `A InfinitePay recusou a solicitação (${resposta.status}).`,
      }, resposta.status);
    }

    if (!dados.url) {
      return json({ error: "A InfinitePay não retornou o link de pagamento." }, 502);
    }

    return json({ url: dados.url });
  } catch (erro) {
    console.error("Erro ao criar checkout:", erro);
    return json({ error: "Não foi possível criar o pagamento agora." }, 500);
  }
}

export function onRequest() {
  return json({ error: "Método não permitido." }, 405);
}
