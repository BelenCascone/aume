/* =====================================================================
   AUMÉ · assets/js/cotizacion.js
   El formulario de empresas de la landing.

   Se manda con fetch y NO con un envío de formulario común. Eso no es un
   detalle técnico: la política de seguridad del sitio tiene
   `form-action 'none'`, que prohíbe que un formulario se envíe a ningún
   lado. Mandándolo con fetch, la regla puede quedarse como está y sigue
   protegiendo contra que alguien inyecte un formulario que apunte a otro
   sitio.

   Toda la validación de verdad la hace el worker. Lo de acá es sólo para
   avisar antes de mandar, que es más rápido para quien completa.
   ===================================================================== */
(function (global) {
  'use strict';

  var form = document.getElementById('formCotizacion');
  if (!form) return;

  var aviso  = document.getElementById('cAviso');
  var boton  = document.getElementById('cEnviar');
  var CAMPOS = ['contacto', 'empresa', 'email', 'telefono'];

  function valor(nombre) {
    var campo = form.elements[nombre];
    return campo ? String(campo.value || '').trim() : '';
  }

  function marcar(nombre, mal) {
    var campo = form.elements[nombre];
    if (campo) campo.setAttribute('aria-invalid', mal ? 'true' : 'false');
  }

  function mostrar(clase, titulo, lineas) {
    aviso.className = 'cot-aviso' + (clase ? ' ' + clase : '');
    var html = '<p class="cot-aviso__t">' + titulo + '</p>';
    if (lineas && lineas.length) {
      html += '<ul>' + lineas.map(function (l) {
        return '<li>' + String(l)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>';
      }).join('') + '</ul>';
    }
    aviso.innerHTML = html;
    aviso.hidden = false;
  }

  function limpiar() {
    aviso.hidden = true;
    aviso.innerHTML = '';
    CAMPOS.forEach(function (n) { marcar(n, false); });
  }

  /* Las mismas tres reglas que aplica el worker, para no hacer ir y
     volver un pedido que ya sabemos que va a rebotar. */
  function revisar() {
    var problemas = [];

    if (!valor('contacto')) {
      problemas.push('Necesitamos tu nombre para saber con quién hablamos.');
      marcar('contacto', true);
    }

    var email = valor('email');
    var tel   = valor('telefono');

    if (!email && !tel) {
      problemas.push('Dejanos un mail o un teléfono, o no vamos a poder contestarte.');
      marcar('email', true);
      marcar('telefono', true);
    }
    if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
      problemas.push('Ese mail no parece estar bien escrito.');
      marcar('email', true);
    }
    if (tel && (tel.match(/\d/g) || []).length < 8) {
      problemas.push('Ese teléfono parece incompleto.');
      marcar('telefono', true);
    }

    return problemas;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    limpiar();

    var problemas = revisar();
    if (problemas.length) {
      mostrar('', 'Falta algo para poder contestarte', problemas);
      var primero = form.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return;
    }

    var cuerpo = {};
    CAMPOS.forEach(function (n) { cuerpo[n] = valor(n); });

    boton.disabled = true;
    var textoOriginal = boton.textContent;
    boton.textContent = 'Enviando…';

    try {
      var res = await fetch('/api/cotizaciones', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });
      var json = await res.json().catch(function () { return null; });

      if (!res.ok || !json || json.ok !== true) {
        var err = (json && json.error) || {};
        mostrar('', 'No pudimos enviar tu consulta',
                err.detalles && err.detalles.length
                  ? err.detalles
                  : [err.mensaje || 'Probá de nuevo en un momento, o escribinos por WhatsApp.']);
        return;
      }

      /* Se saca el formulario entero: dejarlo con los datos puestos
         invita a mandarlo dos veces. El aviso vive afuera, así que
         sobrevive. */
      form.remove();
      mostrar('cot-aviso--bien', 'Recibimos tu consulta',
              ['Te vamos a contestar por el medio que nos dejaste. Gracias.']);
      aviso.setAttribute('tabindex', '-1');
      aviso.focus();

    } catch (e2) {
      mostrar('', 'No pudimos enviar tu consulta',
              ['Puede ser la conexión. Probá de nuevo, o escribinos por WhatsApp.']);
    } finally {
      /* Si salió bien, el botón ya no está en la página. */
      if (boton.isConnected) {
        boton.disabled = false;
        boton.textContent = textoOriginal;
      }
    }
  });

  /* Para los tests */
  global.AUME_COTIZACION = { revisar: revisar };

})(window);
