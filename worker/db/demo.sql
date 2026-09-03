-- =====================================================================
-- AUMÉ · worker/db/demo.sql   ·   DATOS FICTICIOS PARA LA DEMO
-- ---------------------------------------------------------------------
-- ⚠️ ESTO VA SÓLO A STAGING. Nunca a producción.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/demo.sql
--
-- Para qué existe: con la base recién sembrada el panel se ve vacío
-- —estadísticas en cero, la tabla de pedidos sin una fila— y así no se
-- puede mostrar cómo funciona. Esto la llena con un mes de movimiento
-- inventado: pedidos, clientas que repiten, consultas de empresas y
-- menús cargados.
--
-- Nada de lo que hay acá es real. Los nombres son inventados y los
-- teléfonos usan el prefijo 555, que no existe en Argentina, para que
-- no le suene el teléfono a nadie por accidente.
--
-- ⚠️ ESTE ARCHIVO NO SE EDITA A MANO: lo escribe generar-demo.mjs, y
-- las fechas salen relativas al día en que se generó. Si la demo es
-- otro día, hay que volver a generarlo o el tablero va a mostrar los
-- últimos días vacíos:
--
--   node worker/db/generar-demo.mjs > worker/db/demo.sql
--
-- SE PUEDE CORRER TODAS LAS VECES QUE HAGA FALTA. Arranca borrando lo
-- que dejó la corrida anterior, así no se acumulan pedidos repetidos.
--
-- Para dejar la base limpia otra vez:
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/demo-borrar.sql
--
-- Los pedidos y las cotizaciones de demo llevan id >= 9000 a propósito:
-- es lo que permite borrarlos sin tocar nada cargado a mano desde el
-- panel, que usa los ids bajos que asigna la base sola.
--
-- Generado el 2026-09-03.
-- =====================================================================

-- --------------------------------------------------------------------
-- LIMPIEZA de la corrida anterior
-- --------------------------------------------------------------------
DELETE FROM pedido_items WHERE pedido_id >= 9000;
DELETE FROM pedidos      WHERE id >= 9000;
DELETE FROM cotizaciones WHERE id >= 9000;

-- --------------------------------------------------------------------
-- MENÚS · el mes pasado, esta semana, la que viene y un borrador
-- --------------------------------------------------------------------
-- Van con INSERT OR IGNORE y no se borran al regenerar: si una fecha
-- ya tiene menú cargado (el de semilla.sql, o uno que hayas escrito
-- vos desde el panel), este archivo no lo pisa.
--
-- El lunes de la semana 2026-08-10 va marcado como feriado a
-- propósito: un feriado es el único día que se puede publicar sin
-- ningún plato, y es un caso que conviene poder mostrar.

-- Semana del 2026-08-03
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-03', 'lunes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Milanesa de ternera al horno con puré rústico',
         'Milanesa horneada con costra de avena y puré de papa y calabaza.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-08-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tarta de calabaza, puerro y queso',
         'Masa casera integral con relleno cremoso de calabaza asada.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo grillado con quinoa y vegetales asados',
         'Suprema marinada en hierbas sobre quinoa y mix de estación.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'César de pollo',
         'Lechuga, pollo grillado, croutons, queso y aderezo liviano.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-08-03';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-04', 'martes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pastel de papas',
         'Carne cortada a cuchillo con cubierta de papa y batata.', '[]'
    FROM menus WHERE fecha = '2026-08-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Wok de vegetales con arroz yamaní',
         'Salteado de vegetales de estación con soja y jengibre.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-08-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Salmón rosado con puré de coliflor',
         'Al horno con limón y eneldo, sobre puré liviano.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Mediterránea con garbanzos',
         'Garbanzos, tomate, pepino, aceitunas, queso y oliva.', '["Vegetariana"]'
    FROM menus WHERE fecha = '2026-08-04';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-05', 'miercoles', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Canelones de carne y verdura',
         'Con salsa de tomate casera y un toque de queso gratinado.', '[]'
    FROM menus WHERE fecha = '2026-08-05';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Ñoquis de calabaza con salsa fileto',
         'Ñoquis caseros de calabaza con albahaca fresca.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-05';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Bowl de carne magra, boniato y brócoli',
         'Cubos de nalga salteados con boniato asado.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-08-05';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Caprese con quinoa',
         'Tomate, muzzarella, albahaca y quinoa.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-05';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-06', 'jueves', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pollo al verdeo con arroz',
         'Suprema en salsa de verdeo liviana y arroz largo fino.', '[]'
    FROM menus WHERE fecha = '2026-08-06';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Guiso de lentejas y calabaza',
         'Lentejas con calabaza, zanahoria y comino.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-08-06';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pechuga rellena con espinaca y queso',
         'Con ensalada tibia de vegetales asados.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-06';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Verde con atún y huevo',
         'Mix de hojas, atún, huevo duro y tomate cherry.', '["Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-06';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-07', 'viernes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Carne al horno con papas españolas',
         'Cuadrada de ternera braseada con papas y cebolla.', '[]'
    FROM menus WHERE fecha = '2026-08-07';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Milanesa de berenjena con puré',
         'Berenjena al horno rebozada en avena y sésamo.', '["Vegetariano","Sin fritura"]'
    FROM menus WHERE fecha = '2026-08-07';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Merluza al horno con vegetales',
         'Filete con limón, papas al natural y zanahoria.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-07';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Waldorf liviana',
         'Manzana verde, apio, nuez y pollo, con aderezo de yogur.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-08-07';

-- Semana del 2026-08-10
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-10', 'lunes', '2026-08', 'publicado', 1, 'Feriado · no se cocina', datetime('now'));
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-11', 'martes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Bife a la criolla con puré mixto',
         'Bife de cuadril con tomate, cebolla y morrón.', '[]'
    FROM menus WHERE fecha = '2026-08-11';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Budín de espinaca y ricota',
         'Con salsa liviana de tomate y albahaca.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-11';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Lomo salteado con arroz integral',
         'Lomo, morrón y cebolla salteados al wok.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-08-11';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De lentejas y vegetales asados',
         'Lentejas, calabaza, morrón y cebolla morada.', '["Vegana"]'
    FROM menus WHERE fecha = '2026-08-11';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-12', 'miercoles', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Empanadas de carne al horno',
         'Seis unidades, carne cortada a cuchillo, masa casera.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-08-12';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Curry de garbanzos con arroz',
         'Garbanzos en leche de coco con curry suave.', '["Vegano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-12';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Atún grillado con ensalada de quinoa',
         'Con tomate cherry, pepino y hojas verdes.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-12';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Griega con feta',
         'Pepino, tomate, aceituna, cebolla morada y queso feta.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-12';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-13', 'jueves', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Guiso de lentejas con carne',
         'Lentejas con chorizo colorado suave y verduras.', '[]'
    FROM menus WHERE fecha = '2026-08-13';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tarta de acelga y queso',
         'Masa integral con acelga salteada y ricota.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-13';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo al curry con arroz basmati',
         'Curry suave con leche de coco.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-13';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Tibia de pollo y batata',
         'Hojas verdes, pollo grillado y batata asada.', '["Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-13';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-14', 'viernes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Matambre a la pizza con puré',
         'Matambre tiernizado, salsa y muzzarella gratinada.', '[]'
    FROM menus WHERE fecha = '2026-08-14';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Zapallitos rellenos de quinoa',
         'Rellenos de quinoa, choclo y queso, al horno.', '["Vegetariano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-14';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Peceto al horno con puré de calabaza',
         'Cocción lenta, con hierbas frescas.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-14';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De arroz yamaní y vegetales',
         'Con zanahoria, choclo, arvejas y aderezo cítrico.', '["Vegana"]'
    FROM menus WHERE fecha = '2026-08-14';

-- Semana del 2026-08-17
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-17', 'lunes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pollo al limón con arroz yamaní',
         'Marinado en limón y romero, con arroz integral.', '[]'
    FROM menus WHERE fecha = '2026-08-17';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Lasaña de vegetales',
         'Capas de berenjena, zucchini y salsa bechamel liviana.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-17';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Bowl de pollo, huevo y palta',
         'Con arroz yamaní, huevo duro y palta.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-08-17';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Coleslaw con pollo',
         'Repollo, zanahoria y pollo con aderezo de yogur.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-08-17';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-18', 'martes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Albóndigas caseras con fideos',
         'Albóndigas de carne y avena en salsa fileto.', '[]'
    FROM menus WHERE fecha = '2026-08-18';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Hamburguesas de legumbres con puré',
         'De lentejas y avena, con puré de calabaza.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-08-18';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pescado a la provenzal con papas',
         'Filete con ajo, perejil y papas al horno.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-18';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De quinoa, palta y tomate',
         'Con semillas de girasol y limón.', '["Vegana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-18';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-19', 'miercoles', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Cerdo al horno con batatas',
         'Bondiola al horno con batatas asadas y romero.', '[]'
    FROM menus WHERE fecha = '2026-08-19';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Risotto de hongos',
         'Arroz carnaroli con hongos de pino y perejil.', '["Vegetariano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-19';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Wok de ternera y vegetales',
         'Tiras de ternera con brócoli, zanahoria y sésamo.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-08-19';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Primavera con huevo',
         'Lechuga, tomate, zanahoria, huevo y aceitunas.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-19';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-20', 'jueves', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Tortilla de papas con ensalada',
         'Tortilla jugosa de papa y cebolla, con ensalada mixta.', '[]'
    FROM menus WHERE fecha = '2026-08-20';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Empanadas de humita al horno',
         'Seis unidades de choclo cremoso y cebolla de verdeo.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-20';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo al horno con boniato',
         'Muslo deshuesado con boniato y romero.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-20';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'César de pollo',
         'Lechuga, pollo grillado, croutons, queso y aderezo liviano.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-08-20';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-21', 'viernes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Estofado de ternera con arroz',
         'Cocción lenta con zanahoria, arvejas y papa.', '[]'
    FROM menus WHERE fecha = '2026-08-21';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Fideos integrales al pesto',
         'Con pesto de albahaca, nuez y aceite de oliva.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-21';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Tortilla proteica de claras y espinaca',
         'Con ensalada de hojas y semillas.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-21';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Mediterránea con garbanzos',
         'Garbanzos, tomate, pepino, aceitunas, queso y oliva.', '["Vegetariana"]'
    FROM menus WHERE fecha = '2026-08-21';

-- Semana del 2026-08-24
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-24', 'lunes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Milanesa napolitana con puré',
         'Milanesa al horno con salsa, jamón y queso.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-08-24';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tortilla de zapallito y cebolla',
         'Jugosa, con ensalada de hojas verdes.', '["Vegetariano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-24';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Cerdo magro con puré de coliflor',
         'Solomillo de cerdo con hierbas.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-24';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Caprese con quinoa',
         'Tomate, muzzarella, albahaca y quinoa.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-24';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-25', 'martes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Milanesa de ternera al horno con puré rústico',
         'Milanesa horneada con costra de avena y puré de papa y calabaza.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-08-25';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tarta de calabaza, puerro y queso',
         'Masa casera integral con relleno cremoso de calabaza asada.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-25';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo grillado con quinoa y vegetales asados',
         'Suprema marinada en hierbas sobre quinoa y mix de estación.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-25';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Verde con atún y huevo',
         'Mix de hojas, atún, huevo duro y tomate cherry.', '["Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-25';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-26', 'miercoles', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pastel de papas',
         'Carne cortada a cuchillo con cubierta de papa y batata.', '[]'
    FROM menus WHERE fecha = '2026-08-26';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Wok de vegetales con arroz yamaní',
         'Salteado de vegetales de estación con soja y jengibre.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-08-26';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Salmón rosado con puré de coliflor',
         'Al horno con limón y eneldo, sobre puré liviano.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-26';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Waldorf liviana',
         'Manzana verde, apio, nuez y pollo, con aderezo de yogur.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-08-26';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-27', 'jueves', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Canelones de carne y verdura',
         'Con salsa de tomate casera y un toque de queso gratinado.', '[]'
    FROM menus WHERE fecha = '2026-08-27';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Ñoquis de calabaza con salsa fileto',
         'Ñoquis caseros de calabaza con albahaca fresca.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-08-27';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Bowl de carne magra, boniato y brócoli',
         'Cubos de nalga salteados con boniato asado.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-08-27';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De lentejas y vegetales asados',
         'Lentejas, calabaza, morrón y cebolla morada.', '["Vegana"]'
    FROM menus WHERE fecha = '2026-08-27';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-28', 'viernes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pollo al verdeo con arroz',
         'Suprema en salsa de verdeo liviana y arroz largo fino.', '[]'
    FROM menus WHERE fecha = '2026-08-28';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Guiso de lentejas y calabaza',
         'Lentejas con calabaza, zanahoria y comino.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-08-28';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pechuga rellena con espinaca y queso',
         'Con ensalada tibia de vegetales asados.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-28';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Griega con feta',
         'Pepino, tomate, aceituna, cebolla morada y queso feta.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-28';

