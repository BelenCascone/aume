-- =====================================================================
-- AUMÉ · Datos iniciales de la base D1
-- ---------------------------------------------------------------------
-- Copia exacta de lo que hoy vive en assets/js/data/config.js y
-- assets/js/data/menu.js, para arrancar la base con los datos reales.
--
-- Es IDEMPOTENTE (INSERT OR IGNORE): correrlo dos veces no pisa nada que
-- ya hayan editado desde el panel. Si querés forzar los valores
-- originales de fábrica, hay que borrar la fila primero.
--
--   npx wrangler d1 execute aume-staging --local  --file=worker/db/semilla.sql
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/semilla.sql
--
-- Correr SIEMPRE después de worker/db/schema.sql.
--
-- ⚠️ UNA FILA POR INSERT, A PROPÓSITO
-- ---------------------------------------------------------------------
-- Puede parecer repetitivo, pero no se junta en INSERT de varias filas.
-- En SQLite, un "VALUES (a),(b),(c)" se compila internamente como un
-- SELECT compuesto (a UNION ALL b UNION ALL c), y D1 tolera muchos menos
-- términos que el SQLite de escritorio: falla con
--
--     ERROR  too many terms in compound SELECT: SQLITE_ERROR
--
-- Eso hace que un archivo que anda perfecto en la prueba local reviente
-- contra la base de verdad. Con una fila por statement no hay ningún
-- SELECT compuesto y el límite no existe. Lo mismo vale para cualquier
-- .sql que se agregue después.
-- =====================================================================


-- --- Categorías ---------------------------------------------------
-- Los 4 tipos de menú + la Ensalada César, que va todos los días (es_fija = 1).
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, color, color_suave, orden, es_fija) VALUES ('clasico', 'Clásico', 'Los sabores de siempre, en su justa medida.', 'var(--c-clasico)', 'var(--c-clasico-suave)', 1, 0);
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, color, color_suave, orden, es_fija) VALUES ('vegetariano', 'Vegetariano', 'Base vegetal, completo y nutritivo.', 'var(--c-vegetariano)', 'var(--c-vegetariano-suave)', 2, 0);
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, color, color_suave, orden, es_fija) VALUES ('proteico', 'Proteico', 'Extra proteína para acompañar tu entrenamiento.', 'var(--c-proteico)', 'var(--c-proteico-suave)', 3, 0);
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, color, color_suave, orden, es_fija) VALUES ('ensalada', 'Ensalada', 'Fresco, liviano y lleno de color.', 'var(--c-ensalada)', 'var(--c-ensalada-suave)', 4, 0);
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, color, color_suave, orden, es_fija) VALUES ('cesar', 'Ensalada César', 'Nuestro clásico de siempre, disponible todos los días.', 'var(--c-ensalada)', 'var(--c-ensalada-suave)', 5, 1);

-- --- Tamaños ------------------------------------------------------
-- El precio de la vianda depende SOLO del tamaño, no del tipo de menú.
INSERT OR IGNORE INTO tamanos (id, nombre, gramos, precio, orden) VALUES ('estandar', 'Menú del día', '350gr', 9000, 1);
INSERT OR IGNORE INTO tamanos (id, nombre, gramos, precio, orden) VALUES ('xl', 'Menú del día XL', '500gr', 12800, 2);

-- --- Días ---------------------------------------------------------
INSERT OR IGNORE INTO dias (id, nombre, orden) VALUES ('lunes', 'Lunes', 1);
INSERT OR IGNORE INTO dias (id, nombre, orden) VALUES ('martes', 'Martes', 2);
INSERT OR IGNORE INTO dias (id, nombre, orden) VALUES ('miercoles', 'Miércoles', 3);
INSERT OR IGNORE INTO dias (id, nombre, orden) VALUES ('jueves', 'Jueves', 4);
INSERT OR IGNORE INTO dias (id, nombre, orden) VALUES ('viernes', 'Viernes', 5);

-- --- Envíos -------------------------------------------------------
INSERT OR IGNORE INTO zonas_envio (id, nombre, costo, orden) VALUES ('dentro', 'Dentro de bulevares', 2000, 1);
INSERT OR IGNORE INTO zonas_envio (id, nombre, costo, orden) VALUES ('fuera', 'Fuera de bulevares', 2500, 2);

-- --- Puntos de retiro ---------------------------------------------
INSERT OR IGNORE INTO puntos_retiro (id, nombre, direccion, horarios, orden) VALUES ('base', 'Local AUMÉ', 'San Martín 499', '["12:00 a 14:00 hs"]', 1);
INSERT OR IGNORE INTO puntos_retiro (id, nombre, direccion, horarios, orden) VALUES ('oximarket', 'Oxymarket', 'Blas Parera 3308', '["12:30 a 13:30 hs","17:00 a 21:00 hs"]', 2);
-- ⚠️ CONFIRMAR: hasta qué hora se puede retirar en Mes Amies
INSERT OR IGNORE INTO puntos_retiro (id, nombre, direccion, horarios, orden) VALUES ('mesamies', 'Pastelería Mes Amies', 'Shopping La Paz', '["Desde las 12:00 hs"]', 3);

