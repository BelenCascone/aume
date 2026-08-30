# AUMÉ · Panel de administración

Guía de puesta en marcha del panel privado y de su API. Este archivo es
interno: está en `.assetsignore`, así que **no se publica** en la web.

---

## 1. Cómo está armado

La web pública **no cambia de lugar**. Lo nuevo se suma al lado:

```
index.html          la landing de siempre        ← pública
assets/             la landing de siempre        ← pública
admin/              pantallas del panel          ← protegido por Cloudflare Access
worker/             código de la API (/api/*)    ← corre en el servidor, no se descarga
worker/db/          esquema y datos de D1
docs/               esto que estás leyendo
```

Cloudflare sirve **primero los archivos estáticos**. El Worker sólo recibe
los pedidos que no coinciden con ningún archivo, o sea `/api/*`. Dicho de
otra forma: **si el worker se cae, la landing sigue funcionando igual**,
porque no pasa por él.

### Rutas de la API

| Ruta                             | Método | Quién puede | Fase |
|----------------------------------|--------|-------------|------|
| `/api/salud`                     | GET    | panel       | 0 ✅ |
| `/api/precios`                   | GET    | **público** | 1 ✅ |
| `/api/precios`                   | PUT    | panel       | 1 ✅ |
| `/api/menus`                     | GET    | **público** (sólo publicados) | 2 ✅ |
| `/api/menus/mes/:mes`            | GET    | panel       | 2 ✅ |
| `/api/menus/semana?desde=`       | GET    | panel       | 2 ✅ |
| `/api/menus/semana`              | PUT    | panel       | 2 ✅ |
| `/api/menus/:fecha`              | GET    | panel       | 2 ✅ |
| `/api/menus/:fecha`              | PUT    | panel       | 2 ✅ |
| `/api/menus/:fecha/publicar`     | POST   | panel       | 2 ✅ |
| `/api/pedidos`                   | POST   | **público** (checkout de la landing) | 3 ✅ |
| `/api/pedidos`                   | GET    | panel       | 3 ✅ |
| `/api/pedidos/manual`            | POST   | panel       | 3 ✅ |
| `/api/pedidos/:id`               | PATCH  | panel       | 3 ✅ |
| `/api/estadisticas?desde=&hasta=` | GET   | panel       | 4 ✅ |

Las rutas marcadas "panel" exigen una identidad válida de Cloudflare
Access **y** que el pedido salga del propio sitio (defensa contra CSRF).

---

## 2. Las bases de datos D1

Hay **dos bases separadas**, y esa separación es el seguro de todo lo
demás:

| Base | Para qué |
|---|---|
| `aume-staging` | Probar. Si algo sale mal acá, no pasa nada. |
| `aume-produccion` | La de verdad, la que ve la clienta. |

**Las dos ya están creadas y conectadas** en `wrangler.jsonc`. Esta
sección queda escrita paso a paso por si alguna vez hay que rehacerlas
(cuenta nueva, base borrada por error, alguien más retomando el
proyecto).

Todo se hace **en la terminal, parada dentro de la carpeta del
proyecto** — la que tiene `index.html` y `wrangler.jsonc`.

### 2.1. Tener el proyecto al día

```bash
git checkout main
git pull
ls worker/db          # tienen que aparecer schema.sql y semilla.sql
```

Si esos dos archivos no están, lo que sigue va a fallar.

### 2.2. Entrar a Cloudflare

```bash
npx wrangler login
```

- La primera vez, `npx` pregunta si puede descargar wrangler: **`y`** + Enter.
- Se abre el navegador con **"Allow Wrangler to make changes to your
  account"** → **Allow**. Si no se abre solo, la terminal imprime un link.
- La terminal termina diciendo `Successfully logged in.`

Confirmá en qué cuenta quedaste:

```bash
npx wrangler whoami
```

Tiene que ser la misma cuenta donde está publicada la web de AUMÉ.