-- Semana del 2026-08-31 · esta semana
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-08-31', 'lunes', '2026-08', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Carne al horno con papas españolas',
         'Cuadrada de ternera braseada con papas y cebolla.', '[]'
    FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Milanesa de berenjena con puré',
         'Berenjena al horno rebozada en avena y sésamo.', '["Vegetariano","Sin fritura"]'
    FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Merluza al horno con vegetales',
         'Filete con limón, papas al natural y zanahoria.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Tibia de pollo y batata',
         'Hojas verdes, pollo grillado y batata asada.', '["Sin TACC"]'
    FROM menus WHERE fecha = '2026-08-31';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-01', 'martes', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Bife a la criolla con puré mixto',
         'Bife de cuadril con tomate, cebolla y morrón.', '[]'
    FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Budín de espinaca y ricota',
         'Con salsa liviana de tomate y albahaca.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Lomo salteado con arroz integral',
         'Lomo, morrón y cebolla salteados al wok.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De arroz yamaní y vegetales',
         'Con zanahoria, choclo, arvejas y aderezo cítrico.', '["Vegana"]'
    FROM menus WHERE fecha = '2026-09-01';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-02', 'miercoles', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Empanadas de carne al horno',
         'Seis unidades, carne cortada a cuchillo, masa casera.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Curry de garbanzos con arroz',
         'Garbanzos en leche de coco con curry suave.', '["Vegano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Atún grillado con ensalada de quinoa',
         'Con tomate cherry, pepino y hojas verdes.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Coleslaw con pollo',
         'Repollo, zanahoria y pollo con aderezo de yogur.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-09-02';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-03', 'jueves', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Guiso de lentejas con carne',
         'Lentejas con chorizo colorado suave y verduras.', '[]'
    FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tarta de acelga y queso',
         'Masa integral con acelga salteada y ricota.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo al curry con arroz basmati',
         'Curry suave con leche de coco.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De quinoa, palta y tomate',
         'Con semillas de girasol y limón.', '["Vegana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-03';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-04', 'viernes', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Matambre a la pizza con puré',
         'Matambre tiernizado, salsa y muzzarella gratinada.', '[]'
    FROM menus WHERE fecha = '2026-09-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Zapallitos rellenos de quinoa',
         'Rellenos de quinoa, choclo y queso, al horno.', '["Vegetariano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Peceto al horno con puré de calabaza',
         'Cocción lenta, con hierbas frescas.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-04';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Primavera con huevo',
         'Lechuga, tomate, zanahoria, huevo y aceitunas.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-04';

-- Semana del 2026-09-07 · la de la demo
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-07', 'lunes', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pollo al limón con arroz yamaní',
         'Marinado en limón y romero, con arroz integral.', '[]'
    FROM menus WHERE fecha = '2026-09-07';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Lasaña de vegetales',
         'Capas de berenjena, zucchini y salsa bechamel liviana.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-07';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Bowl de pollo, huevo y palta',
         'Con arroz yamaní, huevo duro y palta.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-09-07';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'César de pollo',
         'Lechuga, pollo grillado, croutons, queso y aderezo liviano.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-09-07';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-08', 'martes', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Albóndigas caseras con fideos',
         'Albóndigas de carne y avena en salsa fileto.', '[]'
    FROM menus WHERE fecha = '2026-09-08';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Hamburguesas de legumbres con puré',
         'De lentejas y avena, con puré de calabaza.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-09-08';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pescado a la provenzal con papas',
         'Filete con ajo, perejil y papas al horno.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-08';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Mediterránea con garbanzos',
         'Garbanzos, tomate, pepino, aceitunas, queso y oliva.', '["Vegetariana"]'
    FROM menus WHERE fecha = '2026-09-08';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-09', 'miercoles', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Cerdo al horno con batatas',
         'Bondiola al horno con batatas asadas y romero.', '[]'
    FROM menus WHERE fecha = '2026-09-09';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Risotto de hongos',
         'Arroz carnaroli con hongos de pino y perejil.', '["Vegetariano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-09';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Wok de ternera y vegetales',
         'Tiras de ternera con brócoli, zanahoria y sésamo.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-09-09';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Caprese con quinoa',
         'Tomate, muzzarella, albahaca y quinoa.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-09';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-10', 'jueves', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Tortilla de papas con ensalada',
         'Tortilla jugosa de papa y cebolla, con ensalada mixta.', '[]'
    FROM menus WHERE fecha = '2026-09-10';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Empanadas de humita al horno',
         'Seis unidades de choclo cremoso y cebolla de verdeo.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-10';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo al horno con boniato',
         'Muslo deshuesado con boniato y romero.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-10';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Verde con atún y huevo',
         'Mix de hojas, atún, huevo duro y tomate cherry.', '["Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-10';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-11', 'viernes', '2026-09', 'publicado', 0, '', datetime('now'));
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Estofado de ternera con arroz',
         'Cocción lenta con zanahoria, arvejas y papa.', '[]'
    FROM menus WHERE fecha = '2026-09-11';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Fideos integrales al pesto',
         'Con pesto de albahaca, nuez y aceite de oliva.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-11';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Tortilla proteica de claras y espinaca',
         'Con ensalada de hojas y semillas.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-11';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Waldorf liviana',
         'Manzana verde, apio, nuez y pollo, con aderezo de yogur.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-09-11';

-- Semana del 2026-09-14 · borrador
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-14', 'lunes', '2026-09', 'borrador', 0, '', NULL);
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Milanesa napolitana con puré',
         'Milanesa al horno con salsa, jamón y queso.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-09-14';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tortilla de zapallito y cebolla',
         'Jugosa, con ensalada de hojas verdes.', '["Vegetariano","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-14';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Cerdo magro con puré de coliflor',
         'Solomillo de cerdo con hierbas.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-14';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De lentejas y vegetales asados',
         'Lentejas, calabaza, morrón y cebolla morada.', '["Vegana"]'
    FROM menus WHERE fecha = '2026-09-14';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-15', 'martes', '2026-09', 'borrador', 0, '', NULL);
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Milanesa de ternera al horno con puré rústico',
         'Milanesa horneada con costra de avena y puré de papa y calabaza.', '["Sin fritura"]'
    FROM menus WHERE fecha = '2026-09-15';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Tarta de calabaza, puerro y queso',
         'Masa casera integral con relleno cremoso de calabaza asada.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-15';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pollo grillado con quinoa y vegetales asados',
         'Suprema marinada en hierbas sobre quinoa y mix de estación.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-15';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Griega con feta',
         'Pepino, tomate, aceituna, cebolla morada y queso feta.', '["Vegetariana","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-15';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-16', 'miercoles', '2026-09', 'borrador', 0, '', NULL);
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pastel de papas',
         'Carne cortada a cuchillo con cubierta de papa y batata.', '[]'
    FROM menus WHERE fecha = '2026-09-16';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Wok de vegetales con arroz yamaní',
         'Salteado de vegetales de estación con soja y jengibre.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-09-16';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Salmón rosado con puré de coliflor',
         'Al horno con limón y eneldo, sobre puré liviano.', '["Omega 3","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-16';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Tibia de pollo y batata',
         'Hojas verdes, pollo grillado y batata asada.', '["Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-16';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-17', 'jueves', '2026-09', 'borrador', 0, '', NULL);
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Canelones de carne y verdura',
         'Con salsa de tomate casera y un toque de queso gratinado.', '[]'
    FROM menus WHERE fecha = '2026-09-17';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Ñoquis de calabaza con salsa fileto',
         'Ñoquis caseros de calabaza con albahaca fresca.', '["Vegetariano"]'
    FROM menus WHERE fecha = '2026-09-17';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Bowl de carne magra, boniato y brócoli',
         'Cubos de nalga salteados con boniato asado.', '["Alto en proteína"]'
    FROM menus WHERE fecha = '2026-09-17';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'De arroz yamaní y vegetales',
         'Con zanahoria, choclo, arvejas y aderezo cítrico.', '["Vegana"]'
    FROM menus WHERE fecha = '2026-09-17';
INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES ('2026-09-18', 'viernes', '2026-09', 'borrador', 0, '', NULL);
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'clasico', 'Pollo al verdeo con arroz',
         'Suprema en salsa de verdeo liviana y arroz largo fino.', '[]'
    FROM menus WHERE fecha = '2026-09-18';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'vegetariano', 'Guiso de lentejas y calabaza',
         'Lentejas con calabaza, zanahoria y comino.', '["Vegano"]'
    FROM menus WHERE fecha = '2026-09-18';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'proteico', 'Pechuga rellena con espinaca y queso',
         'Con ensalada tibia de vegetales asados.', '["Alto en proteína","Sin TACC"]'
    FROM menus WHERE fecha = '2026-09-18';
INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)
  SELECT id, 'ensalada', 'Coleslaw con pollo',
         'Repollo, zanahoria y pollo con aderezo de yogur.', '["Fresca"]'
    FROM menus WHERE fecha = '2026-09-18';

-- --------------------------------------------------------------------
-- PEDIDOS · un mes de movimiento, con los ids a partir de 9000
-- --------------------------------------------------------------------
-- El volumen sube semana a semana a propósito. Ojo con una cosa al
-- mostrarlo: la semana en curso siempre va a verse más baja que la
-- anterior, porque está a medio terminar. No es una caída.
--
-- Los cancelados están puestos para poder mostrar que NO suman a la
-- recaudación: las estadísticas los descartan a propósito.

-- 2026-07-31 · viernes · 3 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9000, '2026-07-31T23:23:00Z', '2026-07-31', '2026-W31', 5, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', 'Tocar timbre 2B.', 6, 61800, 2000, 63800, 'demo-9000');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9000, 9000, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'xl', 1, 12800, 12800, 'Milanesa de berenjena con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9001, 9000, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 4, 9000, 36000, 'Budín de espinaca y ricota');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9002, 9000, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9001, '2026-07-31T20:00:00Z', '2026-07-31', '2026-W31', 5, 'whatsapp', 'panel', 'entregado', 'Tomás Almirón', '343 555-5123', '3435555123', 'retiro', NULL, '', 'base', 'efectivo', 'Sin cebolla.', 6, 77000, 0, 77000, 'demo-9001');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9003, 9001, 'vianda', '', '', NULL, 'lunes', 'clasico', 'xl', 2, 12800, 25600, 'Carne al horno con papas españolas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9004, 9001, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 1, 12800, 12800, 'Bife a la criolla con puré mixto');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9005, 9001, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'xl', 2, 12800, 25600, 'Empanadas de carne al horno');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9006, 9001, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9002, '2026-07-31T14:46:00Z', '2026-07-31', '2026-W31', 5, 'app', 'checkout-confirmado', 'entregado', 'Matías Godoy', '343 555-5135', '3435555135', 'retiro', NULL, '', 'base', 'transferencia', '', 1, 64000, 0, 64000, 'demo-9002');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9007, 9002, 'pack', 'x5', 'ensalada', NULL, '', '', 'xl', 1, 64000, 64000, 'Pack x5 días');

-- 2026-08-02 · domingo · 5 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9003, '2026-08-02T12:53:00Z', '2026-08-02', '2026-W31', 7, 'app', 'checkout-whatsapp', 'entregado', 'Florencia Duarte', '343 555-5120', '3435555120', 'retiro', NULL, '', 'mesamies', 'mercadopago', 'Retira mi marido.', 1, 36000, 0, 36000, 'demo-9003');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9008, 9003, 'pack', 'x4', 'proteico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9004, '2026-08-02T13:19:00Z', '2026-08-02', '2026-W31', 7, 'app', 'checkout-whatsapp', 'entregado', 'Ezequiel Monzón', '343 555-5133', '3435555133', 'retiro', NULL, '', 'mesamies', 'transferencia', 'Retira mi marido.', 1, 45000, 0, 45000, 'demo-9004');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9009, 9004, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9005, '2026-08-02T23:08:00Z', '2026-08-02', '2026-W31', 7, 'app', 'checkout-confirmado', 'entregado', 'Santiago Frank', '343 555-5129', '3435555129', 'envio', 'dentro', 'Perú 411', NULL, 'mercadopago', '', 6, 54000, 2000, 56000, 'demo-9005');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9010, 9005, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Canelones de carne y verdura');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9011, 9005, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 4, 9000, 36000, 'Pollo al verdeo con arroz');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9006, '2026-08-02T17:53:00Z', '2026-08-02', '2026-W31', 7, 'app', 'checkout-confirmado', 'entregado', 'Ignacio Sosa', '343 555-5121', '3435555121', 'envio', 'dentro', 'Perú 411', NULL, 'efectivo', 'Sin cebolla.', 3, 30800, 2000, 32800, 'demo-9006');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9012, 9006, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 1, 9000, 9000, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9013, 9006, 'vianda', '', '', NULL, 'viernes', 'proteico', 'xl', 1, 12800, 12800, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9014, 9006, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 1, 9000, 9000, 'Carne al horno con papas españolas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9007, '2026-08-02T14:32:00Z', '2026-08-02', '2026-W31', 7, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'envio', 'dentro', 'Andrés Pazos 960', NULL, 'mercadopago', 'Sin sal, por favor.', 4, 51200, 2000, 53200, 'demo-9007');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9015, 9007, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'xl', 1, 12800, 12800, 'Canelones de carne y verdura');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9016, 9007, 'vianda', '', '', NULL, 'lunes', 'clasico', 'xl', 3, 12800, 38400, 'Pollo al verdeo con arroz');