-- --- Métodos de pago ----------------------------------------------
-- efectivo = 1 marca los pagos que acceden al descuento.
INSERT OR IGNORE INTO metodos_pago (id, nombre, efectivo, orden) VALUES ('efectivo', 'Efectivo', 1, 1);
INSERT OR IGNORE INTO metodos_pago (id, nombre, efectivo, orden) VALUES ('transferencia', 'Transferencia bancaria', 0, 2);
INSERT OR IGNORE INTO metodos_pago (id, nombre, efectivo, orden) VALUES ('mercadopago', 'Mercado Pago', 0, 3);

-- --- Otros productos ----------------------------------------------
-- Se suman al pedido por unidad. "grupo" es cómo se ordenan en la
-- pantalla "Para sumar" de la web.
--
-- ⚠️ NOMBRES Y PRECIOS A CONFIRMAR en los postres y los yogures: van de
--    ejemplo y tienen que coincidir con assets/js/data/config.js.
INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden) VALUES ('burger8', 'congelados', 'Hamburguesas de legumbres', 'Congeladas · Pack x8 unidades', 13000, 10);
INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden) VALUES ('postre-flan', 'postres', 'Flan casero', 'Porción individual', 3500, 1);
INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden) VALUES ('postre-budin', 'postres', 'Budín de limón', 'Porción individual', 3500, 2);
INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden) VALUES ('yogur-natural', 'yogures', 'Yogur natural', 'Pote individual', 2800, 3);
INSERT OR IGNORE INTO productos (id, grupo, nombre, detalle, precio, orden) VALUES ('yogur-granola', 'yogures', 'Yogur con granola', 'Pote individual con granola casera', 3200, 4);

-- --- Packs semanales ----------------------------------------------
-- Los packs llevan el envío bonificado. El precio efectivo va tal cual
-- está publicado (redondeado a mano en algunos casos): NO se calcula.
INSERT OR IGNORE INTO packs (id, nombre, dias, envio_bonificado, orden) VALUES ('x5', 'Pack x5 días', 5, 1, 1);
INSERT OR IGNORE INTO packs (id, nombre, dias, envio_bonificado, orden) VALUES ('x4', 'Pack x4 días', 4, 1, 2);
INSERT OR IGNORE INTO packs (id, nombre, dias, envio_bonificado, orden) VALUES ('x3', 'Pack x3 días', 3, 1, 3);

INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES ('x5', 'estandar', 45000, 40500);
INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES ('x5', 'xl', 64000, 57600);
INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES ('x4', 'estandar', 36000, 32400);
INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES ('x4', 'xl', 51200, 46000);
INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES ('x3', 'estandar', 27000, 24300);
INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES ('x3', 'xl', 38400, 34500);

-- --- Plan mensual -------------------------------------------------
-- Cambia todos los meses porque cambia la cantidad de días hábiles.
INSERT OR IGNORE INTO plan_mensual (id, mes, almuerzos, envio_bonificado, descuento_efectivo) VALUES (1, 'Septiembre', 22, 0, '15%');

-- El XL mensual todavía no está publicado: va en NULL y la web no lo muestra.
INSERT OR IGNORE INTO plan_mensual_precios (tamano_id, lista, efectivo) VALUES ('estandar', 198000, 168300);
INSERT OR IGNORE INTO plan_mensual_precios (tamano_id, lista, efectivo) VALUES ('xl', NULL, NULL);

-- --- Ajustes sueltos de la marca y del negocio --------------------
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('whatsapp', '5493435038054');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('envio_aclaracion', 'Coordinamos el horario de entrega por WhatsApp.');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('packs_envio_bonificado', '1');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('packs_descuento_efectivo', '10%');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('menu_nota', 'Los pedidos de la semana se reciben hasta el domingo a las 20:00 hs.');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('marca_nombre', 'AUMÉ');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('marca_lema', 'El equilibrio perfecto entre nutrirse y comer rico');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('marca_origen', 'Del latín «Aurea Mediocritas»: la justa medida entre dos extremos.');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('marca_ciudad', 'Paraná, Entre Ríos');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('marca_instagram', 'aume.viandas');
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('marca_instagram_url', 'https://instagram.com/aume.viandas');


