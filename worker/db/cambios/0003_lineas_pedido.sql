-- =====================================================================
-- AUMÉ · Cambio 0003 · Promos, plan mensual y productos en el pedido
-- ---------------------------------------------------------------------
-- Para bases QUE YA EXISTEN. Las nuevas ya salen con esto desde
-- worker/db/schema.sql, así que este archivo no hace falta ahí.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0003_lineas_pedido.sql
--
-- Hasta acá una línea de pedido era siempre una vianda: día + tipo de
-- menú + tamaño. Ahora la web también deja pedir promos semanales, el
-- plan mensual y productos sueltos (postres, yogures, congelados), así
-- que cada línea necesita decir QUÉ es y contra qué precio se cobró.
--
--   tipo        'vianda' | 'pack' | 'plan' | 'extra'
--   ref_id      id del pack o del producto ('' en las viandas)
--   preferencia tipo de menú elegido en un pack o en el plan mensual,
--               donde no se elige plato por plato ('' en las viandas)
--
-- Los pedidos viejos quedan como 'vianda', que es exactamente lo que
-- eran: nada del historial cambia de significado.
--
-- Correrlo dos veces da "duplicate column name". Eso significa que ya
-- estaba aplicado: no es un problema.
-- =====================================================================

ALTER TABLE pedido_items ADD COLUMN tipo        TEXT NOT NULL DEFAULT 'vianda';
ALTER TABLE pedido_items ADD COLUMN ref_id      TEXT NOT NULL DEFAULT '';
ALTER TABLE pedido_items ADD COLUMN preferencia TEXT NOT NULL DEFAULT '';

-- Los productos se agrupan en la pantalla "Para sumar" de la web.
ALTER TABLE productos ADD COLUMN grupo TEXT NOT NULL DEFAULT '';

UPDATE productos SET grupo = 'congelados' WHERE id = 'burger8' AND grupo = '';

-- Postres y yogures.
-- ⚠️ NOMBRES Y PRECIOS A CONFIRMAR: van cargados de ejemplo para que la
--    pantalla tenga algo que mostrar. Se corrigen desde el panel o con
--    un UPDATE, y tienen que coincidir con assets/js/data/config.js.
INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden) VALUES
  ('postre-flan',   'postres', 'Flan casero',       'Porción individual',                  3500, 2),
  ('postre-budin',  'postres', 'Budín de limón',    'Porción individual',                  3500, 3),
  ('yogur-natural', 'yogures', 'Yogur natural',     'Pote individual',                     2800, 4),
  ('yogur-granola', 'yogures', 'Yogur con granola', 'Pote individual con granola casera',  3200, 5);

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (3, 'Promos, plan mensual y productos como líneas del pedido');
