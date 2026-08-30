/* =====================================================================
   AUMÉ · ui.js
   Todo lo que dibuja en pantalla: menú, carrito, paneles y avisos.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG   = global.AUME_CONFIG;
  var MENU  = global.AUME_MENU;
  var Store = global.AUME.Store;

  /* ---------------------------------------------------------- Helpers */

  function el(id) { return document.getElementById(id); }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function plural(n, uno, muchos) { return n === 1 ? uno : muchos; }

  /* --------------------------------------------------------- Avisos */

  var toastTimer = null;
  function toast(msg) {
    var t = el('toast');
    t.textContent = msg;
    t.classList.add('toast--on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('toast--on'); }, 2200);
  }

  /* ---------------------------------------------- Paneles (bottom sheet) */

  var panelAbierto = null;
  var focoPrevio = null;

  function abrirPanel(id) {
    var p = el(id);
    if (!p) return;
    focoPrevio = document.activeElement;

    el('velo').hidden = false;
    p.hidden = false;
    /* forzamos reflow para que la transición se vea */
    void p.offsetWidth;
    el('velo').classList.add('velo--on');
    p.classList.add('panel--on');
    document.body.classList.add('sin-scroll');
    panelAbierto = id;

    var foco = p.querySelector('input, select, textarea, button');
    if (foco) setTimeout(function () { foco.focus({ preventScroll: true }); }, 260);
  }

  function cerrarPanel() {
    if (!panelAbierto) return;
    var p = el(panelAbierto);
    p.classList.remove('panel--on');
    el('velo').classList.remove('velo--on');
    document.body.classList.remove('sin-scroll');

    setTimeout(function () {
      p.hidden = true;
      el('velo').hidden = true;
    }, 300);

    panelAbierto = null;
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus({ preventScroll: true });
  }

  /* ------------------------------------------------- Bloques estáticos */

  function pintarEstaticos() {
    el('heroOrigen').textContent = CFG.marca.origen;

    el('semanaLabel').textContent = MENU.semana || '';
    var nota = el('semanaNota');
    if (MENU.nota) { nota.textContent = MENU.nota; } else { nota.hidden = true; }

    el('envioDesc').textContent =
      CFG.envio.zonas.map(function (z) {
        return z.nombre + ': ' + Store.plata(z.costo);
      }).join(' · ') + '. ' + CFG.envio.aclaracion;

    el('envioPromo').textContent =
      '🎉 Los packs semanales llevan el envío bonificado';

    el('puntos').innerHTML = CFG.puntosRetiro.map(function (p) {
      return '' +
        '<div class="punto">' +
          '<p class="punto__n">' + esc(p.nombre) + '</p>' +
          '<p class="punto__d">' + esc(p.direccion) + '</p>' +
          '<p class="punto__h">' +
            p.horarios.map(function (h) { return '<span>' + esc(h) + '</span>'; }).join('') +
          '</p>' +
        '</div>';
    }).join('');

    el('pieDatos').innerHTML =
      esc(CFG.marca.lema) + '<br>' +
      esc(CFG.marca.ciudad) + '<br>' +
      '<a class="pie__a" href="' + esc(CFG.marca.instagramUrl) + '" target="_blank" rel="noopener">@' +
      esc(CFG.marca.instagram) + '</a>';
  }

  /* ----------------------------------------------------------- Tema */

  function aplicarTema() {
    var cat = Store.buscarCategoria(Store.estado.categoria);
    document.body.style.setProperty('--c-activo', cat.color);
    document.body.style.setProperty('--c-activo-suave', cat.colorSuave);
  }

  /* ---------------------------------------------------------- Tabs */

  function pintarTabs() {
    var activa = Store.estado.categoria;

    el('tabs').innerHTML = CFG.categorias.map(function (c) {
      return '' +
        '<button type="button" role="tab" class="tab" data-cat="' + esc(c.id) + '"' +
        ' id="tab-' + esc(c.id) + '" aria-controls="dias"' +
        ' aria-selected="' + (c.id === activa) + '"' +
        ' style="--c-tab:' + c.color + '">' +
          '<span class="tab__punto" aria-hidden="true"></span>' + esc(c.nombre) +
        '</button>';
    }).join('');

    var cat = Store.buscarCategoria(activa);
    el('tabDesc').textContent = cat.descripcion || '';
    el('dias').setAttribute('aria-labelledby', 'tab-' + activa);
  }

  /* ------------------------------------------------------ Días / menú */

  /* Botones de tamaño (o stepper si ya hay unidades) para un día+categoría */
  function controlesTamano(d, catId) {
    return CFG.tamanos.map(function (t) {
      var n = Store.cantidadDe(d.id, catId, t.id);
      var precio = Store.plata(Store.precio(t.id));
      var datos = ' data-dia="' + esc(d.id) + '" data-cat="' + esc(catId) + '"' +
                  ' data-tam="' + esc(t.id) + '"';

      if (n === 0) {
        return '' +
          '<button type="button" class="tamano" data-accion="mas"' + datos +
          ' aria-label="Agregar ' + esc(d.nombre) + ' ' + esc(t.nombre) + ' ' + esc(t.gramos) + '">' +
            '<span class="tamano__t">' + esc(t.nombre) + '</span>' +
            '<span class="tamano__g">' + esc(t.gramos) + '</span>' +
            '<span class="tamano__p">' + precio + '</span>' +
          '</button>';
      }

      return '' +
        '<div class="stepper">' +
          '<button type="button" class="stepper__b" data-accion="menos"' + datos +
          ' aria-label="Quitar una unidad de ' + esc(d.nombre) + ' ' + esc(t.nombre) + '">−</button>' +
          '<span class="stepper__c">' +
            '<span class="stepper__n">' + n + '</span><br>' +
            '<span class="stepper__l">' + esc(t.nombre) + ' · ' + esc(t.gramos) + '</span>' +
          '</span>' +
          '<button type="button" class="stepper__b" data-accion="mas"' + datos +
          ' aria-label="Agregar una unidad de ' + esc(d.nombre) + ' ' + esc(t.nombre) + '">+</button>' +
        '</div>';
    }).join('');
  }

  /* La opción fija va en TODOS los días, mires la categoría que mires */
  function bloqueFijo(d) {
    var f = CFG.extraFijo;
    if (!f) return '';

    return '' +
      '<div class="fijo" style="--c-fijo:' + esc(f.color) + '">' +
        '<p class="fijo__cab">Además, todos los días</p>' +
        '<p class="fijo__t">' + esc(f.nombre) + '</p>' +
        (f.descripcion ? '<p class="fijo__d">' + esc(f.descripcion) + '</p>' : '') +
        '<div class="tamanos">' + controlesTamano(d, f.id) + '</div>' +
      '</div>';
  }

  function pintarDias() {
    var catId = Store.estado.categoria;

    el('dias').innerHTML = CFG.dias.map(function (d) {
      var p = Store.plato(d.id, catId);

      /* Cuenta lo del día completo: la categoría activa y la opción fija */
      var enDia = 0;
      CFG.tamanos.forEach(function (t) {
        enDia += Store.cantidadDe(d.id, catId, t.id);
        if (CFG.extraFijo) enDia += Store.cantidadDe(d.id, CFG.extraFijo.id, t.id);
      });

      var cabecera = '' +
        '<div class="dia__cab">' +
          '<h3 class="dia__nombre">' + esc(d.nombre) + '</h3>' +
          (enDia ? '<span class="dia__n">' + enDia + ' en tu pedido</span>' : '') +
        '</div>';

      if (!p) {
        return '' +
          '<article class="dia">' + cabecera +
            '<div class="dia__cuerpo">' +
              '<p class="dia__vacio">Esta semana no hay opción ' +
              esc(Store.buscarCategoria(catId).nombre.toLowerCase()) + ' para este día.</p>' +
              bloqueFijo(d) +
            '</div>' +
          '</article>';
      }

      var etiquetas = (p.etiquetas && p.etiquetas.length)
        ? '<div class="etiquetas">' + p.etiquetas.map(function (e) {
            return '<span class="etiqueta">' + esc(e) + '</span>';
          }).join('') + '</div>'
        : '';

      return '' +
        '<article class="dia">' + cabecera +
          '<div class="dia__cuerpo">' +
            '<p class="dia__plato">' + esc(p.nombre) + '</p>' +
            (p.descripcion ? '<p class="dia__desc">' + esc(p.descripcion) + '</p>' : '') +
            etiquetas +
            '<div class="tamanos">' + controlesTamano(d, catId) + '</div>' +
            bloqueFijo(d) +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* ------------------------------------------------- Barra inferior */

  function pintarBarra() {
    var t = Store.totales();
    var barra = el('barra');

    el('badgeCarrito').textContent = t.cantidad;

    if (t.cantidad === 0) {
      barra.classList.remove('barra--visible');
      el('espaciador').hidden = true;
      setTimeout(function () {
        if (Store.totales().cantidad === 0) barra.hidden = true;
      }, 300);
      return;
    }

    barra.hidden = false;
    el('espaciador').hidden = false;
    void barra.offsetWidth;
    barra.classList.add('barra--visible');

    el('barraN').textContent = t.cantidad + ' ' + plural(t.cantidad, 'vianda', 'viandas');
    el('barraT').textContent = Store.plata(t.total);

    /* Ya no hay envío bonificado por cantidad de viandas sueltas: sólo lo
       llevan los packs semanales, que se piden aparte. */
    el('progreso').hidden = true;
  }

  /* ------------------------------------------------- Panel carrito */

  function filaTotales(t) {
    var envio, etiquetaEnvio = 'Envío';

    if (t.esRetiro) {
      envio = '<span class="total-fila__gratis">Retiro en punto</span>';
    } else {
      if (t.zona) etiquetaEnvio = 'Envío · ' + t.zona.nombre;
      envio = '<span>' + Store.plata(t.envio) + '</span>';
    }

    return '' +
      '<div class="totales">' +
        '<div class="total-fila"><span>Subtotal (' + t.cantidad + ' ' +
          plural(t.cantidad, 'vianda', 'viandas') + ')</span><span>' + Store.plata(t.subtotal) + '</span></div>' +
        '<div class="total-fila"><span>' + esc(etiquetaEnvio) + '</span>' + envio + '</div>' +
        '<div class="total-fila total-fila--big"><span>Total</span><span>' + Store.plata(t.total) + '</span></div>' +
      '</div>';
  }

  function pintarCarrito() {
    var lista = Store.items();
    var t = Store.totales();
    var cont = el('carritoContenido');

    if (!lista.length) {
      cont.innerHTML = '' +
        '<div class="vacio">' +
          '<div class="vacio__ico" aria-hidden="true">🥗</div>' +
          '<p class="vacio__t">Tu pedido está vacío</p>' +
          '<p class="vacio__d">Elegí tus viandas del menú semanal y aparecerán acá.</p>' +
        '</div>';
      el('carritoPie').hidden = true;
      return;
    }

    var aviso = '';

    cont.innerHTML =
      '<div class="items">' + lista.map(function (it) {
        return '' +
          '<div class="item" style="--c-it:' + esc(it.categoria.color) + '">' +
            '<div class="item__info">' +
              '<p class="item__d">' + esc(it.dia.nombre) + '</p>' +
              '<p class="item__p">' + esc(it.plato ? it.plato.nombre : it.categoria.nombre) + '</p>' +
              '<p class="item__m">' + esc(it.categoria.nombre) + ' · ' + esc(it.tamano.nombre) +
                ' ' + esc(it.tamano.gramos) + ' · ' + Store.plata(it.precio) + ' c/u</p>' +
            '</div>' +
            '<div class="item__ctrl">' +
              '<button type="button" class="item__b" data-accion="menos"' +
                ' data-dia="' + esc(it.diaId) + '" data-cat="' + esc(it.catId) + '"' +
                ' data-tam="' + esc(it.tamanoId) + '" aria-label="Quitar una unidad">−</button>' +
              '<span class="item__n">' + it.cantidad + '</span>' +
              '<button type="button" class="item__b" data-accion="mas"' +
                ' data-dia="' + esc(it.diaId) + '" data-cat="' + esc(it.catId) + '"' +
                ' data-tam="' + esc(it.tamanoId) + '" aria-label="Agregar una unidad">+</button>' +
            '</div>' +
            '<span class="item__sub">' + Store.plata(it.subtotal) + '</span>' +
          '</div>';
      }).join('') + '</div>' +
      filaTotales(t) + aviso +
      '<button type="button" class="btn btn--fantasma btn--bloque btn--vaciar" ' +
      'id="btnVaciar" data-armado="0">Vaciar pedido</button>';

    el('carritoPie').hidden = false;
  }

  /* ------------------------------------------------------------ Export */

  global.AUME.UI = {
    el: el,
    esc: esc,
    plural: plural,
    toast: toast,
    abrirPanel: abrirPanel,
    cerrarPanel: cerrarPanel,
    panelActivo: function () { return panelAbierto; },
    pintarEstaticos: pintarEstaticos,
    aplicarTema: aplicarTema,
    pintarTabs: pintarTabs,
    pintarDias: pintarDias,
    pintarBarra: pintarBarra,
    pintarCarrito: pintarCarrito,
    filaTotales: filaTotales
  };

})(window);
