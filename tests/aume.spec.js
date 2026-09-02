const { test, expect } = require('@playwright/test');

/* Estado real de la app */
const totales = (page) => page.evaluate(() => window.AUME.Store.totales());

/* Cada tarjeta de día muestra la categoría activa Y la opción fija (Ensalada
   César), así que hay dos botones por tamaño: siempre decimos cuál. */
async function botonDia(page, accion, dia, tam, cat) {
  const catId = cat || await page.evaluate(() => window.AUME.Store.estado.categoria);
  return page.locator(
    '#dias [data-accion="' + accion + '"][data-dia="' + dia + '"]' +
    '[data-cat="' + catId + '"][data-tam="' + tam + '"]'
  );
}

/** Suma N viandas del día/tamaño indicados desde las tarjetas del menú. */
async function sumar(page, dia, tam, n, cat) {
  const btn = await botonDia(page, 'mas', dia, tam, cat);
  for (let i = 0; i < (n || 1); i++) await btn.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/pedido/');
  await page.waitForFunction(() => window.AUME && window.AUME.Store);
  await page.evaluate(() => window.AUME.Store.vaciar());
});

/* ------------------------------------------------------------- Marca */

test.describe('Identidad de marca', () => {

  test('el logo carga en la barra superior y en el pie', async ({ page }) => {
    for (const sel of ['.marca__img', '.pie__logo']) {
      const img = page.locator(sel);
      await expect(img).toBeVisible();
      // naturalWidth 0 = imagen rota
      expect(await img.evaluate((n) => n.naturalWidth), sel).toBeGreaterThan(0);
      await expect(img).toHaveAttribute('src', /logo\.png$/);
    }
  });

  test('los íconos de la PWA existen', async ({ page }) => {
    const rutas = [
      '/assets/img/favicon-64.png',
      '/assets/img/icon-192.png',
      '/assets/img/icon-512.png',
      '/assets/img/icon-maskable-512.png'
    ];
    for (const ruta of rutas) {
      const r = await page.request.get(ruta);
      expect(r.status(), ruta).toBe(200);
    }
  });

  test('cada categoría pinta su color de marca', async ({ page }) => {
    const esperado = {
      clasico: 'rgb(217, 120, 56)',
      vegetariano: 'rgb(62, 122, 94)',
      proteico: 'rgb(155, 122, 162)',
      ensalada: 'rgb(91, 155, 151)'
    };

    for (const cat of Object.keys(esperado)) {
      await page.locator('.tab[data-cat="' + cat + '"]').click();

      const rgb = await page.evaluate(() => {
        const token = getComputedStyle(document.body)
          .getPropertyValue('--c-activo').trim();
        const d = document.createElement('div');
        d.style.color = token;
        document.body.appendChild(d);
        const v = getComputedStyle(d).color;
        d.remove();
        return v;
      });

      expect(rgb, cat).toBe(esperado[cat]);
    }
  });
});

/* Las cuatro pestañas se pintan de su color aunque no estén elegidas:
   si van todas grises no se distingue un menú del otro sin tocarlos. */
test('cada menú se distingue por su color aunque no esté elegido', async ({ page }) => {
  /* Con "Clásico" activo, miramos el color de las otras tres */
  const colores = await page.evaluate(() => {
    return [].map.call(document.querySelectorAll('.tab'), function (t) {
      const cs = getComputedStyle(t);
      return {
        cat: t.dataset.cat,
        elegida: t.getAttribute('aria-selected') === 'true',
        texto: cs.color,
        borde: cs.borderTopColor,
        fondo: cs.backgroundColor
      };
    });
  });

  expect(colores).toHaveLength(4);

  const sinElegir = colores.filter((c) => !c.elegida);
  const bordes = sinElegir.map((c) => c.borde);
  expect(new Set(bordes).size, 'las pestañas sin elegir comparten el mismo color')
    .toBe(sinElegir.length);

  /* Y ninguna se queda con el gris de las líneas (#E8E0D4) */
  for (const c of sinElegir) {
    expect(c.borde, c.cat + ' sigue gris').not.toBe('rgb(232, 224, 212)');
  }
});

