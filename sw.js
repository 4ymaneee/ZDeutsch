const STATIC_CACHE = "zdeutsch-static-v8";
const RUNTIME_CACHE = "zdeutsch-runtime-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./lesen.html",
  "./horen.html",
  "./shreiben.html",
  "./theme.css",
  "./horen.css",
  "./shared.js",
  "./main.js",
  "./lesen.js",
  "./horen.js",
  "./shreiben.js",
  "./manifest.webmanifest",
  "./logo.svg",
  "./pwa/icon-192.png",
  "./pwa/icon-512.png",
  "./pwa/apple-touch-icon.png",
  "./database/config.json",
  "./database/parts.json",
  "./database/shreiben.json",
  "./database/horen-codes.json"
];
const NETWORK_FIRST_ASSET_PATTERN = /\.(?:css|html|js|webmanifest)$/i;

function cacheResponse(cacheName, request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) {
    return response;
  }
  const responseClone = response.clone();
  caches.open(cacheName).then((cache) => cache.put(request, responseClone));
  return response;
}

function shouldUseNetworkFirst(request, url) {
  if (request.mode === "navigate") {
    return true;
  }
  return NETWORK_FIRST_ASSET_PATTERN.test(url.pathname || "");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (shouldUseNetworkFirst(request, url)) {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(RUNTIME_CACHE, request, response))
        .catch(async () => {
          return caches.match(request, { ignoreSearch: true }) || caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => cacheResponse(RUNTIME_CACHE, request, response))
        .catch(() => caches.match(request, { ignoreSearch: true }).then((cachedResponse) => cachedResponse || caches.match("./index.html")));
    })
  );
});
