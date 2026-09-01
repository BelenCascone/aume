/* =====================================================================
   AUMÉ · app.js
   Arranque de la aplicación y conexión de todos los eventos.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG      = global.AUME_CONFIG;
  var Store    = global.AUME.Store;
  var UI       = global.AUME.UI;
  var Checkout = global.AUME.Checkout;

  var el = UI.el;

  /* ------------------------------------------------------- Re-dibujado */

  /* Sólo se dibuja la vista activa: las otras tres se repintan cuando se
     entra en ellas. Con el pedido en la mano, repintar todo en cada toque
     de "+" se nota en un celular modesto. */
  function pintarVista() {
    var modo = Store.estado.modo;
    if (modo === 'dia') {
      UI.pintarTabs();
      UI.pintarDias();
    } else if (modo === 'promo') {
      UI.pintarPacks();
    } else if (modo === 'mensual') {
      UI.pintarPlan();
    } else {
      UI.pintarExtras();
    }
  }

  function pintarTodo() {
    UI.aplicarTema();
    UI.pintarModos();
    pintarVista();
    UI.pintarBarra();
    UI.pintarCarrito();

    /* El resumen del checkout sólo tiene sentido con ítems cargados */
    if (Store.totales().cantidad > 0) Checkout.pintarResumen();
  }

  /* Vuelve a poner el foco en el botón equivalente después de re-dibujar
     (si no, al tocar "+" el foco se pierde y el teclado queda a la deriva) */
  function recuperarFoco(contenedor, btn) {
    if (!btn || document.activeElement !== btn) return null;
    var sel = '[data-accion="' + btn.dataset.accion + '"]' +
              '[data-clave="' + btn.dataset.clave + '"]';
    return function () {
      var nuevo = contenedor.querySelector(sel);
      if (nuevo) nuevo.focus({ preventScroll: true });
    };
  }

  /* ------------------------------------------------- Scroll a secciones
     No dependemos del salto nativo del href="#…": lo hacemos por JS para
     descontar la altura de la barra superior fija y para que funcione
     también con un panel abierto. */

  function desplazarA(nodo) {
    var topbar = document.querySelector('.topbar');
    var alto = topbar ? topbar.offsetHeight : 0;
    var destino = nodo.getBoundingClientRect().top + window.pageYOffset - alto - 12;
    if (destino < 0) destino = 0;

    try {
      window.scrollTo({ top: destino, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, destino);
    }
  }

  /* -------------------------------------------------- Vaciar el pedido
     Confirmación dentro de la página (nada de confirm() nativo: los
     navegadores lo bloquean en varias situaciones y el botón no hacía nada).
     El primer toque arma el botón, el segundo vacía. Se desarma solo. */

  var timerVaciar = null;

  function desarmarVaciar() {
    var b = el('btnVaciar');
    if (!b) return;
    b.dataset.armado = '0';
    b.classList.remove('btn--peligro');
    b.textContent = 'Vaciar pedido';
  }

  function pedirVaciar(btn) {
    if (btn.dataset.armado === '1') {
      clearTimeout(timerVaciar);
      Store.vaciar();
      UI.toast('Pedido vaciado');
      return;
    }

    btn.dataset.armado = '1';
    btn.classList.add('btn--peligro');
    btn.textContent = 'Tocá de nuevo para vaciar';

    clearTimeout(timerVaciar);
    timerVaciar = setTimeout(desarmarVaciar, 4000);
  }

  /* ---------------------------------------------------------- Paneles */

  function irAPanel(id) {
    UI.cerrarPanel();
    setTimeout(function () { UI.abrirPanel(id); }, 310);
  }

  function abrirCheckout() {
    if (!Store.totales().cantidad) {
      UI.toast('Agregá al menos una vianda');
      return;
    }
    Checkout.pintarResumen();
    Checkout.pintarModalidad();
    Checkout.pintarPuntos();
    Checkout.alternarCampos();
    el('planB').hidden = true;
    irAPanel('panelCheckout');
  }

  /* --------------------------------------------------- Sumar / restar
     Todos los botones que agregan algo al pedido llevan data-clave y
     data-accion, se dibujen donde se dibujen. Un solo camino para las
     viandas, las promos, el plan mensual y los productos. */

  function tocarBoton(contenedor, e) {
    var b = e.target.closest('[data-accion][data-clave]');
    if (!b) return null;

    var delta = b.dataset.accion === 'mas' ? 1 : -1;
    var restaurar = recuperarFoco(contenedor, b);

    Store.sumarClave(b.dataset.clave, delta);
    if (restaurar) restaurar();

    return { boton: b, delta: delta };
  }

  /* Aviso corto de qué se agregó, con el nombre que ve la clienta */
  function avisarAgregado(clave) {
    var linea = Store.items().filter(function (it) { return it.clave === clave; })[0];
    if (!linea) return;
    UI.toast(linea.titulo + (linea.detalle ? ' · ' + linea.detalle : '') + ' agregado');
  }

  /* ----------------------------------------------------------- Eventos */

  function conectarEventos() {

    /* --- Modos: por día / promos / mensual / para sumar --- */
    el('modos').addEventListener('click', function (e) {
      var b = e.target.closest('.modo');
      if (!b) return;
      Store.setModo(b.dataset.modo);
      var nuevo = el('modos').querySelector('[data-modo="' + b.dataset.modo + '"]');
      if (nuevo) nuevo.focus({ preventScroll: true });
    });

    /* --- Pestañas de categoría --- */
    el('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (!b) return;
      Store.setCategoria(b.dataset.cat);
      /* Devolvemos el foco a la pestaña recién elegida */
      var nueva = el('tabs').querySelector('[data-cat="' + b.dataset.cat + '"]');
      if (nueva) nueva.focus({ preventScroll: true });
    });

    /* Navegación con flechas entre pestañas (accesibilidad) */
    el('tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var ids = CFG.categorias.map(function (c) { return c.id; });
      var i = ids.indexOf(Store.estado.categoria);
      var j = e.key === 'ArrowRight' ? (i + 1) % ids.length : (i - 1 + ids.length) % ids.length;
      e.preventDefault();
      Store.setCategoria(ids[j]);
      var nueva = el('tabs').querySelector('[data-cat="' + ids[j] + '"]');
      if (nueva) nueva.focus({ preventScroll: true });
    });

    /* --- Sumar / restar desde las tarjetas de día --- */
    el('dias').addEventListener('click', function (e) {
      var r = tocarBoton(el('dias'), e);
      if (r && r.delta > 0) avisarAgregado(r.boton.dataset.clave);
    });

    /* --- Promos semanales y plan mensual --- */
    ['packs', 'planMensual'].forEach(function (id) {
      el(id).addEventListener('click', function (e) {
        var r = tocarBoton(el(id), e);
        if (r && r.delta > 0) avisarAgregado(r.boton.dataset.clave);
      });

      /* El tipo de menú preferido se elige antes de agregar: cambiarlo
         redibuja los botones porque cambia la línea del carrito. */
      el(id).addEventListener('change', function (e) {
        var s = e.target.closest('[data-pref]');
        if (!s) return;
        UI.setPref(s.dataset.pref, s.value);
        pintarVista();
      });
    });

    /* --- Postres, yogures y congelados --- */
    el('extras').addEventListener('click', function (e) {
      var r = tocarBoton(el('extras'), e);
      if (r && r.delta > 0) avisarAgregado(r.boton.dataset.clave);
    });

    /* --- Controles dentro del carrito --- */
    el('carritoContenido').addEventListener('click', function (e) {
      var vaciar = e.target.closest('#btnVaciar');
      if (vaciar) { pedirVaciar(vaciar); return; }
      tocarBoton(el('carritoContenido'), e);
    });

    /* --- Abrir / cerrar paneles --- */
    el('btnVerPedido').addEventListener('click', function () { UI.abrirPanel('panelCarrito'); });
    el('btnIrCheckout').addEventListener('click', abrirCheckout);

    el('velo').addEventListener('click', UI.cerrarPanel);

    document.querySelectorAll('[data-cerrar]').forEach(function (b) {
      b.addEventListener('click', UI.cerrarPanel);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && UI.panelActivo()) UI.cerrarPanel();
    });

    /* Enlaces internos (el logo, "Envíos y puntos de retiro") */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var nodo = id ? document.getElementById(id) : null;
        if (!nodo) return;

        e.preventDefault();

        var habiaPanel = !!UI.panelActivo();
        if (habiaPanel) UI.cerrarPanel();

        /* Si había un panel abierto esperamos a que cierre para desplazar */
        setTimeout(function () { desplazarA(nodo); }, habiaPanel ? 320 : 0);
      });
    });
  }

  /* ------------------------------------------------------------ Arranque */

  function iniciar() {
    /* Aviso en consola si quedaron los datos de ejemplo sin configurar */
    if (CFG.whatsapp === '5493434123456') {
      console.warn('[AUMÉ] Falta configurar el número de WhatsApp real en ' +
                   'assets/js/data/config.js');
    }

    Store.restaurar();

    UI.pintarEstaticos();
    Checkout.montar();
    pintarTodo();

    conectarEventos();

    /* Cada cambio de estado vuelve a dibujar lo que corresponda */
    Store.suscribir(function () {
      pintarTodo();

      /* Si el carrito quedó vacío con el checkout abierto, volvemos atrás */
      if (Store.totales().cantidad === 0 && UI.panelActivo() === 'panelCheckout') {
        UI.cerrarPanel();
        UI.toast('Tu pedido quedó vacío');
      }
    });

    /* PWA: sólo funciona servido por http(s), en file:// se ignora solo */
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin cache offline */ });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})(window);
