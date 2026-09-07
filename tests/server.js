/* Servidor estático mínimo para correr los tests contra http://localhost
   (hace falta http:// real: en file:// el navegador bloquea localStorage). */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const raiz   = path.join(__dirname, '..');
const puerto = Number(process.env.PORT || 4173);

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'text/javascript; charset=utf-8',
  '.json': 'application/manifest+json; charset=utf-8',
  '.png' : 'image/png',
  '.svg' : 'image/svg+xml',
  /* Las fotos de los platos y de la portada. Sin estas tres líneas se
     sirven como application/octet-stream y, por el nosniff de abajo, el
     navegador las descarta SIN AVISAR: la página se ve igual que si las
     fotos no estuvieran. */
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  /* Sin el tipo correcto, X-Content-Type-Options: nosniff hace que el
     navegador descarte la tipografía y el sitio se vea con la de respaldo. */
  '.otf' : 'font/otf',
  '.woff2': 'font/woff2',
  '.txt' : 'text/plain; charset=utf-8'
};

/* Leemos las cabeceras del archivo _headers real (el que usa Netlify) en vez
   de repetirlas acá: así los tests corren bajo la misma CSP que el sitio
   publicado y no bajo una configuración más permisiva. */
function cabecerasDeSeguridad() {
  const salida = {};
  let texto = '';
  try { texto = fs.readFileSync(path.join(raiz, '_headers'), 'utf8'); }
  catch (e) { return salida; }

  let dentro = false;
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.trim();
    if (t === '/*') { dentro = true; continue; }
    if (!dentro) continue;
    if (!t) { dentro = false; continue; }
    if (t.startsWith('#')) continue;
    const i = t.indexOf(':');
    if (i > 0) salida[t.slice(0, i)] = t.slice(i + 1).trim();
  }
  return salida;
}

const SEGURIDAD = cabecerasDeSeguridad();

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  /* Cualquier carpeta sirve su index.html, igual que hace el hosting: así
     /pedido/ abre la pantalla de pedidos sin escribir el nombre del archivo. */
  if (rel.endsWith('/')) rel += 'index.html';

  const archivo = path.normalize(path.join(raiz, rel));
  if (!archivo.startsWith(raiz)) { res.writeHead(403).end('prohibido'); return; }

  fs.readFile(archivo, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, Object.assign({
      'Content-Type' : tipos[path.extname(archivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }, SEGURIDAD));
    res.end(buf);
  });
}).listen(puerto, () => console.log('AUMÉ en http://localhost:' + puerto));
