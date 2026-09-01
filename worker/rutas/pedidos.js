/* =====================================================================
   AUMÉ · worker/rutas/pedidos.js   ·   /api/pedidos

   canal 'app'      -> entró solo desde la landing. Los DOS caminos del
                       checkout cuentan acá: el que abre WhatsApp y el
                       que deja el pedido confirmado.
   canal 'whatsapp' -> lo cargó la secretaria a mano, porque le llegó
                       por WhatsApp directo.

   ⚠️ POST /api/pedidos es la única ruta pública que ESCRIBE. Todo lo que
   manda el navegador se trata como sospechoso: los precios, el costo del
   envío y los totales se recalculan acá contra la base. Lo que viene en
   el cuerpo se usa sólo para saber QUÉ se pidió, nunca CUÁNTO sale.
   ===================================================================== */

import { json, errores, leerJson } from '../lib/respuesta.js';
import { fechaLocal, semanaISO, diaSemana, ahoraISO } from '../lib/tiempo.js';

const MAX_ITEMS = 40;
const MAX_CANT = 99;

/* ------------------------------------------------------- Utilidades */

function texto(v, max) {
  return String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);
}

/* Sólo los dígitos: es la clave para reconocer a una clienta que repite
   aunque escriba el teléfono distinto cada vez. */
function soloDigitos(v) {
  return String(v == null ? '' : v).replace(/\D/g, '').slice(0, 20);
}

function entero(v, max) {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (!Number.isInteger(n) || n < 1 || n > max) return null;
  return n;
}

/* --------------------------------------------------- Alta de pedido */

/* Arma el pedido validando TODO contra la base.
   `exigirMenuPublicado` distingue los dos orígenes:
   · desde la landing (true): sólo se puede pedir lo que está publicado y
     todavía no pasó. Es lo que la clienta ve.
   · desde el panel (false): la secretaria carga lo que le llegó por
     WhatsApp, que puede ser de un día raro o de algo que ya se cerró.
     Ella sabe lo que está haciendo; no le podemos poner la misma
     barrera que a la web. */