/* --------------------------------------------------------- Responsive */

test.describe('Responsive', () => {

  test('las 4 categorías se ven completas en celular', async ({ page }, info) => {
    test.skip(info.project.name !== 'celular', 'sólo aplica al viewport móvil');

    await expect(page.locator('.tab')).toHaveCount(4);
    const ancho = page.viewportSize().width;

    for (const cat of ['clasico', 'vegetariano', 'proteico', 'ensalada']) {
      const caja = await page.locator('.tab[data-cat="' + cat + '"]').boundingBox();
      expect(caja, 'falta la pestaña ' + cat).not.toBeNull();
      expect(caja.x, cat + ' se sale por la izquierda').toBeGreaterThanOrEqual(0);
      expect(caja.x + caja.width, cat + ' se sale por la derecha')
        .toBeLessThanOrEqual(ancho);
      expect(caja.height, cat + ' queda muy chica para el dedo')
        .toBeGreaterThanOrEqual(44);
    }
  });

  test('la página no scrollea en horizontal', async ({ page }) => {
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      cliente: document.documentElement.clientWidth
    }));
    expect(m.scroll).toBeLessThanOrEqual(m.cliente + 1);
  });
});

/* -------------------------------------------------------- Publicación */

test.describe('Cabeceras de seguridad', () => {

  test('el sitio se sirve con la CSP del archivo _headers', async ({ page }) => {
    const r = await page.request.get('/');
    const h = r.headers();

    expect(h['content-security-policy'], 'falta la CSP').toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('la web funciona sin violar su propia CSP', async ({ page }) => {
    const violaciones = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) {
        violaciones.push(m.text());
      }
    });

    await page.reload();
    await page.waitForFunction(() => window.AUME && window.AUME.Store);

    /* Dibujar el carrito usa atributos style: es lo que más riesgo tiene */
    await sumar(page, 'lunes', 'estandar', 1);
    await page.locator('#btnVerPedido').click();
    await expect(page.locator('#carritoContenido .item')).toHaveCount(1);

    expect(violaciones, violaciones.join(' | ')).toHaveLength(0);
  });
});

/* ------------------------------------------- Pantalla de pedido rápida
   La pantalla arranca en el menú: no hay hero ni pasos que scrollear
   antes de poder elegir. Y lo que sirve para elegir — el logo, los
   modos de pedido y los 4 tipos de menú — no se va nunca de pantalla. */

test.describe('Acceso rápido al menú', () => {

  test('el menú se ve sin scrollear', async ({ page }) => {
    const alto = page.viewportSize().height;

    /* La primera tarjeta de día tiene que entrar en la primera pantalla */
    const caja = await page.locator('#dias .dia').first().boundingBox();
    expect(caja, 'no hay tarjetas de día').not.toBeNull();
    expect(caja.y, 'hay que scrollear para ver el primer día').toBeLessThan(alto);

    /* Y con él, al menos un botón para agregarlo al pedido */
    const boton = await page.locator('#dias .tamano, #dias .stepper').first().boundingBox();
    expect(boton.y, 'para agregar hay que scrollear').toBeLessThan(alto);
  });

  test('el logo, los modos y los tipos de menú quedan fijos al scrollear', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(400);

    for (const sel of ['.marca__img', '#modos', '#tabs']) {
      const caja = await page.locator(sel).boundingBox();
      expect(caja, sel + ' desapareció').not.toBeNull();
      expect(caja.y, sel + ' se fue de pantalla al scrollear').toBeLessThan(200);
      expect(caja.y + caja.height, sel + ' quedó arriba del borde').toBeGreaterThan(0);
    }
  });

  test('la barra del pedido queda fija abajo, con pedido o sin él', async ({ page }) => {
    const alto = page.viewportSize().height;

    for (const scroll of [0, 1500]) {
      await page.evaluate((y) => window.scrollTo(0, y), scroll);
      await page.waitForTimeout(350);
      const caja = await page.locator('#barra').boundingBox();
      expect(caja, 'la barra no está').not.toBeNull();
      expect(caja.y + caja.height, 'la barra no está pegada abajo')
        .toBeGreaterThan(alto - 2);
    }
  });

  test('el logo vuelve al principio del menú', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(300);

    await page.locator('a.marca').click();
    await page.waitForTimeout(900);

    expect(await page.evaluate(() => window.pageYOffset),
      'el logo no llevó de vuelta arriba').toBeLessThan(10);
  });
});