-- 2026-08-03 · lunes · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9008, '2026-08-03T21:46:00Z', '2026-08-03', '2026-W32', 1, 'app', 'checkout-confirmado', 'entregado', 'Agustina Lell', '343 555-5126', '3435555126', 'retiro', NULL, '', 'base', 'efectivo', 'Retira mi marido.', 1, 198000, 0, 198000, 'demo-9008');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9017, 9008, 'plan', '', 'clasico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9009, '2026-08-03T13:43:00Z', '2026-08-03', '2026-W32', 1, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'retiro', NULL, '', 'mesamies', 'efectivo', '', 1, 45000, 0, 45000, 'demo-9009');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9018, 9009, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9010, '2026-08-03T21:14:00Z', '2026-08-03', '2026-W32', 1, 'app', 'checkout-confirmado', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', '', 7, 82000, 2500, 84500, 'demo-9010');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9019, 9010, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 2, 9000, 18000, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9020, 9010, 'vianda', '', '', NULL, 'lunes', 'clasico', 'xl', 5, 12800, 64000, 'Canelones de carne y verdura');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9011, '2026-08-03T19:29:00Z', '2026-08-03', '2026-W32', 1, 'whatsapp', 'panel', 'entregado', 'Natalia Retamar', '343 555-5108', '3435555108', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'efectivo', 'Sin cebolla.', 7, 78200, 2000, 80200, 'demo-9011');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9021, 9011, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 3, 9000, 27000, 'Salmón rosado con puré de coliflor');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9022, 9011, 'vianda', '', '', NULL, 'lunes', 'clasico', 'xl', 3, 12800, 38400, 'Canelones de carne y verdura');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9023, 9011, 'vianda', '', '', NULL, 'miercoles', 'ensalada', 'xl', 1, 12800, 12800, 'Coleslaw con pollo');

-- 2026-08-04 · martes · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9012, '2026-08-04T23:05:00Z', '2026-08-04', '2026-W32', 2, 'app', 'checkout-whatsapp', 'entregado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', 'Sin cebolla.', 1, 27000, 0, 27000, 'demo-9012');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9024, 9012, 'pack', 'x3', 'clasico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9013, '2026-08-04T22:01:00Z', '2026-08-04', '2026-W32', 2, 'app', 'checkout-whatsapp', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'efectivo', '', 3, 27000, 2000, 29000, 'demo-9013');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9025, 9013, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 3, 9000, 27000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9014, '2026-08-04T21:56:00Z', '2026-08-04', '2026-W32', 2, 'app', 'checkout-confirmado', 'entregado', 'Diego Villalba', '343 555-5113', '3435555113', 'retiro', NULL, '', 'base', 'transferencia', '', 5, 60400, 0, 60400, 'demo-9014');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9026, 9014, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'xl', 3, 12800, 38400, 'Tarta de calabaza, puerro y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9027, 9014, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 1, 9000, 9000, 'Wok de vegetales con arroz yamaní');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9028, 9014, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9015, '2026-08-04T12:41:00Z', '2026-08-04', '2026-W32', 2, 'app', 'checkout-whatsapp', 'entregado', 'Agustina Lell', '343 555-5126', '3435555126', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'efectivo', '', 4, 43600, 2000, 45600, 'demo-9015');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9029, 9015, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9030, 9015, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 2, 12800, 25600, 'Pastel de papas');

-- 2026-08-05 · miércoles · 3 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9016, '2026-08-05T15:16:00Z', '2026-08-05', '2026-W32', 3, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', '', 8, 72000, 2000, 74000, 'demo-9016');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9031, 9016, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 5, 9000, 45000, 'Milanesa napolitana con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9032, 9016, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 1, 9000, 9000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9033, 9016, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 2, 9000, 18000, 'Pastel de papas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9017, '2026-08-05T18:11:00Z', '2026-08-05', '2026-W32', 3, 'app', 'checkout-whatsapp', 'entregado', 'Ana Belén Torres', '343 555-5116', '3435555116', 'retiro', NULL, '', 'mesamies', 'efectivo', '', 1, 9000, 0, 9000, 'demo-9017');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9034, 9017, 'vianda', '', '', NULL, 'martes', 'ensalada', 'estandar', 1, 9000, 9000, 'De lentejas y vegetales asados');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9018, '2026-08-05T19:05:00Z', '2026-08-05', '2026-W32', 3, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', '', 6, 54000, 2000, 56000, 'demo-9018');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9035, 9018, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Tortilla de zapallito y cebolla');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9036, 9018, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Tarta de calabaza, puerro y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9037, 9018, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 1, 9000, 9000, 'Wok de vegetales con arroz yamaní');

-- 2026-08-06 · jueves · 3 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9019, '2026-08-06T14:13:00Z', '2026-08-06', '2026-W32', 4, 'app', 'checkout-whatsapp', 'cancelado', 'Emiliano Cabrera', '343 555-5119', '3435555119', 'retiro', NULL, '', 'mesamies', 'mercadopago', '', 3, 27000, 0, 27000, 'demo-9019');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9038, 9019, 'vianda', '', '', NULL, 'miercoles', 'ensalada', 'estandar', 2, 9000, 18000, 'Waldorf liviana');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9039, 9019, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 1, 9000, 9000, 'Cerdo magro con puré de coliflor');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9020, '2026-08-06T16:45:00Z', '2026-08-06', '2026-W32', 4, 'whatsapp', 'panel', 'entregado', 'Antonella Peralta', '343 555-5134', '3435555134', 'retiro', NULL, '', 'base', 'efectivo', '', 2, 18000, 0, 18000, 'demo-9020');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9040, 9020, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 2, 9000, 18000, 'Tortilla proteica de claras y espinaca');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9021, '2026-08-06T23:41:00Z', '2026-08-06', '2026-W32', 4, 'app', 'checkout-whatsapp', 'entregado', 'Ezequiel Monzón', '343 555-5133', '3435555133', 'retiro', NULL, '', 'mesamies', 'transferencia', '', 1, 198000, 0, 198000, 'demo-9021');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9041, 9021, 'plan', '', 'proteico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');

-- 2026-08-07 · viernes · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9022, '2026-08-07T17:59:00Z', '2026-08-07', '2026-W32', 5, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', 'Avisar cuando salga el reparto.', 1, 45000, 0, 45000, 'demo-9022');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9042, 9022, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9023, '2026-08-07T21:45:00Z', '2026-08-07', '2026-W32', 5, 'whatsapp', 'panel', 'entregado', 'Antonella Peralta', '343 555-5134', '3435555134', 'retiro', NULL, '', 'base', 'efectivo', '', 4, 40000, 0, 40000, 'demo-9023');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9043, 9023, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 1, 9000, 9000, 'Pollo al horno con boniato');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9044, 9023, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 2, 9000, 18000, 'Estofado de ternera con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9045, 9023, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9024, '2026-08-07T22:26:00Z', '2026-08-07', '2026-W32', 5, 'app', 'checkout-whatsapp', 'entregado', 'Florencia Duarte', '343 555-5120', '3435555120', 'envio', 'fuera', 'Urquiza 1240', NULL, 'mercadopago', '', 8, 91000, 2500, 93500, 'demo-9024');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9046, 9024, 'vianda', '', '', NULL, 'martes', 'proteico', 'xl', 4, 12800, 51200, 'Pollo al horno con boniato');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9047, 9024, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 3, 9000, 27000, 'Tortilla proteica de claras y espinaca');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9048, 9024, 'vianda', '', '', NULL, 'viernes', 'proteico', 'xl', 1, 12800, 12800, 'Cerdo magro con puré de coliflor');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9025, '2026-08-07T21:15:00Z', '2026-08-07', '2026-W32', 5, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', '', 4, 36000, 2500, 38500, 'demo-9025');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9049, 9025, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 2, 9000, 18000, 'Pollo al horno con boniato');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9050, 9025, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 1, 9000, 9000, 'Tortilla proteica de claras y espinaca');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9051, 9025, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 1, 9000, 9000, 'Cerdo magro con puré de coliflor');

-- 2026-08-09 · domingo · 7 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9026, '2026-08-09T13:09:00Z', '2026-08-09', '2026-W32', 7, 'whatsapp', 'panel', 'entregado', 'Carla Bogado', '343 555-5111', '3435555111', 'envio', 'fuera', 'Andrés Pazos 960', NULL, 'mercadopago', '', 5, 52600, 2500, 55100, 'demo-9026');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9052, 9026, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 3, 9000, 27000, 'Albóndigas caseras con fideos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9053, 9026, 'vianda', '', '', NULL, 'viernes', 'clasico', 'xl', 2, 12800, 25600, 'Cerdo al horno con batatas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9027, '2026-08-09T13:04:00Z', '2026-08-09', '2026-W32', 7, 'whatsapp', 'panel', 'entregado', 'Rocío Maidana', '343 555-5130', '3435555130', 'retiro', NULL, '', 'base', 'mercadopago', '', 2, 18000, 0, 18000, 'demo-9027');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9054, 9027, 'vianda', '', '', NULL, 'miercoles', 'ensalada', 'estandar', 2, 9000, 18000, 'Mediterránea con garbanzos');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9028, '2026-08-09T17:07:00Z', '2026-08-09', '2026-W32', 7, 'app', 'checkout-confirmado', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', 'Tocar timbre 2B.', 4, 36000, 2000, 38000, 'demo-9028');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9055, 9028, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 1, 9000, 9000, 'Hamburguesas de legumbres con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9056, 9028, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Risotto de hongos');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9029, '2026-08-09T12:32:00Z', '2026-08-09', '2026-W32', 7, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', 'Tocar timbre 2B.', 2, 22000, 2500, 24500, 'demo-9029');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9057, 9029, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 1, 9000, 9000, 'Albóndigas caseras con fideos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9058, 9029, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9030, '2026-08-09T17:50:00Z', '2026-08-09', '2026-W32', 7, 'app', 'checkout-whatsapp', 'entregado', 'Ignacio Sosa', '343 555-5121', '3435555121', 'envio', 'dentro', 'Perú 411', NULL, 'efectivo', '', 1, 36000, 0, 36000, 'demo-9030');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9059, 9030, 'pack', 'x4', 'proteico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9031, '2026-08-09T16:39:00Z', '2026-08-09', '2026-W32', 7, 'app', 'checkout-confirmado', 'entregado', 'Santiago Frank', '343 555-5129', '3435555129', 'envio', 'dentro', 'Perú 411', NULL, 'mercadopago', '', 10, 101400, 2000, 103400, 'demo-9031');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9060, 9031, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 3, 9000, 27000, 'Albóndigas caseras con fideos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9061, 9031, 'vianda', '', '', NULL, 'viernes', 'clasico', 'xl', 3, 12800, 38400, 'Cerdo al horno con batatas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9062, 9031, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 4, 9000, 36000, 'Tortilla de papas con ensalada');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9032, '2026-08-09T12:33:00Z', '2026-08-09', '2026-W32', 7, 'whatsapp', 'panel', 'entregado', 'Natalia Retamar', '343 555-5108', '3435555108', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'efectivo', 'Avisar cuando salga el reparto.', 2, 25600, 2000, 27600, 'demo-9032');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9063, 9032, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'xl', 1, 12800, 12800, 'Pescado a la provenzal con papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9064, 9032, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'xl', 1, 12800, 12800, 'Risotto de hongos');

-- 2026-08-10 · lunes · 5 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9033, '2026-08-10T21:57:00Z', '2026-08-10', '2026-W33', 1, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', '', 1, 198000, 0, 198000, 'demo-9033');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9065, 9033, 'plan', '', 'clasico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9034, '2026-08-10T21:51:00Z', '2026-08-10', '2026-W33', 1, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', '', 8, 72000, 2500, 74500, 'demo-9034');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9066, 9034, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 3, 9000, 27000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9067, 9034, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 1, 9000, 9000, 'Pescado a la provenzal con papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9068, 9034, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 4, 9000, 36000, 'Risotto de hongos');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9035, '2026-08-10T23:04:00Z', '2026-08-10', '2026-W33', 1, 'app', 'checkout-confirmado', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 5, 45000, 2000, 47000, 'demo-9035');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9069, 9035, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 1, 9000, 9000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9070, 9035, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 2, 9000, 18000, 'Pescado a la provenzal con papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9071, 9035, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 2, 9000, 18000, 'Wok de ternera y vegetales');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9036, '2026-08-10T21:19:00Z', '2026-08-10', '2026-W33', 1, 'app', 'checkout-confirmado', 'entregado', 'Matías Godoy', '343 555-5135', '3435555135', 'retiro', NULL, '', 'base', 'transferencia', '', 6, 76800, 0, 76800, 'demo-9036');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9072, 9036, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'xl', 4, 12800, 51200, 'Lasaña de vegetales');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9073, 9036, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'xl', 2, 12800, 25600, 'Hamburguesas de legumbres con puré');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9037, '2026-08-10T14:39:00Z', '2026-08-10', '2026-W33', 1, 'whatsapp', 'panel', 'entregado', 'Joaquín Medina', '343 555-5125', '3435555125', 'envio', 'dentro', 'Córdoba 455', NULL, 'efectivo', '', 1, 198000, 0, 198000, 'demo-9037');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9074, 9037, 'plan', '', 'proteico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');

