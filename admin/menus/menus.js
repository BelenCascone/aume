/* =====================================================================
   AUMÉ · admin/menus/menus.js
   El editor del menú, una semana por pantalla.

   Cómo trabaja la nutri: arma el mes por semanas y marca los feriados.
   Por eso la unidad de esta pantalla es la semana entera y no el día
   suelto — cargar cinco días de a uno era cinco veces el mismo camino.

   Los platos se editan en el lugar: se toca el lápiz, se escribe, y con
   Enter (o al salir del campo) queda. Nada se manda al servidor hasta
   que se toca Guardar o Publicar: así se puede corregir tranquila sin
   que cada tecla dispare una escritura.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc;

  var COLOR = {
    clasico: 'var(--g-clasico)', vegetariano: 'var(--g-vegetariano)',
    proteico: 'var(--g-proteico)', ensalada: 'var(--g-ensalada)'
  };
  var NOMBRE_CAT = {
    clasico: 'Clásico', vegetariano: 'Vegetariano',
    proteico: 'Proteico', ensalada: 'Ensalada'
  };
  var NOMBRE_DIA = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes'
  };
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var semana = null;     // el lunes que se está viendo, 'YYYY-MM-DD'
  var estado = null;     // lo que devolvió la API
  var sucio = false;     // hay cambios sin guardar

  function hoyParana() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function sumar(fecha, n) {
    var d = new Date(fecha + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function lunesDe(fecha) {
    var d = new Date(fecha + 'T12:00:00Z');
    var dow = d.getUTCDay() || 7;         // lunes = 1 … domingo = 7
    return sumar(fecha, 1 - dow);
  }

  function diaMes(fecha) {
    var p = fecha.split('-');
    return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1].slice(0, 3);
  }

  /* --------------------------------------------------------- Pintar */

  var iconoLapiz = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/></svg>';

  function tarjetaDia(d) {
    var cabeza =
      '<div class="day-card-head">' +
        '<div><h3 class="day-name">' + esc(NOMBRE_DIA[d.dia] || d.dia) + '</h3>' +
        '<p class="day-date meta">' + esc(diaMes(d.fecha)) + '</p></div>' +
        '<label class="switch" data-tooltip="' + (d.feriado ? 'Quitar feriado' : 'Marcar como feriado') + '">' +
          '<input type="checkbox" data-feriado="' + esc(d.fecha) + '"' + (d.feriado ? ' checked' : '') +
          ' aria-label="' + (d.feriado ? 'Quitar el feriado de ' : 'Marcar como feriado el ') +
          esc(NOMBRE_DIA[d.dia] || d.dia) + '">' +
          '<span class="switch-track"></span></label>' +
      '</div>';

    if (d.feriado) {
      return '<div class="day-card is-feriado">' + cabeza +
        '<p class="day-feriado-note">Sin servicio · feriado</p></div>';
    }

    var filas = (estado.categorias || []).map(function (cat) {
      var val = (d.platos || {})[cat] || '';
      return '<div class="dish-row">' +
        '<span class="dish-dot" style="background:' + (COLOR[cat] || 'var(--muted)') + '" aria-hidden="true"></span>' +
        '<div class="dish-body"><p class="dish-cat">' + esc(NOMBRE_CAT[cat] || cat) + '</p>' +
          '<p class="dish-name" data-fecha="' + esc(d.fecha) + '" data-cat="' + esc(cat) + '">' +
            (val ? esc(val) : '<span class="meta">Sin definir</span>') + '</p></div>' +
        '<button type="button" class="dish-edit" data-editar="' + esc(d.fecha) + '" data-cat="' + esc(cat) + '" ' +
          'aria-label="Editar el ' + esc(NOMBRE_CAT[cat] || cat) + ' del ' + esc(NOMBRE_DIA[d.dia] || d.dia) + '" ' +
          'data-tooltip="Editar plato">' + iconoLapiz + '</button>' +
      '</div>';
    }).join('');

    return '<div class="day-card">' + cabeza + filas + '</div>';
  }

  function pintar() {
    el('rotuloSemana').textContent = estado.semana;
    el('grillaSemana').innerHTML = estado.dias.map(tarjetaDia).join('');
    el('iNota').value = estado.nota || '';

    /* La semana está publicada si lo están todos los días que tienen
       algo que publicar. Un feriado no cuenta: no hay nada que publicar
       en un día sin servicio. */
    var conServicio = estado.dias.filter(function (d) { return !d.feriado; });
    var publicados = conServicio.filter(function (d) { return d.estado === 'publicado'; });
    var todo = conServicio.length > 0 && publicados.length === conServicio.length;

    var chapa = el('estadoSemana');
    chapa.className = 'badge ' + (todo ? 'badge-publicado' : 'badge-borrador');
    el('estadoSemanaTexto').textContent = todo
      ? 'Publicada · la ve el cliente'
      : (publicados.length ? 'Publicada a medias · ' + publicados.length + ' de ' + conServicio.length + ' días'
                           : 'Borrador · todavía no la ve nadie');

    el('pista').textContent = sucio ? 'Tenés cambios sin guardar.' : '';
    el('btnPublicar').disabled = false;
  }

  /* --------------------------------------------------------- Cargar */

  async function cargar() {
    Panel.limpiarAviso(el('aviso'));
    el('cargando').hidden = false;
    try {
      estado = await Panel.pedir('/api/menus/semana?desde=' + semana);
      sucio = false;
      pintar();
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
      el('grillaSemana').innerHTML = '';
    } finally {
      el('cargando').hidden = true;
    }
  }

  /* -------------------------------------------------------- Guardar */

  function cuerpo(publicar) {
    var dias = {};
    estado.dias.forEach(function (d) {
      dias[d.dia] = { feriado: d.feriado, platos: d.feriado ? {} : (d.platos || {}) };
    });
    return { desde: semana, nota: el('iNota').value, dias: dias, publicar: publicar === true };
  }

  async function guardar(publicar) {
    Panel.limpiarAviso(el('aviso'));
    el('btnBorrador').disabled = true;
    el('btnPublicar').disabled = true;
    try {
      estado = await Panel.pedir('/api/menus/semana', { metodo: 'PUT', cuerpo: cuerpo(publicar) });
      sucio = false;
      pintar();
      Panel.toast(publicar ? 'Semana publicada.' : 'Borrador guardado.');
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
    } finally {
      el('btnBorrador').disabled = false;
      el('btnPublicar').disabled = false;
    }
  }

  /* -------------------------------------------------- Editar un plato */

  function editarPlato(fecha, cat) {
    var p = el('grillaSemana').querySelector(
      '.dish-name[data-fecha="' + fecha + '"][data-cat="' + cat + '"]');
    if (!p || p.dataset.editando === '1') return;

    var dia = estado.dias.filter(function (d) { return d.fecha === fecha; })[0];
    var valor = (dia.platos || {})[cat] || '';

    p.dataset.editando = '1';
    p.innerHTML = '<input class="dish-name-input" type="text" maxlength="120" value="' + esc(valor) + '">';
    var input = p.querySelector('input');
    input.focus();
    input.select();

    function terminar(guardarValor) {
      if (p.dataset.editando !== '1') return;
      p.dataset.editando = '0';
      if (guardarValor) {
        var nuevo = input.value.trim();
        dia.platos = dia.platos || {};
        if (nuevo) dia.platos[cat] = nuevo; else delete dia.platos[cat];
        if (nuevo !== valor) sucio = true;
      }
      pintar();
    }

    input.addEventListener('blur', function () { terminar(true); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); terminar(true); }
      if (ev.key === 'Escape') { ev.preventDefault(); terminar(false); }
    });
  }

  /* -------------------------------------------------------- Eventos */

  function arrancar() {
    semana = lunesDe(hoyParana());

    el('btnSemanaAnterior').addEventListener('click', function () {
      semana = sumar(semana, -7); cargar();
    });
    el('btnSemanaSiguiente').addEventListener('click', function () {
      semana = sumar(semana, 7); cargar();
    });

    el('grillaSemana').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-editar]');
      if (!b) return;
      editarPlato(b.getAttribute('data-editar'), b.getAttribute('data-cat'));
    });

    el('grillaSemana').addEventListener('change', function (ev) {
      var sw = ev.target.closest('[data-feriado]');
      if (!sw) return;
      var fecha = sw.getAttribute('data-feriado');
      estado.dias.forEach(function (d) {
        if (d.fecha !== fecha) return;
        d.feriado = sw.checked;
        /* Marcar feriado borra los platos del día, igual que hace el
           servidor: mostrar "Feriado" y platos al mismo tiempo sería
           mentira. Todavía se puede deshacer sin guardar. */
        if (sw.checked) d.platos = {};
      });
      sucio = true;
      pintar();
    });

    el('iNota').addEventListener('input', function () { sucio = true; el('pista').textContent = 'Tenés cambios sin guardar.'; });
    el('btnBorrador').addEventListener('click', function () { guardar(false); });
    el('btnPublicar').addEventListener('click', function () { guardar(true); });

    /* Salir con cambios sin guardar es la forma más fácil de perder una
       semana entera de trabajo. */
    window.addEventListener('beforeunload', function (ev) {
      if (!sucio) return;
      ev.preventDefault();
      ev.returnValue = '';
    });

    cargar();
  }

  document.addEventListener('DOMContentLoaded', arrancar);
})();
