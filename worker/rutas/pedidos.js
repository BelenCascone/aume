/* =====================================================================
   AUMÉ · worker/rutas/pedidos.js   ·   /api/pedidos

   canal 'app'      -> el pedido entró solo desde la landing
   canal 'whatsapp' -> lo cargó la secretaria a mano en el panel

   POST  /api/pedidos          público    -> lo llama el checkout de la landing
   GET   /api/pedidos          protegido  -> listado + resumen del panel
   POST  /api/pedidos/manual   protegido  -> alta rápida de un pedido de WhatsApp
   PATCH /api/pedidos/:id      protegido  -> cambiar estado / corregir datos

   OJO con POST /api/pedidos: es la única ruta pública que ESCRIBE en la
   base. La validación de esa entrada se hace completa en el worker, sin
   confiar en nada de lo que mande el navegador (precios y totales se
   recalculan de la base).

   Se implementa en la FASE 3.
   ===================================================================== */

import { errores } from '../lib/respuesta.js';

export function registrar(router) {
  router.post('/api/pedidos', () => errores.noImplementado('Fase 3'), { publica: true });
  router.get('/api/pedidos', () => errores.noImplementado('Fase 3'));
  router.post('/api/pedidos/manual', () => errores.noImplementado('Fase 3'));
  router.patch('/api/pedidos/:id', () => errores.noImplementado('Fase 3'));
}
