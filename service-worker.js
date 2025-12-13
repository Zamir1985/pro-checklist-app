/* =========================
FILE: service-worker.js
iOS 26 / GitHub Pages optimized
- HTML: network-first (fresh UI), fallback cache
- Assets: stale-while-revalidate
- Clean update lifecycle + skipWaiting
========================= */

const CACHE_NAME = "pro-trend-cache-v6";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./pro_icon.png"
];

// Install: cache core
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined)))
    )
  );
  self.clients.claim();
});

function isHTMLRequest(req) {
  return req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // HTML: network-first (fresh UI), fallback to cache
  if (isHTMLRequest(req)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        // cache a copy of latest index.html when possible
        const cache = await caches.open(CACHE_NAME);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match("./index.html");
        return cached || new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })());
    return;
  }

  // Assets: stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    const fetchPromise = fetch(req).then((res) => {
      // cache only successful, basic responses
      if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    // return cached immediately if present, else wait network
    return cached || (await fetchPromise) || new Response("", { status: 504 });
  })());
});

// Skip waiting on demand
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
