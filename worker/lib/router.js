/* =====================================================================
   AUMÉ · worker/lib/router.js
   Router mínimo: no queremos una dependencia entera para cuatro rutas.

   Los patrones aceptan parámetros con dos puntos:
     '/api/menus/:fecha'  ->  parametros.fecha
   ===================================================================== */

import { errores } from './respuesta.js';

function compilar(patron) {
  const nombres = [];
  const regex = patron
    .split('/')
    .map((tramo) => {
      if (!tramo.startsWith(':')) {
        return tramo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      nombres.push(tramo.slice(1));
      return '([^/]+)';
    })
    .join('/');

  return { regex: new RegExp('^' + regex + '$'), nombres };
}

export function crearRouter() {
  const rutas = [];

  function agregar(metodo, patron, manejador, opciones = {}) {
    rutas.push({
      metodo,
      patron,
      ...compilar(patron),
      manejador,
      /* publica: true  -> la puede llamar cualquiera (la landing)
         publica: false -> exige una identidad válida de Cloudflare Access */
      publica: opciones.publica === true
    });
    return api;
  }

  const api = {
    get:    (p, h, o) => agregar('GET', p, h, o),
    post:   (p, h, o) => agregar('POST', p, h, o),
    put:    (p, h, o) => agregar('PUT', p, h, o),
    patch:  (p, h, o) => agregar('PATCH', p, h, o),
    delete: (p, h, o) => agregar('DELETE', p, h, o),

    /* Busca la ruta que corresponde al pedido.
       Devuelve { tipo: 'ok' | 'metodo' | 'nada' }. Distinguimos "la ruta
       no existe" de "existe pero con otro método" para poder responder
       404 o 405 según corresponda. */
    resolver(metodo, ruta) {
      const permitidos = [];
      for (const r of rutas) {
        const m = r.regex.exec(ruta);
        if (!m) continue;
        if (r.metodo !== metodo) { permitidos.push(r.metodo); continue; }

        const parametros = {};
        r.nombres.forEach((nombre, i) => {
          parametros[nombre] = decodeURIComponent(m[i + 1]);
        });
        return { tipo: 'ok', ruta: r, parametros };
      }
      if (permitidos.length) return { tipo: 'metodo', permitidos };
      return { tipo: 'nada' };
    },

    respuestaMetodo: (permitidos) => errores.metodoNoPermitido(permitidos)
  };

  return api;
}
