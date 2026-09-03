/* =====================================================================
   AUMÉ · Service Worker
   Estrategia "red primero, cache de respaldo": si hay internet siempre
   se ve el menú actualizado; si no hay, la web igual abre.
   Al publicar cambios grandes, subí el número de VERSION.
   ===================================================================== */
var VERSION = 'aume-v9';

/* La pantalla de pedidos se guarda por sus dos direcciones —'/pedido/' y
   '/pedido/index.html'— porque el cache busca por la dirección pedida, y
   quien tenga la web instalada puede entrar por cualquiera de las dos. */
var BASICOS = [
  './',
  './pedido/',
  './pedido/index.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/css/landing.css',
  './assets/fonts/GlacialIndifference-Regular.otf',
  './assets/fonts/GlacialIndifference-Bold.otf',
  './assets/js/landing.js',
  './assets/js/nota.js',
  './assets/js/cotizacion.js',
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

  var ruta = new URL(req.url).pathname;

  /* La API y el panel NO se cachean nunca.
     ---------------------------------------------------------------
     /api/  · son los precios y el menú de AHORA. Guardar una copia
              significaría mostrarle a un cliente un precio viejo, o
              peor: guardar un error del servidor y seguir sirviéndolo
              como si fuera la respuesta buena.
     /admin/ · el panel siempre tiene que pedirle los datos frescos al
              servidor, y además pasa por Cloudflare Access, que no
              tiene sentido cachear.
     Si no hay internet, la landing igual funciona: se queda con
     assets/js/data/config.js y menu.js, que están en el cache. */
  if (ruta.indexOf('/api/') === 0 || ruta.indexOf('/admin') === 0) return;

  e.respondWith(
    fetch(req)
      .then(function (res) {
        /* Sólo guardamos respuestas buenas. Antes se cacheaba cualquier
           cosa, así que un 404 o un 500 pasajero quedaba pegado y se
           seguía sirviendo aunque el servidor ya estuviera bien. */
        if (res && res.ok && res.type === 'basic') {
          var copia = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copia); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./pedido/');
        });
      })
  );
});