/* ------------------------------------------------- Reglas de negocio */

test.describe('Envío y promoción', () => {

  test('el envío se cobra según la zona elegida', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 4);

    await page.evaluate(() => window.AUME.Store.setZona('dentro'));
    let t = await totales(page);
    expect(t.cantidad).toBe(4);
    expect(t.envio).toBe(2000);
    expect(t.zona.nombre).toBe('Dentro de bulevares');
    expect(t.total).toBe(t.subtotal + 2000);

    await page.evaluate(() => window.AUME.Store.setZona('fuera'));
    t = await totales(page);
    expect(t.envio).toBe(2500);
    expect(t.total).toBe(t.subtotal + 2500);
  });

  /* El envío bonificado por cantidad ya no existe: quedó sólo en los packs */
  test('las viandas sueltas siempre pagan envío, sean las que sean', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 6);
    const t = await totales(page);
    expect(t.cantidad).toBe(6);
    expect(t.envio).toBeGreaterThan(0);
    await expect(page.locator('#progreso')).toBeHidden();
  });

  test('la vianda vale lo mismo en todas las categorías', async ({ page }) => {
    const precios = await page.evaluate(() => {
      const S = window.AUME.Store;
      return {
        estandar: S.precio('estandar'),
        xl: S.precio('xl')
      };
    });
    expect(precios.estandar).toBe(9000);
    expect(precios.xl).toBe(12800);
  });

  test('retirar en un punto nunca cobra envío', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 2);
    await page.evaluate(() => window.AUME.Store.setModalidad('retiro'));
    const t = await totales(page);
    expect(t.esRetiro).toBe(true);
    expect(t.envio).toBe(0);
  });
});

test('los 3 puntos de retiro están con dirección y horario exactos', async ({ page }) => {
  const puntos = [
    ['Local AUMÉ', 'San Martín 499', ['12:00 a 14:00 hs']],
    ['Oxymarket', 'Blas Parera 3308', ['12:30 a 13:30 hs', '17:00 a 21:00 hs']],
    ['Pastelería Mes Amies', 'Shopping La Paz', ['Desde las 12:00 hs']]
  ];

  const bloque = page.locator('#puntos');
  await expect(bloque.locator('.punto__n')).toHaveCount(3);

  for (const [nombre, direccion, horarios] of puntos) {
    const tarjeta = bloque.locator('.punto', { hasText: nombre });
    await expect(tarjeta, nombre).toBeVisible();
    await expect(tarjeta, nombre + ' · dirección').toContainText(direccion);
    for (const h of horarios) {
      await expect(tarjeta, nombre + ' · ' + h).toContainText(h);
    }
  }
});

/* --------------------------------------------------------- Carrito */

