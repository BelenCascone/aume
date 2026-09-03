/* =====================================================================
   AUMÉ · worker/rutas/cotizaciones.js   ·   /api/cotizaciones

   El formulario de empresas de la landing. Es lo ÚNICO del sitio donde
   alguien de afuera deja sus datos, así que se trata aparte y con más
   cuidado que el resto.

   POST /api/cotizaciones      público  · lo manda la landing
   GET  /api/cotizaciones      protegida · las ve el panel
   PATCH /api/cotizaciones/:id protegida · cambiar el estado

   POR QUÉ NO ES UN <form> COMÚN
   ---------------------------------------------------------------------
   La política de seguridad del sitio tiene `form-action 'none'`, que
   prohíbe que un formulario se envíe a ningún lado. La landing lo manda
   con fetch(), que no cuenta como envío de formulario, así que se puede
   tener este formulario SIN aflojar la política. No es un rodeo: la
   regla sigue protegiendo contra que alguien inyecte un formulario que
   se mande a otro sitio.

   EL FRENO DE ENVÍOS
   ---------------------------------------------------------------------
   Un formulario público sin freno se llena de basura en una semana. Se
   cuentan los envíos recientes del mismo origen; pasado el límite, se
   contesta que espere un rato. El origen se guarda HASHEADO: alcanza
   para contar y no guarda la dirección de nadie.
   ===================================================================== */

import { json, errores, leerJson } from '../lib/respuesta.js';

const ESTADOS = ['nueva', 'contactada', 'cerrada'];

/* Cuántos envíos se aceptan del mismo origen y en cuánto tiempo. Da
   lugar a corregir un error de tipeo y a un segundo intento, y frena a
   quien mande en serie. */
const MAX_ENVIOS  = 3;
const VENTANA_MIN = 15;

/* ------------------------------------------------------- Utilidades */

function texto(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

function parrafos(v, max) {
  return String(v == null ? '' : v)
    .replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

/* No validamos el mail con una expresión estricta a propósito: las que
   circulan rechazan direcciones válidas y no atajan las inválidas. Con
   que tenga forma de mail alcanza; quien conteste va a darse cuenta. */
function pareceMail(v) {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v);
}

/* Un teléfono usable tiene al menos 8 dígitos. */
function pareceTelefono(v) {
  return (String(v).match(/\d/g) || []).length >= 8;
}

async function hashDeOrigen(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip) return '';
  const datos = new TextEncoder().encode('aume-cotizaciones:' + ip);
  const resumen = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(resumen).slice(0, 16),
                    (b) => b.toString(16).padStart(2, '0')).join('');
}

function comoSalida(f) {
  return {
    id: f.id,
    empresa: f.empresa,
    contacto: f.contacto,
    email: f.email,
    telefono: f.telefono,
    personas: f.personas,
    zona: f.zona,
    dias: f.dias,
    mensaje: f.mensaje,
    estado: f.estado,
    creadaEn: f.creada_en
  };
}

const COLUMNAS =
  'id, empresa, contacto, email, telefono, personas, zona, dias, mensaje, estado, creada_en';

/* ------------------------------------------------------- Recepción */

async function recibir(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const c = leido.cuerpo;
  const errs = [];

  const contacto = texto(c.contacto, 80);
  if (!contacto) errs.push('Necesitamos tu nombre para saber con quién hablamos.');

  const email    = texto(c.email, 120);
  const telefono = texto(c.telefono, 40);

  if (!email && !telefono) {
    errs.push('Dejanos un mail o un teléfono, o no vamos a poder contestarte.');
  }
  if (email && !pareceMail(email)) {
    errs.push('Ese mail no parece estar bien escrito.');
  }
  if (telefono && !pareceTelefono(telefono)) {
    errs.push('Ese teléfono parece incompleto.');
  }

  /* Cuántos son. Es el dato con el que se arma la propuesta, así que si
     viene raro conviene decirlo y no guardar un cero. */
  let personas = 0;
  if (c.personas !== undefined && c.personas !== null && String(c.personas).trim() !== '') {
    const n = Number(String(c.personas).replace(/\D/g, ''));
    if (!Number.isInteger(n) || n < 1 || n > 2000) {
      errs.push('Decinos cuántas personas son, en número.');
    } else {
      personas = n;
    }
  }

  if (errs.length) return errores.datosInvalidos(errs);

  /* --- El freno --- */
  const origen = await hashDeOrigen(ctx.request);
  if (origen) {
    const desde = new Date(Date.now() - VENTANA_MIN * 60000).toISOString().slice(0, 19).replace('T', ' ');
    const fila = await ctx.db.prepare(
      'SELECT COUNT(*) AS n FROM cotizaciones WHERE origen_hash = ? AND creada_en >= ?'
    ).bind(origen, desde).first();

    if (fila && fila.n >= MAX_ENVIOS) {
      return errores.datosInvalidos([
        'Ya recibimos tu consulta. Si te quedó algo por agregar, escribinos por WhatsApp.'
      ]);
    }
  }

  await ctx.db.prepare(
    'INSERT INTO cotizaciones ' +
    '(empresa, contacto, email, telefono, personas, zona, dias, mensaje, origen_hash) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    texto(c.empresa, 120), contacto, email, telefono, personas,
    texto(c.zona, 120), texto(c.dias, 80), parrafos(c.mensaje, 1000), origen
  ).run();

  /* A quien completó el formulario no le devolvemos nada de lo que
     guardamos: sólo que llegó. */
  return json({ recibida: true }, { estado: 201 });
}

/* ---------------------------------------------------------- Panel */

async function listar(ctx) {
  const estado = ctx.url.searchParams.get('estado');
  const filtro = ESTADOS.includes(estado) ? estado : null;

  const sql = 'SELECT ' + COLUMNAS + ' FROM cotizaciones' +
              (filtro ? ' WHERE estado = ?' : '') +
              /* Desempata por id: creada_en tiene resolución de un
                 segundo, y dos consultas del mismo segundo tienen que
                 salir igual la más nueva primero. */
              ' ORDER BY creada_en DESC, id DESC LIMIT 200';

  const r = filtro
    ? await ctx.db.prepare(sql).bind(filtro).all()
    : await ctx.db.prepare(sql).all();

  const filas = (r && r.results) || [];
  const nuevas = filas.filter((f) => f.estado === 'nueva').length;

  return json({ cotizaciones: filas.map(comoSalida), nuevas });
}

async function actualizar(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const estado = leido.cuerpo.estado;
  if (!ESTADOS.includes(estado)) {
    return errores.datosInvalidos(['Ese estado no existe.']);
  }

  const id = Number(ctx.parametros.id);
  if (!Number.isInteger(id)) return errores.noEncontrado('Esa cotización');

  const antes = await ctx.db.prepare('SELECT id FROM cotizaciones WHERE id = ?').bind(id).first();
  if (!antes) return errores.noEncontrado('Esa cotización');

  await ctx.db.prepare('UPDATE cotizaciones SET estado = ? WHERE id = ?').bind(estado, id).run();

  const f = await ctx.db.prepare('SELECT ' + COLUMNAS + ' FROM cotizaciones WHERE id = ?')
    .bind(id).first();

  return json({ cotizacion: comoSalida(f) });
}

/* ------------------------------------------------------------ Rutas */

export function registrar(router) {
  router.post('/api/cotizaciones', recibir, { publica: true });
  router.get('/api/cotizaciones', listar);
  router.patch('/api/cotizaciones/:id', actualizar);
}
