const CACHE_VERSION = "msm-industrial-pwa-v1";

function deveIgnorarCache(request) {
  if (request.method !== "GET") {
    return true;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return true;
  }

  const caminhosSemCache = [
    "/api/",
    "/admin/",
    "/media/",
  ];

  const caminho = url.pathname.toLowerCase();

  if (caminhosSemCache.some((item) => caminho.startsWith(item))) {
    return true;
  }

  if (
    caminho.includes("/pdf/") ||
    caminho.includes("excel") ||
    caminho.includes("xlsx") ||
    caminho.includes("xls")
  ) {
    return true;
  }

  return false;
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomesCaches) =>
        Promise.all(
          nomesCaches
            .filter((nomeCache) => nomeCache !== CACHE_VERSION)
            .map((nomeCache) => caches.delete(nomeCache)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (deveIgnorarCache(request)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const respostaEmCache = await caches.match(request);

      if (respostaEmCache) {
        return respostaEmCache;
      }

      return new Response("Sem conexão com a internet.", {
        status: 503,
        statusText: "Offline",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }),
  );
});