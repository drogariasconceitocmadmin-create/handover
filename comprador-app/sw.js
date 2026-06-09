/* Compras Conceito — service worker.
   Estratégia: NETWORK-FIRST para arquivos do próprio app (HTML/JS/CSS/ícones),
   com fallback ao cache só quando offline. Assim todo deploy novo chega na hora.
   API Supabase e CDNs externas não são interceptadas. */
const CACHE = "compras-conceito-v3";
const SHELL = [
  "./",
  "./index.html",
  "./comprador.css",
  "./config.js",
  "./comprador-data.js",
  "./comprador-app.jsx",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Nunca interceptar API/Supabase.
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("supabase.in")) return;
  // CDNs externas (react, babel, lucide, supabase-js): deixa o cache HTTP do navegador cuidar.
  if (url.origin !== self.location.origin) return;

  // Mesmo domínio (arquivos do app) → network-first: sempre a versão mais nova quando online,
  // cache só como reserva offline.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
  );
});
