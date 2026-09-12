const { test, expect } = require('@playwright/test');

/* =====================================================================
   Tests de la landing.

   La landing son CINCO páginas: la portada ("/"), el menú, los precios,
   nosotros y los tips. La pantalla de pedidos tiene los suyos en
   aume.spec.js.

   Acá se prueba lo que la landing promete: que se entienda qué es AUMÉ,
   que se pueda llegar a pedir desde cualquier parte, que se pueda pasar
   de una página a otra, y que los datos del negocio que muestra sean los
   reales y no un texto escrito a mano en el HTML.
   ===================================================================== */

/* Las cinco páginas, con el nombre de su pastilla en la fila de arriba.
   Casi todo lo que sigue se corre sobre esta lista: si mañana se suma
   una página, se agrega acá y queda cubierta por todo el archivo. */
const PAGINAS = [
  { url: '/',              pastilla: 'Inicio' },
  { url: '/menu.html',     pastilla: 'Menú' },
  { url: '/precios.html',  pastilla: 'Precios y cómo pedir' },
  { url: '/nosotros.html', pastilla: 'Nosotros' },
  { url: '/tips/',         pastilla: 'Tips y recetas' }
];

/* La configuración se lee de la propia página, que es la que la usa para
   dibujar. Así el test verifica lo que importa: que lo que se ve salga de
   los datos del negocio y no de un texto escrito a mano en el HTML. */
const config = (page) => page.evaluate(() => window.AUME_CONFIG);

/* Las cuatro páginas que dibuja landing.js esperan a AUME_LANDING; la de
   tips usa nota.js y espera a AUME_TIPS.

   No se espera el evento "load" sino que el JS del sitio haya arrancado:
   las páginas piden Playfair y Caveat a Google Fonts, y "load" espera
   también a eso. Si Google tarda o no contesta, la página se ve igual
   (la tipografía de marca está en el propio dominio) y el test no tiene
   por qué quedarse esperando a un tercero. */
async function abrir(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.AUME_LANDING || window.AUME_TIPS);
}

/* ------------------------------------------------------------- Marca */

test.describe('Identidad de marca', () => {

  for (const { url } of PAGINAS) {
    test(`el logo carga en la cabecera y en el pie · ${url}`, async ({ page }) => {
      await abrir(page, url);
      for (const sel of ['.cab__marca img', '.pie-l__marca img']) {
        const img = page.locator(sel);
        await expect(img).toBeVisible();
        // naturalWidth 0 = imagen rota
        expect(await img.evaluate((n) => n.naturalWidth), sel).toBeGreaterThan(0);
        await expect(img).toHaveAttribute('src', /logo\.png$/);
      }
    });
  }

  test('el logo queda fijo arriba al scrollear', async ({ page }) => {
    await abrir(page, '/');
    const cab = page.locator('.cab');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(cab).toBeVisible();
    const caja = await cab.boundingBox();
    expect(caja.y).toBeLessThanOrEqual(1);
  });
});

/* ------------------------------------------------------- Navegación */

test.describe('Moverse entre las páginas', () => {

  /* La fila de páginas no se esconde nunca detrás de un botón de
     hamburguesa: en celular se desliza, pero está. Si alguien la
     escondiera en pantallas chicas, esto lo avisa. */
  for (const { url, pastilla } of PAGINAS) {
    test(`la fila de páginas está entera y marca dónde estoy · ${url}`, async ({ page }) => {
      await abrir(page, url);

      const enlaces = page.locator('.cab__nav a');
      await expect(enlaces).toHaveCount(PAGINAS.length);

      for (const p of PAGINAS) {
        await expect(page.locator('.cab__nav a', { hasText: p.pastilla }).first()).toBeVisible();
      }

      const aqui = page.locator('.cab__nav a[aria-current="page"]');
      await expect(aqui).toHaveCount(1);
      await expect(aqui).toHaveText(pastilla);
    });
  }

  for (const destino of PAGINAS.slice(1)) {
    test(`desde la portada se llega a ${destino.pastilla}`, async ({ page }) => {
      await abrir(page, '/');
      await page.locator('.cab__nav a', { hasText: destino.pastilla }).first().click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('.cab__nav a[aria-current="page"]')).toHaveText(destino.pastilla);
    });
  }

  for (const { url } of PAGINAS) {
    test(`el botón de la cabecera lleva a la pantalla de pedidos · ${url}`, async ({ page }) => {
      await abrir(page, url);
      await page.locator('.cab__cta').click();
      await page.waitForURL(/\/pedido\//, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#dias')).toBeVisible();
    });
  }
});

