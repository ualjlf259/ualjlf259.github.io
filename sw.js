/* ═══════════════════════════════════════════════════
   SERVICE WORKER — PWA de Nakama Blog
   Estrategia pensada para NO servir nunca código viejo estando online:
   · Navegaciones (HTML) y ficheros de app (css/js/json/xml): RED primero,
     caché solo de respaldo (offline) → tras un deploy siempre se ve lo nuevo.
   · Imágenes, iconos y Google Fonts: caché primero con refresco en segundo
     plano (stale-while-revalidate) → rapidez sin riesgo funcional.
   · Vídeos (59 MB, streaming con Range) y el propio sw.js: NO se interceptan.
   Sube VERSION al hacer un deploy grande para purgar todas las cachés viejas.
═══════════════════════════════════════════════════ */
'use strict';

const VERSION = 'v1';
const CACHE_STATIC = `nakama-static-${VERSION}`; // precache (cáscara de la app)
const CACHE_PAGES  = `nakama-pages-${VERSION}`;  // navegaciones ya visitadas
const CACHE_ASSETS = `nakama-assets-${VERSION}`; // imágenes/fuentes en caliente

const OFFLINE_URL = '/offline.html';

/* Cáscara mínima para que el home y los artículos ya vistos funcionen offline. */
const PRECACHE = [
  '/',
  OFFLINE_URL,
  '/styles.css',
  '/welcome.css',
  '/script.js',
  '/easter-eggs/easter-eggs.css',
  '/easter-eggs/easter-eggs.js',
  '/flags/flag-icons-local.css',
  '/locales/es.js', '/locales/en.js', '/locales/fr.js', '/locales/ja.js',
  '/locales/it.js', '/locales/de.js', '/locales/ru.js', '/locales/pt.js',
  '/articles/index.json',
  '/favicon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => ![CACHE_STATIC, CACHE_PAGES, CACHE_ASSETS].includes(k))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Red primero; si responde, guarda copia; si falla, caché; si tampoco, fallback (solo navegaciones). */
async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    // Primero la caché propia (copia más reciente), después el resto (precache incluido)
    const hit = (await cache.match(req)) || (await caches.match(req));
    if (hit) return hit;
    if (fallbackUrl) {
      const off = await caches.match(fallbackUrl);
      if (off) return off;
    }
    throw err;
  }
}

/* Caché primero + refresco en segundo plano (para recursos que no rompen nada si van "de ayer"). */
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_ASSETS);
  const hit = await cache.match(req);
  const refresh = fetch(req).then((res) => {
    // Las hojas de Google Fonts llegan "opaque" (no-cors): también se guardan.
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => undefined);
  if (hit) return hit;
  const res = await refresh;
  if (!res) throw new Error('offline y sin caché');
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Vídeos (Range/peso) y el propio SW (su actualización la gestiona el navegador): no interceptar.
  if (sameOrigin && (url.pathname.startsWith('/videos/') || url.pathname === '/sw.js')) return;

  // Navegaciones (HTML): red primero → caché → offline.html
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, CACHE_PAGES, OFFLINE_URL));
    return;
  }

  if (sameOrigin) {
    // Código y datos de la app: red primero (nunca stale online), caché de respaldo offline.
    if (/\.(css|js|json|webmanifest|xml)$/.test(url.pathname)) {
      e.respondWith(networkFirst(req, CACHE_STATIC));
      return;
    }
    // Imágenes e iconos: rápido desde caché, refresco en segundo plano.
    if (/\.(png|jpe?g|webp|gif|svg|ico)$/.test(url.pathname)) {
      e.respondWith(staleWhileRevalidate(req));
      return;
    }
    return; // resto: comportamiento normal del navegador
  }

  // Google Fonts (hoja css + woff2, URLs estables): caché con revalidación.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req));
  }
});
