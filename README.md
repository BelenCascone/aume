# AUMÉ Viandas · Web de pedidos

Sitio web / PWA para tomar los pedidos del menú semanal de **AUMÉ** (Paraná, Entre Ríos)
y enviarlos ya armados por WhatsApp.

> *Aurea Mediocritas* — el equilibrio perfecto entre nutrirse y comer rico.

---

## 1. Cómo ver la web

No hace falta instalar nada: **doble clic en `index.html`** y se abre en el navegador.
Funciona igual desde el celular una vez publicada (ver punto 4).

El sitio tiene una dirección por página:

| Dirección | Qué es |
|---|---|
| `/` | La portada: qué es AUMÉ, los números, un adelanto del menú y el formulario de empresas. Es lo que ve alguien que llega desde Instagram, y es corta a propósito. |
| `/menu.html` | El menú de la semana entero, día por día, y los cuatro tipos de menú. |
| `/precios.html` | Los precios, los packs, las formas de pedir, los tres pasos y los puntos de retiro. |
| `/nosotros.html` | El manifiesto y de dónde viene el nombre. |
| `/tips/` | Los tips, las recetas y la info nutricional que carga la nutricionista. |
| `/tips/?nota=…` | Una publicación sola, para poder compartir el link por WhatsApp. |
| `/pedido/` | La pantalla de pedidos: el menú, el carrito y el mensaje de WhatsApp. |

**Por qué son varias páginas y no una sola larga.** La landing anterior era
una página de doce pantallas de alto en celular: para llegar a los precios
había que scrollear todo. Ahora lo que decide una compra —qué se come,
cuándo hay y el contacto de empresas— queda arriba, y lo que se consulta
—precios al detalle, quiénes somos, el blog— tiene su propia página. En la
cabecera hay una fila de pastillas que en celular se desliza en horizontal;
no hay menú de hamburguesa a propósito, porque esconde justo lo que
queremos que encuentren.

Los **textos** de cada página están escritos en su `.html` y se editan ahí
mismo. Los **datos** —el menú de la semana, los cuatro menús, los precios,
los packs, las zonas de envío y los puntos de retiro— no: esos salen de los
mismos archivos de siempre (y del panel), así que se actualizan solos en
todas las páginas.

---

## 2. Actualizar el menú de la semana ⭐

Es lo único que se toca cada semana.

1. Abrí el archivo **`assets/js/data/menu.js`** con el Bloc de notas (o VS Code).
2. Cambiá el texto de `semana:` y el `nombre` / `descripcion` de cada plato.
3. Guardá. Listo.

```js
semana: 'Semana del 31/08 al 04/09',

lunes: {
  clasico: {
    nombre: 'Milanesa de ternera al horno con puré rústico',
    descripcion: 'Milanesa horneada con costra de avena…',
    etiquetas: ['Sin fritura']
  },
  ...
}
```

**Reglas para no romper nada**

| Situación | Qué escribir |
|---|---|
| Un día no hay opción vegetariana | `vegetariano: null,` |
| No querés cartelitos en un plato | `etiquetas: []` |
| Siempre | respetar las comillas `'` y la coma `,` al final de cada línea |

Si algo queda mal escrito la página no carga el menú: deshacé el último cambio
(`Ctrl + Z`), guardá y volvé a probar.

> La **Ensalada César** no va acá: está disponible todos los días en todos los
> menús y se configura una sola vez, en `config.js` (`extraFijo`).

---

## 3. Precios, envíos, packs y puntos de retiro

Todo eso vive en **`assets/js/data/config.js`**.

- **La vianda** vale lo mismo en los 4 menús, sólo cambia por tamaño
  (`preciosVianda`): $9.000 la de 350gr y $12.800 la XL de 500gr.
- **Los envíos** son por entrega y dependen de la zona (`envio.zonas`):
  $2.000 dentro de bulevares y $2.500 fuera.
- **Los packs semanales** (`packs`) llevan el envío bonificado. El precio en
  efectivo va tal cual está publicado, no se calcula, porque algunos están
  redondeados a mano.
- **El plan mensual** (`planMensual`) cambia todos los meses porque cambia la
  cantidad de días hábiles. Hoy paga envío, igual que en el flyer de
  septiembre; para bonificarlo, poné `envioBonificado: true`.
