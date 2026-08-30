/* =====================================================================
   AUMÉ · worker/rutas/precios.js   ·   /api/precios

   Precio de la vianda por tamaño, envío por zona, packs semanales y plan
   mensual. Esta es la única fuente de verdad: la landing y el panel leen
   de acá, no de assets/js/data/config.js.

   GET  /api/precios   público    -> lo consume la landing
   PUT  /api/precios   protegido  -> lo edita el panel

   Se implementa en la FASE 1.
   ===================================================================== */

import { errores } from '../lib/respuesta.js';

export function registrar(router) {
  router.get('/api/precios', () => errores.noImplementado('Fase 1'), { publica: true });
  router.put('/api/precios', () => errores.noImplementado('Fase 1'));
}
