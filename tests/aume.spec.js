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
  await page.goto('/');
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
    await page.locator('#btnCarrito').click();
    await expect(page.locator('#carritoContenido .item')).toHaveCount(1);

    expect(violaciones, violaciones.join(' | ')).toHaveLength(0);
  });
});

/* -------------------------------------------------- Botones del inicio */

test.describe('Botones del inicio', () => {

  async function saltarA(page, ancla) {
    await page.locator('a[href="#' + ancla + '"]').first().click();
    await page.waitForTimeout(900);
    return {
      y: await page.locator('#' + ancla).evaluate((n) => n.getBoundingClientRect().top),
      barra: await page.locator('.topbar').evaluate((n) => n.offsetHeight),
      scrolleado: await page.evaluate(() => window.pageYOffset)
    };
  }

  test('"Ver el menú" baja hasta el menú, despejado de la barra fija', async ({ page }) => {
    const r = await saltarA(page, 'menu');
    expect(r.scrolleado, 'no se movió').toBeGreaterThan(100);
    expect(r.y, 'el menú quedó tapado por la barra').toBeGreaterThanOrEqual(r.barra - 1);
    expect(r.y, 'quedó demasiado abajo').toBeLessThan(r.barra + 40);
  });

  test('"Envíos y puntos de retiro" baja hasta la sección', async ({ page }) => {
    const r = await saltarA(page, 'retiro');
    expect(r.scrolleado, 'no se movió').toBeGreaterThan(100);
    expect(r.y).toBeGreaterThanOrEqual(r.barra - 1);
    expect(r.y).toBeLessThan(r.barra + 40);
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
    await expect(page.locator('#badgeCarrito')).toHaveText('2');

    await (await botonDia(page, 'menos', 'martes', 'xl')).click();
    await expect(page.locator('#badgeCarrito')).toHaveText('1');
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
    await expect(page.locator('#badgeCarrito')).toHaveText('2');
  });

  test('"Vaciar pedido" pide confirmación y recién ahí vacía', async ({ page }) => {
    await sumar(page, 'lunes', 'estandar', 3);
    await page.locator('#btnCarrito').click();

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
    await expect(page.locator('#barra')).toBeHidden();
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
     libre de la clienta no puede contener saltos de línea ni asteriscos, o
     podría agregar un TOTAL o un Pago falsos al final del pedido. */
  test('el texto de la clienta no puede falsificar líneas del pedido', async ({ page }) => {
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
