# AUMÉ Viandas · Web de pedidos

Sitio web / PWA para tomar los pedidos del menú semanal de **AUMÉ** (Paraná, Entre Ríos)
y enviarlos ya armados por WhatsApp.

> *Aurea Mediocritas* — el equilibrio perfecto entre nutrirse y comer rico.

---

## 1. Cómo ver la web

No hace falta instalar nada: **doble clic en `index.html`** y se abre en el navegador.
Funciona igual desde el celular una vez publicada (ver punto 4).

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
  orden en que se ven en la pantalla **Para sumar**.
- **El número de WhatsApp** que recibe los pedidos ya está configurado. Si
  alguna vez cambia, va sin `+` ni espacios: `54` + `9` + característica sin el
  0 + número sin el 15.

> ⚠️ **Los postres y los yogures están cargados de ejemplo.** Cambiá el
> `nombre`, el `detalle` y el `precio` de cada uno (están marcados con
> `CONFIRMAR` en `config.js`). Si alguno no va, borrá su bloque entero,
> desde la llave `{` hasta la coma final.

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

---

## 6. Estructura del proyecto

```
aume/
├── index.html                  Estructura de la página
├── manifest.json               Datos de la PWA (nombre, colores, ícono)
├── sw.js                       Cache offline (sólo en sitio publicado)
├── _headers                    Cabeceras de seguridad del hosting
├── .assetsignore               Qué NO se publica
├── wrangler.jsonc              Deploy en Cloudflare
├── assets/
│   ├── css/styles.css          Estilos + paleta de marca en variables CSS
│   ├── img/                    logo.png + íconos (ya generados)
│   └── js/
│       ├── data/
│       │   ├── config.js       ← negocio: precios, envíos, packs, puntos
│       │   └── menu.js         ← MENÚ SEMANAL (el archivo de cada semana)
│       ├── store.js            Carrito, totales y reglas de envío
│       ├── ui.js               Dibujado de menú, carrito y paneles
│       ├── checkout.js         Formulario y mensaje de WhatsApp
│       └── app.js              Arranque y eventos
│
├── package.json                Sólo para correr los tests
├── playwright.config.js        Config de los tests
└── tests/                      Tests automáticos + servidor local
```

### Paleta (definida en `:root` de `styles.css`)

| Uso | Color |
|---|---|
| Marca / Menú Clásico | `#D97838` · `#C86828` |
| Menú Vegetariano / Puntos de retiro | `#3E7A5E` · `#4A8B6C` |
| Menú Proteico | `#9B7AA2` |
| Menú Ensaladas | `#5B9B97` |
| Fondo crema · Blanco · Texto | `#F9F6F0` · `#FFFFFF` · `#2C2C2C` |

Tipografías: **Playfair Display** (títulos), **Caveat** (días y detalles
manuscritos), **Montserrat** (textos).

---

## 7. Cómo funciona el pedido

La web abre directamente en el menú: no hay nada que scrollear antes de
poder elegir. Arriba quedan siempre fijos el **logo**, las **cuatro formas
de pedir** y los **cuatro tipos de menú**; abajo, también fijo, el
**resumen del pedido**, que es por donde se entra al carrito.

Las cuatro formas de pedir:

| Pestaña | Qué es | Envío |
|---|---|---|
| **Por día** | Una vianda de un día, en 350gr o XL 500gr. La Ensalada César está en todos los días, mire el menú que mire. | Se cobra |
| **Promos** | Los packs semanales x3, x4 y x5. Se elige el tamaño y qué tipo de menú preferís que te armemos. | Bonificado |
| **Mensual** | El plan del mes. Sólo se ofrecen los tamaños que tienen precio publicado. | Se cobra |
| **Para sumar** | Postres, yogures y congelados, por unidad. | Se cobra |

Todo va al mismo carrito y a la misma entrega. Si el pedido tiene una
promo adentro, **el envío del pedido entero queda bonificado**: la entrega
es una sola.

Los packs y el plan mensual tienen un **precio en efectivo** más bajo, que
es el que está publicado. El carrito muestra los dos: el total normal y
cuánto sería pagando en efectivo.

Después la clienta completa nombre, teléfono, envío (con su zona) **o**
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

Panel privado para cargar el menú, editar los precios, anotar los pedidos y
mirar las estadísticas, sin tener que editar archivos a mano.

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
  abierta para las clientas.
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

### Base de datos

Los menús, los precios y los pedidos viven en una base **Cloudflare D1**. El
esquema está en `worker/db/schema.sql` y los datos iniciales (copiados de
`config.js` y `menu.js`) en `worker/db/semilla.sql`.

> Si la base **ya existe**, hay que correrle el cambio que agrega las promos,
> el plan mensual y los productos como líneas del pedido:
>
> ```bash
> npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0003_lineas_pedido.sql
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
