/* =====================================================================
   AUMÉ · El worker respondiendo pedidos
   ---------------------------------------------------------------------
   Levanta el worker en memoria con un entorno simulado y le manda
   pedidos de verdad. Lo que más importa acá:

   · que la landing pública NO pase por el worker
   · que en producción, sin Access configurado, el panel quede cerrado
   · que nadie pueda escribir desde otro sitio (CSRF)
   ===================================================================== */

export const nombre = 'api · ruteo, permisos y CSRF del worker';

export async function disponible() {
  if (typeof Response === 'undefined' || typeof Request === 'undefined') {
    return 'esta versión de Node no trae fetch (hace falta Node 18 o más nuevo)';
  }
  return null;
}

export async function correr(t) {
  const worker = (await import('../index.js')).default;
  const { crearRouter } = await import('../lib/router.js');

  /* D1 simulado: alcanza con lo que usa /api/salud */
  const DB = {
    prepare: () => ({ bind: () => DB.prepare(), first: async () => ({ 1: 1 }), all: async () => ({ results: [] }) }),
    batch: async (l) => l.map(() => ({ results: [] }))
  };
  const ASSETS = { fetch: async () => new Response('landing', { status: 200 }) };

  const staging = { AUME_ENTORNO: 'staging', DB, ASSETS };
  const produccion = { AUME_ENTORNO: 'produccion', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '', DB, ASSETS };

  /* Un pedido del propio panel manda esta cabecera; el navegador no deja
     falsificarla desde otro sitio. */
  const pedir = (ruta, opciones = {}) => new Request('https://aume.test' + ruta, {
    headers: { 'Sec-Fetch-Site': 'same-origin', ...(opciones.headers || {}) },
    ...opciones
  });

  async function responde(etiqueta, req, env, estado, codigo) {
    const res = await worker.fetch(req, env, {});
    const txt = await res.text();
    let cuerpo; try { cuerpo = JSON.parse(txt); } catch (e) { cuerpo = null; }
    const real = cuerpo ? (cuerpo.error ? cuerpo.error.codigo : (cuerpo.ok ? 'ok' : '')) : '';
    const bien = res.status === estado && (!codigo || real === codigo);
    t.ok(etiqueta, bien, bien ? '' : 'devolvió ' + res.status + ' ' + real +
      ' · esperaba ' + estado + ' ' + (codigo || ''));
    return cuerpo;
  }

  /* --- La web pública no toca el worker --------------------------- */
  await responde('GET / lo sirven los archivos estáticos', pedir('/'), staging, 200);
  await responde('GET /assets/css/styles.css también', pedir('/assets/css/styles.css'), staging, 200);
  await responde('GET /admin/ también (lo filtra Access antes)', pedir('/admin/'), staging, 200);

  /* --- Ruteo de la API -------------------------------------------- */
  await responde('GET /api/salud responde', pedir('/api/salud'), staging, 200, 'ok');
  await responde('una ruta que no existe da 404', pedir('/api/no-existe'), staging, 404, 'no_encontrado');
  await responde('un método que no corresponde da 405',
    pedir('/api/precios', { method: 'DELETE' }), staging, 405, 'metodo_no_permitido');

  await responde('GET /api/estadisticas responde el tablero',
    pedir('/api/estadisticas'), staging, 200, 'ok');
  /* 422 = llegó a validar el cuerpo vacío, que es lo que se quiere ver */
  await responde('POST /api/pedidos está viva y valida lo que recibe',
    pedir('/api/pedidos', { method: 'POST' }), staging, 422, 'datos_invalidos');

  /* --- Parámetros en la ruta -------------------------------------- */
  const r = crearRouter();
  r.get('/api/menus/:fecha', () => {});
  const m = r.resolver('GET', '/api/menus/2026-09-01');
  t.igual('/api/menus/:fecha captura la fecha', m.parametros, { fecha: '2026-09-01' });

  /* --- En producción, sin Access, el panel queda cerrado ----------- */
  await responde('sin ACCESS_AUD el panel no abre (falla cerrado)',
    pedir('/api/estadisticas'), produccion, 503, 'sin_configurar');
  await responde('pero la landing igual puede dejar pedidos',
    pedir('/api/pedidos', { method: 'POST' }), produccion, 422, 'datos_invalidos');

  /* El error tiene que decir EN QUÉ ENTORNO está corriendo. Casi siempre
     este 503 no es "falta configurar Access": es que se publicó con
     `wrangler deploy` a secas en vez de `--env staging`, y sin esta
     pista no hay forma de darse cuenta desde el panel. */
  {
    const res = await (await import('../index.js')).default
      .fetch(pedir('/api/estadisticas'), produccion, {});
    const cuerpo = await res.json();
    t.igual('el 503 dice en qué entorno corre', cuerpo.error.entorno, 'produccion');
    t.ok('y sugiere cómo publicar a staging',
      cuerpo.error.mensaje.indexOf('--env staging') >= 0);
  }

  /* --- CSRF: escribir desde otro sitio ----------------------------- */
  await responde('un PUT desde otro sitio se rechaza',
    pedir('/api/precios', { method: 'PUT', headers: { 'Sec-Fetch-Site': 'cross-site' } }),
    staging, 401, 'no_autorizado');
  await responde('un PUT sin Origin ni Sec-Fetch-Site se rechaza',
    new Request('https://aume.test/api/precios', { method: 'PUT' }),
    staging, 401, 'no_autorizado');
  /* Llega hasta la validación: 422 significa que pasó el control de
     origen y el de Access, que es lo que este caso quiere probar. */
  await responde('un PUT del propio sitio pasa el control y llega a validarse',
    pedir('/api/precios', { method: 'PUT', headers: { 'Sec-Fetch-Site': '', Origin: 'https://aume.test' } }),
    staging, 422, 'datos_invalidos');
  await responde('una lectura de otro sitio no se frena (no escribe nada)',
    pedir('/api/estadisticas', { headers: { 'Sec-Fetch-Site': 'cross-site' } }),
    staging, 200, 'ok');

  /* --- Sin base de datos ------------------------------------------ */
  await responde('sin el binding DB lo dice claro',
    pedir('/api/salud'), { AUME_ENTORNO: 'staging', ASSETS }, 503, 'sin_configurar');
}
