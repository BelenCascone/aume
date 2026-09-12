-- =====================================================================
-- AUMÉ · Cambio 0007 · Los tres postres con fruta, con su precio
-- ---------------------------------------------------------------------
-- Para bases QUE YA EXISTEN. Las nuevas ya salen con esto desde
-- worker/db/semilla.sql.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0007_postres.sql
--
-- Entran los tres postres de verdad —ensalada de frutas, chía pudding y
-- yogur con granola—, los tres a $4.800, y se van los dos productos de
-- relleno del cambio 0003 ('postres' y 'yogures', "Próximamente"), que
-- nunca se pudieron vender porque estaban en activo = 0. Borrarlos no
-- toca ningún pedido viejo: pedido_items se guarda el nombre del plato
-- en su propia columna.
--
-- Correrlo dos veces no hace nada (INSERT OR IGNORE): si alguien ya le
-- cambió el precio o el texto desde el panel, ese precio manda.
-- =====================================================================

INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden, activo)
VALUES ('ensalada-frutas', 'postres', 'Ensalada de frutas',
        '400 g · Arándanos, frutilla, banana, durazno, mandarina, manzana y kiwi, con jugo de naranja natural.',
        4800, 1, 1);

INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden, activo)
VALUES ('chia-pudding', 'postres', 'Chía pudding',
        '350 g · Base de chía, mousse de yogur y arándanos, y fruta fresca con coco. Con miel o con stevia.',
        4800, 2, 1);

INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden, activo)
VALUES ('yogur-granola', 'yogures', 'Yogur con granola y frutas',
        '300 g · Yogur natural, granola de avena, semillas y frutos secos, y cinco frutas. Con miel o pasta de maní.',
        4800, 3, 1);

-- Las hamburguesas pasan al final para que en el panel se lean en el
-- mismo orden que en la web: postres, yogures y después congelados.
UPDATE productos SET orden = 4 WHERE id = 'burger8';

DELETE FROM productos WHERE id IN ('postres', 'yogures');

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (7, 'Los tres postres con fruta, con su precio');
