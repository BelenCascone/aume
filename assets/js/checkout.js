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
          '<span class="op__t">🛵 Envío a domicilio</span>' +
          '<span class="op__d">' + esc(CFG.envio.aclaracion) + '</span>' +
        '</span>' +
      '</label>' +
      '<label class="op' + (m === 'retiro' ? ' op--sel' : '') + '"' +
        ' style="--c-op:var(--c-vegetariano);--c-op-suave:var(--c-vegetariano-suave)">' +
        '<input type="radio" name="modalidad" value="retiro"' + (m === 'retiro' ? ' checked' : '') + '>' +
        '<span class="op__dot" aria-hidden="true"></span>' +
        '<span class="op__txt">' +
          '<span class="op__t">🏠 Retiro en punto (Take Away)</span>' +
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
            '<span class="op__h">🕒 ' + p.horarios.map(esc).join(' · ') + '</span>' +
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
        return '<p class="resumen-mini__l"><span>' + it.cantidad + '× ' + esc(it.dia.nombre) +
               ' · ' + esc(it.categoria.nombre) + ' ' + esc(it.tamano.gramos) + '</span>' +
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

  function armarMensaje() {
    var d = leerForm();
    var lista = Store.items();
    var t = Store.totales();
    var esEnvio = Store.estado.modalidad === 'envio';

    var L = [];
    L.push('*NUEVO PEDIDO · AUMÉ* 🥗');
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
    L.push('*VIANDAS (' + t.cantidad + ')*');

    lista.forEach(function (it) {
      L.push('• ' + it.dia.nombre + ' · ' + it.categoria.nombre +
             ' (' + it.tamano.gramos + ') x' + it.cantidad +
             ' — ' + Store.plata(it.subtotal));
      if (it.plato) L.push('   _' + it.plato.nombre + '_');
    });

    L.push('');
    L.push('*Subtotal:* ' + Store.plata(t.subtotal));

    if (t.esRetiro) {
      L.push('*Envío:* No corresponde (retiro en punto)');
    } else {
      L.push('*Envío:* ' + Store.plata(t.envio) +
             (t.zona ? ' (' + t.zona.nombre + ')' : ''));
    }

    L.push('*TOTAL:* ' + Store.plata(t.total));
    L.push('');

    var pago = CFG.metodosPago.filter(function (m) { return m.id === d.pago; })[0];
    L.push('*Pago:* ' + (pago ? pago.nombre : '—'));
    if (d.notas) L.push('*Aclaraciones:* ' + d.notas);

    L.push('');
    L.push('_Pedido generado desde la web de AUMÉ_');

    return L.join('\n');
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
      UI.toast('Tocá "Abrir WhatsApp" o copiá el resumen 👇');
      el('planB').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      el('btnAbrirWa').hidden = true;
      UI.toast('¡Listo! Enviános el mensaje por WhatsApp');
    }
  }

  /* --------------------------------------------------- Copiar resumen */

  function copiar() {
    var texto = el('planBTexto').textContent;
    if (!texto) texto = armarMensaje();

    function ok() { UI.toast('Resumen copiado ✅'); }
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

  function montar() {
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
    el('btnCopiar').addEventListener('click', copiar);
  }

  /* ------------------------------------------------------------ Export */

  global.AUME.Checkout = {
    montar: montar,
    pintarResumen: pintarResumen,
    pintarPuntos: pintarPuntos,
    pintarModalidad: pintarModalidad,
    pintarZonas: pintarZonas,
    alternarCampos: alternarCampos,
    armarMensaje: armarMensaje
  };

})(window);