async function armarPedido(db, cuerpo, opciones) {
  const errs = [];
  const exigirMenuPublicado = opciones.exigirMenuPublicado;

  const nombre = texto(cuerpo.cliente && cuerpo.cliente.nombre, 60);
  const telefono = texto(cuerpo.cliente && cuerpo.cliente.telefono, 30);
  const digitos = soloDigitos(telefono);

  if (nombre.length < 2) errs.push('Falta el nombre de la clienta.');
  if (digitos.length < 8) errs.push('El teléfono no parece válido.');

  const modalidad = cuerpo.modalidad === 'retiro' ? 'retiro' : 'envio';

  /* --- Catálogo, de la base --- */
  const [tamRes, catRes, zonaRes, puntoRes, pagoRes] = await db.batch([
    db.prepare('SELECT id, precio FROM tamanos WHERE activo = 1'),
    db.prepare('SELECT id, es_fija FROM categorias WHERE activa = 1'),
    db.prepare('SELECT id, costo FROM zonas_envio WHERE activa = 1'),
    db.prepare('SELECT id FROM puntos_retiro WHERE activo = 1'),
    db.prepare('SELECT id FROM metodos_pago WHERE activo = 1')
  ]);

  const precios = {};
  for (const t of (tamRes.results || [])) precios[t.id] = t.precio;
  const categorias = {};
  for (const c of (catRes.results || [])) categorias[c.id] = c;
  const zonas = {};
  for (const z of (zonaRes.results || [])) zonas[z.id] = z.costo;
  const puntos = (puntoRes.results || []).map((p) => p.id);
  const pagos = (pagoRes.results || []).map((p) => p.id);

  /* --- Entrega --- */
  let zonaId = null, direccion = '', puntoId = null;
  if (modalidad === 'envio') {
    zonaId = texto(cuerpo.zonaId, 30);
    direccion = texto(cuerpo.direccion, 120);
    if (!(zonaId in zonas)) errs.push('Elegí una zona de entrega válida.');
    if (direccion.length < 5) errs.push('Falta la dirección de entrega.');
  } else {
    puntoId = texto(cuerpo.puntoId, 30);
    if (puntos.indexOf(puntoId) < 0) errs.push('Elegí un punto de retiro válido.');
  }

  const metodoPago = texto(cuerpo.metodoPago, 30);
  if (pagos.indexOf(metodoPago) < 0) errs.push('Elegí un método de pago válido.');

  /* --- Días disponibles --- */
  const hoy = fechaLocal();
  const menuRes = await db.prepare(
    'SELECT m.id, m.fecha, m.dia_id, m.estado, m.feriado FROM menus m WHERE m.fecha >= ? ORDER BY m.fecha LIMIT 60'
  ).bind(hoy).all();

  /* Por día de la semana nos quedamos con la fecha más próxima que
     todavía no pasó: es la que la clienta está viendo en la web. */
  const porDia = {};
  for (const m of (menuRes.results || [])) {
    if (!porDia[m.dia_id]) porDia[m.dia_id] = m;
  }

  /* --- Ítems --- */
  const brutos = Array.isArray(cuerpo.items) ? cuerpo.items : [];
  if (!brutos.length) errs.push('El pedido no tiene ninguna vianda.');
  if (brutos.length > MAX_ITEMS) errs.push('El pedido tiene demasiadas líneas.');

  const items = [];
  let cantidad = 0, subtotal = 0;

  for (const bruto of brutos.slice(0, MAX_ITEMS)) {
    const diaId = texto(bruto.dia, 20);
    const catId = texto(bruto.categoria, 30);
    const tamId = texto(bruto.tamano, 30);
    const cant = entero(bruto.cantidad, MAX_CANT);

    if (!cant) { errs.push('Cantidad inválida en ' + diaId + '.'); continue; }
    if (!(tamId in precios)) { errs.push('Tamaño desconocido: ' + tamId + '.'); continue; }
    if (!(catId in categorias)) { errs.push('Tipo de menú desconocido: ' + catId + '.'); continue; }

    const menu = porDia[diaId];
    let fechaMenu = menu ? menu.fecha : null;
    let plato = null;

    if (exigirMenuPublicado) {
      if (!menu) { errs.push('Ese día ya no se puede pedir: ' + diaId + '.'); continue; }
      if (menu.estado !== 'publicado') { errs.push('Ese día todavía no está publicado: ' + diaId + '.'); continue; }
      if (menu.feriado) { errs.push('Ese día es feriado: ' + diaId + '.'); continue; }

      /* La opción fija (Ensalada César) está todos los días y no vive en
         menu_platos, así que sólo se controla el resto. */
      if (!categorias[catId].es_fija) {
        const p = await db.prepare(
          'SELECT nombre FROM menu_platos WHERE menu_id = ? AND categoria_id = ? AND disponible = 1'
        ).bind(menu.id, catId).first();
        if (!p) { errs.push('Ese día no hay opción ' + catId + '.'); continue; }
        plato = p.nombre;
      }
    } else if (menu && !categorias[catId].es_fija) {
      const p = await db.prepare(
        'SELECT nombre FROM menu_platos WHERE menu_id = ? AND categoria_id = ?'
      ).bind(menu.id, catId).first();
      plato = p ? p.nombre : null;
    }

    /* El precio SIEMPRE sale de la base, nunca del navegador */
    const precio = precios[tamId];
    items.push({
      fechaMenu, diaId, catId, tamId, cantidad: cant,
      precio, subtotal: precio * cant,
      plato: plato || ''
    });
    cantidad += cant;
    subtotal += precio * cant;
  }

  if (errs.length) return { ok: false, errs };

  /* Las viandas sueltas siempre pagan envío; el bonificado quedó sólo
     para los packs semanales, que se piden aparte. */
  const envio = modalidad === 'envio' ? (zonas[zonaId] || 0) : 0;

  return {
    ok: true,
    pedido: {
      nombre, telefono, digitos, modalidad, zonaId, direccion, puntoId,
      metodoPago, notas: texto(cuerpo.notas, 300),
      cantidad, subtotal, envio, total: subtotal + envio,
      items
    }
  };
}