- **Los postres, los yogures y los congelados** están en `productos`. Cada
  uno tiene `grupo` (`postres`, `yogures` o `congelados`), que es sólo el
  orden en que se ven en la pantalla **Para sumar**. Hoy son cuatro: la
  **ensalada de frutas** (400 g), el **chía pudding** (350 g) y el **yogur
  con granola y frutas** (300 g), los tres a $4.800, con cuchara y sin
  azúcar agregada; y las **hamburguesas de legumbres** por pack de 8.
- **El número de WhatsApp** que recibe los pedidos ya está configurado. Si
  alguna vez cambia, va sin `+` ni espacios: `54` + `9` + característica sin el
  0 + número sin el 15.

> **Lo que el cliente elige dentro de un postre no es otro producto.** El
> yogur va con miel o con pasta de maní, y el chía pudding con miel o con
> stevia: eso está escrito en el `detalle` y el cliente lo aclara en
> **Aclaraciones** al cerrar el pedido, igual que el sobre de edulcorante o
> azúcar. Así hay un solo botón por postre y un solo precio.

> **El precio** de estos cuatro se cambia desde el panel (Precios → Otros
> productos) y manda sobre lo que diga `config.js`. El **nombre**, el
> **detalle** y **sumar un producto nuevo** siguen siendo cosa del código:
> se tocan en `config.js` y en la base (`worker/db/semilla.sql` + un
> archivo nuevo en `worker/db/cambios/`).

En el mismo archivo están los **3 puntos de retiro** con sus direcciones y
horarios, los métodos de pago y los días de la semana.

---

## 4. Publicar la web

Es un sitio estático: sirve cualquier hosting.

El proyecto está preparado para **Cloudflare** (`wrangler.jsonc`). También
funciona en Netlify o Vercel arrastrando la carpeta, sin configurar nada.

El archivo `_headers` le pide al hosting que sirva la web con las cabeceras de
seguridad puestas. No hay que tocarlo.

> ⚠️ **`.assetsignore` es lo que decide qué NO se publica.** `.gitignore` no
> sirve para eso: un archivo puede estar fuera de git y aun así subirse a la
> web. Todo lo que no deba ser público (la propuesta comercial, los resultados
> de los tests) tiene que estar listado ahí.

> El service worker (`sw.js`) sólo se activa cuando el sitio está publicado en
> `https://`. Abriendo el archivo local no molesta ni da error.

---

## 5. Logo e íconos

Ya está todo listo, no hace falta agregar nada. En `assets/img/` están:

| Archivo | Para qué |
|---|---|
| `logo.png` | El logo de AUMÉ con fondo transparente. Barra superior, pie de página y vista previa al compartir el link. |
| `favicon-64.png` | Ícono de la pestaña del navegador. |
| `icon-192.png` · `icon-512.png` | Ícono al agregar la web a la pantalla de inicio del celular. |
| `icon-maskable-512.png` | Versión con margen extra, para los Android que recortan el ícono en círculo. |

Los íconos cuadrados son el mismo logo centrado sobre el fondo crema de la
marca (`#F9F6F0`).

Si algún día cambia el logo, reemplazá `logo.png` (fondo transparente, alto
300 px o más) y regenerá los cuadrados con el mismo criterio.

### ⚠️ Las fotos de la landing todavía son dibujos

En `assets/img/landing/` hay **cinco marcadores de lugar**: no son fotos de
AUMÉ, son dibujos hechos con los colores de la marca para que la página no
quede con huecos hasta que llegue el material.

| Archivo | Qué foto va ahí |
|---|---|
| `menu-clasico.svg` | Una vianda del menú Clásico |
| `menu-vegetariano.svg` | Una vianda del menú Vegetariano |
| `menu-proteico.svg` | Una vianda del menú Proteico |
| `menu-ensalada.svg` | Una vianda del menú Ensaladas |
| `cocina.svg` | La cocina o el equipo (es la apaisada, va en "Quiénes somos") |

**Cómo se reemplazan:** guardá la foto en esa misma carpeta y cambiá el
nombre del archivo donde aparece. Los cuatro menús se nombran en
`assets/js/landing.js` (buscá `FOTO_POR_CATEGORIA`); la de la cocina, en
`nosotros.html` (buscá `cocina.svg`).

