/* =====================================================================
   AUMÉ · checkout.js
   Formulario de pedido, validación, armado del mensaje de WhatsApp
   y plan B (copiar el resumen) si la redirección falla.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG   = global.AUME_CONFIG;
  var MENU  = global.AUME_MENU;
  var Store = global.AUME.Store;
  var UI    = global.AUME.UI;

  var el   = UI.el;
  var esc  = UI.esc;

  /* ------------------------------------------------ Opciones del form */

  function pintarModalidad() {
    var m = Store.estado.modalidad;

    el('opsModalidad').innerHTML = '' +
      '<label class="op' + (m === 'envio' ? ' op--sel' : '') + '"' +
        ' style="--c-op:var(--c-clasico);--c-op-suave:var(--c-clasico-suave)">' +
        '<input type="radio" name="modalidad" value="envio"' + (m === 'envio' ? ' checked' : '') + '>' +
        '<span class="op__dot" aria-hidden="true"></span>' +
        '<span class="op__txt">' +
          '<span class="op__t">Envío a domicilio</span>' +
          '<span class="op__d">' + esc(CFG.envio.aclaracion) + '</span>' +
        '</span>' +
      '</label>' +
      '<label class="op' + (m === 'retiro' ? ' op--sel' : '') + '"' +
        ' style="--c-op:var(--c-vegetariano);--c-op-suave:var(--c-vegetariano-suave)">' +
        '<input type="radio" name="modalidad" value="retiro"' + (m === 'retiro' ? ' checked' : '') + '>' +
        '<span class="op__dot" aria-hidden="true"></span>' +
        '<span class="op__txt">' +
          '<span class="op__t">Retiro en punto (Take Away)</span>' +
          '<span class="op__d">Sin costo. Elegís dónde y a qué hora.</span>' +
        '</span>' +
      '</label>';
  }

  function pintarPuntos() {
    var sel = Store.estado.punto;

    el('opsPunto').innerHTML = CFG.puntosRetiro.map(function (p) {
      return '' +
        '<label class="op' + (p.id === sel ? ' op--sel' : '') + '"' +
          ' style="--c-op:var(--c-vegetariano);--c-op-suave:var(--c-vegetariano-suave)">' +
          '<input type="radio" name="punto" value="' + esc(p.id) + '"' +
            (p.id === sel ? ' checked' : '') + '>' +
          '<span class="op__dot" aria-hidden="true"></span>' +
          '<span class="op__txt">' +
            '<span class="op__t">' + esc(p.nombre) + '</span>' +
            '<span class="op__d">' + esc(p.direccion) + '</span>' +
            '<span class="op__h">Horarios: ' + p.horarios.map(esc).join(' · ') + '</span>' +
          '</span>' +
        '</label>';
    }).join('');
  }

  function pintarZonas() {
    var sel = Store.estado.zona;

    el('opsZona').innerHTML = CFG.envio.zonas.map(function (z) {
      return '' +
        '<label class="op' + (z.id === sel ? ' op--sel' : '') + '"' +
          ' style="--c-op:var(--c-clasico);--c-op-suave:var(--c-clasico-suave)">' +
          '<input type="radio" name="zona" value="' + esc(z.id) + '"' +
            (z.id === sel ? ' checked' : '') + '>' +
          '<span class="op__dot" aria-hidden="true"></span>' +
          '<span class="op__txt">' +
            '<span class="op__t">' + esc(z.nombre) + '</span>' +
            '<span class="op__d">Costo del envío: ' + Store.plata(z.costo) + '</span>' +
          '</span>' +
        '</label>';
    }).join('');
  }

  function pintarPagos() {
    el('fPago').innerHTML =
      '<option value="">Elegí una opción…</option>' +
      CFG.metodosPago.map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.nombre) + '</option>';
      }).join('');
  }

  /* Muestra/oculta dirección o puntos según la modalidad elegida */
  function alternarCampos() {
    var esEnvio = Store.estado.modalidad === 'envio';
    el('cDireccion').hidden = !esEnvio;
    el('cZona').hidden = !esEnvio;
    el('cPunto').hidden = esEnvio;
    el('ayudaDireccion').textContent =
      CFG.envio.aclaracion;
  }

  /* ------------------------------------------------- Resumen del panel */

  function pintarResumen() {
    var lista = Store.items();
    var t = Store.totales();

    el('resumenMini').innerHTML =
      '<p class="resumen-mini__t">Tu pedido · ' + esc(MENU.semana) + '</p>' +
      lista.map(function (it) {
        return '<p class="resumen-mini__l"><span>' + it.cantidad + '× ' + esc(it.titulo) +
               (it.detalle ? ' · ' + esc(it.detalle) : '') + '</span>' +
               '<b>' + Store.plata(it.subtotal) + '</b></p>';
      }).join('') +
      UI.filaTotales(t);
  }

  /* ------------------------------------------------------- Validación */

  function marcarError(idCampo, hayError) {
    var c = el(idCampo);
    if (!c) return;
    c.classList.toggle('campo--error', !!hayError);
  }

  /* Texto escrito por la clienta.

     El mensaje de WhatsApp usa "*Campo:*" como estructura, así que si dejamos
     pasar un salto de línea seguido de "*TOTAL:*" cualquiera puede agregar
     líneas que se leen igual que las verdaderas — y quedan últimas, que es lo
     primero que se ve en el celular. Por eso: una sola línea, sin caracteres
     de formato de WhatsApp y con un tope de largo (la URL de wa.me tampoco es
     infinita). */
  function limpio(s, max) {
    return String(s == null ? '' : s)
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[*_~`]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, max);
  }

  function leerForm() {
    return {
      nombre:    limpio(el('fNombre').value, 60),
      telefono:  limpio(el('fTel').value, 30),
      direccion: limpio(el('fDireccion').value, 120),
      pago:      el('fPago').value,
      notas:     limpio(el('fNotas').value, 300)
    };
  }

  /* Devuelve el id del primer campo con error, o null si está todo bien */
  function validar() {
    var d = leerForm();
    var esEnvio = Store.estado.modalidad === 'envio';
    var primero = null;

    var errNombre = d.nombre.length < 2;
    var soloDigitos = d.telefono.replace(/\D/g, '');
    var errTel = soloDigitos.length < 8;
    var errDir = esEnvio && d.direccion.length < 5;
    var errPunto = !esEnvio && !Store.estado.punto;
    var errPago = !d.pago;

    marcarError('cNombre', errNombre);
    marcarError('cTel', errTel);
    marcarError('cDireccion', errDir);
    marcarError('cPunto', errPunto);
    marcarError('cPago', errPago);

    if (errNombre) primero = primero || 'cNombre';
    if (errTel)    primero = primero || 'cTel';
    if (errDir)    primero = primero || 'cDireccion';
    if (errPunto)  primero = primero || 'cPunto';
    if (errPago)   primero = primero || 'cPago';

    return primero;
  }

  /* -------------------------------------------- Mensaje para WhatsApp */

  /* Un bloque del mensaje: el título y las líneas de ese tipo. Si no hay
     ninguna, el bloque entero no aparece: nadie quiere leer un
     "PARA SUMAR" vacío en el celular. */
  function bloque(L, lista, tipo, titulo) {
    var lineas = lista.filter(function (it) { return it.tipo === tipo; });
    if (!lineas.length) return;

    var unidades = lineas.reduce(function (n, it) { return n + it.cantidad; }, 0);
    L.push('*' + titulo + ' (' + unidades + ')*');

    lineas.forEach(function (it) {
      if (it.tipo === 'vianda') {
        L.push('• ' + it.dia.nombre + ' · ' + it.categoria.nombre +
               ' (' + it.tamano.gramos + ') x' + it.cantidad +
               ' — ' + Store.plata(it.subtotal));
        if (it.plato) L.push('   _' + it.plato.nombre + '_');
      } else {
        L.push('• ' + it.titulo + (it.detalle ? ' · ' + it.detalle : '') +
               ' x' + it.cantidad + ' — ' + Store.plata(it.subtotal));
      }
    });

    L.push('');
  }

  function armarMensaje() {
    var d = leerForm();
    var lista = Store.items();
    var t = Store.totales();
    var esEnvio = Store.estado.modalidad === 'envio';

    var L = [];
    L.push('*NUEVO PEDIDO · AUMÉ*');
    L.push('_' + MENU.semana + '_');
    L.push('');
    L.push('*Cliente:* ' + d.nombre);
    L.push('*Teléfono:* ' + d.telefono);
    L.push('');

    if (esEnvio) {
      L.push('*Entrega:* Envío a domicilio');
      L.push('*Dirección:* ' + d.direccion);
    } else {
      var p = Store.buscarPunto(Store.estado.punto);
      L.push('*Entrega:* Retiro en punto');
      L.push('*Punto:* ' + p.nombre + ' — ' + p.direccion);
      L.push('*Horarios:* ' + p.horarios.join(' / '));
    }

    L.push('');

    /* Un bloque por tipo de línea, en el mismo orden en el que se pide */
    bloque(L, lista, 'vianda', 'VIANDAS');
    bloque(L, lista, 'pack',   'PROMOS SEMANALES');
    bloque(L, lista, 'plan',   'PLAN MENSUAL');
    bloque(L, lista, 'extra',  'PARA SUMAR');

    L.push('*Subtotal:* ' + Store.plata(t.subtotal));

    if (t.esRetiro) {
      L.push('*Envío:* No corresponde (retiro en punto)');
    } else if (t.envioBonificado) {
      L.push('*Envío:* Bonificado por la promo');
    } else {
      L.push('*Envío:* ' + Store.plata(t.envio) +
             (t.zona ? ' (' + t.zona.nombre + ')' : ''));
    }

    L.push('*TOTAL:* ' + Store.plata(t.total));
    if (t.ahorroEfectivo > 0) {
      L.push('*Pagando en efectivo:* ' + Store.plata(t.totalEfectivo));
    }
    L.push('');

    var pago = CFG.metodosPago.filter(function (m) { return m.id === d.pago; })[0];
    L.push('*Pago:* ' + (pago ? pago.nombre : '—'));
    if (d.notas) L.push('*Aclaraciones:* ' + d.notas);

    L.push('');
    L.push('_Pedido generado desde la web de AUMÉ_');

    return L.join('\n');
  }

  /* ======================================================== API
     REGISTRAR EL PEDIDO
     -------------------------------------------------------------------
     Los dos botones del checkout registran el pedido en /api/pedidos con
     canal "app": tanto el que abre WhatsApp como el que lo deja
     confirmado. Así los dos caminos cuentan igual en las estadísticas.

     Ojo con lo que NO mandamos: ni precios, ni subtotales, ni el total.
     El servidor los recalcula contra la base. Lo que va acá es sólo QUÉ
     se pidió, nunca CUÁNTO sale.
     ================================================================= */

  /* Una clave por intento de compra. Si la clienta toca dos veces, o se
     corta la señal y reintenta, el servidor reconoce que es el mismo
     pedido y no lo duplica. Se renueva cuando el pedido entra bien. */
  var claveIntento = null;

  function nuevaClave() {
    try {
      if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    } catch (e) { /* seguimos con el respaldo */ }
    return 'aume-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function cuerpoPedido(origen) {
    var d = leerForm();
    if (!claveIntento) claveIntento = nuevaClave();

    return {
      claveIdem: claveIntento,
      origen: origen,
      cliente: { nombre: d.nombre, telefono: d.telefono },
      modalidad: Store.estado.modalidad,
      zonaId: Store.estado.zona,
      direccion: d.direccion,
      puntoId: Store.estado.punto,
      metodoPago: d.pago,
      notas: d.notas,
      /* "tipo" es lo que le dice al servidor contra qué tabla mirar el
         precio: el menú del día, los packs, el plan mensual o los
         productos. Los precios NO viajan: los recalcula el servidor. */
      items: Store.items().map(function (it) {
        return {
          tipo: it.tipo,
          dia: it.diaId || '',
          categoria: it.catId || '',
          tamano: it.tamanoId || '',
          pack: it.packId || '',
          producto: it.productoId || '',
          preferencia: it.prefId || '',
          cantidad: it.cantidad
        };
      })
    };
  }

  function registrar(origen) {
    if (typeof fetch !== 'function') return Promise.reject({ mensaje: 'Sin conexión.' });

    return fetch('/api/pedidos', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpoPedido(origen))
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (c) {
        if (res.ok && c && c.ok === true) return c.datos;
        var err = (c && c.error) || {};
        throw {
          mensaje: err.mensaje || 'No pudimos registrar el pedido.',
          detalles: err.detalles || []
        };
      });
    });
  }

  /* ---------------------------------------------------------- Enviar */

  function enviar() {
    if (!Store.totales().cantidad) {
      UI.toast('Tu pedido está vacío');
      return;
    }

    var campoMalo = validar();
    if (campoMalo) {
      var nodo = el(campoMalo);
      nodo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var foco = nodo.querySelector('input, select, textarea');
      if (foco) foco.focus({ preventScroll: true });
      UI.toast('Completá los datos marcados en rojo');
      return;
    }

    /* Registramos el pedido SIN esperar la respuesta, y abrimos WhatsApp
       en el mismo gesto de la clienta.

       El orden importa: si esperáramos a la API, el navegador ya no
       consideraría la apertura como parte del toque y los bloqueadores
       de pop-ups la frenarían. Y si la API falla, el pedido igual llega
       por WhatsApp, que es exactamente como funcionaba antes de que
       existiera todo esto. Registrar es un extra; abrir WhatsApp no. */
    registrar('checkout-whatsapp').then(function () {
      claveIntento = null;
    }).catch(function () {
      /* Silencio a propósito: la clienta ya está en WhatsApp con su
         pedido. Un cartel de error acá sólo la asustaría por algo que
         no le impide comprar. */
    });

    var texto = armarMensaje();
    var url = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(texto);

    /* Siempre dejamos el plan B a mano por si la app no abre */
    el('planBTexto').textContent = texto;
    el('planB').hidden = false;

    /* Ojo: global.open(url, '_blank', 'noopener') devuelve SIEMPRE null por
       especificación, aunque la ventana se haya abierto bien. Con eso no hay
       forma de saber si abrió, y terminábamos mandando la pestaña de AUMÉ a
       WhatsApp además de abrir la pestaña nueva. Abrimos sin 'noopener' y
       soltamos el opener a mano. */
    var ventana = null;
    try { ventana = global.open(url, '_blank'); } catch (e) { ventana = null; }
    if (ventana) { try { ventana.opener = null; } catch (e1) {} }

    if (!ventana) {
      /* Ventana bloqueada (webview de Instagram, bloqueador de pop-ups).
         Antes acá hacíamos location.href = url, pero eso se llevaba la
         pestaña de AUMÉ y el resumen que acabábamos de mostrar desaparecía
         justo cuando más falta hace; y sin WhatsApp instalado, la clienta
         quedaba en una página de error sin su pedido. Un enlace real no lo
         bloquea ningún navegador y deja la web en su lugar. */
      var link = el('btnAbrirWa');
      link.href = url;
      link.hidden = false;
      UI.toast('Tocá "Abrir WhatsApp" o copiá el resumen');
      el('planB').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      el('btnAbrirWa').hidden = true;
      UI.toast('¡Listo! Enviános el mensaje por WhatsApp');
    }
  }

  /* ============================ DEJAR EL PEDIDO CONFIRMADO
     El segundo camino: el pedido queda registrado y NO se abre WhatsApp.
     Desde AUMÉ se comunican para coordinar entrega y pago. No hay pago
     online: eso sigue igual que siempre.
     ================================================================= */

  function pantallaConfirmada(datos) {
    var esRetiro = Store.estado.modalidad === 'retiro';
    var punto = esRetiro ? Store.buscarPunto(Store.estado.punto) : null;
    var d = leerForm();

    var entrega = esRetiro
      ? 'Retirás en ' + esc(punto.nombre) + ' — ' + esc(punto.direccion)
      : 'Te lo llevamos a ' + esc(d.direccion);

    el('panelCuerpoCheckout').innerHTML =
      '<div class="listo">' +
        '<h3 class="listo__t">¡Pedido recibido!</h3>' +
        '<p class="listo__d">' +
          'Gracias ' + esc(d.nombre.split(' ')[0]) + '. Ya tenemos tu pedido anotado.' +
        '</p>' +

        '<div class="listo__caja">' +
          '<p class="listo__l"><span>Nº de pedido</span><b>#' + esc(String(datos.id)) + '</b></p>' +
          '<p class="listo__l"><span>' + datos.cantidad + ' ' +
            UI.plural(datos.cantidad, 'ítem', 'ítems') + '</span><b>' +
            Store.plata(datos.total) + '</b></p>' +
          '<p class="listo__l listo__l--suelto">' + entrega + '</p>' +
        '</div>' +

        '<p class="listo__aviso">' +
          '<b>Desde AUMÉ nos comunicamos con vos</b> al ' + esc(d.telefono) +
          ' para coordinar la entrega y el pago. No hace falta que hagas nada más.' +
        '</p>' +

        '<button type="button" class="btn btn--fantasma btn--bloque" data-cerrar>Listo</button>' +
      '</div>';

    /* El pedido ya está anotado: el carrito cumplió su función y dejarlo
       lleno sólo invita a mandarlo dos veces. */
    Store.vaciar();
  }

  async function confirmar() {
    if (!Store.totales().cantidad) {
      UI.toast('Tu pedido está vacío');
      return;
    }

    var campoMalo = validar();
    if (campoMalo) {
      var nodo = el(campoMalo);
      nodo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var foco = nodo.querySelector('input, select, textarea');
      if (foco) foco.focus({ preventScroll: true });
      UI.toast('Completá los datos marcados en rojo');
      return;
    }

    var btn = el('btnConfirmado');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    try {
      var datos = await registrar('checkout-confirmado');
      claveIntento = null;
      pantallaConfirmada(datos);
    } catch (e) {
      /* Si la API falla, el camino de WhatsApp sigue disponible y es el
         que siempre funcionó: se lo decimos en vez de dejarla trabada. */
      el('planBTexto').textContent = armarMensaje();
      el('planB').hidden = false;
      UI.toast(e.mensaje || 'No pudimos registrar el pedido');
      el('planB').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      btn.disabled = false;
      btn.textContent = 'Dejar mi pedido confirmado';
    }
  }

  /* --------------------------------------------------- Copiar resumen */

  function copiar() {
    var texto = el('planBTexto').textContent;
    if (!texto) texto = armarMensaje();

    function ok() { UI.toast('Resumen copiado'); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        ok();
      } catch (e) {
        UI.toast('Copialo manualmente desde el recuadro');
      }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok).catch(fallback);
    } else {
      fallback();
    }
  }

  /* ---------------------------------------------------------- Montaje */

  /* El segundo botón y el id del cuerpo del panel se agregan desde acá
     para no tener que tocar index.html: la landing pública sigue con su
     marcado de siempre. */
  function prepararPanel() {
    var panel = document.getElementById('panelCheckout');
    var cuerpo = panel.querySelector('.panel__cuerpo');
    if (cuerpo && !cuerpo.id) cuerpo.id = 'panelCuerpoCheckout';

    if (document.getElementById('btnConfirmado')) return;

    var pie = panel.querySelector('.panel__pie');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btnConfirmado';
    btn.className = 'btn btn--primario btn--bloque';
    btn.style.marginTop = '10px';
    btn.textContent = 'Dejar mi pedido confirmado';
    pie.appendChild(btn);

    var nota = document.createElement('p');
    nota.className = 'pie-nota';
    nota.textContent = 'Te contactamos para coordinar entrega y pago.';
    pie.appendChild(nota);
  }

  function montar() {
    prepararPanel();
    pintarModalidad();
    pintarPuntos();
    pintarZonas();
    pintarPagos();
    alternarCampos();

    /* Modalidad de entrega */
    el('opsModalidad').addEventListener('change', function (e) {
      if (e.target.name !== 'modalidad') return;
      Store.setModalidad(e.target.value);
      pintarModalidad();
      alternarCampos();
      pintarResumen();
      marcarError('cDireccion', false);
      marcarError('cPunto', false);
    });

    /* Zona de entrega */
    el('opsZona').addEventListener('change', function (e) {
      if (e.target.name !== 'zona') return;
      Store.setZona(e.target.value);
      pintarZonas();
      pintarResumen();
    });

    /* Punto de retiro */
    el('opsPunto').addEventListener('change', function (e) {
      if (e.target.name !== 'punto') return;
      Store.setPunto(e.target.value);
      pintarPuntos();
      marcarError('cPunto', false);
    });

    /* Limpiamos el error del campo apenas el usuario escribe */
    ['fNombre', 'fTel', 'fDireccion', 'fPago'].forEach(function (id) {
      var mapa = { fNombre: 'cNombre', fTel: 'cTel', fDireccion: 'cDireccion', fPago: 'cPago' };
      el(id).addEventListener('input', function () { marcarError(mapa[id], false); });
      el(id).addEventListener('change', function () { marcarError(mapa[id], false); });
    });

    el('formPedido').addEventListener('submit', function (e) {
      e.preventDefault();
      enviar();
    });

    el('btnWhatsapp').addEventListener('click', enviar);
    el('btnConfirmado').addEventListener('click', confirmar);
    el('btnCopiar').addEventListener('click', copiar);
  }

  /* ------------------------------------------------------------ Export */

  global.AUME.Checkout = {
    montar: montar,
    confirmar: confirmar,
    cuerpoPedido: cuerpoPedido,
    pintarResumen: pintarResumen,
    pintarPuntos: pintarPuntos,
    pintarModalidad: pintarModalidad,
    pintarZonas: pintarZonas,
    alternarCampos: alternarCampos,
    armarMensaje: armarMensaje
  };

})(window);
