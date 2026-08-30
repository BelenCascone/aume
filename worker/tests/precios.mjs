/* =====================================================================
   AUMÉ · /api/precios contra una base de verdad
   ---------------------------------------------------------------------
   Monta una SQLite en memoria con el esquema y la semilla, la envuelve
   en un D1 falso (misma forma que el de Cloudflare: prepare/bind/batch)
   y corre la ruta real.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'precios · lectura y guardado de /api/precios';

let DatabaseSync = null;

export async function disponible() {
  try { ({ DatabaseSync } = await import('node:sqlite')); }
  catch (e) { return 'esta versión de Node no trae node:sqlite (hace falta Node 22+)'; }
  return null;
}

/* D1 falso: sólo lo que usa la ruta */
function comoD1(db) {
  const stmt = (sql, args) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    async first() { return db.prepare(sql).get(...args) ?? null; },
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
  const { leerPrecios } = await import('../rutas/precios.js');
  const worker = (await import('../index.js')).default;

  const db = new DatabaseSync(':memory:');
  const leer = (f) => readFileSync(path.join(t.raiz, 'worker', 'db', f), 'utf8');
  db.exec(leer('schema.sql'));
  db.exec(leer('semilla.sql'));

  const DB = comoD1(db);
  const env = { AUME_ENTORNO: 'staging', DB, ASSETS: { fetch: async () => new Response('') } };

  /* ------------------------------------------------------- Lectura */
  const p = await leerPrecios(DB);

  t.igual('el precio de la vianda sale de la base', p.preciosVianda, { estandar: 9000, xl: 12800 });
  t.igual('el envío sale de la base',
    p.envio.zonas.map((z) => [z.id, z.costo]), [['dentro', 2000], ['fuera', 2500]]);
  t.igual('las 4 categorías del menú, sin la César', p.categorias.map((c) => c.id),
    ['clasico', 'vegetariano', 'proteico', 'ensalada']);
  t.igual('la César viene aparte, como opción fija', p.extraFijo.id, 'cesar');
  t.igual('los 3 puntos de retiro, con sus horarios ya parseados',
    p.puntosRetiro.map((x) => x.horarios.length), [1, 2, 1]);
  t.igual('el pack x5 estándar', p.packs.opciones[0].precios.estandar, { lista: 45000, efectivo: 40500 });
  t.igual('el plan mensual XL sigue sin precio', p.planMensual.precios.xl, { lista: null, efectivo: null });

  /* Las claves tienen que coincidir con las de config.js, porque la
     landing mezcla esta respuesta encima de ese archivo. */
  ['preciosVianda', 'tamanos', 'categorias', 'dias', 'envio', 'packs',
   'planMensual', 'puntosRetiro', 'metodosPago', 'productos', 'whatsapp'].forEach((k) => {
    t.ok('la respuesta trae "' + k + '", igual que config.js', k in p);
  });

  /* ------------------------------------------------------- Guardado */
  const pedir = (cuerpo) => new Request('https://aume.test/api/precios', {
    method: 'PUT',
    headers: { 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
  });

  const guardar = async (cuerpo) => {
    const res = await worker.fetch(pedir(cuerpo), env, {});
    return { estado: res.status, cuerpo: await res.json() };
  };

  let r = await guardar({ preciosVianda: { estandar: 9500 }, envio: { zonas: [{ id: 'dentro', costo: 2200 }] } });
  t.igual('guardar precios válidos responde ok', r.estado, 200);
  t.igual('el precio nuevo queda en la base',
    db.prepare("SELECT precio AS p FROM tamanos WHERE id='estandar'").get().p, 9500);
  t.igual('el envío nuevo queda en la base',
    db.prepare("SELECT costo AS c FROM zonas_envio WHERE id='dentro'").get().c, 2200);
  t.igual('la respuesta devuelve los precios ya actualizados',
    r.cuerpo.datos.precios.preciosVianda.estandar, 9500);

  /* Lo que no se manda no se toca */
  t.igual('el XL queda como estaba',
    db.prepare("SELECT precio AS p FROM tamanos WHERE id='xl'").get().p, 12800);

  /* --------------------------------------------- Datos que hay que frenar */
  const rechaza = async (etiqueta, cuerpo) => {
    const res = await guardar(cuerpo);
    t.ok('rechaza ' + etiqueta, res.estado === 422,
      res.estado === 422 ? '' : 'devolvió ' + res.estado);
  };

  await rechaza('un precio negativo', { preciosVianda: { estandar: -100 } });
  await rechaza('un precio con decimales', { preciosVianda: { estandar: 9000.5 } });
  await rechaza('un precio que es texto', { preciosVianda: { estandar: 'gratis' } });
  await rechaza('un precio disparatado', { preciosVianda: { estandar: 999999999 } });
  await rechaza('un cuerpo sin ningún cambio', {});

  /* Después de todos los rechazos, la base no puede haber cambiado */
  t.igual('ningún dato inválido llegó a la base',
    db.prepare("SELECT precio AS p FROM tamanos WHERE id='estandar'").get().p, 9500);

  db.close();
}