-- =====================================================================
-- MENÚ DE EJEMPLO · semana del 31/08 al 04/09
-- ---------------------------------------------------------------------
-- Es el menú que hoy está publicado en assets/js/data/menu.js. Sirve
-- para probar el panel y la landing contra datos reales desde el día
-- uno. Queda 'publicado' para que la landing lo pueda consumir.
-- =====================================================================

INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES ('2026-08-31', 'lunes', '2026-08', 'publicado', datetime('now'));
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES ('2026-09-01', 'martes', '2026-09', 'publicado', datetime('now'));
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES ('2026-09-02', 'miercoles', '2026-09', 'publicado', datetime('now'));
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES ('2026-09-03', 'jueves', '2026-09', 'publicado', datetime('now'));
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES ('2026-09-04', 'viernes', '2026-09', 'publicado', datetime('now'));

-- --- LUNES · 2026-08-31 -------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'clasico', 'Milanesa de ternera al horno con puré rústico',
       'Milanesa horneada con costra de avena y puré de papa y calabaza.', '["Sin fritura"]'
  FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'vegetariano', 'Tarta de calabaza, puerro y queso',
       'Masa casera integral con relleno cremoso de calabaza asada.', '["Vegetariano"]'
  FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'proteico', 'Pollo grillado con quinoa y vegetales asados',
       'Suprema marinada en hierbas sobre quinoa y mix de estación.', '["Alto en proteína","Sin TACC"]'
  FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'ensalada', 'César de pollo',
       'Lechuga, pollo grillado, croutons, queso y aderezo césar liviano.', '["Fresca"]'
  FROM menus WHERE fecha = '2026-08-31';

-- --- MARTES · 2026-09-01 ------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'clasico', 'Pastel de papas',
       'Carne cortada a cuchillo con cubierta de papa y batata.', '[]'
  FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'vegetariano', 'Wok de vegetales con arroz yamaní',
       'Salteado de vegetales de estación con salsa de soja y jengibre.', '["Vegano"]'
  FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'proteico', 'Salmón rosado con puré de coliflor',
       'Al horno con limón y eneldo, sobre puré liviano de coliflor.', '["Omega 3","Sin TACC"]'
  FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'ensalada', 'Mediterránea con garbanzos',
       'Garbanzos, tomate, pepino, aceitunas, queso y oliva.', '["Vegetariana"]'
  FROM menus WHERE fecha = '2026-09-01';

-- --- MIÉRCOLES · 2026-09-02 ---------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'clasico', 'Canelones de carne y verdura',
       'Con salsa de tomate casera y un toque de queso gratinado.', '[]'
  FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'vegetariano', 'Ñoquis de calabaza con salsa fileto',
       'Ñoquis caseros de calabaza con albahaca fresca.', '["Vegetariano"]'
  FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'proteico', 'Bowl de carne magra, boniato y brócoli',
       'Cubos de nalga salteados con boniato asado y brócoli al vapor.', '["Alto en proteína"]'
  FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'ensalada', 'Verde con atún y huevo',
       'Mix de hojas, atún, huevo, tomate cherry y semillas.', '["Sin TACC"]'
  FROM menus WHERE fecha = '2026-09-02';

-- --- JUEVES · 2026-09-03 ------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'clasico', 'Pollo al verdeo con arroz primavera',
       'Pechuga en salsa de verdeo liviana y arroz con vegetales.', '[]'
  FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'vegetariano', 'Hamburguesas de lentejas con puré de zanahoria',
       'Burgers caseras de lenteja y avena, horneadas.', '["Vegano","Fuente de fibra"]'
  FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'proteico', 'Omelette de claras con vegetales y pavita',
       'Relleno de espinaca, morrón y pavita, con ensalada tibia.', '["Alto en proteína","Sin TACC"]'
  FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'ensalada', 'Caprese con quinoa',
       'Tomate, muzzarella, albahaca y quinoa con oliva.', '["Vegetariana"]'
  FROM menus WHERE fecha = '2026-09-03';

-- --- VIERNES · 2026-09-04 -----------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'clasico', 'Lasaña de carne y bechamel',
       'Capas de pasta fresca, carne y bechamel casera.', '[]'
  FROM menus WHERE fecha = '2026-09-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'vegetariano', 'Zapallitos rellenos con arroz integral',
       'Rellenos de vegetales, arroz integral y queso gratinado.', '["Vegetariano"]'
  FROM menus WHERE fecha = '2026-09-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'proteico', 'Merluza al horno con ensalada de legumbres',
       'Filet de merluza con provenzal y ensalada tibia de porotos.', '["Alto en proteína","Sin TACC"]'
  FROM menus WHERE fecha = '2026-09-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
SELECT id, 'ensalada', 'Thai de pollo y repollo',
       'Repollo, zanahoria, pollo, maní y aderezo de lima y jengibre.', '["Fresca"]'
  FROM menus WHERE fecha = '2026-09-04';