-- 2026-08-11 · martes · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9038, '2026-08-11T20:18:00Z', '2026-08-11', '2026-W33', 2, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'retiro', NULL, '', 'oximarket', 'mercadopago', '', 1, 198000, 0, 198000, 'demo-9038');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9075, 9038, 'plan', '', 'clasico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9039, '2026-08-11T16:19:00Z', '2026-08-11', '2026-W33', 2, 'app', 'checkout-confirmado', 'entregado', 'Julieta Ramírez', '343 555-5112', '3435555112', 'envio', 'fuera', 'España 275', NULL, 'efectivo', 'Dejar en portería.', 9, 81000, 2500, 83500, 'demo-9039');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9076, 9039, 'vianda', '', '', NULL, 'miercoles', 'ensalada', 'estandar', 4, 9000, 36000, 'Primavera con huevo');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9077, 9039, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 4, 9000, 36000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9078, 9039, 'vianda', '', '', NULL, 'martes', 'ensalada', 'estandar', 1, 9000, 9000, 'Mediterránea con garbanzos');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9040, '2026-08-11T16:00:00Z', '2026-08-11', '2026-W33', 2, 'app', 'checkout-confirmado', 'entregado', 'Julieta Ramírez', '343 555-5112', '3435555112', 'envio', 'fuera', 'España 275', NULL, 'efectivo', 'Tocar timbre 2B.', 6, 54000, 2500, 56500, 'demo-9040');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9079, 9040, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 2, 9000, 18000, 'Peceto al horno con puré de calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9080, 9040, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 4, 9000, 36000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9041, '2026-08-11T20:27:00Z', '2026-08-11', '2026-W33', 2, 'app', 'checkout-confirmado', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', 'Retiro yo, gracias.', 9, 81000, 0, 81000, 'demo-9041');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9081, 9041, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 4, 9000, 36000, 'Matambre a la pizza con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9082, 9041, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 1, 9000, 9000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9083, 9041, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Albóndigas caseras con fideos');

-- 2026-08-12 · miércoles · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9042, '2026-08-12T22:41:00Z', '2026-08-12', '2026-W33', 3, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', '', 5, 45000, 2000, 47000, 'demo-9042');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9084, 9042, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'estandar', 4, 9000, 36000, 'Tarta de acelga y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9085, 9042, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 1, 9000, 9000, 'Zapallitos rellenos de quinoa');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9043, '2026-08-12T21:56:00Z', '2026-08-12', '2026-W33', 3, 'whatsapp', 'panel', 'entregado', 'Carla Bogado', '343 555-5111', '3435555111', 'retiro', NULL, '', 'oximarket', 'mercadopago', '', 5, 45000, 0, 45000, 'demo-9043');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9086, 9043, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 5, 9000, 45000, 'Guiso de lentejas con carne');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9044, '2026-08-12T14:46:00Z', '2026-08-12', '2026-W33', 3, 'whatsapp', 'panel', 'entregado', 'Natalia Retamar', '343 555-5108', '3435555108', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'efectivo', '', 6, 76800, 2000, 78800, 'demo-9044');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9087, 9044, 'vianda', '', '', NULL, 'lunes', 'ensalada', 'xl', 1, 12800, 12800, 'De quinoa, palta y tomate');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9088, 9044, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'xl', 3, 12800, 38400, 'Zapallitos rellenos de quinoa');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9089, 9044, 'vianda', '', '', NULL, 'jueves', 'proteico', 'xl', 2, 12800, 25600, 'Bowl de pollo, huevo y palta');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9045, '2026-08-12T13:36:00Z', '2026-08-12', '2026-W33', 3, 'app', 'checkout-whatsapp', 'entregado', 'Brenda Kaufmann', '343 555-5132', '3435555132', 'envio', 'dentro', 'España 275', NULL, 'efectivo', '', 5, 45000, 2000, 47000, 'demo-9045');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9090, 9045, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 1, 9000, 9000, 'Pollo al curry con arroz basmati');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9091, 9045, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 4, 9000, 36000, 'Matambre a la pizza con puré');

-- 2026-08-13 · jueves · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9046, '2026-08-13T23:56:00Z', '2026-08-13', '2026-W33', 4, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', 'Sin cebolla.', 4, 43600, 2000, 45600, 'demo-9046');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9092, 9046, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'xl', 2, 12800, 25600, 'Curry de garbanzos con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9093, 9046, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Tarta de acelga y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9047, '2026-08-13T19:04:00Z', '2026-08-13', '2026-W33', 4, 'whatsapp', 'panel', 'entregado', 'Nicolás Pereyra', '343 555-5117', '3435555117', 'envio', 'fuera', 'Alameda de la Federación 190', NULL, 'efectivo', '', 1, 36000, 0, 36000, 'demo-9047');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9094, 9047, 'pack', 'x4', 'vegetariano', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9048, '2026-08-13T12:09:00Z', '2026-08-13', '2026-W33', 4, 'app', 'checkout-confirmado', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', '', 4, 36000, 0, 36000, 'demo-9048');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9095, 9048, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Empanadas de carne al horno');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9049, '2026-08-13T22:21:00Z', '2026-08-13', '2026-W33', 4, 'app', 'checkout-confirmado', 'entregado', 'Emiliano Cabrera', '343 555-5119', '3435555119', 'envio', 'fuera', 'Santa Fe 1533', NULL, 'mercadopago', 'Tocar timbre 2B.', 6, 54000, 2500, 56500, 'demo-9049');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9096, 9049, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 2, 9000, 18000, 'Atún grillado con ensalada de quinoa');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9097, 9049, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 4, 9000, 36000, 'Pollo al curry con arroz basmati');

-- 2026-08-14 · viernes · 5 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9050, '2026-08-14T15:56:00Z', '2026-08-14', '2026-W33', 5, 'app', 'checkout-whatsapp', 'entregado', 'Camila Barrios', '343 555-5122', '3435555122', 'retiro', NULL, '', 'mesamies', 'transferencia', 'Retira mi marido.', 4, 51200, 0, 51200, 'demo-9050');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9098, 9050, 'vianda', '', '', NULL, 'viernes', 'ensalada', 'xl', 4, 12800, 51200, 'De arroz yamaní y vegetales');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9051, '2026-08-14T21:10:00Z', '2026-08-14', '2026-W33', 5, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 1, 36000, 0, 36000, 'demo-9051');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9099, 9051, 'pack', 'x4', 'proteico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9052, '2026-08-14T14:09:00Z', '2026-08-14', '2026-W33', 5, 'whatsapp', 'panel', 'entregado', 'Daniela Ojeda', '343 555-5128', '3435555128', 'envio', 'fuera', 'Santa Fe 1533', NULL, 'transferencia', 'Sin cebolla.', 2, 90000, 0, 90000, 'demo-9052');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9100, 9052, 'pack', 'x5', 'vegetariano', NULL, '', '', 'estandar', 2, 45000, 90000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9053, '2026-08-14T19:24:00Z', '2026-08-14', '2026-W33', 5, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'retiro', NULL, '', 'mesamies', 'transferencia', '', 9, 81000, 0, 81000, 'demo-9053');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9101, 9053, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Budín de espinaca y ricota');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9102, 9053, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 4, 9000, 36000, 'Curry de garbanzos con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9103, 9053, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Tarta de acelga y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9054, '2026-08-14T19:01:00Z', '2026-08-14', '2026-W33', 5, 'app', 'checkout-confirmado', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Dejar en portería.', 10, 90000, 2500, 92500, 'demo-9054');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9104, 9054, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 1, 9000, 9000, 'Bife a la criolla con puré mixto');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9105, 9054, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 5, 9000, 45000, 'Atún grillado con ensalada de quinoa');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9106, 9054, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 4, 9000, 36000, 'Guiso de lentejas con carne');

-- 2026-08-16 · domingo · 7 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9055, '2026-08-16T23:07:00Z', '2026-08-16', '2026-W33', 7, 'app', 'checkout-whatsapp', 'entregado', 'Romina Schmidt', '343 555-5114', '3435555114', 'retiro', NULL, '', 'oximarket', 'mercadopago', 'Paso después de las 13.', 5, 45000, 0, 45000, 'demo-9055');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9107, 9055, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 5, 9000, 45000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9056, '2026-08-16T19:54:00Z', '2026-08-16', '2026-W33', 7, 'whatsapp', 'panel', 'entregado', 'Natalia Retamar', '343 555-5108', '3435555108', 'retiro', NULL, '', 'base', 'efectivo', '', 1, 12800, 0, 12800, 'demo-9056');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9108, 9056, 'vianda', '', '', NULL, 'martes', 'proteico', 'xl', 1, 12800, 12800, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9057, '2026-08-16T22:01:00Z', '2026-08-16', '2026-W33', 7, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Tocar timbre 2B.', 4, 36000, 2000, 38000, 'demo-9057');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9109, 9057, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 2, 9000, 18000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9110, 9057, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 2, 9000, 18000, 'Merluza al horno con vegetales');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9058, '2026-08-16T18:14:00Z', '2026-08-16', '2026-W33', 7, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'retiro', NULL, '', 'mesamies', 'transferencia', '', 3, 31000, 0, 31000, 'demo-9058');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9111, 9058, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Guiso de lentejas y calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9112, 9058, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9059, '2026-08-16T17:18:00Z', '2026-08-16', '2026-W33', 7, 'app', 'checkout-whatsapp', 'entregado', 'Valentina Ríos', '343 555-5118', '3435555118', 'envio', 'fuera', 'Gualeguaychú 780', NULL, 'efectivo', '', 2, 25800, 2500, 28300, 'demo-9059');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9113, 9059, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'xl', 1, 12800, 12800, 'Guiso de lentejas y calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9114, 9059, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9060, '2026-08-16T18:42:00Z', '2026-08-16', '2026-W33', 7, 'app', 'checkout-confirmado', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', 'Dejar en portería.', 6, 58000, 2500, 60500, 'demo-9060');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9115, 9060, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 1, 9000, 9000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9116, 9060, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 4, 9000, 36000, 'Merluza al horno con vegetales');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9117, 9060, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9061, '2026-08-16T16:07:00Z', '2026-08-16', '2026-W33', 7, 'app', 'checkout-confirmado', 'entregado', 'Franco Britos', '343 555-5127', '3435555127', 'envio', 'fuera', 'Córdoba 455', NULL, 'efectivo', '', 5, 64000, 2500, 66500, 'demo-9061');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9118, 9061, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 1, 12800, 12800, 'Pollo al verdeo con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9119, 9061, 'vianda', '', '', NULL, 'jueves', 'clasico', 'xl', 4, 12800, 51200, 'Carne al horno con papas españolas');

-- 2026-08-17 · lunes · 7 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9062, '2026-08-17T14:37:00Z', '2026-08-17', '2026-W34', 1, 'app', 'checkout-whatsapp', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', '', 6, 54000, 0, 54000, 'demo-9062');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9120, 9062, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 3, 9000, 27000, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9121, 9062, 'vianda', '', '', NULL, 'lunes', 'ensalada', 'estandar', 1, 9000, 9000, 'Griega con feta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9122, 9062, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Carne al horno con papas españolas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9063, '2026-08-17T14:19:00Z', '2026-08-17', '2026-W34', 1, 'whatsapp', 'panel', 'cancelado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Sin cebolla.', 9, 96200, 2000, 98200, 'demo-9063');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9123, 9063, 'vianda', '', '', NULL, 'viernes', 'proteico', 'xl', 1, 12800, 12800, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9124, 9063, 'vianda', '', '', NULL, 'lunes', 'proteico', 'xl', 3, 12800, 38400, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9125, 9063, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 5, 9000, 45000, 'Merluza al horno con vegetales');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9064, '2026-08-17T12:39:00Z', '2026-08-17', '2026-W34', 1, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', 'Tocar timbre 2B.', 1, 9000, 2500, 11500, 'demo-9064');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9126, 9064, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 1, 9000, 9000, 'Canelones de carne y verdura');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9065, '2026-08-17T14:52:00Z', '2026-08-17', '2026-W34', 1, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', 'Sin cebolla.', 6, 54000, 2500, 56500, 'demo-9065');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9127, 9065, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 3, 9000, 27000, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9128, 9065, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 3, 9000, 27000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9066, '2026-08-17T20:12:00Z', '2026-08-17', '2026-W34', 1, 'app', 'checkout-whatsapp', 'entregado', 'Micaela Vera', '343 555-5124', '3435555124', 'retiro', NULL, '', 'mesamies', 'efectivo', '', 6, 54000, 0, 54000, 'demo-9066');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9129, 9066, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 1, 9000, 9000, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9130, 9066, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 5, 9000, 45000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9067, '2026-08-17T16:45:00Z', '2026-08-17', '2026-W34', 1, 'app', 'checkout-confirmado', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', '', 1, 27000, 0, 27000, 'demo-9067');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9131, 9067, 'pack', 'x3', 'clasico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9068, '2026-08-17T15:29:00Z', '2026-08-17', '2026-W34', 1, 'whatsapp', 'panel', 'entregado', 'Natalia Retamar', '343 555-5108', '3435555108', 'retiro', NULL, '', 'base', 'efectivo', 'Paso después de las 13.', 7, 89600, 0, 89600, 'demo-9068');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9132, 9068, 'vianda', '', '', NULL, 'martes', 'proteico', 'xl', 4, 12800, 51200, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9133, 9068, 'vianda', '', '', NULL, 'jueves', 'proteico', 'xl', 3, 12800, 38400, 'Pechuga rellena con espinaca y queso');

