/* =====================================================================
   AUMÉ · admin/menus/dia.js
   Editor de un día: los 4 tipos de menú, guardar borrador y publicar.
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

  var fecha = new URLSearchParams(location.search).get('fecha') || '';
  var dia = null;

  function bloque(cat, p) {
    p = p || {};
    return '' +
      '<div class="plato" style="--c-cat:' + cat.color + '">' +
        '<p class="plato__t">' + esc(cat.nombre) + '</p>' +
        '<div class="plato__campos">' +
          '<div class="campo">' +
            '<label class="campo__l" for="n-' + cat.id + '">Nombre del plato</label>' +
            '<input class="campo__i" type="text" id="n-' + cat.id + '" maxlength="120"' +
              ' value="' + esc(p.nombre || '') + '" placeholder="Dejalo vacío si ese día no hay">' +
          '</div>' +
          '<div class="campo">' +
            '<label class="campo__l" for="d-' + cat.id + '">Descripción</label>' +
            '<textarea class="campo__ta" id="d-' + cat.id + '" maxlength="300">' +
              esc(p.descripcion || '') + '</textarea>' +
          '</div>' +
          '<div class="campo">' +
            '<label class="campo__l" for="e-' + cat.id + '">Etiquetas <span style="font-weight:400">(separadas por coma)</span></label>' +
            '<input class="campo__i" type="text" id="e-' + cat.id + '" maxlength="160"' +
              ' value="' + esc((p.etiquetas || []).join(', ')) + '" placeholder="Sin TACC, Alto en proteína">' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function pintar(d) {
    dia = d;
    el('cargando').hidden = true;
    el('form').hidden = false;

    el('titulo').textContent =
      d.dia.charAt(0).toUpperCase() + d.dia.slice(1) + ' ' +
      d.fecha.slice(8, 10) + '/' + d.fecha.slice(5, 7) + '/' + d.fecha.slice(0, 4);

    var e = el('estado');
    e.className = 'estado estado--' + d.estado;
    e.textContent = d.estado === 'nuevo' ? 'sin cargar' : d.estado;

    el('subtitulo').textContent = d.estado === 'publicado'
      ? 'Esto es lo que está viendo la clienta ahora.'
      : 'Todavía no lo ve nadie.';

    el('platos').innerHTML = CATS.map(function (c) { return bloque(c, d.platos[c.id]); }).join('');
    el('nota').value = d.nota || '';

    el('btnPublicar').textContent = d.estado === 'publicado' ? 'Volver a publicar' : 'Publicar';
    el('nota2').textContent = d.estado === 'publicado'
      ? 'Si guardás un cambio, sale publicado al toque.'
      : '';
  }

  function armarCuerpo() {
    var platos = {};
    CATS.forEach(function (c) {
      platos[c.id] = {
        nombre: el('n-' + c.id).value,
        descripcion: el('d-' + c.id).value,
        etiquetas: el('e-' + c.id).value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
      };
    });
    return { nota: el('nota').value, platos: platos };
  }

  async function guardar(silencioso) {
    var res = await Panel.pedir('/api/menus/' + encodeURIComponent(fecha),
      { metodo: 'PUT', cuerpo: armarCuerpo() });
    pintar(res);
    if (!silencioso) Panel.toast('Borrador guardado');
    return res;
  }

  async function alGuardar(evento) {
    evento.preventDefault();
    Panel.limpiarAviso(el('aviso'));
    var btn = el('btnGuardar');
    btn.disabled = true;
    try { await guardar(false); }
    catch (e) { Panel.mostrarError(el('aviso'), e); }
    finally { btn.disabled = false; }
  }

  async function alPublicar() {
    Panel.limpiarAviso(el('aviso'));
    var btn = el('btnPublicar');
    btn.disabled = true;
    btn.textContent = 'Publicando…';
    try {
      /* Guardamos primero: si no, se publicaría lo que había antes de los
         cambios que la nutri acaba de escribir en pantalla. */
      await guardar(true);
      pintar(await Panel.pedir('/api/menus/' + encodeURIComponent(fecha) + '/publicar', { metodo: 'POST' }));
      Panel.toast('Publicado ✅ ya se ve en la web');
      el('aviso').innerHTML =
        '<div class="aviso aviso--bien">Publicado. La clienta ya lo está viendo.</div>';
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
      Panel.toast('No se pudo publicar');
    } finally {
      btn.disabled = false;
      if (dia) btn.textContent = dia.estado === 'publicado' ? 'Volver a publicar' : 'Publicar';
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      el('cargando').hidden = true;
      Panel.mostrarError(el('aviso'), { mensaje: 'Falta la fecha en la dirección.', detalles: [] });
      return;
    }
    el('form').addEventListener('submit', alGuardar);
    el('btnPublicar').addEventListener('click', alPublicar);
    try {
      pintar(await Panel.pedir('/api/menus/' + encodeURIComponent(fecha)));
    } catch (e) {
      el('cargando').hidden = true;
      Panel.mostrarError(el('aviso'), e);
    }
  });

})();