Las cuatro de los menús se ven recortadas en un rectángulo apaisado, así que
conviene que el plato esté centrado. La de la cocina se ve entera y es más
ancha que alta.

La foto de la portada y la de la cocina se nombran en
`assets/js/landing.js` (buscá `FOTOS_REALES`): si el `.jpg` existe se usa,
y si no queda el dibujo. Así se pueden ir agregando de a una sin tocar el
código.

---

## 6. Estructura del proyecto

```
aume/
├── index.html                  La portada del sitio
├── menu.html                   El menú de la semana
├── precios.html                Precios, packs, formas de pedir y retiros
├── nosotros.html               El manifiesto y de dónde viene el nombre
├── pedido/
│   └── index.html              Estructura de la pantalla de pedidos
├── tips/
│   └── index.html              Los tips: la grilla y, con ?nota=…, una sola
├── manifest.json               Datos de la PWA (nombre, colores, ícono)
├── sw.js                       Cache offline (sólo en sitio publicado)
├── _headers                    Cabeceras de seguridad del hosting
├── .assetsignore               Qué NO se publica
├── wrangler.jsonc              Deploy en Cloudflare
├── assets/
│   ├── css/
│   │   ├── styles.css          Estilos + paleta de marca en variables CSS
│   │   └── landing.css         Las cinco páginas de afuera del pedido
│   │                           (usa la paleta de styles.css, no define colores)
│   ├── fonts/                  Glacial Indifference + su licencia
│   ├── img/                    logo.png + íconos (ya generados)
│   │   └── landing/            Marcadores de lugar de las fotos ⚠️
│   └── js/
│       ├── data/
│       │   ├── config.js       ← negocio: precios, envíos, packs, puntos
│       │   └── menu.js         ← MENÚ SEMANAL (el archivo de cada semana)
│       ├── store.js            Carrito, totales y reglas de envío
│       ├── ui.js               Dibujado de menú, carrito y paneles
│       ├── checkout.js         Formulario y mensaje de WhatsApp
│       ├── app.js              Arranque y eventos
│       ├── landing.js          Dibuja las cuatro páginas de la landing
│       ├── nota.js             Dibuja /tips/: la grilla y una publicación
│       └── cotizacion.js       El formulario de empresas
│
├── package.json                Sólo para correr los tests
├── playwright.config.js        Config de los tests
└── tests/                      Tests automáticos + servidor local
```

### Paleta (definida en `:root` de `styles.css`)

Son los colores que pasó la diseñadora, sin retocar:

| Uso | Color de marca |
|---|---|
| Menú Clásico | `#DC8D43` |
| Menú Vegetariano | `#4B936A` |
| Menú Proteico | `#AD94B4` |
| Menú Ensaladas | `#6EA6A4` |
| Fondo crema · Blanco · Texto | `#FFFCED` · `#FFFFFF` · `#2C2C2C` |

Al lado de cada uno, en `styles.css`, hay una variante `-dark`
(`--c-clasico-dark`, etc.). **No son colores nuevos de la marca**: los
cuatro colores son claros y ninguno llega al contraste mínimo para usarse
como texto sobre el crema. La regla es simple:

> **el color de marca pinta, la variante oscura escribe.**

El punto de color de un menú, su borde y su fondo suave usan el color tal
cual. El texto usa la variante oscura. Por lo mismo, el botón principal
lleva el naranja de la marca con el texto en tinta (se lee al doble que en
blanco), y el botón verde usa la variante oscura para que el blanco entre.

### Tipografías

| Dónde | Cuál |
|---|---|
| Textos, botones, formularios y todo el panel | **Glacial Indifference**, la tipografía de la marca |
| Títulos | **Playfair Display** |
| Días del menú y detalles manuscritos | **Caveat** |

Glacial Indifference vive en **`assets/fonts/`** y se sirve desde el
propio sitio, no desde Google: es la de la marca y no queremos que
dependa de un servicio de afuera. Su licencia (SIL Open Font, que permite
exactamente esto) está al lado, en el mismo directorio, y tiene que
seguir ahí.