/* ------------------------------------------------- Llegar a pedir */

test.describe('Camino al pedido', () => {

  /* Se mira la vista que queda abierta y no Store.estado.modo: el estado
     interno existe desde que carga store.js, o sea antes de que la app
     arranque y lea la dirección, y ahí el test corría una carrera que en
     celular perdía. */
  const FORMAS = [
    { texto: 'Elegir por día',      vista: '#vistaDia' },
    { texto: 'Ver las promos',      vista: '#vistaPromo' },
    { texto: 'Ver el plan del mes', vista: '#vistaMensual' },
    { texto: 'Ver postres, yogures y algo más', vista: '#vistaExtras' }
  ];

  for (const caso of FORMAS) {
    test(`"${caso.texto}" abre su parte de la pantalla de pedidos`, async ({ page }) => {
      await abrir(page, '/precios.html');
      await page.locator('.forma', { hasText: caso.texto }).click();
      await page.waitForURL(/\/pedido\//, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(caso.vista), caso.texto).toBeVisible();
    });
  }

  test('el botón de WhatsApp abre el chat con un mensaje escrito', async ({ page }) => {
    await abrir(page, '/');
    const CFG  = await config(page);
    const href = await page.locator('#ctaWhatsapp').getAttribute('href');
    expect(href).toContain('wa.me/' + CFG.whatsapp);
    expect(decodeURIComponent(href)).toContain('AUMÉ');
  });
});

/* --------------------------------------------- Los datos del negocio */

test.describe('La portada', () => {

  test('las cifras salen de los datos, no están escritas a mano', async ({ page }) => {
    await abrir(page, '/');
    const CFG = await config(page);
    const numeros = await page.locator('.cifra__n').allTextContents();
    expect(numeros).toEqual([
      String(CFG.categorias.length),
      String(CFG.dias.length),
      String(CFG.tamanos.length),
      String(CFG.puntosRetiro.length),
      '+' + CFG.marca.viandasPorDia,
      '+' + CFG.marca.anios
    ]);
  });

  /* Los siete días están siempre; lo que decide cuál se prende es
     CFG.dias. Si mañana se cocina el sábado, el círculo se prende solo. */
  test('los días con vianda salen de los días que se cocina', async ({ page }) => {
    await abrir(page, '/');
    const CFG = await config(page);

    await expect(page.locator('.diasv__d')).toHaveCount(7);
    await expect(page.locator('.diasv__d:not(.diasv__d--no)')).toHaveCount(CFG.dias.length);
    await expect(page.locator('.diasv__d--no')).toHaveCount(7 - CFG.dias.length);
  });

  /* La portada muestra un adelanto y no la semana entera: ese recorte es
     justamente lo que la hace corta en celular. */
  test('el adelanto del menú muestra tres días y lleva a la semana completa', async ({ page }) => {
    await abrir(page, '/');
    await expect(page.locator('#semana .dia')).toHaveCount(3);
    await expect(page.locator('#semana .dia__nombre').first()).not.toBeEmpty();

    await page.locator('a', { hasText: 'Ver la semana completa' }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.cab__nav a[aria-current="page"]')).toHaveText('Menú');
  });
});

test.describe('El menú', () => {

  test('muestra la semana entera, día por día', async ({ page }) => {
    await abrir(page, '/menu.html');
    const CFG  = await config(page);
    const dias = page.locator('#semana .dia');
    await expect(dias).toHaveCount(CFG.dias.length);

    // El primer día tiene que nombrar platos de verdad, no un cartel vacío
    await expect(dias.first().locator('.dia__nombre').first()).not.toBeEmpty();
    await expect(page.locator('#semanaLabel')).not.toBeEmpty();
  });

  test('los cuatro menús se ven con su nombre y su descripción', async ({ page }) => {
    await abrir(page, '/menu.html');
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
    await abrir(page, '/menu.html');
    const CFG = await config(page);
    await expect(page.locator('#fija')).toContainText(CFG.extraFijo.nombre);
    await expect(page.locator('#fija')).toContainText('todos los días');
  });
});

test.describe('Los precios', () => {

  /* $9.000 -> el separador de miles lo pone Intl, comparamos por número */
  const conPuntos = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  test('la vianda se ve con el precio de cada tamaño', async ({ page }) => {
    await abrir(page, '/precios.html');
    const CFG = await config(page);

    const tarjeta = page.locator('.precio', { hasText: 'La vianda' });
    await expect(tarjeta).toBeVisible();
    for (const t of CFG.tamanos) {
      const fila = tarjeta.locator('.precio__l', { hasText: t.gramos });
      await expect(fila, t.nombre).toContainText(conPuntos(CFG.preciosVianda[t.id]));
    }
  });

  test('las zonas de envío se ven con su costo exacto', async ({ page }) => {
    await abrir(page, '/precios.html');
    const CFG = await config(page);
    for (const zona of CFG.envio.zonas) {
      const fila = page.locator('.envio__zona', { hasText: zona.nombre });
      await expect(fila).toBeVisible();
      await expect(fila.locator('.envio__costo')).toContainText(conPuntos(zona.costo));
    }
  });

  /* Los tres puntos van escritos a mano a propósito, igual que en
     aume.spec.js: es el dato con el que alguien se toma un colectivo. Si
     cambia, el test tiene que fallar y no acompañar el cambio. */
  test('los puntos de retiro están con dirección y horario exactos', async ({ page }) => {
    await abrir(page, '/precios.html');
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

  /* Los importes de los packs NO se calculan: van tal cual están
     publicados en config.js, porque algunos están redondeados a mano. */
  test('hay un botón por pack y uno para el plan mensual', async ({ page }) => {
    await abrir(page, '/precios.html');
    const CFG = await config(page);

    const botones = page.locator('.packs__sel button');
    await expect(botones).toHaveCount(CFG.packs.opciones.length + 1);
    await expect(page.locator('.packs__sel button', { hasText: 'Plan mensual' })).toHaveCount(1);

    // Arranca elegido uno solo, y es el pack de más días
    const elegidos = page.locator('.packs__sel button[aria-selected="true"]');
    await expect(elegidos).toHaveCount(1);
    const masDias = Math.max(...CFG.packs.opciones.map((o) => o.dias));
    await expect(elegidos).toHaveText(masDias + ' días');
  });

  test('cada pack muestra el precio publicado, sin calcular nada', async ({ page }) => {
    await abrir(page, '/precios.html');
    const CFG = await config(page);

    for (const pack of CFG.packs.opciones) {
      await page.locator('.packs__sel button', { hasText: pack.dias + ' días' }).click();
      await expect(page.locator('.pack__t')).toContainText(pack.nombre);

      for (const t of CFG.tamanos) {
        const precio = pack.precios[t.id];
        if (!precio || !precio.efectivo) continue;
        const caja = page.locator('.pack__p', { hasText: t.gramos });
        await expect(caja, pack.nombre + ' · ' + t.gramos)
          .toContainText(conPuntos(precio.efectivo));
      }
    }
  });

  test('el plan mensual avisa que el envío se cobra aparte', async ({ page }) => {
    await abrir(page, '/precios.html');
    const CFG = await config(page);

    await page.locator('.packs__sel button', { hasText: 'Plan mensual' }).click();
    await expect(page.locator('.pack__envio')).toContainText(
      CFG.planMensual.envioBonificado ? 'Envío bonificado' : 'aparte'
    );
  });
});

/* --------------------------------------------------- Tips y recetas */

test.describe('Tips y recetas', () => {

  /* Estos tests corren sin worker, así que /api/publicaciones no
     contesta. Es justamente el caso que hay que cubrir: la página no
     puede quedar como un título y nada abajo. */

  test('sin publicaciones, la grilla lo dice en vez de quedar vacía', async ({ page }) => {
    await abrir(page, '/tips/');
    await expect(page.locator('#estado')).toBeVisible();
    await expect(page.locator('#estado')).not.toBeEmpty();
    await expect(page.locator('.tip')).toHaveCount(0);
  });

  test('con publicaciones, se dibujan las tarjetas y llevan a su nota', async ({ page }) => {
    await abrir(page, '/tips/');
    await page.evaluate(() => window.AUME_TIPS.pintarGrilla([
      { id: 'tres-mitos', titulo: 'Tres mitos de invierno', copete: 'Los de siempre',
        categoria: 'nutricion', fecha: '2026-08-20', imagen: '', imagenAlt: '' },
      { id: 'garbanzos', titulo: 'Garbanzos crocantes', copete: 'Para picar',
        categoria: 'receta', fecha: '2026-08-14', imagen: '', imagenAlt: '' }
    ]));

    const tarjetas = page.locator('.tip');
    await expect(tarjetas).toHaveCount(2);
    await expect(page.locator('#estado')).toBeHidden();

    await expect(tarjetas.first()).toContainText('Tres mitos de invierno');
    await expect(tarjetas.first()).toContainText('Info nutricional');
    await expect(tarjetas.nth(1)).toContainText('Receta');
    await expect(tarjetas.first()).toHaveAttribute('href', '?nota=tres-mitos');
  });

  /* El texto de una publicación se escribe con textContent, nunca como
     HTML: lo que se carga desde el panel se muestra como texto aunque
     alguien pegue etiquetas. */
  test('el título de una publicación no puede meter HTML en la página', async ({ page }) => {
    await abrir(page, '/tips/');
    await page.evaluate(() => window.AUME_TIPS.pintarGrilla([
      { id: 'x', titulo: '<img src=x onerror=alert(1)>ojo', copete: '<b>negrita</b>',
        categoria: 'tip', fecha: '2026-08-20', imagen: '', imagenAlt: '' }
    ]));

    await expect(page.locator('.tip__t')).toContainText('<img src=x');
    expect(await page.locator('.tip img').count()).toBe(0);
    expect(await page.locator('.tip__d b').count()).toBe(0);
  });

  test('la página de una nota no queda en blanco si la API no contesta', async ({ page }) => {
    await abrir(page, '/tips/?nota=lo-que-sea');

    // El logo y el camino de vuelta tienen que estar igual
    await expect(page.locator('.cab__marca img')).toBeVisible();
    await expect(page.locator('.cab__cta')).toHaveAttribute('href', /pedido/);

    // Y un mensaje, no una pantalla vacía
    await expect(page.locator('#estado')).toBeVisible();
    await expect(page.locator('#estado')).not.toBeEmpty();
  });

  /* Con ?nota= se lee UNA nota: la grilla se va, para que la página no
     sea la lista y la nota una debajo de la otra. */
  test('al abrir una nota, la grilla no se muestra', async ({ page }) => {
    await abrir(page, '/tips/?nota=lo-que-sea');
    await expect(page.locator('#grilla')).toBeHidden();
  });
});

/* ------------------------------------------- El formulario de empresas */

test.describe('Cotización para empresas', () => {

  test.beforeEach(async ({ page }) => {
    await abrir(page, '/');
  });

  test('el formulario está y pide lo mínimo para poder contestar', async ({ page }) => {
    const form = page.locator('#formCotizacion');
    await expect(form).toBeVisible();
    for (const campo of ['contacto', 'empresa', 'email', 'telefono']) {
      await expect(form.locator('[name="' + campo + '"]')).toHaveCount(1);
    }
  });

  test('sin datos de contacto avisa y no manda nada', async ({ page }) => {
    let mandado = false;
    await page.route('**/api/cotizaciones', (ruta) => { mandado = true; ruta.abort(); });

    await page.locator('#cEnviar').click();

    await expect(page.locator('#cAviso')).toBeVisible();
    await expect(page.locator('#cAviso')).toContainText('nombre');
    expect(mandado, 'mandó el formulario igual').toBe(false);
  });

  test('con nombre pero sin mail ni teléfono, tampoco', async ({ page }) => {
    let mandado = false;
    await page.route('**/api/cotizaciones', (ruta) => { mandado = true; ruta.abort(); });

    await page.fill('#cContacto', 'Marina López');
    await page.locator('#cEnviar').click();

    await expect(page.locator('#cAviso')).toContainText('mail o un teléfono');
    expect(mandado).toBe(false);
  });

  test('un mail mal escrito se avisa antes de mandar', async ({ page }) => {
    await page.fill('#cContacto', 'Marina');
    await page.fill('#cEmail', 'marina@@nada');
    await page.locator('#cEnviar').click();
    await expect(page.locator('#cAviso')).toContainText('mail no parece');
  });

  test('una consulta completa se manda y el formulario desaparece', async ({ page }) => {
    let recibido = null;
    await page.route('**/api/cotizaciones', async (ruta) => {
      recibido = JSON.parse(ruta.request().postData() || '{}');
      await ruta.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, datos: { recibida: true } })
      });
    });

    await page.fill('#cContacto', 'Marina López');
    await page.fill('#cEmpresa', 'Estudio López');
    await page.fill('#cEmail', 'marina@estudio.com.ar');
    await page.locator('#cEnviar').click();

    await expect(page.locator('#cAviso')).toContainText('Recibimos tu consulta');
    /* Se saca el formulario para que nadie lo mande dos veces */
    await expect(page.locator('#formCotizacion')).toHaveCount(0);

    expect(recibido.contacto).toBe('Marina López');
    expect(recibido.email).toBe('marina@estudio.com.ar');
  });

  test('si el servidor rechaza, lo dice y el formulario sigue ahí', async ({ page }) => {
    await page.route('**/api/cotizaciones', (ruta) => ruta.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: { codigo: 'datos_invalidos', mensaje: 'no', detalles: ['Ese teléfono parece incompleto.'] }
      })
    }));

    await page.fill('#cContacto', 'Marina');
    await page.fill('#cEmail', 'marina@estudio.com.ar');
    await page.locator('#cEnviar').click();

    await expect(page.locator('#cAviso')).toContainText('Ese teléfono parece incompleto');
    await expect(page.locator('#formCotizacion')).toBeVisible();
  });

  /* El formulario existe SIN aflojar la política de seguridad porque se
     manda con fetch. Si alguien la cambiara, esto lo avisa. */
  test('la política sigue prohibiendo enviar formularios', async ({ page }) => {
    const r = await page.request.get('/');
    expect(r.headers()['content-security-policy']).toContain("form-action 'none'");
  });
});

