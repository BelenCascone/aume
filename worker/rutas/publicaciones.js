/* =====================================================================
   AUMÉ · worker/rutas/publicaciones.js   ·   /api/publicaciones

   Los tips, las recetas y la info nutricional que hoy sólo viven en
   Instagram. Los carga quien maneja las redes desde el panel y salen
   solos en la landing: nadie tiene que tocar un archivo.

   QUÉ ES PÚBLICO Y QUÉ NO
   ---------------------------------------------------------------------
   GET  /api/publicaciones              público  · sólo las publicadas
   GET  /api/publicaciones/:id          público  · sólo si está publicada
   GET  /api/publicaciones/imagenes/:a  público  · la foto, desde R2
   GET  /api/publicaciones/panel        protegida · también los borradores
   POST /api/publicaciones              protegida
   PUT  /api/publicaciones/:id          protegida
   POST /api/publicaciones/imagenes     protegida · subir una foto
   DELETE /api/publicaciones/:id        protegida

   Un borrador NO sale nunca por las rutas públicas. Es la única regla
   que no se puede aflojar: alguien escribiendo a mitad de una nota no
   tiene por qué aparecer en la web.

   LAS IMÁGENES
   ---------------------------------------------------------------------
   No van en la base: van a un bucket R2 y en la fila queda el nombre
   del archivo. El worker las sirve desde su propia ruta, o sea desde el
   mismo dominio, que es lo que la política de seguridad del sitio
   permite (`img-src 'self'`). Pegar el link de una foto de Instagram no
   funcionaría: el navegador la bloquearía.

   Si el bucket todavía no está configurado, todo lo demás anda igual:
   las publicaciones sin foto se cargan y se ven. Sólo falla subir una
   imagen, y con un mensaje que dice qué falta.
   ===================================================================== */

import { json, errores, leerJson } from '../lib/respuesta.js';
import { fechaLocal } from '../lib/tiempo.js';

const CATEGORIAS = ['tip', 'receta', 'nutricion'];
const ESTADOS    = ['borrador', 'publicado'];

/* Formatos que aceptamos subir, con la extensión que les damos nosotros.
   La extensión NUNCA sale del nombre que mandó el navegador. */
const FORMATOS = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp'
};

const MAX_IMAGEN = 3 * 1024 * 1024;   // 3 MB

/* ------------------------------------------------------- Utilidades */

