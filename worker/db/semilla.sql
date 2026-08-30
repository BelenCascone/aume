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
-- =====================================================================

-- --------------------------------------------------------- Categorías
INSERT OR IGNORE INTO categorias (id, nombre, descripcion, color, color_suave, orden, es_fija) VALUES
  ('clasico',     'Clásico',        'Los sabores de siempre, en su justa medida.',       'var(--c-clasico)',     'var(--c-clasico-suave)',     1, 0),
  ('vegetariano', 'Vegetariano',    'Base vegetal, completo y nutritivo.',               'var(--c-vegetariano)', 'var(--c-vegetariano-suave)', 2, 0),
  ('proteico',    'Proteico',       'Extra proteína para acompañar tu entrenamiento.',   'var(--c-proteico)',    'var(--c-proteico-suave)',    3, 0),
  ('ensalada',    'Ensalada',       'Fresco, liviano y lleno de color.',                 'var(--c-ensalada)',    'var(--c-ensalada-suave)',    4, 0),
  ('cesar',       'Ensalada César', 'Nuestro clásico de siempre, disponible todos los días.', 'var(--c-ensalada)', 'var(--c-ensalada-suave)', 5, 1);

-- ----------------------------------------------------------- Tamaños
INSERT OR IGNORE INTO tamanos (id, nombre, gramos, precio, orden) VALUES
  ('estandar', 'Menú del día',    '350gr',  9000, 1),
  ('xl',       'Menú del día XL', '500gr', 12800, 2);

-- -------------------------------------------------------------- Días
INSERT OR IGNORE INTO dias (id, nombre, orden) VALUES
  ('lunes',     'Lunes',     1),
  ('martes',    'Martes',    2),
  ('miercoles', 'Miércoles', 3),
  ('jueves',    'Jueves',    4),
  ('viernes',   'Viernes',   5);

-- ------------------------------------------------------------ Envíos
INSERT OR IGNORE INTO zonas_envio (id, nombre, costo, orden) VALUES
  ('dentro', 'Dentro de bulevares', 2000, 1),
  ('fuera',  'Fuera de bulevares',  2500, 2);

-- --------------------------------------------------- Puntos de retiro
INSERT OR IGNORE INTO puntos_retiro (id, nombre, direccion, horarios, orden) VALUES
  ('base',       'Local AUMÉ',              'San Martín 499',    '["12:00 a 14:00 hs"]',                      1),
  ('oximarket',  'Oxymarket',               'Blas Parera 3308',  '["12:30 a 13:30 hs","17:00 a 21:00 hs"]',   2),
  -- ⚠️ CONFIRMAR: hasta qué hora se puede retirar en Mes Amies
  ('mesamies',   'Pastelería Mes Amies',    'Shopping La Paz',   '["Desde las 12:00 hs"]',                    3);

-- --------------------------------------------------- Métodos de pago
INSERT OR IGNORE INTO metodos_pago (id, nombre, efectivo, orden) VALUES
  ('efectivo',      'Efectivo',              1, 1),
  ('transferencia', 'Transferencia bancaria', 0, 2),
  ('mercadopago',   'Mercado Pago',           0, 3);

-- --------------------------------------------------- Otros productos
INSERT OR IGNORE INTO productos (id, nombre, detalle, precio, orden) VALUES
  ('burger8', 'Hamburguesas de legumbres', 'Congeladas · Pack x8 unidades', 13000, 1);

-- ------------------------------------------------------------- Packs
INSERT OR IGNORE INTO packs (id, nombre, dias, envio_bonificado, orden) VALUES
  ('x5', 'Pack x5 días', 5, 1, 1),
  ('x4', 'Pack x4 días', 4, 1, 2),
  ('x3', 'Pack x3 días', 3, 1, 3);

INSERT OR IGNORE INTO packs_precios (pack_id, tamano_id, lista, efectivo) VALUES
  ('x5', 'estandar', 45000, 40500),
  ('x5', 'xl',       64000, 57600),
  ('x4', 'estandar', 36000, 32400),
  ('x4', 'xl',       51200, 46000),
  ('x3', 'estandar', 27000, 24300),
  ('x3', 'xl',       38400, 34500);

-- ------------------------------------------------------ Plan mensual
INSERT OR IGNORE INTO plan_mensual (id, mes, almuerzos, envio_bonificado, descuento_efectivo)
VALUES (1, 'Septiembre', 22, 0, '15%');

-- El XL mensual todavía no está publicado: va en NULL y la web no lo muestra.
INSERT OR IGNORE INTO plan_mensual_precios (tamano_id, lista, efectivo) VALUES
  ('estandar', 198000, 168300),
  ('xl',       NULL,   NULL);

-- ----------------------------------------------------------- Ajustes
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES
  ('whatsapp',                  '5493435038054'),
  ('envio_aclaracion',          'Coordinamos el horario de entrega por WhatsApp.'),
  ('packs_envio_bonificado',    '1'),
  ('packs_descuento_efectivo',  '10%'),
  ('menu_nota',                 'Los pedidos de la semana se reciben hasta el domingo a las 20:00 hs.'),
  ('marca_nombre',              'AUMÉ'),
  ('marca_lema',                'El equilibrio perfecto entre nutrirse y comer rico'),
  ('marca_origen',              'Del latín «Aurea Mediocritas»: la justa medida entre dos extremos.'),
  ('marca_ciudad',              'Paraná, Entre Ríos'),
  ('marca_instagram',           'aume.viandas'),
  ('marca_instagram_url',       'https://instagram.com/aume.viandas');


