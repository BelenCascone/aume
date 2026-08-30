/* =====================================================================
   AUMÉ · /api/pedidos contra una base de verdad
   ---------------------------------------------------------------------
   POST /api/pedidos es la única ruta pública que escribe, así que la
   mayoría de estos casos son intentos de mandarle basura.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'pedidos · alta desde la web y desde el panel';

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
  const { fechaLocal, idDia } = await import('../lib/tiempo.js');

  const db = new DatabaseSync(':memory:');
  const leer = (f) => readFileSync(path.join(t.raiz, 'worker', 'db', f), 'utf8');
  db.exec(leer('schema.sql'));
  db.exec(leer('semilla.sql'));

  /* Borramos los menús de la semilla y armamos los nuestros a partir de
     HOY. Así el test no depende de en qué fecha se corra ni se
     superpone con la semana de ejemplo, que tiene las 4 categorías
     cargadas y arruinaría el caso de "esa categoría no está ese día".
     El borrado se lleva los platos por la clave foránea en cascada. */
  db.exec('DELETE FROM menus');

  const hoy = fechaLocal();
  const futuro = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(hoy + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const f = d.toISOString().slice(0, 10);
    futuro.push({ fecha: f, dia: idDia(f) });
  }
  for (const f of futuro) {
    db.prepare("INSERT INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES (?,?,?,'publicado',datetime('now'))")
      .run(f.fecha, f.dia, f.fecha.slice(0, 7));
    db.prepare("INSERT INTO menu_platos (menu_id, categoria_id, nombre) VALUES ((SELECT id FROM menus WHERE fecha=?), 'clasico', 'Plato de prueba')")
      .run(f.fecha);
  }
  const dia1 = futuro[0].dia;

  const env = { AUME_ENTORNO: 'staging', DB: comoD1(db), ASSETS: { fetch: async () => new Response('') } };

  const llamar = async (ruta, metodo, cuerpo) => {
    const o = { method: metodo || 'GET', headers: { 'Sec-Fetch-Site': 'same-origin' } };
    if (cuerpo !== undefined) {
      o.headers['Content-Type'] = 'application/json';
      o.body = JSON.stringify(cuerpo);
    }
    const res = await worker.fetch(new Request('https://aume.test' + ruta, o), env, {});
    return { estado: res.status, cuerpo: await res.json() };
  };

  const base = (extra) => Object.assign({
    cliente: { nombre: 'Ana Pérez', telefono: '343 412 3456' },
    modalidad: 'retiro',
    puntoId: 'base',
    metodoPago: 'efectivo',
    items: [{ dia: dia1, categoria: 'clasico', tamano: 'estandar', cantidad: 2 }]
  }, extra || {});

  /* ------------------------------------------- Alta desde la landing */
  let r = await llamar('/api/pedidos', 'POST', base());
  t.igual('un pedido válido entra', r.estado, 201);
  t.igual('con el total calculado por el servidor', r.cuerpo.datos.total, 18000);
  t.igual('y la cantidad de viandas', r.cuerpo.datos.cantidad, 2);
  t.igual('queda con canal "app"',
    db.prepare('SELECT canal AS c FROM pedidos WHERE id = ?').get(r.cuerpo.datos.id).c, 'app');

  /* ⚠️ Lo más importante de toda la fase: el precio no lo pone el navegador */
  r = await llamar('/api/pedidos', 'POST', base({
    items: [{ dia: dia1, categoria: 'clasico', tamano: 'estandar', cantidad: 2, precio: 1, subtotal: 2 }],
    total: 2, subtotal: 2, envio: 0
  }));
  t.igual('mandar precios falsos no sirve: el servidor recalcula',
    r.cuerpo.datos.total, 18000);

  /* El envío también sale de la base */
  r = await llamar('/api/pedidos', 'POST', base({
    modalidad: 'envio', zonaId: 'fuera', direccion: 'Urquiza 1234', puntoId: undefined
  }));
  t.igual('el envío se cobra según la zona, con el costo de la base',
    r.cuerpo.datos.envio, 2500);
  t.igual('y se suma al total', r.cuerpo.datos.total, 18000 + 2500);

  /* ------------------------------------------------- Doble toque */
  const clave = 'prueba-doble-toque';
  const a = await llamar('/api/pedidos', 'POST', base({ claveIdem: clave }));
  const b = await llamar('/api/pedidos', 'POST', base({ claveIdem: clave }));
  t.igual('un doble toque no registra el pedido dos veces', b.cuerpo.datos.id, a.cuerpo.datos.id);
  t.igual('y el segundo viene marcado como repetido', b.cuerpo.datos.repetido, true);

  /* ------------------------------------------------ Los dos caminos */
  r = await llamar('/api/pedidos', 'POST', base({ origen: 'checkout-confirmado' }));
  t.igual('el pedido confirmado sin WhatsApp también es canal app',
    db.prepare('SELECT canal AS c FROM pedidos WHERE id = ?').get(r.cuerpo.datos.id).c, 'app');
  t.igual('y se distingue por su origen',
    db.prepare('SELECT origen AS o FROM pedidos WHERE id = ?').get(r.cuerpo.datos.id).o, 'checkout-confirmado');

  /* ------------------------------------------------------ Rechazos */
  const rechaza = async (etiqueta, cuerpo) => {
    const res = await llamar('/api/pedidos', 'POST', cuerpo);
    t.ok('rechaza ' + etiqueta, res.estado === 422, res.estado === 422 ? '' : 'devolvió ' + res.estado);
  };

  await rechaza('un pedido sin viandas', base({ items: [] }));
  await rechaza('un nombre vacío', base({ cliente: { nombre: '', telefono: '3434123456' } }));
  await rechaza('un teléfono que no es teléfono', base({ cliente: { nombre: 'Ana', telefono: 'no' } }));
  await rechaza('un tamaño inventado', base({ items: [{ dia: dia1, categoria: 'clasico', tamano: 'gigante', cantidad: 1 }] }));
  await rechaza('un tipo de menú inventado', base({ items: [{ dia: dia1, categoria: 'gourmet', tamano: 'estandar', cantidad: 1 }] }));
  await rechaza('una cantidad negativa', base({ items: [{ dia: dia1, categoria: 'clasico', tamano: 'estandar', cantidad: -3 }] }));
  await rechaza('una cantidad absurda', base({ items: [{ dia: dia1, categoria: 'clasico', tamano: 'estandar', cantidad: 5000 }] }));
  await rechaza('un método de pago inventado', base({ metodoPago: 'cripto' }));
  await rechaza('un punto de retiro inventado', base({ puntoId: 'mi-casa' }));
  await rechaza('un envío sin dirección', base({ modalidad: 'envio', zonaId: 'dentro', direccion: '' }));
  await rechaza('un envío a una zona inventada', base({ modalidad: 'envio', zonaId: 'marte', direccion: 'Urquiza 1234' }));

  /* Un día que ya pasó no se puede pedir, aunque se lo mande a mano */
  const ayer = new Date(hoy + 'T12:00:00Z');
  ayer.setUTCDate(ayer.getUTCDate() - 7);
  await rechaza('un día que ya pasó',
    base({ items: [{ dia: idDia(ayer.toISOString().slice(0, 10)), categoria: 'vegetariano', tamano: 'estandar', cantidad: 1 }] }));

  /* Un plato que ese día no existe tampoco */
  await rechaza('una categoría que ese día no está publicada',
    base({ items: [{ dia: dia1, categoria: 'proteico', tamano: 'estandar', cantidad: 1 }] }));

  /* La Ensalada César sí está todos los días, aunque no esté en menu_platos */
  r = await llamar('/api/pedidos', 'POST',
    base({ items: [{ dia: dia1, categoria: 'cesar', tamano: 'xl', cantidad: 1 }] }));
  t.igual('la Ensalada César se puede pedir cualquier día', r.estado, 201);
  t.igual('al precio del tamaño XL', r.cuerpo.datos.total, 12800);

  /* --------------------------------------- Alta desde el panel */
  r = await llamar('/api/pedidos/manual', 'POST', base({
    cliente: { nombre: 'Clienta de WhatsApp', telefono: '3434999888' }
  }));
  t.igual('la secretaria puede cargar un pedido a mano', r.estado, 201);
  t.igual('y queda con canal "whatsapp"',
    db.prepare('SELECT canal AS c FROM pedidos WHERE id = ?').get(r.cuerpo.datos.id).c, 'whatsapp');

  /* ------------------------------------------------ Listado */
  r = await llamar('/api/pedidos?rango=dia');
  t.igual('el listado del día responde', r.estado, 200);
  t.ok('con pedidos', r.cuerpo.datos.pedidos.length > 0);
  t.ok('separando app de whatsapp',
    r.cuerpo.datos.resumen.porCanal.app.pedidos > 0 &&
    r.cuerpo.datos.resumen.porCanal.whatsapp.pedidos === 1);
  t.ok('y contando por tipo de menú', r.cuerpo.datos.resumen.porTipo.length > 0);

  r = await llamar('/api/pedidos?rango=dia&canal=whatsapp');
  t.igual('se puede filtrar sólo los de WhatsApp', r.cuerpo.datos.pedidos.length, 1);

  r = await llamar('/api/pedidos?rango=semana');
  t.ok('y mirar la semana entera', r.cuerpo.datos.pedidos.length > 0);

  /* ------------------------------------------------ Estados */
  const id = (await llamar('/api/pedidos?rango=dia')).cuerpo.datos.pedidos[0].id;
  r = await llamar('/api/pedidos/' + id, 'PATCH', { estado: 'entregado' });
  t.igual('se puede marcar un pedido como entregado', r.estado, 200);
  t.igual('y queda guardado',
    db.prepare('SELECT estado AS e FROM pedidos WHERE id = ?').get(id).e, 'entregado');

  r = await llamar('/api/pedidos/' + id, 'PATCH', { estado: 'inventado' });
  t.igual('un estado inventado se rechaza', r.estado, 422);
  r = await llamar('/api/pedidos/999999', 'PATCH', { estado: 'entregado' });
  t.igual('un pedido que no existe da 404', r.estado, 404);

  db.close();
}
