/* =====================================================================
   AUMÉ · worker/rutas/menus.js   ·   /api/menus

   Cada día tiene su propio registro, identificado por su fecha real, y
   un estado: 'borrador' mientras la nutri lo arma, 'publicado' cuando
   decide que salga. La landing sólo ve los publicados.

   El historial no se borra nunca: los meses viejos quedan en la tabla y
   son los que después alimentan las estadísticas.
   ===================================================================== */

import { json, errores, leerJson } from '../lib/respuesta.js';
import { fechaLocal, idDia, mesDe, esFechaValida } from '../lib/tiempo.js';

const CATEGORIAS = ['clasico', 'vegetariano', 'proteico', 'ensalada'];

/* ------------------------------------------------------- Utilidades */

function jsonSeguro(txt) {
  try {
    const v = JSON.parse(txt);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch (e) { return []; }
}

/* Suma días a una fecha 'YYYY-MM-DD' sin pelear con zonas horarias */
function sumarDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* El lunes de la semana que la clienta tiene que ver hoy.

   Los pedidos de la semana se reciben hasta el domingo a las 20:00, así
   que el sábado y el domingo ya conviene mostrar la semana que viene:
   quien entra un domingo a la tarde está pidiendo para el lunes. */
function lunesAMostrar(hoy) {
  const dia = new Date(hoy + 'T12:00:00Z').getUTCDay();   // 0 = domingo
  if (dia === 6) return sumarDias(hoy, 2);                // sábado -> lunes
  if (dia === 0) return sumarDias(hoy, 1);                // domingo -> lunes
  return sumarDias(hoy, 1 - dia);                         // lunes de esta semana
}

/* 'Semana del 31/08 al 04/09' — el mismo texto que hoy se escribe a mano
   en menu.js, para que la web se vea igual que siempre. */
function etiquetaSemana(desde, hasta) {
  const corto = (f) => f.slice(8, 10) + '/' + f.slice(5, 7);
  return 'Semana del ' + corto(desde) + ' al ' + corto(hasta);
}

async function platosDe(db, ids) {
  if (!ids.length) return {};
  const marcas = ids.map(() => '?').join(',');
  const r = await db.prepare(
    'SELECT menu_id, categoria_id, nombre, descripcion, etiquetas ' +
    'FROM menu_platos WHERE disponible = 1 AND menu_id IN (' + marcas + ')'
  ).bind(...ids).all();

  const porMenu = {};
  for (const p of (r.results || [])) {
    porMenu[p.menu_id] = porMenu[p.menu_id] || {};
    porMenu[p.menu_id][p.categoria_id] = {
      nombre: p.nombre,
      descripcion: p.descripcion,
      etiquetas: jsonSeguro(p.etiquetas)
    };
  }
  return porMenu;
}

/* ------------------------------- GET /api/menus  (público, landing) */

async function menuPublico(ctx) {
  /* ?desde= permite mirar otra semana; por defecto, la que toca hoy. */
  const pedida = ctx.url.searchParams.get('desde');
  const desde = esFechaValida(pedida) ? pedida : lunesAMostrar(fechaLocal());
  const hasta = sumarDias(desde, 4);   // lunes a viernes

  const r = await ctx.db.prepare(
    "SELECT id, fecha, dia_id, nota, feriado FROM menus " +
    "WHERE estado = 'publicado' AND fecha BETWEEN ? AND ? ORDER BY fecha"
  ).bind(desde, hasta).all();

  const dias = r.results || [];

  /* Sin menús publicados no devolvemos una semana vacía: devolvemos
     platos en null y la landing se queda con assets/js/data/menu.js.
     Mejor el menú viejo del archivo que una web sin menú. */
  if (!dias.length) {
    return json({
      semana: null, nota: '', platos: null, fechas: {}, feriados: {},
      hoy: fechaLocal(), desde, hasta
    });
  }

  const porMenu = await platosDe(ctx.db, dias.map((d) => d.id));

  const platos = {};
  const fechas = {};
  const feriados = {};
  for (const d of dias) {
    platos[d.dia_id] = d.feriado ? {} : (porMenu[d.id] || {});
    fechas[d.dia_id] = d.fecha;
    if (d.feriado) feriados[d.dia_id] = true;
  }

  /* La nota general del menú vive en ajustes; si un día trae la suya,
     esa gana para esa semana. */
  const aj = await ctx.db.prepare("SELECT valor FROM ajustes WHERE clave = 'menu_nota'").first();
  const notaDia = dias.find((d) => d.nota);

  return json({
    semana: etiquetaSemana(desde, hasta),
    nota: notaDia ? notaDia.nota : ((aj && aj.valor) || ''),
    platos,
    fechas,
    feriados,
    /* La landing usa esto para no dejar pedir días que ya pasaron. La
       fecha la manda el servidor a propósito: el reloj del celular de
       la clienta puede estar en cualquier lado. */
    hoy: fechaLocal(),
    desde,
    hasta
  });
}

/* -------------------- GET /api/menus/mes/:mes  (panel, la grilla) */

async function grillaMes(ctx) {
  const mes = ctx.parametros.mes;
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return errores.datosInvalidos(['El mes va como YYYY-MM.']);
  }

  const r = await ctx.db.prepare(
    'SELECT m.id, m.fecha, m.dia_id, m.estado, m.publicado_en, m.feriado, ' +
    '       (SELECT COUNT(*) FROM menu_platos p WHERE p.menu_id = m.id AND p.disponible = 1) AS platos ' +
    'FROM menus m WHERE m.mes = ? ORDER BY m.fecha'
  ).bind(mes).all();

  const dias = (r.results || []).map((d) => ({
    fecha: d.fecha,
    dia: d.dia_id,
    estado: d.estado,
    publicadoEn: d.publicado_en,
    feriado: d.feriado === 1,
    platos: d.platos,
    completo: d.feriado === 1 || d.platos >= CATEGORIAS.length
  }));

  /* Los meses que ya tienen algo cargado, para el selector. Así la nutri
     puede volver a mirar meses viejos sin adivinar cuáles existen. */
  const dispo = await ctx.db.prepare(
    'SELECT mes, COUNT(*) AS dias FROM menus GROUP BY mes ORDER BY mes DESC'
  ).all();

  return json({
    mes,
    dias,
    meses: (dispo.results || []).map((m) => ({ mes: m.mes, dias: m.dias })),
    hoy: fechaLocal()
  });
}

