// Smart Mine Pro – Service Worker
// Plain Workbox-compatible SW (no Serwist build plugin needed)
// Handles: app-shell caching, API response caching, offline fallback

const CACHE_NAME = "smart-mine-v1";
const OFFLINE_URL = "/login";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/login",
  "/manifest.json",
];

// Install: pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes: network-first with fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache safe API reads
          if (res.ok && !url.pathname.includes("backup")) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (_next/static): cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
      )
    );
    return;
  }

  // Navigation requests: network-first, fallback to login (offline shell)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || Response.error())
      )
    );
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((res) => {
        if (res.ok) {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
        }
        return res;
      });
      return cached || networkFetch;
    })
  );
});
