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

  /* La "é" minúscula de Glacial Indifference en negrita viene rota de
     fábrica (se ve en "César", acá en la nota de la opción fija): se
     escribe esa sola letra en peso normal, que sí la dibuja bien. Ver
     la misma explicación, más larga, en assets/css/styles.css. */
  function arreglarE(t) {
    return esc(t).replace(/é/g, '<span class="e-arreglada">é<\/span>');
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

  /* Casi todo acá se puede verificar contra los datos del negocio (si
     mañana hay un punto de retiro más, este bloque lo dice solo); las
     últimas dos son la excepción: viandas por día y años de trayectoria
     no salen de contar nada, son datos de marca que se actualizan a
     mano en CFG.marca cada tanto. */
  function pintarCifras() {
    var caja = el('cifras');
    if (!caja) return;

    var marca = CFG.marca || {};
    var cifras = [
      { n: (CFG.categorias || []).length, d: 'menús distintos por día' },
      { n: (CFG.dias || []).length,       d: 'días de la semana' },
      { n: (CFG.tamanos || []).length,    d: 'tamaños de porción' },
      { n: (CFG.puntosRetiro || []).length, d: 'puntos de retiro' }
    ];
    if (marca.viandasPorDia) cifras.push({ n: '+' + marca.viandasPorDia, d: 'viandas por día' });
    if (marca.anios)         cifras.push({ n: '+' + marca.anios,         d: 'años de trayectoria' });

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

    /* El aviso de "se reciben hasta el domingo a las 20:00" es útil
       adentro del pedido, mientras alguien está eligiendo; acá, de
       sólo pasar a mirar el menú, suena a límite/oferta y puede
       confundir. Por eso la landing no lo escribe, aunque el dato
       siga viviendo en MENU.nota para /pedido/. */

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
               '<div class="tipo__foto" data-foto="' + esc(cat.id) + '">' +
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
      fija.innerHTML = 'Además, la <strong>' + arreglarE(CFG.extraFijo.nombre) + '</strong> está ' +
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

  /* El botón que abre WhatsApp con el mensaje ya escrito. Si no hay
     número configurado se oculta, en vez de llevar a ningún lado. */
  function pintarBotonesWhatsapp() {
    var pares = [
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


  /* ---------------------------------------------------- Publicaciones

     Los tips, las recetas y la info nutricional que carga la
     nutricionista desde el panel. Es lo único de la landing que NO tiene
     respaldo en un archivo: si no hay nada publicado o la API no
     contesta, la sección entera no se dibuja. Preferimos que no esté a
     que esté vacía. */

  var TIPOS = {
    tip:       { nombre: 'Tip',              color: 'var(--c-clasico)',     texto: 'var(--c-clasico-dark)' },
    receta:    { nombre: 'Receta',           color: 'var(--c-vegetariano)', texto: 'var(--c-vegetariano-dark)' },
    nutricion: { nombre: 'Info nutricional', color: 'var(--c-proteico)',    texto: 'var(--c-proteico-dark)' }
  };

  function fechaLinda(iso) {
    if (!iso || iso.length < 10) return '';
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var mes = meses[Number(iso.slice(5, 7)) - 1] || '';
    return Number(iso.slice(8, 10)) + ' ' + mes + ' ' + iso.slice(0, 4);
  }

  /* Una tarjeta de publicación. La usan tanto la grilla de "Tips y
     recetas" como el adelanto de la última nota más arriba: es la
     misma tarjeta en los dos lados, sólo cambia dónde aparece. */
  function tarjetaTip(p) {
    var tipo = TIPOS[p.categoria] || TIPOS.tip;
    var cabecera = p.imagen
      ? '<div class="tip__foto"><img src="' + esc(p.imagen) + '" alt="' +
        esc(p.imagenAlt || '') + '" loading="lazy"></div>'
      : '<div class="tip__barra"></div>';

    return '<a class="tip" href="tips/?nota=' + encodeURIComponent(p.id) + '" ' +
             'style="--tip-color:' + tipo.color + ';--tip-color-texto:' + tipo.texto + '">' +
             cabecera +
             '<div class="tip__cuerpo">' +
               '<p class="tip__meta">' +
                 '<span class="tip__tipo">' + esc(tipo.nombre) + '</span>' +
                 '<span class="tip__fecha">' + esc(fechaLinda(p.fecha)) + '</span>' +
               '</p>' +
               '<h3 class="tip__t">' + esc(p.titulo) + '</h3>' +
               (p.copete ? '<p class="tip__d">' + esc(p.copete) + '</p>' : '') +
               '<span class="tip__ir">Leer</span>' +
             '</div>' +
           '</a>';
  }

  function pintarTips(publicaciones) {
    var seccion = el('tips');
    var caja = el('tips-lista');
    if (!seccion || !caja) return;

    if (!publicaciones || !publicaciones.length) {
      seccion.hidden = true;
      return;
    }

    caja.innerHTML = publicaciones.map(tarjetaTip).join('');
    seccion.hidden = false;
  }

  /* Un adelanto de lo último publicado, bien arriba: si alguien quiere
     leerlo no tiene que bajar hasta el final de la página para
     enterarse de que existe. La nota completa sigue viviendo sólo en
     "Tips y recetas"; acá va nada más que esta tarjeta y un link para
     ver el resto. Sin publicaciones, la sección no se dibuja: el lugar
     que hoy explicaba "por qué conviene" queda para cuando haya algo
     concreto para mostrar. */
  function pintarUltimoTip(publicaciones) {
    var seccion = el('conviene');
    var caja = el('ultimoTip');
    if (!seccion || !caja) return;

    if (!publicaciones || !publicaciones.length) {
      seccion.hidden = true;
      return;
    }

    caja.innerHTML = tarjetaTip(publicaciones[0]) +
      '<p class="ultimo-tip__mas"><a href="#tips">Ver todos los tips y recetas</a></p>';
    seccion.hidden = false;
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

  var promesas = Promise.all([
    traer('/api/precios'),
    traer('/api/menus'),
    traer('/api/publicaciones?limite=6')
  ]);

  function iniciar() {
    pintarTodo();
    ponerFotosReales();

    promesas.then(function (r) {
      aplicarPrecios(r[0]);
      aplicarMenu(r[1]);
      pintarTodo();
      /* Las tarjetas se vuelven a dibujar con lo que contestó la API, así
         que las fotos hay que volver a ponerlas: los nodos son nuevos. */
      ponerFotosReales();
      /* Las publicaciones sólo existen en la base, así que se dibujan
         cuando llegan y no en la primera pasada. */
      var publicaciones = r[2] && r[2].publicaciones;
      pintarTips(publicaciones);
      pintarUltimoTip(publicaciones);
    });
  }

  /* ------------------------------------------------- FOTOS DE VERDAD
     Mientras no haya material fotográfico, en assets/img/landing/ viven
     cinco dibujos que ocupan el lugar. Esta función prueba, para cada
     uno, si existe la foto real al lado con el mismo nombre y extensión
     .jpg; si existe, la pone, y si no, deja el dibujo.

     Así se pueden ir agregando las fotos de a una, sin tocar el código:
     alcanza con guardarlas en esa carpeta con estos nombres.

         hero.jpg               la de la portada (apaisada)
         menu-clasico.jpg       una vianda del menú Clásico
         menu-vegetariano.jpg   una del Vegetariano
         menu-proteico.jpg      una del Proteico
         menu-ensalada.jpg      una del Ensaladas
         cocina.jpg             la cocina o el equipo

     Se prueba con un Image() aparte en vez de cambiar el src y esperar
     el error: así, si la foto no está, el navegador nunca muestra un
     ícono de imagen rota. */

  var FOTOS_REALES = {
    hero:        'assets/img/landing/hero.jpg',
    clasico:     'assets/img/landing/menu-clasico.jpg',
    vegetariano: 'assets/img/landing/menu-vegetariano.jpg',
    proteico:    'assets/img/landing/menu-proteico.jpg',
    ensalada:    'assets/img/landing/menu-ensalada.jpg',
    cocina:      'assets/img/landing/cocina.jpg'
  };

  function probarFoto(destino, ruta) {
    var img = destino.querySelector('img');
    if (!img) return;

    var prueba = new Image();
    prueba.onload = function () {
      /* Sólo si cargó de verdad y tiene tamaño: un 404 que devuelve una
         página de error puede disparar onload con 0×0. */
      if (prueba.naturalWidth > 1) img.src = ruta;
    };
    prueba.src = ruta;
  }

  function ponerFotosReales() {
    var cajas = document.querySelectorAll('[data-foto]');
    for (var i = 0; i < cajas.length; i++) {
      var clave = cajas[i].getAttribute('data-foto');
      if (FOTOS_REALES[clave]) probarFoto(cajas[i], FOTOS_REALES[clave]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* Para los tests. pintarTips y pintarUltimoTip van acá porque son lo
     único que depende de la base y no tiene respaldo en un archivo: sin
     exponerlos, la única forma de probar las tarjetas sería levantar
     el worker. */
  global.AUME_LANDING = {
    pintarTodo: pintarTodo,
    pintarTips: pintarTips,
    pintarUltimoTip: pintarUltimoTip
  };

})(window);
