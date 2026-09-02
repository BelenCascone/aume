/* =====================================================================
   AUMÉ · /api/cotizaciones contra una base de verdad
   ---------------------------------------------------------------------
   El formulario de empresas es lo único del sitio donde alguien de
   afuera deja sus datos, y la ruta que lo recibe es pública. O sea: la
   puede llamar cualquiera. Lo que se prueba acá es que eso no sea un
   problema — que valide, que frene los envíos en serie y que nadie de
   afuera pueda LEER lo que otros dejaron.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'cotizaciones · el formulario de empresas';

let DatabaseSync = null;

export async function disponible() {
  try { ({ DatabaseSync } = await import('node:sqlite')); }
  catch (e) { return 'esta versión de Node no trae node:sqlite (hace falta Node 22+)'; }
  return null;
}

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

  /* La ruta que recibe es pública: se llama sin nada especial, igual que
     lo haría la landing. La IP es lo que usa el freno de envíos. */
  const enviar = (cuerpo, ip) => new Request('https://aume.test/api/cotizaciones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ip ? { 'CF-Connecting-IP': ip } : {})
    },
    body: JSON.stringify(cuerpo)
  });

  const delPanel = (metodo, ruta, cuerpo) => new Request('https://aume.test' + ruta, {
    method: metodo,
    headers: { 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  });

  const llamar = async (req, entorno) => {
    const res = await worker.fetch(req, entorno || env, {});
    return { estado: res.status, cuerpo: await res.json() };
  };

  /* ------------------------------------------------------- Recibir */

  let r = await llamar(enviar({
    empresa: 'Estudio Contable López',
    contacto: 'Marina López',
    email: 'marina@estudiolopez.com.ar',
    personas: '12',
    zona: 'Centro, Urquiza y Santa Fe',
    dias: 'lunes a viernes',
    mensaje: 'Dos personas son vegetarianas.'
  }, '1.1.1.1'));
  t.igual('una consulta bien completada se recibe', r.estado, 201);

  /* Al que completa el formulario no se le devuelve nada de lo que
     guardamos: sólo que llegó. */
  t.igual('la respuesta no devuelve los datos guardados',
    Object.keys(r.cuerpo.datos), ['recibida']);

  t.igual('quedó guardada en la base',
    db.prepare('SELECT COUNT(*) AS n FROM cotizaciones').get().n, 1);
  t.igual('con el estado en "nueva"',
    db.prepare('SELECT estado AS e FROM cotizaciones WHERE id = 1').get().e, 'nueva');

  /* La dirección de quien envió NO se guarda tal cual */
  const guardado = db.prepare('SELECT origen_hash AS h FROM cotizaciones WHERE id = 1').get().h;
  t.ok('la dirección de origen se guarda hasheada, no en claro',
    guardado.length === 32 && !guardado.includes('1.1.1.1'), 'quedó: ' + guardado);

  /* Con teléfono en vez de mail también alcanza */
  r = await llamar(enviar({ contacto: 'Juan', telefono: '343 412 3456', personas: '5' }, '2.2.2.2'));
  t.igual('con teléfono en vez de mail también entra', r.estado, 201);

  /* -------------------------------------------------- Lo que rechaza */

  const rechaza = async (etiqueta, cuerpo) => {
    const res = await llamar(enviar(cuerpo, '9.9.9.9'));
    t.ok('rechaza ' + etiqueta, res.estado === 422,
      res.estado === 422 ? '' : 'devolvió ' + res.estado);
  };

  await rechaza('una consulta sin nombre', { email: 'a@b.com' });
  await rechaza('una consulta sin mail ni teléfono', { contacto: 'Ana' });
  await rechaza('un mail mal escrito', { contacto: 'Ana', email: 'ana@@nada' });
  await rechaza('un teléfono incompleto', { contacto: 'Ana', telefono: '123' });
  await rechaza('cuántos son escrito con letras',
    { contacto: 'Ana', email: 'a@b.com', personas: 'muchos' });

  t.igual('ninguna de las rechazadas llegó a la base',
    db.prepare('SELECT COUNT(*) AS n FROM cotizaciones').get().n, 2);

  /* ------------------------------------------------ El freno de envíos

     Un formulario público sin freno se llena de basura en una semana. */

  const mismaIp = '5.5.5.5';
  const buena = { contacto: 'Repetidor', email: 'r@e.com' };

  for (let i = 1; i <= 3; i++) {
    r = await llamar(enviar(buena, mismaIp));
    t.igual('el envío ' + i + ' del mismo origen entra', r.estado, 201);
  }
  r = await llamar(enviar(buena, mismaIp));
  t.igual('el cuarto seguido se frena', r.estado, 422);
  t.ok('y el mensaje ofrece WhatsApp en vez de dejarlo colgado',
    (r.cuerpo.error.detalles[0] || '').includes('WhatsApp'),
    r.cuerpo.error.detalles[0]);

  /* El freno es por origen, no para todo el mundo */
  r = await llamar(enviar({ contacto: 'Otra', email: 'o@e.com' }, '7.7.7.7'));
  t.igual('otro origen sigue pudiendo enviar', r.estado, 201);

  /* -------------------------------------------------------- El panel */

  r = await llamar(delPanel('GET', '/api/cotizaciones'));
  t.igual('el panel las ve todas', r.cuerpo.datos.cotizaciones.length, 6);
  t.igual('y cuenta las que están sin responder', r.cuerpo.datos.nuevas, 6);
  t.igual('la más nueva va primero',
    r.cuerpo.datos.cotizaciones[0].contacto, 'Otra');

  const id = r.cuerpo.datos.cotizaciones[0].id;

  r = await llamar(delPanel('PATCH', '/api/cotizaciones/' + id, { estado: 'contactada' }));
  t.igual('marcarla como contactada responde ok', r.estado, 200);
  t.igual('y el estado queda guardado', r.cuerpo.datos.cotizacion.estado, 'contactada');

  r = await llamar(delPanel('GET', '/api/cotizaciones'));
  t.igual('ahora hay una menos sin responder', r.cuerpo.datos.nuevas, 5);

  r = await llamar(delPanel('GET', '/api/cotizaciones?estado=contactada'));
  t.igual('se pueden filtrar por estado', r.cuerpo.datos.cotizaciones.length, 1);

  r = await llamar(delPanel('PATCH', '/api/cotizaciones/' + id, { estado: 'inventado' }));
  t.igual('un estado que no existe se rechaza', r.estado, 422);

  r = await llamar(delPanel('PATCH', '/api/cotizaciones/9999', { estado: 'cerrada' }));
  t.igual('una cotización que no existe da 404', r.estado, 404);

  /* --------------------------------------------- Quién puede LEERLAS

     Recibir es público; leer lo que otros dejaron, no. Son datos de
     contacto de gente que confió en que iban a AUMÉ y a nadie más. */

  const deAfuera = new Request('https://aume.test/api/cotizaciones', {
    headers: { 'Sec-Fetch-Site': 'cross-site' }
  });

  const enProduccion = { ...env, AUME_ENTORNO: 'produccion', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' };
  r = await llamar(deAfuera, enProduccion);
  t.igual('en producción sin Access, nadie las lee', r.estado, 503);

  r = await llamar(delPanel('PATCH', '/api/cotizaciones/1', { estado: 'cerrada' }), enProduccion);
  t.igual('ni las toca', r.estado, 503);

  /* Pero el formulario sigue recibiendo: la landing no depende de que
     el panel esté abierto. */
  r = await llamar(enviar({ contacto: 'En producción', email: 'p@e.com' }, '8.8.8.8'), enProduccion);
  t.igual('y el formulario de la landing sigue funcionando igual', r.estado, 201);

  db.close();
}