function texto(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

/* El cuerpo conserva los saltos de línea: son los párrafos de la nota. */
function parrafos(v, max) {
  return String(v == null ? '' : v)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/* 'Tres mitos de invierno' -> 'tres-mitos-de-invierno'.
   Es la dirección de la nota, así que tiene que ser estable y sin
   sorpresas: sólo letras sin acento, números y guiones. */
function armarId(titulo) {
  return String(titulo || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function esFecha(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/* El nombre del archivo de imagen lo elegimos nosotros y lo validamos al
   leerlo: nada que venga de afuera puede pedir otra cosa que un archivo
   que nosotros mismos guardamos. */
function esNombreDeImagen(v) {
  return typeof v === 'string' && /^[a-z0-9]{16}\.(jpg|png|webp)$/.test(v);
}

function comoSalida(f) {
  return {
    id: f.id,
    titulo: f.titulo,
    copete: f.copete,
    cuerpo: f.cuerpo,
    categoria: f.categoria,
    imagen: f.imagen ? '/api/publicaciones/imagenes/' + f.imagen : '',
    imagenAlt: f.imagen_alt,
    estado: f.estado,
    fecha: f.fecha,
    actualizadoEn: f.actualizado_en
  };
}

const COLUMNAS =
  'id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha, actualizado_en';

/* ---------------------------------------------------------- Lectura */

/* GET /api/publicaciones  ·  lo que consume la landing.

   Devuelve el listado sin el cuerpo entero: la landing muestra tarjetas
   y no necesita el texto completo de cada nota para dibujarlas. */
async function listarPublicas(ctx) {
  const cat = ctx.url.searchParams.get('categoria');
  const filtroCat = CATEGORIAS.includes(cat) ? cat : null;

  const limite = Math.min(Number(ctx.url.searchParams.get('limite')) || 12, 50);

  const sql =
    'SELECT ' + COLUMNAS + ' FROM publicaciones ' +
    "WHERE estado = 'publicado'" + (filtroCat ? ' AND categoria = ?' : '') +
    ' ORDER BY fecha DESC, actualizado_en DESC LIMIT ?';

  const args = filtroCat ? [filtroCat, limite] : [limite];
  const r = await ctx.db.prepare(sql).bind(...args).all();

  const publicaciones = ((r && r.results) || []).map((f) => {
    const salida = comoSalida(f);
    /* En el listado va sólo el copete; el cuerpo se pide al abrir la nota */
    salida.cuerpo = '';
    return salida;
  });

  return json({ publicaciones });
}

/* GET /api/publicaciones/:id  ·  una nota entera, para su propia página */
async function verUna(ctx) {
  const f = await ctx.db.prepare(
    'SELECT ' + COLUMNAS + " FROM publicaciones WHERE id = ? AND estado = 'publicado'"
  ).bind(ctx.parametros.id).first();

  if (!f) return errores.noEncontrado('Esa publicación');
  return json({ publicacion: comoSalida(f) });
}

/* GET /api/publicaciones/panel  ·  todas, incluidos los borradores */
async function listarPanel(ctx) {
  const r = await ctx.db.prepare(
    'SELECT ' + COLUMNAS + ' FROM publicaciones ORDER BY fecha DESC, actualizado_en DESC'
  ).all();

  return json({ publicaciones: ((r && r.results) || []).map(comoSalida) });
}

/* -------------------------------------------------------- Escritura */

/* Valida y normaliza lo que llegó del panel. Devuelve { datos } o { errs }. */
function revisar(c, { exigeTitulo }) {
  const errs = [];

  const titulo = texto(c.titulo, 120);
  if (exigeTitulo && !titulo) errs.push('La publicación necesita un título.');

  const categoria = CATEGORIAS.includes(c.categoria) ? c.categoria : 'tip';
  const estado    = ESTADOS.includes(c.estado) ? c.estado : 'borrador';

  const fecha = esFecha(c.fecha) ? c.fecha : fechaLocal();

  let imagen = '';
  if (c.imagen) {
    if (esNombreDeImagen(c.imagen)) imagen = c.imagen;
    else errs.push('El nombre de la imagen no es uno de los que guardamos.');
  }

  /* Publicar con el cuerpo vacío deja una nota en blanco en la web. Como
     borrador está perfecto: es justamente una nota a medio escribir. */
  const cuerpo = parrafos(c.cuerpo, 8000);
  if (estado === 'publicado' && !cuerpo) {
    errs.push('Para publicarla hace falta escribir el texto. Guardala como borrador mientras tanto.');
  }

  return {
    errs,
    datos: {
      titulo,
      copete: texto(c.copete, 300),
      cuerpo,
      categoria,
      imagen,
      imagen_alt: texto(c.imagenAlt, 150),
      estado,
      fecha
    }
  };
}

/* POST /api/publicaciones */
async function crear(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const { errs, datos } = revisar(leido.cuerpo, { exigeTitulo: true });
  if (errs.length) return errores.datosInvalidos(errs);

  /* La dirección de la nota sale del título. Si ya existe una con ese
     mismo nombre le pegamos la fecha, en vez de pisar la anterior. */
  let id = armarId(datos.titulo);
  if (!id) return errores.datosInvalidos(['El título tiene que tener alguna letra o número.']);

  const existe = await ctx.db.prepare('SELECT id FROM publicaciones WHERE id = ?').bind(id).first();
  if (existe) id = (id + '-' + datos.fecha).slice(0, 80);

  await ctx.db.prepare(
    'INSERT INTO publicaciones ' +
    '(id, titulo, copete, cuerpo, categoria, imagen, imagen_alt, estado, fecha) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, datos.titulo, datos.copete, datos.cuerpo, datos.categoria,
         datos.imagen, datos.imagen_alt, datos.estado, datos.fecha).run();

  const f = await ctx.db.prepare('SELECT ' + COLUMNAS + ' FROM publicaciones WHERE id = ?')
    .bind(id).first();

  return json({ publicacion: comoSalida(f) }, { estado: 201 });
}

/* PUT /api/publicaciones/:id */
async function guardar(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const id = ctx.parametros.id;
  const antes = await ctx.db.prepare('SELECT id FROM publicaciones WHERE id = ?').bind(id).first();
  if (!antes) return errores.noEncontrado('Esa publicación');

  const { errs, datos } = revisar(leido.cuerpo, { exigeTitulo: true });
  if (errs.length) return errores.datosInvalidos(errs);

  /* El id no cambia aunque cambie el título: si ya se compartió el link
     de la nota, tiene que seguir abriendo. */
  await ctx.db.prepare(
    'UPDATE publicaciones SET titulo = ?, copete = ?, cuerpo = ?, categoria = ?, ' +
    'imagen = ?, imagen_alt = ?, estado = ?, fecha = ?, ' +
    "actualizado_en = datetime('now') WHERE id = ?"
  ).bind(datos.titulo, datos.copete, datos.cuerpo, datos.categoria,
         datos.imagen, datos.imagen_alt, datos.estado, datos.fecha, id).run();

  const f = await ctx.db.prepare('SELECT ' + COLUMNAS + ' FROM publicaciones WHERE id = ?')
    .bind(id).first();

  return json({ publicacion: comoSalida(f) });
}

/* DELETE /api/publicaciones/:id

   La foto queda en el bucket a propósito: borrar archivos es lo único
   que no tiene vuelta atrás, y si alguien borra una nota por error
   preferimos que sólo haya que volver a escribirla. */
async function borrar(ctx) {
  const id = ctx.parametros.id;
  const antes = await ctx.db.prepare('SELECT id FROM publicaciones WHERE id = ?').bind(id).first();
  if (!antes) return errores.noEncontrado('Esa publicación');

  await ctx.db.prepare('DELETE FROM publicaciones WHERE id = ?').bind(id).run();
  return json({ borrada: id });
}

/* --------------------------------------------------------- Imágenes */

/* POST /api/publicaciones/imagenes  ·  sube una foto al bucket.

   Llega como multipart, que es lo que manda un <input type="file">. Del
   archivo sólo confiamos en dos cosas: su tamaño y su tipo declarado, y
   las dos se revisan acá. El nombre lo ponemos nosotros. */
async function subirImagen(ctx) {
  if (!ctx.env.FOTOS) {
    return errores.sinConfigurar(
      'Todavía no está configurado el lugar donde se guardan las fotos (el bucket R2 ' +
      '"FOTOS" de wrangler.jsonc). Mientras tanto la publicación se puede cargar sin imagen.'
    );
  }

  let formulario;
  try {
    formulario = await ctx.request.formData();
  } catch (e) {
    return errores.datosInvalidos(['La foto no llegó como se esperaba. Probá de nuevo.']);
  }

  const archivo = formulario.get('imagen');
  if (!archivo || typeof archivo.arrayBuffer !== 'function') {
    return errores.datosInvalidos(['No vino ninguna foto.']);
  }

  const extension = FORMATOS[archivo.type];
  if (!extension) {
    return errores.datosInvalidos([
      'Ese formato no lo aceptamos. Tiene que ser JPG, PNG o WEBP.'
    ]);
  }
  if (archivo.size > MAX_IMAGEN) {
    return errores.datosInvalidos([
      'La foto pesa ' + Math.round(archivo.size / 1024 / 1024 * 10) / 10 + ' MB y el máximo ' +
      'son 3 MB. Achicala antes de subirla.'
    ]);
  }

  const nombre = nombreAlAzar() + '.' + extension;

  await ctx.env.FOTOS.put(nombre, archivo.stream(), {
    httpMetadata: { contentType: archivo.type }
  });

  return json({ imagen: nombre, url: '/api/publicaciones/imagenes/' + nombre }, { estado: 201 });
}

function nombreAlAzar() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* GET /api/publicaciones/imagenes/:archivo  ·  sirve la foto.

   Es la única respuesta de la API que no es JSON y la única que se
   cachea: una foto no cambia nunca, porque cada una tiene su propio
   nombre al azar. */
async function verImagen(ctx) {
  const archivo = ctx.parametros.archivo;
  if (!esNombreDeImagen(archivo)) return errores.noEncontrado('Esa imagen');
  if (!ctx.env.FOTOS) return errores.noEncontrado('Esa imagen');

  const objeto = await ctx.env.FOTOS.get(archivo);
  if (!objeto) return errores.noEncontrado('Esa imagen');

  return new Response(objeto.body, {
    headers: {
      'Content-Type': (objeto.httpMetadata && objeto.httpMetadata.contentType) || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

/* ------------------------------------------------------------ Rutas */

export function registrar(router) {
  router.get('/api/publicaciones', listarPublicas, { publica: true });

  /* 'panel' e 'imagenes' van ANTES que /:id, si no se leen como el
     nombre de una publicación. */
  router.get('/api/publicaciones/panel', listarPanel);
  router.post('/api/publicaciones/imagenes', subirImagen);
  router.get('/api/publicaciones/imagenes/:archivo', verImagen, { publica: true });

  router.post('/api/publicaciones', crear);
  router.get('/api/publicaciones/:id', verUna, { publica: true });
  router.put('/api/publicaciones/:id', guardar);
  router.delete('/api/publicaciones/:id', borrar);
}
