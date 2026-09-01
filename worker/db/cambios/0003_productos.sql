-- =====================================================================
-- AUMÉ · Cambio 0003 · Postres y yogures como productos sin precio
-- ---------------------------------------------------------------------
-- Para bases QUE YA EXISTEN. Las nuevas ya salen con esto desde
-- worker/db/semilla.sql.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0003_productos.sql
--
-- Los dos entran con activo = 0: existen en el panel para poder ponerles
-- precio, pero la web no los muestra hasta que lo tengan. Correrlo dos
-- veces no hace nada (INSERT OR IGNORE).
-- =====================================================================

INSERT OR IGNORE INTO productos (id, nombre, detalle, precio, orden, activo)
VALUES ('postres', 'Postres', 'Próximamente', 0, 2, 0);

INSERT OR IGNORE INTO productos (id, nombre, detalle, precio, orden, activo)
VALUES ('yogures', 'Yogures', 'Próximamente', 0, 3, 0);

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (3, 'Postres y yogures como productos sin precio');
