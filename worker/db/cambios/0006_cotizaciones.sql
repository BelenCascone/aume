-- =====================================================================
-- AUMÉ · Cambio 0006 · Cotizaciones para empresas
-- ---------------------------------------------------------------------
-- Para bases QUE YA EXISTEN. Las nuevas ya salen con esto desde
-- worker/db/schema.sql.
--
--   npx wrangler d1 execute aume-staging --remote --file=worker/db/cambios/0006_cotizaciones.sql
--
-- Es lo único del sitio donde alguien de afuera deja sus datos. Por eso
-- se guarda acá y se ve en el panel: no depende de que a nadie le llegue
-- un mail ni de que alguien mire un WhatsApp a tiempo.
-- =====================================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa     TEXT    NOT NULL DEFAULT '',
  contacto    TEXT    NOT NULL,
  email       TEXT    NOT NULL DEFAULT '',
  telefono    TEXT    NOT NULL DEFAULT '',
  personas    INTEGER NOT NULL DEFAULT 0 CHECK (personas >= 0),
  zona        TEXT    NOT NULL DEFAULT '',
  dias        TEXT    NOT NULL DEFAULT '',
  mensaje     TEXT    NOT NULL DEFAULT '',

  estado      TEXT    NOT NULL DEFAULT 'nueva'
              CHECK (estado IN ('nueva', 'contactada', 'cerrada')),

  -- De dónde llegó, para poder frenar a alguien que mande cien
  -- formularios seguidos. Va HASHEADO a propósito: alcanza para contar
  -- cuántos vinieron del mismo lado y no guarda la dirección de nadie.
  origen_hash TEXT    NOT NULL DEFAULT '',

  creada_en   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- El panel pide siempre lo mismo: las nuevas primero.
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado
  ON cotizaciones (estado, creada_en DESC);

-- Y el freno de envíos consulta por origen y fecha.
CREATE INDEX IF NOT EXISTS idx_cotizaciones_origen
  ON cotizaciones (origen_hash, creada_en);

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (6, 'Cotizaciones para empresas');
