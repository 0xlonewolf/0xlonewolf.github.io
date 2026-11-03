// Cut Log offline shell. Network first, cache fallback: the shell and the last data.enc.json (ciphertext only)
// open without signal at the gym. Bump VERSION when the precache list changes; old caches are removed on activate.
const VERSION = "cutlog-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-512.png"];
const OPTIONAL = ["data.enc.json"]; // last published data, so a first offline open still has something to unlock

// a cached copy remembers when it was fetched; the app shows "Offline: showing data from HH:MM"
const stamp = async (res) => {
  const h = new Headers(res.headers);
  h.set("x-cutlog-cached-at", new Date().toISOString());
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: h });
};

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // one missing file must not break the install (e.g. no data published yet)
    await Promise.all([...SHELL, ...OPTIONAL].map(async (u) => {
      try { const r = await fetch(u, { cache: "no-store" }); if (r.ok) await c.put(u, await stamp(r)); } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("cutlog-") && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

const scopePath = new URL("./", self.location).pathname;

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  // fonts and anything cross-origin: the browser handles them (they simply fail offline)
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;
  if (url.pathname.endsWith("/sw.js")) return;
  e.respondWith(networkFirst(e, req, url));
});

async function networkFirst(e, req, url) {
  const key = url.origin + url.pathname; // cache-busting query (?t=…) ignored
  try {
    const res = await fetch(req);
    if (res.ok && res.type === "basic") {
      const copy = res.clone();
      e.waitUntil(caches.open(VERSION).then(async (c) => c.put(key, await stamp(copy))).catch(() => {}));
    }
    return res;
  } catch (err) {
    const c = await caches.open(VERSION);
    const hit = (await c.match(key)) || (req.mode === "navigate" ? (await c.match("./")) || (await c.match("index.html")) : null);
    if (!hit) throw err;
    const h = new Headers(hit.headers);
    h.set("x-cutlog-offline", "1");
    return new Response(await hit.blob(), { status: hit.status, statusText: hit.statusText, headers: h });
  }
}