async function insertar(db, p, canal, origen, claveIdem) {
  const hoy = fechaLocal();

  /* RETURNING en vez de last_insert_rowid(): con D1 cada statement puede
     ir por su lado, así que preguntar después por el último id insertado
     no es confiable. Que el id venga en la misma operación sí lo es. */
  const fila = await db.prepare(
    'INSERT INTO pedidos (creado_en, fecha_local, semana_local, dia_semana, canal, origen, ' +
    'cliente_nombre, cliente_telefono, telefono_norm, modalidad, zona_id, direccion, punto_id, ' +
    'metodo_pago, notas, cantidad, subtotal, envio, total, clave_idem) ' +
    'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id'
  ).bind(
    ahoraISO(), hoy, semanaISO(hoy), diaSemana(hoy), canal, origen,
    p.nombre, p.telefono, p.digitos, p.modalidad, p.zonaId, p.direccion, p.puntoId,
    p.metodoPago, p.notas, p.cantidad, p.subtotal, p.envio, p.total, claveIdem
  ).first();

  const id = fila.id;

  if (p.items.length) {
    await db.batch(p.items.map((it) => db.prepare(
      'INSERT INTO pedido_items (pedido_id, fecha_menu, dia_id, categoria_id, tamano_id, ' +
      'cantidad, precio_unitario, subtotal, plato_nombre) VALUES (?,?,?,?,?,?,?,?,?)'
    ).bind(id, it.fechaMenu, it.diaId, it.catId, it.tamId, it.cantidad, it.precio, it.subtotal, it.plato)));
  }

  return id;
}

/* ------------------------------------- POST /api/pedidos  (público) */

async function crear(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const cuerpo = leido.cuerpo;
  const clave = texto(cuerpo.claveIdem, 60) || null;

  /* Un doble toque en el checkout, o un reintento después de que se
     cortó la señal, no puede registrar el pedido dos veces. Si ya
     existe, devolvemos el mismo y listo: para la clienta es idéntico. */
  if (clave) {
    const ya = await ctx.db.prepare('SELECT id, total, cantidad FROM pedidos WHERE clave_idem = ?')
      .bind(clave).first();
    if (ya) return json({ id: ya.id, total: ya.total, cantidad: ya.cantidad, repetido: true });
  }

  const r = await armarPedido(ctx.db, cuerpo, { exigirMenuPublicado: true });
  if (!r.ok) return errores.datosInvalidos(r.errs);

  const origen = cuerpo.origen === 'checkout-confirmado' ? 'checkout-confirmado' : 'checkout-whatsapp';
  const id = await insertar(ctx.db, r.pedido, 'app', origen, clave);

  return json({
    id,
    cantidad: r.pedido.cantidad,
    subtotal: r.pedido.subtotal,
    envio: r.pedido.envio,
    total: r.pedido.total,
    repetido: false
  }, { estado: 201 });
}

/* ------------------------- POST /api/pedidos/manual  (protegido) */

async function crearManual(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const r = await armarPedido(ctx.db, leido.cuerpo, { exigirMenuPublicado: false });
  if (!r.ok) return errores.datosInvalidos(r.errs);

  const id = await insertar(ctx.db, r.pedido, 'whatsapp', 'panel', null);
  return json({ id, total: r.pedido.total, cantidad: r.pedido.cantidad }, { estado: 201 });
}

/* ---------------------------- GET /api/pedidos  (protegido) */

