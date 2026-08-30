-- =====================================================================
-- AUMÉ · Cambio 0002 · Días feriados en el menú
-- ---------------------------------------------------------------------
-- Para bases QUE YA EXISTEN. Las nuevas ya salen con esto desde
-- worker/db/schema.sql, así que este archivo no hace falta ahí.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0002_feriados.sql
--
-- La nutri arma el menú del mes por semanas y marca los feriados
-- escribiendo "feriado" en su planilla. Antes eso no se podía
-- representar: un día sin platos se veía igual que un día sin cargar.
--
-- Correrlo dos veces da "duplicate column name: feriado". Eso significa
-- que ya estaba aplicado: no es un problema.
-- =====================================================================

ALTER TABLE menus ADD COLUMN feriado INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (2, 'Días feriados en el menú');
