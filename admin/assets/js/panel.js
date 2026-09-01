/* =====================================================================
   AUMÉ · admin/assets/js/panel.js
   Lo que comparten todas las pantallas del panel: hablar con la API,
   mostrar avisos y formatear plata.
   ===================================================================== */
(function (global) {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var fmt = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  function plata(n) { return fmt.format(n || 0); }

  /* ------------------------------------------------------------ API */

  /* Todas las llamadas pasan por acá para que los errores lleguen
     siempre igual, con un mensaje que se pueda mostrar tal cual. */
  async function pedir(ruta, opciones) {
    opciones = opciones || {};
    var config = {
      method: opciones.metodo || 'GET',
      /* Sin esto no viaja la cookie de Cloudflare Access y el worker
         rechaza todo lo del panel. */
      credentials: 'same-origin',
      headers: {}
    };
    if (opciones.cuerpo !== undefined) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(opciones.cuerpo);
    }

    var res, cuerpo;
    try {
      res = await fetch(ruta, config);
    } catch (e) {
      throw { mensaje: 'No se pudo hablar con el servidor. ¿Hay internet?', detalles: [] };
    }

    try { cuerpo = await res.json(); } catch (e) { cuerpo = null; }

    if (!res.ok || !cuerpo || cuerpo.ok !== true) {
      var err = (cuerpo && cuerpo.error) || {};
      /* 401 casi siempre es la sesión de Access vencida: lo más útil que
         podemos decir es "recargá", que dispara el login de nuevo. */
      if (res.status === 401) {
        throw {
          mensaje: 'Tu sesión venció. Recargá la página para volver a entrar.',
          detalles: [], entorno: err.entorno || null
        };
      }
      throw {
        mensaje: err.mensaje || ('El servidor respondió ' + res.status + '.'),
        detalles: err.detalles || [],
        /* El worker lo manda en los 401/503: es la única forma de saber
           en qué entorno estamos cuando la API está cerrada. */
        entorno: err.entorno || null
      };
    }
    return cuerpo.datos;
  }

  /* --------------------------------------------------------- Avisos */

  var timer = null;
  function toast(msg) {
    var t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('toast--on');
    clearTimeout(timer);
    timer = setTimeout(function () { t.classList.remove('toast--on'); }, 2600);
  }

  /* Muestra el error arriba del formulario, con la lista de campos que
     el worker rechazó si la mandó. */
  function mostrarError(contenedor, error) {
    if (error && error.entorno) mostrarEntorno(error.entorno);
    if (!contenedor) return;
    var lista = (error.detalles || []).map(function (d) {
      return '<li>' + esc(d) + '</li>';
    }).join('');
    contenedor.innerHTML =
      '<div class="aviso aviso--mal">' +
        '<p class="aviso__t">No se pudo guardar</p>' +
        '<p>' + esc(error.mensaje) + '</p>' +
        (lista ? '<ul>' + lista + '</ul>' : '') +
      '</div>';
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function limpiarAviso(contenedor) {
    if (contenedor) contenedor.innerHTML = '';
  }

  /* La barra lateral. En pantalla grande está siempre a la vista; en el
     celular se corre fuera de la pantalla y la abre el botón de las tres
     rayas. Qué opción está activa lo marca el HTML de cada página, no
     esto: así se ve bien incluso antes de que cargue el JavaScript. */
  function armarBarra() {
    var barra = el('sidebar');
    var fondo = el('sidebarBackdrop');
    var boton = el('hamburgerBtn');
    if (!barra || !fondo || !boton) return;

    var primera = barra.querySelector('.nav-item');
    var chico = window.matchMedia('(max-width: 900px)');

    /* Mientras la barra tapa la pantalla, lo de atrás no tiene que ser
       navegable con el teclado ni con el lector de pantalla. */
    var atras = [document.querySelector('.main'), document.querySelector('.pagefoot')];
    function bloquearAtras(si) {
      atras.forEach(function (n) {
        if (!n) return;
        if (si) n.setAttribute('inert', ''); else n.removeAttribute('inert');
      });
    }

    function cerrar(devolverFoco) {
      barra.classList.remove('open');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
      boton.setAttribute('data-tooltip', 'Abrir menú');
      bloquearAtras(false);
      if (devolverFoco) boton.focus();
    }

    function abrir() {
      barra.classList.add('open');
      boton.setAttribute('aria-expanded', 'true');
      boton.setAttribute('aria-label', 'Cerrar menú');
      boton.setAttribute('data-tooltip', 'Cerrar menú');
      if (chico.matches) {
        bloquearAtras(true);
        if (primera) primera.focus();
      }
    }

    boton.addEventListener('click', function () {
      if (barra.classList.contains('open')) cerrar(true); else abrir();
    });
    fondo.addEventListener('click', function () { cerrar(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && barra.classList.contains('open')) cerrar(true);
    });
    chico.addEventListener('change', function (e) {
      if (!e.matches) bloquearAtras(false);
    });
  }

  /* Cartel de entorno: si estamos en staging tiene que ser imposible
     creer que estás tocando los datos reales. */
  /* El cartel de entorno. Se pinta de dos fuentes: /api/salud cuando la
     API contesta, y el propio error cuando no. Lo segundo importa más
     que lo primero: publicar sin `--env staging` deja el worker en
     producción, y ahí todo el panel responde 503 — justo cuando saber
     dónde estás parada es lo único que te saca del problema. */
  var entornoPintado = null;

  function mostrarEntorno(entorno) {
    var caja = el('entorno');
    if (!caja || !entorno || entorno === entornoPintado) return;
    entornoPintado = entorno;

    if (entorno === 'produccion') {
      caja.textContent = '⚠ Estás en PRODUCCIÓN · lo que toques acá lo ve el cliente';
      caja.className = 'entorno entorno--prod';
    } else {
      caja.textContent = '⚠ Entorno de prueba (' + entorno + ') · los cambios no afectan a la web real';
      caja.className = 'entorno';
    }
    caja.hidden = false;
  }

  async function pintarEntorno() {
    try {
      var salud = await pedir('/api/salud');
      mostrarEntorno(salud.entorno);
    } catch (e) {
      /* Si la API está cerrada, el entorno viene en el propio error. */
      mostrarEntorno(e && e.entorno);
    }
  }


  document.addEventListener('DOMContentLoaded', function () {
    armarBarra();
    pintarEntorno();
  });

  global.Panel = {
    el: el, esc: esc, plata: plata, pedir: pedir,
    toast: toast, mostrarError: mostrarError, limpiarAviso: limpiarAviso
  };

})(window);