### 2.3. Crear las bases

```bash
npx wrangler d1 create aume-staging
npx wrangler d1 create aume-produccion
```

Cada comando termina imprimiendo algo así:

```
✅ Successfully created DB 'aume-staging'

[[d1_databases]]
binding = "DB"
database_name = "aume-staging"
database_id = "68212180-4240-4e47-bd67-a542a3468591"
```

> ⚠️ **Ojo, acá es donde todo el mundo se traba:** wrangler imprime ese
> bloque en formato **TOML** (`[[d1_databases]]`), pero nuestro
> `wrangler.jsonc` está en **JSON**. **No pegues el bloque tal cual.**
> Lo único que se copia es el `database_id`.

Si alguna vez perdés los ids, no hace falta recrear nada:

```bash
npx wrangler d1 list
```

### 2.4. Poner los ids en `wrangler.jsonc`

Hay dos bloques `d1_databases` y **no se pueden cruzar**. El
`database_name` que ya está escrito en cada uno te dice cuál es cuál:

- el bloque de **arriba de todo** → id de `aume-produccion`
- el bloque de adentro de **`"staging"`** → id de `aume-staging`

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "aume-produccion",
    "database_id": "acá-va-el-id"
  }
],
```

Cuidado con las comas: el bloque de producción cierra con `],` y el de
staging con `]` (sin coma, porque es el último).

> **Nunca dejes un `database_id` inventado o de relleno.** Wrangler no
> puede publicar apuntando a una base que no existe: el deploy falla
> entero y **no se publica nada, ni siquiera una corrección de la
> landing**. Si la base todavía no existe, es preferible comentar el
> bloque completo: la API del panel responde 503 avisando que falta el
> binding `DB`, y la landing pública sigue intacta porque no pasa por el
> worker.

### 2.5. Crear las tablas y cargar los datos

**Siempre staging primero.**

```bash
npx wrangler d1 execute aume-staging --remote --file=worker/db/schema.sql
npx wrangler d1 execute aume-staging --remote --file=worker/db/semilla.sql
```

Cada uno pregunta `Ok to proceed? (y/N)` → **`y`**.

- `schema.sql` crea las tablas vacías.
- `semilla.sql` carga los datos reales de hoy: precios, envíos, puntos de
  retiro, métodos de pago y el menú de la semana.

> **`--remote` es la base de verdad en Cloudflare.** `--local` sería una
> copia en tu compu. Si te olvidás la bandera, wrangler te la reclama.

Los dos archivos se pueden correr **todas las veces que haga falta**:
`schema.sql` usa `CREATE TABLE IF NOT EXISTS` y `semilla.sql` usa
`INSERT OR IGNORE`, así que no pisan nada que ya hayas editado desde el
panel. Si un comando falla a la mitad, D1 deja la base como estaba y se
puede reintentar sin miedo.

### 2.6. Comprobar que quedó bien

```bash
npx wrangler d1 execute aume-staging --remote --command="SELECT id, precio FROM tamanos"
```

Tiene que devolver `estandar 9000` y `xl 12800`. Y el menú:

```bash
npx wrangler d1 execute aume-staging --remote --command="SELECT COUNT(*) FROM menu_platos"
```

Tiene que devolver **20** (5 días × 4 tipos de menú).

### 2.7. Producción

Los mismos comandos de 2.5 pero con `aume-produccion`, **recién cuando
esté todo probado en staging**. No hay apuro: la landing no depende de
esto para funcionar.

### Si algo sale mal

| Qué ves | Qué pasa |
|---|---|
| `not logged in` / `authentication error` | Corré `npx wrangler login` de nuevo |
| `A database with that name already exists` | Ya existe. Sacá el id con `npx wrangler d1 list` |
| `Couldn't find wrangler.jsonc` | Estás fuera de la carpeta del proyecto |
| `no such file: worker/db/schema.sql` | Falta el `git pull` de 2.1 |
| `too many terms in compound SELECT` | Un `.sql` con un `INSERT` de muchas filas o una cadena de `UNION ALL`. **En SQLite un `VALUES (a),(b),(c)` es internamente un SELECT compuesto**, y D1 tolera muchos menos términos que el SQLite de escritorio — por eso un archivo puede andar en la prueba local y fallar contra la base de verdad. Solución: una fila por `INSERT` |
| Error de JSON al publicar | Sobra o falta una coma en `wrangler.jsonc` |

