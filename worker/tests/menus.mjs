/* =====================================================================
   AUMÉ · /api/menus contra una base de verdad
   ---------------------------------------------------------------------
   Lo que más importa acá: que un borrador NO se filtre a la landing, y
   que el historial de meses viejos no se toque nunca.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'menus · borrador, publicar y lo que ve la landing';

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
  const leer = (f) => readFileSync(path.join(t.raiz, 'worker', 'db', f), 'utf8');
  db.exec(leer('schema.sql'));
  db.exec(leer('semilla.sql'));

  const env = { AUME_ENTORNO: 'staging', DB: comoD1(db), ASSETS: { fetch: async () => new Response('') } };

  const llamar = async (ruta, metodo, cuerpo) => {
    const opciones = { method: metodo || 'GET', headers: { 'Sec-Fetch-Site': 'same-origin' } };
    if (cuerpo !== undefined) {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(cuerpo);
    }
    const res = await worker.fetch(new Request('https://aume.test' + ruta, opciones), env, {});
    return { estado: res.status, cuerpo: await res.json() };
  };

  /* ------------------------------------------- Lo que ve la landing */
  let r = await llamar('/api/menus?desde=2026-08-31');
  t.igual('la semana publicada se devuelve entera', r.estado, 200);
  t.igual('con la etiqueta que hoy se escribe a mano en menu.js',
    r.cuerpo.datos.semana, 'Semana del 31/08 al 04/09');
  t.igual('los 5 días', Object.keys(r.cuerpo.datos.platos).sort(),
    ['jueves', 'lunes', 'martes', 'miercoles', 'viernes']);
  t.igual('el lunes trae los 4 tipos', Object.keys(r.cuerpo.datos.platos.lunes).sort(),
    ['clasico', 'ensalada', 'proteico', 'vegetariano']);
  t.igual('con las etiquetas ya convertidas en lista',
    r.cuerpo.datos.platos.lunes.proteico.etiquetas, ['Alto en proteína', 'Sin TACC']);

  /* Una semana sin nada publicado NO devuelve una semana vacía: devuelve
     platos en null, y así la landing se queda con menu.js. */
  r = await llamar('/api/menus?desde=2026-10-05');
  t.igual('una semana sin publicar devuelve platos en null', r.cuerpo.datos.platos, null);

  /* ------------------------------------------ Borrador y publicación */
  const nuevo = '2026-09-07';   // lunes siguiente
  r = await llamar('/api/menus/' + nuevo);
  t.igual('un día que no existe todavía no es un error', r.estado, 200);
  t.igual('y viene marcado como sin cargar', r.cuerpo.datos.estado, 'nuevo');

  r = await llamar('/api/menus/' + nuevo, 'PUT', {
    nota: 'Semana de primavera',
    platos: {
      clasico: { nombre: 'Milanesa napolitana', descripcion: 'Con puré', etiquetas: ['Clásico'] },
      vegetariano: { nombre: '', descripcion: '', etiquetas: [] }
    }
  });
  t.igual('guardar deja el día en borrador', r.cuerpo.datos.estado, 'borrador');
  t.igual('con el plato cargado', r.cuerpo.datos.platos.clasico.nombre, 'Milanesa napolitana');
  t.ok('un plato sin nombre no se guarda (ese día no hay esa opción)',
    !r.cuerpo.datos.platos.vegetariano);

  /* Esta es la que importa: el borrador no puede llegar al cliente */
  r = await llamar('/api/menus?desde=' + nuevo);
  t.igual('un borrador NO se le muestra al cliente', r.cuerpo.datos.platos, null);

  r = await llamar('/api/menus/' + nuevo + '/publicar', 'POST');
  t.igual('publicar responde ok', r.estado, 200);
  t.igual('y el día queda publicado', r.cuerpo.datos.estado, 'publicado');

  r = await llamar('/api/menus?desde=' + nuevo);
  t.igual('ahora sí lo ve el cliente',
    r.cuerpo.datos.platos.lunes.clasico.nombre, 'Milanesa napolitana');
  t.igual('con la nota del día', r.cuerpo.datos.nota, 'Semana de primavera');

  /* --------------------------------------------------- Publicar vacío */
  r = await llamar('/api/menus/2026-09-08', 'PUT', { platos: {} });
  r = await llamar('/api/menus/2026-09-08/publicar', 'POST');
  t.igual('no deja publicar un día sin ningún plato', r.estado, 422);

  /* ------------------------------------------------ Grilla por mes */
  r = await llamar('/api/menus/mes/2026-09');
  t.igual('la grilla del mes responde', r.estado, 200);
  t.ok('trae los días de septiembre', r.cuerpo.datos.dias.length >= 4);
  t.ok('y la lista de meses con algo cargado, para mirar los viejos',
    r.cuerpo.datos.meses.some((m) => m.mes === '2026-08'));
  t.igual('la ruta del mes no se confunde con una fecha',
    r.cuerpo.datos.mes, '2026-09');

  r = await llamar('/api/menus/mes/2026-08');
  t.igual('el mes viejo sigue entero: el historial no se borra',
    r.cuerpo.datos.dias.length, 1);

  /* ---------------------------------------------- Corregir un typo */
  r = await llamar('/api/menus/' + nuevo, 'PUT', {
    platos: { clasico: { nombre: 'Milanesa napolitana con puré', descripcion: '', etiquetas: [] } }
  });
  t.igual('corregir un menú publicado lo deja publicado', r.cuerpo.datos.estado, 'publicado');
  t.igual('con el texto corregido ya en la web',
    r.cuerpo.datos.platos.clasico.nombre, 'Milanesa napolitana con puré');

  /* ------------------------------------------------------ Rechazos */
  r = await llamar('/api/menus/no-es-fecha');
  t.igual('rechaza una fecha con formato raro', r.estado, 422);
  r = await llamar('/api/menus/2026-02-31');
  t.igual('rechaza un 31 de febrero', r.estado, 422);
  r = await llamar('/api/menus/mes/septiembre');
  t.igual('rechaza un mes con formato raro', r.estado, 422);

  /* ------------------------------------------------------ Feriados */
  const finde = '2026-09-14';   // lunes
  r = await llamar('/api/menus/semana', 'PUT', {
    desde: finde,
    nota: 'Semana con feriado',
    publicar: true,
    dias: {
      lunes:     { platos: { clasico: { nombre: 'Guiso de lentejas', etiquetas: [] } } },
      martes:    { feriado: true, platos: {} },
      miercoles: { platos: { clasico: { nombre: 'Pollo al horno', etiquetas: [] } } }
    }
  });
  t.igual('se puede guardar y publicar la semana entera de una', r.estado, 200);
  t.igual('el martes queda marcado como feriado',
    r.cuerpo.datos.dias.find((d) => d.dia === 'martes').feriado, true);
  t.igual('y publicado, aunque no tenga ningún plato',
    r.cuerpo.datos.dias.find((d) => d.dia === 'martes').estado, 'publicado');

  r = await llamar('/api/menus?desde=' + finde);
  t.igual('la landing recibe el feriado marcado', r.cuerpo.datos.feriados.martes, true);
  t.igual('sin platos ese día', r.cuerpo.datos.platos.martes, {});
  t.igual('y el resto de la semana normal',
    r.cuerpo.datos.platos.lunes.clasico.nombre, 'Guiso de lentejas');

  /* Marcar feriado un día que ya tenía platos los borra: si no, la web
     mostraría "Feriado" y platos al mismo tiempo. */
  r = await llamar('/api/menus/semana', 'PUT', {
    desde: finde, dias: { lunes: { feriado: true, platos: {} } }
  });
  t.igual('marcar feriado borra los platos que hubiera',
    r.cuerpo.datos.dias.find((d) => d.dia === 'lunes').platos, {});

  /* --------------------------------------- Días que ya pasaron */
  r = await llamar('/api/menus?desde=2026-08-31');
  t.ok('la respuesta trae la fecha de cada día, para poder cerrar los pasados',
    r.cuerpo.datos.fechas.lunes === '2026-08-31');
  t.ok('y el "hoy" del servidor, no el del celular del cliente',
    /^\d{4}-\d{2}-\d{2}$/.test(r.cuerpo.datos.hoy));

  /* ------------------------------------------- Semana: rechazos */
  r = await llamar('/api/menus/semana', 'PUT', { desde: '2026-09-15', dias: {} });
  t.igual('la semana tiene que empezar un lunes', r.estado, 422);
  r = await llamar('/api/menus/semana?desde=2026-09-15');
  t.igual('leer una semana que no empieza en lunes también se rechaza', r.estado, 422);
  r = await llamar('/api/menus/semana?desde=' + finde);
  t.igual('leer la semana funciona', r.estado, 200);
  t.igual('y no se confunde con la ruta de un día', r.cuerpo.datos.desde, finde);

  db.close();
}
