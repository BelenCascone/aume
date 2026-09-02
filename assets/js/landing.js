/* =====================================================================
   AUMÉ · landing.js
   Dibuja la landing con los datos del negocio.

   DE DÓNDE SALEN LOS DATOS
   ---------------------------------------------------------------------
   Los mismos dos archivos que usa la pantalla de pedidos —config.js y
   menu.js— y, encima, lo que responda la API:

     · Si /api/precios y /api/menus contestan, manda la base.
     · Si no contestan (worker caído, sin internet), la landing se dibuja
       igual con los archivos, que siguen siendo valores válidos.

   Es el mismo criterio que ya está en assets/js/ui.js: la base es la
   fuente de verdad y los archivos son el respaldo. Por eso nunca se
   vacía nada; sólo se pisa lo que llegó completo.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG  = global.AUME_CONFIG || {};
  var MENU = global.AUME_MENU   || {};

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

  function lista(v) { return Array.isArray(v) && v.length ? v : null; }

  /* ------------------------------------------------------------- API */

  function traer(ruta) {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(ruta, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { return (c && c.ok === true && c.datos) ? c.datos : null; })
      .catch(function () { return null; });
  }

  /* Los precios de la base pisan a config.js, campo por campo. Una
     respuesta incompleta deja lo que había: nada se borra. */
  function aplicarPrecios(d) {
    if (!d) return;

    var categorias = lista(d.categorias);
    if (categorias) CFG.categorias = categorias;

    if (d.extraFijo && d.extraFijo.nombre) CFG.extraFijo = d.extraFijo;

    if (d.envio) {
      var zonas = lista(d.envio.zonas);
      if (zonas) CFG.envio.zonas = zonas;
      if (typeof d.envio.aclaracion === 'string') CFG.envio.aclaracion = d.envio.aclaracion;
    }

    if (d.packs && typeof d.packs.envioBonificado === 'boolean') {
      CFG.packs.envioBonificado = d.packs.envioBonificado;
    }

    var puntos = lista(d.puntosRetiro);
    if (puntos) CFG.puntosRetiro = puntos;

    var dias = lista(d.dias);
    if (dias) CFG.dias = dias;

    if (typeof d.whatsapp === 'string' && d.whatsapp) CFG.whatsapp = d.whatsapp;
  }

  /* El menú de la base pisa al de menu.js sólo si viene con platos: la
     API contesta platos:null cuando todavía no hay ninguna semana
     publicada, y ahí es mejor el menú del archivo que ninguno. */
  function aplicarMenu(d) {
    if (!d || !d.platos) return;
    MENU.platos = d.platos;
    if (d.semana) MENU.semana = d.semana;
    if (typeof d.nota === 'string') MENU.nota = d.nota;
    MENU.feriados = d.feriados || {};
  }

  /* ---------------------------------------------------------- WhatsApp */

  function linkWhatsapp(texto) {
    var num = CFG.whatsapp || '';
    if (!num) return null;
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(texto);
  }

  /* --------------------------------------------------------- Dibujado */

  /* Sólo números que se pueden verificar contra los datos del negocio.
     Si mañana hay un punto de retiro más, este bloque lo dice solo. */
  function pintarCifras() {
    var caja = el('cifras');
    if (!caja) return;

    var cifras = [
      { n: (CFG.categorias || []).length, d: 'menús distintos por día' },
      { n: (CFG.dias || []).length,       d: 'días de la semana' },
      { n: (CFG.tamanos || []).length,    d: 'tamaños de porción' },
      { n: (CFG.puntosRetiro || []).length, d: 'puntos de retiro' }
    ];

    caja.innerHTML = cifras.map(function (c) {
      return '<div class="cifra">' +
               '<p class="cifra__n">' + esc(c.n) + '</p>' +
               '<p class="cifra__d">' + esc(c.d) + '</p>' +
             '</div>';
    }).join('');
  }

  function pintarSemana() {
    var caja = el('semana');
    if (!caja) return;

    var etiqueta = el('semanaLabel');
    if (etiqueta) etiqueta.textContent = MENU.semana || '';

    var nota = el('semanaNota');
    if (nota) nota.textContent = MENU.nota || '';

    var cats     = CFG.categorias || [];
    var platos   = MENU.platos    || {};
    var feriados = MENU.feriados  || {};

    caja.innerHTML = (CFG.dias || []).map(function (dia) {
      var delDia = platos[dia.id] || {};

      if (feriados[dia.id]) {
        return '<article class="dia dia--vacio">' +
                 '<h3 class="dia__t">' + esc(dia.nombre) + '</h3>' +
                 '<div class="dia__lista"><p class="dia__nombre">Feriado: no se cocina.</p></div>' +
               '</article>';
      }

      var filas = cats.map(function (cat) {
        var plato = delDia[cat.id];
        if (!plato || !plato.nombre) return '';
        return '<div class="dia__plato">' +
                 '<span class="dia__punto" style="background:' + esc(cat.color) + '"></span>' +
                 '<div>' +
                   '<p class="dia__cat">' + esc(cat.nombre) + '</p>' +
                   '<p class="dia__nombre">' + esc(plato.nombre) + '</p>' +
                 '</div>' +
               '</div>';
      }).join('');

      if (!filas) {
        return '<article class="dia dia--vacio">' +
                 '<h3 class="dia__t">' + esc(dia.nombre) + '</h3>' +
                 '<div class="dia__lista"><p class="dia__nombre">Todavía no está cargado.</p></div>' +
               '</article>';
      }

      return '<article class="dia">' +
               '<h3 class="dia__t">' + esc(dia.nombre) + '</h3>' +
               '<div class="dia__lista">' + filas + '</div>' +
             '</article>';
    }).join('');
  }

  /* Las ilustraciones son MARCADORES DE LUGAR, no fotos de AUMÉ. Cuando
     llegue el material se reemplazan los archivos de assets/img/landing/
     y no hay que tocar nada más. */
  var FOTO_POR_CATEGORIA = {
    clasico:     'assets/img/landing/menu-clasico.svg',
    vegetariano: 'assets/img/landing/menu-vegetariano.svg',
    proteico:    'assets/img/landing/menu-proteico.svg',
    ensalada:    'assets/img/landing/menu-ensalada.svg'
  };

  function pintarTipos() {
    var caja = el('tipos');
    if (!caja) return;

    caja.innerHTML = (CFG.categorias || []).map(function (cat) {
      var foto = FOTO_POR_CATEGORIA[cat.id] || 'assets/img/landing/menu-clasico.svg';
      return '<article class="tipo" style="--tipo-color:' + esc(cat.color) + '">' +
               '<div class="tipo__foto">' +
                 '<img src="' + esc(foto) + '" alt="" width="800" height="600" loading="lazy">' +
               '</div>' +
               '<div class="tipo__cuerpo">' +
                 '<h3 class="tipo__t">' + esc(cat.nombre) + '</h3>' +
                 '<p class="tipo__d">' + esc(cat.descripcion || '') + '</p>' +
               '</div>' +
             '</article>';
    }).join('');

    var fija = el('fija');
    if (fija && CFG.extraFijo && CFG.extraFijo.nombre) {
      fija.innerHTML = 'Además, la <strong>' + esc(CFG.extraFijo.nombre) + '</strong> está ' +
                       'disponible todos los días, elijas el menú que elijas.';
    }
  }

  function pintarEnvio() {
    var caja = el('envio');
    if (!caja) return;

    var zonas = (CFG.envio && CFG.envio.zonas) || [];
    var filas = zonas.map(function (z) {
      return '<div class="envio__zona">' +
               '<span>' + esc(z.nombre) + '</span>' +
               '<span class="envio__costo">' + esc(plata(z.costo)) + '</span>' +
             '</div>';
    }).join('');

    var html = '<h3 class="envio__t">Envío a domicilio</h3>' +
               '<div class="envio__zonas">' + filas + '</div>';

    if (CFG.envio && CFG.envio.aclaracion) {
      html += '<p class="envio__nota">' + esc(CFG.envio.aclaracion) + '</p>';
    }
    if (CFG.packs && CFG.packs.envioBonificado) {
      html += '<span class="envio__promo">Con una promo semanal, el envío va bonificado</span>';
    }

    caja.innerHTML = html;
  }

  function pintarPuntos() {
    var caja = el('puntos');
    if (!caja) return;

    caja.innerHTML = (CFG.puntosRetiro || []).map(function (p) {
      var hs = (p.horarios || []).map(function (h) {
        return '<span>' + esc(h) + '</span>';
      }).join('');

      return '<article class="punto-l">' +
               '<h4 class="punto-l__t">' + esc(p.nombre) + '</h4>' +
               '<p class="punto-l__dir">' + esc(p.direccion) + '</p>' +
               (hs ? '<div class="punto-l__hs">' + hs + '</div>' : '') +
             '</article>';
    }).join('');
  }

  function pintarPie() {
    var caja = el('pieDatos');
    if (!caja) return;

    var marca = CFG.marca || {};
    var filas = [];

    if (marca.ciudad) filas.push('<p>' + esc(marca.ciudad) + '</p>');
    if (marca.lema)   filas.push('<p>' + esc(marca.lema) + '</p>');

    var wa = linkWhatsapp('Hola AUMÉ, quería hacerles una consulta.');
    if (wa) {
      filas.push('<p><a href="' + esc(wa) + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a></p>');
    }
    if (marca.instagramUrl) {
      filas.push('<p><a href="' + esc(marca.instagramUrl) + '" target="_blank" rel="noopener">' +
                 '@' + esc(marca.instagram || 'aume.viandas') + '</a></p>');
    }

    caja.innerHTML = filas.join('');
  }

  /* Los dos botones que abren WhatsApp con el mensaje ya escrito. Si no
     hay número configurado se ocultan, en vez de llevar a ningún lado. */
  function pintarBotonesWhatsapp() {
    var pares = [
      { id: 'ctaEmpresas', texto: 'Hola AUMÉ, quería una propuesta de viandas para mi equipo de trabajo.' },
      { id: 'ctaWhatsapp', texto: 'Hola AUMÉ, quería hacerles una consulta.' }
    ];

    pares.forEach(function (par) {
      var boton = el(par.id);
      if (!boton) return;
      var url = linkWhatsapp(par.texto);
      if (url) boton.href = url;
      else boton.hidden = true;
    });
  }

  function pintarTodo() {
    pintarCifras();
    pintarSemana();
    pintarTipos();
    pintarEnvio();
    pintarPuntos();
    pintarPie();
    pintarBotonesWhatsapp();
  }

  /* ---------------------------------------------------------- Arranque

     Se dibuja dos veces a propósito: primero con los archivos, para que
     la página se vea completa enseguida, y de nuevo cuando contesta la
     API. Si la API no contesta, la primera pasada ya dejó todo bien. */

  var promesas = Promise.all([traer('/api/precios'), traer('/api/menus')]);

  function iniciar() {
    pintarTodo();

    promesas.then(function (r) {
      aplicarPrecios(r[0]);
      aplicarMenu(r[1]);
      pintarTodo();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* Para los tests */
  global.AUME_LANDING = { pintarTodo: pintarTodo };

})(window);
