/* =====================================================================
   AUMÉ · assets/js/nota.js
   La página de una publicación suelta: /tips/?nota=<id>

   POR QUÉ UNA DIRECCIÓN CON "?"
   ---------------------------------------------------------------------
   El sitio es estático: no hay nada que pueda inventar una carpeta por
   cada nota. Con el parámetro alcanza para lo que importa, que es poder
   compartir el link de una nota sola por WhatsApp.

   El texto llega de la API sin nada de HTML adentro y se escribe con
   textContent. Es a propósito: lo que se carga desde el panel se muestra
   como texto y nunca como marcado, aunque alguien pegue etiquetas.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG = global.AUME_CONFIG || {};

  function el(id) { return document.getElementById(id); }

  var TIPOS = {
    tip:       { nombre: 'Tip',              texto: 'var(--c-clasico-dark)' },
    receta:    { nombre: 'Receta',           texto: 'var(--c-vegetariano-dark)' },
    nutricion: { nombre: 'Info nutricional', texto: 'var(--c-proteico-dark)' }
  };

  function fechaLinda(iso) {
    if (!iso || iso.length < 10) return '';
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var mes = meses[Number(iso.slice(5, 7)) - 1] || '';
    return Number(iso.slice(8, 10)) + ' de ' + mes + ' de ' + iso.slice(0, 4);
  }

  /* Crea un elemento con texto. Nunca innerHTML: ver la nota de arriba. */
  function nodo(etiqueta, clase, texto) {
    var n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function mostrarEstado(mensaje) {
    var estado = el('estado');
    estado.textContent = mensaje;
    estado.hidden = false;
    el('nota').hidden = true;
  }

  function pintar(p) {
    var caja = el('nota');
    caja.textContent = '';

    var volver = nodo('a', 'nota__volver', 'Volver a los tips');
    volver.href = '../#tips';
    caja.appendChild(volver);

    var tipo = TIPOS[p.categoria] || TIPOS.tip;

    var meta = nodo('p', 'nota__meta');
    var etiquetaTipo = nodo('span', null, tipo.nombre);
    etiquetaTipo.style.color = tipo.texto;
    meta.appendChild(etiquetaTipo);
    if (p.fecha) meta.appendChild(nodo('span', 'nota__fecha', fechaLinda(p.fecha)));
    caja.appendChild(meta);

    caja.appendChild(nodo('h1', 'nota__t', p.titulo));
    if (p.copete) caja.appendChild(nodo('p', 'nota__copete', p.copete));

    if (p.imagen) {
      var marco = nodo('div', 'nota__foto');
      var img = document.createElement('img');
      img.src = p.imagen;
      img.alt = p.imagenAlt || '';
      marco.appendChild(img);
      caja.appendChild(marco);
    }

    /* Un renglón en blanco separa párrafos: es como se escribe en el
       panel y es lo único que interpretamos del texto. */
    var cuerpo = nodo('div', 'nota__cuerpo');
    String(p.cuerpo || '').split(/\n\s*\n/).forEach(function (parrafo) {
      var limpio = parrafo.trim();
      if (limpio) cuerpo.appendChild(nodo('p', null, limpio));
    });
    caja.appendChild(cuerpo);

    var pie = nodo('div', 'nota__pie');
    var pedir = nodo('a', 'btn btn--primario', 'Pedir mi vianda');
    pedir.href = '../pedido/index.html';
    pie.appendChild(pedir);
    var mas = nodo('a', 'btn btn--fantasma', 'Ver más tips');
    mas.href = '../#tips';
    pie.appendChild(mas);
    caja.appendChild(pie);

    document.title = p.titulo + ' · AUMÉ';

    el('estado').hidden = true;
    caja.hidden = false;
  }

  function pintarPie() {
    var caja = el('pieDatos');
    if (!caja) return;
    var marca = CFG.marca || {};
    var filas = [];
    if (marca.ciudad) filas.push(nodo('p', null, marca.ciudad));
    if (marca.lema)   filas.push(nodo('p', null, marca.lema));
    if (marca.instagramUrl) {
      var p = document.createElement('p');
      var a = nodo('a', null, '@' + (marca.instagram || 'aume.viandas'));
      a.href = marca.instagramUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      p.appendChild(a);
      filas.push(p);
    }
    filas.forEach(function (f) { caja.appendChild(f); });
  }

  async function iniciar() {
    pintarPie();

    var id = new URLSearchParams(location.search).get('nota');
    if (!id) {
      mostrarEstado('No sabemos qué publicación abrir. Volvé a los tips y elegí una.');
      return;
    }

    try {
      var r = await fetch('/api/publicaciones/' + encodeURIComponent(id),
                          { credentials: 'same-origin' });
      if (r.status === 404) {
        mostrarEstado('Esa publicación no está disponible.');
        return;
      }
      var c = await r.json();
      if (!r.ok || !c || c.ok !== true || !c.datos || !c.datos.publicacion) {
        throw new Error('respuesta inesperada');
      }
      pintar(c.datos.publicacion);
    } catch (e) {
      mostrarEstado('No pudimos traer la publicación. Probá de nuevo en un momento.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  global.AUME_NOTA = { pintar: pintar };

})(window);