/* ------------------------------------------------------- Publicación */

test.describe('Cómo se ve y cómo se sirve', () => {

  test('la tipografía de la marca carga de verdad', async ({ page }) => {
    /* No alcanza con que el @font-face esté escrito: si la CSP la bloquea
       o el servidor la manda con el tipo equivocado, el navegador la
       descarta en silencio y el sitio se ve con la de respaldo. Esto
       pregunta si la fuente terminó cargada. */
    await abrir(page, '/');
    await page.evaluate(() => document.fonts.ready);
    const cargada = await page.evaluate(() =>
      document.fonts.check('400 16px "Glacial Indifference"')
    );
    expect(cargada, 'Glacial Indifference no llegó a cargar').toBe(true);

    /* Y que sea la que el texto usa, no una que quedó cargada al pasar */
    const usada = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.hero__d')).fontFamily
    );
    expect(usada).toContain('Glacial Indifference');
  });

  for (const { url } of PAGINAS) {

    test(`la página no scrollea en horizontal · ${url}`, async ({ page }) => {
      await abrir(page, url);
      const ancho = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        ventana: window.innerWidth
      }));
      expect(ancho.doc).toBeLessThanOrEqual(ancho.ventana);
    });

    test(`todas las imágenes cargan · ${url}`, async ({ page }) => {
      await abrir(page, url);

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

    test(`no viola su propia CSP · ${url}`, async ({ page }) => {
      const violaciones = [];
      page.on('console', (m) => {
        if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) {
          violaciones.push(m.text());
        }
      });
      await abrir(page, url);
      expect(violaciones).toEqual([]);
    });

    test(`no hay emojis en la pantalla · ${url}`, async ({ page }) => {
      await abrir(page, url);
      const texto = await page.locator('body').innerText();
      const emojis = texto.match(/\p{Extended_Pictographic}/gu) || [];
      expect(emojis).toEqual([]);
    });
  }
});