async function listar(ctx) {
  const q = ctx.url.searchParams;
  const hoy = fechaLocal();
  const rango = q.get('rango') || 'dia';          // 'dia' | 'semana' | 'todo'
  const fecha = q.get('fecha') || hoy;

  let donde = '', args = [];
  if (rango === 'dia') { donde = 'WHERE fecha_local = ?'; args = [fecha]; }
  else if (rango === 'semana') { donde = 'WHERE semana_local = ?'; args = [semanaISO(fecha)]; }

  const canal = q.get('canal');
  if (canal === 'app' || canal === 'whatsapp') {
    donde += (donde ? ' AND' : 'WHERE') + ' canal = ?';
    args.push(canal);
  }

  const [pedidosRes, resumenRes, tiposRes] = await ctx.db.batch([
    ctx.db.prepare(
      'SELECT id, creado_en, fecha_local, canal, origen, estado, cliente_nombre, cliente_telefono, ' +
      'modalidad, zona_id, direccion, punto_id, metodo_pago, notas, cantidad, subtotal, envio, total ' +
      'FROM pedidos ' + donde + ' ORDER BY creado_en DESC LIMIT 300'
    ).bind(...args),
    ctx.db.prepare(
      'SELECT canal, COUNT(*) AS pedidos, SUM(cantidad) AS viandas, SUM(total) AS plata ' +
      'FROM pedidos ' + donde + ' GROUP BY canal'
    ).bind(...args),
    ctx.db.prepare(
      'SELECT i.categoria_id, SUM(i.cantidad) AS viandas FROM pedido_items i ' +
      'JOIN pedidos p ON p.id = i.pedido_id ' +
      (donde ? donde.replace(/\b(fecha_local|semana_local|canal)\b/g, 'p.$1') : '') +
      ' GROUP BY i.categoria_id ORDER BY viandas DESC'
    ).bind(...args)
  ]);

  const pedidos = (pedidosRes.results || []);
  const porCanal = { app: { pedidos: 0, viandas: 0, plata: 0 }, whatsapp: { pedidos: 0, viandas: 0, plata: 0 } };
  for (const c of (resumenRes.results || [])) {
    porCanal[c.canal] = { pedidos: c.pedidos, viandas: c.viandas || 0, plata: c.plata || 0 };
  }

  /* Los ítems de los pedidos que se muestran, para poder desplegar el
     detalle sin pedir de a uno. */
  let items = [];
  if (pedidos.length) {
    const marcas = pedidos.map(() => '?').join(',');
    const r = await ctx.db.prepare(
      'SELECT pedido_id, dia_id, categoria_id, tamano_id, cantidad, plato_nombre, subtotal ' +
      'FROM pedido_items WHERE pedido_id IN (' + marcas + ')'
    ).bind(...pedidos.map((p) => p.id)).all();
    items = r.results || [];
  }

  return json({
    rango, fecha, hoy,
    semana: semanaISO(fecha),
    pedidos,
    items,
    resumen: {
      pedidos: porCanal.app.pedidos + porCanal.whatsapp.pedidos,
      viandas: porCanal.app.viandas + porCanal.whatsapp.viandas,
      plata: porCanal.app.plata + porCanal.whatsapp.plata,
      porCanal,
      porTipo: (tiposRes.results || [])
    }
  });
}

/* ------------------------- PATCH /api/pedidos/:id  (protegido) */

const ESTADOS = ['nuevo', 'confirmado', 'entregado', 'cancelado'];
const CANALES = ['app', 'whatsapp'];

/* El PATCH sirve para dos cosas distintas:

   · Sin `items`, cambia sólo el estado. Es lo que usa el desplegable de
     cada fila del listado, que se toca todo el tiempo y tiene que ser
     lo más liviano posible.

   · Con `items`, edita el pedido entero. Los precios y el envío se
     vuelven a calcular en el servidor a partir de la lista de precios
     de hoy, igual que al cargarlo: el panel nunca manda un importe.

   Lo que NO se toca al editar es cuándo entró el pedido (creado_en,
   fecha_local, semana_local, dia_semana). El pedido se hizo el día que
   se hizo; corregirle el nombre a la clienta el jueves no lo mueve de
   día ni le cambia la semana en las estadísticas. */
