/* =====================================================================
   AUMÉ · store.js
   Estado de la aplicación: carrito, modo de pedido y totales.
   No toca el DOM: sólo datos. Avisa a quien se suscriba cuando cambia.

   QUÉ SE PUEDE PEDIR
   ---------------------------------------------------------------------
   El carrito guarda cuatro clases de línea. Cada una tiene su clave, y
   la clave siempre tiene cuatro partes separadas por "|" para poder
   leerla sin ambigüedad:

     vianda | día      | tipo de menú | tamaño     → una vianda de un día
     pack   | x3/x4/x5 | tamaño       | preferencia → promo semanal
     plan   | mensual  | tamaño       | preferencia → plan del mes
     extra  | producto | -            | -           → postre, yogur, etc.

   "preferencia" es el tipo de menú que el cliente quiere que le armemos
   en un pack o en el plan mensual, donde no elige plato por plato.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG   = global.AUME_CONFIG;
  var MENU  = global.AUME_MENU;

  /* v2: el carrito ahora guarda packs, plan mensual y productos, así que
     las claves viejas (día|menú|tamaño) ya no se entienden. Cambiar el
     nombre hace que los carritos guardados de la versión anterior se
     descarten solos en vez de restaurarse a medias. */
  var CLAVE = 'aume_pedido_v2';

  var MODOS = ['dia', 'promo', 'mensual', 'extras'];

  /* ---------------------------------------------------------- Utilidades */

  var fmtMoneda = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });

  function plata(n) { return fmtMoneda.format(n || 0); }

  var tiene = function (obj, k) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, k);
  };

  function buscarEn(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) {
      if (lista[i].id === id) return lista[i];
    }
    return null;
  }

  /* La opción fija (Ensalada César) se comporta como una categoría más a la
     hora de armar el carrito, aunque no tenga pestaña propia. */
  function buscarCategoria(id) {
    if (CFG.extraFijo && CFG.extraFijo.id === id) return CFG.extraFijo;
    return buscarEn(CFG.categorias, id);
  }

  function buscarZona(id)     { return buscarEn(CFG.envio.zonas, id); }
  function buscarDia(id)      { return buscarEn(CFG.dias, id); }
  function buscarTamano(id)   { return buscarEn(CFG.tamanos, id); }
  function buscarPunto(id)    { return buscarEn(CFG.puntosRetiro, id); }
  function buscarPack(id)     { return buscarEn(CFG.packs && CFG.packs.opciones, id); }
  function buscarProducto(id) { return buscarEn(CFG.productos, id); }

  /* Preferencias de menú para packs y plan mensual: los 4 tipos de menú
     más "Combinado", que va primero porque es la elección por defecto. */
  function preferencias() {
    var lista = [];
    if (CFG.preferenciaCombinada) lista.push(CFG.preferenciaCombinada);
    (CFG.categorias || []).forEach(function (c) {
      lista.push({ id: c.id, nombre: c.nombre, descripcion: c.descripcion, color: c.color });
    });
    return lista;
  }

  function buscarPreferencia(id) { return buscarEn(preferencias(), id); }

  function prefPorDefecto() {
    var p = preferencias();
    return p.length ? p[0].id : 'combinado';
  }

  /* Devuelve el plato del día/categoría, o null si ese día no hay opción.
     La opción fija está disponible todos los días sin cargarla en menu.js. */
  function plato(diaId, catId) {
    if (!buscarDia(diaId)) return null;
    if (CFG.extraFijo && CFG.extraFijo.id === catId) return CFG.extraFijo;

    var platos = MENU.platos;
    if (!tiene(platos, diaId)) return null;
    var delDia = platos[diaId];
    if (!tiene(delDia, catId)) return null;
    return delDia[catId] || null;
  }

  /* El precio de la vianda depende sólo del tamaño: una Clásica y una
     Proteica valen igual. */
  function precio(tamId) {
    return (CFG.preciosVianda && CFG.preciosVianda[tamId]) || 0;
  }

  /* Precio publicado de un pack o del plan mensual para un tamaño.
     Devuelve null si ese tamaño todavía no tiene precio publicado (hoy
     es el caso del plan mensual XL): sin precio no se puede ofrecer. */
  function precioPack(packId, tamId) {
    var p = buscarPack(packId);
    var pr = p && p.precios && p.precios[tamId];
    if (!pr || typeof pr.lista !== 'number') return null;
    return { lista: pr.lista, efectivo: typeof pr.efectivo === 'number' ? pr.efectivo : pr.lista };
  }

  function precioPlan(tamId) {
    var pm = CFG.planMensual;
    var pr = pm && pm.precios && pm.precios[tamId];
    if (!pr || typeof pr.lista !== 'number') return null;
    return { lista: pr.lista, efectivo: typeof pr.efectivo === 'number' ? pr.efectivo : pr.lista };
  }

  /* ------------------------------------------------------------- Claves */

  function clave(tipo, a, b, c) {
    return [tipo, a || '-', b || '-', c || '-'].join('|');
  }

  function claveVianda(diaId, catId, tamId) { return clave('vianda', diaId, catId, tamId); }
  function clavePack(packId, tamId, pref)   { return clave('pack', packId, tamId, pref); }
  function clavePlan(tamId, pref)           { return clave('plan', 'mensual', tamId, pref); }
  function claveExtra(prodId)               { return clave('extra', prodId); }

  /* ------------------------------------------------------------- Estado */

  var estado = {
    modo: 'dia',             /* 'dia' | 'promo' | 'mensual' | 'extras' */
    categoria: CFG.categorias[0].id,
    /* carrito: { "vianda|lunes|clasico|estandar": 2, ... } */
    carrito: {},
    modalidad: 'envio',      /* 'envio' | 'retiro' */
    zona: CFG.envio.zonas[0].id,   /* dentro / fuera de bulevares */
    punto: null              /* id del punto de retiro elegido */
  };

  var oyentes = [];

  function suscribir(fn) { oyentes.push(fn); }

  /* `detalle` cuenta QUÉ cambió, para que quien dibuja no tenga que
     rehacer la pantalla entera por una unidad de más.

       avisar()                              -> cambió algo grande
       avisar({ tipo:'cantidad', clave:k })  -> sólo cambió esa línea

     Quien no lo mire sigue funcionando igual que antes: el estado se
     manda como segundo argumento, como siempre. */
  function avisar(detalle) {
    guardar();
    for (var i = 0; i < oyentes.length; i++) oyentes[i](detalle || null, estado);
  }

  /* -------------------------------------------------------- Persistencia */

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({
        semana: MENU.semana,
        carrito: estado.carrito,
        modo: estado.modo,
        categoria: estado.categoria,
        modalidad: estado.modalidad,
        zona: estado.zona,
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

      /* Sólo aceptamos líneas que sigan existiendo en el catálogo actual */
      var limpio = {};
      Object.keys(d.carrito || {}).forEach(function (k) {
        var cant = parseInt(d.carrito[k], 10);
        if (cant > 0 && armarLinea(k, 1)) limpio[k] = Math.min(cant, 99);
      });
      estado.carrito = limpio;

      if (MODOS.indexOf(d.modo) >= 0) estado.modo = d.modo;
      if (buscarCategoria(d.categoria)) estado.categoria = d.categoria;
      if (d.modalidad === 'envio' || d.modalidad === 'retiro') estado.modalidad = d.modalidad;
      if (buscarZona(d.zona)) estado.zona = d.zona;
      if (buscarPunto(d.punto)) estado.punto = d.punto;
    } catch (e) {
      try { localStorage.removeItem(CLAVE); } catch (e2) {}
    }
  }

  /* --------------------------------------------------------- Líneas
     armarLinea() es el único lugar que sabe leer una clave del carrito.
     Devuelve null si la línea ya no existe en el catálogo (un plato que
     se cayó del menú, un producto que se dio de baja, un tamaño sin
     precio publicado). Todo lo demás se apoya en eso. */

  function armarLinea(k, cantidad) {
    var p = String(k).split('|');
    var tipo = p[0];

    if (tipo === 'vianda') {
      var dia = buscarDia(p[1]);
      var cat = buscarCategoria(p[2]);
      var tam = buscarTamano(p[3]);
      var pl  = plato(p[1], p[2]);
      if (!dia || !cat || !tam || !pl) return null;

      var pv = precio(p[3]);
      return {
        clave: k, tipo: 'vianda', cantidad: cantidad,
        diaId: p[1], dia: dia,
        catId: p[2], categoria: cat,
        tamanoId: p[3], tamano: tam,
        plato: pl,
        titulo: dia.nombre,
        detalle: cat.nombre + ' · ' + tam.gramos,
        color: cat.color,
        precio: pv, precioEfectivo: pv,
        subtotal: pv * cantidad, subtotalEfectivo: pv * cantidad,
        envioBonificado: false
      };
    }

    if (tipo === 'pack') {
      var pack = buscarPack(p[1]);
      var tamP = buscarTamano(p[2]);
      var pref = buscarPreferencia(p[3]);
      if (!pack || !tamP || !pref) return null;
      var pp = precioPack(p[1], p[2]);
      if (!pp) return null;

      return {
        clave: k, tipo: 'pack', cantidad: cantidad,
        packId: p[1], pack: pack,
        tamanoId: p[2], tamano: tamP,
        prefId: p[3], preferencia: pref,
        titulo: pack.nombre,
        detalle: tamP.gramos + ' · ' + pref.nombre,
        color: 'var(--c-clasico)',
        precio: pp.lista, precioEfectivo: pp.efectivo,
        subtotal: pp.lista * cantidad, subtotalEfectivo: pp.efectivo * cantidad,
        envioBonificado: !!(CFG.packs && CFG.packs.envioBonificado)
      };
    }

    if (tipo === 'plan') {
      var pm = CFG.planMensual;
      var tamM = buscarTamano(p[2]);
      var prefM = buscarPreferencia(p[3]);
      if (!pm || !tamM || !prefM) return null;
      var pl2 = precioPlan(p[2]);
      if (!pl2) return null;

      return {
        clave: k, tipo: 'plan', cantidad: cantidad,
        tamanoId: p[2], tamano: tamM,
        prefId: p[3], preferencia: prefM,
        titulo: 'Plan mensual' + (pm.mes ? ' · ' + pm.mes : ''),
        detalle: (pm.almuerzos ? pm.almuerzos + ' almuerzos · ' : '') +
                 tamM.gramos + ' · ' + prefM.nombre,
        color: 'var(--c-proteico)',
        precio: pl2.lista, precioEfectivo: pl2.efectivo,
        subtotal: pl2.lista * cantidad, subtotalEfectivo: pl2.efectivo * cantidad,
        envioBonificado: !!pm.envioBonificado
      };
    }

    if (tipo === 'extra') {
      var prod = buscarProducto(p[1]);
      if (!prod) return null;
      var pe = prod.precio || 0;
      return {
        clave: k, tipo: 'extra', cantidad: cantidad,
        productoId: p[1], producto: prod,
        titulo: prod.nombre,
        detalle: prod.detalle || '',
        color: 'var(--c-ensalada)',
        precio: pe, precioEfectivo: pe,
        subtotal: pe * cantidad, subtotalEfectivo: pe * cantidad,
        envioBonificado: false
      };
    }

    return null;
  }

  /* ------------------------------------------------------- Acciones */

  function setModo(m) {
    if (MODOS.indexOf(m) < 0 || estado.modo === m) return;
    estado.modo = m;
    avisar();
  }

  function setCategoria(catId) {
    if (!buscarCategoria(catId) || estado.categoria === catId) return;
    estado.categoria = catId;
    avisar();
  }

  /* Suma (o resta) unidades de una línea del carrito. Es el único camino
     para tocar el carrito: si la clave no corresponde a algo que se pueda
     pedir hoy, no pasa nada. */
  function sumarClave(k, delta) {
    if (!armarLinea(k, 1)) return;
    var actual = estado.carrito[k] || 0;
    var nuevo  = Math.max(0, Math.min(99, actual + delta));
    if (nuevo === 0) delete estado.carrito[k];
    else estado.carrito[k] = nuevo;
    avisar({ tipo: 'cantidad', clave: k });
  }

  /* Atajos por tipo, para que quien llama no tenga que armar la clave */
  function sumar(diaId, catId, tamId, delta) {
    sumarClave(claveVianda(diaId, catId, tamId), delta);
  }
  function sumarPack(packId, tamId, pref, delta) {
    sumarClave(clavePack(packId, tamId, pref || prefPorDefecto()), delta);
  }
  function sumarPlan(tamId, pref, delta) {
    sumarClave(clavePlan(tamId, pref || prefPorDefecto()), delta);
  }
  function sumarExtra(prodId, delta) {
    sumarClave(claveExtra(prodId), delta);
  }

  function cantidadDeClave(k) { return estado.carrito[k] || 0; }
  function cantidadDe(diaId, catId, tamId) {
    return cantidadDeClave(claveVianda(diaId, catId, tamId));
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

  function setZona(id) {
    if (!buscarZona(id) || estado.zona === id) return;
    estado.zona = id;
    avisar();
  }

  /* ------------------------------------------------------- Derivados */

  /* Orden del pedido: primero las viandas (por día y tamaño), después las
     promos, el plan mensual y al final lo que se suma suelto. Es el mismo
     orden en el que se pide y el mismo en el que se lee en WhatsApp. */
  var ORDEN_TIPO = { vianda: 0, pack: 1, plan: 2, extra: 3 };

  function items() {
    var ordenDia = CFG.dias.map(function (d) { return d.id; });
    var ordenTam = CFG.tamanos.map(function (t) { return t.id; });

    return Object.keys(estado.carrito).map(function (k) {
      return armarLinea(k, estado.carrito[k]);
    }).filter(function (it) {
      return !!it;
    }).sort(function (a, b) {
      var t = ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo];
      if (t !== 0) return t;

      if (a.tipo === 'vianda') {
        var d = ordenDia.indexOf(a.diaId) - ordenDia.indexOf(b.diaId);
        if (d !== 0) return d;
        var c = a.catId.localeCompare(b.catId);
        if (c !== 0) return c;
        return ordenTam.indexOf(a.tamanoId) - ordenTam.indexOf(b.tamanoId);
      }
      return a.clave.localeCompare(b.clave);
    });
  }

  function totales() {
    var lista = items();
    var cantidad = 0, subtotal = 0, subtotalEfectivo = 0;
    var porTipo = { vianda: 0, pack: 0, plan: 0, extra: 0 };
    var bonifica = false;

    lista.forEach(function (it) {
      cantidad += it.cantidad;
      subtotal += it.subtotal;
      subtotalEfectivo += it.subtotalEfectivo;
      porTipo[it.tipo] += it.cantidad;
      if (it.envioBonificado) bonifica = true;
    });

    /* Las viandas sueltas siempre pagan envío. El bonificado lo traen los
       packs semanales: si hay uno en el pedido, esa entrega no se cobra. */
    var esRetiro   = estado.modalidad === 'retiro';
    var zona       = buscarZona(estado.zona);
    var costoEnvio = (esRetiro || cantidad === 0 || bonifica || !zona) ? 0 : zona.costo;

    return {
      cantidad: cantidad,
      porTipo: porTipo,
      subtotal: subtotal,
      subtotalEfectivo: subtotalEfectivo,
      /* Lo que se ahorra pagando en efectivo. Hoy sólo lo traen los packs
         y el plan mensual: en las viandas sueltas los dos precios son el
         mismo y esto queda en cero. */
      ahorroEfectivo: subtotal - subtotalEfectivo,
      envio: costoEnvio,
      envioBonificado: bonifica && !esRetiro && cantidad > 0,
      esRetiro: esRetiro,
      zona: zona,
      total: subtotal + costoEnvio,
      totalEfectivo: subtotalEfectivo + costoEnvio
    };
  }

  /* ------------------------------------------------------------ Export */

  global.AUME = global.AUME || {};
  global.AUME.Store = {
    estado: estado,
    MODOS: MODOS,
    suscribir: suscribir,
    avisar: avisar,
    restaurar: restaurar,

    setModo: setModo,
    setCategoria: setCategoria,
    sumar: sumar,
    sumarPack: sumarPack,
    sumarPlan: sumarPlan,
    sumarExtra: sumarExtra,
    sumarClave: sumarClave,
    cantidadDe: cantidadDe,
    cantidadDeClave: cantidadDeClave,
    vaciar: vaciar,
    setModalidad: setModalidad,
    setPunto: setPunto,
    setZona: setZona,

    items: items,
    totales: totales,

    plato: plato,
    precio: precio,
    precioPack: precioPack,
    precioPlan: precioPlan,
    plata: plata,
    preferencias: preferencias,
    prefPorDefecto: prefPorDefecto,

    claveVianda: claveVianda,
    clavePack: clavePack,
    clavePlan: clavePlan,
    claveExtra: claveExtra,

    buscarCategoria: buscarCategoria,
    buscarDia: buscarDia,
    buscarTamano: buscarTamano,
    buscarPunto: buscarPunto,
    buscarZona: buscarZona,
    buscarPack: buscarPack,
    buscarProducto: buscarProducto,
    buscarPreferencia: buscarPreferencia
  };

})(window);
