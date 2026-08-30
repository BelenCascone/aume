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
        throw { mensaje: 'Tu sesión venció. Recargá la página para volver a entrar.', detalles: [] };
      }
      throw {
        mensaje: err.mensaje || ('El servidor respondió ' + res.status + '.'),
        detalles: err.detalles || []
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

  /* Marca en el menú la pantalla en la que estamos */
  function marcarNav() {
    var aqui = location.pathname.replace(/\/index\.html$/, '/');
    document.querySelectorAll('.cab__a').forEach(function (a) {
      var suya = a.getAttribute('href');
      if (suya && aqui.indexOf(suya) === 0 && suya !== '/admin/') {
        a.setAttribute('aria-current', 'page');
      } else if (suya === '/admin/' && aqui === '/admin/') {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* Cartel de entorno: si estamos en staging tiene que ser imposible
     creer que estás tocando los datos reales. */
  async function pintarEntorno() {
    var caja = el('entorno');
    if (!caja) return;
    try {
      var salud = await pedir('/api/salud');
      if (salud.entorno && salud.entorno !== 'produccion') {
        caja.textContent = '⚠ Entorno de prueba (' + salud.entorno + ') · los cambios no afectan a la web real';
        caja.hidden = false;
      }
    } catch (e) { /* si falla, no es momento de molestar con esto */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    marcarNav();
    pintarEntorno();
  });

  global.Panel = {
    el: el, esc: esc, plata: plata, pedir: pedir,
    toast: toast, mostrarError: mostrarError, limpiarAviso: limpiarAviso
  };

})(window);