Nada de esto toca la web pública: aunque falle todo, la landing sigue
funcionando porque no pasa por la base.

### Probar sin tocar Cloudflare

```bash
npx wrangler d1 execute aume-staging --local --file=worker/db/schema.sql
npx wrangler d1 execute aume-staging --local --file=worker/db/semilla.sql
npx wrangler dev --env staging
```

`--local` usa una base SQLite en tu propia compu.

### Cambios de esquema más adelante

Van como archivos nuevos y numerados en `worker/db/cambios/`
(`0002_…sql`, `0003_…sql`), y además se reflejan en `schema.sql` para que
ese archivo siga describiendo la base completa.

---

### Cómo se carga el menú

La nutri arma el menú del mes **separado por semanas**, así que la
pantalla principal es `/admin/menus/semana.html`: los 5 días con sus 4
tipos, y un botón que guarda y publica la semana entera de una.
`/admin/menus/dia.html` sigue existiendo para corregir un día suelto.

**Feriados.** Cada día tiene una casilla *Feriado*. Marcarla borra los
platos de ese día (si no, la web mostraría "Feriado" y platos al mismo
tiempo) y es la **única** forma de publicar un día sin ningún plato:
justamente lo que hay que comunicar es que ese día no se cocina.

**Días que ya pasaron.** Si hoy es miércoles, la web ya no deja pedir el
lunes ni el martes de esta semana: esos días aparecen apagados y sin
botones. La fecha de "hoy" la decide el **servidor**, no el celular de
la clienta: de eso depende que se cobre o no una vianda, y un reloj
desajustado no puede habilitar un pedido que no se puede entregar.

---

### Los dos caminos del checkout

La landing tiene dos botones, y **los dos registran el pedido** con
canal `app`:

| Botón | Qué hace |
|---|---|
| *Confirmar pedido por WhatsApp* | El de siempre. Registra el pedido y abre WhatsApp con el mensaje armado. |
| *Dejar mi pedido confirmado* | Registra el pedido y muestra una pantalla de confirmación. No abre WhatsApp: desde AUMÉ se comunican después. |

> **El registro nunca bloquea la venta.** En el camino de WhatsApp el
> pedido se manda a la API *sin esperar la respuesta*, y WhatsApp se
> abre en el mismo gesto de la clienta. Si esperáramos a la API, el
> navegador ya no consideraría la apertura parte del toque y los
> bloqueadores de pop-ups la frenarían. Y si la API falla, el pedido
> igual llega por WhatsApp: registrar es un extra, abrir WhatsApp no.

> **Los precios no los pone el navegador.** `POST /api/pedidos` es la
> única ruta pública que escribe, así que el worker recalcula todo
> contra la base: el precio de cada vianda, el costo del envío y el
> total. Del cuerpo del pedido se usa sólo *qué* se pidió, nunca
> *cuánto* sale. Tampoco se puede pedir un día que ya pasó, uno que es
> feriado, ni una categoría que ese día no está publicada.

No hay pasarela de pago online: eso sigue igual que siempre.

---

### El tablero

`/admin/estadisticas/` contesta preguntas que cambian decisiones, no
sólo muestra números: qué menú conviene cocinar más, si la web sirve o
todo sigue entrando por WhatsApp, si se está creciendo, cuánto deja cada
pedido, si conviene reforzar el reparto o los puntos de retiro, qué día
hay que cocinar más y si las clientas vuelven.