> Si algún día no se ve, lo primero para mirar son dos líneas: `font-src
> 'self'` en `_headers` y el tipo `.otf` en `tests/server.js`. Sin
> cualquiera de las dos, el navegador descarta la fuente **sin avisar** y
> el sitio se ve con la de respaldo. Hay un test que lo verifica.

> Un detalle de la tipografía: **no trae los signos `¿` ni `¡`**. El
> navegador los toma de la tipografía de respaldo y en pantalla no se
> nota, así que no hay nada que arreglar — pero conviene saberlo antes de
> pensar que algo está roto. Los acentos y la ñ sí están.

El material original que pasó la diseñadora —el logo, la paleta y la
tipografía— está en la carpeta **`marca/`**, con su propio `LEEME.txt`.
Esa carpeta no se publica.

---

## 7. Cómo funciona el pedido

La pantalla de pedidos abre directamente en el menú: no hay nada que
scrollear antes de poder elegir. Arriba quedan siempre fijos el **logo**, las **cuatro formas
de pedir** y los **cuatro tipos de menú**; abajo, también fijo, el
**resumen del pedido**, que es por donde se entra al carrito.

Las cuatro formas de pedir:

| Pestaña | Qué es | Envío |
|---|---|---|
| **Por día** | Una vianda de un día, en 350gr o XL 500gr. La Ensalada César está en todos los días, mire el menú que mire. | Se cobra |
| **Promos** | Los packs semanales x3, x4 y x5. Se elige el tamaño y qué tipo de menú preferís que te armemos. | Bonificado |
| **Mensual** | El plan del mes. Sólo se ofrecen los tamaños que tienen precio publicado. | Se cobra |
| **Para sumar** | Postres, yogures y congelados, por unidad. Los postres y los yogures se envían durante la mañana o junto con la vianda. | Se cobra |

Todo va al mismo carrito y a la misma entrega. Si el pedido tiene una
promo adentro, **el envío del pedido entero queda bonificado**: la entrega
es una sola.

Los packs y el plan mensual tienen un **precio en efectivo** más bajo, que
es el que está publicado. El carrito muestra los dos: el total normal y
cuánto sería pagando en efectivo.

Después el cliente completa nombre, teléfono, envío (con su zona) **o**
punto de retiro, y método de pago. **"Confirmar pedido por WhatsApp"** abre
el chat con el mensaje ya escrito, separado en VIANDAS, PROMOS SEMANALES,
PLAN MENSUAL y PARA SUMAR.

Si WhatsApp no se abre (navegador que bloquea la ventana, sin la app
instalada), aparecen el botón **"Abrir WhatsApp"** y el recuadro **"Copiar
resumen del pedido"**. El pedido nunca se pierde.

El carrito queda guardado en el celular: si cierra la página y vuelve, sigue
ahí. Cuando cambia el texto de `semana:` en `menu.js`, los carritos viejos se
descartan solos para que nadie pida el menú de la semana pasada.

---

## 8. Todavía no incluye

- Elegir **qué menú va cada día dentro de un pack**: hoy se elige un tipo de
  menú para todo el pack (o "Combinado") y el resto se coordina por WhatsApp.
- Carga del menú desde una **planilla de Google**, para que no haya que editar
  `menu.js` a mano.
- Pasarela de pago online (esta primera fase apunta a ordenar el pedido y
  descongestionar WhatsApp, no a cobrar).

---

## 9. Tests automáticos (opcional, para quien programe)

Hay una suite de Playwright que verifica lo que no se puede romper: el precio
de la vianda, el envío según la zona, los 3 puntos de retiro con su dirección y
horario exactos, que las 4 categorías se vean enteras en celular, que la
Ensalada César esté todos los días, y que el pedido llegue bien armado a
WhatsApp.

```bash
npm test
```

Levanta solo un servidor en `http://localhost:4173` y corre los casos en dos
tamaños de pantalla (celular y escritorio). Para verlo con el navegador
abierto en vez de en segundo plano:

```bash
npm run test:ver
```

Hace falta Node instalado y, una sola vez:

```bash
npm install -D @playwright/test
```

```bash
npx playwright install
```

**La web publicada no necesita nada de esto.** Sigue siendo HTML, CSS y JS
sueltos: `npm` sólo se usa para correr los tests.