test.describe('Carrito', () => {

  test('sumar y restar actualiza el contador', async ({ page }) => {
    await sumar(page, 'martes', 'xl', 2);
    await expect(page.locator('#barraN')).toContainText('2 viandas');

    await (await botonDia(page, 'menos', 'martes', 'xl')).click();
    await expect(page.locator('#barraN')).toContainText('1 vianda');
  });

  /* La Ensalada César está disponible todos los días, se mire la categoría
     que se mire, y convive con el menú del día sin pisarlo. */
  test('la Ensalada César se puede pedir cualquier día y en cualquier menú', async ({ page }) => {
    for (const cat of ['clasico', 'proteico']) {
      await page.locator('.tab[data-cat="' + cat + '"]').click();
      await expect(page.locator('#dias .fijo').first()).toContainText('Ensalada César');
      await expect(page.locator('#dias .fijo')).toHaveCount(5);
    }

    await sumar(page, 'jueves', 'estandar', 1, 'cesar');
    await sumar(page, 'jueves', 'estandar', 1, 'proteico');

    const items = await page.evaluate(() =>
      window.AUME.Store.items().map((i) => i.catId + '|' + i.cantidad));
    expect(items.sort()).toEqual(['cesar|1', 'proteico|1']);
    await expect(page.locator('#barraN')).toContainText('2 viandas');
  });

  test('"Vaciar pedido" pide confirmación y recién ahí vacía', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 3);
    await page.locator('#btnVerPedido').click();

    const btn = page.locator('#btnVaciar');
    await expect(btn).toBeVisible();

    /* Primer toque: sólo arma el botón */
    await btn.click();
    await expect(btn).toHaveAttribute('data-armado', '1');
    await expect(btn).toContainText(/de nuevo/i);
    expect((await totales(page)).cantidad, 'vació sin confirmar').toBe(3);

    /* Segundo toque: ahora sí */
    await page.locator('#btnVaciar').click();
    expect((await totales(page)).cantidad).toBe(0);

    /* La barra no se va: queda fija abajo diciendo que está vacío */
    await expect(page.locator('#barra')).toBeVisible();
    await expect(page.locator('#barraN')).toContainText('vacío');
  });

  test('el pedido sobrevive al recargar la página', async ({ page }) => {
    await sumar(page, 'miercoles', 'estandar', 2);
    await page.reload();
    await page.waitForFunction(() => window.AUME && window.AUME.Store);
    expect((await totales(page)).cantidad).toBe(2);
  });
});

/* -------------------------------------------------------- Checkout */