Dos cosas que conviene saber para leerlo bien:

- **Los pedidos cancelados no cuentan** en ninguna cifra. No se
  cocinaron ni se cobraron; contarlos infla la recaudación.
- **Una clienta es un teléfono.** Es lo único estable: el nombre lo
  escribe distinto cada vez y no hay cuentas de usuario. Por eso "Ana
  Pérez" y "ana perez" con el mismo número cuentan como una sola.
- Los importes salen de lo que **efectivamente se cobró**: cada línea de
  pedido guarda el precio del momento, así que cambiar la lista de
  precios hoy no reescribe la historia.

> **Los colores de los gráficos no son los de la marca, y es a
> propósito.** Los de `assets/css/styles.css` funcionan como acento de
> una pestaña, donde cada uno viene con su nombre al lado; como colores
> de gráfico fallan: Proteico y Ensalada quedan a ΔE 12,5 en visión
> normal (y 3,1 en deuteranopía), o sea que ni con visión normal se
> distinguen bien dos barras vecinas. Los del tablero son los mismos
> tonos corridos hasta pasar las verificaciones de contraste y de
> daltonismo, y están definidos en `admin/assets/css/panel.css`.
> Además ninguna barra depende sólo del color: todas llevan su nombre y
> su número.

---

## 3. Publicar

```bash
npx wrangler deploy --env staging   # a aume-staging.<tu-subdominio>.workers.dev
npx wrangler deploy                 # a producción (el dominio real)
```

---

## 4. Cloudflare Access — 👉 esto lo configurás vos a mano

El panel **no tiene login propio**: no hay usuarios ni contraseñas
guardados en ningún lado. Quien decide si alguien entra es Cloudflare
Access, que corta el acceso en el borde, antes de que el pedido llegue al
sitio. Si mañana entra o sale una persona del equipo, se cambia acá y
listo: no hay que tocar ni publicar código.

### 4.1. Crear la aplicación

En el dashboard de Cloudflare → **Zero Trust** → **Access** →
**Applications** → **Add an application** → **Self-hosted**.

| Campo | Qué poner |
|---|---|
| Application name | `AUMÉ · Panel` |
| Session Duration | `24 hours` (se vuelve a pedir el mail una vez por día) |
| Domain | el dominio real del sitio, ej. `aume.com.ar` |
| Path | `admin` |

Con `Path: admin` queda protegido `/admin` y todo lo que cuelgue de él
(`/admin/menus/`, `/admin/pedidos/`, …). **La landing pública no queda
tocada**: `/`, `/assets/…` y `/api/pedidos` siguen abiertos para las
clientas.

> **Por qué no se protege también `/api/*` desde Access:** ahí conviven
> rutas públicas (la landing lee los precios y deja los pedidos) con
> rutas del panel, y Access filtra por ruta, no por método. La cookie que
> Access deja en el navegador (`CF_Authorization`) igual viaja en las
> llamadas a `/api/*`, y **el Worker la verifica por su cuenta** antes de
> dejar tocar nada del panel. O sea: el panel queda con dos cerrojos y la
> landing con ninguno, que es lo que queremos.

### 4.2. La política: los 2 usuarios

En la misma aplicación → **Policies** → **Add a policy**:

| Campo | Valor |
|---|---|
| Policy name | `Equipo AUMÉ` |
| Action | **Allow** |
| Include → selector | **Emails** |
| Value | el mail de la dueña/nutricionista |
| Value | el mail de la secretaria |

Las dos personas tienen **exactamente los mismos permisos** sobre todo el
panel: no hay roles ni permisos diferenciados, y el código no distingue
entre una y otra.

Para agregar o sacar a alguien más adelante: entrás a esta misma política
y editás la lista de mails. Nada más.

Si no querés depender de un proveedor de identidad (Google, etc.),
alcanza con dejar activo el método **One-time PIN**: Access les manda un
código al mail cada vez que necesitan entrar.

