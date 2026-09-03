-- =====================================================================
-- AUMÉ · worker/db/demo-borrar.sql
-- Saca de la base todo lo que cargó demo.sql y no toca nada más.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/demo-borrar.sql
--
-- Sirve para dejar staging limpia después de una demo, o para arrancar
-- de cero si los datos inventados quedaron mezclados con pruebas reales.
--
-- Se apoya en una convención: TODO lo de demo lleva id >= 9000, y los
-- ids bajos los reparte la base sola cuando se carga algo desde el
-- panel. Por eso esto no puede llevarse puesto un pedido de verdad.
--
-- ⚠️ Los MENÚS no se borran acá, a propósito. demo.sql los inserta con
-- INSERT OR IGNORE y no distingue los suyos de los que puedas haber
-- escrito vos desde el panel: borrar por rango de fechas se llevaría los
-- dos. Un menú de más no molesta a nadie; uno perdido sí.
-- =====================================================================

DELETE FROM pedido_items WHERE pedido_id >= 9000;
DELETE FROM pedidos      WHERE id >= 9000;
DELETE FROM cotizaciones WHERE id >= 9000;

DELETE FROM publicaciones WHERE id = 'tres-mitos-sobre-comer-liviano';
DELETE FROM publicaciones WHERE id = 'como-armamos-el-menu-del-mes';
DELETE FROM publicaciones WHERE id = 'budin-de-banana-y-avena';
DELETE FROM publicaciones WHERE id = 'por-que-cocinamos-el-mismo-dia';
DELETE FROM publicaciones WHERE id = 'guia-de-porciones-para-la-semana';
DELETE FROM publicaciones WHERE id = 'ensalada-de-lentejas-y-calabaza';
