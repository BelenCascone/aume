/* =====================================================================
   AUMÉ · worker/db/generar-demo.mjs
   Escribe worker/db/demo.sql: datos ficticios para mostrar el panel.

   POR QUÉ ES UN GENERADOR Y NO UN .sql ESCRITO A MANO
   ---------------------------------------------------------------------
   Los datos de demo se pudren rápido. Un archivo con fechas fijas sirve
   el día que se escribe: una semana después el tablero muestra "Hoy"
   vacío y los últimos días en cero, que es justo lo contrario de lo que
   se quiere mostrar. Este script arma todo relativo al día en que se
   corre, así la demo siempre se ve viva.

       node worker/db/generar-demo.mjs > worker/db/demo.sql

   Se le puede pasar otra fecha de referencia (útil para probar):

       node worker/db/generar-demo.mjs 2026-09-10 > worker/db/demo.sql

   Con la misma fecha de referencia sale siempre el mismo archivo: el
   azar va con semilla fija a propósito, para que el diff sea legible y
   no cambie entero en cada corrida.
   ===================================================================== */

const HOY = process.argv[2] || new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(HOY)) {
  console.error('Fecha inválida: ' + HOY + '. Se espera YYYY-MM-DD.');
  process.exit(1);
}

/* PRNG con semilla fija (mulberry32). */
let _s = 0x9e3779b9;
function rnd() {
  _s |= 0; _s = (_s + 0x6D2B79F5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ent = (n) => Math.floor(rnd() * n);
const elegir = (a) => a[ent(a.length)];
const pesado = (pares) => {
  const total = pares.reduce((s, p) => s + p[1], 0);
  let r = rnd() * total;
  for (const [v, p] of pares) { if ((r -= p) < 0) return v; }
  return pares[pares.length - 1][0];
};

/* ------------------------------------------------------------ fechas */
const DIA_MS = 86400000;
const aDate = (iso) => new Date(iso + 'T12:00:00Z');
const aISO = (d) => d.toISOString().slice(0, 10);
const sumar = (iso, n) => aISO(new Date(aDate(iso).getTime() + n * DIA_MS));
const diaSemana = (iso) => aDate(iso).getUTCDay() || 7;
const DIA_ID = ['', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', '', ''];
const NOMBRE_DIA = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const antiguedad = (iso) => Math.round((aDate(HOY) - aDate(iso)) / DIA_MS);

/* Misma cuenta que worker/lib/tiempo.js, para que las semanas del
   tablero coincidan con las que calcula el worker cuando entra un
   pedido de verdad. Si estas dos fórmulas se separan, una misma semana
   aparece partida en dos en el gráfico. */
function semanaISO(iso) {
  const d = aDate(iso);
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const anio = d.getUTCFullYear();
  const inicio = new Date(Date.UTC(anio, 0, 1));
  return anio + '-W' + String(Math.ceil(((d - inicio) / DIA_MS + 1) / 7)).padStart(2, '0');
}

const LUNES = sumar(HOY, -(diaSemana(HOY) - 1));   // lunes de esta semana

/* ------------------------------------------------------------- SQL */
const out = [];
const w = (s) => out.push(s);
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const titulo = (t) => {
  w('');
  w('-- ' + '-'.repeat(68));
  w('-- ' + t);
  w('-- ' + '-'.repeat(68));
};

/* ==================================================================== */
/* CATÁLOGO DE PLATOS                                                   */
/* ==================================================================== */

const PLATOS = {
  clasico: [
    ['Milanesa de ternera al horno con puré rústico', 'Milanesa horneada con costra de avena y puré de papa y calabaza.', '["Sin fritura"]'],
    ['Pastel de papas', 'Carne cortada a cuchillo con cubierta de papa y batata.', '[]'],
    ['Canelones de carne y verdura', 'Con salsa de tomate casera y un toque de queso gratinado.', '[]'],
    ['Pollo al verdeo con arroz', 'Suprema en salsa de verdeo liviana y arroz largo fino.', '[]'],
    ['Carne al horno con papas españolas', 'Cuadrada de ternera braseada con papas y cebolla.', '[]'],
    ['Bife a la criolla con puré mixto', 'Bife de cuadril con tomate, cebolla y morrón.', '[]'],
    ['Empanadas de carne al horno', 'Seis unidades, carne cortada a cuchillo, masa casera.', '["Sin fritura"]'],
    ['Guiso de lentejas con carne', 'Lentejas con chorizo colorado suave y verduras.', '[]'],
    ['Matambre a la pizza con puré', 'Matambre tiernizado, salsa y muzzarella gratinada.', '[]'],
    ['Pollo al limón con arroz yamaní', 'Marinado en limón y romero, con arroz integral.', '[]'],
    ['Albóndigas caseras con fideos', 'Albóndigas de carne y avena en salsa fileto.', '[]'],
    ['Cerdo al horno con batatas', 'Bondiola al horno con batatas asadas y romero.', '[]'],
    ['Tortilla de papas con ensalada', 'Tortilla jugosa de papa y cebolla, con ensalada mixta.', '[]'],
    ['Estofado de ternera con arroz', 'Cocción lenta con zanahoria, arvejas y papa.', '[]'],
    ['Milanesa napolitana con puré', 'Milanesa al horno con salsa, jamón y queso.', '["Sin fritura"]']
  ],
  vegetariano: [
    ['Tarta de calabaza, puerro y queso', 'Masa casera integral con relleno cremoso de calabaza asada.', '["Vegetariano"]'],
    ['Wok de vegetales con arroz yamaní', 'Salteado de vegetales de estación con soja y jengibre.', '["Vegano"]'],
    ['Ñoquis de calabaza con salsa fileto', 'Ñoquis caseros de calabaza con albahaca fresca.', '["Vegetariano"]'],
    ['Guiso de lentejas y calabaza', 'Lentejas con calabaza, zanahoria y comino.', '["Vegano"]'],
    ['Milanesa de berenjena con puré', 'Berenjena al horno rebozada en avena y sésamo.', '["Vegetariano","Sin fritura"]'],
    ['Budín de espinaca y ricota', 'Con salsa liviana de tomate y albahaca.', '["Vegetariano"]'],
    ['Curry de garbanzos con arroz', 'Garbanzos en leche de coco con curry suave.', '["Vegano","Sin TACC"]'],
    ['Tarta de acelga y queso', 'Masa integral con acelga salteada y ricota.', '["Vegetariano"]'],
    ['Zapallitos rellenos de quinoa', 'Rellenos de quinoa, choclo y queso, al horno.', '["Vegetariano","Sin TACC"]'],
    ['Lasaña de vegetales', 'Capas de berenjena, zucchini y salsa bechamel liviana.', '["Vegetariano"]'],
    ['Hamburguesas de legumbres con puré', 'De lentejas y avena, con puré de calabaza.', '["Vegano"]'],
    ['Risotto de hongos', 'Arroz carnaroli con hongos de pino y perejil.', '["Vegetariano","Sin TACC"]'],
    ['Empanadas de humita al horno', 'Seis unidades de choclo cremoso y cebolla de verdeo.', '["Vegetariano"]'],
    ['Fideos integrales al pesto', 'Con pesto de albahaca, nuez y aceite de oliva.', '["Vegetariano"]'],
    ['Tortilla de zapallito y cebolla', 'Jugosa, con ensalada de hojas verdes.', '["Vegetariano","Sin TACC"]']
  ],
  proteico: [
    ['Pollo grillado con quinoa y vegetales asados', 'Suprema marinada en hierbas sobre quinoa y mix de estación.', '["Alto en proteína","Sin TACC"]'],
    ['Salmón rosado con puré de coliflor', 'Al horno con limón y eneldo, sobre puré liviano.', '["Omega 3","Sin TACC"]'],
    ['Bowl de carne magra, boniato y brócoli', 'Cubos de nalga salteados con boniato asado.', '["Alto en proteína"]'],
    ['Pechuga rellena con espinaca y queso', 'Con ensalada tibia de vegetales asados.', '["Alto en proteína","Sin TACC"]'],
    ['Merluza al horno con vegetales', 'Filete con limón, papas al natural y zanahoria.', '["Omega 3","Sin TACC"]'],
    ['Lomo salteado con arroz integral', 'Lomo, morrón y cebolla salteados al wok.', '["Alto en proteína"]'],
    ['Atún grillado con ensalada de quinoa', 'Con tomate cherry, pepino y hojas verdes.', '["Omega 3","Sin TACC"]'],
    ['Pollo al curry con arroz basmati', 'Curry suave con leche de coco.', '["Alto en proteína","Sin TACC"]'],
    ['Peceto al horno con puré de calabaza', 'Cocción lenta, con hierbas frescas.', '["Alto en proteína","Sin TACC"]'],
    ['Bowl de pollo, huevo y palta', 'Con arroz yamaní, huevo duro y palta.', '["Alto en proteína"]'],
    ['Pescado a la provenzal con papas', 'Filete con ajo, perejil y papas al horno.', '["Omega 3","Sin TACC"]'],
    ['Wok de ternera y vegetales', 'Tiras de ternera con brócoli, zanahoria y sésamo.', '["Alto en proteína"]'],
    ['Pollo al horno con boniato', 'Muslo deshuesado con boniato y romero.', '["Alto en proteína","Sin TACC"]'],
    ['Tortilla proteica de claras y espinaca', 'Con ensalada de hojas y semillas.', '["Alto en proteína","Sin TACC"]'],
    ['Cerdo magro con puré de coliflor', 'Solomillo de cerdo con hierbas.', '["Alto en proteína","Sin TACC"]']
  ],
  ensalada: [
    ['César de pollo', 'Lechuga, pollo grillado, croutons, queso y aderezo liviano.', '["Fresca"]'],
    ['Mediterránea con garbanzos', 'Garbanzos, tomate, pepino, aceitunas, queso y oliva.', '["Vegetariana"]'],
    ['Caprese con quinoa', 'Tomate, muzzarella, albahaca y quinoa.', '["Vegetariana","Sin TACC"]'],
    ['Verde con atún y huevo', 'Mix de hojas, atún, huevo duro y tomate cherry.', '["Sin TACC"]'],
    ['Waldorf liviana', 'Manzana verde, apio, nuez y pollo, con aderezo de yogur.', '["Fresca"]'],
    ['De lentejas y vegetales asados', 'Lentejas, calabaza, morrón y cebolla morada.', '["Vegana"]'],
    ['Griega con feta', 'Pepino, tomate, aceituna, cebolla morada y queso feta.', '["Vegetariana","Sin TACC"]'],
    ['Tibia de pollo y batata', 'Hojas verdes, pollo grillado y batata asada.', '["Sin TACC"]'],
    ['De arroz yamaní y vegetales', 'Con zanahoria, choclo, arvejas y aderezo cítrico.', '["Vegana"]'],
    ['Coleslaw con pollo', 'Repollo, zanahoria y pollo con aderezo de yogur.', '["Fresca"]'],
    ['De quinoa, palta y tomate', 'Con semillas de girasol y limón.', '["Vegana","Sin TACC"]'],
    ['Primavera con huevo', 'Lechuga, tomate, zanahoria, huevo y aceitunas.', '["Vegetariana","Sin TACC"]']
  ]
};
const CATS = ['clasico', 'vegetariano', 'proteico', 'ensalada'];

/* ==================================================================== */
/* ENCABEZADO                                                           */
/* ==================================================================== */

w('-- =====================================================================');
w('-- AUMÉ · worker/db/demo.sql   ·   DATOS FICTICIOS PARA LA DEMO');
w('-- ---------------------------------------------------------------------');
w('-- ⚠️ ESTO VA SÓLO A STAGING. Nunca a producción.');
w('--');
w('--   npx wrangler d1 execute aume-staging --remote --file=worker/db/demo.sql');
w('--');
w('-- Para qué existe: con la base recién sembrada el panel se ve vacío');
w('-- —estadísticas en cero, la tabla de pedidos sin una fila— y así no se');
w('-- puede mostrar cómo funciona. Esto la llena con un mes de movimiento');
w('-- inventado: pedidos, clientas que repiten, consultas de empresas y');
w('-- menús cargados.');
w('--');
w('-- Nada de lo que hay acá es real. Los nombres son inventados y los');
w('-- teléfonos usan el prefijo 555, que no existe en Argentina, para que');
w('-- no le suene el teléfono a nadie por accidente.');
w('--');
w('-- ⚠️ ESTE ARCHIVO NO SE EDITA A MANO: lo escribe generar-demo.mjs, y');
w('-- las fechas salen relativas al día en que se generó. Si la demo es');
w('-- otro día, hay que volver a generarlo o el tablero va a mostrar los');
w('-- últimos días vacíos:');
w('--');
w('--   node worker/db/generar-demo.mjs > worker/db/demo.sql');
w('--');
w('-- SE PUEDE CORRER TODAS LAS VECES QUE HAGA FALTA. Arranca borrando lo');
w('-- que dejó la corrida anterior, así no se acumulan pedidos repetidos.');
w('--');
w('-- Para dejar la base limpia otra vez:');
w('--   npx wrangler d1 execute aume-staging --remote --file=worker/db/demo-borrar.sql');
w('--');
w('-- Los pedidos y las cotizaciones de demo llevan id >= 9000 a propósito:');
w('-- es lo que permite borrarlos sin tocar nada cargado a mano desde el');
w('-- panel, que usa los ids bajos que asigna la base sola.');
w('--');
w('-- Generado el ' + HOY + '.');
w('-- =====================================================================');

titulo('LIMPIEZA de la corrida anterior');
w('DELETE FROM pedido_items WHERE pedido_id >= 9000;');
w('DELETE FROM pedidos      WHERE id >= 9000;');
w('DELETE FROM cotizaciones WHERE id >= 9000;');

/* ==================================================================== */
/* MENÚS                                                                */
/* ==================================================================== */

/* Semanas relativas a la de hoy. La +1 es la que se va a estar mirando
   en la demo; la +2 queda en borrador para poder mostrar la diferencia
   entre guardar y publicar. */
const SEMANAS = [
  { off: -4, estado: 'publicado' },
  { off: -3, estado: 'publicado', feriado: 'lunes' },
  { off: -2, estado: 'publicado' },
  { off: -1, estado: 'publicado' },
  { off: 0, estado: 'publicado' },
  { off: 1, estado: 'publicado' },
  { off: 2, estado: 'borrador' }
];

titulo('MENÚS · el mes pasado, esta semana, la que viene y un borrador');
w('-- Van con INSERT OR IGNORE y no se borran al regenerar: si una fecha');
w('-- ya tiene menú cargado (el de semilla.sql, o uno que hayas escrito');
w('-- vos desde el panel), este archivo no lo pisa.');
w('--');
w('-- El lunes de la semana ' + sumar(LUNES, -21) + ' va marcado como feriado a');
w('-- propósito: un feriado es el único día que se puede publicar sin');
w('-- ningún plato, y es un caso que conviene poder mostrar.');

let vuelta = 0;
let diasMenu = 0;
for (const sem of SEMANAS) {
  const lunes = sumar(LUNES, sem.off * 7);
  w('');
  w('-- Semana del ' + lunes + (sem.estado === 'borrador' ? ' · borrador' : '') +
    (sem.off === 1 ? ' · la de la demo' : sem.off === 0 ? ' · esta semana' : ''));
  for (let i = 0; i < 5; i++) {
    const fecha = sumar(lunes, i);
    const dia = DIA_ID[diaSemana(fecha)];
    const esFeriado = sem.feriado === dia;
    diasMenu++;

    w('INSERT OR IGNORE INTO menus (fecha, dia_id, mes, estado, feriado, nota, publicado_en) VALUES (' +
      [q(fecha), q(dia), q(fecha.slice(0, 7)), q(sem.estado), esFeriado ? 1 : 0,
       q(esFeriado ? 'Feriado · no se cocina' : ''),
       sem.estado === 'publicado' ? "datetime('now')" : 'NULL'].join(', ') + ');');

    if (esFeriado) continue;

    for (const cat of CATS) {
      const lista = PLATOS[cat];
      const [nombre, desc, etiq] = lista[vuelta % lista.length];
      w('INSERT OR IGNORE INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas)');
      w('  SELECT id, ' + q(cat) + ', ' + q(nombre) + ',');
      w('         ' + q(desc) + ', ' + q(etiq));
      w('    FROM menus WHERE fecha = ' + q(fecha) + ';');
    }
    vuelta++;
  }
}

/* ==================================================================== */
/* CLIENTES                                                             */
/* ==================================================================== */

/* El reparto es deliberado: unas pocas clientas que repiten mucho, un
   grupo mediano y una cola larga de una sola compra. Es la forma que
   tiene un negocio de viandas de verdad, y es lo que hace que el panel
   de "quiénes repiten" diga algo en vez de mostrar a todos iguales.

   Los cupos están holgados a propósito: si el pozo de clientas se agota
   antes de llegar a hoy, los últimos días quedan con menos pedidos de
   los que les tocan y la curva de crecimiento se aplasta justo en el
   tramo que se quiere mostrar. */
const NOMBRES_FIELES = [
  'Marisa Ferreyra', 'Estudio Contable Bertoldi', 'Lucía Grinóvero',
  'Paula Zapata', 'Consultorio Odontológico Rossi', 'Andrea Miño'
];
const NOMBRES_MEDIOS = [
  'Sofía Benítez', 'Gabriel Ledesma', 'Natalia Retamar', 'Verónica Kloster',
  'Martín Ocampo', 'Carla Bogado', 'Julieta Ramírez', 'Diego Villalba',
  'Romina Schmidt', 'Federico Aguirre'
];
const NOMBRES_SUELTOS = [
  'Ana Belén Torres', 'Nicolás Pereyra', 'Valentina Ríos', 'Emiliano Cabrera',
  'Florencia Duarte', 'Ignacio Sosa', 'Camila Barrios', 'Tomás Almirón',
  'Micaela Vera', 'Joaquín Medina', 'Agustina Lell', 'Franco Britos',
  'Daniela Ojeda', 'Santiago Frank', 'Rocío Maidana', 'Leandro Cáceres',
  'Brenda Kaufmann', 'Ezequiel Monzón', 'Antonella Peralta', 'Matías Godoy'
];
const DIRECCIONES = [
  'Urquiza 1240', 'Córdoba 455', 'Gualeguaychú 780', 'Alameda de la Federación 190',
  'Santa Fe 1533', 'Monte Caseros 620', 'Almafuerte 345', 'Larramendi 1802',
  'España 275', 'Andrés Pazos 960', 'Perú 411', 'Rivadavia 1105'
];

const clientes = [];
let telBase = 5100;
function agregarClientes(lista, min, max) {
  lista.forEach((nombre, i) => {
    const norm = '343555' + String(telBase++);
    clientes.push({
      nombre,
      tel: '343 555-' + norm.slice(6),
      norm,
      cupo: min + ent(max - min + 1),
      hechos: 0,
      /* Cada clienta tiene sus costumbres: siempre pide parecido. Sin
         esto, "su menú favorito" en el panel sale al azar y la columna
         no significa nada. */
      cat: pesado([['clasico', 5], ['proteico', 4], ['vegetariano', 3], ['ensalada', 2]]),
      tam: pesado([['estandar', 7], ['xl', 3]]),
      /* Repartido a dedo y no al azar: si esto se sorteaba, alcanzaba con
         que a dos o tres de las clientas que más repiten les tocara
         retiro para que el tablero dijera que casi nadie usa el reparto.
         El volumen lo mueven las que vuelven, no las que compran una vez. */
      modalidad: (i % 10) < 7 ? 'envio' : 'retiro',
      zona: pesado([['dentro', 6], ['fuera', 4]]),
      punto: elegir(['base', 'oximarket', 'mesamies']),
      pago: pesado([['efectivo', 5], ['transferencia', 3], ['mercadopago', 2]]),
      canal: pesado([['app', 62], ['whatsapp', 38]]),
      direccion: elegir(DIRECCIONES)
    });
  });
}
agregarClientes(NOMBRES_FIELES, 12, 20);
agregarClientes(NOMBRES_MEDIOS, 5, 9);
agregarClientes(NOMBRES_SUELTOS, 1, 2);

/* ==================================================================== */
/* PEDIDOS                                                              */
/* ==================================================================== */

const PRECIO_TAM = { estandar: 9000, xl: 12800 };
const PACK_PRECIO = {
  x5: { estandar: 45000, xl: 64000 },
  x4: { estandar: 36000, xl: 51200 },
  x3: { estandar: 27000, xl: 38400 }
};
const PACK_DIAS = { x5: 5, x4: 4, x3: 3 };
const COSTO_ZONA = { dentro: 2000, fuera: 2500 };
/* Las notas van separadas por modalidad: "dejar en portería" en un
   pedido que se retira en el local, o "retira mi marido" en uno con
   envío, es la clase de detalle que alguien nota en una demo. */
const NOTAS_COMUNES = ['', '', '', '', '', '', '', 'Sin sal, por favor.', 'Sin cebolla.'];
const NOTAS_ENVIO = ['Tocar timbre 2B.', 'Dejar en portería.', 'Avisar cuando salga el reparto.'];
const NOTAS_RETIRO = ['Retira mi marido.', 'Paso después de las 13.', 'Retiro yo, gracias.'];
const notaPara = (modalidad) => rnd() < 0.7
  ? elegir(NOTAS_COMUNES)
  : elegir(modalidad === 'envio' ? NOTAS_ENVIO : NOTAS_RETIRO);

/* Cuántos pedidos por día. Crece semana a semana a propósito: el tablero
   contesta "¿estamos creciendo?" y con una serie plana no se entiende
   qué está mostrando. */
function pedidosDelDia(fecha) {
  const d = diaSemana(fecha);
  if (d === 6) return 0;                                 // sábado no se toman
  const semana = Math.floor(antiguedad(fecha) / 7);      // 0 = esta semana
  const base = [7, 6, 5, 4, 3][Math.min(semana, 4)];     // más viejo, menos
  const porDia = d === 7 ? 1.4 : d === 1 ? 1.3 : d === 5 ? 0.7 : 1;
  return Math.max(1, Math.round(base * porDia) + (rnd() < 0.35 ? 1 : 0));
}

function estadoDe(fecha) {
  const a = antiguedad(fecha);
  if (rnd() < 0.055) return 'cancelado';
  if (a === 0) return pesado([['nuevo', 6], ['confirmado', 4]]);
  if (a <= 2) return pesado([['confirmado', 6], ['entregado', 4]]);
  return 'entregado';
}

titulo('PEDIDOS · un mes de movimiento, con los ids a partir de 9000');
w('-- El volumen sube semana a semana a propósito. Ojo con una cosa al');
w('-- mostrarlo: la semana en curso siempre va a verse más baja que la');
w('-- anterior, porque está a medio terminar. No es una caída.');
w('--');
w('-- Los cancelados están puestos para poder mostrar que NO suman a la');
w('-- recaudación: las estadísticas los descartan a propósito.');

let pedidoId = 9000;
let itemId = 9000;
let sinCupo = 0;

for (let d = 34; d >= 0; d--) {
  const fecha = sumar(HOY, -d);
  const cuantos = pedidosDelDia(fecha);
  if (!cuantos) continue;

  w('');
  w('-- ' + fecha + ' · ' + NOMBRE_DIA[diaSemana(fecha)] + ' · ' + cuantos + ' pedido(s)');

  for (let n = 0; n < cuantos; n++) {
    const libres = clientes.filter((c) => c.hechos < c.cupo);
    if (!libres.length) { sinCupo++; continue; }
    const c = libres[ent(libres.length)];
    c.hechos++;

    const id = pedidoId++;
    const estado = estadoDe(fecha);
    const hora = 9 + ent(12);
    const creado = fecha + 'T' + String(hora + 3).padStart(2, '0') + ':' +
                   String(ent(60)).padStart(2, '0') + ':00Z';

    /* Qué compró. Los packs y el plan mensual no pagan envío: es la regla
       del negocio, y si acá no se respeta el tablero muestra una
       recaudación por envíos que en la realidad no existiría. */
    /* El plan mensual pesa poco a propósito. Cuesta $198.000 contra los
       $30.000 de un pedido común, así que con un 8% de planes el ticket
       promedio del tablero se va a las nubes y deja de describir lo que
       compra la mayoría. */
    const forma = pesado([['viandas', 57], ['pack', 24], ['plan', 4], ['viandas+extra', 15]]);
    const items = [];
    let cantidad = 0, subtotal = 0, bonificaEnvio = false;

    if (forma === 'pack') {
      const pack = pesado([['x5', 5], ['x4', 3], ['x3', 2]]);
      const precio = PACK_PRECIO[pack][c.tam];
      const cant = rnd() < 0.15 ? 2 : 1;
      items.push({ tipo: 'pack', ref: pack, pref: c.cat, dia: '', cat: '', tam: c.tam,
                   cant, precio, plato: 'Pack x' + PACK_DIAS[pack] + ' días' });
      cantidad += cant; subtotal += precio * cant; bonificaEnvio = true;
    } else if (forma === 'plan') {
      const precio = 198000;
      items.push({ tipo: 'plan', ref: '', pref: c.cat, dia: '', cat: '', tam: 'estandar',
                   cant: 1, precio, plato: 'Plan mensual' });
      cantidad += 1; subtotal += precio; bonificaEnvio = true;
    } else {
      const lineas = 1 + ent(3);
      const diasUsados = new Set();
      for (let l = 0; l < lineas; l++) {
        let dia;
        do { dia = DIA_ID[1 + ent(5)]; } while (diasUsados.has(dia) && diasUsados.size < 5);
        diasUsados.add(dia);
        /* Casi siempre pide lo suyo, pero a veces cambia. Si todas las
           líneas fueran iguales, el gráfico de menús daría un empate
           perfecto y no se vería cuál conviene cocinar más. */
        const cat = rnd() < 0.72 ? c.cat : elegir(CATS);
        const tam = rnd() < 0.82 ? c.tam : (c.tam === 'xl' ? 'estandar' : 'xl');
        const cant = pesado([[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]]);
        const precio = PRECIO_TAM[tam];
        const lista = PLATOS[cat];
        items.push({ tipo: 'vianda', ref: '', pref: '', dia, cat, tam, cant, precio,
                     plato: lista[(antiguedad(fecha) + l) % lista.length][0] });
        cantidad += cant; subtotal += precio * cant;
      }
      if (forma === 'viandas+extra') {
        items.push({ tipo: 'extra', ref: 'burger8', pref: '', dia: '', cat: '', tam: '',
                     cant: 1, precio: 13000, plato: 'Hamburguesas de legumbres' });
        cantidad += 1; subtotal += 13000;
      }
    }

    /* Cada clienta tiene su costumbre, pero no es una regla de hierro:
       una de cada seis veces cambia. Si la modalidad fuera fija por
       clienta, el reparto envío/retiro del tablero terminaría decidido
       por qué clientas repiten más, y no por cómo pide la gente. */
    const modalidad = rnd() < 0.84 ? c.modalidad : (c.modalidad === 'envio' ? 'retiro' : 'envio');
    const envio = modalidad === 'envio' && !bonificaEnvio ? COSTO_ZONA[c.zona] : 0;
    const origen = c.canal === 'whatsapp' ? 'panel'
                 : pesado([['checkout-whatsapp', 7], ['checkout-confirmado', 3]]);

    w('INSERT INTO pedidos (id, creado_en, fecha_local, semana_local, dia_semana, canal, origen, estado, ' +
      'cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, ' +
      'metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) VALUES (');
    w('  ' + [
      id, q(creado), q(fecha), q(semanaISO(fecha)), diaSemana(fecha), q(c.canal), q(origen), q(estado),
      q(c.nombre), q(c.tel), q(c.norm), q(modalidad),
      modalidad === 'envio' ? q(c.zona) : 'NULL',
      q(modalidad === 'envio' ? c.direccion : ''),
      modalidad === 'retiro' ? q(c.punto) : 'NULL',
      q(c.pago), q(notaPara(modalidad)), cantidad, subtotal, envio, subtotal + envio, q('demo-' + id)
    ].join(', ') + ');');

    for (const it of items) {
      w('INSERT INTO pedido_items (id, pedido_id, tipo, ref_id, preferencia, fecha_menu, dia_id, ' +
        'categoria_id, tamano_id, cantidad, precio_unitario, subtotal, plato_nombre) VALUES (');
      w('  ' + [
        itemId++, id, q(it.tipo), q(it.ref), q(it.pref), 'NULL', q(it.dia),
        q(it.cat), q(it.tam), it.cant, it.precio, it.precio * it.cant, q(it.plato)
      ].join(', ') + ');');
    }
  }
}

if (sinCupo) {
  console.error('Aviso: ' + sinCupo + ' pedido(s) no se generaron porque se agotó el ' +
                'pozo de clientas. Subí los cupos en agregarClientes().');
}

/* ==================================================================== */
/* COTIZACIONES                                                         */
/* ==================================================================== */

titulo('COTIZACIONES · el formulario de empresas de la landing');
w('-- Tres quedan en "nueva" a propósito: es lo que hace que la portada');
w('-- del panel muestre la chapa de "sin responder", que es justamente lo');
w('-- que hay que poder mostrar.');
w('--');
w('-- Los mails van todos a .test, que es un dominio reservado que no');
w('-- existe y no se le puede mandar correo a nadie sin querer.');

const COTIZACIONES = [
  ['Estudio Jurídico Bertoldi y Asoc.', 'Marina Bertoldi', 'marina@ejemplo.test', '343 555-2010', 12, 'Centro', 'Lunes a viernes', 'Buenas tardes. Somos 12 en el estudio y estamos buscando almuerzo diario. ¿Tienen plan corporativo con factura A?', 'nueva', 1],
  ['Clínica del Sol', 'Hernán Cattaneo', 'administracion@ejemplo.test', '343 555-2011', 25, 'Fuera de bulevares', 'Lunes, miércoles y viernes', 'Necesitamos cubrir el turno tarde del personal de enfermería. Nos interesa la opción proteica y algo vegetariano.', 'nueva', 2],
  ['Cooperativa La Delta', 'Silvina Roldán', 'silvina@ejemplo.test', '343 555-2012', 8, 'Centro', 'Martes y jueves', '¿Hacen entrega en Puerto Sánchez? Somos 8 y arrancaríamos con dos días.', 'nueva', 4],
  ['Software Litoral SRL', 'Pablo Giménez', 'pablo@ejemplo.test', '343 555-2013', 18, 'Centro', 'Lunes a viernes', 'Quedamos en que mandaban la propuesta con el precio por persona. ¡Gracias!', 'contactada', 6],
  ['Colegio San Jorge', 'Rita Almada', 'rita@ejemplo.test', '343 555-2014', 30, 'Fuera de bulevares', 'Lunes a viernes', 'Para el personal docente. Necesitaríamos arrancar el mes que viene.', 'contactada', 9],
  ['Inmobiliaria Paraná Norte', 'Cecilia Kunz', 'cecilia@ejemplo.test', '343 555-2015', 6, 'Centro', 'Miércoles', 'Somos pocos pero fijos. ¿Se puede un solo día por semana?', 'contactada', 12],
  ['Gimnasio Fuerza Viva', 'Matías Ledesma', 'matias@ejemplo.test', '343 555-2016', 15, 'Centro', 'Lunes a viernes', 'Arrancamos el mes que viene con el pack proteico para los socios. Ya está todo hablado.', 'cerrada', 17],
  ['Contaduría Ramseyer', 'Nadia Ramseyer', 'nadia@ejemplo.test', '343 555-2017', 5, 'Centro', 'Martes y jueves', 'Gracias por la propuesta, por ahora lo dejamos para más adelante.', 'cerrada', 22]
];

w('');
let cotId = 9000;
for (const [empresa, contacto, email, tel, personas, zona, dias, mensaje, estado, hace] of COTIZACIONES) {
  w('INSERT INTO cotizaciones (id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, origen_hash, creada_en) VALUES (');
  w('  ' + [
    cotId++, q(empresa), q(contacto), q(email), q(tel), personas, q(zona), q(dias), q(mensaje),
    q(estado), q('demo'), q(sumar(HOY, -hace) + ' 14:20:00')
  ].join(', ') + ');');
}

/* ==================================================================== */
/* PUBLICACIONES                                                        */
/* ==================================================================== */

titulo('PUBLICACIONES · tips, recetas e info nutricional');
w("-- Van sin imagen (imagen = ''): las fotos viven en el bucket R2 y se");
w('-- suben desde el panel, no desde un .sql. Si querés que en la demo');
w('-- tengan foto, subilas a mano desde /admin/publicaciones/.');
w('--');
w('-- Dos quedan en borrador para poder mostrar que un borrador NO sale en');
w('-- la landing: ni en el listado ni entrando derecho a su link.');

const PUBLICACIONES = [
  ['tres-mitos-sobre-comer-liviano', 'Tres mitos sobre comer liviano',
   'Liviano no es sinónimo de poca comida. Te contamos qué mirar de verdad.',
   'El primero es el más común: creer que una vianda liviana tiene que dejarte con hambre. No. Una porción bien armada combina proteína, vegetales y un hidrato de calidad, y eso sostiene la energía toda la tarde.\n\nEl segundo es pensar que todo lo light sirve. Muchos productos ultraprocesados bajan las calorías sumando aditivos y sodio. Preferimos comida de verdad, cocinada el mismo día.\n\nEl tercero es el más difícil de soltar: que comer bien es caro. Cuando planificás la semana y no comprás de apuro al mediodía, el número cierra.',
   'tip', 'publicado', 22],
  ['como-armamos-el-menu-del-mes', 'Cómo armamos el menú del mes',
   'Detrás de cada semana hay una planificación que empieza mucho antes.',
   'El menú lo arma nuestra nutricionista con un mes de anticipación, y no se trata sólo de elegir platos ricos. Se busca rotar las fuentes de proteína a lo largo de la semana, que haya al menos dos días con legumbres y que las verduras cambien de color y de tipo.\n\nDespués viene la parte de cocina: qué se puede producir bien en volumen sin perder calidad, y qué conviene dejar para otra semana.\n\nPor eso vas a ver que ningún plato se repite dentro del mismo mes.',
   'nutricion', 'publicado', 15],
  ['budin-de-banana-y-avena', 'Budín de banana y avena',
   'Sin azúcar agregada y con lo que ya tenés en la alacena.',
   'Ingredientes: 3 bananas bien maduras, 2 huevos, 1 taza de avena, 1 cucharadita de polvo de hornear, canela a gusto y un puñado de nueces.\n\nPreparación: pisá las bananas hasta hacer un puré, sumá los huevos y mezclá. Agregá la avena, el polvo de hornear y la canela. Integrá las nueces al final.\n\nHorno a 180° durante 35 minutos. Se conserva tres días en la heladera y se puede congelar en porciones.',
   'receta', 'publicado', 9],
  ['por-que-cocinamos-el-mismo-dia', 'Por qué cocinamos el mismo día',
   'La diferencia entre una vianda rica y una que apenas sobrevive al microondas.',
   'Toda nuestra producción sale el mismo día que se entrega. No congelamos las viandas del día ni cocinamos el fin de semana para toda la semana siguiente.\n\nEso limita cuánto podemos producir, es cierto. Pero es lo que hace que un brócoli llegue verde y firme, y no gris y deshecho.\n\nLo único que sí va congelado son los productos que se venden así de entrada, como las hamburguesas de legumbres, y en ese caso lo aclaramos siempre.',
   'tip', 'publicado', 4],
  ['guia-de-porciones-para-la-semana', 'Guía de porciones para la semana',
   'Cuánto necesitás realmente según cómo viene tu día.',
   'Borrador en preparación. Falta revisar las referencias y sumar la tabla comparativa entre el menú estándar y el XL.',
   'nutricion', 'borrador', 2],
  ['ensalada-de-lentejas-y-calabaza', 'Ensalada de lentejas y calabaza',
   'Rinde para dos días y se come fría o tibia.',
   'Borrador: falta sacar la foto del plato terminado y ajustar las cantidades para cuatro porciones.',
   'receta', 'borrador', 1]
];

w('');
for (const [id, tit, copete, cuerpo, cat, estado, hace] of PUBLICACIONES) {
  w('DELETE FROM publicaciones WHERE id = ' + q(id) + ';');
  w('INSERT INTO publicaciones (id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) VALUES (');
  w('  ' + [q(id), q(tit), q(copete), q(cuerpo), q(cat), q(''), q(''), q(estado), q(sumar(HOY, -hace))].join(', ') + ');');
  w('');
}

titulo('FIN · lo que quedó cargado');
w('--   pedidos ........ ' + (pedidoId - 9000));
w('--   ítems .......... ' + (itemId - 9000));
w('--   cotizaciones ... ' + (cotId - 9000) + ' (3 sin responder)');
w('--   publicaciones .. ' + PUBLICACIONES.length + ' (4 publicadas, 2 borrador)');
w('--   días de menú ... ' + diasMenu);

console.log(out.join('\n'));
