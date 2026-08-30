/* =====================================================================
   AUMÉ · /api/estadisticas contra una base con pedidos de verdad
   ---------------------------------------------------------------------
   Un tablero que miente es peor que no tener tablero: sobre estos
   números se decide cuánto cocinar y qué reforzar. Así que acá se
   arman pedidos conocidos y se verifica cada cuenta a mano.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'estadisticas · el tablero de los dueños';

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
  db.exec('DELETE FROM pedidos');

  const env = { AUME_ENTORNO: 'staging', DB: comoD1(db), ASSETS: { fetch: async () => new Response('') } };

  /* Pedidos armados a mano, para poder verificar cada número.
     Semana 1 (2026-09-07 lunes) y semana 2 (2026-09-14 lunes). */
  let n = 0;
  const alta = (fecha, semana, dow, canal, tel, nombre, modalidad, total, cant, estado) => {
    n++;
    db.prepare(
      'INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, ' +
      'cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, punto_id, metodo_pago, ' +
      'cantidad, subtotal, envio, total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(n, fecha + 'T12:00:00Z', fecha, semana, dow, canal, 'panel', estado || 'nuevo',
      nombre, tel, tel, modalidad, modalidad === 'envio' ? 'dentro' : null,
      modalidad === 'retiro' ? 'base' : null, 'efectivo',
      cant, total, 0, total);
    return n;
  };
  const item = (pid, dia, cat, tam, cant, sub) => {
    db.prepare('INSERT INTO pedido_items (pedido_id, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?,?,?)')
      .run(pid, dia, cat, tam, cant, sub / cant, sub);
  };

  /* Semana 1: 3 pedidos */
  item(alta('2026-09-07', '2026-W37', 1, 'app', '3434000111', 'Ana', 'envio', 27000, 3), 'lunes', 'clasico', 'estandar', 3, 27000);
  item(alta('2026-09-08', '2026-W37', 2, 'app', '3434000222', 'Bea', 'retiro', 9000, 1), 'martes', 'vegetariano', 'estandar', 1, 9000);
  item(alta('2026-09-09', '2026-W37', 3, 'whatsapp', '3434000111', 'ana perez', 'retiro', 12800, 1), 'lunes', 'clasico', 'xl', 1, 12800);

  /* Semana 2: 2 pedidos (uno cancelado, que NO tiene que contar) */
  item(alta('2026-09-14', '2026-W38', 1, 'app', '3434000333', 'Cami', 'envio', 27000, 3), 'lunes', 'proteico', 'estandar', 3, 27000);
  item(alta('2026-09-15', '2026-W38', 2, 'app', '3434000444', 'Dana', 'retiro', 99000, 9, 'cancelado'), 'martes', 'ensalada', 'estandar', 9, 99000);

  const pedir = async (qs) => {
    const res = await worker.fetch(new Request('https://aume.test/api/estadisticas' + (qs || ''),
      { headers: { 'Sec-Fetch-Site': 'same-origin' } }), env, {});
    return { estado: res.status, d: (await res.json()).datos };
  };

  let r = await pedir('?desde=2026-09-01&hasta=2026-09-30');
  t.igual('el tablero responde', r.estado, 200);

  /* --- Totales. 4 pedidos vivos: 18000+9000+12800+27000 = 66800 --- */
  t.igual('cuenta los pedidos vivos', r.d.totales.pedidos, 4);
  t.igual('sin contar el cancelado (serían 17)', r.d.totales.viandas, 8);
  t.igual('la plata recaudada', r.d.totales.plata, 75800);
  t.igual('el ticket promedio', r.d.totales.ticketPromedio, Math.round(75800 / 4));
  t.igual('las viandas por pedido', r.d.totales.viandasPorPedido, 2);

  /* Esta es la que más importa: un cancelado no se cocinó ni se cobró */
  t.ok('el pedido cancelado no infla la recaudación', r.d.totales.plata < 99000);

  /* --- Canal --- */
  t.igual('pedidos por la app', r.d.porCanal.app.pedidos, 3);
  t.igual('pedidos por WhatsApp', r.d.porCanal.whatsapp.pedidos, 1);

  /* --- Menú más pedido: clásico con 3 viandas --- */
  t.igual('el menú más pedido va primero', r.d.porTipo[0].id, 'clasico');
  t.igual('con sus viandas', r.d.porTipo[0].viandas, 4);
  t.ok('y el cancelado no aparece en los tipos',
    !r.d.porTipo.some((x) => x.id === 'ensalada'));

  /* --- Entrega --- */
  t.igual('pedidos con envío', r.d.entrega.envio.pedidos, 2);
  t.igual('pedidos con retiro', r.d.entrega.retiro.pedidos, 2);

  /* --- Día de la semana con más pedidos: lunes (2) --- */
  t.igual('el lunes es el día que más entra', r.d.porDiaPedido[0].nombre, 'lunes');
  t.igual('con 2 pedidos', r.d.porDiaPedido[0].pedidos, 2);

  /* --- Día de entrega con más viandas: lunes (2+1+3 = 6) --- */
  t.igual('el lunes es el día que más se cocina', r.d.porDiaEntrega[0].id, 'lunes');
  t.igual('con 7 viandas', r.d.porDiaEntrega[0].viandas, 7);

  /* --- Evolución semana a semana --- */
  t.igual('dos semanas con datos', r.d.semanas.length, 2);
  t.igual('la primera con 3 pedidos', r.d.semanas[0].pedidos, 3);
  t.igual('la segunda con 1 (el cancelado no cuenta)', r.d.semanas[1].pedidos, 1);
  t.igual('el crecimiento compara la última contra la anterior', r.d.crecimiento.pedidos, -2);

  /* --- Clientas que repiten: Ana pidió dos veces con el mismo teléfono,
         aunque escribió el nombre distinto --- */
  t.igual('4 teléfonos distintos', r.d.clientas.total, 3);
  t.igual('una repite', r.d.clientas.repiten, 1);
  t.igual('reconocida por el teléfono, no por el nombre',
    r.d.clientas.top[0].tel, '3434000111');
  t.igual('con sus 2 pedidos', r.d.clientas.top[0].pedidos, 2);

  /* --- Rango --- */
  r = await pedir('?desde=2026-09-14&hasta=2026-09-20');
  t.igual('acotar el rango deja sólo esa semana', r.d.totales.pedidos, 1);

  r = await pedir('?desde=2026-09-30&hasta=2026-09-01');
  t.igual('rechaza un rango al revés', r.estado, 422);

  r = await pedir('?desde=2020-01-01&hasta=2020-01-31');
  t.igual('un período sin pedidos no rompe', r.estado, 200);
  t.igual('devuelve ceros, no nulls', r.d.totales.plata, 0);
  t.igual('y no inventa un crecimiento', r.d.crecimiento, null);

  db.close();
}
