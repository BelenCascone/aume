const { test, expect } = require('@playwright/test');

/* =====================================================================
   Tests de la landing (la portada, en "/").

   La pantalla de pedidos tiene los suyos en aume.spec.js. Acá se prueba
   lo que la landing promete: que se entienda qué es AUMÉ, que se pueda
   llegar a pedir desde cualquier parte, y que los datos del negocio que
   muestra sean los reales y no un texto escrito a mano en el HTML.
   ===================================================================== */

/* La configuración se lee de la propia página, que es la que la usa para
   dibujar. Así el test verifica lo que importa: que lo que se ve salga de
   los datos del negocio y no de un texto escrito a mano en el HTML. */
const config = (page) => page.evaluate(() => window.AUME_CONFIG);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AUME_LANDING);
});

/* ------------------------------------------------------------- Marca */

test.describe('Identidad de marca', () => {

  test('el logo carga en la cabecera y en el pie', async ({ page }) => {
    for (const sel of ['.cab__marca img', '.pie-l__marca img']) {
      const img = page.locator(sel);
      await expect(img).toBeVisible();
      // naturalWidth 0 = imagen rota
      expect(await img.evaluate((n) => n.naturalWidth), sel).toBeGreaterThan(0);
      await expect(img).toHaveAttribute('src', /logo\.png$/);
    }
  });

  test('el logo queda fijo arriba al scrollear', async ({ page }) => {
    const cab = page.locator('.cab');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(cab).toBeVisible();
    const caja = await cab.boundingBox();
    expect(caja.y).toBeLessThanOrEqual(1);
  });
});

/* ------------------------------------------------- Llegar a pedir */

