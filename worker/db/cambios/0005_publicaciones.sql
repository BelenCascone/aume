-- =====================================================================
-- AUMÉ · Cambio 0005 · Publicaciones (tips, recetas e info nutricional)
-- ---------------------------------------------------------------------
-- Para bases QUE YA EXISTEN. Las nuevas ya salen con esto desde
-- worker/db/schema.sql.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0005_publicaciones.sql
--
-- Es lo que le da autonomía a quien maneja las redes: escribe la
-- publicación en /admin/publicaciones/ y aparece sola en la landing, sin
-- que nadie toque un archivo. Correrlo dos veces no hace nada.
-- =====================================================================

-- La imagen NO se guarda acá: en `imagen` va el nombre del archivo
-- dentro del bucket R2, y el worker lo sirve desde /api/publicaciones/
-- imagenes/<archivo>. La base guarda texto, los archivos van a R2, que
-- es para lo que sirve cada uno.
CREATE TABLE IF NOT EXISTS publicaciones (
  id             TEXT    PRIMARY KEY,   -- 'tres-mitos-de-invierno'
  titulo         TEXT    NOT NULL,
  copete         TEXT    NOT NULL DEFAULT '',
  cuerpo         TEXT    NOT NULL DEFAULT '',
  categoria      TEXT    NOT NULL DEFAULT 'tip'
                 CHECK (categoria IN ('tip', 'receta', 'nutricion')),
  imagen         TEXT    NOT NULL DEFAULT '',
  imagen_alt     TEXT    NOT NULL DEFAULT '',
  -- Mientras está en borrador NO sale nunca en la respuesta pública.
  estado         TEXT    NOT NULL DEFAULT 'borrador'
                 CHECK (estado IN ('borrador', 'publicado')),
  fecha          TEXT    NOT NULL,      -- 'YYYY-MM-DD', la que se muestra
  creado_en      TEXT    NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- La landing pide siempre lo mismo: las publicadas, de la más nueva a la
-- más vieja.
CREATE INDEX IF NOT EXISTS idx_publicaciones_estado
  ON publicaciones (estado, fecha DESC);

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (5, 'Publicaciones: tips, recetas e info nutricional');
