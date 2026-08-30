/* =====================================================================
   AUMÉ · El esquema y la semilla aplicados de verdad
   ---------------------------------------------------------------------
   Corre schema.sql y semilla.sql sobre una base SQLite en memoria y
   revisa que quede lo que tiene que quedar.

   Ojo: el SQLite de acá es MÁS PERMISIVO que D1. Que este grupo pase no
   garantiza que D1 lo acepte; de eso se ocupa sql-limites.mjs.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'sql-datos · el esquema y la semilla contra SQLite';

let DatabaseSync = null;

export async function disponible() {
  try {
    ({ DatabaseSync } = await import('node:sqlite'));
    return null;
  } catch (e) {
    return 'esta versión de Node no trae node:sqlite (hace falta Node 22 o más nuevo)';
  }
}

export function correr(t) {
  const leer = (f) => readFileSync(path.join(t.raiz, 'worker', 'db', f), 'utf8');
  const db = new DatabaseSync(':memory:');
  const q = (sql) => db.prepare(sql).all();
  const uno = (sql) => q(sql)[0];

  db.exec(leer('schema.sql'));
  t.ok('schema.sql se aplica', true);

  db.exec(leer('semilla.sql'));
  t.ok('semilla.sql se aplica', true);

  /* Se corren de nuevo: tienen que poder repetirse sin romper ni duplicar */
  db.exec(leer('schema.sql'));
  db.exec(leer('semilla.sql'));
  t.ok('los dos son idempotentes (segunda corrida sin errores)', true);

  const contar = (tabla) => uno('SELECT COUNT(*) AS c FROM ' + tabla).c;

  t.igual('5 categorías (4 menús + la Ensalada César)', contar('categorias'), 5);
  t.igual('la César está marcada como fija',
    uno("SELECT es_fija AS f FROM categorias WHERE id='cesar'").f, 1);
  t.igual('2 tamaños', contar('tamanos'), 2);
  t.igual('5 días', contar('dias'), 5);
  t.igual('3 puntos de retiro', contar('puntos_retiro'), 3);
  t.igual('11 ajustes', contar('ajustes'), 11);

  /* Los precios que hoy están publicados en config.js */
  t.igual('precio de la vianda por tamaño',
    q('SELECT id, precio FROM tamanos ORDER BY orden'),
    [{ id: 'estandar', precio: 9000 }, { id: 'xl', precio: 12800 }]);

  t.igual('costo del envío por zona',
    q('SELECT id, costo FROM zonas_envio ORDER BY orden'),
    [{ id: 'dentro', costo: 2000 }, { id: 'fuera', costo: 2500 }]);

  t.igual('el pack x5 estándar mantiene su precio de lista y efectivo',
    uno("SELECT lista, efectivo FROM packs_precios WHERE pack_id='x5' AND tamano_id='estandar'"),
    { lista: 45000, efectivo: 40500 });

  /* El XL mensual todavía no se publicó: va en NULL para que la web no lo muestre */
  t.igual('el plan mensual XL queda sin precio',
    uno("SELECT lista, efectivo FROM plan_mensual_precios WHERE tamano_id='xl'"),
    { lista: null, efectivo: null });

  t.igual('el número de WhatsApp',
    uno("SELECT valor AS v FROM ajustes WHERE clave='whatsapp'").v, '5493435038054');

  /* Menú: 5 días × 4 tipos */
  t.igual('5 días de menú cargados', contar('menus'), 5);
  t.igual('20 platos (5 días × 4 tipos)', contar('menu_platos'), 20);
  t.igual('el menú de ejemplo queda publicado',
    contar("menus WHERE estado='publicado'"), 5);
  t.igual('los menús quedan agrupados por mes',
    q('SELECT mes, COUNT(*) AS dias FROM menus GROUP BY mes ORDER BY mes'),
    [{ mes: '2026-08', dias: 1 }, { mes: '2026-09', dias: 4 }]);
  t.igual('el lunes tiene los 4 tipos',
    q("SELECT categoria_id AS c FROM menu_platos WHERE menu_id=(SELECT id FROM menus WHERE fecha='2026-08-31') ORDER BY categoria_id").map((r) => r.c),
    ['clasico', 'ensalada', 'proteico', 'vegetariano']);

  /* Las restricciones tienen que morder: son la última defensa contra
     datos inventados entrando por la API. */
  const frena = (etiqueta, sql) => {
    let frenó = false;
    try { db.exec(sql); } catch (e) { frenó = true; }
    t.ok('la base rechaza ' + etiqueta, frenó);
  };

  frena('un canal que no es app ni whatsapp',
    "INSERT INTO pedidos (fecha_local, canal) VALUES ('2026-09-01','instagram')");
  frena('un estado de menú inventado',
    "INSERT INTO menus (fecha, dia_id, mes, estado) VALUES ('2026-09-07','lunes','2026-09','archivado')");
  frena('dos menús para la misma fecha',
    "INSERT INTO menus (fecha, dia_id, mes) VALUES ('2026-08-31','lunes','2026-08')");
  frena('dos platos de la misma categoría en un día',
    "INSERT INTO menu_platos (menu_id, categoria_id) VALUES ((SELECT id FROM menus WHERE fecha='2026-08-31'),'clasico')");
  frena('un precio negativo',
    "INSERT INTO tamanos (id, nombre, precio) VALUES ('mini','Mini',-5)");

  /* Sin esto, un doble toque en el checkout registra el pedido dos veces */
  db.exec("INSERT INTO pedidos (fecha_local, canal, clave_idem) VALUES ('2026-09-01','app','abc123')");
  frena('el mismo pedido dos veces (clave_idem)',
    "INSERT INTO pedidos (fecha_local, canal, clave_idem) VALUES ('2026-09-01','app','abc123')");

  /* Borrar un pedido tiene que llevarse sus líneas */
  db.exec("INSERT INTO pedido_items (pedido_id, categoria_id, tamano_id, cantidad) " +
          "VALUES ((SELECT id FROM pedidos WHERE clave_idem='abc123'),'clasico','estandar',2)");
  db.exec("DELETE FROM pedidos WHERE clave_idem='abc123'");
  t.igual('borrar un pedido borra sus líneas', contar('pedido_items'), 0);

  db.close();
}
