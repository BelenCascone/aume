/* =====================================================================
   AUMÉ · /api/publicaciones contra una base de verdad
   ---------------------------------------------------------------------
   Monta una SQLite en memoria con el esquema, la envuelve en un D1 falso
   y corre las rutas reales del worker.

   Lo que más importa acá es una sola regla: un borrador no sale nunca
   por las rutas públicas. Alguien escribiendo a mitad de una nota no
   tiene por qué aparecer en la web.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'publicaciones · tips y recetas en /api/publicaciones';

let DatabaseSync = null;

export async function disponible() {
  try { ({ DatabaseSync } = await import('node:sqlite')); }
  catch (e) { return 'esta versión de Node no trae node:sqlite (hace falta Node 22+)'; }
  return null;
}

/* D1 falso: sólo lo que usan las rutas */
function comoD1(db) {
  const stmt = (sql, args) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() { db.prepare(sql).run(...args); return { success: true }; }
  });
  return {
    prepare: (sql) => stmt(sql, []),
    async batch(lista) {
      return lista.map((s) => /^\s*SELECT/i.test(s.sql)
        ? { results: db.prepare(s.sql).all(...s.args) }
        : (db.prepare(s.sql).run(...s.args), { results: [] }));
    }
  };
}

export async function correr(t) {
  const worker = (await import('../index.js')).default;

  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(t.raiz, 'worker', 'db', 'schema.sql'), 'utf8'));

  const DB = comoD1(db);
  const env = { AUME_ENTORNO: 'staging', DB, ASSETS: { fetch: async () => new Response('') } };

  /* Del panel: mismo origen y con identidad simulada (en staging, sin
     Access configurado, el worker deja pasar). */
  const delPanel = (metodo, ruta, cuerpo) => new Request('https://aume.test' + ruta, {
    method: metodo,
    headers: { 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  });

  /* De la web pública: sin cabecera de mismo origen */
  const deLaWeb = (ruta) => new Request('https://aume.test' + ruta);

  const llamar = async (req) => {
    const res = await worker.fetch(req, env, {});
    const tipo = res.headers.get('content-type') || '';
    return {
      estado: res.status,
      cuerpo: tipo.includes('json') ? await res.json() : null
    };
  };

  /* ------------------------------------------------------- Crear */

  let r = await llamar(delPanel('POST', '/api/publicaciones', {
    titulo: '3 mitos de invierno',
    copete: 'Que están arruinando tu nutrición',
    cuerpo: 'Primer párrafo.\n\nSegundo párrafo.',
    categoria: 'nutricion',
    estado: 'publicado',
    fecha: '2026-08-20'
  }));
  t.igual('crear una publicación responde 201', r.estado, 201);
  t.igual('la dirección sale del título', r.cuerpo.datos.publicacion.id, '3-mitos-de-invierno');

  /* Los acentos y la ñ no pueden llegar a la dirección de la nota: es un
     link que se comparte por WhatsApp y tiene que sobrevivir a que lo
     copien y lo peguen. */
  r = await llamar(delPanel('POST', '/api/publicaciones', {
    titulo: 'Información nutricional: el ñandú',
    cuerpo: 'algo', estado: 'borrador', fecha: '2026-08-10'
  }));
  t.igual('los acentos y la ñ salen de la dirección',
    r.cuerpo.datos.publicacion.id, 'informacion-nutricional-el-nandu');

  r = await llamar(delPanel('POST', '/api/publicaciones', {
    titulo: 'Ensalada de garbanzos',
    cuerpo: 'A medio escribir',
    categoria: 'receta',
    estado: 'borrador',
    fecha: '2026-08-25'
  }));
  t.igual('un borrador también se guarda', r.estado, 201);

  /* ------------------------------------------ La regla que no se afloja */

  r = await llamar(deLaWeb('/api/publicaciones'));
  t.igual('la web ve las publicadas', r.estado, 200);
  t.igual('y SÓLO las publicadas',
    r.cuerpo.datos.publicaciones.map((p) => p.id), ['3-mitos-de-invierno']);

  r = await llamar(deLaWeb('/api/publicaciones/ensalada-de-garbanzos'));
  t.igual('entrar directo al link de un borrador da 404', r.estado, 404);

  r = await llamar(delPanel('GET', '/api/publicaciones/panel'));
  t.igual('el panel ve también los borradores', r.cuerpo.datos.publicaciones.length, 3);

  /* -------------------------------------------------- Leer una nota */

  r = await llamar(deLaWeb('/api/publicaciones/3-mitos-de-invierno'));
  t.igual('una nota publicada se abre', r.estado, 200);
  t.igual('y trae el cuerpo entero',
    r.cuerpo.datos.publicacion.cuerpo, 'Primer párrafo.\n\nSegundo párrafo.');

  r = await llamar(deLaWeb('/api/publicaciones'));
  t.igual('en el listado el cuerpo no viaja', r.cuerpo.datos.publicaciones[0].cuerpo, '');

  r = await llamar(deLaWeb('/api/publicaciones/no-existe'));
  t.igual('una nota que no existe da 404', r.estado, 404);

  /* ------------------------------------------------- Lo que se rechaza */

  const rechaza = async (etiqueta, cuerpo) => {
    const res = await llamar(delPanel('POST', '/api/publicaciones', cuerpo));
    t.ok('rechaza ' + etiqueta, res.estado === 422,
      res.estado === 422 ? '' : 'devolvió ' + res.estado);
  };

  await rechaza('publicar sin texto',
    { titulo: 'Vacía', cuerpo: '', estado: 'publicado' });
  await rechaza('una publicación sin título',
    { titulo: '', cuerpo: 'algo', estado: 'borrador' });
  await rechaza('un título sin ninguna letra ni número',
    { titulo: '¿¿¿ !!! ???', cuerpo: 'algo', estado: 'borrador' });

  /* El nombre del archivo de imagen lo elige el servidor. Cualquier otra
     cosa es alguien probando suerte. */
  await rechaza('una imagen con un nombre que no guardamos nosotros',
    { titulo: 'Con foto', cuerpo: 'algo', estado: 'borrador', imagen: '../../secreto.png' });
  await rechaza('una imagen con nombre inventado',
    { titulo: 'Con foto', cuerpo: 'algo', estado: 'borrador', imagen: 'gato.jpg' });

  /* -------------------------------------------------- Editar y borrar */

  r = await llamar(delPanel('PUT', '/api/publicaciones/ensalada-de-garbanzos', {
    titulo: 'Ensalada de garbanzos crocantes',
    cuerpo: 'Ya terminada.',
    categoria: 'receta',
    estado: 'publicado',
    fecha: '2026-08-25'
  }));
  t.igual('publicar un borrador desde el panel responde ok', r.estado, 200);
  t.igual('el link de la nota NO cambia aunque cambie el título',
    r.cuerpo.datos.publicacion.id, 'ensalada-de-garbanzos');

  r = await llamar(deLaWeb('/api/publicaciones'));
  t.igual('ahora la web ve las dos', r.cuerpo.datos.publicaciones.length, 2);
  t.igual('y ordenadas de la más nueva a la más vieja',
    r.cuerpo.datos.publicaciones.map((p) => p.fecha), ['2026-08-25', '2026-08-20']);

  r = await llamar(deLaWeb('/api/publicaciones?categoria=receta'));
  t.igual('se pueden pedir de un tipo solo',
    r.cuerpo.datos.publicaciones.map((p) => p.id), ['ensalada-de-garbanzos']);

  r = await llamar(delPanel('DELETE', '/api/publicaciones/ensalada-de-garbanzos'));
  t.igual('borrar responde ok', r.estado, 200);
  r = await llamar(deLaWeb('/api/publicaciones'));
  t.igual('y desaparece de la web', r.cuerpo.datos.publicaciones.length, 1);

  r = await llamar(delPanel('DELETE', '/api/publicaciones/no-existe'));
  t.igual('borrar algo que no existe da 404', r.estado, 404);

  /* ------------------------------------------------------ Las fotos */

  const subir = new Request('https://aume.test/api/publicaciones/imagenes', {
    method: 'POST',
    headers: { 'Sec-Fetch-Site': 'same-origin' },
    body: (() => { const f = new FormData(); f.append('imagen', new Blob(['x'], { type: 'image/png' }), 'f.png'); return f; })()
  });
  r = await llamar(subir);
  t.igual('sin el bucket R2 configurado, subir una foto avisa qué falta', r.estado, 503);
  t.ok('y el mensaje nombra el bucket',
    (r.cuerpo.error.mensaje || '').includes('R2'), r.cuerpo.error.mensaje);

  r = await llamar(deLaWeb('/api/publicaciones/imagenes/../../schema.sql'));
  t.ok('una dirección de imagen con ".." no llega a ningún lado',
    r.estado === 404, 'devolvió ' + r.estado);

  /* ------------------------------------------------------ Sin permiso

     El panel está detrás de Cloudflare Access, pero el worker es el
     segundo cerrojo: un pedido que no salió del panel no escribe. */

  const deAfuera = (metodo, ruta, cuerpo) => new Request('https://aume.test' + ruta, {
    method: metodo,
    headers: { 'Sec-Fetch-Site': 'cross-site', 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  });

  r = await llamar(deAfuera('POST', '/api/publicaciones', { titulo: 'Colada', cuerpo: 'x' }));
  t.igual('crear desde otro sitio da 401', r.estado, 401);

  r = await llamar(deAfuera('DELETE', '/api/publicaciones/3-mitos-de-invierno'));
  t.igual('borrar desde otro sitio da 401', r.estado, 401);

  r = await llamar(deLaWeb('/api/publicaciones'));
  t.igual('después de todo eso, la publicación sigue ahí',
    r.cuerpo.datos.publicaciones.length, 1);

  /* Los borradores no los tapa el chequeo de mismo origen —ese es
     anti-CSRF y por diseño sólo cubre lo que escribe (ver
     worker/lib/origen.js)—: los tapa Cloudflare Access. Acá se verifica
     esa segunda puerta: en producción, con Access todavía sin
     configurar, la ruta del panel se cierra a propósito, mientras la
     ruta pública sigue contestando. */
  const enProduccion = { ...env, AUME_ENTORNO: 'produccion', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' };
  const llamarProd = async (req) => {
    const res = await worker.fetch(req, enProduccion, {});
    return { estado: res.status, cuerpo: await res.json() };
  };

  r = await llamarProd(delPanel('GET', '/api/publicaciones/panel'));
  t.igual('en producción sin Access, los borradores no se sirven', r.estado, 503);

  r = await llamarProd(delPanel('POST', '/api/publicaciones', { titulo: 'x', cuerpo: 'y' }));
  t.igual('ni se puede crear nada', r.estado, 503);

  r = await llamarProd(deLaWeb('/api/publicaciones'));
  t.igual('pero la web pública sigue viendo sus tips', r.estado, 200);

  db.close();
}
