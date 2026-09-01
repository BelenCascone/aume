/* =====================================================================
   AUMÉ · admin/pedidos/pedidos.js
   Resumen del día o la semana, listado, y alta rápida de los pedidos
   que llegan por WhatsApp.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc, plata = Panel.plata;

  var COLOR = {
    clasico: 'var(--c-clasico)', vegetariano: 'var(--c-vegetariano)',
    proteico: 'var(--c-proteico)', ensalada: 'var(--c-ensalada)',
    cesar: 'var(--c-ensalada)'
  };

  var filtro = { rango: 'dia', fecha: null, canal: '' };
  var catalogo = null;   // precios/catálogo, para el formulario manual
  var datos = null;

  function hoyParana() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function nombreDe(lista, id) {
    var x = (lista || []).filter(function (e) { return e.id === id; })[0];
    return x ? x.nombre : id;
  }

  /* ---------------------------------------------------------- Resumen */

  function pintarResumen(d) {
    var r = d.resumen;
    el('resumen').hidden = false;

    el('tarjetas').innerHTML =
      '<div class="tarjeta"><p class="tarjeta__n">' + r.pedidos + '</p>' +
        '<p class="tarjeta__l">Pedidos</p></div>' +
      '<div class="tarjeta"><p class="tarjeta__n">' + (r.viandas || 0) + '</p>' +
        '<p class="tarjeta__l">Viandas</p></div>' +
      '<div class="tarjeta tarjeta--app"><p class="tarjeta__n">' + r.porCanal.app.pedidos + '</p>' +
        '<p class="tarjeta__l">Por la app</p></div>' +
      '<div class="tarjeta tarjeta--wa"><p class="tarjeta__n">' + r.porCanal.whatsapp.pedidos + '</p>' +
        '<p class="tarjeta__l">Por WhatsApp</p></div>' +
      '<div class="tarjeta"><p class="tarjeta__n" style="font-size:1.25rem">' + plata(r.plata || 0) + '</p>' +
        '<p class="tarjeta__l">Recaudado</p></div>';

    var total = r.porTipo.reduce(function (a, t) { return a + t.viandas; }, 0);
    el('totalViandas').textContent = total
      ? total + ' viandas en total'
      : 'Todavía no hay viandas en este período.';

    el('barras').innerHTML = r.porTipo.map(function (t) {
      var pct = total ? Math.round(t.viandas * 100 / total) : 0;
      return '' +
        '<div class="barra-t" style="--c-cat:' + (COLOR[t.categoria_id] || 'var(--linea)') + '">' +
          '<span>' + esc(nombreDe(catalogo && catalogo.categorias, t.categoria_id)) + '</span>' +
          '<span class="barra-t__b"><span class="barra-t__f" style="width:' + pct + '%"></span></span>' +
          '<span class="barra-t__n">' + t.viandas + '</span>' +
        '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------- Listado */

  /* Una línea del pedido en palabras. No todas son viandas de un día:
     desde que la web ofrece promos, plan mensual y productos, cada tipo
     se lee distinto y con las mismas columnas no se entendía nada. */
  function descripcionItem(it) {
    var pref = it.preferencia
      ? ' · ' + (it.preferencia === 'combinado'
          ? 'Combinado'
          : nombreDe(catalogo && catalogo.categorias, it.preferencia))
      : '';

    if (it.tipo === 'pack' || it.tipo === 'plan') {
      return esc(it.plato_nombre || it.ref_id) + ' ' + esc(it.tamano_id) + esc(pref);
    }
    if (it.tipo === 'extra') {
      return esc(it.plato_nombre || it.ref_id);
    }
    return esc(it.dia_id) +
           ' · ' + esc(nombreDe(catalogo && catalogo.categorias, it.categoria_id)) +
           ' ' + esc(it.tamano_id) +
           (it.plato_nombre ? ' — ' + esc(it.plato_nombre) : '');
  }

  function pintarLista(d) {
    var porPedido = {};
    (d.items || []).forEach(function (it) {
      (porPedido[it.pedido_id] = porPedido[it.pedido_id] || []).push(it);
    });

    el('tituloLista').textContent = 'Listado (' + d.pedidos.length + ')';

    if (!d.pedidos.length) {
      el('lista').innerHTML =
        '<div class="caja"><p class="caja__d" style="margin:0">' +
        'No hay pedidos en este período.</p></div>';
      return;
    }

    el('lista').innerHTML = d.pedidos.map(function (p) {
      var items = (porPedido[p.id] || []).map(function (it) {
        return '<span class="linea-item"><span>' + it.cantidad + '× ' + descripcionItem(it) +
               '</span><b>' + plata(it.subtotal) + '</b></span>';
      }).join('');

      var entrega = p.modalidad === 'retiro'
        ? 'Retira en ' + esc(nombreDe(catalogo && catalogo.puntosRetiro, p.punto_id))
        : 'Envío a ' + esc(p.direccion) + ' (' + esc(nombreDe(catalogo && catalogo.envio && catalogo.envio.zonas, p.zona_id)) + ')';

      var hora = String(p.creado_en || '').slice(11, 16);

      return '' +
        '<div class="pedido pedido--' + esc(p.canal) + '">' +
          '<div class="pedido__cab">' +
            '<span class="pedido__n">' + esc(p.cliente_nombre) + '</span>' +
            '<span class="pedido__tel">' + esc(p.cliente_telefono) + '</span>' +
            '<span class="pedido__tot">' + plata(p.total) + '</span>' +
          '</div>' +
          '<p class="pedido__d">' + entrega + ' · ' +
            esc(nombreDe(catalogo && catalogo.metodosPago, p.metodo_pago)) +
            ' · ' + esc(p.fecha_local) + ' ' + esc(hora) + ' hs' +
            (p.notas ? ' · «' + esc(p.notas) + '»' : '') + '</p>' +
          (items ? '<div class="pedido__items">' + items + '</div>' : '') +
          '<div class="pedido__pie">' +
            '<span class="canal canal--' + esc(p.canal) + '">' +
              (p.canal === 'app' ? 'app' : 'whatsapp') + '</span>' +
            '<select class="sel-estado" data-id="' + p.id + '">' +
              ['nuevo', 'confirmado', 'entregado', 'cancelado'].map(function (e) {
                return '<option value="' + e + '"' + (e === p.estado ? ' selected' : '') + '>' + e + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  /* ------------------------------------------------------------ Datos */

  async function cargar() {
    el('cargando').hidden = false;
    Panel.limpiarAviso(el('aviso'));
    try {
      if (!catalogo) catalogo = await Panel.pedir('/api/precios');
      var q = '?rango=' + filtro.rango + '&fecha=' + filtro.fecha +
              (filtro.canal ? '&canal=' + filtro.canal : '');
      datos = await Panel.pedir('/api/pedidos' + q);
      el('cargando').hidden = true;
      pintarResumen(datos);
      pintarLista(datos);
    } catch (e) {
      el('cargando').hidden = true;
      Panel.mostrarError(el('aviso'), e);
    }
  }

  /* --------------------------------------------- Formulario manual */

  function filaItem(n) {
    var cats = (catalogo.categorias || []).concat(catalogo.extraFijo ? [catalogo.extraFijo] : []);
    return '' +
      '<div class="grilla" data-item style="margin-bottom:8px">' +
        '<select class="mes__sel" data-campo="dia">' +
          (catalogo.dias || []).map(function (d) {
            return '<option value="' + esc(d.id) + '">' + esc(d.nombre) + '</option>';
          }).join('') + '</select>' +
        '<select class="mes__sel" data-campo="categoria">' +
          cats.map(function (c) {
            return '<option value="' + esc(c.id) + '">' + esc(c.nombre) + '</option>';
          }).join('') + '</select>' +
        '<select class="mes__sel" data-campo="tamano">' +
          (catalogo.tamanos || []).map(function (t) {
            return '<option value="' + esc(t.id) + '">' + esc(t.nombre) + ' ' + esc(t.gramos) + '</option>';
          }).join('') + '</select>' +
        '<input class="campo__i" type="number" min="1" max="99" value="1" data-campo="cantidad" ' +
          'aria-label="Cantidad de la vianda ' + n + '">' +
      '</div>';
  }

  function prepararManual() {
    el('mZona').innerHTML = ((catalogo.envio && catalogo.envio.zonas) || []).map(function (z) {
      return '<option value="' + esc(z.id) + '">' + esc(z.nombre) + '</option>';
    }).join('');
    el('mPunto').innerHTML = (catalogo.puntosRetiro || []).map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.nombre) + '</option>';
    }).join('');
    el('mPago').innerHTML = (catalogo.metodosPago || []).map(function (m) {
      return '<option value="' + esc(m.id) + '">' + esc(m.nombre) + '</option>';
    }).join('');
    el('mItems').innerHTML = filaItem(1);
  }

  function alternarEntrega() {
    var esEnvio = el('mModalidad').value === 'envio';
    el('cZona').hidden = !esEnvio;
    el('cDireccion').hidden = !esEnvio;
    el('cPunto').hidden = esEnvio;
  }

  function cuerpoManual() {
    var items = [].slice.call(el('mItems').querySelectorAll('[data-item]')).map(function (f) {
      var v = function (campo) { return f.querySelector('[data-campo="' + campo + '"]').value; };
      return {
        dia: v('dia'), categoria: v('categoria'), tamano: v('tamano'),
        cantidad: parseInt(v('cantidad'), 10) || 0
      };
    });

    var esEnvio = el('mModalidad').value === 'envio';
    return {
      cliente: { nombre: el('mNombre').value, telefono: el('mTel').value },
      modalidad: esEnvio ? 'envio' : 'retiro',
      zonaId: esEnvio ? el('mZona').value : null,
      direccion: esEnvio ? el('mDireccion').value : '',
      puntoId: esEnvio ? null : el('mPunto').value,
      metodoPago: el('mPago').value,
      notas: el('mNotas').value,
      items: items
    };
  }

  async function guardarManual(ev) {
    ev.preventDefault();
    Panel.limpiarAviso(el('aviso'));

    var btn = el('btnGuardarManual');
    btn.disabled = true;
    btn.textContent = 'Anotando…';
    try {
      await Panel.pedir('/api/pedidos/manual', { metodo: 'POST', cuerpo: cuerpoManual() });
      Panel.toast('Pedido anotado ✅');
      el('formManual').hidden = true;
      el('btnAbrirManual').hidden = false;
      el('mNombre').value = ''; el('mTel').value = '';
      el('mDireccion').value = ''; el('mNotas').value = '';
      el('mItems').innerHTML = filaItem(1);
      await cargar();
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Anotar pedido';
    }
  }

  /* ---------------------------------------------------------- Filtros */

  function marcar(ids, activo) {
    ids.forEach(function (id) {
      el(id).setAttribute('aria-pressed', String(id === activo));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    filtro.fecha = hoyParana();
    el('fFecha').value = filtro.fecha;

    el('fDia').addEventListener('click', function () {
      filtro.rango = 'dia'; marcar(['fDia', 'fSemana'], 'fDia'); cargar();
    });
    el('fSemana').addEventListener('click', function () {
      filtro.rango = 'semana'; marcar(['fDia', 'fSemana'], 'fSemana'); cargar();
    });
    el('fFecha').addEventListener('change', function () {
      filtro.fecha = el('fFecha').value || hoyParana(); cargar();
    });

    el('fTodos').addEventListener('click', function () {
      filtro.canal = ''; marcar(['fTodos', 'fApp', 'fWa'], 'fTodos'); cargar();
    });
    el('fApp').addEventListener('click', function () {
      filtro.canal = 'app'; marcar(['fTodos', 'fApp', 'fWa'], 'fApp'); cargar();
    });
    el('fWa').addEventListener('click', function () {
      filtro.canal = 'whatsapp'; marcar(['fTodos', 'fApp', 'fWa'], 'fWa'); cargar();
    });

    el('btnAbrirManual').addEventListener('click', function () {
      prepararManual();
      alternarEntrega();
      el('formManual').hidden = false;
      el('btnAbrirManual').hidden = true;
      el('mNombre').focus();
    });
    el('btnCancelarManual').addEventListener('click', function () {
      el('formManual').hidden = true;
      el('btnAbrirManual').hidden = false;
    });
    el('btnMasItem').addEventListener('click', function () {
      var n = el('mItems').querySelectorAll('[data-item]').length + 1;
      el('mItems').insertAdjacentHTML('beforeend', filaItem(n));
    });
    el('mModalidad').addEventListener('change', alternarEntrega);
    el('formManual').addEventListener('submit', guardarManual);

    /* Cambiar el estado de un pedido desde el listado */
    el('lista').addEventListener('change', async function (ev) {
      var id = ev.target.getAttribute && ev.target.getAttribute('data-id');
      if (!id) return;
      try {
        await Panel.pedir('/api/pedidos/' + id, { metodo: 'PATCH', cuerpo: { estado: ev.target.value } });
        Panel.toast('Pedido #' + id + ': ' + ev.target.value);
      } catch (e) {
        Panel.mostrarError(el('aviso'), e);
      }
    });

    cargar();
  });

})();