test.describe('Camino al pedido', () => {

  test('el botón de la cabecera lleva a la pantalla de pedidos', async ({ page }) => {
    await page.locator('.cab__cta').click();
    await page.waitForURL(/\/pedido\//);
    await expect(page.locator('#dias')).toBeVisible();
  });

  /* Se mira la vista que queda abierta y no Store.estado.modo: el estado
     interno existe desde que carga store.js, o sea antes de que la app
     arranque y lea la dirección, y ahí el test corría una carrera que en
     celular perdía. */
  test('cada forma de pedir abre su parte de la pantalla de pedidos', async ({ page }) => {
    const casos = [
      { texto: 'Elegir por día',      vista: '#vistaDia' },
      { texto: 'Ver las promos',      vista: '#vistaPromo' },
      { texto: 'Ver el plan del mes', vista: '#vistaMensual' },
      { texto: 'Ver para sumar',      vista: '#vistaExtras' }
    ];

    for (const caso of casos) {
      await page.goto('/');
      await page.locator('.forma', { hasText: caso.texto }).click();
      await expect(page.locator(caso.vista), caso.texto).toBeVisible();
    }
  });

  test('el botón de WhatsApp abre el chat con un mensaje escrito', async ({ page }) => {
    const CFG  = await config(page);
    const href = await page.locator('#ctaWhatsapp').getAttribute('href');
    expect(href).toContain('wa.me/' + CFG.whatsapp);
    expect(decodeURIComponent(href)).toContain('AUMÉ');
  });
});

/* --------------------------------------------- Los datos del negocio */

test.describe('Datos del negocio', () => {

  test('muestra el menú de la semana, día por día', async ({ page }) => {
    const CFG  = await config(page);
    const dias = page.locator('.dia');
    await expect(dias).toHaveCount(CFG.dias.length);

    // El primer día tiene que nombrar platos de verdad, no un cartel vacío
    await expect(dias.first().locator('.dia__nombre').first()).not.toBeEmpty();
    await expect(page.locator('#semanaLabel')).not.toBeEmpty();
  });

  test('los cuatro menús se ven con su nombre y su descripción', async ({ page }) => {
    const CFG   = await config(page);
    const tipos = page.locator('.tipo');
    await expect(tipos).toHaveCount(CFG.categorias.length);

    for (const cat of CFG.categorias) {
      const tarjeta = page.locator('.tipo', { hasText: cat.nombre });
      await expect(tarjeta).toBeVisible();
      await expect(tarjeta).toContainText(cat.descripcion);
    }
  });

  test('la opción fija se anuncia como disponible todos los días', async ({ page }) => {
    const CFG = await config(page);
    await expect(page.locator('#fija')).toContainText(CFG.extraFijo.nombre);
    await expect(page.locator('#fija')).toContainText('todos los días');
  });

  test('las zonas de envío se ven con su costo exacto', async ({ page }) => {
    const CFG = await config(page);
    for (const zona of CFG.envio.zonas) {
      const fila = page.locator('.envio__zona', { hasText: zona.nombre });
      await expect(fila).toBeVisible();
      // $2.000 -> el separador de miles lo pone Intl, comparamos por número
      await expect(fila.locator('.envio__costo'))
        .toContainText(String(zona.costo).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    }
  });

  /* Los tres puntos van escritos a mano a propósito, igual que en
     aume.spec.js: es el dato con el que alguien se toma un colectivo. Si
     cambia, el test tiene que fallar y no acompañar el cambio. */
  test('los puntos de retiro están con dirección y horario exactos', async ({ page }) => {
    const puntos = [
      ['Local AUMÉ', 'San Martín 499', ['12:00 a 14:00 hs']],
      ['Oxymarket', 'Blas Parera 3308', ['12:30 a 13:30 hs', '17:00 a 21:00 hs']],
      ['Pastelería Mes Amies', 'Shopping La Paz', ['Desde las 12:00 hs']]
    ];

    await expect(page.locator('.punto-l')).toHaveCount(puntos.length);

    for (const [nombre, direccion, horarios] of puntos) {
      const tarjeta = page.locator('.punto-l', { hasText: nombre });
      await expect(tarjeta, nombre).toBeVisible();
      await expect(tarjeta, nombre + ' · dirección').toContainText(direccion);
      for (const h of horarios) {
        await expect(tarjeta, nombre + ' · ' + h).toContainText(h);
      }
    }
  });

  test('las cifras salen de los datos, no están escritas a mano', async ({ page }) => {
    const CFG = await config(page);
    const numeros = await page.locator('.cifra__n').allTextContents();
    expect(numeros).toEqual([
      String(CFG.categorias.length),
      String(CFG.dias.length),
      String(CFG.tamanos.length),
      String(CFG.puntosRetiro.length)
    ]);
  });
});

/* ------------------------------------------------------- Publicación */

test.describe('Cómo se ve y cómo se sirve', () => {

  test('la página no scrollea en horizontal', async ({ page }) => {
    const ancho = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      ventana: window.innerWidth
    }));
    expect(ancho.doc).toBeLessThanOrEqual(ancho.ventana);
  });

  test('todas las imágenes cargan', async ({ page }) => {
    /* Las fotos de los menús son loading="lazy": hay que pasar por toda la
       página para que el navegador las pida, si no el test las ve sin
       cargar por no haber llegado nunca a la pantalla. */
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      await Promise.all([...document.images].map((i) =>
        i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })
      ));
    });

    const rotas = await page.evaluate(() =>
      [...document.images].filter((i) => !i.complete || i.naturalWidth === 0)
                          .map((i) => i.getAttribute('src'))
    );
    expect(rotas).toEqual([]);
  });

  test('no viola su propia CSP', async ({ page }) => {
    const violaciones = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) {
        violaciones.push(m.text());
      }
    });
    await page.goto('/');
    await page.waitForFunction(() => window.AUME_LANDING);
    expect(violaciones).toEqual([]);
  });

  test('no hay emojis en la pantalla', async ({ page }) => {
    const texto = await page.locator('body').innerText();
    const emojis = texto.match(/\p{Extended_Pictographic}/gu) || [];
    expect(emojis).toEqual([]);
  });
});
