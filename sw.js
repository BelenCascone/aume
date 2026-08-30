/* =====================================================================
   AUMÉ · Service Worker
   Estrategia "red primero, cache de respaldo": si hay internet siempre
   se ve el menú actualizado; si no hay, la web igual abre.
   Al publicar cambios grandes, subí el número de VERSION.
   ===================================================================== */
var VERSION = 'aume-v2';

var BASICOS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/js/data/config.js',
  './assets/js/data/menu.js',
  './assets/js/store.js',
  './assets/js/ui.js',
  './assets/js/checkout.js',
  './assets/js/app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(BASICOS); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* si algún archivo falla, seguimos igual */ })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;

  /* Sólo cacheamos GET del mismo origen (nunca WhatsApp ni Google Fonts) */
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copia = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copia); });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
