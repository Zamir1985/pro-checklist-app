const CACHE_NAME = "pro-trend-cache-v3"; // Session Comparison V2.1
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./pro_icon.png",
  "./manifest.json"
];

// INSTALL — faylları cache-ə əlavə et
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATE — köhnə cache-ləri sil
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH — offline support (cache-first + network fallback, sonra index.html fallback)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).catch(() => caches.match("./index.html"))
    )
  );
});

// MESSAGE — main səhifədən "SKIP_WAITING" gələndə dərhal yeni versiyaya keç
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
