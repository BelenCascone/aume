/* =====================================================================
   AUMÉ · admin/precios/precios.js
   Pantalla de precios: lee de /api/precios, deja editar y guarda.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc;
  var datos = null;      /* lo último que confirmó el servidor */

  /* Los importes se escriben como números pelados. Aceptamos que la
     persona escriba "9.000" o "$ 9.000" y nos quedamos con los dígitos:
     nadie tiene que aprender un formato para cargar un precio. */
  function aNumero(txt) {
    var limpio = String(txt == null ? '' : txt).replace(/[^\d]/g, '');
    return limpio === '' ? null : parseInt(limpio, 10);
  }

  function campoPlata(id, etiqueta, valor, ayuda) {
    return '' +
      '<div class="campo" id="c-' + esc(id) + '">' +
        '<label class="campo__l" for="' + esc(id) + '">' + esc(etiqueta) + '</label>' +
        '<div class="plata">' +
          '<input class="campo__i" type="text" inputmode="numeric" id="' + esc(id) + '"' +
          ' value="' + (valor == null ? '' : valor) + '" maxlength="9">' +
        '</div>' +
        (ayuda ? '<p class="campo__ayuda">' + esc(ayuda) + '</p>' : '') +
        '<p class="campo__e">Poné un número entero, sin centavos.</p>' +
      '</div>';
  }

  /* ---------------------------------------------------------- Pintar */

  function pintar(d) {
    el('viandas').innerHTML = d.tamanos.map(function (t) {
      return campoPlata('vianda-' + t.id, t.nombre + ' (' + t.gramos + ')',
        d.preciosVianda[t.id]);
    }).join('');

    el('zonas').innerHTML = d.envio.zonas.map(function (z) {
      return campoPlata('zona-' + z.id, z.nombre, z.costo);
    }).join('');

    el('envioAclaracion').value = d.envio.aclaracion || '';

    el('packs').innerHTML = d.packs.opciones.map(function (p) {
      return '' +
        '<div style="margin-bottom:16px">' +
          '<p class="campo__l" style="margin-bottom:8px">' + esc(p.nombre) + '</p>' +
          '<div class="grilla">' +
            d.tamanos.map(function (t) {
              var pr = p.precios[t.id] || {};
              return campoPlata('pack-' + p.id + '-' + t.id + '-lista', t.nombre + ' · lista', pr.lista) +
                     campoPlata('pack-' + p.id + '-' + t.id + '-efectivo', t.nombre + ' · efectivo', pr.efectivo);
            }).join('') +
          '</div>' +
        '</div>';
    }).join('');

    var pm = d.planMensual || { precios: {} };
    el('planMes').value = pm.mes || '';
    el('planAlmuerzos').value = pm.almuerzos == null ? '' : pm.almuerzos;
    el('planDescuento').value = pm.descuentoEfectivo || '';
    el('planEnvio').checked = !!pm.envioBonificado;

    el('planPrecios').innerHTML = '<div class="grilla">' + d.tamanos.map(function (t) {
      var pr = (pm.precios && pm.precios[t.id]) || {};
      return campoPlata('plan-' + t.id + '-lista', t.nombre + ' · lista', pr.lista) +
             campoPlata('plan-' + t.id + '-efectivo', t.nombre + ' · efectivo', pr.efectivo);
    }).join('') + '</div>';

    el('cargando').hidden = true;
    el('form').hidden = false;
    el('nota').textContent = 'Vianda estándar: ' + Panel.plata(d.preciosVianda.estandar || 0);
  }

  /* ----------------------------------------------------------- Leer */

  function armarCuerpo(d) {
    var cuerpo = {
      preciosVianda: {},
      envio: { zonas: [], aclaracion: el('envioAclaracion').value },
      packs: { opciones: [] },
      planMensual: {
        mes: el('planMes').value,
        almuerzos: aNumero(el('planAlmuerzos').value),
        descuentoEfectivo: el('planDescuento').value,
        envioBonificado: el('planEnvio').checked,
        precios: {}
      }
    };

    d.tamanos.forEach(function (t) {
      cuerpo.preciosVianda[t.id] = aNumero(el('vianda-' + t.id).value);
      cuerpo.planMensual.precios[t.id] = {
        lista: aNumero(el('plan-' + t.id + '-lista').value),
        efectivo: aNumero(el('plan-' + t.id + '-efectivo').value)
      };
    });

    d.envio.zonas.forEach(function (z) {
      cuerpo.envio.zonas.push({ id: z.id, costo: aNumero(el('zona-' + z.id).value) });
    });

    d.packs.opciones.forEach(function (p) {
      var precios = {};
      d.tamanos.forEach(function (t) {
        precios[t.id] = {
          lista: aNumero(el('pack-' + p.id + '-' + t.id + '-lista').value),
          efectivo: aNumero(el('pack-' + p.id + '-' + t.id + '-efectivo').value)
        };
      });
      cuerpo.packs.opciones.push({ id: p.id, precios: precios });
    });

    return cuerpo;
  }

  /* Lo único obligatorio es el precio de la vianda y el del envío: sin
     eso la web no puede cobrar. Los packs y el plan pueden quedar
     vacíos, que es como se marca "todavía no publicado". */
  function validar(d) {
    var malos = [];
    function revisar(id, obligatorio) {
      var campo = el('c-' + id);
      var valor = aNumero(el(id).value);
      var mal = obligatorio ? valor === null : false;
      if (campo) campo.classList.toggle('campo--mal', mal);
      if (mal) malos.push(id);
    }
    d.tamanos.forEach(function (t) { revisar('vianda-' + t.id, true); });
    d.envio.zonas.forEach(function (z) { revisar('zona-' + z.id, true); });
    return malos;
  }

  /* --------------------------------------------------------- Acciones */

  async function cargar() {
    try {
      datos = await Panel.pedir('/api/precios');
      pintar(datos);
    } catch (e) {
      el('cargando').hidden = true;
      Panel.mostrarError(el('aviso'), e);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (!datos) return;

    Panel.limpiarAviso(el('aviso'));

    var malos = validar(datos);
    if (malos.length) {
      var primero = el(malos[0]);
      primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primero.focus({ preventScroll: true });
      Panel.toast('Faltan precios marcados en rojo');
      return;
    }

    var btn = el('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      var res = await Panel.pedir('/api/precios', { metodo: 'PUT', cuerpo: armarCuerpo(datos) });
      /* Repintamos con lo que devolvió el servidor, no con lo que
         escribimos: si algo se guardó distinto, se ve en pantalla. */
      datos = res.precios;
      pintar(datos);
      Panel.toast('Precios guardados ✅');
      el('aviso').innerHTML =
        '<div class="aviso aviso--bien">Listo. La web ya está mostrando estos precios.</div>';
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
      Panel.toast('No se pudo guardar');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar cambios';
    }
  }

  function deshacer() {
    if (!datos) return;
    pintar(datos);
    Panel.limpiarAviso(el('aviso'));
    Panel.toast('Volvimos a los últimos precios guardados');
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('form').addEventListener('submit', guardar);
    el('btnDeshacer').addEventListener('click', deshacer);
    /* Apenas escribís, se apaga el rojo del campo */
    el('form').addEventListener('input', function (e) {
      var campo = e.target.closest('.campo');
      if (campo) campo.classList.remove('campo--mal');
    });
    cargar();
  });

})();
