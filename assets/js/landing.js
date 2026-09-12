/* =====================================================================
   AUMÉ · landing.js
   Dibuja la landing con los datos del negocio.

   UN ARCHIVO PARA LAS CUATRO PÁGINAS
   ---------------------------------------------------------------------
   La landing dejó de ser una sola página larga: ahora son la portada,
   el menú, los precios y nosotros. Las cuatro cargan este mismo
   archivo, y cada función dibuja SÓLO si encuentra su caja en la
   página (`if (!caja) return`). Así no hay cuatro archivos que se
   pisen, ni una página que haga cosas de otra.

   Lo de /tips/ no está acá: esa página tiene el suyo, nota.js, porque
   es la única que no tiene respaldo en un archivo de datos.

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

    /* data-limite dice cuántos días entran. Lo usa la portada, que
       muestra un adelanto de tres días; menu.html no lo escribe y ahí
       se dibuja la semana entera. */
    var dias   = CFG.dias || [];
    var limite = parseInt(caja.getAttribute('data-limite') || '', 10);
    if (limite > 0) dias = dias.slice(0, limite);

    caja.innerHTML = dias.map(function (dia) {
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

  /* ------------------------------------------------ Días con vianda
     Los círculos de "cuándo hay vianda", en la portada. Salen de
     CFG.dias, igual que todo lo demás: si mañana se cocina también el
     sábado, el círculo se prende solo y nadie tiene que tocar el HTML.

     Los siete días de la semana están acá porque una semana tiene
     siete: lo que decide cuál se prende es si está en CFG.dias. */
  var SEMANA = [
    { id: 'lunes',     corto: 'Lun', largo: 'Lunes' },
    { id: 'martes',    corto: 'Mar', largo: 'Martes' },
    { id: 'miercoles', corto: 'Mié', largo: 'Miércoles' },
    { id: 'jueves',    corto: 'Jue', largo: 'Jueves' },
    { id: 'viernes',   corto: 'Vie', largo: 'Viernes' },
    { id: 'sabado',    corto: 'Sáb', largo: 'Sábado' },
    { id: 'domingo',   corto: 'Dom', largo: 'Domingo' }
  ];

  function pintarDias() {
    var caja = el('diasv');
    if (!caja) return;

    var hay = {};
    (CFG.dias || []).forEach(function (d) { hay[d.id] = true; });

    caja.innerHTML = SEMANA.map(function (d) {
      var cocina = !!hay[d.id];
      return '<span class="diasv__d' + (cocina ? '' : ' diasv__d--no') + '" ' +
               'role="listitem" ' +
               'title="' + esc(d.largo) + (cocina ? '' : ': no se cocina') + '">' +
               arreglarE(d.corto) +
             '</span>';
    }).join('');
  }

  /* --------------------------------------------------------- Precios
     Las tres tarjetas de precios.html. Ni un número escrito a mano:
     salen de config.js y, cuando contesta, de /api/precios. */
  function pintarPrecios() {
    var caja = el('precios');
    if (!caja) return;

    function tarjeta(titulo, filas, nota) {
      var cuerpo = filas.map(function (f) {
        return '<div class="precio__l">' +
                 '<span>' + arreglarE(f[0]) + '</span>' +
                 '<b>' + esc(f[1]) + '</b>' +
               '</div>';
      }).join('');

      return '<div class="precio">' +
               '<p class="precio__t">' + arreglarE(titulo) + '</p>' +
               cuerpo +
               (nota ? '<p class="precio__n">' + esc(nota) + '</p>' : '') +
             '</div>';
    }

    var precios = CFG.preciosVianda || {};
    var vianda = (CFG.tamanos || []).map(function (t) {
      return [t.nombre + ' · ' + t.gramos, plata(precios[t.id])];
    });

    var zonas = ((CFG.envio && CFG.envio.zonas) || []).map(function (z) {
      return [z.nombre, plata(z.costo)];
    });

    var cuantos = (CFG.puntosRetiro || []).length;
    var retiro = [[cuantos + (cuantos === 1 ? ' punto en Paraná' : ' puntos en Paraná'), 'Sin costo']];

    var html = '';
    if (vianda.length) {
      html += tarjeta('La vianda', vianda,
                      'El mismo precio en los cuatro menús: sólo cambia por tamaño.');
    }
    if (zonas.length) {
      html += tarjeta('El envío · por entrega', zonas,
                      (CFG.envio && CFG.envio.aclaracion) || '');
    }
    html += tarjeta('Retiro', retiro,
                    'En el horario que te sirva. Las direcciones están más abajo.');

    caja.innerHTML = html;
  }

  /* ----------------------------------------------------------- Packs
     Los packs semanales y el plan mensual, con un selector arriba. Los
     importes NO se calculan: van tal cual están publicados, porque
     algunos están redondeados a mano.

     El plan mensual entra en la misma fila que los packs, pero paga
     envío o no según su propio dato: son dos cosas distintas y el
     cartelito lo dice. */
  function opcionesDePack() {
    var packs   = CFG.packs || {};
    var semana  = (CFG.dias || []).length;
    var efectivo = packs.descuentoEfectivo
      ? ' El precio ya tiene el descuento de ' + packs.descuentoEfectivo + ' pagando en efectivo.'
      : '';

    var lista = (packs.opciones || []).slice().sort(function (a, b) {
      return (a.dias || 0) - (b.dias || 0);
    }).map(function (o) {
      /* El pack que cubre todos los días que se cocina es "la semana
         entera"; los otros son días a elección. */
      var entera = semana && o.dias === semana;
      return {
        id: o.id,
        dias: o.dias,
        boton: o.dias + ' días',
        titulo: o.nombre,
        detalle: (entera
                   ? 'La semana completa, con el menú que elijas cada día.'
                   : 'Los días que quieras de la semana, con el menú que elijas cada día.') +
                 efectivo,
        precios: o.precios || {},
        envioBonificado: !!packs.envioBonificado
      };
    });

    var mes = CFG.planMensual;
    if (mes && mes.precios && mes.precios.estandar && mes.precios.estandar.efectivo) {
      lista.push({
        id: 'mensual',
        dias: 0,
        boton: 'Plan mensual',
        titulo: 'Plan mensual' + (mes.mes ? ' · ' + mes.mes : ''),
        detalle: 'Todos los almuerzos del mes resueltos de una vez' +
                 (mes.almuerzos ? ' (' + mes.almuerzos + ' viandas)' : '') +
                 ', al mejor precio por vianda.',
        precios: mes.precios,
        envioBonificado: !!mes.envioBonificado
      });
    }

    return lista;
  }

  function pintarPacks() {
    var caja = el('packs');
    if (!caja) return;

    var opciones = opcionesDePack();
    if (!opciones.length) { caja.innerHTML = ''; return; }

    /* Arranca elegido el pack de más días, que es el que conviene y el
       que la mayoría termina pidiendo. El plan mensual no compite acá:
       es otra cosa y se elige a propósito. */
    var elegido = 0;
    opciones.forEach(function (o, i) {
      if (o.id !== 'mensual' && o.dias > (opciones[elegido].dias || 0)) elegido = i;
    });

    function detalle(o) {
      var filas = (CFG.tamanos || []).map(function (t) {
        var p = o.precios[t.id];
        if (!p || !p.efectivo) return '';
        return '<div class="pack__p">' +
                 '<span class="pack__g">' + esc(t.gramos) + '</span>' +
                 '<b>' + esc(plata(p.efectivo)) + '</b>' +
                 (p.lista && p.lista !== p.efectivo
                   ? '<small>en efectivo · lista ' + esc(plata(p.lista)) + '</small>'
                   : '<small>en efectivo</small>') +
               '</div>';
      }).join('');

      return '<div class="pack__texto">' +
               '<h3 class="pack__t">' + arreglarE(o.titulo) + '</h3>' +
               '<p class="pack__d">' + arreglarE(o.detalle) + '</p>' +
               (o.envioBonificado
                 ? '<span class="pack__envio">Envío bonificado</span>'
                 : '<span class="pack__envio pack__envio--no">El envío se cobra aparte</span>') +
             '</div>' +
             '<div class="pack__precios">' + filas + '</div>';
    }

    caja.innerHTML =
      '<div class="packs__sel" role="tablist" aria-label="Formas de pedir por semana o por mes">' +
        opciones.map(function (o, i) {
          return '<button type="button" role="tab" id="pack-' + esc(o.id) + '" ' +
                   'aria-selected="' + (i === elegido ? 'true' : 'false') + '" ' +
                   'aria-controls="packDetalle">' + arreglarE(o.boton) + '</button>';
        }).join('') +
      '</div>' +
      '<div class="pack" id="packDetalle" role="tabpanel" tabindex="0" ' +
           'aria-labelledby="pack-' + esc(opciones[elegido].id) + '">' +
        detalle(opciones[elegido]) +
      '</div>';

    var botones = caja.querySelectorAll('.packs__sel button');
    var panel   = el('packDetalle');

    for (var i = 0; i < botones.length; i++) {
      (function (boton, o) {
        boton.addEventListener('click', function () {
          for (var j = 0; j < botones.length; j++) {
            botones[j].setAttribute('aria-selected', 'false');
          }
          boton.setAttribute('aria-selected', 'true');
          panel.setAttribute('aria-labelledby', boton.id);
          panel.innerHTML = detalle(o);
        });
      })(botones[i], opciones[i]);
    }
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


  /* Todas estas funciones se van si no encuentran su caja: son las
     mismas cinco páginas con el mismo archivo, y cada una dibuja
     solamente lo que tiene. */
  function pintarTodo() {
    pintarCifras();
    pintarDias();
    pintarSemana();
    pintarTipos();
    pintarPrecios();
    pintarPacks();
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
    traer('/api/menus')
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

  /* Para los tests, y para poder volver a dibujar a mano desde la
     consola si alguna vez hace falta. */
  global.AUME_LANDING = {
    pintarTodo: pintarTodo
  };

})(window);
