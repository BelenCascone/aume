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
    espiarDias();

    /* El resumen del checkout sólo tiene sentido con ítems cargados */
    if (Store.totales().cantidad > 0) Checkout.pintarResumen();
  }

  /* ------------------------------------------------- Repintado parcial

     Sumar o restar una unidad cambia una línea, no la pantalla. Antes,
     cada toque de "+" volvía a armar con innerHTML los cinco días
     enteros, sus veinte botones y el carrito; en un celular modesto eso
     se siente como un tironcito en cada toque.

     Ahora se cambia sólo el control que cambió, el globito de ese día y
     la barra de abajo. El carrito y el resumen del checkout se
     redibujan únicamente si están a la vista.

     Si el control no está en pantalla —se cambió de vista, llegó un
     menú nuevo desde la API— UI.repintarClave devuelve false y se
     rehace todo como antes: nunca queda una pantalla a medias.       */

  function pintarParcial(clave) {
    if (!UI.repintarClave(clave)) { pintarTodo(); return; }

    UI.pintarBarra();
    if (UI.esLateral('panelCarrito') || UI.panelActivo() === 'panelCarrito') UI.pintarCarrito();
    if (UI.panelActivo() === 'panelCheckout' && Store.totales().cantidad > 0) Checkout.pintarResumen();
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

  /* Alto de todo lo que queda pegado arriba en este momento: la barra
     del logo con los modos y, si se está mirando el menú, la fila de
     las cuatro categorías. Antes sólo se descontaba la primera, así que
     al saltar a una sección el título quedaba tapado por las
     categorías. */
  function topeFijo() {
    var barra = document.querySelector('.topbar');
    var tabs  = document.querySelector('.tabs-wrap');
    var alto  = barra ? barra.offsetHeight : 0;
    if (tabs && tabs.offsetParent !== null) alto += tabs.offsetHeight;
    return alto;
  }

  function desplazarA(nodo, margen) {
    var destino = nodo.getBoundingClientRect().top + window.pageYOffset -
                  topeFijo() - (margen == null ? 12 : margen);
    if (destino < 0) destino = 0;

    try {
      window.scrollTo({ top: destino, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, destino);
    }
  }

  /* Cambiar de menú o de forma de pedir reemplaza toda la lista. Si se
     estaba en la mitad de la página, lo que aparece arriba es el medio
     de una lista nueva —o, peor, el título tapado por la cabecera—.
     Volvemos al principio de lo que se acaba de elegir. Si ya se estaba
     arriba no se toca nada: nadie quiere que la página se le mueva sin
     motivo. */
  function alPrincipio(nodo) {
    if (!nodo) return;
    var y = nodo.getBoundingClientRect().top + window.pageYOffset - topeFijo() - 8;
    if (y < 0) y = 0;
    if (window.pageYOffset <= y + 4) return;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); }
    catch (e) { window.scrollTo(0, y); }
  }

  /* ------------------------------------------- Qué día se está mirando

     Una franja finita justo debajo de la cabecera: la tarjeta que pasa
     por ahí es "el día que se está mirando", y se marca en los accesos
     rápidos. Va con IntersectionObserver y no con un listener de
     scroll: el navegador avisa solo, sin hacer cuentas en cada pixel. */

  var espia = null;

  function espiarDias() {
    if (espia) { espia.disconnect(); espia = null; }
    if (Store.estado.modo !== 'dia' || !('IntersectionObserver' in window)) return;

    var tope = topeFijo();
    var alto = window.innerHeight || 800;
    var abajo = alto - tope - 72;
    if (abajo < 0) abajo = 0;

    espia = new IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (entradas[i].isIntersecting) UI.marcarDiaNav(entradas[i].target.dataset.dia);
      }
    }, { rootMargin: (-tope - 2) + 'px 0px ' + (-abajo) + 'px 0px', threshold: 0 });

    var tarjetas = document.querySelectorAll('#dias .dia[data-dia]');
    for (var j = 0; j < tarjetas.length; j++) espia.observe(tarjetas[j]);
  }

  /* -------------------------------------------------- Vaciar el pedido
     Confirmación dentro de la página (nada de confirm() nativo: los
     navegadores lo bloquean en varias situaciones y el botón no hacía nada).
     El primer toque arma el botón, el segundo vacía. Se desarma solo. */

  var timerVaciar = null;
  var timerMedir = null;

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
    var clave = b.dataset.clave;

    /* Todo lo que necesita el movimiento se mide ANTES de sumar: al
       sumar se repinta la vista entera y este botón deja de existir.
       El color sale del precio del propio botón, que ya viene pintado
       del color del menú (o del de la Ensalada César, o del de los
       productos): así el punto que vuela es siempre el del menú que se
       está pidiendo. */
    var eraCero = delta > 0 && Store.cantidadDeClave(clave) === 0;
    var caja  = delta > 0 ? b.getBoundingClientRect() : null;
    var pinta = b.querySelector('.tamano__p') || b;
    var color = delta > 0 && global.getComputedStyle
      ? global.getComputedStyle(pinta).color : '';

    /* Si esto resta la última unidad, la línea desaparece del carrito:
       hay que guardar cómo se llamaba ANTES de restar, porque después
       Store.items() ya no la tiene más. */
    var lineaAntes = delta < 0
      ? Store.items().filter(function (it) { return it.clave === clave; })[0]
      : null;

    Store.sumarClave(clave, delta);
    if (restaurar) restaurar();

    if (delta > 0) {
      UI.marcarContador(contenedor, clave, eraCero);
      UI.volarAlPedido(caja, color);
    }

    return { boton: b, delta: delta, lineaAntes: lineaAntes };
  }

  /* Aviso corto de qué se agregó, con el nombre que ve el cliente */
  function avisarAgregado(clave) {
    var linea = Store.items().filter(function (it) { return it.clave === clave; })[0];
    if (!linea) return;
    UI.toast(linea.titulo + (linea.detalle ? ' · ' + linea.detalle : '') + ' agregado');
  }

  /* Aviso corto de qué se sacó al tocar "−". Fuera del carrito (acá) no
     hay ningún otro indicio de que algo cambió: a diferencia del panel
     "Mi pedido", donde la línea desaparece a la vista, en el menú, las
     promos o "Para sumar" la tarjeta sigue igual. */
  function avisarQuitado(linea) {
    if (!linea) return;
    UI.toast(linea.titulo + (linea.detalle ? ' · ' + linea.detalle : '') + ' quitado');
  }

  /* --------------------------------------------- Entrar por una dirección

     La landing linkea cada forma de pedir con su propia dirección
     (/pedido/#promos, #mensual, #sumar), para que "Ver las promos" abra
     las promos y no el menú del día. Se lee una sola vez, al arrancar:
     después manda el estado del carrito, como siempre.

     Una dirección desconocida no hace nada: se entra por el menú del día,
     que es lo que pasaba antes de que esto existiera.                     */

  var MODO_POR_DIRECCION = {
    '#menu':    'dia',
    '#promos':  'promo',
    '#mensual': 'mensual',
    '#sumar':   'extras'
  };

  function abrirModoDeLaDireccion() {
    var modo = MODO_POR_DIRECCION[global.location.hash];
    if (modo) Store.setModo(modo);
  }

  /* ----------------------------------------------------------- Eventos */

  function conectarEventos() {

    /* --- Modos: por día / promos / mensual / para sumar --- */
    el('modos').addEventListener('click', function (e) {
      var b = e.target.closest('.modo');
      if (!b) return;
      var cambia = b.dataset.modo !== Store.estado.modo;
      Store.setModo(b.dataset.modo);
      var nuevo = el('modos').querySelector('[data-modo="' + b.dataset.modo + '"]');
      if (nuevo) nuevo.focus({ preventScroll: true });
      if (cambia) alPrincipio(document.querySelector('.vista:not([hidden])'));
    });

    /* --- Accesos rápidos por día --- */
    el('dianav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ir]');
      if (!b) return;
      var tarjeta = document.querySelector('#dias .dia[data-dia="' + b.dataset.ir + '"]');
      if (tarjeta) desplazarA(tarjeta, 8);
    });

    /* --- Pestañas de categoría --- */
    el('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (!b) return;
      var cambia = b.dataset.cat !== Store.estado.categoria;
      Store.setCategoria(b.dataset.cat);
      /* Devolvemos el foco a la pestaña recién elegida */
      var nueva = el('tabs').querySelector('[data-cat="' + b.dataset.cat + '"]');
      if (nueva) nueva.focus({ preventScroll: true });
      if (cambia) alPrincipio(el('dias'));
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
      if (j !== i) alPrincipio(el('dias'));
    });

    /* --- Sumar / restar desde las tarjetas de día --- */
    el('dias').addEventListener('click', function (e) {
      var r = tocarBoton(el('dias'), e);
      if (!r) return;
      if (r.delta > 0) avisarAgregado(r.boton.dataset.clave);
      else avisarQuitado(r.lineaAntes);
    });

    /* --- Promos semanales y plan mensual --- */
    ['packs', 'planMensual'].forEach(function (id) {
      el(id).addEventListener('click', function (e) {
        var r = tocarBoton(el(id), e);
        if (!r) return;
        if (r.delta > 0) avisarAgregado(r.boton.dataset.clave);
        else avisarQuitado(r.lineaAntes);
      });
    });

    /* --- Postres, yogures y congelados --- */
    el('extras').addEventListener('click', function (e) {
      var r = tocarBoton(el('extras'), e);
      if (!r) return;
      if (r.delta > 0) avisarAgregado(r.boton.dataset.clave);
      else avisarQuitado(r.lineaAntes);
    });

    /* --- Controles dentro del carrito --- */
    el('carritoContenido').addEventListener('click', function (e) {
      var vaciar = e.target.closest('#btnVaciar');
      if (vaciar) { pedirVaciar(vaciar); return; }
      tocarBoton(el('carritoContenido'), e);
    });

    /* --- Abrir / cerrar paneles --- */
    /* En celular abre el panel; en escritorio el pedido ya está en la
       columna de la derecha, así que lleva hasta él y lo destaca un
       instante en vez de abrir un panel encima de todo. */
    el('btnVerPedido').addEventListener('click', function () {
      if (!UI.esLateral('panelCarrito')) { UI.abrirPanel('panelCarrito'); return; }
      var lat = el('lateral');
      if (!lat) return;
      try { lat.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* da igual */ }
      lat.classList.remove('lateral--mira');
      void lat.offsetWidth;
      lat.classList.add('lateral--mira');
    });
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

  /* ------------------------------------------- El pedido en escritorio

     En una pantalla ancha, el pedido no tiene por qué esconderse detrás
     de un botón: hay lugar de sobra para tenerlo siempre a la vista,
     al lado del menú. Es el mismo panel de siempre —los mismos ítems,
     los mismos botones, el mismo código—, mudado a la columna de la
     derecha y sin el velo ni el rol de ventana modal, que ahí ya no
     corresponden.

     Al angostar la ventana vuelve a ser el panel que sube desde abajo.
     Nada se duplica: hay un solo carrito en toda la página.          */

  var anchoSobra = window.matchMedia ? window.matchMedia('(min-width:1100px)') : null;

  function acomodarPedido() {
    var p = el('panelCarrito');
    var lat = el('lateral');
    if (!p || !lat) return;

    if (anchoSobra && anchoSobra.matches) {
      if (p.parentNode !== lat) lat.appendChild(p);
      if (UI.panelActivo() === 'panelCarrito') UI.cerrarPanel();
      lat.hidden = false;
      p.hidden = false;
      p.classList.add('panel--lateral');
      p.classList.remove('panel--on');
      p.removeAttribute('role');
      p.removeAttribute('aria-modal');
    } else {
      if (p.parentNode !== document.body) document.body.appendChild(p);
      lat.hidden = true;
      p.classList.remove('panel--lateral');
      p.setAttribute('role', 'dialog');
      p.setAttribute('aria-modal', 'true');
      if (!p.classList.contains('panel--on')) p.hidden = true;
    }
  }

  /* ------------------------------------------------------------ Arranque */

  function iniciar() {
    /* Aviso en consola si quedaron los datos de ejemplo sin configurar */
    if (CFG.whatsapp === '5493434123456') {
      console.warn('[AUMÉ] Falta configurar el número de WhatsApp real en ' +
                   'assets/js/data/config.js');
    }

    Store.restaurar();
    abrirModoDeLaDireccion();

    UI.pintarEstaticos();
    Checkout.montar();
    acomodarPedido();
    pintarTodo();

    conectarEventos();

    if (anchoSobra) {
      var mudar = function () { acomodarPedido(); UI.pintarCarrito(); };
      if (anchoSobra.addEventListener) anchoSobra.addEventListener('change', mudar);
      else if (anchoSobra.addListener) anchoSobra.addListener(mudar);
    }

    /* La franja que decide qué día se está mirando depende del alto de
       la ventana: si gira el celular hay que volver a medirla. */
    window.addEventListener('resize', function () {
      clearTimeout(timerMedir);
      timerMedir = setTimeout(espiarDias, 200);
    }, { passive: true });

    /* Cada cambio de estado vuelve a dibujar lo que corresponda: una
       unidad de más toca dos nodos, todo lo demás rehace la pantalla. */
    Store.suscribir(function (detalle) {
      if (detalle && detalle.tipo === 'cantidad') pintarParcial(detalle.clave);
      else pintarTodo();

      /* Si el carrito quedó vacío con el checkout abierto, volvemos atrás */
      if (Store.totales().cantidad === 0 && UI.panelActivo() === 'panelCheckout') {
        UI.cerrarPanel();
        UI.toast('Tu pedido quedó vacío');
      }
    });

    /* PWA: sólo funciona servido por http(s), en file:// se ignora solo */
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* sin cache offline */ });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})(window);
