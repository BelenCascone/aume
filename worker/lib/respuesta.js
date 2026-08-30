/* =====================================================================
   AUMÉ · worker/lib/respuesta.js
   Todas las respuestas de la API salen por acá, para que siempre tengan
   el mismo formato y las mismas cabeceras.

   Formato de éxito:  { ok: true,  datos: … }
   Formato de error:  { ok: false, error: { codigo, mensaje } }
   ===================================================================== */

/* La API nunca se cachea: el panel y la landing tienen que ver siempre el
   dato de ahora. El sw.js de la landing igual usa "red primero", así que
   sólo cae al cache si el worker no responde. */
const CABECERAS_BASE = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export function json(datos, opciones = {}) {
  const { estado = 200, cabeceras = {} } = opciones;
  return new Response(JSON.stringify({ ok: true, datos }), {
    status: estado,
    headers: { ...CABECERAS_BASE, ...cabeceras }
  });
}

export function error(estado, codigo, mensaje, extra = {}) {
  return new Response(
    JSON.stringify({ ok: false, error: { codigo, mensaje, ...extra } }),
    { status: estado, headers: CABECERAS_BASE }
  );
}

/* Atajos para los errores que más se repiten */
export const errores = {
  noEncontrado: (que = 'El recurso') =>
    error(404, 'no_encontrado', que + ' no existe.'),

  metodoNoPermitido: (permitidos) =>
    new Response(
      JSON.stringify({
        ok: false,
        error: { codigo: 'metodo_no_permitido', mensaje: 'Ese método no se puede usar en esta ruta.' }
      }),
      { status: 405, headers: { ...CABECERAS_BASE, Allow: permitidos.join(', ') } }
    ),

  datosInvalidos: (detalles) =>
    error(422, 'datos_invalidos', 'Hay datos que no podemos aceptar.', { detalles }),

  noAutorizado: (mensaje = 'Necesitás iniciar sesión para entrar al panel.') =>
    error(401, 'no_autorizado', mensaje),

  sinConfigurar: (mensaje) =>
    error(503, 'sin_configurar', mensaje),

  interno: () =>
    error(500, 'error_interno', 'Algo falló de nuestro lado. Probá de nuevo en un momento.'),

  noImplementado: (fase) =>
    error(501, 'no_implementado',
      'Esta parte de la API todavía no está construida (llega en la ' + fase + ').')
};

/* Lee el cuerpo JSON de un request sin explotar si viene vacío o roto. */
export async function leerJson(request) {
  const tipo = request.headers.get('content-type') || '';
  if (!tipo.includes('application/json')) {
    return { ok: false, motivo: 'El cuerpo tiene que ser JSON.' };
  }
  try {
    const cuerpo = await request.json();
    if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
      return { ok: false, motivo: 'El cuerpo tiene que ser un objeto JSON.' };
    }
    return { ok: true, cuerpo };
  } catch (e) {
    return { ok: false, motivo: 'El cuerpo no es JSON válido.' };
  }
}
