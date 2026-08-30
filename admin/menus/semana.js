/* =====================================================================
   AUMÉ · admin/menus/semana.js
   Carga de una semana completa: los 5 días con sus 4 tipos de menú.

   Es la pantalla principal del módulo, porque es como la nutri arma el
   menú: por semanas, no día por día.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc;

  var CATS = [
    { id: 'clasico',     nombre: 'Clásico',     color: 'var(--c-clasico)' },
    { id: 'vegetariano', nombre: 'Vegetariano', color: 'var(--c-vegetariano)' },
    { id: 'proteico',    nombre: 'Proteico',    color: 'var(--c-proteico)' },
    { id: 'ensalada',    nombre: 'Ensalada',    color: 'var(--c-ensalada)' }
  ];

  var semana = null;

  function sumarDias(fecha, n) {
    var d = new Date(fecha + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /* El lunes de la semana que viene, que es lo que casi siempre se carga */
  function lunesPorDefecto() {
    var hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    var d = new Date(hoy + 'T12:00:00Z').getUTCDay();   // 0 = domingo
    return sumarDias(hoy, d === 0 ? 1 : 8 - d);
  }

  function campoMini(fecha, cat, p) {
    p = p || {};
    var base = fecha + '-' + cat.id;
    return '' +
      '<div class="mini" style="--c-cat:' + cat.color + '">' +
        '<p class="mini__t">' + esc(cat.nombre) + '</p>' +
        '<input class="campo__i" type="text" id="n-' + base + '" maxlength="120"' +
          ' value="' + esc(p.nombre || '') + '" placeholder="Nombre del plato">' +
        '<textarea class="campo__ta" id="d-' + base + '" maxlength="300"' +
          ' placeholder="Descripción">' + esc(p.descripcion || '') + '</textarea>' +
        '<input class="campo__i" type="text" id="e-' + base + '" maxlength="160"' +
          ' value="' + esc((p.etiquetas || []).join(', ')) + '" placeholder="Etiquetas, separadas por coma">' +
      '</div>';
  }

  function jornada(d) {
    return '' +
      '<div class="jornada' + (d.feriado ? ' jornada--feriado' : '') + '" id="j-' + esc(d.fecha) + '">' +
        '<div class="jornada__cab">' +
          '<span class="jornada__t">' + esc(d.dia) + '</span>' +
          '<span class="jornada__f">' + esc(d.fecha.slice(8, 10) + '/' + d.fecha.slice(5, 7)) + '</span>' +
          '<span class="estado estado--' + esc(d.estado) + '">' +
            esc(d.estado === 'nuevo' ? 'sin cargar' : d.estado) + '</span>' +
          '<label class="check jornada__feriado">' +
            '<input type="checkbox" id="f-' + esc(d.fecha) + '" data-feriado="' + esc(d.fecha) + '"' +
              (d.feriado ? ' checked' : '') + '> Feriado' +
          '</label>' +
        '</div>' +
        '<p class="jornada__aviso">Feriado: este día no se cocina. La web lo muestra así y no deja pedirlo.</p>' +
        '<div class="jornada__cuerpo">' +
          '<div class="jornada__grid">' +
            CATS.map(function (c) { return campoMini(d.fecha, c, d.platos[c.id]); }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function pintar(s) {
    semana = s;
    el('cargando').hidden = true;
    el('form').hidden = false;
    el('titulo').textContent = s.semana;
    el('dias').innerHTML = s.dias.map(jornada).join('');
    el('nota').value = s.nota || '';

    var pub = s.dias.filter(function (d) { return d.estado === 'publicado'; }).length;
    var fer = s.dias.filter(function (d) { return d.feriado; }).length;
    el('resumen').textContent = pub + ' de 5 publicados' + (fer ? ' · ' + fer + ' feriado(s)' : '');

    /* El pasado no se edita: publicar un día que ya pasó no le sirve a
       nadie y puede pisar el historial que después miran las
       estadísticas. */
    var pasada = s.hasta < s.hoy;
    el('btnPublicar').disabled = pasada;
    el('nota2').textContent = pasada ? 'Esta semana ya pasó.' : '';
  }

  function armarCuerpo(publicar) {
    var dias = {};
    semana.dias.forEach(function (d) {
      var feriado = el('f-' + d.fecha).checked;
      var platos = {};
      CATS.forEach(function (c) {
        var base = d.fecha + '-' + c.id;
        platos[c.id] = {
          nombre: el('n-' + base).value,
          descripcion: el('d-' + base).value,
          etiquetas: el('e-' + base).value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
        };
      });
      dias[d.dia] = { feriado: feriado, platos: platos };
    });
    return { desde: semana.desde, nota: el('nota').value, dias: dias, publicar: publicar === true };
  }

  async function enviar(publicar) {
    Panel.limpiarAviso(el('aviso'));
    var btn = publicar ? el('btnPublicar') : el('btnGuardar');
    var texto = btn.textContent;
    btn.disabled = true;
    btn.textContent = publicar ? 'Publicando…' : 'Guardando…';
    try {
      pintar(await Panel.pedir('/api/menus/semana', { metodo: 'PUT', cuerpo: armarCuerpo(publicar) }));
      Panel.toast(publicar ? 'Semana publicada ✅' : 'Borrador guardado');
      if (publicar) {
        el('aviso').innerHTML =
          '<div class="aviso aviso--bien">Semana publicada. La clienta ya la está viendo.</div>';
      }
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
    } finally {
      btn.disabled = false;
      btn.textContent = texto;
    }
  }

  async function cargar(desde) {
    el('cargando').hidden = false;
    el('form').hidden = true;
    Panel.limpiarAviso(el('aviso'));
    history.replaceState(null, '', '?desde=' + desde);
    try {
      pintar(await Panel.pedir('/api/menus/semana?desde=' + encodeURIComponent(desde)));
    } catch (e) {
      el('cargando').hidden = true;
      Panel.mostrarError(el('aviso'), e);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('form').addEventListener('submit', function (ev) { ev.preventDefault(); enviar(false); });
    el('btnPublicar').addEventListener('click', function () { enviar(true); });

    /* Marcar feriado esconde los platos de ese día al instante */
    el('dias').addEventListener('change', function (ev) {
      var f = ev.target.getAttribute && ev.target.getAttribute('data-feriado');
      if (!f) return;
      el('j-' + f).classList.toggle('jornada--feriado', ev.target.checked);
    });

    el('btnAnterior').addEventListener('click', function () { cargar(sumarDias(semana.desde, -7)); });
    el('btnSiguiente').addEventListener('click', function () { cargar(sumarDias(semana.desde, 7)); });

    var pedido = new URLSearchParams(location.search).get('desde');
    cargar(/^\d{4}-\d{2}-\d{2}$/.test(pedido || '') ? pedido : lunesPorDefecto());
  });

})();
