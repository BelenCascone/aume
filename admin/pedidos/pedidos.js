/* =====================================================================
   AUMÉ · admin/pedidos/pedidos.js
   El listado de pedidos y la carga manual.

   Dos cosas que no se negocian acá:

   · El panel nunca manda un importe. Manda qué se pidió (día, categoría,
     tamaño, cantidad) y el servidor calcula el precio con la lista de
     hoy. Si el navegador pudiera decidir el total, cualquiera con la
     consola abierta se cobraría lo que quiera.

   · Filtrar, ordenar y paginar se hace en el navegador, sobre lo que ya
     vino de la API. Son a lo sumo 300 pedidos: pedirle al servidor una
     consulta nueva por cada tecla del buscador sería más lento y más
     frágil que hacerlo acá.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc, plata = Panel.plata;
  var POR_PAGINA = 15;

  var COLOR = {
    clasico: 'var(--g-clasico)', vegetariano: 'var(--g-vegetariano)',
    proteico: 'var(--g-proteico)', ensalada: 'var(--g-ensalada)', cesar: 'var(--g-cesar)'
  };
  var ESTADOS = { nuevo: 'Nuevo', confirmado: 'Confirmado', entregado: 'Entregado', cancelado: 'Cancelado' };
  var CANAL = { app: 'App', whatsapp: 'WhatsApp' };

  var catalogo = null;      // /api/precios
  var datos = null;         // /api/pedidos
  var filtro = { rango: 'dia', fecha: '', canal: 'todos', buscar: '' };
  var orden = { campo: 'hora', dir: -1 };
  var pagina = 1;
  var editando = null;      // id del pedido que se está editando, o null

  var miles = new Intl.NumberFormat('es-AR');
  function num(n) { return miles.format(n || 0); }

  function hoyParana() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function hora(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Cordoba', hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  function nombreDe(lista, id) {
    var x = (lista || []).filter(function (e) { return e.id === id; })[0];
    return x ? x.nombre : (id || '—');
  }

  /* ------------------------------------------------------- Listado */

  function visibles() {
    var q = filtro.buscar.trim().toLowerCase();
    return (datos.pedidos || []).filter(function (p) {
      if (!q) return true;
      return (p.cliente_nombre || '').toLowerCase().indexOf(q) >= 0 ||
             (p.cliente_telefono || '').indexOf(q) >= 0;
    });
  }

  function ordenados(lista) {
    var campo = orden.campo, dir = orden.dir;
    var clave = {
      hora: function (p) { return p.creado_en || ''; },
      cliente: function (p) { return (p.cliente_nombre || '').toLowerCase(); },
      canal: function (p) { return p.canal || ''; },
      items: function (p) { return p.cantidad || 0; },
      monto: function (p) { return p.total || 0; },
      estado: function (p) { return p.estado || ''; }
    }[campo];

    /* El id de desempate no es decorativo: sin él, dos pedidos con el
       mismo valor cambian de lugar en cada repintado y la fila que
       querías tocar se te mueve abajo del dedo. */
    return lista.slice().sort(function (a, b) {
      var x = clave(a), y = clave(b);
      if (x < y) return -dir;
      if (x > y) return dir;
      return a.id - b.id;
    });
  }

  var iconoEditar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/></svg>';

  function celdaEstado(p) {
    var opciones = Object.keys(ESTADOS).map(function (k) {
      return '<option value="' + k + '"' + (k === p.estado ? ' selected' : '') + '>' + ESTADOS[k] + '</option>';
    }).join('');
    return '<span class="row-actions">' +
      '<span class="status-select badge-' + esc(p.estado) + '">' +
        '<select data-id="' + p.id + '" aria-label="Estado del pedido de ' + esc(p.cliente_nombre) + '">' +
        opciones + '</select></span>' +
      '<button type="button" class="row-edit-btn" data-editar="' + p.id + '" ' +
        'aria-label="Editar el pedido de ' + esc(p.cliente_nombre) + '" data-tooltip="Editar pedido">' +
        iconoEditar + '</button></span>';
  }

  function resumenItems(p) {
    var items = (datos.items || []).filter(function (i) { return i.pedido_id === p.id; });
    if (!items.length) return num(p.cantidad) + (p.cantidad === 1 ? ' vianda' : ' viandas');
    var cats = [];
    items.forEach(function (i) {
      var n = nombreDe(catalogo && catalogo.categorias, i.categoria_id);
      if (cats.indexOf(n) < 0) cats.push(n);
    });
    return num(p.cantidad) + (p.cantidad === 1 ? ' vianda · ' : ' viandas · ') + esc(cats.join(', '));
  }

  function pintarTabla() {
    var lista = ordenados(visibles());
    var paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (pagina > paginas) pagina = paginas;
    var desde = (pagina - 1) * POR_PAGINA;
    var enPagina = lista.slice(desde, desde + POR_PAGINA);

    el('cuerpoTabla').innerHTML = lista.length === 0
      ? '<tr class="empty-row"><td colspan="6">No hay pedidos que coincidan con este filtro.</td></tr>'
      : enPagina.map(function (p) {
          return '<tr>' +
            '<td data-label="Hora">' + esc(hora(p.creado_en)) + '</td>' +
            '<td data-label="Cliente">' + esc(p.cliente_nombre || '—') +
              '<br><span class="meta">' + esc(p.cliente_telefono || '') + '</span></td>' +
            '<td data-label="Canal"><span class="channel-tag">' + esc(CANAL[p.canal] || p.canal) + '</span></td>' +
            '<td data-label="Viandas">' + resumenItems(p) + '</td>' +
            '<td data-label="Monto" class="num-col num">' + plata(p.total) + '</td>' +
            '<td data-label="Estado">' + celdaEstado(p) + '</td>' +
          '</tr>';
        }).join('');

    el('infoPagina').textContent = lista.length === 0
      ? 'Sin resultados'
      : 'Mostrando ' + (desde + 1) + '–' + Math.min(desde + POR_PAGINA, lista.length) +
        ' de ' + lista.length + (lista.length === 1 ? ' pedido' : ' pedidos');
    el('indicadorPagina').textContent = 'Página ' + pagina + ' de ' + paginas;
    el('btnPrev').disabled = pagina <= 1;
    el('btnNext').disabled = pagina >= paginas;

    document.querySelectorAll('.ds-table th[data-sort]').forEach(function (th) {
      var k = th.getAttribute('data-sort');
      th.setAttribute('aria-sort', k === orden.campo
        ? (orden.dir === 1 ? 'ascending' : 'descending') : 'none');
    });
  }

  function pintarResumen() {
    var r = datos.resumen;
    el('kpis').innerHTML =
      tarjeta('Pedidos', num(r.pedidos)) +
      tarjeta('Viandas', num(r.viandas || 0)) +
      tarjeta('Por la app', num(r.porCanal.app.pedidos)) +
      tarjeta('Recaudado', plata(r.plata || 0));
    el('secResumen').hidden = false;

    var total = (r.porTipo || []).reduce(function (a, t) { return a + t.viandas; }, 0);
    el('desglose').innerHTML = !total
      ? '<p class="meta">Todavía no hay viandas en este filtro.</p>'
      : r.porTipo.map(function (t) {
          var pct = Math.round(t.viandas * 100 / total);
          var color = COLOR[t.categoria_id] || 'var(--muted)';
          var nom = nombreDe(catalogo && catalogo.categorias, t.categoria_id);
          return '<div class="hbar-row" tabindex="0" data-tooltip="' +
              esc(nom + ': ' + num(t.viandas) + ' viandas (' + pct + '% del total)') + '">' +
            '<div class="hbar-top"><span class="hbar-name">' +
              '<span class="hbar-dot" style="background:' + color + '"></span>' + esc(nom) +
            '</span><span class="hbar-num num">' + num(t.viandas) + ' · ' + pct + '%</span></div>' +
            '<div class="hbar-track"><div class="hbar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
          '</div>';
        }).join('');
    el('secDesglose').hidden = false;
  }

  function tarjeta(etiqueta, valor) {
    return '<div class="kpi-card"><p class="kpi-label">' + esc(etiqueta) + '</p>' +
      '<p class="kpi-num num">' + esc(valor) + '</p></div>';
  }

  /* -------------------------------------------------------- Cargar */

  async function cargar() {
    Panel.limpiarAviso(el('aviso'));
    el('cargando').hidden = false;
    try {
      if (!catalogo) catalogo = await Panel.pedir('/api/precios');
      var q = '?rango=' + filtro.rango + '&fecha=' + filtro.fecha +
              (filtro.canal !== 'todos' ? '&canal=' + filtro.canal : '');
      datos = await Panel.pedir('/api/pedidos' + q);
      pintarTabla();
      pintarResumen();
      el('secListado').hidden = false;
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
      el('secListado').hidden = true;
      el('secResumen').hidden = true;
      el('secDesglose').hidden = true;
    } finally {
      el('cargando').hidden = true;
    }
  }

  /* ------------------------------------------------- Formulario */

  function opciones(lista, sel) {
    return (lista || []).map(function (x) {
      return '<option value="' + esc(x.id) + '"' + (x.id === sel ? ' selected' : '') + '>' +
        esc(x.nombre) + '</option>';
    }).join('');
  }

  function filaItem(it) {
    it = it || {};
    return '<div class="field-row item-fila" style="grid-template-columns:1fr 1fr 1fr auto;align-items:end;margin-bottom:10px">' +
      '<div class="field"><label>Día</label><select class="select it-dia">' +
        opciones(catalogo.dias, it.dia_id) + '</select></div>' +
      '<div class="field"><label>Menú</label><select class="select it-cat">' +
        opciones(catalogo.categorias, it.categoria_id) + '</select></div>' +
      '<div class="field"><label>Tamaño</label><select class="select it-tam">' +
        opciones(catalogo.tamanos, it.tamano_id) + '</select></div>' +
      '<div class="field" style="width:92px"><label>Cant.</label>' +
        '<input class="input it-cant" type="number" min="1" max="99" value="' + (it.cantidad || 1) + '"></div>' +
      '<button type="button" class="btn-icon btn-borrar it-quitar" aria-label="Quitar esta vianda" data-tooltip="Quitar">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg></button>' +
    '</div>';
  }

  function itemsDelFormulario() {
    return Array.prototype.map.call(el('iItems').querySelectorAll('.item-fila'), function (f) {
      return {
        dia: f.querySelector('.it-dia').value,
        categoria: f.querySelector('.it-cat').value,
        tamano: f.querySelector('.it-tam').value,
        cantidad: Number(f.querySelector('.it-cant').value) || 0
      };
    }).filter(function (i) { return i.cantidad > 0; });
  }

  function sincronizarEntrega() {
    var esEnvio = el('iModalidad').value === 'envio';
    el('fZona').hidden = !esEnvio;
    el('fPunto').hidden = esEnvio;
    el('fDireccion').hidden = !esEnvio;
  }

  function abrirDialogo(pedido) {
    editando = pedido ? pedido.id : null;
    el('dlgTitulo').textContent = pedido ? 'Editar pedido' : 'Cargar pedido manual';
    el('dlgGuardar').textContent = pedido ? 'Guardar cambios' : 'Cargar pedido';
    Panel.limpiarAviso(el('dlgAviso'));
    el('dlgTotal').textContent = pedido
      ? 'Hoy figura en ' + plata(pedido.total) + '. Al guardar se recalcula con los precios de hoy.'
      : 'El total lo calcula el servidor con la lista de precios de hoy.';

    el('iZona').innerHTML = opciones(catalogo.envio.zonas, pedido && pedido.zona_id);
    el('iPunto').innerHTML = opciones(catalogo.puntosRetiro, pedido && pedido.punto_id);
    el('iPago').innerHTML = opciones(catalogo.metodosPago, pedido && pedido.metodo_pago);

    el('iCliente').value = pedido ? (pedido.cliente_nombre || '') : '';
    el('iTelefono').value = pedido ? (pedido.cliente_telefono || '') : '';
    el('iCanal').value = pedido ? pedido.canal : 'whatsapp';
    el('iEstado').value = pedido ? pedido.estado : 'nuevo';
    el('iModalidad').value = pedido ? pedido.modalidad : 'envio';
    el('iDireccion').value = pedido ? (pedido.direccion || '') : '';
    el('iNotas').value = pedido ? (pedido.notas || '') : '';

    var items = pedido ? (datos.items || []).filter(function (i) { return i.pedido_id === pedido.id; }) : [];
    el('iItems').innerHTML = (items.length ? items : [null]).map(filaItem).join('');

    sincronizarEntrega();
    ['fCliente', 'fTelefono', 'fDireccion'].forEach(function (id) {
      el(id).classList.remove('is-invalid');
    });
    el('dlgPedido').showModal();
    el('iCliente').focus();
  }

  function cuerpoDelFormulario() {
    var esEnvio = el('iModalidad').value === 'envio';
    /* Los nombres son los que espera armarPedido() en
       worker/rutas/pedidos.js: cliente anidado, zonaId y puntoId. */
    return {
      cliente: { nombre: el('iCliente').value, telefono: el('iTelefono').value },
      canal: el('iCanal').value,
      estado: el('iEstado').value,
      modalidad: el('iModalidad').value,
      zonaId: esEnvio ? el('iZona').value : '',
      puntoId: esEnvio ? '' : el('iPunto').value,
      direccion: esEnvio ? el('iDireccion').value : '',
      metodoPago: el('iPago').value,
      notas: el('iNotas').value,
      items: itemsDelFormulario()
    };
  }

  function validar(c) {
    var bien = true;
    function marcar(campo, ok) {
      el(campo).classList.toggle('is-invalid', !ok);
      if (!ok) bien = false;
    }
    marcar('fCliente', c.cliente.nombre.trim().length > 1);
    marcar('fTelefono', c.cliente.telefono.replace(/\D/g, '').length >= 6);
    marcar('fDireccion', c.modalidad !== 'envio' || c.direccion.trim().length > 3);
    if (!c.items.length) {
      Panel.mostrarError(el('dlgAviso'), { mensaje: 'Agregá al menos una vianda.', detalles: [] });
      bien = false;
    }
    return bien;
  }

  async function guardar(ev) {
    ev.preventDefault();
    var c = cuerpoDelFormulario();
    Panel.limpiarAviso(el('dlgAviso'));
    if (!validar(c)) return;

    el('dlgGuardar').disabled = true;
    try {
      if (editando === null) {
        await Panel.pedir('/api/pedidos/manual', { metodo: 'POST', cuerpo: c });
        Panel.toast('Pedido cargado.');
      } else {
        await Panel.pedir('/api/pedidos/' + editando, { metodo: 'PATCH', cuerpo: c });
        Panel.toast('Pedido actualizado.');
      }
      el('dlgPedido').close();
      await cargar();
    } catch (e) {
      Panel.mostrarError(el('dlgAviso'), e);
    } finally {
      el('dlgGuardar').disabled = false;
    }
  }

  /* -------------------------------------------------------- Eventos */

  function grupoSegmentado(selector, alElegir) {
    document.querySelectorAll(selector).forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll(selector).forEach(function (o) {
          var on = o === b;
          o.classList.toggle('active', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        pagina = 1;
        alElegir(b);
      });
    });
  }

  function arrancar() {
    filtro.fecha = hoyParana();
    el('fFecha').value = filtro.fecha;

    grupoSegmentado('.seg-tab[data-rango]', function (b) {
      filtro.rango = b.getAttribute('data-rango');
      /* Con "Todos" la fecha no filtra nada: se apaga para que no
         parezca que sí. */
      el('fFecha').disabled = filtro.rango === 'todo';
      cargar();
    });
    grupoSegmentado('.seg-tab[data-canal]', function (b) {
      filtro.canal = b.getAttribute('data-canal');
      cargar();
    });

    el('fFecha').addEventListener('change', function () {
      filtro.fecha = el('fFecha').value || hoyParana();
      pagina = 1;
      cargar();
    });

    el('fBuscar').addEventListener('input', function () {
      filtro.buscar = el('fBuscar').value;
      pagina = 1;
      pintarTabla();
    });

    document.querySelectorAll('.ds-table th[data-sort]').forEach(function (th) {
      th.querySelector('.sort-btn').addEventListener('click', function () {
        var k = th.getAttribute('data-sort');
        if (orden.campo === k) orden.dir = -orden.dir;
        else { orden.campo = k; orden.dir = k === 'hora' ? -1 : 1; }
        pintarTabla();
      });
    });

    el('btnPrev').addEventListener('click', function () { pagina -= 1; pintarTabla(); });
    el('btnNext').addEventListener('click', function () { pagina += 1; pintarTabla(); });

    /* Cambiar el estado desde la fila. Es lo que más se toca en el día,
       así que va por el camino corto del PATCH: sólo el estado. */
    el('cuerpoTabla').addEventListener('change', async function (ev) {
      var sel = ev.target.closest('select[data-id]');
      if (!sel) return;
      var id = Number(sel.getAttribute('data-id'));
      var antes = (datos.pedidos.filter(function (p) { return p.id === id; })[0] || {}).estado;
      try {
        await Panel.pedir('/api/pedidos/' + id, { metodo: 'PATCH', cuerpo: { estado: sel.value } });
        datos.pedidos.forEach(function (p) { if (p.id === id) p.estado = sel.value; });
        pintarTabla();
        Panel.toast('Estado actualizado.');
      } catch (e) {
        sel.value = antes;
        Panel.mostrarError(el('aviso'), e);
      }
    });

    el('cuerpoTabla').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-editar]');
      if (!b) return;
      var id = Number(b.getAttribute('data-editar'));
      var p = datos.pedidos.filter(function (x) { return x.id === id; })[0];
      if (p) abrirDialogo(p);
    });

    el('btnNuevo').addEventListener('click', function () { abrirDialogo(null); });
    el('dlgCerrar').addEventListener('click', function () { el('dlgPedido').close(); });
    el('dlgCancelar').addEventListener('click', function () { el('dlgPedido').close(); });
    el('iModalidad').addEventListener('change', sincronizarEntrega);
    el('btnMasItem').addEventListener('click', function () {
      el('iItems').insertAdjacentHTML('beforeend', filaItem(null));
    });
    el('iItems').addEventListener('click', function (ev) {
      if (!ev.target.closest('.it-quitar')) return;
      var filas = el('iItems').querySelectorAll('.item-fila');
      if (filas.length <= 1) { Panel.toast('El pedido tiene que tener al menos una vianda.'); return; }
      ev.target.closest('.item-fila').remove();
    });
    el('formPedido').addEventListener('submit', guardar);

    cargar();
  }

  document.addEventListener('DOMContentLoaded', arrancar);
})();