-- 2026-08-18 · martes · 5 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9069, '2026-08-18T15:45:00Z', '2026-08-18', '2026-W34', 2, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', 'Sin sal, por favor.', 4, 40000, 2000, 42000, 'demo-9069');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9134, 9069, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Wok de vegetales con arroz yamaní');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9135, 9069, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9070, '2026-08-18T13:43:00Z', '2026-08-18', '2026-W34', 2, 'whatsapp', 'panel', 'entregado', 'Carla Bogado', '343 555-5111', '3435555111', 'envio', 'fuera', 'Andrés Pazos 960', NULL, 'mercadopago', 'Avisar cuando salga el reparto.', 2, 18000, 2500, 20500, 'demo-9070');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9136, 9070, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 2, 9000, 18000, 'Pastel de papas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9071, '2026-08-18T13:18:00Z', '2026-08-18', '2026-W34', 2, 'whatsapp', 'panel', 'entregado', 'Rocío Maidana', '343 555-5130', '3435555130', 'envio', 'fuera', 'Urquiza 1240', NULL, 'mercadopago', 'Sin sal, por favor.', 9, 100000, 2500, 102500, 'demo-9071');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9137, 9071, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'xl', 5, 12800, 64000, 'Wok de vegetales con arroz yamaní');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9138, 9071, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 2, 9000, 18000, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9139, 9071, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 2, 9000, 18000, 'Guiso de lentejas y calabaza');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9072, '2026-08-18T17:14:00Z', '2026-08-18', '2026-W34', 2, 'app', 'checkout-confirmado', 'cancelado', 'Julieta Ramírez', '343 555-5112', '3435555112', 'envio', 'fuera', 'España 275', NULL, 'efectivo', '', 8, 72000, 2500, 74500, 'demo-9072');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9140, 9072, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 4, 9000, 36000, 'Salmón rosado con puré de coliflor');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9141, 9072, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 2, 9000, 18000, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9142, 9072, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 2, 9000, 18000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9073, '2026-08-18T19:20:00Z', '2026-08-18', '2026-W34', 2, 'app', 'checkout-whatsapp', 'entregado', 'Camila Barrios', '343 555-5122', '3435555122', 'envio', 'fuera', 'Gualeguaychú 780', NULL, 'transferencia', 'Avisar cuando salga el reparto.', 8, 72000, 2500, 74500, 'demo-9073');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9143, 9073, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 2, 9000, 18000, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9144, 9073, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Canelones de carne y verdura');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9145, 9073, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 2, 9000, 18000, 'Pollo al verdeo con arroz');

-- 2026-08-19 · miércoles · 6 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9074, '2026-08-19T17:05:00Z', '2026-08-19', '2026-W34', 3, 'app', 'checkout-confirmado', 'entregado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', 'Avisar cuando salga el reparto.', 2, 22000, 2000, 24000, 'demo-9074');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9146, 9074, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 1, 9000, 9000, 'Pollo grillado con quinoa y vegetales asados');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9147, 9074, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9075, '2026-08-19T12:55:00Z', '2026-08-19', '2026-W34', 3, 'whatsapp', 'panel', 'entregado', 'Carla Bogado', '343 555-5111', '3435555111', 'envio', 'fuera', 'Andrés Pazos 960', NULL, 'mercadopago', '', 1, 36000, 0, 36000, 'demo-9075');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9148, 9075, 'pack', 'x4', 'clasico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9076, '2026-08-19T22:30:00Z', '2026-08-19', '2026-W34', 3, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', '', 7, 74600, 2500, 77100, 'demo-9076');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9149, 9076, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9150, 9076, 'vianda', '', '', NULL, 'viernes', 'clasico', 'xl', 2, 12800, 25600, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9151, 9076, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9077, '2026-08-19T18:42:00Z', '2026-08-19', '2026-W34', 3, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', 'Tocar timbre 2B.', 4, 36000, 2000, 38000, 'demo-9077');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9152, 9077, 'vianda', '', '', NULL, 'lunes', 'ensalada', 'estandar', 2, 9000, 18000, 'Verde con atún y huevo');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9153, 9077, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 2, 9000, 18000, 'Pastel de papas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9078, '2026-08-19T16:33:00Z', '2026-08-19', '2026-W34', 3, 'app', 'checkout-whatsapp', 'entregado', 'Franco Britos', '343 555-5127', '3435555127', 'envio', 'fuera', 'Córdoba 455', NULL, 'efectivo', 'Dejar en portería.', 1, 9000, 2500, 11500, 'demo-9078');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9154, 9078, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 1, 9000, 9000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9079, '2026-08-19T13:30:00Z', '2026-08-19', '2026-W34', 3, 'app', 'checkout-whatsapp', 'entregado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', '', 1, 9000, 2000, 11000, 'demo-9079');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9155, 9079, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 1, 9000, 9000, 'Milanesa de ternera al horno con puré rústico');

-- 2026-08-20 · jueves · 5 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9080, '2026-08-20T15:29:00Z', '2026-08-20', '2026-W34', 4, 'app', 'checkout-whatsapp', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Dejar en portería.', 8, 83400, 2500, 85900, 'demo-9080');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9156, 9080, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 5, 9000, 45000, 'Milanesa napolitana con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9157, 9080, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 3, 12800, 38400, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9081, '2026-08-20T15:47:00Z', '2026-08-20', '2026-W34', 4, 'app', 'checkout-confirmado', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', '', 9, 88600, 2500, 91100, 'demo-9081');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9158, 9081, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 2, 9000, 18000, 'Milanesa napolitana con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9159, 9081, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 5, 9000, 45000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9160, 9081, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'xl', 2, 12800, 25600, 'Pastel de papas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9082, '2026-08-20T17:03:00Z', '2026-08-20', '2026-W34', 4, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'retiro', NULL, '', 'oximarket', 'mercadopago', '', 1, 38400, 0, 38400, 'demo-9082');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9161, 9082, 'pack', 'x3', 'clasico', NULL, '', '', 'xl', 1, 38400, 38400, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9083, '2026-08-20T17:52:00Z', '2026-08-20', '2026-W34', 4, 'app', 'checkout-whatsapp', 'entregado', 'Romina Schmidt', '343 555-5114', '3435555114', 'envio', 'fuera', 'Almafuerte 345', NULL, 'mercadopago', 'Tocar timbre 2B.', 5, 45000, 2500, 47500, 'demo-9083');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9162, 9083, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 3, 9000, 27000, 'Milanesa napolitana con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9163, 9083, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 2, 9000, 18000, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9084, '2026-08-20T15:39:00Z', '2026-08-20', '2026-W34', 4, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', 'Sin sal, por favor.', 10, 105200, 2500, 107700, 'demo-9084');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9164, 9084, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 4, 9000, 36000, 'Cerdo magro con puré de coliflor');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9165, 9084, 'vianda', '', '', NULL, 'viernes', 'clasico', 'xl', 4, 12800, 51200, 'Milanesa de ternera al horno con puré rústico');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9166, 9084, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 2, 9000, 18000, 'Salmón rosado con puré de coliflor');

-- 2026-08-21 · viernes · 4 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9085, '2026-08-21T21:53:00Z', '2026-08-21', '2026-W34', 5, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'envio', 'fuera', 'Perú 411', NULL, 'transferencia', 'Sin sal, por favor.', 3, 27000, 2500, 29500, 'demo-9085');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9167, 9085, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Fideos integrales al pesto');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9086, '2026-08-21T14:17:00Z', '2026-08-21', '2026-W34', 5, 'whatsapp', 'panel', 'entregado', 'Leandro Cáceres', '343 555-5131', '3435555131', 'envio', 'dentro', 'Rivadavia 1105', NULL, 'efectivo', '', 2, 18000, 2000, 20000, 'demo-9086');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9168, 9086, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Estofado de ternera con arroz');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9087, '2026-08-21T21:54:00Z', '2026-08-21', '2026-W34', 5, 'app', 'checkout-confirmado', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Avisar cuando salga el reparto.', 6, 58000, 2500, 60500, 'demo-9087');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9169, 9087, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 5, 9000, 45000, 'Estofado de ternera con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9170, 9087, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9088, '2026-08-21T20:15:00Z', '2026-08-21', '2026-W34', 5, 'app', 'checkout-whatsapp', 'entregado', 'Julieta Ramírez', '343 555-5112', '3435555112', 'retiro', NULL, '', 'mesamies', 'efectivo', 'Sin cebolla.', 7, 74400, 0, 74400, 'demo-9088');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9171, 9088, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 3, 9000, 27000, 'Tortilla proteica de claras y espinaca');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9172, 9088, 'vianda', '', '', NULL, 'jueves', 'proteico', 'xl', 3, 12800, 38400, 'Cerdo magro con puré de coliflor');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9173, 9088, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 1, 9000, 9000, 'Pollo grillado con quinoa y vegetales asados');

-- 2026-08-23 · domingo · 8 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9089, '2026-08-23T18:07:00Z', '2026-08-23', '2026-W34', 7, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Tocar timbre 2B.', 1, 9000, 2000, 11000, 'demo-9089');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9174, 9089, 'vianda', '', '', NULL, 'miercoles', 'ensalada', 'estandar', 1, 9000, 9000, 'Primavera con huevo');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9090, '2026-08-23T14:44:00Z', '2026-08-23', '2026-W34', 7, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 6, 54000, 2000, 56000, 'demo-9090');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9175, 9090, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Risotto de hongos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9176, 9090, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 2, 9000, 18000, 'Empanadas de humita al horno');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9177, 9090, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 1, 9000, 9000, 'Fideos integrales al pesto');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9091, '2026-08-23T18:03:00Z', '2026-08-23', '2026-W34', 7, 'app', 'checkout-whatsapp', 'entregado', 'Julieta Ramírez', '343 555-5112', '3435555112', 'envio', 'fuera', 'España 275', NULL, 'efectivo', '', 1, 27000, 0, 27000, 'demo-9091');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9178, 9091, 'pack', 'x3', 'proteico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9092, '2026-08-23T18:12:00Z', '2026-08-23', '2026-W34', 7, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', 'Avisar cuando salga el reparto.', 2, 18000, 2000, 20000, 'demo-9092');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9179, 9092, 'vianda', '', '', NULL, 'jueves', 'ensalada', 'estandar', 1, 9000, 9000, 'Primavera con huevo');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9180, 9092, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 1, 9000, 9000, 'Tortilla de papas con ensalada');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9093, '2026-08-23T15:06:00Z', '2026-08-23', '2026-W34', 7, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 1, 45000, 0, 45000, 'demo-9093');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9181, 9093, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9094, '2026-08-23T21:29:00Z', '2026-08-23', '2026-W34', 7, 'whatsapp', 'panel', 'entregado', 'Leandro Cáceres', '343 555-5131', '3435555131', 'envio', 'dentro', 'Rivadavia 1105', NULL, 'efectivo', 'Sin sal, por favor.', 7, 63000, 2000, 65000, 'demo-9094');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9182, 9094, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 5, 9000, 45000, 'Risotto de hongos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9183, 9094, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 2, 9000, 18000, 'Empanadas de humita al horno');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9095, '2026-08-23T14:58:00Z', '2026-08-23', '2026-W34', 7, 'app', 'checkout-whatsapp', 'entregado', 'Sofía Benítez', '343 555-5106', '3435555106', 'envio', 'dentro', 'Monte Caseros 620', NULL, 'transferencia', 'Sin cebolla.', 4, 51400, 2000, 53400, 'demo-9095');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9184, 9095, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'xl', 3, 12800, 38400, 'Risotto de hongos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9185, 9095, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9096, '2026-08-23T21:33:00Z', '2026-08-23', '2026-W34', 7, 'app', 'checkout-whatsapp', 'entregado', 'Diego Villalba', '343 555-5113', '3435555113', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'transferencia', '', 2, 18000, 2000, 20000, 'demo-9096');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9186, 9096, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Risotto de hongos');