### 4.3. Conectar Access con el Worker

Una vez creada la aplicación, Cloudflare te muestra su
**Application Audience (AUD) Tag**: una tira larga de letras y números.

1. Copiá ese AUD.
2. Buscá tu **team domain** en Zero Trust → **Settings** → **Custom Pages**
   (tiene la forma `algo.cloudflareaccess.com`).
3. Poné los dos valores en `wrangler.jsonc`:

```jsonc
"vars": {
  "AUME_ENTORNO": "produccion",
  "ACCESS_TEAM_DOMAIN": "aume.cloudflareaccess.com",
  "ACCESS_AUD": "el-aud-largo-que-copiaste"
}
```

4. `npx wrangler deploy`.

> ⚠️ **Mientras esas dos variables estén vacías en producción, la API del
> panel responde 503 a propósito.** Es intencional: preferimos que el
> panel se rompa de forma visible antes de que quede abierto sin que
> nadie se entere. La landing pública **no** se ve afectada por esto.
>
> En `staging` y en `wrangler dev` no hace falta configurarlas: ahí el
> worker deja pasar con una identidad simulada (`dev@local`) para poder
> trabajar tranquilo.

### 4.4. Comprobar que quedó bien

- Abrí `https://tu-dominio/admin/` en una ventana de incógnito
  → tiene que pedirte el mail. Con un mail que no está en la política,
  tiene que **rechazarte**.
- Abrí `https://tu-dominio/` → tiene que entrar **sin pedir nada**.
- Con sesión iniciada, `https://tu-dominio/api/salud` tiene que devolver
  `{"ok":true,…}` con tu mail en `identidad`.

---

## 5. Tests

Hay dos suites y cubren cosas distintas:

```bash
npm test        # la web pública (Playwright, en tests/)
npm run test:api   # el worker y los .sql (en worker/tests/)
```

`npm run test:api` no se conecta a ninguna base ni a internet: corre en
segundos y conviene correrlo antes de tocar D1.

Los grupos que trae:

| Grupo | Qué revisa |
|---|---|
| `sql-limites` | Que los `.sql` no tengan formas que **D1 rechaza** |
| `sql-datos` | Aplica `schema.sql` y `semilla.sql` sobre SQLite y verifica lo que queda |
| `tiempo` | Que las fechas se resuelvan en hora de Paraná, no en UTC |
| `api` | Ruteo, que la landing no pase por el worker, permisos y CSRF |

> **`sql-limites` es el más importante y el menos obvio.** D1 acepta
> muchos menos términos en un SELECT compuesto que el SQLite de
> escritorio. Y en SQLite un `INSERT INTO t VALUES (1),(2),(3)` **es**
> un SELECT compuesto por dentro, aunque no se vea ningún `UNION`
> escrito. Por eso un `.sql` puede pasar `sql-datos` sin problema y
> reventar contra la base de verdad con `too many terms in compound
> SELECT`. Este grupo lo detecta leyendo el archivo, sin conectarse a
> nada.
>
> Regla para cualquier `.sql` nuevo: **una fila por `INSERT`, y nada de
> `UNION`**.

Si `sql-datos` aparece como *salteado*, es que esa versión de Node no
trae `node:sqlite` (hace falta Node 22 o más nuevo). Los demás grupos
corren igual.

---

## 6. Estado por fase

| Fase | Qué incluye | Estado |
|---|---|---|
| 0 | Rama, esqueleto del worker, `schema.sql`, staging separado | ✅ hecha |
| 1 | Módulo de precios + la landing lee precios de la API | ✅ hecha |
| 2 | Módulo de menú (borrador/publicar) + la landing lee el menú | ✅ hecha |
| 3 | Módulo de pedidos + doble camino del checkout | ✅ hecha |
| 4 | Módulo de estadísticas | ✅ hecha |

En cada fase se corren los tests de Playwright (`npm test`) para
confirmar que la landing pública sigue intacta.