-- =====================================================================
-- MENÚ DE EJEMPLO · semana del 31/08 al 04/09
-- ---------------------------------------------------------------------
-- Es el menú que hoy está publicado en assets/js/data/menu.js. Sirve para
-- probar el panel y la landing contra datos reales desde el día uno.
-- Queda en estado 'publicado' para que la landing lo pueda consumir.
-- =====================================================================

INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, publicado_en) VALUES
  ('2026-08-31', 'lunes',     '2026-08', 'publicado', datetime('now')),
  ('2026-09-01', 'martes',    '2026-09', 'publicado', datetime('now')),
  ('2026-09-02', 'miercoles', '2026-09', 'publicado', datetime('now')),
  ('2026-09-03', 'jueves',    '2026-09', 'publicado', datetime('now')),
  ('2026-09-04', 'viernes',   '2026-09', 'publicado', datetime('now'));

-- Un INSERT por día. Antes esto era un solo INSERT ... SELECT encadenando
-- 20 SELECT con UNION ALL, y D1 lo rechazaba con "too many terms in
-- compound SELECT": su límite de términos en un SELECT compuesto es más
-- bajo que el del SQLite de escritorio, así que andaba en la prueba local
-- y fallaba contra la base de verdad. Sin UNION no hay límite que romper,
-- y de paso se lee mucho mejor.

-- LUNES · 2026-08-31 ------------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas) VALUES
  ((SELECT id FROM menus WHERE fecha = '2026-08-31'), 'clasico', 'Milanesa de ternera al horno con puré rústico',
   'Milanesa horneada con costra de avena y puré de papa y calabaza.', '["Sin fritura"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-08-31'), 'vegetariano', 'Tarta de calabaza, puerro y queso',
   'Masa casera integral con relleno cremoso de calabaza asada.', '["Vegetariano"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-08-31'), 'proteico', 'Pollo grillado con quinoa y vegetales asados',
   'Suprema marinada en hierbas sobre quinoa y mix de estación.', '["Alto en proteína","Sin TACC"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-08-31'), 'ensalada', 'César de pollo',
   'Lechuga, pollo grillado, croutons, queso y aderezo césar liviano.', '["Fresca"]');

-- MARTES · 2026-09-01 -----------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas) VALUES
  ((SELECT id FROM menus WHERE fecha = '2026-09-01'), 'clasico', 'Pastel de papas',
   'Carne cortada a cuchillo con cubierta de papa y batata.', '[]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-01'), 'vegetariano', 'Wok de vegetales con arroz yamaní',
   'Salteado de vegetales de estación con salsa de soja y jengibre.', '["Vegano"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-01'), 'proteico', 'Salmón rosado con puré de coliflor',
   'Al horno con limón y eneldo, sobre puré liviano de coliflor.', '["Omega 3","Sin TACC"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-01'), 'ensalada', 'Mediterránea con garbanzos',
   'Garbanzos, tomate, pepino, aceitunas, queso y oliva.', '["Vegetariana"]');

-- MIÉRCOLES · 2026-09-02 --------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas) VALUES
  ((SELECT id FROM menus WHERE fecha = '2026-09-02'), 'clasico', 'Canelones de carne y verdura',
   'Con salsa de tomate casera y un toque de queso gratinado.', '[]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-02'), 'vegetariano', 'Ñoquis de calabaza con salsa fileto',
   'Ñoquis caseros de calabaza con albahaca fresca.', '["Vegetariano"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-02'), 'proteico', 'Bowl de carne magra, boniato y brócoli',
   'Cubos de nalga salteados con boniato asado y brócoli al vapor.', '["Alto en proteína"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-02'), 'ensalada', 'Verde con atún y huevo',
   'Mix de hojas, atún, huevo, tomate cherry y semillas.', '["Sin TACC"]');

-- JUEVES · 2026-09-03 -----------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas) VALUES
  ((SELECT id FROM menus WHERE fecha = '2026-09-03'), 'clasico', 'Pollo al verdeo con arroz primavera',
   'Pechuga en salsa de verdeo liviana y arroz con vegetales.', '[]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-03'), 'vegetariano', 'Hamburguesas de lentejas con puré de zanahoria',
   'Burgers caseras de lenteja y avena, horneadas.', '["Vegano","Fuente de fibra"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-03'), 'proteico', 'Omelette de claras con vegetales y pavita',
   'Relleno de espinaca, morrón y pavita, con ensalada tibia.', '["Alto en proteína","Sin TACC"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-03'), 'ensalada', 'Caprese con quinoa',
   'Tomate, muzzarella, albahaca y quinoa con oliva.', '["Vegetariana"]');

-- VIERNES · 2026-09-04 ----------------------------------------------
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas) VALUES
  ((SELECT id FROM menus WHERE fecha = '2026-09-04'), 'clasico', 'Lasaña de carne y bechamel',
   'Capas de pasta fresca, carne y bechamel casera.', '[]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-04'), 'vegetariano', 'Zapallitos rellenos con arroz integral',
   'Rellenos de vegetales, arroz integral y queso gratinado.', '["Vegetariano"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-04'), 'proteico', 'Merluza al horno con ensalada de legumbres',
   'Filet de merluza con provenzal y ensalada tibia de porotos.', '["Alto en proteína","Sin TACC"]'),
  ((SELECT id FROM menus WHERE fecha = '2026-09-04'), 'ensalada', 'Thai de pollo y repollo',
   'Repollo, zanahoria, pollo, maní y aderezo de lima y jengibre.', '["Fresca"]');
