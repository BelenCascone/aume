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
| `/api/precios`                   | GET    | **público** | 1    |
| `/api/precios`                   | PUT    | panel       | 1    |
| `/api/menus`                     | GET    | **público** (sólo publicados) | 2 |
| `/api/menus/:fecha`              | GET    | panel       | 2    |
| `/api/menus/:fecha`              | PUT    | panel       | 2    |
| `/api/menus/:fecha/publicar`     | POST   | panel       | 2    |
| `/api/pedidos`                   | POST   | **público** (checkout de la landing) | 3 |
| `/api/pedidos`                   | GET    | panel       | 3    |
| `/api/pedidos/manual`            | POST   | panel       | 3    |
| `/api/pedidos/:id`               | PATCH  | panel       | 3    |
| `/api/estadisticas`              | GET    | panel       | 4    |

Las rutas marcadas "panel" exigen una identidad válida de Cloudflare
Access **y** que el pedido salga del propio sitio (defensa contra CSRF).

---

## 2. Crear las bases de datos D1

Se hace una sola vez. **Empezá siempre por staging** y no toques
producción hasta que esté todo probado.

```bash
# 1. Crear las dos bases
npx wrangler d1 create aume-staging
npx wrangler d1 create aume-produccion
```

Cada comando imprime un `database_id`. **Copiá cada uno a
`wrangler.jsonc`**, reemplazando los textos `PENDIENTE-CREAR-BASE-DE-…`:

- el de `aume-staging` → dentro de `env.staging.d1_databases`
- el de `aume-produccion` → dentro del `d1_databases` de arriba de todo

```bash
# 2. Crear las tablas
npx wrangler d1 execute aume-staging --remote --file=worker/db/schema.sql

# 3. Cargar los datos iniciales (los precios y el menú de hoy)
npx wrangler d1 execute aume-staging --remote --file=worker/db/semilla.sql
```

Cuando llegue el momento de producción, los mismos dos comandos con
`aume-produccion`.

Los dos archivos se pueden correr **todas las veces que haga falta**:
`schema.sql` usa `CREATE TABLE IF NOT EXISTS` y `semilla.sql` usa
`INSERT OR IGNORE`, así que no pisan nada que ya hayas editado desde el
panel.

Los cambios de esquema que vengan después van como archivos nuevos y
numerados en `worker/db/cambios/` (`0002_…sql`, `0003_…sql`), y además se
reflejan en `schema.sql` para que ese archivo siga describiendo la base
completa.

### Probar sin internet

```bash
npx wrangler d1 execute aume-staging --local --file=worker/db/schema.sql
npx wrangler d1 execute aume-staging --local --file=worker/db/semilla.sql
npx wrangler dev --env staging
```

`--local` usa una base SQLite en tu propia compu: no toca nada de
Cloudflare.

Para mirar qué hay adentro:

```bash
npx wrangler d1 execute aume-staging --local --command="SELECT id, nombre, precio FROM tamanos"
```

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

## 5. Estado por fase

| Fase | Qué incluye | Estado |
|---|---|---|
| 0 | Rama, esqueleto del worker, `schema.sql`, staging separado | ✅ hecha |
| 1 | Módulo de precios + la landing lee precios de la API | pendiente |
| 2 | Módulo de menú (borrador/publicar) + la landing lee el menú | pendiente |
| 3 | Módulo de pedidos + doble camino del checkout | pendiente |
| 4 | Módulo de estadísticas | pendiente |

En cada fase se corren los tests de Playwright (`npm test`) para
confirmar que la landing pública sigue intacta.
