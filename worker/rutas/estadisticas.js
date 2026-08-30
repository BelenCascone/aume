/* =====================================================================
   AUMÉ · worker/rutas/estadisticas.js   ·   /api/estadisticas

   Tablero para los dueños: menú más pedido, plata recaudada, pedidos por
   canal (app vs. whatsapp), ticket promedio, evolución semana a semana,
   retiro vs. envío, día con más pedidos y clientas que repiten.

   GET /api/estadisticas?desde=&hasta=   protegido

   Se implementa en la FASE 4.
   ===================================================================== */

import { errores } from '../lib/respuesta.js';

export function registrar(router) {
  router.get('/api/estadisticas', () => errores.noImplementado('Fase 4'));
}