test.describe('Checkout', () => {

  async function irAlCheckout(page) {
    await page.locator('#btnVerPedido').click();
    await page.locator('#btnIrCheckout').click();
    await expect(page.locator('#panelCheckout')).toBeVisible();
  }

  /* El radio real está oculto (opacity:0 / pointer-events:none) detrás del
     círculo dibujado: como cualquier persona, tocamos la etiqueta. */
  async function elegirOpcion(page, contenedor, valor) {
    const input = page.locator('#' + contenedor + ' input[value="' + valor + '"]');
    await page.locator('#' + contenedor + ' label.op', {
      has: page.locator('input[value="' + valor + '"]')
    }).click();
    await expect(input, 'no quedó marcada la opción ' + valor).toBeChecked();
  }

  async function completarRetiro(page, nombre, tel, punto) {
    await page.locator('#fNombre').fill(nombre);
    await page.locator('#fTel').fill(tel);
    await elegirOpcion(page, 'opsModalidad', 'retiro');
    await elegirOpcion(page, 'opsPunto', punto);
    await page.locator('#fPago').selectOption({ index: 1 });
  }

  test('no deja confirmar sin los datos obligatorios', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 1);
    await irAlCheckout(page);

    await page.locator('#btnWhatsapp').click();

    /* El panel sigue abierto y el pedido no se envió */
    await expect(page.locator('#panelCheckout')).toBeVisible();
    await expect(page.locator('#planB')).toBeHidden();
  });

  /* Regresión: el mensaje usa "*Campo:*" como estructura, así que el texto
     libre del cliente no puede contener saltos de línea ni asteriscos, o
     podría agregar un TOTAL o un Pago falsos al final del pedido. */
  test('el texto del cliente no puede falsificar líneas del pedido', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 1);
    await irAlCheckout(page);
    await completarRetiro(page, 'Ana Pérez', '3434000111', 'base');

    await page.locator('#fNotas').fill('sin sal\n*TOTAL:* $ 0\n*Pago:* YA ABONADO');

    const texto = await page.evaluate(() => window.AUME.Checkout.armarMensaje());
    const lineas = texto.split('\n');

    expect(lineas.filter((l) => l.startsWith('*TOTAL:*')),
      'se coló un TOTAL falso').toHaveLength(1);
    expect(lineas.filter((l) => l.startsWith('*Pago:*')),
      'se coló un Pago falso').toHaveLength(1);

    /* La aclaración real tiene que seguir llegando */
    expect(texto).toContain('sin sal');
  });

  test('arma el mensaje de WhatsApp con el pedido completo', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 5);
    await irAlCheckout(page);
    await completarRetiro(page, 'María González', '3434123456', 'oximarket');

    const texto = await page.evaluate(() => window.AUME.Checkout.armarMensaje());

    expect(texto).toContain('María González');
    expect(texto).toContain('3434123456');
    expect(texto).toContain('Oxymarket');
    expect(texto).toContain('Blas Parera 3308');
    expect(texto).toMatch(/lunes/i);
  });

  /** Reemplaza window.open antes de que cargue la app y recarga. */
  async function simularVentana(page, abre) {
    await page.addInitScript((abre) => {
      window.__urlAbierta = null;
      window.open = function (url) {
        window.__urlAbierta = url;
        return abre ? { opener: null, closed: false, focus: function () {} } : null;
      };
    }, abre);
    await page.reload();
    await page.waitForFunction(() => window.AUME && window.AUME.Store);
    await page.evaluate(() => window.AUME.Store.vaciar());
  }

  test('si WhatsApp abre, la web no se va a ninguna parte', async ({ page }) => {
    await simularVentana(page, true);

    await sumar(page, 'lunes', 'estandar', 1);
    await irAlCheckout(page);
    await completarRetiro(page, 'Ana Pérez', '3434000111', 'base');
    await page.locator('#btnWhatsapp').click();

    const abierta = await page.evaluate(() => window.__urlAbierta);
    expect(abierta, 'no abrió WhatsApp').toContain('wa.me');
    expect(decodeURIComponent(abierta)).toContain('Ana Pérez');

    /* El bug era éste: además de abrir la pestaña, se llevaba la de AUMÉ */
    expect(page.url(), 'la web se fue a WhatsApp').toContain('localhost');
    await expect(page.locator('#panelCheckout')).toBeVisible();
  });

  test('si WhatsApp no abre, queda el resumen para copiar', async ({ page }) => {
    await simularVentana(page, false);

    await sumar(page, 'lunes', 'estandar', 1);
    await irAlCheckout(page);
    await completarRetiro(page, 'Ana Pérez', '3434000111', 'base');
    await page.locator('#btnWhatsapp').click();

    /* Lo importante: la web NO se va, así el resumen sigue en pantalla */
    expect(page.url(), 'la web se fue y se perdió el resumen').toContain('localhost');

    await expect(page.locator('#planB')).toBeVisible();
    await expect(page.locator('#planBTexto')).toContainText('Ana Pérez');
    await expect(page.locator('#btnCopiar')).toBeVisible();

    /* Y queda un enlace real, que ningún bloqueador de pop-ups frena */
    const link = page.locator('#btnAbrirWa');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  });
});


/* ------------------------------------------- Promos, mensual y extras
   Las tres formas de pedir que no son "una vianda de un día". Comparten
   el mismo carrito, la misma barra y el mismo mensaje de WhatsApp. */

/** Cambia de modo desde la barra fija de arriba. */
async function irAModo(page, modo) {
  await page.locator('.modo[data-modo="' + modo + '"]').click();
  await expect(page.locator('.modo[data-modo="' + modo + '"]'))
    .toHaveAttribute('aria-pressed', 'true');
}