---

## 10. Panel de administración (en construcción)

Panel privado para cargar el menú, editar los precios, anotar los pedidos,
**publicar tips y recetas** y mirar las estadísticas, sin tener que editar
archivos a mano.

> **Publicaciones** es la pantalla que le da autonomía a quien maneja las
> redes: escribe el tip o la receta ahí y aparece solo en la landing. Lo
> que queda en borrador no lo ve nadie. Las fotos van a un bucket R2 de
> Cloudflare y las sirve el worker desde el propio dominio — el detalle
> está en [`docs/panel-admin.md`](docs/panel-admin.md).

**No reemplaza nada de lo de arriba todavía.** Se suma al lado, en carpetas
nuevas, y la web pública sigue funcionando exactamente igual:

```
admin/     Pantallas del panel          ← protegido por Cloudflare Access
worker/    La API en /api/*             ← código de servidor, NO se publica
docs/      Guía de puesta en marcha     ← interna, tampoco se publica
```

Cloudflare sirve **primero** los archivos estáticos y sólo le pasa al worker
lo que no coincide con ninguno, o sea `/api/*`. Dicho de otra forma: **si el
worker se cae, la landing sigue andando igual**, porque no pasa por él.

### Quién puede entrar

El panel **no tiene login propio**: no hay usuarios ni contraseñas guardados
en ningún lado. Quien decide si alguien entra es **Cloudflare Access**, que se
configura a mano en el dashboard:

- Una aplicación *Self-hosted* sobre el dominio real, con **Path: `admin`**.
  Eso protege `/admin` y todo lo que cuelga de ahí; la landing pública queda
  abierta para los clientes.
- Una política **Allow** con selector **Emails** y los **2 mails** del equipo
  (la dueña/nutricionista y la secretaria). Las dos tienen **exactamente los
  mismos permisos** sobre todo el panel: no hay roles diferenciados.
- Para agregar o sacar a alguien más adelante se edita esa lista de mails.
  No hay que tocar ni volver a publicar el código.

El *Application Audience (AUD) Tag* y el *team domain* de esa aplicación van
en `wrangler.jsonc` (`ACCESS_AUD` y `ACCESS_TEAM_DOMAIN`).

> ⚠️ Mientras esas dos variables estén vacías en producción, la API del panel
> responde 503 **a propósito**: es preferible que se rompa a la vista antes de
> que quede abierta sin que nadie se entere. La landing no se ve afectada.
>
> Eso es exactamente lo que pasa hoy: producción vive en un `workers.dev`,
> que no es un dominio de la cuenta y por lo tanto no admite una aplicación
> de Access con `Path: admin`. Hasta que haya dominio propio, el panel se
> trabaja en staging. Está explicado en `docs/panel-admin.md`, en
> "Mientras el sitio viva en `*.workers.dev`".

### Base de datos

Los menús, los precios y los pedidos viven en una base **Cloudflare D1**. El
esquema está en `worker/db/schema.sql` y los datos iniciales (copiados de
`config.js` y `menu.js`) en `worker/db/semilla.sql`.

> Si la base **ya existe**, hay que correrle los cambios que le faltan.
> El de las promos, el plan mensual y los productos como líneas del pedido:
>
> ```bash
> npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0004_lineas_pedido.sql
> ```
>
> El de las publicaciones:
>
> ```bash
> npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0005_publicaciones.sql
> ```
>
> El de las cotizaciones de empresas:
>
> ```bash
> npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0006_cotizaciones.sql
> ```
>
> Y el de los tres postres con fruta, que además saca los dos productos de
> relleno que decían "Próximamente":
>
> ```bash
> npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0007_postres.sql
> ```
>
> Las bases nuevas ya salen con eso desde `schema.sql`. Hay un entorno de
**staging** con worker y base separados de producción, para probar sin
arriesgar nada real.

### Tests del backend

Aparte de `npm test` (que prueba la web pública), el panel tiene su
propia suite, que corre en segundos y sin conectarse a nada:

```bash
npm run test:api
```

👉 **Paso a paso completo** — crear las bases, correr las migraciones,
configurar Access y publicar: [`docs/panel-admin.md`](docs/panel-admin.md)
