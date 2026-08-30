/* =====================================================================
   AUMÉ · admin/estadisticas/estadisticas.js
   El tablero.

   Reglas de los gráficos, para que se puedan leer de verdad:
   · Ninguna barra depende sólo del color: todas llevan nombre y número.
   · Los números van en color de texto, nunca en el color de la serie.
   · Un solo eje por gráfico; nada de dos escalas mezcladas.
   · El color sigue a la categoría, no al puesto: si el Clásico cae al
     tercer lugar, sigue siendo naranja.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc, plata = Panel.plata;

  /* Color por categoría, fijo. Ver el comentario de la paleta en
     admin/assets/css/panel.css: no son los de la marca, son los mismos
     hues corridos hasta que se distinguen entre sí. */
  var COLOR = {
    clasico: 'var(--g-clasico)', vegetariano: 'var(--g-vegetariano)',
    proteico: 'var(--g-proteico)', ensalada: 'var(--g-ensalada)',
    cesar: 'var(--g-cesar)',
    app: 'var(--g-clasico)', whatsapp: 'var(--g-vegetariano)',
    envio: 'var(--g-clasico)', retiro: 'var(--g-ensalada)'
  };

  var NOMBRE = {
    clasico: 'Clásico', vegetariano: 'Vegetariano', proteico: 'Proteico',
    ensalada: 'Ensalada', cesar: 'Ensalada César',
    app: 'Por la web', whatsapp: 'Por WhatsApp',
    envio: 'Envío', retiro: 'Retiro',
    estandar: 'Estándar 350gr', xl: 'XL 500gr',
    efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago',
    dentro: 'Dentro de bulevares', fuera: 'Fuera de bulevares'
  };

  function nom(id) { return NOMBRE[id] || id || '—'; }

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

  /* --------------------------------------------------------- Piezas */

  function caja(titulo, bajada, cuerpo) {
    return '<div class="caja"><h2 class="caja__t">' + esc(titulo) + '</h2>' +
      (bajada ? '<p class="caja__d">' + esc(bajada) + '</p>' : '') + cuerpo + '</div>';
  }

  /* Barras horizontales. `filas` = [{id, etiqueta, valor, sub}].
     El ancho es proporcional al máximo, no al total: comparar entre sí
     es lo que se quiere, y así la barra más alta siempre llena. */
  function barras(filas, color) {
    if (!filas.length) return '<p class="vacio-g">Todavía no hay datos en este período.</p>';
    var max = Math.max.apply(null, filas.map(function (f) { return f.valor; })) || 1;

    return '<div class="gr">' + filas.map(function (f) {
      var pct = Math.round(f.valor * 100 / max);
      var c = color || COLOR[f.id] || 'var(--g-uno)';
      return '' +
        '<div class="gr__f" title="' + esc(f.etiqueta) + ': ' + esc(String(f.valor)) +
          (f.sub ? ' · ' + esc(f.sub) : '') + '">' +
          '<span class="gr__e">' + esc(f.etiqueta) + '</span>' +
          '<span class="gr__p"><span class="gr__b" style="width:' + pct + '%;background:' + c + '"></span></span>' +
          '<span class="gr__v">' + esc(String(f.valor)) +
            (f.sub ? ' <span class="gr__s">' + esc(f.sub) + '</span>' : '') + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  /* Columnas para la evolución en el tiempo */
  function columnas(items) {
    if (!items.length) return '<p class="vacio-g">Todavía no hay datos en este período.</p>';
    var max = Math.max.apply(null, items.map(function (i) { return i.valor; })) || 1;

    return '<div class="cols">' + items.map(function (i) {
      return '<div class="col" title="' + esc(i.etiqueta) + ': ' + esc(String(i.valor)) +
             (i.sub ? ' · ' + esc(i.sub) : '') + '">' +
        '<span class="col__v">' + esc(String(i.valor)) + '</span>' +
        '<span class="col__b" style="height:' + Math.max(2, Math.round(i.valor * 100 / max)) + '%"></span>' +
      '</div>';
    }).join('') + '</div>' +
    '<div class="cols-pie">' + items.map(function (i) {
      return '<span>' + esc(i.corta) + '</span>';
    }).join('') + '</div>';
  }

  /* ---------------------------------------------------------- Pintar */

  function pintar(d) {
    var T = d.totales;

    /* --- Números grandes --- */
    var delta = '';
    if (d.crecimiento && d.crecimiento.pctPedidos !== null) {
      var c = d.crecimiento.pctPedidos;
      delta = '<p class="kpi__pie"><span class="kpi__delta--' + (c >= 0 ? 'sube' : 'baja') + '">' +
        (c >= 0 ? '▲ +' : '▼ ') + c + '%</span> vs. la semana anterior</p>';
    }

    el('kpis').innerHTML =
      '<div class="kpi"><p class="kpi__n">' + T.pedidos + '</p>' +
        '<p class="kpi__l">Pedidos</p>' + delta + '</div>' +
      '<div class="kpi"><p class="kpi__n">' + T.viandas + '</p>' +
        '<p class="kpi__l">Viandas</p>' +
        '<p class="kpi__pie">' + T.viandasPorPedido + ' por pedido</p></div>' +
      '<div class="kpi"><p class="kpi__n">' + plata(T.plata) + '</p>' +
        '<p class="kpi__l">Recaudado</p>' +
        '<p class="kpi__pie">' + plata(T.envios) + ' son envíos</p></div>' +
      '<div class="kpi"><p class="kpi__n">' + plata(T.ticketPromedio) + '</p>' +
        '<p class="kpi__l">Ticket promedio</p></div>';

    var P = [];

    /* --- Menú más pedido --- */
    P.push(caja('Menú más pedido', 'Cuántas viandas de cada tipo se vendieron.',
      barras(d.porTipo.map(function (x) {
        return { id: x.id, etiqueta: nom(x.id), valor: x.viandas, sub: plata(x.plata) };
      }))));

    /* --- Canal: la pregunta de si la web sirve --- */
    var totalCanal = d.porCanal.app.pedidos + d.porCanal.whatsapp.pedidos;
    P.push(caja('De dónde entran los pedidos',
      totalCanal
        ? Math.round(d.porCanal.app.pedidos * 100 / totalCanal) + '% entra solo por la web.'
        : '',
      barras([
        { id: 'app', etiqueta: nom('app'), valor: d.porCanal.app.pedidos, sub: plata(d.porCanal.app.plata) },
        { id: 'whatsapp', etiqueta: nom('whatsapp'), valor: d.porCanal.whatsapp.pedidos, sub: plata(d.porCanal.whatsapp.plata) }
      ].filter(function (x) { return totalCanal > 0; }))));

    /* --- Evolución --- */
    P.push(caja('Semana a semana', 'Pedidos por semana.',
      columnas(d.semanas.map(function (s) {
        return {
          etiqueta: 'Semana ' + s.semana, corta: s.semana.slice(6),
          valor: s.pedidos, sub: plata(s.plata)
        };
      }))));

    /* --- Qué día cocinar más --- */
    P.push(caja('Qué día se cocina más', 'Viandas pedidas para cada día.',
      barras(d.porDiaEntrega.map(function (x) {
        return { id: x.id, etiqueta: nom(x.id), valor: x.viandas };
      }), 'var(--g-uno)')));

    /* --- Cuándo entran --- */
    P.push(caja('Qué día entran los pedidos', 'El día en que la clienta hace el pedido.',
      barras(d.porDiaPedido.map(function (x) {
        return { id: x.nombre, etiqueta: x.nombre, valor: x.pedidos };
      }), 'var(--g-uno)')));

    /* --- Entrega --- */
    P.push(caja('Envío o retiro', 'Para saber si conviene reforzar el reparto.',
      barras([
        { id: 'envio', etiqueta: nom('envio'), valor: d.entrega.envio.pedidos, sub: plata(d.entrega.envio.plata) },
        { id: 'retiro', etiqueta: nom('retiro'), valor: d.entrega.retiro.pedidos, sub: plata(d.entrega.retiro.plata) }
      ].filter(function () { return T.pedidos > 0; }))));

    /* --- Tamaño --- */
    P.push(caja('Tamaño de la vianda', '',
      barras(d.porTamano.map(function (x) {
        return { id: x.id, etiqueta: nom(x.id), valor: x.viandas, sub: plata(x.plata) };
      }), 'var(--g-uno)')));

    /* --- Pagos --- */
    P.push(caja('Cómo pagan', '',
      barras(d.pagos.map(function (x) {
        return { id: x.id, etiqueta: nom(x.id), valor: x.pedidos, sub: plata(x.plata) };
      }), 'var(--g-uno)')));

    /* --- Clientas que repiten --- */
    var C = d.clientas;
    var tabla = C.top.length
      ? '<table class="tabla"><thead><tr><th>Clienta</th><th>Teléfono</th><th>Pedidos</th></tr></thead><tbody>' +
        C.top.map(function (c) {
          return '<tr><td>' + esc(c.nombre) + '</td><td>' + esc(c.tel) +
                 '</td><td>' + c.pedidos + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="vacio-g">Todavía no hay clientas que hayan pedido más de una vez.</p>';

    P.push(caja('Clientas que repiten',
      C.total
        ? C.repiten + ' de ' + C.total + ' clientas volvieron a pedir (' + C.pctRepiten + '%). ' +
          'Se reconocen por el teléfono, así que cuenta aunque escriban el nombre distinto.'
        : '',
      tabla));

    el('paneles').innerHTML = P.join('');
    el('cargando').hidden = true;
    el('tablero').hidden = false;
  }

  /* ----------------------------------------------------------- Datos */

  async function cargar() {
    el('cargando').hidden = false;
    Panel.limpiarAviso(el('aviso'));
    try {
      pintar(await Panel.pedir('/api/estadisticas?desde=' + el('fDesde').value +
                               '&hasta=' + el('fHasta').value));
    } catch (e) {
      el('cargando').hidden = true;
      el('tablero').hidden = true;
      Panel.mostrarError(el('aviso'), e);
    }
  }

  function rango(dias, boton) {
    var hasta = hoyParana();
    el('fHasta').value = hasta;
    el('fDesde').value = restar(hasta, dias - 1);
    ['r7', 'r28', 'r90'].forEach(function (id) {
      el(id).setAttribute('aria-pressed', String(id === boton));
    });
    cargar();
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('r7').addEventListener('click', function () { rango(7, 'r7'); });
    el('r28').addEventListener('click', function () { rango(28, 'r28'); });
    el('r90').addEventListener('click', function () { rango(90, 'r90'); });

    /* Elegir fechas a mano deja de resaltar los atajos: ya no es
       ninguno de ellos. */
    ['fDesde', 'fHasta'].forEach(function (id) {
      el(id).addEventListener('change', function () {
        ['r7', 'r28', 'r90'].forEach(function (b) { el(b).setAttribute('aria-pressed', 'false'); });
        cargar();
      });
    });

    rango(28, 'r28');
  });

})();
