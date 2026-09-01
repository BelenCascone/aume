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
    envio: 'var(--fg)', retiro: 'var(--muted)'
  };

  var NOMBRE = {
    clasico: 'Clásico', vegetariano: 'Vegetariano', proteico: 'Proteico',
    ensalada: 'Ensalada', cesar: 'Ensalada César',
    app: 'Por la web', whatsapp: 'Por WhatsApp',
    envio: 'Envío a domicilio', retiro: 'Retiro en el local',
    estandar: 'Estándar 350gr', xl: 'XL 500gr',
    efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago',
    dentro: 'Dentro de bulevares', fuera: 'Fuera de bulevares',
    /* Los días vienen sin acento desde la base (son ids), pero en
       pantalla se escriben como se escriben. */
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
  };

  function nom(id) { return NOMBRE[id] || id || '—'; }

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
               'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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

  /* La API agrupa por semana ISO ("2026-W37"); para rotular las barras
     hace falta la fecha del lunes. La semana 1 es, por definición, la
     que contiene el 4 de enero. */
  function lunesDe(semanaISO) {
    var p = semanaISO.split('-W');
    var ene4 = new Date(Date.UTC(Number(p[0]), 0, 4));
    var dow = ene4.getUTCDay() || 7;
    var lunes = new Date(ene4);
    lunes.setUTCDate(ene4.getUTCDate() - dow + 1 + (Number(p[1]) - 1) * 7);
    return lunes.toISOString().slice(0, 10);
  }

  function dia(fecha) {
    var p = fecha.split('-');
    return p[2] + ' ' + MESES[Number(p[1]) - 1];
  }

  function fechaLarga(fecha) {
    var p = fecha.split('-');
    return Number(p[2]) + ' de ' + [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ][Number(p[1]) - 1];
  }

  var miles = new Intl.NumberFormat('es-AR');
  function num(n) { return miles.format(n || 0); }
  function pct(parte, total) { return total ? Math.round(parte * 100 / total) : 0; }

  /* --------------------------------------------------------- Piezas */

  function tarjeta(titulo, copete, cuerpo) {
    return '<div class="card">' +
      (copete ? '<p class="eyebrow">' + esc(copete) + '</p>' : '') +
      '<h3 style="font-size:16px">' + esc(titulo) + '</h3>' + cuerpo + '</div>';
  }

  /* Barras horizontales. `filas` = [{id, etiqueta, valor, texto, ayuda}].
     El ancho es sobre el total, no sobre el máximo: así el porcentaje que
     dice el número y el largo de la barra cuentan lo mismo. */
  function barras(filas, total) {
    if (!filas.length) return '<p class="meta" style="margin-top:16px">Todavía no hay datos en este período.</p>';
    return '<div class="hbar-list">' + filas.map(function (f) {
      var p = pct(f.valor, total);
      var color = COLOR[f.id] || 'var(--muted)';
      return '<div class="hbar-row" tabindex="0" data-tooltip="' + esc(f.ayuda || (f.etiqueta + ': ' + f.texto)) + '">' +
        '<div class="hbar-top"><span class="hbar-name">' +
          '<span class="hbar-dot" style="background:' + color + '"></span>' + esc(f.etiqueta) +
        '</span><span class="hbar-num num">' + esc(f.texto) + ' · ' + p + '%</span></div>' +
        '<div class="hbar-track"><div class="hbar-fill" style="width:' + p + '%;background:' + color + '"></div></div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Barras verticales para la evolución semanal. */
  function columnas(semanas) {
    if (!semanas.length) {
      return '<p class="meta" style="margin-top:16px">Todavía no hay semanas cerradas para comparar.</p>';
    }
    var tope = Math.max.apply(null, semanas.map(function (s) { return s.pedidos; })) || 1;
    return '<div class="bar-chart" role="list" aria-label="Pedidos por semana">' +
      semanas.map(function (s) {
        var lunes = lunesDe(s.semana);
        var alto = Math.max(4, Math.round(s.pedidos * 100 / tope));
        var pico = s.pedidos === tope ? ' is-peak' : '';
        var ayuda = 'Semana del ' + fechaLarga(lunes) + ': ' + num(s.pedidos) + ' pedidos' +
          (pico ? ' (la semana con más pedidos)' : '');
        return '<div class="bar-col' + pico + '" role="listitem" tabindex="0" data-tooltip="' + esc(ayuda) + '">' +
          '<span class="bar-value num">' + num(s.pedidos) + '</span>' +
          '<div class="bar-shape" style="height:' + alto + '%"></div>' +
          '<span class="bar-day">' + esc(dia(lunes)) + '</span></div>';
      }).join('') + '</div>';
  }

  function etiquetaCat(id) {
    if (!id) return '<span class="meta">—</span>';
    return '<span class="cat-tag"><span class="hbar-dot" style="background:' +
      (COLOR[id] || 'var(--muted)') + '"></span>' + esc(nom(id)) + '</span>';
  }

  /* Ojo: las celdas se insertan tal cual, porque algunas son HTML (la
     pastilla de categoría). Escapar lo que viene de la base es tarea de
     quien arma las filas — acá todos los nombres y teléfonos pasan por
     esc() antes de llegar. */
  function tabla(columnasDef, filas, vacio) {
    if (!filas.length) {
      return '<div class="card table-wrap"><p class="vacio-tabla">' + esc(vacio) + '</p></div>';
    }
    var cabeza = columnasDef.map(function (c) {
      return '<th' + (c.num ? ' class="num-col"' : '') + '>' + esc(c.titulo) + '</th>';
    }).join('');
    var cuerpo = filas.map(function (f) {
      return '<tr>' + columnasDef.map(function (c, i) {
        return '<td data-label="' + esc(c.titulo) + '"' + (c.num ? ' class="num-col num"' : '') + '>' +
          f[i] + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="card table-wrap"><table class="ds-table"><thead><tr>' + cabeza +
      '</tr></thead><tbody>' + cuerpo + '</tbody></table></div>';
  }

  /* ------------------------------------------------------------ KPIs */

  /* El delta se calcula contra el período inmediatamente anterior, del
     mismo largo. Es una segunda consulta de verdad: preferimos pedir dos
     veces antes que mostrar un porcentaje inventado. */
  function delta(hoyV, antesV) {
    if (antesV === null || antesV === undefined) return null;
    if (!antesV) return null;                 // sin base, un % no significa nada
    return Math.round((hoyV - antesV) * 100 / antesV);
  }

  function tarjetaKpi(etiqueta, valor, d, referencia) {
    var clase = d === null ? 'flat' : (d > 0 ? 'up' : (d < 0 ? 'down' : 'flat'));
    var texto = d === null ? 'sin período anterior para comparar'
                           : (d > 0 ? '+' : '') + d + '%';
    return '<div class="kpi-card">' +
      '<p class="kpi-label">' + esc(etiqueta) + '</p>' +
      '<p class="kpi-num num">' + esc(valor) + '</p>' +
      '<p class="kpi-delta ' + clase + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 4l8 10H4z"/></svg>' +
        '<span>' + esc(texto) + '</span>' +
        (d === null ? '' : '<span class="kpi-delta-ref">' + esc(referencia) + '</span>') +
      '</p></div>';
  }

  /* ---------------------------------------------------------- Pintar */

  function pintar(d, previo) {
    var t = d.totales, p = previo && previo.totales;
    var ref = 'vs. período anterior';

    el('kpis').innerHTML =
      tarjetaKpi('Pedidos', num(t.pedidos), delta(t.pedidos, p && p.pedidos), ref) +
      tarjetaKpi('Viandas', num(t.viandas), delta(t.viandas, p && p.viandas), ref) +
      tarjetaKpi('Recaudado', plata(t.plata), delta(t.plata, p && p.plata), ref) +
      tarjetaKpi('Ticket promedio', plata(t.ticketPromedio),
        delta(t.ticketPromedio, p && p.ticketPromedio), ref);

    /* --- Tendencia: las últimas 6 semanas del período --- */
    var semanas = d.semanas.slice(-6);
    el('secTendencia').innerHTML = tarjeta(
      'Pedidos por semana — últimas ' + semanas.length + (semanas.length === 1 ? ' semana' : ' semanas'),
      'Tendencia', columnas(semanas));

    /* --- Categoría y modo de entrega --- */
    var totalViandas = d.porTipo.reduce(function (a, x) { return a + x.viandas; }, 0);
    var catFilas = d.porTipo.map(function (x) {
      return {
        id: x.id, etiqueta: nom(x.id), valor: x.viandas, texto: num(x.viandas),
        ayuda: nom(x.id) + ': ' + num(x.viandas) + ' viandas (' +
               pct(x.viandas, totalViandas) + '% del total)'
      };
    });

    var totalEntrega = d.entrega.envio.pedidos + d.entrega.retiro.pedidos;
    var entFilas = ['envio', 'retiro'].map(function (k) {
      return {
        id: k, etiqueta: nom(k), valor: d.entrega[k].pedidos, texto: num(d.entrega[k].pedidos),
        ayuda: nom(k) + ': ' + num(d.entrega[k].pedidos) + ' pedidos (' +
               pct(d.entrega[k].pedidos, totalEntrega) + '% del total)'
      };
    }).filter(function (f) { return f.valor > 0; });

    el('desgloses').innerHTML =
      tarjeta('Viandas por categoría', 'Categoría más vendida', barras(catFilas, totalViandas)) +
      tarjeta('Envío vs. retiro en el local', 'Modo de entrega', barras(entFilas, totalEntrega));

    /* --- Canal y día que más se cocina --- */
    var totalCanal = d.porCanal.app.pedidos + d.porCanal.whatsapp.pedidos;
    var canalFilas = ['app', 'whatsapp'].map(function (k) {
      return {
        id: k, etiqueta: nom(k), valor: d.porCanal[k].pedidos, texto: num(d.porCanal[k].pedidos),
        ayuda: nom(k) + ': ' + num(d.porCanal[k].pedidos) + ' pedidos (' +
               pct(d.porCanal[k].pedidos, totalCanal) + '% del total)'
      };
    }).filter(function (f) { return f.valor > 0; });

    var totalDia = d.porDiaEntrega.reduce(function (a, x) { return a + x.viandas; }, 0);
    var diaFilas = d.porDiaEntrega.map(function (x) {
      return {
        id: x.id, etiqueta: nom(x.id), valor: x.viandas, texto: num(x.viandas),
        ayuda: nom(x.id) + ': ' + num(x.viandas) + ' viandas para entregar'
      };
    });

    el('desgloses2').innerHTML =
      tarjeta('Por dónde entran los pedidos', 'Canal', barras(canalFilas, totalCanal)) +
      tarjeta('Qué día se cocina más', 'Cocina', barras(diaFilas, totalDia));

    /* --- Clientes que repiten --- */
    var C = d.clientes;
    var callout = '<div class="stat-callout"><span class="stat-num num">' + C.pctRepiten + '%</span>' +
      '<p class="stat-text">' + num(C.repiten) + ' de ' + num(C.total) +
      ' clientes volvieron a pedir más de una vez en este período. ' +
      'Estos son los que más repiten — vale la pena reconocerles algo.</p></div>';

    el('secFieles').innerHTML =
      '<p class="eyebrow">Fidelización</p>' +
      '<h2 class="h3-like" style="margin-bottom:16px">Los 10 clientes más frecuentes</h2>' +
      callout +
      tabla(
        [{ titulo: 'Cliente' }, { titulo: 'Teléfono' }, { titulo: 'Categoría favorita' },
         { titulo: 'Pedidos', num: true }, { titulo: 'Gastado', num: true }],
        C.top.map(function (c) {
          return [esc(c.nombre || '—'), esc(c.tel), etiquetaCat(c.categoria),
                  num(c.pedidos), plata(c.plata)];
        }),
        'Todavía no hay clientes que hayan pedido más de una vez en este período.');

    /* --- Clientes para reconquistar --- */
    el('secReconquistar').innerHTML =
      '<p class="eyebrow">Reactivación</p>' +
      '<h2 class="h3-like" style="margin-bottom:6px">Los 10 clientes para reconquistar</h2>' +
      '<p class="meta" style="max-width:60ch;margin-bottom:16px">Los que menos pidieron y hace ' +
      'más de dos semanas que no vuelven. Los que compraron hace pocos días no están acá: ' +
      'todavía no se fueron, son clientes nuevos.</p>' +
      tabla(
        [{ titulo: 'Cliente' }, { titulo: 'Teléfono' }, { titulo: 'Categoría favorita' },
         { titulo: 'Pedidos', num: true }, { titulo: 'Sin pedir hace', num: true }],
        C.reconquistar.map(function (c) {
          return [esc(c.nombre || '—'), esc(c.tel), etiquetaCat(c.categoria),
                  num(c.pedidos), num(c.diasSinPedir) + ' días'];
        }),
        'Nadie para reconquistar: todos los clientes del período volvieron hace poco.');

    el('rotulo').textContent = 'Del ' + fechaLarga(d.desde) + ' al ' + fechaLarga(d.hasta);
  }

  /* --------------------------------------------------------- Cargar */

  var cargando = false;

  async function cargar(desde, hasta) {
    if (cargando) return;
    cargando = true;
    Panel.limpiarAviso(el('aviso'));
    el('cargando').hidden = false;

    /* El período anterior es del mismo largo y termina el día antes:
       comparar 28 días contra 7 daría un porcentaje sin sentido. */
    var largo = Math.round(
      (Date.parse(hasta + 'T12:00:00Z') - Date.parse(desde + 'T12:00:00Z')) / 86400000);
    var antesHasta = restar(desde, 1);
    var antesDesde = restar(antesHasta, largo);

    try {
      var qs = function (a, b) { return '?desde=' + a + '&hasta=' + b; };
      var res = await Promise.all([
        Panel.pedir('/api/estadisticas' + qs(desde, hasta)),
        /* Si el período anterior falla, el tablero igual sirve: se
           muestra sin comparación en vez de no mostrarse. */
        Panel.pedir('/api/estadisticas' + qs(antesDesde, antesHasta)).catch(function () { return null; })
      ]);
      pintar(res[0], res[1]);
      el('tablero').hidden = false;
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
      el('tablero').hidden = true;
    } finally {
      el('cargando').hidden = true;
      cargando = false;
    }
  }

  /* --------------------------------------------------------- Filtro */

  function activar(boton) {
    document.querySelectorAll('.range-tab').forEach(function (b) {
      var on = b === boton;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function arrancar() {
    var hoy = hoyParana();

    document.querySelectorAll('.range-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        activar(b);
        var r = b.getAttribute('data-rango');
        var custom = r === 'custom';
        el('filaCustom').classList.toggle('show', custom);
        if (custom) {
          /* Que los campos arranquen con el rango que ya se está viendo. */
          if (!el('fDesde').value) el('fDesde').value = restar(hoy, 27);
          if (!el('fHasta').value) el('fHasta').value = hoy;
          return;
        }
        cargar(restar(hoy, Number(r) - 1), hoy);
      });
    });

    el('btnAplicar').addEventListener('click', function () {
      var a = el('fDesde').value, b = el('fHasta').value;
      if (!a || !b) { Panel.toast('Elegí las dos fechas.'); return; }
      if (a > b) { Panel.toast('La fecha "desde" tiene que ser anterior a "hasta".'); return; }
      cargar(a, b);
    });

    cargar(restar(hoy, 27), hoy);
  }

  document.addEventListener('DOMContentLoaded', arrancar);
})();
