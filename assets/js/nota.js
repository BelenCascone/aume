/* =====================================================================
   AUMÉ · assets/js/nota.js
   La página de tips y recetas: /tips/

   UNA PÁGINA CON DOS CARAS
   ---------------------------------------------------------------------
   · /tips/            · la grilla con todo lo publicado.
   · /tips/?nota=<id>  · esa nota sola, para leerla o compartirla.

   Son la misma página a propósito: así el link de una nota se puede
   mandar por WhatsApp y el que lo abre, al terminar, ya está parado en
   el lugar donde está el resto.

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

  /* El color de marca pinta la barrita de la tarjeta; el oscuro escribe
     el nombre de la categoría. Es la misma regla de toda la paleta
     (ver assets/css/styles.css). */
  var TIPOS = {
    tip:       { nombre: 'Tip',              color: 'var(--c-clasico)',     texto: 'var(--c-clasico-dark)' },
    receta:    { nombre: 'Receta',           color: 'var(--c-vegetariano)', texto: 'var(--c-vegetariano-dark)' },
    nutricion: { nombre: 'Info nutricional', color: 'var(--c-proteico)',    texto: 'var(--c-proteico-dark)' }
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

  /* Con ?nota= en la dirección se lee UNA nota: la grilla se va, para
     que la página no sea la lista y la nota una debajo de la otra. */
  function esconderGrilla() {
    var grilla = el('grilla');
    if (grilla) grilla.hidden = true;
  }

  function pintar(p) {
    var caja = el('nota');
    caja.textContent = '';

    var volver = nodo('a', 'nota__volver', 'Volver a los tips');
    volver.href = './';
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
    mas.href = './';
    pie.appendChild(mas);
    caja.appendChild(pie);

    document.title = p.titulo + ' · AUMÉ';

    el('estado').hidden = true;
    caja.hidden = false;
  }

  /* ---------------------------------------------------------- Grilla

     Las tarjetas de todo lo publicado. Se arman con createElement y
     textContent, igual que la nota: lo que se carga desde el panel se
     muestra como texto y nunca como marcado.

     Sin publicaciones la grilla no se dibuja vacía: queda el cartel de
     #estado explicando que todavía no hay nada. */

  function fechaCorta(iso) {
    if (!iso || iso.length < 10) return '';
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var mes = meses[Number(iso.slice(5, 7)) - 1] || '';
    return Number(iso.slice(8, 10)) + ' ' + mes + ' ' + iso.slice(0, 4);
  }

  function tarjeta(p) {
    var tipo = TIPOS[p.categoria] || TIPOS.tip;

    var a = nodo('a', 'tip');
    a.href = '?nota=' + encodeURIComponent(p.id);
    a.style.setProperty('--tip-color', tipo.color);
    a.style.setProperty('--tip-color-texto', tipo.texto);

    if (p.imagen) {
      var marco = nodo('div', 'tip__foto');
      var img = document.createElement('img');
      img.src = p.imagen;
      img.alt = p.imagenAlt || '';
      img.loading = 'lazy';
      marco.appendChild(img);
      a.appendChild(marco);
    } else {
      a.appendChild(nodo('div', 'tip__barra'));
    }

    var cuerpo = nodo('div', 'tip__cuerpo');

    var meta = nodo('p', 'tip__meta');
    meta.appendChild(nodo('span', 'tip__tipo', tipo.nombre));
    if (p.fecha) meta.appendChild(nodo('span', 'tip__fecha', fechaCorta(p.fecha)));
    cuerpo.appendChild(meta);

    cuerpo.appendChild(nodo('h2', 'tip__t', p.titulo));
    if (p.copete) cuerpo.appendChild(nodo('p', 'tip__d', p.copete));
    cuerpo.appendChild(nodo('span', 'tip__ir', 'Leer'));

    a.appendChild(cuerpo);
    return a;
  }

  function pintarGrilla(publicaciones) {
    var caja = el('tips-lista');
    if (!caja) return;

    caja.textContent = '';

    if (!publicaciones || !publicaciones.length) {
      mostrarEstado('Todavía no hay publicaciones. Volvé en unos días.');
      return;
    }

    publicaciones.forEach(function (p) { caja.appendChild(tarjeta(p)); });
    el('estado').hidden = true;
  }

  function pintarPie() {
    var caja = el('pieDatos');
    if (!caja) return;
    var marca = CFG.marca || {};
    var filas = [];
    if (marca.ciudad) filas.push(nodo('p', null, marca.ciudad));
    if (marca.lema)   filas.push(nodo('p', null, marca.lema));
    if (CFG.whatsapp) {
      var pw = document.createElement('p');
      var aw = nodo('a', null, 'Escribinos por WhatsApp');
      aw.href = 'https://wa.me/' + CFG.whatsapp + '?text=' +
                encodeURIComponent('Hola AUMÉ, quería hacerles una consulta.');
      aw.target = '_blank';
      aw.rel = 'noopener';
      pw.appendChild(aw);
      filas.push(pw);
    }
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

  async function traerGrilla() {
    try {
      var r = await fetch('/api/publicaciones?limite=24', { credentials: 'same-origin' });
      var c = await r.json();
      if (!r.ok || !c || c.ok !== true || !c.datos) throw new Error('respuesta inesperada');
      pintarGrilla(c.datos.publicaciones);
    } catch (e) {
      mostrarEstado('No pudimos traer las publicaciones. Probá de nuevo en un momento.');
    }
  }

  async function traerNota(id) {
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

  function iniciar() {
    pintarPie();

    var id = new URLSearchParams(location.search).get('nota');
    if (id) {
      esconderGrilla();
      traerNota(id);
    } else {
      traerGrilla();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* Para los tests: las publicaciones sólo existen en la base, así que
     sin exponer esto la única forma de probar las tarjetas sería
     levantar el worker. */
  global.AUME_TIPS = { pintar: pintar, pintarGrilla: pintarGrilla };

})(window);
