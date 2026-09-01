/* =====================================================================
   AUMÉ · admin/assets/js/inicio.js
   La portada: cómo viene el día, de un vistazo.

   Todo sale de dos llamadas que ya existían — /api/estadisticas para
   los números y /api/pedidos para las últimas filas. No hay endpoint
   nuevo sólo para esta pantalla.

   Las animaciones van sólo acá. En las pantallas de trabajo se entra a
   hacer algo, y algo que se mueve mientras querés tocarlo estorba.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc, plata = Panel.plata;
  var miles = new Intl.NumberFormat('es-AR');
  function num(n) { return miles.format(n || 0); }

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var COLOR = {
    clasico: 'var(--g-clasico)', vegetariano: 'var(--g-vegetariano)',
    proteico: 'var(--g-proteico)', ensalada: 'var(--g-ensalada)', cesar: 'var(--g-cesar)'
  };
  var NOMBRE = {
    clasico: 'Clásico', vegetariano: 'Vegetariano', proteico: 'Proteico',
    ensalada: 'Ensalada', cesar: 'Ensalada César'
  };
  var ESTADOS = { nuevo: 'Nuevo', confirmado: 'Confirmado', entregado: 'Entregado', cancelado: 'Cancelado' };
  var CANAL = { app: 'App', whatsapp: 'WhatsApp' };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function hoyParana() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function restar(fecha, n) {
    var d = new Date(fecha + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function hora(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Cordoba', hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  function nombreDia(fecha) {
    return DIAS[new Date(fecha + 'T12:00:00Z').getUTCDay()];
  }

  /* Cuenta de 0 al número final. El easing arranca rápido y frena: el
     número queda legible casi enseguida y sólo los últimos dígitos se
     acomodan, en vez de ser una ruleta durante medio segundo. */
  function contar(nodo, hasta, formato) {
    if (quieto || !hasta) { nodo.textContent = formato(hasta); return; }
    var ms = 800, desde = null;
    function paso(t) {
      if (desde === null) desde = t;
      var x = Math.min(1, (t - desde) / ms);
      nodo.textContent = formato(Math.round(hasta * (1 - Math.pow(1 - x, 3))));
      if (x < 1) requestAnimationFrame(paso);
      else nodo.textContent = formato(hasta);
    }
    requestAnimationFrame(paso);
  }

  function escalonar(nodos, arranque) {
    if (quieto) return;
    nodos.forEach(function (n, i) {
      n.style.animationDelay = (arranque + i * 70) + 'ms';
      n.classList.add('reveal');
    });
  }

  /* ----------------------------------------------------------- KPIs */

  function delta(hoyV, antesV) {
    if (!antesV) return null;              // sin base, un % no dice nada
    return Math.round((hoyV - antesV) * 100 / antesV);
  }

  function tarjeta(etiqueta, valor, d, ref, cuenta) {
    var clase = d === null ? 'flat' : (d > 0 ? 'up' : (d < 0 ? 'down' : 'flat'));
    var txt = d === null ? 'sin período anterior' : (d > 0 ? '+' : '') + d + '%';
    return '<div class="kpi-card"><p class="kpi-label">' + esc(etiqueta) + '</p>' +
      '<p class="kpi-num num" ' + cuenta + '>0</p>' +
      '<p class="kpi-delta ' + clase + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 4l8 10H4z"/></svg>' +
        '<span>' + esc(txt) + '</span>' +
        (d === null ? '' : '<span class="kpi-delta-ref">' + esc(ref) + '</span>') +
      '</p></div>';
  }

  /* --------------------------------------------------------- Pintar */

  function pintarNumeros(d, previo, ref) {
    var t = d.totales, p = previo && previo.totales;
    el('kpis').innerHTML =
      tarjeta('Pedidos', t.pedidos, delta(t.pedidos, p && p.pedidos), ref, 'data-n="' + t.pedidos + '"') +
      tarjeta('Viandas', t.viandas, delta(t.viandas, p && p.viandas), ref, 'data-n="' + t.viandas + '"') +
      tarjeta('Recaudado', t.plata, delta(t.plata, p && p.plata), ref, 'data-plata="' + t.plata + '"') +
      tarjeta('Ticket promedio', t.ticketPromedio,
        delta(t.ticketPromedio, p && p.ticketPromedio), ref, 'data-plata="' + t.ticketPromedio + '"');

    escalonar(Array.prototype.slice.call(el('kpis').children), 0);
    el('kpis').querySelectorAll('[data-n]').forEach(function (n) {
      contar(n, Number(n.getAttribute('data-n')), num);
    });
    el('kpis').querySelectorAll('[data-plata]').forEach(function (n) {
      contar(n, Number(n.getAttribute('data-plata')), plata);
    });
  }

  function pintarGraficos(d) {
    var dias = d.porDiaPedido || [];
    var tope = Math.max.apply(null, dias.map(function (x) { return x.pedidos; }).concat([1]));
    var columnas = !dias.length
      ? '<p class="meta" style="margin-top:16px">Todavía no hay pedidos en este período.</p>'
      : '<div class="bar-chart" role="list" aria-label="Pedidos por día de la semana">' +
        dias.slice().sort(function (a, b) { return a.n - b.n; }).map(function (x) {
          var alto = Math.max(4, Math.round(x.pedidos * 100 / tope));
          var pico = x.pedidos === tope ? ' is-peak' : '';
          return '<div class="bar-col' + pico + '" role="listitem" tabindex="0" data-tooltip="' +
              esc(x.nombre + ': ' + num(x.pedidos) + ' pedidos' + (pico ? ' (el día que más entra)' : '')) + '">' +
            '<span class="bar-value num">' + num(x.pedidos) + '</span>' +
            '<div class="bar-shape" style="height:' + alto + '%"></div>' +
            '<span class="bar-day">' + esc(x.nombre.slice(0, 3)) + '</span></div>';
        }).join('') + '</div>';

    var totalCat = (d.porTipo || []).reduce(function (a, x) { return a + x.viandas; }, 0);
    var barras = !totalCat
      ? '<p class="meta" style="margin-top:16px">Todavía no hay viandas en este período.</p>'
      : '<div class="hbar-list">' + d.porTipo.map(function (x) {
          var pct = Math.round(x.viandas * 100 / totalCat);
          var color = COLOR[x.id] || 'var(--muted)';
          var nom = NOMBRE[x.id] || x.id;
          return '<div class="hbar-row" tabindex="0" data-tooltip="' +
              esc(nom + ': ' + num(x.viandas) + ' viandas (' + pct + '% del total)') + '">' +
            '<div class="hbar-top"><span class="hbar-name">' +
              '<span class="hbar-dot" style="background:' + color + '"></span>' + esc(nom) +
            '</span><span class="hbar-num num">' + num(x.viandas) + ' · ' + pct + '%</span></div>' +
            '<div class="hbar-track"><div class="hbar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
          '</div>';
        }).join('') + '</div>';

    el('graficos').innerHTML =
      '<div class="card chart-card"><p class="eyebrow">Tendencia</p>' +
        '<h3>Qué día entran los pedidos</h3>' + columnas + '</div>' +
      '<div class="card chart-card"><p class="eyebrow">Categoría</p>' +
        '<h3>Viandas por tipo de menú</h3>' + barras + '</div>';
  }

  function pintarRecientes(d) {
    var lista = (d.pedidos || []).slice(0, 8);
    el('recientes').innerHTML = !lista.length
      ? '<tr class="empty-row"><td colspan="6">Todavía no entró ningún pedido hoy.</td></tr>'
      : lista.map(function (p) {
          var items = (d.items || []).filter(function (i) { return i.pedido_id === p.id; });
          var cats = [];
          items.forEach(function (i) {
            var n = NOMBRE[i.categoria_id] || i.categoria_id;
            if (cats.indexOf(n) < 0) cats.push(n);
          });
          return '<tr>' +
            '<td data-label="Hora">' + esc(hora(p.creado_en)) + '</td>' +
            '<td data-label="Clienta">' + esc(p.cliente_nombre || '—') + '</td>' +
            '<td data-label="Canal"><span class="channel-tag">' + esc(CANAL[p.canal] || p.canal) + '</span></td>' +
            '<td data-label="Viandas">' + num(p.cantidad) +
              (p.cantidad === 1 ? ' vianda' : ' viandas') +
              (cats.length ? ' · ' + esc(cats.join(', ')) : '') + '</td>' +
            '<td data-label="Monto" class="num-col num">' + plata(p.total) + '</td>' +
            '<td data-label="Estado"><span class="badge badge-' + esc(p.estado) + '">' +
              '<span class="badge-dot"></span>' + esc(ESTADOS[p.estado] || p.estado) + '</span></td>' +
          '</tr>';
        }).join('');
  }

  /* --------------------------------------------------------- Cargar */

  var cargando = false;

  async function cargar(rango) {
    if (cargando) return;
    cargando = true;
    Panel.limpiarAviso(el('aviso'));

    var hoy = hoyParana();
    var largo = rango === 'hoy' ? 1 : Number(rango);
    var desde = restar(hoy, largo - 1);
    var antesHasta = restar(desde, 1);
    var antesDesde = restar(antesHasta, largo - 1);
    var ref = rango === 'hoy' ? 'vs. ayer' : 'vs. período anterior';

    try {
      var qs = function (a, b) { return '?desde=' + a + '&hasta=' + b; };
      var r = await Promise.all([
        Panel.pedir('/api/estadisticas' + qs(desde, hoy)),
        Panel.pedir('/api/estadisticas' + qs(antesDesde, antesHasta)).catch(function () { return null; }),
        Panel.pedir('/api/pedidos?rango=dia&fecha=' + hoy).catch(function () { return null; })
      ]);
      pintarNumeros(r[0], r[1], ref);
      pintarGraficos(r[0]);
      if (r[2]) pintarRecientes(r[2]);
    } catch (e) {
      /* La portada tiene que servir para llegar a las otras pantallas
         aunque el worker esté caído, así que el error se muestra pero no
         se tapa el resto. */
      Panel.mostrarError(el('aviso'), e);
      el('kpis').innerHTML = '';
      el('graficos').innerHTML = '';
      el('recientes').innerHTML = '<tr class="empty-row"><td colspan="6">No se pudieron traer los pedidos.</td></tr>';
    } finally {
      cargando = false;
    }
  }

  function arrancar() {
    document.querySelectorAll('.range-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.range-tab').forEach(function (o) {
          var on = o === b;
          o.classList.toggle('active', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cargar(b.getAttribute('data-rango'));
      });
    });

    escalonar(Array.prototype.slice.call(document.querySelectorAll('.modulo')), 120);
    cargar('hoy');
  }

  document.addEventListener('DOMContentLoaded', arrancar);
})();
