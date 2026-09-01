/* =====================================================================
   AUMÉ · admin/precios/precios.js
   Precios, envíos, packs, plan mensual, productos y puntos de retiro.

   Todo se pinta a partir de lo que devuelve /api/precios: no hay ni un
   tamaño, ni una zona, ni un pack escrito a mano acá. Si mañana se suma
   un tamaño nuevo a la base, esta pantalla lo muestra sola.

   Los precios viajan como texto tal cual se escriben. Quien decide si
   "12.500", "12500" o "gratis" es un importe válido es el servidor: si
   lo hiciera el navegador, un error de tipeo podría guardar un cero y
   publicarse como precio real.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc, plata = Panel.plata;

  var datos = null;     // lo último que devolvió la API
  var sucio = false;

  function marcarSucio() {
    sucio = true;
    el('pista').textContent = 'Tenés cambios sin guardar.';
  }

  /* Un importe vacío significa "todavía sin definir", y eso es distinto
     de cero: la web no lo muestra en vez de mostrarlo gratis. */
  function valor(n) { return (n === null || n === undefined) ? '' : String(n); }

  function campoPrecio(id, etiqueta, val, ayuda) {
    return '<div class="field" id="f-' + esc(id) + '">' +
      (etiqueta ? '<label for="' + esc(id) + '">' + esc(etiqueta) + '</label>' : '') +
      '<div class="input-prefix-wrap"><span class="prefix">$</span>' +
        '<input class="input" type="text" inputmode="numeric" id="' + esc(id) + '" ' +
        'value="' + esc(valor(val)) + '"' + (ayuda ? ' aria-label="' + esc(ayuda) + '"' : '') + '></div>' +
    '</div>';
  }

  /* ---------------------------------------------------------- Pintar */

  function pintar() {
    var d = datos;

    /* --- Vianda por tamaño --- */
    el('viandas').innerHTML = d.tamanos.map(function (t) {
      return campoPrecio('vianda-' + t.id, t.nombre, d.preciosVianda[t.id]);
    }).join('');

    /* --- Zonas de envío --- */
    el('zonas').innerHTML = d.envio.zonas.map(function (z) {
      return '<div class="zone-row"><span class="zone-name">' + esc(z.nombre) + '</span>' +
        campoPrecio('zona-' + z.id, '', z.costo, 'Costo de envío ' + z.nombre) + '</div>';
    }).join('');
    el('iAclaracion').value = d.envio.aclaracion || '';

    /* --- Packs: un grupo por tamaño, una fila por cantidad de días --- */
    el('packs').innerHTML = d.tamanos.map(function (t) {
      var filas = d.packs.opciones.map(function (p) {
        var pr = p.precios[t.id] || {};
        return '<div class="pack-table-row">' +
          '<span class="pack-plan-name">' + esc(p.nombre || ('x' + p.dias + ' días')) + '</span>' +
          campoPrecio('pack-' + p.id + '-' + t.id + '-lista', '', pr.lista, 'Precio de lista') +
          campoPrecio('pack-' + p.id + '-' + t.id + '-efectivo', '', pr.efectivo, 'Precio en efectivo') +
        '</div>';
      }).join('');
      return '<div class="pack-group"><h4 class="pack-group-title">Packs ' + esc(t.nombre) + '</h4>' +
        '<div class="pack-table-head"><span></span><span>Precio</span><span>En efectivo</span></div>' +
        filas + '</div>';
    }).join('');

    /* --- Otros productos --- */
    el('productos').innerHTML = (d.productos || []).map(function (p) {
      return '<div class="zone-row"><div>' +
          '<span class="zone-name">' + esc(p.nombre) + '</span>' +
          (p.detalle ? '<br><span class="zone-hint">' + esc(p.detalle) + '</span>' : '') +
        '</div>' +
        campoPrecio('prod-' + p.id, '', p.activo ? p.precio : '', 'Precio de ' + p.nombre) +
      '</div>';
    }).join('') || '<p class="meta">Todavía no hay otros productos cargados.</p>';

    /* --- Plan mensual --- */
    var pm = d.planMensual || { precios: {} };
    el('iPlanMes').value = pm.mes || '';
    el('iPlanAlmuerzos').value = valor(pm.almuerzos);
    el('iPlanDescuento').value = pm.descuentoEfectivo || '';
    el('iPlanEnvio').checked = !!pm.envioBonificado;
    el('planPrecios').innerHTML =
      '<div class="pack-table-head"><span></span><span>Precio</span><span>En efectivo</span></div>' +
      d.tamanos.map(function (t) {
        var pr = (pm.precios || {})[t.id] || {};
        return '<div class="pack-table-row">' +
          '<span class="pack-plan-name">' + esc(t.nombre) + '</span>' +
          campoPrecio('plan-' + t.id + '-lista', '', pr.lista, 'Plan mensual de lista') +
          campoPrecio('plan-' + t.id + '-efectivo', '', pr.efectivo, 'Plan mensual en efectivo') +
        '</div>';
      }).join('');

    /* --- Puntos de retiro --- */
    el('puntos').innerHTML = (d.puntosRetiro || []).map(filaPunto).join('');

    actualizarPreview();
    el('cuerpo').hidden = false;
  }

  var iconoQuitar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>';

  function filaPunto(pt) {
    pt = pt || { id: '', nombre: '', direccion: '', horarios: [] };
    return '<div class="pickup-row">' +
      '<div class="pickup-fields">' +
        '<div class="field"><label>Nombre</label>' +
          '<input class="input pt-nombre" type="text" maxlength="80" value="' + esc(pt.nombre) + '"></div>' +
        '<div class="field"><label>Dirección</label>' +
          '<input class="input pt-direccion" type="text" maxlength="120" value="' + esc(pt.direccion) + '"></div>' +
        '<div class="field"><label>Horarios</label>' +
          '<input class="input pt-horarios" type="text" maxlength="120" value="' +
          esc((pt.horarios || []).join(' · ')) + '" placeholder="12:00 a 14:00 hs · 17:00 a 21:00 hs"></div>' +
      '</div>' +
      '<input type="hidden" class="pt-id" value="' + esc(pt.id || '') + '">' +
      '<button type="button" class="btn-icon btn-borrar pt-quitar" aria-label="Sacar el punto ' +
        esc(pt.nombre || 'nuevo') + '" data-tooltip="Sacar este punto">' + iconoQuitar + '</button>' +
    '</div>';
  }

  /* El precio del plan es sólo una ayuda visual para ver si el número
     que se está por guardar tiene sentido. El que manda es el que se
     escribe: algunos están redondeados a mano. */
  function actualizarPreview() {
    el('planMesRotulo').textContent = el('iPlanMes').value || '—';
    var lista = el('plan-estandar-lista');
    var n = lista ? Number(String(lista.value).replace(/[^\d]/g, '')) : 0;
    el('planTotal').textContent = n ? plata(n) : 'A definir';
  }

  /* --------------------------------------------------------- Guardar */

  function leer(id) {
    var n = el(id);
    return n ? n.value.trim() : '';
  }

  function cuerpo() {
    var d = datos;
    var preciosVianda = {};
    d.tamanos.forEach(function (t) { preciosVianda[t.id] = leer('vianda-' + t.id); });

    var opciones = d.packs.opciones.map(function (p) {
      var precios = {};
      d.tamanos.forEach(function (t) {
        precios[t.id] = {
          lista: leer('pack-' + p.id + '-' + t.id + '-lista'),
          efectivo: leer('pack-' + p.id + '-' + t.id + '-efectivo')
        };
      });
      return { id: p.id, precios: precios };
    });

    var planPrecios = {};
    d.tamanos.forEach(function (t) {
      planPrecios[t.id] = {
        lista: leer('plan-' + t.id + '-lista'),
        efectivo: leer('plan-' + t.id + '-efectivo')
      };
    });

    var puntos = Array.prototype.map.call(el('puntos').querySelectorAll('.pickup-row'), function (f) {
      return {
        id: f.querySelector('.pt-id').value,
        nombre: f.querySelector('.pt-nombre').value,
        direccion: f.querySelector('.pt-direccion').value,
        /* Los horarios se escriben en una sola línea separados por "·",
           que es como se leen en la web. */
        horarios: f.querySelector('.pt-horarios').value.split('·')
          .map(function (h) { return h.trim(); }).filter(Boolean)
      };
    }).filter(function (p) { return p.nombre.trim(); });

    return {
      preciosVianda: preciosVianda,
      envio: {
        aclaracion: el('iAclaracion').value,
        zonas: d.envio.zonas.map(function (z) { return { id: z.id, costo: leer('zona-' + z.id) }; })
      },
      packs: { opciones: opciones },
      planMensual: {
        mes: el('iPlanMes').value,
        almuerzos: el('iPlanAlmuerzos').value,
        descuentoEfectivo: el('iPlanDescuento').value,
        envioBonificado: el('iPlanEnvio').checked,
        precios: planPrecios
      },
      productos: (d.productos || []).map(function (p) {
        return { id: p.id, nombre: p.nombre, detalle: p.detalle, precio: leer('prod-' + p.id) };
      }),
      puntosRetiro: puntos
    };
  }

  async function guardar(ev) {
    ev.preventDefault();
    Panel.limpiarAviso(el('aviso'));
    el('btnGuardar').disabled = true;
    try {
      var r = await Panel.pedir('/api/precios', { metodo: 'PUT', cuerpo: cuerpo() });
      datos = r.precios;
      sucio = false;
      pintar();
      el('pista').textContent = 'Guardado. Ya se ve en la web.';
      Panel.toast('Precios guardados.');
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
    } finally {
      el('btnGuardar').disabled = false;
    }
  }

  /* --------------------------------------------------------- Cargar */

  async function cargar() {
    Panel.limpiarAviso(el('aviso'));
    el('cargando').hidden = false;
    try {
      datos = await Panel.pedir('/api/precios');
      sucio = false;
      pintar();
      el('pista').textContent = '';
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
    } finally {
      el('cargando').hidden = true;
    }
  }

  function arrancar() {
    el('form').addEventListener('submit', guardar);
    el('form').addEventListener('input', function (ev) {
      marcarSucio();
      if (ev.target.id === 'iPlanMes' || ev.target.id === 'plan-estandar-lista') actualizarPreview();
    });

    el('btnDeshacer').addEventListener('click', function () {
      if (sucio && !confirm('¿Descartar los cambios y volver a lo guardado?')) return;
      cargar();
    });

    el('btnMasPunto').addEventListener('click', function () {
      el('puntos').insertAdjacentHTML('beforeend', filaPunto(null));
      marcarSucio();
      var filas = el('puntos').querySelectorAll('.pickup-row');
      filas[filas.length - 1].querySelector('.pt-nombre').focus();
    });

    el('puntos').addEventListener('click', function (ev) {
      if (!ev.target.closest('.pt-quitar')) return;
      var fila = ev.target.closest('.pickup-row');
      var nombre = fila.querySelector('.pt-nombre').value.trim();
      if (nombre && !confirm('¿Sacar "' + nombre + '" de los puntos de retiro?')) return;
      fila.remove();
      marcarSucio();
    });

    window.addEventListener('beforeunload', function (ev) {
      if (!sucio) return;
      ev.preventDefault();
      ev.returnValue = '';
    });

    cargar();
  }

  document.addEventListener('DOMContentLoaded', arrancar);
})();
