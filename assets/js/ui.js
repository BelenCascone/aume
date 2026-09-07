/* =====================================================================
   AUMÉ · ui.js
   Todo lo que dibuja en pantalla: menú, promos, plan mensual, productos,
   carrito, paneles y avisos.

   La pantalla de pedidos tiene cuatro vistas ("modos") que se cambian
   desde la barra fija de arriba: por día, promo semanal, plan mensual y
   para sumar. Sólo se dibuja la que está activa.
   ===================================================================== */
(function (global) {
  'use strict';

  var CFG   = global.AUME_CONFIG;
  var MENU  = global.AUME_MENU;
  var Store = global.AUME.Store;

  /* ---------------------------------------------------------- Helpers */

  function el(id) { return document.getElementById(id); }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function plural(n, uno, muchos) { return n === 1 ? uno : muchos; }

  /* La "é" minúscula de Glacial Indifference en negrita viene rota de
     fábrica en la fuente: a tamaños chicos se dibuja como una marquita
     suelta en vez de pegada a la letra (pasa con "César", "Teléfono",
     cualquier palabra con "é"). En el peso normal la misma letra se ve
     bien, así que esa única letra se escribe en ese peso y el resto de
     la palabra sigue en negrita. Se usa en todo texto que puede venir
     del panel (nombre de un producto, de un punto de retiro, etc.). */
  function arreglarE(t) {
    return esc(t).replace(/é/g, '<span class="e-arreglada">é<\/span>');
  }

  /* --------------------------------------------------------- Avisos */

  var toastTimer = null;
  function toast(msg) {
    var t = el('toast');
    t.textContent = msg;
    t.classList.add('toast--on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('toast--on'); }, 2200);
  }

  /* -------------------------------------------- Movimiento al agregar

     Tocar "+" tiene que sentirse como poner algo adentro de una bolsa.
     El punto de color del menú —el mismo que identifica a cada menú en
     las pestañas y en la tarjeta del día— sale del botón que se tocó,
     cae en "Ver pedido", la barra de abajo acusa recibo y el contador
     queda en su número nuevo.

     Es un acuse de recibo, no un espectáculo: dura menos de medio
     segundo y no bloquea nada. Si el navegador no tiene la API de
     animaciones, o la persona pidió menos movimiento en su sistema, el
     vuelo no ocurre y el resto funciona exactamente igual. */

  function sinMovimiento() {
    return !!(global.matchMedia &&
              global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  var timerBarra = null;

  function acusarRecibo() {
    var barra = el('barra');
    if (!barra) return;
    barra.classList.add('barra--suma');
    clearTimeout(timerBarra);
    timerBarra = setTimeout(function () {
      barra.classList.remove('barra--suma');
    }, 420);
  }

  /* `caja` es el rectángulo del botón tomado ANTES de repintar: para
     cuando esto corre, el botón que se tocó ya no está en la página
     (la vista se volvió a dibujar entera). */
  function volarAlPedido(caja, color) {
    var destino = el('btnVerPedido');

    /* Con un panel abierto la barra queda tapada: el número que cambia
       adentro del panel ya es aviso suficiente. */
    if (panelAbierto) return;

    if (!caja || !destino || sinMovimiento() ||
        typeof document.body.animate !== 'function') { acusarRecibo(); return; }

    var fin = destino.getBoundingClientRect();
    var punto = document.createElement('span');
    punto.className = 'vuela';
    punto.style.background = color || '#DC8D43';
    punto.style.left = (caja.left + caja.width / 2 - 9) + 'px';
    punto.style.top  = (caja.top + caja.height / 2 - 9) + 'px';
    document.body.appendChild(punto);

    var dx = (fin.left + fin.width / 2) - (caja.left + caja.width / 2);
    var dy = (fin.top + fin.height / 2) - (caja.top + caja.height / 2);

    /* El punto no viaja en línea recta: sube un poco y después cae. Una
       recta se lee como un archivo que se mueve; el arco, como algo que
       se guarda. */
    var vuelo = punto.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + (dx * 0.5) + 'px,' + (dy * 0.35 - 46) + 'px) scale(1.3)',
        opacity: 1, offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.3)', opacity: .2 }
    ], { duration: 520, easing: 'cubic-bezier(.3,.05,.3,1)', fill: 'forwards' });

    var listo = false;
    function aterrizar() {
      if (listo) return;
      listo = true;
      if (punto.parentNode) punto.parentNode.removeChild(punto);
      acusarRecibo();
    }
    vuelo.onfinish = aterrizar;
    /* Si la pestaña se va a segundo plano, onfinish puede no llegar */
    setTimeout(aterrizar, 1000);
  }

  /* Después de repintar, el control de esa clave es un nodo nuevo. Se lo
     marca acá para que la animación corra sólo en el que cambió y no en
     los otros cuatro días de la pantalla. */
  function marcarContador(contenedor, clave, eraCero) {
    if (!contenedor || sinMovimiento()) return;
    var b = contenedor.querySelector('[data-accion="mas"][data-clave="' + clave + '"]');
    var paso = b && b.closest ? b.closest('.stepper') : null;
    if (!paso) return;
    paso.classList.add(eraCero ? 'stepper--nuevo' : 'stepper--suma');
  }

  /* Cambiar de categoría o de modo reemplaza el contenido de golpe (ver
     app.js). Este nodo (#dias, o la vista que quedó a la vista) no se
     recrea de un cambio a otro, así que la clase .entra no alcanza con
     agregarla: si ya estaba puesta de la vez anterior no dispara de
     nuevo la animación. Se saca, se fuerza el reflow y se vuelve a
     poner —el mismo truco que usa abrirPanel más abajo— y se retira
     sola al terminar para no dejar el nodo "sucio". */
  function reasentar(nodo) {
    if (!nodo || sinMovimiento()) return;
    nodo.classList.remove('entra');
    void nodo.offsetWidth;
    nodo.classList.add('entra');
    nodo.addEventListener('animationend', function fin() {
      nodo.classList.remove('entra');
      nodo.removeEventListener('animationend', fin);
    });
  }

  /* -------------------------------------------------- Aparecer al scrollear

     La landing revela cada bloque cuando entra en pantalla. Acá pasa lo
     mismo con las tarjetas —los días, las promos, los productos—, con
     una diferencia: esas tarjetas las dibuja el JS y se vuelven a
     dibujar al cambiar de menú, así que no alcanza con escribir una
     clase en el HTML.

     Las que ya están en pantalla entran solas, una tras otra (60ms de
     diferencia: se lee como "una después de la otra" sin hacer esperar).
     Las de más abajo esperan a que se llegue hasta ellas.

     Con "menos movimiento" pedido en el sistema, o sin
     IntersectionObserver, no se toca nada: las tarjetas nacen visibles.  */

  var mirada = null;

  function ojo() {
    if (mirada) return mirada;
    if (sinMovimiento() || !('IntersectionObserver' in global)) return null;

    mirada = new global.IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (!entradas[i].isIntersecting) continue;
        mirada.unobserve(entradas[i].target);
        entradas[i].target.classList.add('surge--on');
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    return mirada;
  }

  function revelar(cont) {
    if (!cont || !ojo()) return;

    var hijos = cont.children;
    var alto = global.innerHeight || 800;
    var enPantalla = 0;

    for (var i = 0; i < hijos.length; i++) {
      var n = hijos[i];
      n.classList.add('surge');

      if (n.getBoundingClientRect().top < alto) {
        n.style.transitionDelay = (Math.min(enPantalla, 6) * 0.06) + 's';
        enPantalla++;
        soltar(n);
      } else {
        n.style.transitionDelay = '0s';
        mirada.observe(n);
      }
    }
  }

  /* Dos cuadros de espera para que el navegador alcance a dibujar el
     estado escondido: sin eso no hay transición, hay salto. */
  function soltar(nodo) {
    global.requestAnimationFrame(function () {
      global.requestAnimationFrame(function () { nodo.classList.add('surge--on'); });
    });
  }

  /* ---------------------------------------------- Paneles (bottom sheet) */

  var panelAbierto = null;
  var focoPrevio = null;

  /* En escritorio el pedido vive en la columna de la derecha y no es un
     panel: pedir que se "abra" no tiene sentido, y abrirlo taparía la
     pantalla con un velo por nada. */
  function esLateral(id) {
    var p = el(id);
    return !!(p && p.classList.contains('panel--lateral'));
  }

  function abrirPanel(id) {
    var p = el(id);
    if (!p || esLateral(id)) return;

    /* El carrito se dibuja al abrirlo, no en cada toque de "+": mientras
       está cerrado no hay ningún motivo para rehacerlo, y rehacerlo era
       parte de lo que hacía pesado cada toque. */
    if (id === 'panelCarrito') pintarCarrito();

    focoPrevio = document.activeElement;

    el('velo').hidden = false;
    p.hidden = false;
    /* forzamos reflow para que la transición se vea */
    void p.offsetWidth;
    el('velo').classList.add('velo--on');
    p.classList.add('panel--on');
    document.body.classList.add('sin-scroll');
    panelAbierto = id;

    var foco = p.querySelector('input, select, textarea, button');
    if (foco) setTimeout(function () { foco.focus({ preventScroll: true }); }, 260);
  }

  function cerrarPanel() {
    if (!panelAbierto) return;
    var p = el(panelAbierto);
    p.classList.remove('panel--on');
    el('velo').classList.remove('velo--on');
    document.body.classList.remove('sin-scroll');

    setTimeout(function () {
      p.hidden = true;
      el('velo').hidden = true;
    }, 300);

    panelAbierto = null;
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus({ preventScroll: true });
  }

  /* ------------------------------------------------- Bloques estáticos */

  function pintarEstaticos() {
    el('semanaLabel').textContent = MENU.semana || '';

    var nota = el('semanaNota');
    if (MENU.nota) { nota.textContent = MENU.nota; nota.hidden = false; }
    else { nota.hidden = true; }

    el('envioDesc').textContent =
      CFG.envio.zonas.map(function (z) {
        return z.nombre + ': ' + Store.plata(z.costo);
      }).join(' · ') + '. ' + CFG.envio.aclaracion;

    el('promoDesc').textContent =
      'Elegí cuántos días de la semana querés y te armamos las viandas. ' +
      'Llevan el envío bonificado' +
      (CFG.packs.descuentoEfectivo
        ? ' y ' + CFG.packs.descuentoEfectivo + ' de descuento pagando en efectivo.'
        : '.');

    var pm = CFG.planMensual || {};
    el('mensualDesc').textContent =
      (pm.almuerzos ? pm.almuerzos + ' almuerzos para todo el mes' : 'Todo el mes resuelto') +
      (pm.descuentoEfectivo ? ', con ' + pm.descuentoEfectivo + ' de descuento pagando en efectivo.' : '.');

    el('puntos').innerHTML = CFG.puntosRetiro.map(function (p) {
      return '' +
        '<div class="punto">' +
          '<p class="punto__n">' + arreglarE(p.nombre) + '</p>' +
          '<p class="punto__d">' + esc(p.direccion) + '</p>' +
          '<p class="punto__h">' +
            p.horarios.map(function (h) { return '<span>' + esc(h) + '</span>'; }).join('') +
          '</p>' +
        '</div>';
    }).join('');

    el('pieDatos').innerHTML =
      esc(CFG.marca.lema) + '<br>' +
      esc(CFG.marca.ciudad) + '<br>' +
      '<a class="pie__a" href="' + esc(CFG.marca.instagramUrl) + '" target="_blank" rel="noopener">@' +
      esc(CFG.marca.instagram) + '</a>';
  }

  /* ----------------------------------------------------------- Tema */

  function aplicarTema() {
    var cat = Store.buscarCategoria(Store.estado.categoria);
    document.body.style.setProperty('--c-activo', cat.color);
    document.body.style.setProperty('--c-activo-suave', cat.colorSuave);
  }

  /* ------------------------------------------------- Modos de pedido */

  var MODOS = [
    { id: 'dia',     nombre: 'Por día',    vista: 'vistaDia' },
    { id: 'promo',   nombre: 'Promos',     vista: 'vistaPromo' },
    { id: 'mensual', nombre: 'Mensual',    vista: 'vistaMensual' },
    { id: 'extras',  nombre: 'Para sumar', vista: 'vistaExtras' }
  ];

  function pintarModos() {
    var activo = Store.estado.modo;

    el('modos').innerHTML = MODOS.map(function (m) {
      return '' +
        '<button type="button" class="modo" data-modo="' + esc(m.id) + '"' +
        ' aria-pressed="' + (m.id === activo) + '">' + esc(m.nombre) + '</button>';
    }).join('');

    MODOS.forEach(function (m) {
      el(m.vista).hidden = m.id !== activo;
    });

    /* Los accesos rápidos por día sólo tienen sentido mirando el menú */
    document.documentElement.classList.toggle('en-dia', activo === 'dia');
  }

  /* -------------------------------------------- Accesos rápidos por día

     Cinco pastillas chiquitas —Lun, Mar, Mié, Jue, Vie— que llevan
     directo a la tarjeta de ese día. Viven en la fila del logo, en el
     lugar que ocupa la semana: aparecen recién cuando se scrollea, que
     es cuando dejan de verse todos los días juntos y empieza a hacer
     falta saltar. Así no cuestan ni un pixel de alto de pantalla.

     Un día cerrado (feriado, o uno que ya pasó) se muestra apagado pero
     lleva igual a su tarjeta: la semana se lee completa.               */

  function pintarDiaNav() {
    var cont = el('dianav');
    if (!cont) return;

    cont.innerHTML = CFG.dias.map(function (d) {
      var cerrado = estadoDia(d.id) !== 'abierto';
      return '' +
        '<button type="button" class="dianav__b' + (cerrado ? ' dianav__b--off' : '') + '"' +
        ' data-ir="' + esc(d.id) + '" aria-label="Ir a ' + esc(d.nombre) + '">' +
          esc(d.nombre.slice(0, 3)) +
        '</button>';
    }).join('');
  }

  /* Marca en los accesos rápidos el día que se está mirando */
  function marcarDiaNav(diaId) {
    var cont = el('dianav');
    if (!cont) return;
    var b = cont.children;
    for (var i = 0; i < b.length; i++) {
      b[i].classList.toggle('dianav__b--aqui', b[i].dataset.ir === diaId);
    }
  }

  /* ---------------------------------------------------------- Tabs */

  function pintarTabs() {
    var activa = Store.estado.categoria;

    el('tabs').innerHTML = CFG.categorias.map(function (c) {
      return '' +
        '<button type="button" role="tab" class="tab" data-cat="' + esc(c.id) + '"' +
        ' id="tab-' + esc(c.id) + '" aria-controls="dias"' +
        ' aria-selected="' + (c.id === activa) + '"' +
        ' style="--c-tab:' + c.color + ';--c-tab-suave:' + c.colorSuave + '">' +
          '<span class="tab__punto" aria-hidden="true"></span>' + esc(c.nombre) +
        '</button>';
    }).join('');

    var cat = Store.buscarCategoria(activa);
    el('tabDesc').textContent = cat.descripcion || '';
    el('dias').setAttribute('aria-labelledby', 'tab-' + activa);
  }

  /* ------------------------------------------------------- Controles
     Un mismo par de controles para todo lo que se agrega al pedido: si
     todavía no hay unidades se ve el botón con el precio; en cuanto hay
     una, se convierte en − 1 +. Todos llevan data-clave, que es lo que
     el store necesita para sumar o restar. */

  function botonAgregar(clave, etiqueta, precioTxt, extraTxt, aria, datos) {
    return '' +
      '<button type="button" class="tamano" data-accion="mas" data-clave="' + esc(clave) + '"' +
      (datos || '') + ' aria-label="' + esc(aria) + '">' +
        '<span class="tamano__g">' + esc(etiqueta) + '</span>' +
        '<span class="tamano__p">' + esc(precioTxt) + '</span>' +
        (extraTxt ? '<span class="tamano__ef">' + esc(extraTxt) + '</span>' : '') +
      '</button>';
  }

  function stepper(clave, n, etiqueta, aria, datos) {
    return '' +
      '<div class="stepper">' +
        '<button type="button" class="stepper__b" data-accion="menos" data-clave="' + esc(clave) + '"' +
        (datos || '') + ' aria-label="Quitar una unidad de ' + esc(aria) + '">&#8722;</button>' +
        '<span class="stepper__c">' +
          '<span class="stepper__n">' + n + '</span>' +
          '<span class="stepper__l">' + esc(etiqueta) + '</span>' +
        '</span>' +
        '<button type="button" class="stepper__b" data-accion="mas" data-clave="' + esc(clave) + '"' +
        (datos || '') + ' aria-label="Agregar una unidad de ' + esc(aria) + '">+</button>' +
      '</div>';
  }

  /* Con qué se dibujó el control de cada clave. Se guarda al dibujarlo
     para poder volver a dibujar ESE control solo —y no la pantalla
     entera— cuando cambia su cantidad. Ver repintarClave(). */
  var fichas = {};

  function control(clave, etiqueta, precioTxt, extraTxt, aria, datos, etiquetaStepper) {
    fichas[clave] = {
      etiqueta: etiqueta, precioTxt: precioTxt, extraTxt: extraTxt,
      aria: aria, datos: datos, etiquetaStepper: etiquetaStepper
    };
    return dibujarControl(clave);
  }

  function dibujarControl(clave) {
    var f = fichas[clave];
    if (!f) return '';
    var n = Store.cantidadDeClave(clave);
    if (n === 0) {
      return botonAgregar(clave, f.etiqueta, f.precioTxt, f.extraTxt, 'Agregar ' + f.aria, f.datos);
    }
    return stepper(clave, n, f.etiquetaStepper || f.etiqueta, f.aria, f.datos);
  }

  /* ------------------------------------------------- Repintado parcial

     Tocar "+" cambia UNA línea del pedido. Hasta acá eso rehacía con
     innerHTML la vista entera: los cinco días, sus veinte botones y el
     carrito, en cada toque. En una compu no se nota; en el celular de
     cinco años con el que la mayoría va a pedir, sí.

     Ahora se cambia sólo lo que cambió: el control de esa clave (esté
     donde esté), el globito de cuántas hay de ese día y la barra de
     abajo. El resto de la pantalla no se toca, así que no hay que
     volver a medirla ni a dibujarla.

     Si por algún motivo el control no está en pantalla (se cambió de
     vista, llegó un menú nuevo), devuelve false y quien llama rehace
     todo como antes: nunca queda una pantalla a medias.              */

  function ranuraDe(nodo) {
    if (!nodo || !nodo.closest) return null;
    if (nodo.closest('#carritoContenido')) return null;   /* el carrito va aparte */
    return nodo.classList.contains('tamano') ? nodo : nodo.closest('.stepper');
  }

  function repintarClave(clave) {
    if (!fichas[clave]) return false;

    var nodos = document.querySelectorAll('[data-clave="' + clave + '"]');
    var ranuras = [];
    for (var i = 0; i < nodos.length; i++) {
      var r = ranuraDe(nodos[i]);
      if (r && ranuras.indexOf(r) < 0) ranuras.push(r);
    }
    if (!ranuras.length) return false;

    var html = dibujarControl(clave);
    for (var j = 0; j < ranuras.length; j++) {
      var molde = document.createElement('div');
      molde.innerHTML = html;
      var nuevo = molde.firstElementChild;
      if (nuevo && ranuras[j].parentNode) ranuras[j].parentNode.replaceChild(nuevo, ranuras[j]);
    }

    /* Si era una vianda, el día también lleva la cuenta arriba */
    var partes = String(clave).split('|');
    if (partes[0] === 'vianda') actualizarDia(partes[1]);
    return true;
  }

  /* El globito con cuántas viandas hay de ese día. Cuenta la categoría
     que se está mirando y la opción fija, igual que al dibujar. */
  function actualizarDia(diaId) {
    var tarjeta = document.querySelector('#dias .dia[data-dia="' + diaId + '"]');
    var cab = tarjeta ? tarjeta.querySelector('.dia__cab') : null;
    if (!cab) return;

    var catId = Store.estado.categoria;
    var n = 0;
    CFG.tamanos.forEach(function (t) {
      n += Store.cantidadDe(diaId, catId, t.id);
      if (CFG.extraFijo) n += Store.cantidadDe(diaId, CFG.extraFijo.id, t.id);
    });

    var globo = cab.querySelector('.dia__n');
    if (!n) {
      if (globo && globo.parentNode) globo.parentNode.removeChild(globo);
      return;
    }
    if (!globo) {
      globo = document.createElement('span');
      globo.className = 'dia__n';
      cab.appendChild(globo);
    }
    if (globo.textContent !== String(n)) {
      globo.textContent = n;
      if (!sinMovimiento()) {
        globo.classList.remove('dia__n--cambia');
        void globo.offsetWidth;
        globo.classList.add('dia__n--cambia');
      }
    }
  }

  /* ------------------------------------------------------ Días / menú */

  /* Los botones de vianda llevan además día, menú y tamaño sueltos: son
     los que usa app.js para devolver el foco después de repintar. */
  function controlesTamano(d, catId) {
    return CFG.tamanos.map(function (t) {
      var clave = Store.claveVianda(d.id, catId, t.id);
      var datos = ' data-dia="' + esc(d.id) + '" data-cat="' + esc(catId) + '"' +
                  ' data-tam="' + esc(t.id) + '"';
      return control(
        clave, t.gramos, Store.plata(Store.precio(t.id)), '',
        d.nombre + ' ' + t.nombre + ' ' + t.gramos, datos
      );
    }).join('');
  }

  /* La opción fija va en TODOS los días, mires la categoría que mires */
  function bloqueFijo(d) {
    var f = CFG.extraFijo;
    if (!f) return '';

    return '' +
      '<div class="fijo" style="--c-fijo:' + esc(f.color) + '">' +
        '<p class="fijo__t">' + arreglarE(f.nombre) +
          '<span class="fijo__cab">todos los días</span></p>' +
        '<div class="tamanos">' + controlesTamano(d, f.id) + '</div>' +
      '</div>';
  }

  /* Lo que dijo la API sobre esta semana: qué fecha es cada día, cuáles
     son feriado y qué día es hoy. Vacío mientras la API no responda. */
  var semanaApi = { fechas: {}, feriados: {}, hoy: null };

  /* Un día se cierra cuando ya pasó: si hoy es miércoles, el lunes de
     esta semana ya no se puede pedir. La fecha de "hoy" la manda el
     servidor, no el celular: el reloj del cliente puede estar en
     cualquier lado, y de eso depende que se cobre o no una vianda. */
  function estadoDia(diaId) {
    if (semanaApi.feriados[diaId]) return 'feriado';
    var fecha = semanaApi.fechas[diaId];
    if (fecha && semanaApi.hoy && fecha < semanaApi.hoy) return 'pasado';
    return 'abierto';
  }

  /* Tarjeta de un día que no se puede pedir. Sin botones: la única forma
     de que no se sume algo que no se puede entregar es no ofrecerlo. */
  function diaCerrado(abre, cabecera, motivo, detalle) {
    return '' +
      '<article class="dia dia--cerrado"' + abre + '>' + cabecera +
        '<div class="dia__cuerpo">' +
          '<p class="dia__plato">' + esc(motivo) + '</p>' +
          '<p class="dia__desc">' + esc(detalle) + '</p>' +
        '</div>' +
      '</article>';
  }

  function pintarDias() {
    var catId = Store.estado.categoria;

    el('dias').innerHTML = CFG.dias.map(function (d) {
      var p = Store.plato(d.id, catId);

      /* Cuenta lo del día completo: la categoría activa y la opción fija */
      var enDia = 0;
      CFG.tamanos.forEach(function (t) {
        enDia += Store.cantidadDe(d.id, catId, t.id);
        if (CFG.extraFijo) enDia += Store.cantidadDe(d.id, CFG.extraFijo.id, t.id);
      });

      /* Qué menú es esta tarjeta ya lo dice el color de la banda (y la
         pestaña de arriba, que sigue elegida): repetirlo en cada día
         era decir lo mismo tres veces. */
      var cabecera = '' +
        '<div class="dia__cab">' +
          '<h3 class="dia__nombre">' + esc(d.nombre) + '</h3>' +
          (enDia ? '<span class="dia__n">' + enDia + '</span>' : '') +
        '</div>';

      var abre = ' data-dia="' + esc(d.id) + '"';

      var estado = estadoDia(d.id);
      if (estado === 'feriado') {
        return diaCerrado(abre, cabecera, 'Feriado',
          'Este día no cocinamos. Volvemos al día siguiente.');
      }
      if (estado === 'pasado') {
        return diaCerrado(abre, cabecera, 'Ya pasó',
          'Este día ya no se puede pedir. Elegí uno de los que vienen.');
      }

      if (!p) {
        return '' +
          '<article class="dia"' + abre + '>' + cabecera +
            '<div class="dia__cuerpo">' +
              '<p class="dia__vacio">Esta semana no hay opción ' +
              esc(Store.buscarCategoria(catId).nombre.toLowerCase()) + ' para este día.</p>' +
              bloqueFijo(d) +
            '</div>' +
          '</article>';
      }

      var etiquetas = (p.etiquetas && p.etiquetas.length)
        ? '<div class="etiquetas">' + p.etiquetas.map(function (e) {
            return '<span class="etiqueta">' + esc(e) + '</span>';
          }).join('') + '</div>'
        : '';

      return '' +
        '<article class="dia"' + abre + '>' + cabecera +
          '<div class="dia__cuerpo">' +
            '<p class="dia__plato">' + esc(p.nombre) + '</p>' +
            (p.descripcion ? '<p class="dia__desc">' + esc(p.descripcion) + '</p>' : '') +
            etiquetas +
            '<div class="tamanos">' + controlesTamano(d, catId) + '</div>' +
            bloqueFijo(d) +
          '</div>' +
        '</article>';
    }).join('');

    revelar(el('dias'));
    pintarDiaNav();
  }

  /* --------------------------------------------- Promos y plan mensual
     En los packs y en el plan mensual no se elige plato por plato, sólo
     el tamaño: qué tipo de menú prefiere se habla por WhatsApp con la
     secretaria al coordinar la entrega, así que todo pack o plan entra
     al pedido con la preferencia "combinada" por defecto. */

  function lineaEfectivo(pr) {
    if (!pr || pr.efectivo >= pr.lista) return '';
    return 'Efectivo ' + Store.plata(pr.efectivo);
  }

  /* Un solo control no necesita media fila vacía al lado */
  function grillaTamanos(controles) {
    return '<div class="tamanos' + (controles.length === 1 ? ' tamanos--sola' : '') +
           '">' + controles.join('') + '</div>';
  }

  function pintarPacks() {
    var pref = Store.prefPorDefecto();

    el('packs').innerHTML = (CFG.packs.opciones || []).map(function (pk) {
      var botones = CFG.tamanos.filter(function (t) {
        return !!Store.precioPack(pk.id, t.id);
      }).map(function (t) {
        var pr = Store.precioPack(pk.id, t.id);
        return control(
          Store.clavePack(pk.id, t.id, pref),
          t.gramos, Store.plata(pr.lista), lineaEfectivo(pr),
          pk.nombre + ' ' + t.gramos
        );
      });

      return '' +
        '<article class="oferta">' +
          '<div class="oferta__cab">' +
            '<h3 class="oferta__t">' + esc(pk.nombre) + '</h3>' +
            (CFG.packs.envioBonificado
              ? '<span class="oferta__badge">Envío bonificado</span>' : '') +
          '</div>' +
          '<p class="oferta__d">' + pk.dias + ' viandas para la semana, una por día.</p>' +
          grillaTamanos(botones) +
        '</article>';
    }).join('');

    revelar(el('packs'));
  }

  function pintarPlan() {
    var pm = CFG.planMensual;
    var cont = el('planMensual');

    if (!pm) { cont.innerHTML = ''; return; }

    var pref = Store.prefPorDefecto();
    var botones = CFG.tamanos.filter(function (t) {
      return !!Store.precioPlan(t.id);
    }).map(function (t) {
      var pr = Store.precioPlan(t.id);
      return control(
        Store.clavePlan(t.id, pref),
        t.gramos, Store.plata(pr.lista), lineaEfectivo(pr),
        'Plan mensual ' + t.gramos
      );
    });

    /* Si todavía no hay ningún tamaño con precio publicado, lo decimos en
       vez de mostrar una tarjeta sin forma de pedir. */
    if (!botones.length) {
      cont.innerHTML =
        '<article class="oferta"><p class="oferta__d">' +
        'El plan de este mes todavía no está publicado. Escribinos por WhatsApp y te lo pasamos.' +
        '</p></article>';
      return;
    }

    cont.innerHTML = '' +
      '<article class="oferta">' +
        '<div class="oferta__cab">' +
          '<h3 class="oferta__t">Plan ' + esc(pm.mes || 'mensual') + '</h3>' +
          (pm.envioBonificado ? '<span class="oferta__badge">Envío bonificado</span>' : '') +
        '</div>' +
        '<p class="oferta__d">' +
          (pm.almuerzos ? pm.almuerzos + ' almuerzos, de lunes a viernes todo el mes. ' : '') +
          (pm.envioBonificado ? '' : 'El envío se cobra por entrega.') +
        '</p>' +
        grillaTamanos(botones) +
      '</article>';

    revelar(cont);
  }

  /* ------------------------------------------------------ Para sumar */

  function grupos() {
    var def = CFG.gruposProducto || [];
    var usados = {};
    var salida = [];

    def.forEach(function (g) {
      var prods = (CFG.productos || []).filter(function (p) { return p.grupo === g.id; });
      prods.forEach(function (p) { usados[p.id] = true; });
      if (prods.length) salida.push({ grupo: g, productos: prods });
    });

    /* Lo que no cayó en ningún grupo conocido (por ejemplo, algo cargado
       desde el panel) igual se muestra: mejor eso que esconderlo. */
    var sueltos = (CFG.productos || []).filter(function (p) { return !usados[p.id]; });
    if (sueltos.length) {
      salida.push({ grupo: { id: 'otros', nombre: 'Otros', descripcion: '' }, productos: sueltos });
    }
    return salida;
  }

  function pintarExtras() {
    var bloques = grupos();
    var cont = el('extras');

    if (!bloques.length) {
      cont.innerHTML = '<p class="vista__d">Por ahora no hay productos cargados.</p>';
      return;
    }

    cont.innerHTML = bloques.map(function (b) {
      return '' +
        '<section class="grupo">' +
          '<h3 class="grupo__t">' + esc(b.grupo.nombre) + '</h3>' +
          (b.grupo.descripcion ? '<p class="grupo__d">' + esc(b.grupo.descripcion) + '</p>' : '') +
          '<div class="productos">' + b.productos.map(function (p) {
            var clave = Store.claveExtra(p.id);
            return '' +
              '<div class="producto">' +
                '<div class="producto__info">' +
                  '<p class="producto__t">' + arreglarE(p.nombre) + '</p>' +
                  (p.detalle ? '<p class="producto__d">' + esc(p.detalle) + '</p>' : '') +
                '</div>' +
                '<div class="producto__ctrl">' +
                  control(clave, 'Agregar', Store.plata(p.precio), '', p.nombre,
                          '', p.nombre.length > 14 ? 'unidades' : p.nombre) +
                '</div>' +
              '</div>';
          }).join('') + '</div>' +
        '</section>';
    }).join('');

    revelar(cont);
  }

  /* ------------------------------------------------- Barra inferior */

  /* Texto corto de lo que hay en el pedido: "3 viandas · 1 promo" */
  function resumenCorto(t) {
    var p = t.porTipo;
    var partes = [];
    if (p.vianda) partes.push(p.vianda + ' ' + plural(p.vianda, 'vianda', 'viandas'));
    if (p.pack)   partes.push(p.pack + ' ' + plural(p.pack, 'promo', 'promos'));
    if (p.plan)   partes.push(p.plan + ' ' + plural(p.plan, 'plan mensual', 'planes mensuales'));
    if (p.extra)  partes.push(p.extra + ' ' + plural(p.extra, 'producto', 'productos'));
    return partes.join(' · ');
  }

  /* La barra está siempre: es el único acceso al pedido desde que el
     botón salió de la barra de arriba. Con el pedido vacío lo dice y el
     botón lleva igual al panel, que explica cómo empezar. */
  function pintarBarra() {
    var t = Store.totales();
    var barra = el('barra');
    var vacio = t.cantidad === 0;

    barra.classList.toggle('barra--vacia', vacio);
    el('barraN').textContent = vacio ? 'Tu pedido está vacío' : resumenCorto(t);
    el('barraT').textContent = vacio ? 'Elegí lo que quieras sumar' : Store.plata(t.total);

    /* Cuántas cosas hay, en un globito sobre el botón. Va como atributo
       y lo dibuja el CSS: no hace falta un nodo más ni tocar el HTML. */
    var b = el('btnVerPedido');
    if (b) {
      if (vacio) b.removeAttribute('data-n');
      else b.setAttribute('data-n', t.cantidad);
    }
  }

  /* ------------------------------------------------- Panel carrito */

  function filaTotales(t) {
    var envio, etiquetaEnvio = 'Envío';

    if (t.esRetiro) {
      envio = '<span class="total-fila__gratis">Retiro en punto</span>';
    } else if (t.envioBonificado) {
      envio = '<span class="total-fila__gratis">Bonificado</span>';
    } else {
      if (t.zona) etiquetaEnvio = 'Envío · ' + t.zona.nombre;
      envio = '<span>' + Store.plata(t.envio) + '</span>';
    }

    var efectivo = t.ahorroEfectivo > 0
      ? '<div class="total-fila total-fila__ef"><span>Pagando en efectivo</span><span>' +
        Store.plata(t.totalEfectivo) + '</span></div>'
      : '';

    return '' +
      '<div class="totales">' +
        '<div class="total-fila"><span>Subtotal</span><span>' + Store.plata(t.subtotal) + '</span></div>' +
        '<div class="total-fila"><span>' + esc(etiquetaEnvio) + '</span>' + envio + '</div>' +
        '<div class="total-fila total-fila--big"><span>Total</span><span>' +
          Store.plata(t.total) + '</span></div>' +
        efectivo +
      '</div>';
  }

  function pintarCarrito() {
    var lista = Store.items();
    var t = Store.totales();
    var cont = el('carritoContenido');

    if (!lista.length) {
      cont.innerHTML = '' +
        '<div class="vacio">' +
          '<p class="vacio__t">Tu pedido está vacío</p>' +
          '<p class="vacio__d">Elegí tus viandas del menú semanal, una promo, ' +
          'el plan mensual o algo para sumar, y aparecen acá.</p>' +
        '</div>';
      el('carritoPie').hidden = true;
      return;
    }

    cont.innerHTML =
      '<div class="items">' + lista.map(function (it) {
        var segunda, tercera;

        if (it.tipo === 'vianda') {
          segunda = arreglarE(it.plato ? it.plato.nombre : it.categoria.nombre);
          /* La Ensalada César se llama igual que su categoría: repetirla
             en las dos líneas queda a la vista y no aporta nada. */
          var meta = it.plato && it.plato.nombre === it.categoria.nombre
            ? it.tamano.gramos
            : it.detalle;
          tercera = esc(meta) + ' · ' + Store.plata(it.precio) + ' c/u';
        } else {
          segunda = arreglarE(it.detalle);
          tercera = Store.plata(it.precio) + ' c/u';
        }

        return '' +
          '<div class="item' + (it.tipo === 'vianda' ? '' : ' item--otro') +
            '" style="--c-it:' + esc(it.color) + '">' +
            '<div class="item__info">' +
              '<p class="item__d">' + arreglarE(it.titulo) + '</p>' +
              '<p class="item__p">' + segunda + '</p>' +
              '<p class="item__m">' + tercera + '</p>' +
            '</div>' +
            '<div class="item__ctrl">' +
              '<button type="button" class="item__b" data-accion="menos"' +
                ' data-clave="' + esc(it.clave) + '" aria-label="Quitar una unidad">&#8722;</button>' +
              '<span class="item__n">' + it.cantidad + '</span>' +
              '<button type="button" class="item__b" data-accion="mas"' +
                ' data-clave="' + esc(it.clave) + '" aria-label="Agregar una unidad">+</button>' +
            '</div>' +
            '<span class="item__sub">' + Store.plata(it.subtotal) + '</span>' +
          '</div>';
      }).join('') + '</div>' +
      filaTotales(t) +
      '<button type="button" class="btn btn--fantasma btn--bloque btn--vaciar" ' +
      'id="btnVaciar" data-armado="0">Vaciar pedido</button>';

    el('carritoPie').hidden = false;
  }

  /* ------------------------------------------------------------ Export */

  /* ============================================================ API
     PRECIOS DESDE EL PANEL
     -------------------------------------------------------------------
     Hasta acá, todo lo de arriba lee de assets/js/data/config.js. Ahora
     los precios los edita la nutri desde /admin/precios/ y viven en la
     base, así que los pedimos a /api/precios y los mezclamos ENCIMA de
     la config estática.

     Esa mezcla es a propósito y en ese orden:

     · Si la API responde, manda la base.
     · Si no responde (worker caído, sin internet, la API todavía no
       existe), la web se queda con los valores de config.js y sigue
       funcionando igual. config.js pasa a ser el respaldo, no la fuente
       de verdad.

     Por eso NUNCA se vacía nada: sólo se pisa lo que llegó completo y
     con forma válida. Una respuesta rara deja la web como estaba.
     ================================================================= */

  /* Arrancan apenas carga el script, para no esperar al DOM */
  function traer(ruta) {
    if (typeof fetch !== 'function') return null;
    return fetch(ruta, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { return (c && c.ok === true && c.datos) ? c.datos : null; })
      .catch(function () { return null; });
  }

  var promesaPrecios = traer('/api/precios');
  var promesaMenu    = traer('/api/menus');

  function lista(v) { return Array.isArray(v) && v.length ? v : null; }

  function aplicarPrecios(d) {
    if (!d) return false;
    var cambio = false;

    /* Precio de la vianda: sólo tamaños que ya existen y con número */
    if (d.preciosVianda) {
      Object.keys(CFG.preciosVianda).forEach(function (id) {
        var n = d.preciosVianda[id];
        if (typeof n === 'number' && n >= 0) { CFG.preciosVianda[id] = n; cambio = true; }
      });
    }

    /* Envío por zona: se actualiza el costo de las zonas que ya están.
       No agregamos ni sacamos zonas desde acá: el carrito guardado en el
       celular referencia una zona por id y no queremos invalidarlo. */
    if (d.envio) {
      var zonas = lista(d.envio.zonas);
      if (zonas) {
        zonas.forEach(function (z) {
          var actual = Store.buscarZona(z.id);
          if (actual && typeof z.costo === 'number' && z.costo >= 0) {
            actual.costo = z.costo; cambio = true;
          }
        });
      }
      if (typeof d.envio.aclaracion === 'string' && d.envio.aclaracion) {
        CFG.envio.aclaracion = d.envio.aclaracion; cambio = true;
      }
    }

    var packs = d.packs && lista(d.packs.opciones);
    if (packs) {
      CFG.packs.opciones = packs;
      if (typeof d.packs.envioBonificado === 'boolean') CFG.packs.envioBonificado = d.packs.envioBonificado;
      if (d.packs.descuentoEfectivo) CFG.packs.descuentoEfectivo = d.packs.descuentoEfectivo;
      cambio = true;
    }
    if (d.planMensual && d.planMensual.precios) { CFG.planMensual = d.planMensual; cambio = true; }
    /* La API devuelve también los productos sin precio definido, porque
       el panel los necesita para podérselo poner. Acá se filtran: en la
       web no va nada que todavía no tenga precio. */
    var productos = lista(d.productos);
    if (productos) {
      CFG.productos = productos.filter(function (p) { return p.activo !== false; });
      cambio = true;
    }

    return cambio;
  }

  /* Este archivo se carga ANTES que app.js, así que cuando lleguen los
     precios puede que la app todavía no haya arrancado. Esperamos a que
     el DOM esté listo y el Store exista antes de repintar. */
  function cuandoArranco(fn) {
    if (document.readyState !== 'loading' && global.AUME && global.AUME.Store) {
      setTimeout(fn, 0);
      return;
    }
    setTimeout(function () { cuandoArranco(fn); }, 30);
  }

  /* --- Menú de la semana ------------------------------------------
     Lo que la nutri publica desde /admin/menus/ reemplaza a
     assets/js/data/menu.js. Misma regla que con los precios: si no
     llega un menú publicado, se muestra el del archivo. */
  function aplicarMenu(d) {
    /* platos en null = no hay ningún día publicado para esta semana.
       Ojo con no confundirlo con {}: eso sería una semana publicada
       pero sin platos, y tampoco la queremos mostrar. */
    if (!d || !d.platos || !Object.keys(d.platos).length) return false;

    MENU.platos = d.platos;
    if (d.semana) MENU.semana = d.semana;
    if (typeof d.nota === 'string') MENU.nota = d.nota;

    semanaApi = {
      fechas: d.fechas || {},
      feriados: d.feriados || {},
      hoy: d.hoy || null
    };
    return true;
  }

  /* Si cambió el menú, puede que el carrito guardado en el celular tenga
     viandas de platos que ya no existen. store.js limpia eso al
     restaurar, pero para entonces todavía teníamos el menú del archivo.
     Las sacamos ahora, usando el mismo camino que el botón "−". */
  function limpiarCarritoViejo() {
    /* Se van tanto las viandas de platos que ya no existen como las de
       días cerrados: alguien pudo dejar el carrito armado el domingo y
       volver el miércoles. Lo que no es vianda (promos, plan mensual,
       productos) no depende del menú de la semana y se queda. */
    var sobrantes = Store.items().filter(function (it) {
      return it.tipo === 'vianda' && (!it.plato || estadoDia(it.diaId) !== 'abierto');
    });
    sobrantes.forEach(function (it) {
      Store.sumarClave(it.clave, -it.cantidad);
    });
    return sobrantes.length;
  }

  /* Cuando llegan los datos, repintamos. avisar() hace que app.js
     redibuje todo lo que depende del estado (tarjetas, barra, carrito y
     el resumen del checkout) sin que haya que tocar app.js. */
  function escucharApi() {
    if (!promesaPrecios && !promesaMenu) return;

    /* Esperamos a los dos y repintamos UNA sola vez: si no, la web
       parpadearía dos veces seguidas con datos a medio actualizar. */
    Promise.all([
      promesaPrecios || Promise.resolve(null),
      promesaMenu || Promise.resolve(null)
    ]).then(function (r) {
      var cambio = aplicarPrecios(r[0]);
      var cambioMenu = aplicarMenu(r[1]);
      if (!cambio && !cambioMenu) return;

      cuandoArranco(function () {
        try {
          pintarEstaticos();
          if (cambioMenu) {
            var sacadas = limpiarCarritoViejo();
            if (sacadas) toast('Actualizamos el menú y sacamos lo que ya no se puede pedir');
          }
          global.AUME.Store.avisar();
        } catch (e) { /* si falla el repintado, quedan los datos de los archivos */ }
      });
    });
  }

  /* Arranca solo: no hace falta tocar app.js para engancharlo. */
  escucharApi();

  global.AUME.UI = {
    el: el,
    escucharApi: escucharApi,
    esc: esc,
    plural: plural,
    toast: toast,
    volarAlPedido: volarAlPedido,
    marcarContador: marcarContador,
    reasentar: reasentar,
    revelar: revelar,
    repintarClave: repintarClave,
    actualizarDia: actualizarDia,
    pintarDiaNav: pintarDiaNav,
    marcarDiaNav: marcarDiaNav,
    esLateral: esLateral,
    abrirPanel: abrirPanel,
    cerrarPanel: cerrarPanel,
    panelActivo: function () { return panelAbierto; },
    pintarEstaticos: pintarEstaticos,
    aplicarTema: aplicarTema,
    pintarModos: pintarModos,
    pintarTabs: pintarTabs,
    pintarDias: pintarDias,
    pintarPacks: pintarPacks,
    pintarPlan: pintarPlan,
    pintarExtras: pintarExtras,
    pintarBarra: pintarBarra,
    pintarCarrito: pintarCarrito,
    filaTotales: filaTotales,
    resumenCorto: resumenCorto,
    arreglarE: arreglarE
  };

})(window);
