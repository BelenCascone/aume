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
      if (bloques[i].className.indexOf('hero__texto') !== -1) continue;
      mirada.observe(bloques[i]);
    }

    /* La portada entra sola, en orden de lectura. Los dos cuadros de
       espera son para que el navegador alcance a dibujar el estado
       inicial: sin eso no hay transición, hay salto. */
    var portada = doc.querySelector('.hero__texto.rev');
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

  /* ------------------------------------------------ Barra de progreso
     Una línea finita arriba de todo que se va llenando a medida que se
     baja. Es de las pocas cosas que dan sensación de "página cuidada"
     sin agregar ni un color ni distraer de lo que se está leyendo. */

  function progreso() {
    var barra = doc.querySelector('.progreso__barra');
    if (!barra) return;

    var pedido = false;

    function mirar() {
      var alto = doc.body.scrollHeight - global.innerHeight;
      var y = global.pageYOffset || raiz.scrollTop || 0;
      var parte = alto > 0 ? Math.min(1, Math.max(0, y / alto)) : 0;
      barra.style.transform = 'scaleX(' + parte + ')';
    }

    global.addEventListener('scroll', function () {
      if (pedido) return;
      pedido = true;
      global.requestAnimationFrame(function () { pedido = false; mirar(); });
    }, { passive: true });

    global.addEventListener('resize', mirar, { passive: true });
    mirar();
  }

  /* ------------------------------------------------------- Parallax
     La foto de la portada se mueve un poco más despacio que el resto de
     la página. Es sutil a propósito: si se nota, molesta. El recorrido
     total son 40px, y por eso la imagen va con scale(1.06) en el CSS,
     para que nunca aparezca un borde vacío.

     Se apaga solo en pantallas chicas: en un celular no se percibe y
     mover una imagen grande en cada scroll gasta batería. */

  function parallax() {
    var foto = doc.querySelector('.hero__foto img');
    if (!foto || !global.matchMedia || !global.matchMedia('(min-width: 900px)').matches) return;

    var caja = foto.parentNode;
    var pedido = false;
    var RECORRIDO = 40;

    function mirar() {
      var r = caja.getBoundingClientRect();
      if (r.bottom < 0 || r.top > global.innerHeight) return;
      /* -1 arriba de la pantalla, +1 abajo */
      var centro = (r.top + r.height / 2 - global.innerHeight / 2) / global.innerHeight;
      var y = Math.max(-1, Math.min(1, centro)) * RECORRIDO;
      foto.style.transform = 'scale(1.06) translate3d(0,' + y.toFixed(1) + 'px,0)';
    }

    global.addEventListener('scroll', function () {
      if (pedido) return;
      pedido = true;
      global.requestAnimationFrame(function () { pedido = false; mirar(); });
    }, { passive: true });

    mirar();
  }

  /* ------------------------------------------------ Números que suben
     Las cifras de la franja cuentan desde cero cuando entran en
     pantalla. Cuentan UNA sola vez.

     El texto de cada cifra lo escribe landing.js con lo que contesta la
     API, así que acá no se inventa ningún número: se lee el que ya
     está puesto, se separa lo que no es dígito (el "+" de "+150") y se
     vuelve a escribir igual al terminar. Si no es un número, no se
     toca. */

  function contar() {
    var caja = doc.getElementById('cifras');
    if (!caja || !('IntersectionObserver' in global)) return;

    var DURACION = 900;

    function animar(nodo) {
      var texto = (nodo.textContent || '').trim();
      var crudo = texto.replace(/[^\d]/g, '');
      if (!crudo) return;

      var destino = parseInt(crudo, 10);
      if (!destino || destino > 100000) return;

      var antes = texto.slice(0, texto.indexOf(crudo.charAt(0)));
      var despues = texto.slice(texto.indexOf(crudo) + crudo.length);
      var arranque = null;

      function paso(ahora) {
        if (arranque === null) arranque = ahora;
        var t = Math.min(1, (ahora - arranque) / DURACION);
        /* Frena al final, como todo lo demás de la página */
        var suave = 1 - Math.pow(1 - t, 3);
        nodo.textContent = antes + Math.round(destino * suave) + despues;
        if (t < 1) global.requestAnimationFrame(paso);
      }

      global.requestAnimationFrame(paso);
    }

    var mirada = new global.IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (!entradas[i].isIntersecting) continue;
        mirada.disconnect();
        var nums = caja.querySelectorAll('.cifra__n');
        for (var j = 0; j < nums.length; j++) animar(nums[j]);
        return;
      }
    }, { threshold: 0.4 });

    mirada.observe(caja);
  }

  /* landing.js dibuja las cifras cuando contesta la API, que puede ser
     después de que esto corra. Se espera a que haya contenido antes de
     ponerse a mirar. */
  function contarCuandoHaya() {
    var caja = doc.getElementById('cifras');
    if (!caja) return;
    if (caja.children.length) return contar();

    var intentos = 0;
    var reloj = global.setInterval(function () {
      intentos++;
      if (caja.children.length) { global.clearInterval(reloj); contar(); }
      else if (intentos > 40) global.clearInterval(reloj);   /* 4 segundos y listo */
    }, 100);
  }

  function iniciar() {
    revelar();
    cabecera();
    progreso();
    parallax();
    contarCuandoHaya();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})(window);