test.describe('Promos semanales', () => {

  test('los 3 packs se ofrecen con su precio de lista y el de efectivo', async ({ page }) => {
    await irAModo(page, 'promo');

    await expect(page.locator('#vistaDia')).toBeHidden();
    await expect(page.locator('#packs .oferta')).toHaveCount(3);

    for (const pack of ['x5', 'x4', 'x3']) {
      const botones = page.locator('#packs [data-clave^="pack|' + pack + '|"]');
      expect(await botones.count(), 'falta el pack ' + pack).toBeGreaterThan(0);
    }

    /* El precio publicado y el de efectivo, los dos a la vista */
    const x5 = page.locator('#packs [data-clave="pack|x5|estandar|combinado"]');
    await expect(x5).toContainText('45.000');
    await expect(x5).toContainText('40.500');
  });

  test('un pack entra al pedido con el envío bonificado', async ({ page }) => {
    await irAModo(page, 'promo');
    await page.locator('#packs [data-clave="pack|x5|estandar|combinado"]').click();

    const t = await totales(page);
    expect(t.cantidad).toBe(1);
    expect(t.subtotal).toBe(45000);
    expect(t.envio, 'la promo tiene que llevar el envío bonificado').toBe(0);
    expect(t.envioBonificado).toBe(true);
    expect(t.total).toBe(45000);
    /* 10% pagando en efectivo, con el precio publicado tal cual */
    expect(t.totalEfectivo).toBe(40500);
    expect(t.ahorroEfectivo).toBe(4500);
  });

  test('el tipo de menú elegido viaja con la promo', async ({ page }) => {
    await irAModo(page, 'promo');

    await page.locator('#packs select[data-pref="x3"]').selectOption('vegetariano');
    await page.locator('#packs [data-clave="pack|x3|xl|vegetariano"]').click();

    const items = await page.evaluate(() => window.AUME.Store.items());
    expect(items).toHaveLength(1);
    expect(items[0].tipo).toBe('pack');
    expect(items[0].prefId).toBe('vegetariano');
    expect(items[0].detalle).toContain('Vegetariano');
  });

  /* Las viandas sueltas siguen pagando envío: eso no lo cambia la promo */
  test('una vianda suelta sigue pagando envío', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 3);
    const t = await totales(page);
    expect(t.envio).toBeGreaterThan(0);
    expect(t.envioBonificado).toBe(false);
  });
});

test.describe('Plan mensual', () => {

  test('se puede pedir el plan del mes publicado', async ({ page }) => {
    await irAModo(page, 'mensual');
    await expect(page.locator('#planMensual .oferta')).toHaveCount(1);

    await page.locator('#planMensual [data-clave="plan|mensual|estandar|combinado"]').click();

    const t = await totales(page);
    expect(t.subtotal).toBe(198000);
    expect(t.subtotalEfectivo).toBe(168300);
    /* Hoy el plan mensual SÍ paga envío, igual que en el flyer */
    expect(t.envio).toBeGreaterThan(0);
  });

  test('el tamaño sin precio publicado no se ofrece', async ({ page }) => {
    await irAModo(page, 'mensual');

    /* El XL mensual todavía no tiene precio: no puede haber botón */
    await expect(page.locator('#planMensual [data-clave*="|xl|"]')).toHaveCount(0);
    await expect(page.locator('#planMensual [data-clave*="|estandar|"]')).toHaveCount(1);
  });
});