-- 2026-08-24 · lunes · 8 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9097, '2026-08-24T15:05:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-confirmado', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', 'Sin sal, por favor.', 5, 48800, 2500, 51300, 'demo-9097');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9187, 9097, 'vianda', '', '', NULL, 'martes', 'ensalada', 'estandar', 3, 9000, 27000, 'De quinoa, palta y tomate');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9188, 9097, 'vianda', '', '', NULL, 'lunes', 'proteico', 'xl', 1, 12800, 12800, 'Wok de ternera y vegetales');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9189, 9097, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 1, 9000, 9000, 'Pollo al horno con boniato');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9098, '2026-08-24T17:33:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-whatsapp', 'entregado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', '', 1, 45000, 0, 45000, 'demo-9098');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9190, 9098, 'pack', 'x5', 'clasico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9099, '2026-08-24T12:49:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-whatsapp', 'entregado', 'Julieta Ramírez', '343 555-5112', '3435555112', 'envio', 'fuera', 'España 275', NULL, 'efectivo', '', 1, 36000, 0, 36000, 'demo-9099');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9191, 9099, 'pack', 'x4', 'proteico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9100, '2026-08-24T14:33:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', 'Sin sal, por favor.', 3, 27000, 2500, 29500, 'demo-9100');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9192, 9100, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 3, 9000, 27000, 'Pescado a la provenzal con papas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9101, '2026-08-24T19:46:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-confirmado', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', 'Sin cebolla.', 6, 54000, 2500, 56500, 'demo-9101');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9193, 9101, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 5, 9000, 45000, 'Albóndigas caseras con fideos');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9194, 9101, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 1, 9000, 9000, 'Cerdo al horno con batatas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9102, '2026-08-24T17:19:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-whatsapp', 'entregado', 'Diego Villalba', '343 555-5113', '3435555113', 'retiro', NULL, '', 'base', 'transferencia', 'Retira mi marido.', 1, 45000, 0, 45000, 'demo-9102');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9195, 9102, 'pack', 'x5', 'vegetariano', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9103, '2026-08-24T16:42:00Z', '2026-08-24', '2026-W35', 1, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 3, 27000, 2000, 29000, 'demo-9103');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9196, 9103, 'vianda', '', '', NULL, 'miercoles', 'ensalada', 'estandar', 3, 9000, 27000, 'De quinoa, palta y tomate');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9104, '2026-08-24T15:39:00Z', '2026-08-24', '2026-W35', 1, 'whatsapp', 'panel', 'cancelado', 'Carla Bogado', '343 555-5111', '3435555111', 'envio', 'fuera', 'Andrés Pazos 960', NULL, 'mercadopago', 'Dejar en portería.', 9, 96200, 2500, 98700, 'demo-9104');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9197, 9104, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 5, 9000, 45000, 'Hamburguesas de legumbres con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9198, 9104, 'vianda', '', '', NULL, 'jueves', 'clasico', 'xl', 3, 12800, 38400, 'Cerdo al horno con batatas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9199, 9104, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 1, 12800, 12800, 'Tortilla de papas con ensalada');

-- 2026-08-25 · martes · 6 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9105, '2026-08-25T15:04:00Z', '2026-08-25', '2026-W35', 2, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 1, 45000, 0, 45000, 'demo-9105');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9200, 9105, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9106, '2026-08-25T20:16:00Z', '2026-08-25', '2026-W35', 2, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'retiro', NULL, '', 'mesamies', 'transferencia', '', 1, 12800, 0, 12800, 'demo-9106');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9201, 9106, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'xl', 1, 12800, 12800, 'Lasaña de vegetales');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9107, '2026-08-25T18:36:00Z', '2026-08-25', '2026-W35', 2, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', 'Avisar cuando salga el reparto.', 1, 45000, 0, 45000, 'demo-9107');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9202, 9107, 'pack', 'x5', 'clasico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9108, '2026-08-25T18:04:00Z', '2026-08-25', '2026-W35', 2, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'retiro', NULL, '', 'mesamies', 'efectivo', 'Retiro yo, gracias.', 6, 54000, 0, 54000, 'demo-9108');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9203, 9108, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 1, 9000, 9000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9204, 9108, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 1, 9000, 9000, 'Hamburguesas de legumbres con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9205, 9108, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 4, 9000, 36000, 'Wok de ternera y vegetales');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9109, '2026-08-25T21:34:00Z', '2026-08-25', '2026-W35', 2, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 3, 31000, 2000, 33000, 'demo-9109');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9206, 9109, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 2, 9000, 18000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9207, 9109, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9110, '2026-08-25T13:57:00Z', '2026-08-25', '2026-W35', 2, 'whatsapp', 'panel', 'entregado', 'Carla Bogado', '343 555-5111', '3435555111', 'envio', 'fuera', 'Andrés Pazos 960', NULL, 'mercadopago', '', 1, 27000, 0, 27000, 'demo-9110');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9208, 9110, 'pack', 'x3', 'clasico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');

-- 2026-08-26 · miércoles · 7 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9111, '2026-08-26T13:08:00Z', '2026-08-26', '2026-W35', 3, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'envio', 'dentro', 'Andrés Pazos 960', NULL, 'mercadopago', 'Avisar cuando salga el reparto.', 1, 12800, 2000, 14800, 'demo-9111');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9209, 9111, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'xl', 1, 12800, 12800, 'Matambre a la pizza con puré');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9112, '2026-08-26T23:08:00Z', '2026-08-26', '2026-W35', 3, 'app', 'checkout-whatsapp', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', 'Sin sal, por favor.', 6, 61800, 0, 61800, 'demo-9112');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9210, 9112, 'vianda', '', '', NULL, 'lunes', 'proteico', 'xl', 1, 12800, 12800, 'Peceto al horno con puré de calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9211, 9112, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Pollo al limón con arroz yamaní');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9212, 9112, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9113, '2026-08-26T13:59:00Z', '2026-08-26', '2026-W35', 3, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'envio', 'dentro', 'Andrés Pazos 960', NULL, 'mercadopago', '', 1, 64000, 0, 64000, 'demo-9113');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9213, 9113, 'pack', 'x5', 'clasico', NULL, '', '', 'xl', 1, 64000, 64000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9114, '2026-08-26T20:41:00Z', '2026-08-26', '2026-W35', 3, 'app', 'checkout-whatsapp', 'entregado', 'Romina Schmidt', '343 555-5114', '3435555114', 'retiro', NULL, '', 'oximarket', 'mercadopago', 'Retiro yo, gracias.', 1, 45000, 0, 45000, 'demo-9114');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9214, 9114, 'pack', 'x5', 'clasico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9115, '2026-08-26T13:25:00Z', '2026-08-26', '2026-W35', 3, 'app', 'checkout-whatsapp', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Dejar en portería.', 1, 45000, 0, 45000, 'demo-9115');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9215, 9115, 'pack', 'x5', 'clasico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9116, '2026-08-26T15:05:00Z', '2026-08-26', '2026-W35', 3, 'app', 'checkout-whatsapp', 'entregado', 'Romina Schmidt', '343 555-5114', '3435555114', 'retiro', NULL, '', 'oximarket', 'mercadopago', 'Sin cebolla.', 4, 36000, 0, 36000, 'demo-9116');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9216, 9116, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 4, 9000, 36000, 'Matambre a la pizza con puré');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9117, '2026-08-26T17:36:00Z', '2026-08-26', '2026-W35', 3, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'envio', 'dentro', 'Andrés Pazos 960', NULL, 'mercadopago', '', 2, 102400, 0, 102400, 'demo-9117');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9217, 9117, 'pack', 'x4', 'clasico', NULL, '', '', 'xl', 2, 51200, 102400, 'Pack x4 días');

-- 2026-08-27 · jueves · 6 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9118, '2026-08-27T12:05:00Z', '2026-08-27', '2026-W35', 4, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 2, 18000, 2000, 20000, 'demo-9118');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9218, 9118, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 2, 9000, 18000, 'Pollo al curry con arroz basmati');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9119, '2026-08-27T16:06:00Z', '2026-08-27', '2026-W35', 4, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', 'Sin cebolla.', 3, 30800, 2000, 32800, 'demo-9119');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9219, 9119, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 1, 9000, 9000, 'Guiso de lentejas con carne');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9220, 9119, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 1, 9000, 9000, 'Matambre a la pizza con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9221, 9119, 'vianda', '', '', NULL, 'lunes', 'clasico', 'xl', 1, 12800, 12800, 'Pollo al limón con arroz yamaní');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9120, '2026-08-27T14:02:00Z', '2026-08-27', '2026-W35', 4, 'app', 'checkout-confirmado', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 6, 54000, 2000, 56000, 'demo-9120');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9222, 9120, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'estandar', 1, 9000, 9000, 'Tarta de acelga y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9223, 9120, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 3, 9000, 27000, 'Peceto al horno con puré de calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9224, 9120, 'vianda', '', '', NULL, 'jueves', 'proteico', 'estandar', 2, 9000, 18000, 'Bowl de pollo, huevo y palta');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9121, '2026-08-27T12:06:00Z', '2026-08-27', '2026-W35', 4, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 6, 54000, 2000, 56000, 'demo-9121');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9225, 9121, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 2, 9000, 18000, 'Pollo al curry con arroz basmati');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9226, 9121, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 4, 9000, 36000, 'Peceto al horno con puré de calabaza');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9122, '2026-08-27T22:35:00Z', '2026-08-27', '2026-W35', 4, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'envio', 'fuera', 'Perú 411', NULL, 'transferencia', '', 6, 58000, 2500, 60500, 'demo-9122');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9227, 9122, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Tarta de acelga y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9228, 9122, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Zapallitos rellenos de quinoa');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9229, 9122, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9123, '2026-08-27T14:47:00Z', '2026-08-27', '2026-W35', 4, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'envio', 'fuera', 'Perú 411', NULL, 'transferencia', '', 4, 36000, 2500, 38500, 'demo-9123');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9230, 9123, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 1, 9000, 9000, 'Tarta de acelga y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9231, 9123, 'vianda', '', '', NULL, 'lunes', 'ensalada', 'estandar', 3, 9000, 27000, 'De arroz yamaní y vegetales');

-- 2026-08-28 · viernes · 6 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9124, '2026-08-28T19:49:00Z', '2026-08-28', '2026-W35', 5, 'app', 'checkout-confirmado', 'entregado', 'Diego Villalba', '343 555-5113', '3435555113', 'retiro', NULL, '', 'base', 'transferencia', '', 2, 54000, 0, 54000, 'demo-9124');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9232, 9124, 'pack', 'x3', 'vegetariano', NULL, '', '', 'estandar', 2, 27000, 54000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9125, '2026-08-28T19:10:00Z', '2026-08-28', '2026-W35', 5, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', '', 1, 27000, 0, 27000, 'demo-9125');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9233, 9125, 'pack', 'x3', 'clasico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9126, '2026-08-28T22:45:00Z', '2026-08-28', '2026-W35', 5, 'app', 'checkout-confirmado', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', 'Sin sal, por favor.', 1, 45000, 0, 45000, 'demo-9126');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9234, 9126, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9127, '2026-08-28T22:08:00Z', '2026-08-28', '2026-W35', 5, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', 'Dejar en portería.', 7, 63000, 2000, 65000, 'demo-9127');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9235, 9127, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Empanadas de carne al horno');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9236, 9127, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 1, 9000, 9000, 'Guiso de lentejas con carne');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9237, 9127, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 2, 9000, 18000, 'Matambre a la pizza con puré');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9128, '2026-08-28T15:08:00Z', '2026-08-28', '2026-W35', 5, 'app', 'checkout-whatsapp', 'entregado', 'Diego Villalba', '343 555-5113', '3435555113', 'retiro', NULL, '', 'base', 'transferencia', '', 5, 52600, 0, 52600, 'demo-9128');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9238, 9128, 'vianda', '', '', NULL, 'lunes', 'vegetariano', 'xl', 2, 12800, 25600, 'Curry de garbanzos con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9239, 9128, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 3, 9000, 27000, 'Tarta de acelga y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9129, '2026-08-28T20:07:00Z', '2026-08-28', '2026-W35', 5, 'app', 'checkout-confirmado', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'retiro', NULL, '', 'mesamies', 'efectivo', '', 1, 9000, 0, 9000, 'demo-9129');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9240, 9129, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 1, 9000, 9000, 'Atún grillado con ensalada de quinoa');

