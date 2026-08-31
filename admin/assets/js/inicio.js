/* =====================================================================
   AUMÉ · admin/assets/js/inicio.js
   La portada del panel: los números de la semana y la entrada animada.

   Dos decisiones acá:

   · Si la API no contesta, esto no muestra ningún error. La portada
     tiene que servir para llegar a las otras pantallas incluso con el
     worker caído; un cartel rojo arriba de todo daría a entender que el
     panel entero está roto cuando en realidad no lo está.

   · La animación va sólo en esta pantalla. En las de trabajo se entra a
     hacer algo, y algo que se mueve mientras querés tocarlo estorba.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, plata = Panel.plata;
  var miles = new Intl.NumberFormat('es-AR');

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hoyParana() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function restar(fecha, n) {
    var d = new Date(fecha + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  }

  /* Cuenta de 0 al número final. El easing es "arranca rápido y frena":
     el número queda legible casi enseguida y sólo los últimos dígitos
     se acomodan, en vez de ser una ruleta durante medio segundo. */
  function contar(nodo, hasta, formato) {
    if (quieto || hasta === 0) { nodo.textContent = formato(hasta); return; }
    var ms = 900, desde = null;
    function paso(t) {
      if (desde === null) desde = t;
      var x = Math.min(1, (t - desde) / ms);
      var suave = 1 - Math.pow(1 - x, 3);
      nodo.textContent = formato(Math.round(hasta * suave));
      if (x < 1) requestAnimationFrame(paso);
      else nodo.textContent = formato(hasta);
    }
    requestAnimationFrame(paso);
  }

  /* Las tarjetas y los módulos entran escalonados, de arriba hacia
     abajo, siguiendo el orden en que se leen. */
  function escalonar(nodos, arranque) {
    nodos.forEach(function (n, i) {
      n.style.animationDelay = (arranque + i * 70) + 'ms';
      n.classList.add('reveal');
    });
  }

  async function numeros() {
    var caja = el('inicioKpis');
    if (!caja) return;

    var hoy = hoyParana();
    var d;
    try {
      d = await Panel.pedir('/api/estadisticas?desde=' + restar(hoy, 6) + '&hasta=' + hoy);
    } catch (e) {
      return;   /* a propósito: ver el comentario de arriba */
    }

    var t = d.totales;
    caja.innerHTML =
      '<div class="inicio-kpi"><p class="inicio-kpi__n" data-n="' + t.pedidos + '">0</p>' +
        '<p class="inicio-kpi__l">Pedidos · últimos 7 días</p></div>' +
      '<div class="inicio-kpi"><p class="inicio-kpi__n" data-n="' + t.viandas + '">0</p>' +
        '<p class="inicio-kpi__l">Viandas para cocinar</p></div>' +
      '<div class="inicio-kpi"><p class="inicio-kpi__n" data-plata="' + t.plata + '">0</p>' +
        '<p class="inicio-kpi__l">Recaudado</p></div>';
    caja.hidden = false;

    escalonar(Array.prototype.slice.call(caja.children), 0);

    caja.querySelectorAll('[data-n]').forEach(function (n) {
      contar(n, Number(n.getAttribute('data-n')), function (v) { return miles.format(v); });
    });
    caja.querySelectorAll('[data-plata]').forEach(function (n) {
      contar(n, Number(n.getAttribute('data-plata')), plata);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    escalonar(Array.prototype.slice.call(document.querySelectorAll('.modulo')), 120);
    numeros();
  });
})();
