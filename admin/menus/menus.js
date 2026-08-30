/* =====================================================================
   AUMÉ · admin/menus/menus.js
   Grilla de menús cargados, agrupada por mes.
   Por defecto muestra el mes actual; el selector deja mirar los viejos.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc;

  var NOMBRE_MES = ['enero','febrero','marzo','abril','mayo','junio',
                    'julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function mesLindo(mes) {
    var p = mes.split('-');
    return NOMBRE_MES[parseInt(p[1], 10) - 1] + ' de ' + p[0];
  }

  function mesDeHoy() {
    /* Hora de Paraná, no la del navegador: si la secretaria abre el panel
       desde otro huso, igual tiene que ver el mes correcto. */
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit'
    }).format(new Date()).slice(0, 7);
  }

  function tarjeta(d, hoy) {
    var clase = d.estado === 'publicado' ? 'dia--publicado' : 'dia--borrador';
    if (!d.platos) clase = 'dia--vacio';

    var detalle = d.platos
      ? d.platos + (d.platos === 1 ? ' plato cargado' : ' platos cargados') +
        (d.completo ? '' : ' · falta alguno')
      : 'Sin cargar';

    return '' +
      '<a class="dia ' + clase + '" href="/admin/menus/dia.html?fecha=' + esc(d.fecha) + '">' +
        '<span class="dia__f">' +
          '<span class="dia__d">' + esc(d.dia) + '</span><br>' +
          '<span class="dia__n">' + esc(d.fecha.slice(8, 10) + '/' + d.fecha.slice(5, 7)) + '</span>' +
          (d.fecha === hoy ? ' <span class="dia__hoy">hoy</span>' : '') +
        '</span>' +
        '<span class="dia__p">' + esc(detalle) + '</span>' +
        '<span class="estado estado--' + esc(d.estado) + '">' + esc(d.estado) + '</span>' +
      '</a>';
  }

  function pintar(d) {
    el('cargando').hidden = true;

    /* El selector ofrece los meses que ya tienen algo cargado, más el
       actual, para que siempre se pueda empezar el mes nuevo. */
    var meses = d.meses.map(function (m) { return m.mes; });
    if (meses.indexOf(d.mes) < 0) meses.unshift(d.mes);
    var actual = mesDeHoy();
    if (meses.indexOf(actual) < 0) meses.unshift(actual);
    meses.sort().reverse();

    el('selMes').innerHTML = meses.map(function (m) {
      return '<option value="' + esc(m) + '"' + (m === d.mes ? ' selected' : '') + '>' +
             esc(mesLindo(m)) + '</option>';
    }).join('');

    var pub = d.dias.filter(function (x) { return x.estado === 'publicado'; }).length;
    el('resumenMes').textContent = d.dias.length
      ? d.dias.length + ' días cargados · ' + pub + ' publicados'
      : '';

    el('dias').innerHTML = d.dias.length
      ? d.dias.map(function (x) { return tarjeta(x, d.hoy); }).join('')
      : '<div class="caja"><p class="caja__d" style="margin:0">' +
        'Todavía no hay ningún día cargado en ' + esc(mesLindo(d.mes)) + '. ' +
        'Elegí otro mes o cargá el primero desde la semana que viene.</p></div>';
  }

  async function cargar(mes) {
    el('cargando').hidden = false;
    Panel.limpiarAviso(el('aviso'));
    try {
      pintar(await Panel.pedir('/api/menus/mes/' + encodeURIComponent(mes)));
    } catch (e) {
      el('cargando').hidden = true;
      Panel.mostrarError(el('aviso'), e);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('selMes').addEventListener('change', function () {
      var m = el('selMes').value;
      /* Queda en la URL para poder compartir o recargar sin perder el mes */
      history.replaceState(null, '', '?mes=' + m);
      cargar(m);
    });

    var pedido = new URLSearchParams(location.search).get('mes');
    cargar(/^\d{4}-\d{2}$/.test(pedido || '') ? pedido : mesDeHoy());
  });

})();