-- 2026-08-30 · domingo · 10 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9130, '2026-08-30T18:57:00Z', '2026-08-30', '2026-W35', 7, 'whatsapp', 'panel', 'entregado', 'Carla Bogado', '343 555-5111', '3435555111', 'envio', 'fuera', 'Andrés Pazos 960', NULL, 'mercadopago', '', 5, 52600, 2500, 55100, 'demo-9130');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9241, 9130, 'vianda', '', '', NULL, 'lunes', 'clasico', 'xl', 2, 12800, 25600, 'Carne al horno con papas españolas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9242, 9130, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Bife a la criolla con puré mixto');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9243, 9130, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 1, 9000, 9000, 'Empanadas de carne al horno');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9131, '2026-08-30T20:35:00Z', '2026-08-30', '2026-W35', 7, 'app', 'checkout-whatsapp', 'entregado', 'Romina Schmidt', '343 555-5114', '3435555114', 'retiro', NULL, '', 'oximarket', 'mercadopago', 'Sin cebolla.', 3, 38400, 0, 38400, 'demo-9131');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9244, 9131, 'vianda', '', '', NULL, 'jueves', 'clasico', 'xl', 3, 12800, 38400, 'Carne al horno con papas españolas');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9132, '2026-08-30T23:09:00Z', '2026-08-30', '2026-W35', 7, 'app', 'checkout-whatsapp', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Sin sal, por favor.', 6, 65400, 2500, 67900, 'demo-9132');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9245, 9132, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Carne al horno con papas españolas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9246, 9132, 'vianda', '', '', NULL, 'jueves', 'clasico', 'xl', 3, 12800, 38400, 'Bife a la criolla con puré mixto');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9247, 9132, 'vianda', '', '', NULL, 'viernes', 'clasico', 'estandar', 1, 9000, 9000, 'Empanadas de carne al horno');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9133, '2026-08-30T18:46:00Z', '2026-08-30', '2026-W35', 7, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', 'Avisar cuando salga el reparto.', 1, 36000, 0, 36000, 'demo-9133');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9248, 9133, 'pack', 'x4', 'clasico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9134, '2026-08-30T19:11:00Z', '2026-08-30', '2026-W35', 7, 'app', 'checkout-whatsapp', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', '', 1, 27000, 0, 27000, 'demo-9134');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9249, 9134, 'pack', 'x3', 'clasico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9135, '2026-08-30T21:31:00Z', '2026-08-30', '2026-W35', 7, 'app', 'checkout-whatsapp', 'entregado', 'Gabriel Ledesma', '343 555-5107', '3435555107', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'mercadopago', '', 1, 45000, 0, 45000, 'demo-9135');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9250, 9135, 'pack', 'x5', 'clasico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9136, '2026-08-30T20:30:00Z', '2026-08-30', '2026-W35', 7, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Tocar timbre 2B.', 5, 56400, 2000, 58400, 'demo-9136');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9251, 9136, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 1, 9000, 9000, 'Merluza al horno con vegetales');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9252, 9136, 'vianda', '', '', NULL, 'martes', 'proteico', 'xl', 3, 12800, 38400, 'Lomo salteado con arroz integral');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9253, 9136, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 1, 9000, 9000, 'Atún grillado con ensalada de quinoa');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9137, '2026-08-30T15:10:00Z', '2026-08-30', '2026-W35', 7, 'whatsapp', 'panel', 'cancelado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'envio', 'fuera', 'Perú 411', NULL, 'transferencia', '', 1, 9000, 2500, 11500, 'demo-9137');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9254, 9137, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 1, 9000, 9000, 'Milanesa de berenjena con puré');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9138, '2026-08-30T16:04:00Z', '2026-08-30', '2026-W35', 7, 'whatsapp', 'panel', 'entregado', 'Martín Ocampo', '343 555-5110', '3435555110', 'envio', 'dentro', 'Perú 411', NULL, 'transferencia', '', 7, 74600, 2000, 76600, 'demo-9138');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9255, 9138, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'xl', 2, 12800, 25600, 'Milanesa de berenjena con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9256, 9138, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 1, 9000, 9000, 'Bife a la criolla con puré mixto');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9257, 9138, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 3, 9000, 27000, 'Empanadas de carne al horno');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9258, 9138, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9139, '2026-08-30T17:10:00Z', '2026-08-30', '2026-W35', 7, 'whatsapp', 'panel', 'entregado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Sin cebolla.', 1, 27000, 0, 27000, 'demo-9139');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9259, 9139, 'pack', 'x3', 'proteico', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');

-- 2026-08-31 · lunes · 9 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9140, '2026-08-31T19:24:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-whatsapp', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', '', 8, 79600, 2500, 82100, 'demo-9140');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9260, 9140, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 4, 9000, 36000, 'Pollo al verdeo con arroz');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9261, 9140, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 2, 9000, 18000, 'Carne al horno con papas españolas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9262, 9140, 'vianda', '', '', NULL, 'jueves', 'clasico', 'xl', 2, 12800, 25600, 'Bife a la criolla con puré mixto');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9141, '2026-08-31T22:52:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', '', 1, 198000, 0, 198000, 'demo-9141');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9263, 9141, 'plan', '', 'proteico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9142, '2026-08-31T12:06:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-confirmado', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Sin sal, por favor.', 9, 81000, 2500, 83500, 'demo-9142');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9264, 9142, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 2, 9000, 18000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9265, 9142, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 3, 9000, 27000, 'Carne al horno con papas españolas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9266, 9142, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Bife a la criolla con puré mixto');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9143, '2026-08-31T16:05:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 5, 45000, 2000, 47000, 'demo-9143');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9267, 9143, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 1, 9000, 9000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9268, 9143, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 2, 9000, 18000, 'Milanesa de berenjena con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9269, 9143, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 2, 9000, 18000, 'Lomo salteado con arroz integral');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9144, '2026-08-31T13:06:00Z', '2026-08-31', '2026-W36', 1, 'whatsapp', 'panel', 'entregado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'envio', 'dentro', 'Andrés Pazos 960', NULL, 'mercadopago', '', 1, 64000, 0, 64000, 'demo-9144');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9270, 9144, 'pack', 'x5', 'clasico', NULL, '', '', 'xl', 1, 64000, 64000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9145, '2026-08-31T13:59:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-confirmado', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 1, 36000, 0, 36000, 'demo-9145');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9271, 9145, 'pack', 'x4', 'proteico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9146, '2026-08-31T17:37:00Z', '2026-08-31', '2026-W36', 1, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'envio', 'fuera', 'Perú 411', NULL, 'transferencia', 'Avisar cuando salga el reparto.', 5, 49000, 2500, 51500, 'demo-9146');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9272, 9146, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 3, 9000, 27000, 'Guiso de lentejas y calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9273, 9146, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 1, 9000, 9000, 'Milanesa de berenjena con puré');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9274, 9146, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9147, '2026-08-31T13:38:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-whatsapp', 'entregado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', 'Dejar en portería.', 1, 9000, 2500, 11500, 'demo-9147');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9275, 9147, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 1, 9000, 9000, 'Guiso de lentejas y calabaza');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9148, '2026-08-31T22:08:00Z', '2026-08-31', '2026-W36', 1, 'app', 'checkout-confirmado', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'retiro', NULL, '', 'base', 'efectivo', '', 2, 90000, 0, 90000, 'demo-9148');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9276, 9148, 'pack', 'x5', 'clasico', NULL, '', '', 'estandar', 2, 45000, 90000, 'Pack x5 días');

-- 2026-09-01 · martes · 8 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9149, '2026-09-01T17:48:00Z', '2026-09-01', '2026-W36', 2, 'whatsapp', 'panel', 'cancelado', 'Consultorio Odontológico Rossi', '343 555-5104', '3435555104', 'envio', 'dentro', 'Andrés Pazos 960', NULL, 'mercadopago', 'Avisar cuando salga el reparto.', 3, 38400, 2000, 40400, 'demo-9149');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9277, 9149, 'vianda', '', '', NULL, 'viernes', 'clasico', 'xl', 3, 12800, 38400, 'Canelones de carne y verdura');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9150, '2026-09-01T19:32:00Z', '2026-09-01', '2026-W36', 2, 'app', 'checkout-whatsapp', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', 'Dejar en portería.', 1, 45000, 0, 45000, 'demo-9150');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9278, 9150, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 1, 45000, 45000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9151, '2026-09-01T18:34:00Z', '2026-09-01', '2026-W36', 2, 'app', 'checkout-whatsapp', 'confirmado', 'Andrea Miño', '343 555-5105', '3435555105', 'envio', 'fuera', 'Córdoba 455', NULL, 'mercadopago', '', 5, 49000, 2500, 51500, 'demo-9151');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9279, 9151, 'vianda', '', '', NULL, 'martes', 'ensalada', 'estandar', 2, 9000, 18000, 'Caprese con quinoa');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9280, 9151, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 2, 9000, 18000, 'Pechuga rellena con espinaca y queso');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9281, 9151, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9152, '2026-09-01T21:06:00Z', '2026-09-01', '2026-W36', 2, 'app', 'checkout-whatsapp', 'confirmado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'retiro', NULL, '', 'mesamies', 'efectivo', '', 2, 90000, 0, 90000, 'demo-9152');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9282, 9152, 'pack', 'x5', 'proteico', NULL, '', '', 'estandar', 2, 45000, 90000, 'Pack x5 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9153, '2026-09-01T12:06:00Z', '2026-09-01', '2026-W36', 2, 'app', 'checkout-whatsapp', 'confirmado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', '', 1, 36000, 0, 36000, 'demo-9153');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9283, 9153, 'pack', 'x4', 'clasico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9154, '2026-09-01T20:46:00Z', '2026-09-01', '2026-W36', 2, 'whatsapp', 'panel', 'confirmado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'retiro', NULL, '', 'mesamies', 'transferencia', '', 8, 72000, 0, 72000, 'demo-9154');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9284, 9154, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 4, 9000, 36000, 'Ñoquis de calabaza con salsa fileto');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9285, 9154, 'vianda', '', '', NULL, 'miercoles', 'vegetariano', 'estandar', 2, 9000, 18000, 'Guiso de lentejas y calabaza');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9286, 9154, 'vianda', '', '', NULL, 'viernes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Milanesa de berenjena con puré');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9155, '2026-09-01T18:26:00Z', '2026-09-01', '2026-W36', 2, 'app', 'checkout-whatsapp', 'confirmado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Dejar en portería.', 1, 36000, 0, 36000, 'demo-9155');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9287, 9155, 'pack', 'x4', 'clasico', NULL, '', '', 'estandar', 1, 36000, 36000, 'Pack x4 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9156, '2026-09-01T23:15:00Z', '2026-09-01', '2026-W36', 2, 'app', 'checkout-whatsapp', 'confirmado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', 'Tocar timbre 2B.', 3, 27000, 2000, 29000, 'demo-9156');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9288, 9156, 'vianda', '', '', NULL, 'jueves', 'ensalada', 'estandar', 3, 9000, 27000, 'Caprese con quinoa');

-- 2026-09-02 · miércoles · 8 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9157, '2026-09-02T23:19:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-whatsapp', 'cancelado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', 'Dejar en portería.', 5, 48800, 2000, 50800, 'demo-9157');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9289, 9157, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 1, 12800, 12800, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9290, 9157, 'vianda', '', '', NULL, 'miercoles', 'clasico', 'estandar', 4, 9000, 36000, 'Canelones de carne y verdura');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9158, '2026-09-02T19:08:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-confirmado', 'confirmado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', '', 3, 38600, 2500, 41100, 'demo-9158');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9291, 9158, 'vianda', '', '', NULL, 'martes', 'clasico', 'xl', 2, 12800, 25600, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9292, 9158, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9159, '2026-09-02T19:40:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-whatsapp', 'entregado', 'Federico Aguirre', '343 555-5115', '3435555115', 'retiro', NULL, '', 'oximarket', 'efectivo', 'Retiro yo, gracias.', 1, 198000, 0, 198000, 'demo-9159');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9293, 9159, 'plan', '', 'clasico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9160, '2026-09-02T23:42:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-confirmado', 'entregado', 'Estudio Contable Bertoldi', '343 555-5101', '3435555101', 'envio', 'dentro', 'Gualeguaychú 780', NULL, 'efectivo', '', 5, 45000, 2000, 47000, 'demo-9160');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9294, 9160, 'vianda', '', '', NULL, 'viernes', 'proteico', 'estandar', 1, 9000, 9000, 'Salmón rosado con puré de coliflor');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9295, 9160, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 4, 9000, 36000, 'Canelones de carne y verdura');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9161, '2026-09-02T15:02:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-whatsapp', 'entregado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', 'Dejar en portería.', 11, 110400, 2500, 112900, 'demo-9161');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9296, 9161, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 5, 9000, 45000, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9297, 9161, 'vianda', '', '', NULL, 'martes', 'ensalada', 'xl', 3, 12800, 38400, 'Caprese con quinoa');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9298, 9161, 'vianda', '', '', NULL, 'jueves', 'clasico', 'estandar', 3, 9000, 27000, 'Pollo al verdeo con arroz');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9162, '2026-09-02T15:57:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-whatsapp', 'confirmado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', 'Sin sal, por favor.', 4, 47400, 2000, 49400, 'demo-9162');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9299, 9162, 'vianda', '', '', NULL, 'lunes', 'clasico', 'estandar', 1, 9000, 9000, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9300, 9162, 'vianda', '', '', NULL, 'viernes', 'proteico', 'xl', 3, 12800, 38400, 'Bowl de carne magra, boniato y brócoli');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9163, '2026-09-02T22:24:00Z', '2026-09-02', '2026-W36', 3, 'whatsapp', 'panel', 'entregado', 'Lucía Grinóvero', '343 555-5102', '3435555102', 'envio', 'fuera', 'Perú 411', NULL, 'transferencia', '', 1, 27000, 0, 27000, 'demo-9163');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9301, 9163, 'pack', 'x3', 'vegetariano', NULL, '', '', 'estandar', 1, 27000, 27000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9164, '2026-09-02T23:29:00Z', '2026-09-02', '2026-W36', 3, 'app', 'checkout-confirmado', 'cancelado', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'envio', 'fuera', 'Monte Caseros 620', NULL, 'efectivo', '', 1, 9000, 2500, 11500, 'demo-9164');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9302, 9164, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 1, 9000, 9000, 'Pastel de papas');