async function actualizar(ctx) {
  const id = parseInt(ctx.parametros.id, 10);
  if (!Number.isInteger(id) || id < 1) return errores.datosInvalidos(['Id inválido.']);

  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);
  const cuerpo = leido.cuerpo;

  const existe = await ctx.db.prepare('SELECT id, canal FROM pedidos WHERE id = ?').bind(id).first();
  if (!existe) return errores.noEncontrado('Ese pedido');

  /* --- Camino corto: sólo el estado --- */
  if (!Array.isArray(cuerpo.items)) {
    const estado = texto(cuerpo.estado, 20);
    if (ESTADOS.indexOf(estado) < 0) {
      return errores.datosInvalidos(['Estado inválido. Puede ser: ' + ESTADOS.join(', ') + '.']);
    }
    await ctx.db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').bind(estado, id).run();
    return json({ id, estado });
  }

  /* --- Camino largo: el pedido completo --- */
  const r = await armarPedido(ctx.db, cuerpo, { exigirMenuPublicado: false });
  if (!r.ok) return errores.datosInvalidos(r.errs);
  const p = r.pedido;

  let estado = texto(cuerpo.estado, 20);
  if (!estado) estado = null;
  else if (ESTADOS.indexOf(estado) < 0) {
    return errores.datosInvalidos(['Estado inválido. Puede ser: ' + ESTADOS.join(', ') + '.']);
  }

  let canal = texto(cuerpo.canal, 20);
  if (CANALES.indexOf(canal) < 0) canal = existe.canal;

  const ops = [
    ctx.db.prepare(
      'UPDATE pedidos SET canal = ?, cliente_nombre = ?, cliente_telefono = ?, telefono_norm = ?, ' +
      'modalidad = ?, zona_id = ?, direccion = ?, punto_id = ?, metodo_pago = ?, notas = ?, ' +
      'cantidad = ?, subtotal = ?, envio = ?, total = ?' +
      (estado ? ', estado = ?' : '') + ' WHERE id = ?'
    ).bind(...[
      canal, p.nombre, p.telefono, p.digitos, p.modalidad, p.zonaId, p.direccion,
      p.puntoId, p.metodoPago, p.notas, p.cantidad, p.subtotal, p.envio, p.total
    ].concat(estado ? [estado] : []).concat([id])),

    /* Se borran los ítems y se vuelven a escribir. Es más simple y más
       seguro que buscar cuál cambió: el pedido queda exactamente como
       lo dejó el formulario, sin restos de la versión anterior. */
    ctx.db.prepare('DELETE FROM pedido_items WHERE pedido_id = ?').bind(id)
  ];

  for (const it of p.items) {
    ops.push(ctx.db.prepare(
      'INSERT INTO pedido_items (pedido_id, fecha_menu, dia_id, categoria_id, tamano_id, ' +
      'cantidad, precio_unitario, subtotal, plato_nombre) VALUES (?,?,?,?,?,?,?,?,?)'
    ).bind(id, it.fechaMenu, it.diaId, it.catId, it.tamId, it.cantidad, it.precio, it.subtotal, it.plato));
  }

  /* En batch: si algo falla, no queda un pedido con los ítems borrados. */
  await ctx.db.batch(ops);

  return json({ id, total: p.total, cantidad: p.cantidad });
}

/* ------------------------------------------------------------ Rutas */

export function registrar(router) {
  router.post('/api/pedidos', crear, { publica: true });
  router.get('/api/pedidos', listar);
  router.post('/api/pedidos/manual', crearManual);
  router.patch('/api/pedidos/:id', actualizar);
}
