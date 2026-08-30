/* =====================================================================
   AUMÉ · worker/index.js
   Punto de entrada del Worker de Cloudflare.

   CÓMO CONVIVE CON LA WEB QUE YA FUNCIONA
   ---------------------------------------------------------------------
   Cloudflare sirve PRIMERO los archivos estáticos (index.html, assets/,
   admin/…). Este worker sólo recibe los pedidos que no coinciden con
   ningún archivo, que en la práctica son los de /api/*. La landing
   pública sigue saliendo del mismo lugar de siempre, sin pasar por acá.

   Todo lo que no sea /api/* se lo devolvemos a los assets tal cual, para
   que un 404 se vea exactamente igual que antes de que existiera el
   worker.
   ===================================================================== */

import { crearRouter } from './lib/router.js';
import { json, errores } from './lib/respuesta.js';
import { identificar } from './lib/access.js';
import { esMismoOrigen } from './lib/origen.js';

import { registrar as registrarPrecios }      from './rutas/precios.js';
import { registrar as registrarMenus }        from './rutas/menus.js';
import { registrar as registrarPedidos }      from './rutas/pedidos.js';
import { registrar as registrarEstadisticas } from './rutas/estadisticas.js';

/* ----------------------------------------------------------- Rutas */

const router = crearRouter();

/* Chequeo de salud: sirve para saber, de un vistazo, si el worker llega a
   la base. Va protegido porque cuenta cosas del entorno. */
router.get('/api/salud', async (ctx) => {
  let baseDatos = 'sin binding';
  if (ctx.env.DB) {
    try {
      await ctx.env.DB.prepare('SELECT 1').first();
      baseDatos = 'ok';
    } catch (e) {
      baseDatos = 'error: ' + e.message;
    }
  }

  return json({
    servicio: 'aume-api',
    entorno: ctx.env.AUME_ENTORNO || 'produccion',
    baseDatos,
    identidad: ctx.identidad ? ctx.identidad.email : null,
    hora: new Date().toISOString()
  });
});

registrarPrecios(router);
registrarMenus(router);
registrarPedidos(router);
registrarEstadisticas(router);

/* --------------------------------------------------------- Handler */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* Cualquier cosa que no sea API vuelve a los archivos estáticos.
       Así la landing y el panel se sirven igual que siempre. */
    if (!url.pathname.startsWith('/api/')) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response('No encontrado', { status: 404 });
    }

    try {
      return await atenderApi(request, env, ctx, url);
    } catch (e) {
      /* El detalle va al log de Cloudflare; al navegador sólo le llega un
         mensaje genérico, para no filtrar cómo está armada la base. */
      console.error('[aume-api]', url.pathname, e && e.stack ? e.stack : e);
      return errores.interno();
    }
  }
};

async function atenderApi(request, env, ctx, url) {
  const encontrada = router.resolver(request.method, url.pathname);

  if (encontrada.tipo === 'nada')   return errores.noEncontrado('Esa ruta de la API');
  if (encontrada.tipo === 'metodo') return router.respuestaMetodo(encontrada.permitidos);

  const { ruta, parametros } = encontrada;

  /* Toda ruta que no esté marcada como pública exige una identidad válida
     de Cloudflare Access. Access ya filtra /admin/* en el borde; esto es
     el segundo cerrojo, del lado del worker. */
  let identidad = null;
  if (!ruta.publica) {
    if (!esMismoOrigen(request, url)) {
      return errores.noAutorizado(
        'Este pedido no salió del panel de AUMÉ, así que no lo ejecutamos.'
      );
    }

    const control = await identificar(request, env);
    if (!control.ok) {
      return control.estado === 503
        ? errores.sinConfigurar(control.motivo)
        : errores.noAutorizado(control.motivo);
    }
    identidad = control.identidad;
  }

  /* Sin base no hay nada que hacer, y es mejor decirlo claro que devolver
     un error raro más adelante. */
  if (!env.DB) {
    return errores.sinConfigurar(
      'Falta el binding "DB" de D1. Revisá wrangler.jsonc y docs/panel-admin.md.'
    );
  }

  return ruta.manejador({
    request,
    env,
    ctx,
    url,
    parametros,
    identidad,
    db: env.DB
  });
}