test.describe('Postres, yogures y congelados', () => {

  test('cada grupo cargado se ve con sus productos', async ({ page }) => {
    await irAModo(page, 'extras');

    const grupos = await page.evaluate(() => {
      const cfg = window.AUME_CONFIG;
      return (cfg.gruposProducto || [])
        .filter((g) => cfg.productos.some((p) => p.grupo === g.id))
        .map((g) => g.nombre);
    });

    expect(grupos.length, 'no hay ningún grupo de productos cargado').toBeGreaterThan(0);
    for (const nombre of grupos) {
      await expect(page.locator('#extras .grupo__t', { hasText: nombre })).toHaveCount(1);
    }

    const cuantos = await page.evaluate(() => window.AUME_CONFIG.productos.length);
    await expect(page.locator('#extras .producto')).toHaveCount(cuantos);
  });

  test('un producto se suma al pedido por su precio', async ({ page }) => {
    await irAModo(page, 'extras');

    const prod = await page.evaluate(() => window.AUME_CONFIG.productos[0]);
    const clave = 'extra|' + prod.id + '|-|-';

    await page.locator('#extras [data-clave="' + clave + '"]').click();
    /* Ya con una unidad, el botón se convirtió en el contador − 1 + */
    await page.locator('#extras [data-accion="mas"][data-clave="' + clave + '"]').click();

    const t = await totales(page);
    expect(t.cantidad).toBe(2);
    expect(t.subtotal).toBe(prod.precio * 2);
    expect(t.porTipo.extra).toBe(2);
  });
});

test.describe('Pedido mixto', () => {

  test('el mensaje de WhatsApp separa viandas, promos y extras', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 1);

    await irAModo(page, 'promo');
    await page.locator('#packs [data-clave="pack|x4|estandar|combinado"]').click();

    await irAModo(page, 'extras');
    const prod = await page.evaluate(() => window.AUME_CONFIG.productos[0]);
    await page.locator('#extras [data-clave="extra|' + prod.id + '|-|-"]').click();

    await page.locator('#btnVerPedido').click();
    await page.locator('#btnIrCheckout').click();
    await page.locator('#fNombre').fill('Ana Pérez');
    await page.locator('#fTel').fill('3434000111');
    await page.locator('#fDireccion').fill('San Martín 499');
    await page.locator('#fPago').selectOption({ index: 1 });

    const texto = await page.evaluate(() => window.AUME.Checkout.armarMensaje());

    expect(texto).toContain('*VIANDAS (1)*');
    expect(texto).toContain('*PROMOS SEMANALES (1)*');
    expect(texto).toContain('*PARA SUMAR (1)*');
    expect(texto).toContain('Pack x4');
    expect(texto).toContain(prod.nombre);
    /* Con una promo adentro, el envío del pedido entero queda bonificado */
    expect(texto).toContain('*Envío:* Bonificado por la promo');
    /* Y sigue habiendo un solo TOTAL */
    expect(texto.split('\n').filter((l) => l.startsWith('*TOTAL:*'))).toHaveLength(1);
  });

  test('la barra de abajo resume lo que hay, sea del tipo que sea', async ({ page }) => {
    await expect(page.locator('#barraN')).toContainText('vacío');

    await sumar(page, 'lunes', 'estandar', 2);
    await irAModo(page, 'promo');
    await page.locator('#packs [data-clave="pack|x3|estandar|combinado"]').click();

    await expect(page.locator('#barraN')).toContainText('2 viandas');
    await expect(page.locator('#barraN')).toContainText('1 promo');
    await expect(page.locator('#barraT')).toContainText('45.000');
  });
});

/* ------------------------------------------------------------ Diseño */

test('no quedan emojis en la pantalla', async ({ page }) => {
  const buscar = () => page.evaluate(() => {
    const re = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u;
    const malas = [];
    document.querySelectorAll('body *').forEach((n) => {
      if (n.children.length) return;
      const t = (n.textContent || '').trim();
      if (re.test(t)) malas.push(n.className + ': ' + t.slice(0, 40));
    });
    return malas;
  });

  for (const modo of ['dia', 'promo', 'mensual', 'extras']) {
    await page.locator('.modo[data-modo="' + modo + '"]').click();
    expect(await buscar(), 'modo ' + modo).toHaveLength(0);
  }

  /* Y también adentro del pedido y del checkout */
  await page.locator('.modo[data-modo="dia"]').click();
  await sumar(page, 'lunes', 'estandar', 1);
  await page.locator('#btnVerPedido').click();
  expect(await buscar(), 'panel del pedido').toHaveLength(0);

  await page.locator('#btnIrCheckout').click();
  expect(await buscar(), 'checkout').toHaveLength(0);
});