/* ------------------ GET /api/menus/:fecha  (panel, un día) */

async function verDia(ctx) {
  const fecha = ctx.parametros.fecha;
  if (!esFechaValida(fecha)) return errores.datosInvalidos(['La fecha va como YYYY-MM-DD.']);

  const m = await ctx.db.prepare(
    'SELECT id, fecha, dia_id, estado, nota, publicado_en, feriado FROM menus WHERE fecha = ?'
  ).bind(fecha).first();

  /* Un día que todavía no existe no es un error: es un día en blanco
     esperando que lo carguen. */
  if (!m) {
    return json({
      fecha, dia: idDia(fecha), estado: 'nuevo', nota: '',
      feriado: false, platos: {}, categorias: CATEGORIAS
    });
  }

  const porMenu = await platosDe(ctx.db, [m.id]);
  return json({
    fecha: m.fecha,
    dia: m.dia_id,
    estado: m.estado,
    nota: m.nota,
    publicadoEn: m.publicado_en,
    feriado: m.feriado === 1,
    platos: porMenu[m.id] || {},
    categorias: CATEGORIAS
  });
}

/* ------------------ PUT /api/menus/:fecha  (guardar borrador) */

function texto(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

function limpiarPlato(bruto, errs, cat) {
  const nombre = texto(bruto && bruto.nombre, 120);
  /* Sin nombre no hay plato: ese día no tiene esa opción, igual que
     poner null en menu.js. La web muestra "No disponible". */
  if (!nombre) return null;

  let etiquetas = Array.isArray(bruto.etiquetas) ? bruto.etiquetas : [];
  etiquetas = etiquetas.map((e) => texto(e, 30)).filter(Boolean).slice(0, 5);

  if (texto(bruto.descripcion, 400).length > 300) {
    errs.push(cat + ': la descripción es demasiado larga (máximo 300).');
  }

  return {
    nombre,
    descripcion: texto(bruto.descripcion, 300),
    etiquetas: JSON.stringify(etiquetas)
  };
}

/* Arma las operaciones para guardar UN día. Se usa tanto en el guardado
   de a uno como en el de la semana entera, para que las dos formas
   guarden exactamente igual. */
function opsDia(db, fecha, cuerpo, errs) {
  const platos = {};
  for (const cat of CATEGORIAS) {
    if (!(cat in (cuerpo.platos || {}))) continue;
    platos[cat] = limpiarPlato(cuerpo.platos[cat], errs, fecha + ' · ' + cat);
  }

  const feriado = cuerpo.feriado === true ? 1 : 0;
  const nota = texto(cuerpo.nota, 200);
  const ops = [];

  /* Se crea como borrador. Si el día ya existía, NO se le toca el
     estado: un menú publicado que se corrige sigue publicado, que es lo
     que espera cualquiera al arreglar un typo. */
  ops.push(db.prepare(
    "INSERT INTO menus (fecha, dia_id, mes, estado, nota, feriado) VALUES (?, ?, ?, 'borrador', ?, ?) " +
    'ON CONFLICT(fecha) DO UPDATE SET nota = excluded.nota, feriado = excluded.feriado, ' +
    "actualizado_en = datetime('now')"
  ).bind(fecha, idDia(fecha), mesDe(fecha), nota, feriado));

  /* Un feriado no lleva platos: si el día se marca como feriado, se
     limpian los que hubiera cargados. Si no, la web mostraría "Feriado"
     y platos al mismo tiempo. */
  if (feriado) {
    ops.push(db.prepare(
      'DELETE FROM menu_platos WHERE menu_id = (SELECT id FROM menus WHERE fecha = ?)'
    ).bind(fecha));
    return ops;
  }

  for (const [cat, plato] of Object.entries(platos)) {
    if (!plato) {
      ops.push(db.prepare(
        'DELETE FROM menu_platos WHERE categoria_id = ? AND menu_id = (SELECT id FROM menus WHERE fecha = ?)'
      ).bind(cat, fecha));
      continue;
    }
    ops.push(db.prepare(
      'INSERT INTO menu_platos (menu_id, categoria_id, nombre, descripcion, etiquetas) ' +
      'VALUES ((SELECT id FROM menus WHERE fecha = ?), ?, ?, ?, ?) ' +
      'ON CONFLICT(menu_id, categoria_id) DO UPDATE SET ' +
      'nombre = excluded.nombre, descripcion = excluded.descripcion, ' +
      'etiquetas = excluded.etiquetas, disponible = 1'
    ).bind(fecha, cat, plato.nombre, plato.descripcion, plato.etiquetas));
  }
  return ops;
}

async function guardarDia(ctx) {
  const fecha = ctx.parametros.fecha;
  if (!esFechaValida(fecha)) return errores.datosInvalidos(['La fecha va como YYYY-MM-DD.']);

  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const errs = [];
  const ops = opsDia(ctx.db, fecha, leido.cuerpo, errs);
  if (errs.length) return errores.datosInvalidos(errs);

  await ctx.db.batch(ops);
  return verDia(ctx);
}

/* ------------------ PUT /api/menus/semana  (la semana entera)
   La nutri arma el menú del mes separado por semanas, así que cargar de
   a un día era pelearle a su forma de trabajar. Esto guarda los cinco
   días de una, y opcionalmente los publica en el mismo movimiento.
   Va todo en un batch: o entra la semana completa o no entra nada. */

async function guardarSemana(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const cuerpo = leido.cuerpo;
  const desde = cuerpo.desde;
  if (!esFechaValida(desde)) return errores.datosInvalidos(['"desde" va como YYYY-MM-DD.']);
  if (new Date(desde + 'T12:00:00Z').getUTCDay() !== 1) {
    return errores.datosInvalidos(['"desde" tiene que ser un lunes.']);
  }

  const errs = [];
  const ops = [];
  const fechas = [];

  for (let i = 0; i < 5; i++) {
    const fecha = sumarDias(desde, i);
    const dia = idDia(fecha);
    const datos = (cuerpo.dias || {})[dia];
    if (!datos) continue;          // día que no vino: se deja como estaba
    fechas.push(fecha);
    /* La nota de la semana se guarda igual en todos los días, así
       cualquiera de ellos la puede devolver después. */
    ops.push(...opsDia(ctx.db, fecha, { ...datos, nota: cuerpo.nota }, errs));
  }

  if (errs.length) return errores.datosInvalidos(errs);
  if (!fechas.length) return errores.datosInvalidos(['No mandaste ningún día.']);

  await ctx.db.batch(ops);

  if (cuerpo.publicar === true) {
    const problemas = await publicarFechas(ctx.db, fechas);
    if (problemas.length) return errores.datosInvalidos(problemas);
  }

  return json(await estadoSemana(ctx.db, desde));
}

/* Publica varias fechas. Un feriado se publica aunque no tenga platos:
   justamente lo que hay que comunicar es que ese día no hay. */
async function publicarFechas(db, fechas) {
  const problemas = [];
  const ops = [];

  for (const fecha of fechas) {
    const m = await db.prepare(
      'SELECT m.id, m.feriado, ' +
      '(SELECT COUNT(*) FROM menu_platos p WHERE p.menu_id = m.id AND p.disponible = 1) AS n ' +
      'FROM menus m WHERE m.fecha = ?'
    ).bind(fecha).first();

    if (!m) { problemas.push(fecha + ': no existe.'); continue; }
    if (!m.feriado && !m.n) {
      problemas.push(fecha + ': no tiene ningún plato cargado, no se puede publicar vacío.');
      continue;
    }
    ops.push(db.prepare(
      "UPDATE menus SET estado = 'publicado', publicado_en = datetime('now'), " +
      "actualizado_en = datetime('now') WHERE fecha = ?"
    ).bind(fecha));
  }

  if (problemas.length) return problemas;
  if (ops.length) await db.batch(ops);
  return [];
}

/* ------------------ GET /api/menus/semana?desde= (panel) */

async function estadoSemana(db, desde) {
  const hasta = sumarDias(desde, 4);
  const r = await db.prepare(
    'SELECT id, fecha, dia_id, estado, nota, feriado FROM menus ' +
    'WHERE fecha BETWEEN ? AND ? ORDER BY fecha'
  ).bind(desde, hasta).all();

  const filas = r.results || [];
  const porMenu = await platosDe(db, filas.map((f) => f.id));

  const dias = [];
  for (let i = 0; i < 5; i++) {
    const fecha = sumarDias(desde, i);
    const fila = filas.find((f) => f.fecha === fecha);
    dias.push({
      fecha,
      dia: idDia(fecha),
      estado: fila ? fila.estado : 'nuevo',
      feriado: !!(fila && fila.feriado),
      platos: fila ? (porMenu[fila.id] || {}) : {}
    });
  }

  const conNota = filas.find((f) => f.nota);
  return {
    desde, hasta,
    semana: etiquetaSemana(desde, hasta),
    nota: conNota ? conNota.nota : '',
    dias,
    categorias: CATEGORIAS,
    hoy: fechaLocal()
  };
}

async function verSemana(ctx) {
  const desde = ctx.url.searchParams.get('desde');
  if (!esFechaValida(desde)) return errores.datosInvalidos(['"desde" va como YYYY-MM-DD.']);
  if (new Date(desde + 'T12:00:00Z').getUTCDay() !== 1) {
    return errores.datosInvalidos(['"desde" tiene que ser un lunes.']);
  }
  return json(await estadoSemana(ctx.db, desde));
}

/* ---------------- POST /api/menus/:fecha/publicar */

async function publicar(ctx) {
  const fecha = ctx.parametros.fecha;
  if (!esFechaValida(fecha)) return errores.datosInvalidos(['La fecha va como YYYY-MM-DD.']);

  const existe = await ctx.db.prepare('SELECT id FROM menus WHERE fecha = ?').bind(fecha).first();
  if (!existe) return errores.noEncontrado('Ese día');

  const problemas = await publicarFechas(ctx.db, [fecha]);
  if (problemas.length) return errores.datosInvalidos(problemas);

  return verDia(ctx);
}

/* ------------------------------------------------------------ Rutas */

export function registrar(router) {
  router.get('/api/menus', menuPublico, { publica: true });
  /* Va antes que /api/menus/:fecha para que 'mes' no se lea como fecha */
  router.get('/api/menus/mes/:mes', grillaMes);
  router.get('/api/menus/semana', verSemana);
  router.put('/api/menus/semana', guardarSemana);
  router.get('/api/menus/:fecha', verDia);
  router.put('/api/menus/:fecha', guardarDia);
  router.post('/api/menus/:fecha/publicar', publicar);
}
