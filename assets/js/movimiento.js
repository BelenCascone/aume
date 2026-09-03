/* =====================================================================
   AUMÉ · movimiento.js
   El movimiento de la landing y de la página de una publicación.

   QUÉ HACE
   ---------------------------------------------------------------------
   Tres cosas, y ninguna cambia lo que dice la página:

     1. Marca la página con la clase `mov`, que es la que habilita todo
        el movimiento en landing.css.
     2. Revela cada bloque cuando entra en pantalla (le pone `rev--on`).
     3. Le pone sombra a la cabecera apenas se scrollea.

   POR QUÉ VA EN EL <head> Y SIN defer
   ---------------------------------------------------------------------
   La clase `mov` tiene que estar puesta ANTES de que se dibuje la
   primera pantalla. Si llegara después, la página se vería un instante
   completa, se escondería para animarse y recién ahí aparecería: un
   parpadeo peor que no animar nada. El archivo es chico y va en el
   mismo dominio, así que bloquear el dibujado un instante no se nota.

   No es un script inline por la política de seguridad del sitio
   (script-src 'self' en _headers): los scripts inline están bloqueados
   a propósito y no vamos a abrir esa puerta por una animación.

   CUÁNDO NO HACE NADA
   ---------------------------------------------------------------------
   Si la persona pidió menos movimiento en su sistema, o si el navegador
   no tiene IntersectionObserver, la clase `mov` no se pone nunca y la
   página se ve entera desde el primer momento. Ese es el punto de que
   el estado "escondido" viva detrás de `mov`: sin JavaScript no hay
   nada invisible esperando una animación que no va a ocurrir.
   ===================================================================== */
(function (global) {
  'use strict';

  var doc  = global.document;
  var raiz = doc.documentElement;

  function menosMovimiento() {
    return !!(global.matchMedia &&
              global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  if (menosMovimiento() || !('IntersectionObserver' in global)) return;

  raiz.className += (raiz.className ? ' ' : '') + 'mov';

  /* --------------------------------------------------------- Revelar */

  function revelar() {
    var bloques = doc.querySelectorAll('.rev');
    if (!bloques.length) return;

    var mirada = new global.IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (!entradas[i].isIntersecting) continue;
        entradas[i].target.classList.add('rev--on');
        mirada.unobserve(entradas[i].target);   /* se revela una sola vez */
      }
    }, {
      /* El bloque se revela cuando ya entró de verdad, no cuando asoma
         un pixel: así el movimiento acompaña al scroll en vez de
         adelantársele. */
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.05
    });

    for (var i = 0; i < bloques.length; i++) {
      /* La portada no espera al scroll: ya está en pantalla */
      if (bloques[i].className.indexOf('hero__in') !== -1) continue;
      mirada.observe(bloques[i]);
    }

    /* La portada entra sola, en orden de lectura. Los dos cuadros de
       espera son para que el navegador alcance a dibujar el estado
       inicial: sin eso no hay transición, hay salto. */
    var portada = doc.querySelector('.hero__in.rev');
    if (portada) {
      global.requestAnimationFrame(function () {
        global.requestAnimationFrame(function () {
          portada.classList.add('rev--on');
        });
      });
    }
  }

  /* ------------------------------------------------------- Cabecera */

  function cabecera() {
    var cab = doc.querySelector('.cab');
    if (!cab) return;

    var despegada = false;
    var pedido = false;

    function mirar() {
      var abajo = (global.pageYOffset || raiz.scrollTop || 0) > 6;
      if (abajo === despegada) return;
      despegada = abajo;
      cab.classList.toggle('cab--scroll', abajo);
    }

    global.addEventListener('scroll', function () {
      if (pedido) return;
      pedido = true;
      global.requestAnimationFrame(function () { pedido = false; mirar(); });
    }, { passive: true });

    mirar();
  }

  function iniciar() { revelar(); cabecera(); }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})(window);
