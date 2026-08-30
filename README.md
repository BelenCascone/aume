# aume
Aume Viandas

## Panel de administración (en construcción)

El panel privado vive en `/admin/` y su API en `/api/*` (Cloudflare Worker
+ base D1). La landing pública no se movió de lugar y sigue funcionando
aunque el worker falle.

El panel **no tiene login propio**: lo protege **Cloudflare Access**, que
se configura a mano en el dashboard. En resumen:

- Aplicación *Self-hosted* sobre el dominio real, **Path: `admin`**
  (protege `/admin` y todo lo que cuelga de ahí; la landing queda abierta).
- Una política **Allow** con selector **Emails** y los **2 mails** del
  equipo (la dueña/nutricionista y la secretaria). Las dos tienen los
  mismos permisos sobre todo el panel.
- El *AUD Tag* y el *team domain* de esa aplicación van en `wrangler.jsonc`
  (`ACCESS_AUD` y `ACCESS_TEAM_DOMAIN`).

👉 **Paso a paso completo, migraciones de D1 y entorno de staging:**
[`docs/panel-admin.md`](docs/panel-admin.md)
