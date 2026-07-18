const INFINITEPAY_LINKS_URL = "https://api.infinitepay.io/invoices/public/checkout/links";
const INFINITEPAY_CHECK_URL = "https://api.infinitepay.io/invoices/public/checkout/payment_check";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizeHandle(handle) {
  return String(handle || "").trim().replace(/^\$/, "");
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function readUpstreamResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function createCheckout(request) {
  const body = await readJson(request);
  const { handle, order_nsu, redirect_url, items } = body || {};

  if (!normalizeHandle(handle)) {
    return json({ error: "InfiniteTag não informada." }, 400);
  }
  if (typeof order_nsu !== "string" || !order_nsu.trim()) {
    return json({ error: "Identificador do pedido não informado." }, 400);
  }
  if (typeof redirect_url !== "string" || !/^https:\/\//i.test(redirect_url)) {
    return json({ error: "URL de retorno inválida." }, 400);
  }
  if (!Array.isArray(items) || items.length < 1) {
    return json({ error: "Pedido sem itens." }, 400);
  }

  const validItems = items.every((item) =>
    Number.isInteger(item.quantity) && item.quantity > 0 &&
    Number.isInteger(item.price) && item.price > 0 &&
    typeof item.description === "string" && item.description.trim()
  );

  if (!validItems) {
    return json({ error: "Os itens do pedido são inválidos." }, 400);
  }

  const upstream = await fetch(INFINITEPAY_LINKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: normalizeHandle(handle),
      order_nsu: order_nsu.trim(),
      redirect_url,
      items,
    }),
  });

  const data = await readUpstreamResponse(upstream);
  if (!upstream.ok) {
    return json({
      error: data.message || data.error || `A InfinitePay recusou a solicitação (${upstream.status}).`,
    }, upstream.status);
  }
  if (!data.url) {
    return json({ error: "A InfinitePay não retornou o link de pagamento." }, 502);
  }

  return json({ url: data.url });
}

async function checkPayment(request) {
  const body = await readJson(request);
  const { handle, order_nsu, transaction_nsu, slug } = body || {};

  if (![normalizeHandle(handle), order_nsu, transaction_nsu, slug].every(
    (value) => typeof value === "string" && value.trim()
  )) {
    return json({ error: "Dados insuficientes para confirmar o pagamento." }, 400);
  }

  const upstream = await fetch(INFINITEPAY_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: normalizeHandle(handle),
      order_nsu: order_nsu.trim(),
      transaction_nsu: transaction_nsu.trim(),
      slug: slug.trim(),
    }),
  });

  const data = await readUpstreamResponse(upstream);
  if (!upstream.ok) {
    return json({
      error: data.message || data.error || `Não foi possível confirmar o pagamento (${upstream.status}).`,
    }, upstream.status);
  }

  return json(data);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/api/checkout") {
        if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
        return await createCheckout(request);
      }

      if (url.pathname === "/api/payment-check") {
        if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
        return await checkPayment(request);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Erro no Worker:", error);
      return json({ error: "O serviço está temporariamente indisponível." }, 500);
    }
  },
};
