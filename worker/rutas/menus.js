/* =====================================================================
   AUMÉ · worker/rutas/menus.js   ·   /api/menus

   Menú de cada día, con estado borrador / publicado. El historial no se
   borra nunca: la grilla del panel muestra el mes actual por defecto y
   puede mirar meses anteriores.

   GET   /api/menus                 público    -> sólo los publicados (landing)
   GET   /api/menus?mes=YYYY-MM     protegido  -> grilla del panel, con borradores
   GET   /api/menus/:fecha          protegido  -> un día para editarlo
   PUT   /api/menus/:fecha          protegido  -> guardar borrador
   POST  /api/menus/:fecha/publicar protegido  -> publicar

   Se implementa en la FASE 2.
   ===================================================================== */

import { errores } from '../lib/respuesta.js';

export function registrar(router) {
  router.get('/api/menus', () => errores.noImplementado('Fase 2'), { publica: true });
  router.get('/api/menus/:fecha', () => errores.noImplementado('Fase 2'));
  router.put('/api/menus/:fecha', () => errores.noImplementado('Fase 2'));
  router.post('/api/menus/:fecha/publicar', () => errores.noImplementado('Fase 2'));
}
