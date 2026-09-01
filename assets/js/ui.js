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

  /* Lo que dijo la API sobre esta semana: qué fecha es cada día, cuáles
     son feriado y qué día es hoy. Vacío mientras la API no responda. */
  var semanaApi = { fechas: {}, feriados: {}, hoy: null };

  /* Un día se cierra cuando ya pasó: si hoy es miércoles, el lunes de
     esta semana ya no se puede pedir. La fecha de "hoy" la manda el
     servidor, no el celular: el reloj del cliente puede estar en
     cualquier lado, y de eso depende que se cobre o no una vianda. */
  function estadoDia(diaId) {
    if (semanaApi.feriados[diaId]) return 'feriado';
    var fecha = semanaApi.fechas[diaId];
    if (fecha && semanaApi.hoy && fecha < semanaApi.hoy) return 'pasado';
    return 'abierto';
  }

  /* Tarjeta de un día que no se puede pedir. Sin botones: la única forma
     de que no se sume algo que no se puede entregar es no ofrecerlo. */
  function diaCerrado(d, cabecera, motivo, detalle) {
    return '' +
      '<article class="dia dia--cerrado">' + cabecera +
        '<div class="dia__cuerpo">' +
          '<p class="dia__plato">' + esc(motivo) + '</p>' +
          '<p class="dia__desc">' + esc(detalle) + '</p>' +
        '</div>' +
      '</article>';
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

      var estado = estadoDia(d.id);
      if (estado === 'feriado') {
        return diaCerrado(d, cabecera, 'Feriado',
          'Este día no cocinamos. Volvemos al día siguiente.');
      }
      if (estado === 'pasado') {
        return diaCerrado(d, cabecera, 'Ya pasó',
          'Este día ya no se puede pedir. Elegí uno de los que vienen.');
      }

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

  /* ============================================================ API
     PRECIOS DESDE EL PANEL
     -------------------------------------------------------------------
     Hasta acá, todo lo de arriba lee de assets/js/data/config.js. Ahora
     los precios los edita la nutri desde /admin/precios/ y viven en la
     base, así que los pedimos a /api/precios y los mezclamos ENCIMA de
     la config estática.

     Esa mezcla es a propósito y en ese orden:

     · Si la API responde, manda la base.
     · Si no responde (worker caído, sin internet, la API todavía no
       existe), la web se queda con los valores de config.js y sigue
       funcionando igual. config.js pasa a ser el respaldo, no la fuente
       de verdad.

     Por eso NUNCA se vacía nada: sólo se pisa lo que llegó completo y
     con forma válida. Una respuesta rara deja la web como estaba.
     ================================================================= */

  /* Arrancan apenas carga el script, para no esperar al DOM */
  function traer(ruta) {
    if (typeof fetch !== 'function') return null;
    return fetch(ruta, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { return (c && c.ok === true && c.datos) ? c.datos : null; })
      .catch(function () { return null; });
  }

  var promesaPrecios = traer('/api/precios');
  var promesaMenu    = traer('/api/menus');

  function lista(v) { return Array.isArray(v) && v.length ? v : null; }

  function aplicarPrecios(d) {
    if (!d) return false;
    var cambio = false;

    /* Precio de la vianda: sólo tamaños que ya existen y con número */
    if (d.preciosVianda) {
      Object.keys(CFG.preciosVianda).forEach(function (id) {
        var n = d.preciosVianda[id];
        if (typeof n === 'number' && n >= 0) { CFG.preciosVianda[id] = n; cambio = true; }
      });
    }

    /* Envío por zona: se actualiza el costo de las zonas que ya están.
       No agregamos ni sacamos zonas desde acá: el carrito guardado en el
       celular referencia una zona por id y no queremos invalidarlo. */
    if (d.envio) {
      var zonas = lista(d.envio.zonas);
      if (zonas) {
        zonas.forEach(function (z) {
          var actual = Store.buscarZona(z.id);
          if (actual && typeof z.costo === 'number' && z.costo >= 0) {
            actual.costo = z.costo; cambio = true;
          }
        });
      }
      if (typeof d.envio.aclaracion === 'string' && d.envio.aclaracion) {
        CFG.envio.aclaracion = d.envio.aclaracion; cambio = true;
      }
    }

    /* Estos no los usa el carrito todavía, pero sí los textos de la
       página, así que conviene que salgan de la misma fuente. */
    var packs = d.packs && lista(d.packs.opciones);
    if (packs) { CFG.packs.opciones = packs; cambio = true; }
    if (d.planMensual && d.planMensual.precios) { CFG.planMensual = d.planMensual; cambio = true; }
    /* La API devuelve también los productos sin precio definido, porque
       el panel los necesita para podérselo poner. Acá se filtran: en la
       web no va nada que todavía no tenga precio. */
    var productos = lista(d.productos);
    if (productos) {
      CFG.productos = productos.filter(function (p) { return p.activo !== false; });
      cambio = true;
    }

    return cambio;
  }

  /* Este archivo se carga ANTES que app.js, así que cuando lleguen los
     precios puede que la app todavía no haya arrancado. Esperamos a que
     el DOM esté listo y el Store exista antes de repintar. */
  function cuandoArranco(fn) {
    if (document.readyState !== 'loading' && global.AUME && global.AUME.Store) {
      setTimeout(fn, 0);
      return;
    }
    setTimeout(function () { cuandoArranco(fn); }, 30);
  }

  /* --- Menú de la semana ------------------------------------------
     Lo que la nutri publica desde /admin/menus/ reemplaza a
     assets/js/data/menu.js. Misma regla que con los precios: si no
     llega un menú publicado, se muestra el del archivo. */
  function aplicarMenu(d) {
    /* platos en null = no hay ningún día publicado para esta semana.
       Ojo con no confundirlo con {}: eso sería una semana publicada
       pero sin platos, y tampoco la queremos mostrar. */
    if (!d || !d.platos || !Object.keys(d.platos).length) return false;

    MENU.platos = d.platos;
    if (d.semana) MENU.semana = d.semana;
    if (typeof d.nota === 'string') MENU.nota = d.nota;

    semanaApi = {
      fechas: d.fechas || {},
      feriados: d.feriados || {},
      hoy: d.hoy || null
    };
    return true;
  }

  /* Si cambió el menú, puede que el carrito guardado en el celular tenga
     viandas de platos que ya no existen. store.js limpia eso al
     restaurar, pero para entonces todavía teníamos el menú del archivo.
     Las sacamos ahora, usando el mismo camino que el botón "−". */
  function limpiarCarritoViejo() {
    var Store = global.AUME.Store;
    /* Se van tanto las viandas de platos que ya no existen como las de
       días cerrados: alguien pudo dejar el carrito armado el domingo y
       volver el miércoles. */
    var sobrantes = Store.items().filter(function (it) {
      return !it.plato || estadoDia(it.diaId) !== 'abierto';
    });
    sobrantes.forEach(function (it) {
      Store.sumar(it.diaId, it.catId, it.tamanoId, -it.cantidad);
    });
    return sobrantes.length;
  }

  /* Cuando llegan los datos, repintamos. avisar() hace que app.js
     redibuje todo lo que depende del estado (tarjetas, barra, carrito y
     el resumen del checkout) sin que haya que tocar app.js. */
  function escucharApi() {
    if (!promesaPrecios && !promesaMenu) return;

    /* Esperamos a los dos y repintamos UNA sola vez: si no, la web
       parpadearía dos veces seguidas con datos a medio actualizar. */
    Promise.all([
      promesaPrecios || Promise.resolve(null),
      promesaMenu || Promise.resolve(null)
    ]).then(function (r) {
      var cambio = aplicarPrecios(r[0]);
      var cambioMenu = aplicarMenu(r[1]);
      if (!cambio && !cambioMenu) return;

      cuandoArranco(function () {
        try {
          pintarEstaticos();
          if (cambioMenu) {
            var sacadas = limpiarCarritoViejo();
            if (sacadas) toast('Actualizamos el menú y sacamos lo que ya no se puede pedir');
          }
          global.AUME.Store.avisar();
        } catch (e) { /* si falla el repintado, quedan los datos de los archivos */ }
      });
    });
  }

  /* Arranca solo: no hace falta tocar app.js para engancharlo. */
  escucharApi();

  global.AUME.UI = {
    el: el,
    escucharApi: escucharApi,
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
