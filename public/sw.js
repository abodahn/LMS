/**
 * T&C AI Academy service worker.
 *
 * Scope is deliberately narrow. This app is almost entirely personal data behind
 * a session, and a shared factory phone is a real deployment, so the rule is:
 *
 *   cache what is the same for everybody, never cache what is not.
 *
 * That means the build's static assets and a small offline page are cached, and
 * pages, API responses and RSC payloads are not. A learner who loses signal gets
 * an honest offline screen rather than somebody else's dashboard — which is what
 * a naive "cache every navigation" worker would eventually hand them.
 *
 * Work done offline is not lost: it is queued in IndexedDB by the page itself
 * (see src/lib/offline-queue.ts) and replayed when the connection returns.
 */

const VERSION = "v1";
const SHELL = `tcai-shell-${VERSION}`;
const ASSETS = `tcai-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

/** Everything needed to render the offline screen with no network at all. */
const PRECACHE = [OFFLINE_URL, "/brand/logo-mark.svg", "/brand/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      // A missing precache entry must not wedge the install; the worker is
      // still worth having for everything else.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL && key !== ASSETS).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Sign-out asks for everything to go.
 *
 * Without this, the next person to use the phone inherits the previous one's
 * cached assets — harmless in themselves, but the same message is the hook for
 * clearing anything user-shaped that gets cached later.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "clear-caches") return;
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/brand/") ||
  /\.(?:css|js|woff2?|png|jpe?g|svg|webp|ico)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch these: uploads, SCORM packages, exports and API responses are
  // either personal, large, or both.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  // Static assets are content-hashed by the build, so a cache hit can never be
  // stale: a changed file has a changed URL.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Pages: always from the network, because they are personal. When the network
  // is not there, the offline screen — never a stale page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (hit) =>
            hit ??
            new Response("<h1>Offline</h1>", {
              status: 503,
              headers: { "content-type": "text/html; charset=utf-8" },
            }),
        ),
      ),
    );
  }
});
