/* =====================================================================
   AUMÉ · store.js
   Estado de la aplicación: carrito, categoría activa y totales.
   No toca el DOM: sólo datos. Avisa a quien se suscriba cuando cambia.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG   = global.AUME_CONFIG;
  var MENU  = global.AUME_MENU;
  var CLAVE = 'aume_pedido_v1';

  /* ---------------------------------------------------------- Utilidades */

  var fmtMoneda = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });

  function plata(n) { return fmtMoneda.format(n || 0); }

  function buscarCategoria(id) {
    for (var i = 0; i < CFG.categorias.length; i++) {
      if (CFG.categorias[i].id === id) return CFG.categorias[i];
    }
    return null;
  }

  function buscarDia(id) {
    for (var i = 0; i < CFG.dias.length; i++) {
      if (CFG.dias[i].id === id) return CFG.dias[i];
    }
    return null;
  }

  function buscarTamano(id) {
    for (var i = 0; i < CFG.tamanos.length; i++) {
      if (CFG.tamanos[i].id === id) return CFG.tamanos[i];
    }
    return null;
  }

  function buscarPunto(id) {
    for (var i = 0; i < CFG.puntosRetiro.length; i++) {
      if (CFG.puntosRetiro[i].id === id) return CFG.puntosRetiro[i];
    }
    return null;
  }

  /* Devuelve el plato del día/categoría, o null si ese día no hay opción */
  function plato(diaId, catId) {
    var delDia = MENU.platos && MENU.platos[diaId];
    if (!delDia) return null;
    return delDia[catId] || null;
  }

  function precio(catId, tamId) {
    var cat = buscarCategoria(catId);
    if (!cat || !cat.precios) return 0;
    return cat.precios[tamId] || 0;
  }

  function clave(diaId, catId, tamId) { return diaId + '|' + catId + '|' + tamId; }

  /* ------------------------------------------------------------- Estado */

  var estado = {
    categoria: CFG.categorias[0].id,
    /* carrito: { "lunes|clasico|estandar": 2, ... } */
    carrito: {},
    modalidad: 'envio',      /* 'envio' | 'retiro' */
    punto: null              /* id del punto de retiro elegido */
  };

  var oyentes = [];

  function suscribir(fn) { oyentes.push(fn); }
  function avisar() {
    guardar();
    for (var i = 0; i < oyentes.length; i++) oyentes[i](estado);
  }

  /* -------------------------------------------------------- Persistencia */

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({
        semana: MENU.semana,
        carrito: estado.carrito,
        categoria: estado.categoria,
        modalidad: estado.modalidad,
        punto: estado.punto
      }));
    } catch (e) { /* modo incógnito o storage lleno: seguimos sin persistir */ }
  }

  function restaurar() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      if (!crudo) return;
      var d = JSON.parse(crudo);

      /* Si cambió el menú de la semana, el carrito viejo ya no sirve */
      if (!d || d.semana !== MENU.semana) {
        localStorage.removeItem(CLAVE);
        return;
      }

      /* Sólo aceptamos ítems que sigan existiendo en el menú actual */
      var limpio = {};
      Object.keys(d.carrito || {}).forEach(function (k) {
        var p = k.split('|');
        var cant = parseInt(d.carrito[k], 10);
        if (p.length === 3 && cant > 0 && plato(p[0], p[1]) && buscarTamano(p[2])) {
          limpio[k] = Math.min(cant, 99);
        }
      });
      estado.carrito = limpio;

      if (buscarCategoria(d.categoria)) estado.categoria = d.categoria;
      if (d.modalidad === 'envio' || d.modalidad === 'retiro') estado.modalidad = d.modalidad;
      if (buscarPunto(d.punto)) estado.punto = d.punto;
    } catch (e) {
      try { localStorage.removeItem(CLAVE); } catch (e2) {}
    }
  }

  /* ------------------------------------------------------- Acciones */

  function setCategoria(catId) {
    if (!buscarCategoria(catId) || estado.categoria === catId) return;
    estado.categoria = catId;
    avisar();
  }

  function sumar(diaId, catId, tamId, delta) {
    if (!plato(diaId, catId)) return;
    var k = base(diaId, catId, tamId);
    if (!k) return;
    var actual = estado.carrito[k] || 0;
    var nuevo  = Math.max(0, Math.min(99, actual + delta));
    if (nuevo === 0) delete estado.carrito[k];
    else estado.carrito[k] = nuevo;
    avisar();
  }

  function base(diaId, catId, tamId) {
    if (!buscarDia(diaId) || !buscarCategoria(catId) || !buscarTamano(tamId)) return null;
    return clave(diaId, catId, tamId);
  }

  function cantidadDe(diaId, catId, tamId) {
    return estado.carrito[clave(diaId, catId, tamId)] || 0;
  }

  function vaciar() {
    estado.carrito = {};
    avisar();
  }

  function setModalidad(m) {
    if (m !== 'envio' && m !== 'retiro') return;
    estado.modalidad = m;
    avisar();
  }

  function setPunto(id) {
    estado.punto = buscarPunto(id) ? id : null;
    avisar();
  }

  /* ------------------------------------------------------- Derivados */

  /* Ítems ordenados por día (lunes → viernes) y luego por tamaño */
  function items() {
    var ordenDia = CFG.dias.map(function (d) { return d.id; });
    var ordenTam = CFG.tamanos.map(function (t) { return t.id; });

    return Object.keys(estado.carrito).map(function (k) {
      var p = k.split('|');
      var cat = buscarCategoria(p[1]);
      var tam = buscarTamano(p[2]);
      var pr  = precio(p[1], p[2]);
      var cant = estado.carrito[k];
      return {
        clave: k,
        diaId: p[0],
        dia: buscarDia(p[0]),
        catId: p[1],
        categoria: cat,
        tamanoId: p[2],
        tamano: tam,
        plato: plato(p[0], p[1]),
        cantidad: cant,
        precio: pr,
        subtotal: pr * cant
      };
    }).sort(function (a, b) {
      var d = ordenDia.indexOf(a.diaId) - ordenDia.indexOf(b.diaId);
      if (d !== 0) return d;
      var c = a.catId.localeCompare(b.catId);
      if (c !== 0) return c;
      return ordenTam.indexOf(a.tamanoId) - ordenTam.indexOf(b.tamanoId);
    });
  }

  function totales() {
    var lista = items();
    var cantidad = 0, subtotal = 0;

    lista.forEach(function (it) {
      cantidad += it.cantidad;
      subtotal += it.subtotal;
    });

    var esRetiro    = estado.modalidad === 'retiro';
    var envioGratis = cantidad >= CFG.envio.minimoGratis;
    var costoEnvio  = (esRetiro || envioGratis || cantidad === 0) ? 0 : CFG.envio.costo;
    var faltan      = Math.max(0, CFG.envio.minimoGratis - cantidad);

    return {
      cantidad: cantidad,
      subtotal: subtotal,
      envio: costoEnvio,
      envioGratis: envioGratis,
      esRetiro: esRetiro,
      faltanParaGratis: faltan,
      total: subtotal + costoEnvio
    };
  }

  /* ------------------------------------------------------------ Export */

  global.AUME = global.AUME || {};
  global.AUME.Store = {
    estado: estado,
    suscribir: suscribir,
    avisar: avisar,
    restaurar: restaurar,

    setCategoria: setCategoria,
    sumar: sumar,
    cantidadDe: cantidadDe,
    vaciar: vaciar,
    setModalidad: setModalidad,
    setPunto: setPunto,

    items: items,
    totales: totales,

    plato: plato,
    precio: precio,
    plata: plata,
    buscarCategoria: buscarCategoria,
    buscarDia: buscarDia,
    buscarTamano: buscarTamano,
    buscarPunto: buscarPunto
  };

})(window);
