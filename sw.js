/**
 * sw.js — Service Worker mínimo.
 * Faz cache do "casco" do app (HTML/CSS/JS) para abrir rápido e funcionar
 * offline para navegação básica. Os dados (produtos/torres) sempre buscam
 * a rede primeiro, pra loja nunca mostrar preço/estoque desatualizado.
 */
const CACHE_NOME = "atelie3d-v1";
const ARQUIVOS_CASCO = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./js/ui.js",
  "./js/checkout.js",
  "./js/app.js",
  "./manifest.json",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_CASCO))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves.filter((chave) => chave !== CACHE_NOME).map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);
  const ehDado = url.pathname.includes("/data/");

  if (ehDado) {
    // Dados: sempre tenta a rede primeiro (preço/estoque atualizados)
    evento.respondWith(
      fetch(evento.request).catch(() => caches.match(evento.request))
    );
    return;
  }

  // Casco do app: cache primeiro, com atualização em segundo plano
  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      const buscaRede = fetch(evento.request)
        .then((respostaRede) => {
          caches.open(CACHE_NOME).then((cache) => cache.put(evento.request, respostaRede.clone()));
          return respostaRede;
        })
        .catch(() => respostaCache);
      return respostaCache || buscaRede;
    })
  );
});
