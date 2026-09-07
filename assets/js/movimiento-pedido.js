/* =====================================================================
   AUMÉ · movimiento-pedido.js
   El movimiento de la pantalla de pedidos.

   QUÉ HACE
   ---------------------------------------------------------------------
   Dos cosas, y ninguna cambia lo que dice la página:

     1. Marca la página con la clase `mov`, que es la que habilita en
        styles.css todo lo que aparece: las tarjetas que se asientan al
        entrar en pantalla, la cabecera que se achica.

     2. Achica la cabecera al bajar. Arriba de todo se ve el logo grande
        y la semana; en cuanto se empieza a scrollear, la fila del logo
        se angosta y en el lugar de la semana aparecen los accesos
        rápidos por día. No se va nada de pantalla —el logo, los cuatro
        modos y las cuatro categorías siguen ahí— pero se recupera casi
        un cuarto de la fila para el menú, que es lo que se vino a ver.

   POR QUÉ VA EN EL <head> Y SIN defer
   ---------------------------------------------------------------------
   La clase `mov` tiene que estar puesta ANTES de que se dibuje la
   primera pantalla. Si llegara después, las tarjetas se verían un
   instante y recién ahí se esconderían para animarse: un parpadeo peor
   que no animar nada. El archivo es chico y va en el mismo dominio.

   No es un script inline por la política de seguridad del sitio
   (script-src 'self' en _headers): los scripts inline están bloqueados
   a propósito y no vamos a abrir esa puerta por una animación.

   CUÁNDO NO HACE NADA
   ---------------------------------------------------------------------
   Si la persona pidió menos movimiento en su sistema, la clase `mov` no
   se pone nunca: la cabecera queda entera y las tarjetas se ven desde
   el primer momento. Ese es el punto de que el estado "escondido" viva
   detrás de `mov`: sin él no hay nada invisible esperando una animación
   que no va a ocurrir.
   ===================================================================== */
(function (global) {
  'use strict';

  var doc  = global.document;
  var raiz = doc.documentElement;

  function menosMovimiento() {
    return !!(global.matchMedia &&
              global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  if (menosMovimiento()) return;

  raiz.className += (raiz.className ? ' ' : '') + 'mov';

  /* ------------------------------------------------ Cabecera compacta

     Los dos umbrales no son el mismo a propósito: se achica pasados los
     40px y sólo vuelve a estirarse casi arriba de todo. Con un único
     umbral, quedarse justo en el límite hace que la cabecera lata. */

  var ACHICA = 40;
  var ESTIRA = 8;

  function cabecera() {
    var compacta = false;
    var pedido = false;

    function mirar() {
      /* Con un panel abierto el fondo no scrollea: dejamos la cabecera
         como está en vez de moverla debajo del velo. */
      if (doc.body.classList.contains('sin-scroll')) return;

      var y = global.pageYOffset || raiz.scrollTop || 0;
      var ahora = compacta ? (y > ESTIRA) : (y > ACHICA);
      if (ahora === compacta) return;
      compacta = ahora;
      raiz.classList.toggle('compacta', compacta);
    }

    global.addEventListener('scroll', function () {
      if (pedido) return;
      pedido = true;
      global.requestAnimationFrame(function () { pedido = false; mirar(); });
    }, { passive: true });

    mirar();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', cabecera);
  } else {
    cabecera();
  }

})(window);
