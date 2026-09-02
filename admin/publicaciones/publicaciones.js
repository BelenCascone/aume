/* =====================================================================
   AUMÉ · admin/publicaciones/publicaciones.js

   El listado de publicaciones y el editor. Es la pantalla que le da
   autonomía a quien maneja las redes: escribe acá y sale en la web, sin
   que nadie toque un archivo ni vuelva a publicar el sitio.

   La foto se sube aparte del texto, apenas se elige el archivo. Así, si
   algo falla al subirla, se ve en el momento y no después de haber
   escrito la nota entera.
   ===================================================================== */
(function () {
  'use strict';

  var el = Panel.el, esc = Panel.esc;

  var TIPOS = {
    tip:       'Tip',
    receta:    'Receta',
    nutricion: 'Info nutricional'
  };

  /* Lo que se está editando. imagen guarda el nombre del archivo que
     devolvió el servidor, no el que eligió el navegador. */
  var editando = null;
  var imagen = '';

  /* ---------------------------------------------------------- Listado */

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function fechaLinda(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  async function cargar() {
    try {
      var datos = await Panel.pedir('/api/publicaciones/panel');
      pintar(datos.publicaciones || []);
      Panel.limpiarAviso(el('aviso'));
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
      el('cargando').hidden = true;
    }
  }

  /* Para editar hace falta la nota entera, y el listado del panel ya la
     trae: la guardamos acá en vez de volver a pedirla al abrir. */
  var porId = {};

  function pintar(lista) {
    el('cargando').hidden = true;
    el('tabla').hidden = false;

    porId = {};
    lista.forEach(function (p) {
      /* La API devuelve la dirección de la imagen; para volver a
         guardarla necesitamos sólo el nombre del archivo. */
      p.imagenArchivo = p.imagen ? p.imagen.split('/').pop() : '';
      porId[p.id] = p;
    });

    if (!lista.length) {
      el('filas').innerHTML =
        '<tr class="empty-row"><td colspan="5" class="vacio-tabla">' +
        'Todavía no hay ninguna publicación. Con "Nueva publicación" cargás la primera.' +
        '</td></tr>';
      return;
    }

    el('filas').innerHTML = lista.map(function (p) {
      var publicada = p.estado === 'publicado';
      return '<tr>' +
        '<td>' +
          '<strong>' + esc(p.titulo) + '</strong>' +
          (p.copete ? '<br><span class="meta">' + esc(p.copete) + '</span>' : '') +
        '</td>' +
        '<td><span class="cat-tag">' + esc(TIPOS[p.categoria] || p.categoria) + '</span></td>' +
        '<td>' + esc(fechaLinda(p.fecha)) + '</td>' +
        '<td><span class="badge ' + (publicada ? 'badge-publicado' : 'badge-borrador') + '">' +
          '<span class="badge-dot"></span>' + (publicada ? 'Publicada' : 'Borrador') +
        '</span></td>' +
        '<td class="row-actions">' +
          '<button type="button" class="btn btn-secondary" data-editar="' + esc(p.id) + '">Editar</button> ' +
          '<button type="button" class="btn btn-secondary" data-borrar="' + esc(p.id) + '">Borrar</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  /* ----------------------------------------------------------- Editor */

  function abrir(pub) {
    editando = pub || null;
    imagen = (pub && pub.imagenArchivo) || '';

    el('dlgTitulo').textContent = pub ? 'Editar publicación' : 'Nueva publicación';
    el('fTitulo').value    = pub ? pub.titulo : '';
    el('fCategoria').value = pub ? pub.categoria : 'tip';
    el('fFecha').value     = pub ? pub.fecha : hoy();
    el('fCopete').value    = pub ? pub.copete : '';
    el('fCuerpo').value    = pub ? pub.cuerpo : '';
    el('fImagenAlt').value = pub ? pub.imagenAlt : '';
    el('fImagen').value    = '';

    mostrarFoto(pub ? pub.imagen : '');
    el('btnPublicar').textContent = (pub && pub.estado === 'publicado')
      ? 'Guardar cambios' : 'Publicar';

    Panel.limpiarAviso(el('dlgAviso'));
    el('dlg').showModal();
    el('fTitulo').focus();
  }

  function mostrarFoto(url) {
    var caja = el('vistaPrevia');
    if (url) {
      el('imgPrevia').src = url;
      caja.hidden = false;
      el('campoAlt').hidden = false;
    } else {
      el('imgPrevia').removeAttribute('src');
      caja.hidden = true;
      el('campoAlt').hidden = true;
    }
  }

  /* La foto se sube apenas se elige, no al guardar: si el bucket no está
     configurado o el archivo no sirve, se entera ahora y no después de
     haber escrito toda la nota. */
  async function subirFoto(archivo) {
    var cuerpo = new FormData();
    cuerpo.append('imagen', archivo);

    el('fImagen').disabled = true;
    try {
      var res = await fetch('/api/publicaciones/imagenes', {
        method: 'POST',
        credentials: 'same-origin',
        body: cuerpo
      });
      var json = await res.json().catch(function () { return null; });

      if (!res.ok || !json || json.ok !== true) {
        var err = (json && json.error) || {};
        throw { mensaje: err.mensaje || 'No se pudo subir la foto.', detalles: err.detalles || [] };
      }

      imagen = json.datos.imagen;
      mostrarFoto(json.datos.url);
      Panel.limpiarAviso(el('dlgAviso'));
      Panel.toast('Foto subida');
    } catch (e) {
      el('fImagen').value = '';
      Panel.mostrarError(el('dlgAviso'), e);
    } finally {
      el('fImagen').disabled = false;
    }
  }

  async function guardar(estado) {
    var cuerpo = {
      titulo:    el('fTitulo').value,
      categoria: el('fCategoria').value,
      fecha:     el('fFecha').value,
      copete:    el('fCopete').value,
      cuerpo:    el('fCuerpo').value,
      imagen:    imagen,
      imagenAlt: el('fImagenAlt').value,
      estado:    estado
    };

    var botones = [el('btnBorrador'), el('btnPublicar')];
    botones.forEach(function (b) { b.disabled = true; });

    try {
      if (editando) {
        await Panel.pedir('/api/publicaciones/' + encodeURIComponent(editando.id),
                          { metodo: 'PUT', cuerpo: cuerpo });
      } else {
        await Panel.pedir('/api/publicaciones', { metodo: 'POST', cuerpo: cuerpo });
      }
      el('dlg').close();
      Panel.toast(estado === 'publicado' ? 'Publicada' : 'Guardada como borrador');
      await cargar();
    } catch (e) {
      Panel.mostrarError(el('dlgAviso'), e);
    } finally {
      botones.forEach(function (b) { b.disabled = false; });
    }
  }

  /* Borrar no tiene vuelta atrás, así que se pregunta. */
  async function borrar(id, titulo) {
    if (!window.confirm('¿Borrar "' + titulo + '"? No se puede deshacer.')) return;
    try {
      await Panel.pedir('/api/publicaciones/' + encodeURIComponent(id), { metodo: 'DELETE' });
      Panel.toast('Publicación borrada');
      await cargar();
    } catch (e) {
      Panel.mostrarError(el('aviso'), e);
    }
  }

  /* ---------------------------------------------------------- Eventos */

  document.addEventListener('DOMContentLoaded', function () {
    el('btnNueva').addEventListener('click', function () { abrir(null); });
    el('dlgCerrar').addEventListener('click', function () { el('dlg').close(); });
    el('dlgCancelar').addEventListener('click', function () { el('dlg').close(); });

    el('btnBorrador').addEventListener('click', function () { guardar('borrador'); });
    el('btnPublicar').addEventListener('click', function () { guardar('publicado'); });

    el('formPub').addEventListener('submit', function (e) { e.preventDefault(); });

    el('fImagen').addEventListener('change', function (e) {
      var archivo = e.target.files && e.target.files[0];
      if (archivo) subirFoto(archivo);
    });

    el('btnQuitarFoto').addEventListener('click', function () {
      imagen = '';
      el('fImagen').value = '';
      el('fImagenAlt').value = '';
      mostrarFoto('');
    });

    el('filas').addEventListener('click', function (e) {
      var editar = e.target.closest('[data-editar]');
      if (editar) { abrir(porId[editar.dataset.editar]); return; }

      var quitar = e.target.closest('[data-borrar]');
      if (quitar) {
        var pub = porId[quitar.dataset.borrar];
        borrar(quitar.dataset.borrar, pub ? pub.titulo : 'esta publicación');
      }
    });

    cargar();
  });
})();