-- 2026-09-03 · jueves · 8 pedido(s)
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9165, '2026-09-03T18:31:00Z', '2026-09-03', '2026-W36', 4, 'whatsapp', 'panel', 'confirmado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Tocar timbre 2B.', 7, 63000, 2000, 65000, 'demo-9165');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9303, 9165, 'vianda', '', '', NULL, 'lunes', 'proteico', 'estandar', 3, 9000, 27000, 'Pollo grillado con quinoa y vegetales asados');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9304, 9165, 'vianda', '', '', NULL, 'jueves', 'vegetariano', 'estandar', 4, 9000, 36000, 'Wok de vegetales con arroz yamaní');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9166, '2026-09-03T22:22:00Z', '2026-09-03', '2026-W36', 4, 'app', 'checkout-whatsapp', 'nuevo', 'Diego Villalba', '343 555-5113', '3435555113', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'transferencia', '', 2, 18000, 2000, 20000, 'demo-9166');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9305, 9166, 'vianda', '', '', NULL, 'martes', 'vegetariano', 'estandar', 2, 9000, 18000, 'Tarta de calabaza, puerro y queso');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9167, '2026-09-03T22:10:00Z', '2026-09-03', '2026-W36', 4, 'whatsapp', 'panel', 'confirmado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Tocar timbre 2B.', 5, 45000, 2000, 47000, 'demo-9167');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9306, 9167, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 3, 9000, 27000, 'Pollo grillado con quinoa y vegetales asados');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9307, 9167, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 2, 9000, 18000, 'Salmón rosado con puré de coliflor');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9168, '2026-09-03T19:48:00Z', '2026-09-03', '2026-W36', 4, 'whatsapp', 'panel', 'confirmado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', 'Tocar timbre 2B.', 1, 198000, 0, 198000, 'demo-9168');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9308, 9168, 'plan', '', 'proteico', NULL, '', '', 'estandar', 1, 198000, 198000, 'Plan mensual');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9169, '2026-09-03T20:23:00Z', '2026-09-03', '2026-W36', 4, 'whatsapp', 'panel', 'confirmado', 'Paula Zapata', '343 555-5103', '3435555103', 'envio', 'dentro', 'España 275', NULL, 'transferencia', '', 4, 40000, 2000, 42000, 'demo-9169');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9309, 9169, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 2, 9000, 18000, 'Pollo grillado con quinoa y vegetales asados');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9310, 9169, 'vianda', '', '', NULL, 'martes', 'proteico', 'estandar', 1, 9000, 9000, 'Salmón rosado con puré de coliflor');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9311, 9169, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9170, '2026-09-03T20:16:00Z', '2026-09-03', '2026-W36', 4, 'app', 'checkout-whatsapp', 'nuevo', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', '', 5, 45000, 2000, 47000, 'demo-9170');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9312, 9170, 'vianda', '', '', NULL, 'martes', 'ensalada', 'estandar', 3, 9000, 27000, 'César de pollo');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9313, 9170, 'vianda', '', '', NULL, 'jueves', 'ensalada', 'estandar', 2, 9000, 18000, 'Mediterránea con garbanzos');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9171, '2026-09-03T18:47:00Z', '2026-09-03', '2026-W36', 4, 'app', 'checkout-whatsapp', 'nuevo', 'Marisa Ferreyra', '343 555-5100', '3435555100', 'retiro', NULL, '', 'base', 'efectivo', '', 2, 54000, 0, 54000, 'demo-9171');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9314, 9171, 'pack', 'x3', 'clasico', NULL, '', '', 'estandar', 2, 27000, 54000, 'Pack x3 días');
INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (
  9172, '2026-09-03T12:11:00Z', '2026-09-03', '2026-W36', 4, 'app', 'checkout-whatsapp', 'confirmado', 'Verónica Kloster', '343 555-5109', '3435555109', 'envio', 'dentro', 'Santa Fe 1533', NULL, 'efectivo', '', 4, 43800, 2000, 45800, 'demo-9172');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9315, 9172, 'vianda', '', '', NULL, 'miercoles', 'proteico', 'estandar', 1, 9000, 9000, 'Pollo grillado con quinoa y vegetales asados');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9316, 9172, 'vianda', '', '', NULL, 'martes', 'clasico', 'estandar', 1, 9000, 9000, 'Pastel de papas');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9317, 9172, 'vianda', '', '', NULL, 'jueves', 'clasico', 'xl', 1, 12800, 12800, 'Canelones de carne y verdura');
INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (
  9318, 9172, 'extra', 'burger8', '', NULL, '', '', '', 1, 13000, 13000, 'Hamburguesas de legumbres');

-- --------------------------------------------------------------------
-- COTIZACIONES · el formulario de empresas de la landing
-- --------------------------------------------------------------------
-- Tres quedan en "nueva" a propósito: es lo que hace que la portada
-- del panel muestre la chapa de "sin responder", que es justamente lo
-- que hay que poder mostrar.
--
-- Los mails van todos a .test, que es un dominio reservado que no
-- existe y no se le puede mandar correo a nadie sin querer.

INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9000, 'Estudio Jurídico Bertoldi y Asoc.', 'Marina Bertoldi', 'marina@ejemplo.test', '343 555-2010', 12, 'Centro', 'Lunes a viernes', 'Buenas tardes. Somos 12 en el estudio y estamos buscando almuerzo diario. ¿Tienen plan corporativo con factura A?', 'nueva', 'demo', '2026-09-02 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9001, 'Clínica del Sol', 'Hernán Cattaneo', 'administracion@ejemplo.test', '343 555-2011', 25, 'Fuera de bulevares', 'Lunes, miércoles y viernes', 'Necesitamos cubrir el turno tarde del personal de enfermería. Nos interesa la opción proteica y algo vegetariano.', 'nueva', 'demo', '2026-09-01 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9002, 'Cooperativa La Delta', 'Silvina Roldán', 'silvina@ejemplo.test', '343 555-2012', 8, 'Centro', 'Martes y jueves', '¿Hacen entrega en Puerto Sánchez? Somos 8 y arrancaríamos con dos días.', 'nueva', 'demo', '2026-08-30 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9003, 'Software Litoral SRL', 'Pablo Giménez', 'pablo@ejemplo.test', '343 555-2013', 18, 'Centro', 'Lunes a viernes', 'Quedamos en que mandaban la propuesta con el precio por persona. ¡Gracias!', 'contactada', 'demo', '2026-08-28 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9004, 'Colegio San Jorge', 'Rita Almada', 'rita@ejemplo.test', '343 555-2014', 30, 'Fuera de bulevares', 'Lunes a viernes', 'Para el personal docente. Necesitaríamos arrancar el mes que viene.', 'contactada', 'demo', '2026-08-25 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9005, 'Inmobiliaria Paraná Norte', 'Cecilia Kunz', 'cecilia@ejemplo.test', '343 555-2015', 6, 'Centro', 'Miércoles', 'Somos pocos pero fijos. ¿Se puede un solo día por semana?', 'contactada', 'demo', '2026-08-22 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9006, 'Gimnasio Fuerza Viva', 'Matías Ledesma', 'matias@ejemplo.test', '343 555-2016', 15, 'Centro', 'Lunes a viernes', 'Arrancamos el mes que viene con el pack proteico para los socios. Ya está todo hablado.', 'cerrada', 'demo', '2026-08-17 14:20:00');
INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (
  9007, 'Contaduría Ramseyer', 'Nadia Ramseyer', 'nadia@ejemplo.test', '343 555-2017', 5, 'Centro', 'Martes y jueves', 'Gracias por la propuesta, por ahora lo dejamos para más adelante.', 'cerrada', 'demo', '2026-08-12 14:20:00');

-- --------------------------------------------------------------------
-- PUBLICACIONES · tips, recetas e info nutricional
-- --------------------------------------------------------------------
-- Van sin imagen (imagen = ''): las fotos viven en el bucket R2 y se
-- suben desde el panel, no desde un .sql. Si querés que en la demo
-- tengan foto, subilas a mano desde /admin/publicaciones/.
--
-- Dos quedan en borrador para poder mostrar que un borrador NO sale en
-- la landing: ni en el listado ni entrando derecho a su link.

DELETE FROM publicaciones WHERE id = 'tres-mitos-sobre-comer-liviano';
INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (
  'tres-mitos-sobre-comer-liviano', 'Tres mitos sobre comer liviano', 'Liviano no es sinónimo de poca comida. Te contamos qué mirar de verdad.', 'El primero es el más común: creer que una vianda liviana tiene que dejarte con hambre. No. Una porción bien armada combina proteína, vegetales y un hidrato de calidad, y eso sostiene la energía toda la tarde.

El segundo es pensar que todo lo light sirve. Muchos productos ultraprocesados bajan las calorías sumando aditivos y sodio. Preferimos comida de verdad, cocinada el mismo día.

El tercero es el más difícil de soltar: que comer bien es caro. Cuando planificás la semana y no comprás de apuro al mediodía, el número cierra.', 'tip', '', '', 'publicado', '2026-08-12');

DELETE FROM publicaciones WHERE id = 'como-armamos-el-menu-del-mes';
INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (
  'como-armamos-el-menu-del-mes', 'Cómo armamos el menú del mes', 'Detrás de cada semana hay una planificación que empieza mucho antes.', 'El menú lo arma nuestra nutricionista con un mes de anticipación, y no se trata sólo de elegir platos ricos. Se busca rotar las fuentes de proteína a lo largo de la semana, que haya al menos dos días con legumbres y que las verduras cambien de color y de tipo.

Después viene la parte de cocina: qué se puede producir bien en volumen sin perder calidad, y qué conviene dejar para otra semana.

Por eso vas a ver que ningún plato se repite dentro del mismo mes.', 'nutricion', '', '', 'publicado', '2026-08-19');

DELETE FROM publicaciones WHERE id = 'budin-de-banana-y-avena';
INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (
  'budin-de-banana-y-avena', 'Budín de banana y avena', 'Sin azúcar agregada y con lo que ya tenés en la alacena.', 'Ingredientes: 3 bananas bien maduras, 2 huevos, 1 taza de avena, 1 cucharadita de polvo de hornear, canela a gusto y un puñado de nueces.

Preparación: pisá las bananas hasta hacer un puré, sumá los huevos y mezclá. Agregá la avena, el polvo de hornear y la canela. Integrá las nueces al final.

Horno a 180° durante 35 minutos. Se conserva tres días en la heladera y se puede congelar en porciones.', 'receta', '', '', 'publicado', '2026-08-25');

DELETE FROM publicaciones WHERE id = 'por-que-cocinamos-el-mismo-dia';
INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (
  'por-que-cocinamos-el-mismo-dia', 'Por qué cocinamos el mismo día', 'La diferencia entre una vianda rica y una que apenas sobrevive al microondas.', 'Toda nuestra producción sale el mismo día que se entrega. No congelamos las viandas del día ni cocinamos el fin de semana para toda la semana siguiente.

Eso limita cuánto podemos producir, es cierto. Pero es lo que hace que un brócoli llegue verde y firme, y no gris y deshecho.

Lo único que sí va congelado son los productos que se venden así de entrada, como las hamburguesas de legumbres, y en ese caso lo aclaramos siempre.', 'tip', '', '', 'publicado', '2026-08-30');

DELETE FROM publicaciones WHERE id = 'guia-de-porciones-para-la-semana';
INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (
  'guia-de-porciones-para-la-semana', 'Guía de porciones para la semana', 'Cuánto necesitás realmente según cómo viene tu día.', 'Borrador en preparación. Falta revisar las referencias y sumar la tabla comparativa entre el menú estándar y el XL.', 'nutricion', '', '', 'borrador', '2026-09-01');

DELETE FROM publicaciones WHERE id = 'ensalada-de-lentejas-y-calabaza';
INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (
  'ensalada-de-lentejas-y-calabaza', 'Ensalada de lentejas y calabaza', 'Rinde para dos días y se come fría o tibia.', 'Borrador: falta sacar la foto del plato terminado y ajustar las cantidades para cuatro porciones.', 'receta', '', '', 'borrador', '2026-09-02');


-- --------------------------------------------------------------------
-- FIN · lo que quedó cargado
-- --------------------------------------------------------------------
--   pedidos ........ 173
--   ítems .......... 319
--   cotizaciones ... 8 (3 sin responder)
--   publicaciones .. 6 (4 publicadas, 2 borrador)
--   días de menú ... 35
