-- =====================================================================
-- AUMÉ · Esquema de la base D1
-- ---------------------------------------------------------------------
-- Este archivo es la fuente de verdad del esquema. Es IDEMPOTENTE: se
-- puede correr todas las veces que haga falta sin romper nada, porque
-- todo usa CREATE ... IF NOT EXISTS.
--
-- Cómo aplicarlo (ver docs/panel-admin.md para el paso a paso completo):
--
--   Local (base de prueba en tu compu, no toca nada real):
--     npx wrangler d1 execute aume-staging --local --file=worker/db/schema.sql
--
--   Staging (base de prueba en Cloudflare):
--     npx wrangler d1 execute aume-staging --remote --file=worker/db/schema.sql
--
--   Producción (recién cuando esté todo probado):
--     npx wrangler d1 execute aume-produccion --remote --file=worker/db/schema.sql
--
-- Los cambios POSTERIORES al esquema van como archivos nuevos y numerados
-- en worker/db/cambios/ (0002_..., 0003_...), y además se reflejan acá
-- para que este archivo siga describiendo la base completa.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Control de versión del esquema
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS esquema_version (
  version     INTEGER PRIMARY KEY,
  descripcion TEXT    NOT NULL,
  aplicado_en TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO esquema_version (version, descripcion)
VALUES (1, 'Esquema inicial: catálogo, precios, menús y pedidos');


-- =====================================================================
-- CATÁLOGO  (lo que hoy vive en assets/js/data/config.js)
-- =====================================================================

-- Los 4 tipos de menú + la opción fija (Ensalada César, es_fija = 1).
-- Los colores se guardan como el nombre de la variable CSS, igual que hoy,
-- para no duplicar la paleta fuera de assets/css/styles.css.
CREATE TABLE IF NOT EXISTS categorias (
  id          TEXT    PRIMARY KEY,
  nombre      TEXT    NOT NULL,
  descripcion TEXT    NOT NULL DEFAULT '',
  color       TEXT    NOT NULL DEFAULT 'var(--c-clasico)',
  color_suave TEXT    NOT NULL DEFAULT 'var(--c-clasico-suave)',
  orden       INTEGER NOT NULL DEFAULT 0,
  es_fija     INTEGER NOT NULL DEFAULT 0 CHECK (es_fija IN (0, 1)),
  activa      INTEGER NOT NULL DEFAULT 1 CHECK (activa  IN (0, 1))
);

-- Tamaños de porción. El precio de la vianda depende SOLO del tamaño:
-- una Clásica y una Proteica valen lo mismo. Por eso el precio vive acá.
-- Importes en pesos enteros (sin centavos), igual que en config.js.
CREATE TABLE IF NOT EXISTS tamanos (
  id     TEXT    PRIMARY KEY,
  nombre TEXT    NOT NULL,
  gramos TEXT    NOT NULL DEFAULT '',
  precio INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),
  orden  INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- Días en los que se sirve (hoy lunes a viernes).
CREATE TABLE IF NOT EXISTS dias (
  id     TEXT    PRIMARY KEY,   -- 'lunes' … 'viernes'
  nombre TEXT    NOT NULL,
  orden  INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- Costo del envío por zona. Es por entrega.
CREATE TABLE IF NOT EXISTS zonas_envio (
  id     TEXT    PRIMARY KEY,
  nombre TEXT    NOT NULL,
  costo  INTEGER NOT NULL DEFAULT 0 CHECK (costo >= 0),
  orden  INTEGER NOT NULL DEFAULT 0,
  activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1))
);

CREATE TABLE IF NOT EXISTS puntos_retiro (
  id        TEXT    PRIMARY KEY,
  nombre    TEXT    NOT NULL,
  direccion TEXT    NOT NULL DEFAULT '',
  horarios  TEXT    NOT NULL DEFAULT '[]',   -- JSON: ["12:00 a 14:00 hs", …]
  orden     INTEGER NOT NULL DEFAULT 0,
  activo    INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- efectivo = 1 marca los pagos que acceden al descuento.
CREATE TABLE IF NOT EXISTS metodos_pago (
  id       TEXT    PRIMARY KEY,
  nombre   TEXT    NOT NULL,
  efectivo INTEGER NOT NULL DEFAULT 0 CHECK (efectivo IN (0, 1)),
  orden    INTEGER NOT NULL DEFAULT 0,
  activo   INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- Otros productos sueltos (hamburguesas de legumbres, etc.).
CREATE TABLE IF NOT EXISTS productos (
  id      TEXT    PRIMARY KEY,
  nombre  TEXT    NOT NULL,
  detalle TEXT    NOT NULL DEFAULT '',
  precio  INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),
  orden   INTEGER NOT NULL DEFAULT 0,
  activo  INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);


-- =====================================================================
-- PRECIOS: packs semanales y plan mensual
-- =====================================================================

-- Los packs no pagan envío (envio_bonificado). El precio "efectivo" ya
-- viene con el descuento aplicado y redondeado a mano, así que se guarda
-- tal cual: NO se calcula.
CREATE TABLE IF NOT EXISTS packs (
  id                TEXT    PRIMARY KEY,
  nombre            TEXT    NOT NULL,
  dias              INTEGER NOT NULL CHECK (dias > 0),
  envio_bonificado  INTEGER NOT NULL DEFAULT 1 CHECK (envio_bonificado IN (0, 1)),
  orden             INTEGER NOT NULL DEFAULT 0,
  activo            INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS packs_precios (
  pack_id   TEXT    NOT NULL REFERENCES packs(id)   ON DELETE CASCADE,
  tamano_id TEXT    NOT NULL REFERENCES tamanos(id) ON DELETE CASCADE,
  lista     INTEGER CHECK (lista    IS NULL OR lista    >= 0),
  efectivo  INTEGER CHECK (efectivo IS NULL OR efectivo >= 0),
  PRIMARY KEY (pack_id, tamano_id)
);

-- Una sola fila (id = 1): cambia todos los meses porque cambia la
-- cantidad de días hábiles.
CREATE TABLE IF NOT EXISTS plan_mensual (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  mes                TEXT    NOT NULL DEFAULT '',
  almuerzos          INTEGER NOT NULL DEFAULT 0 CHECK (almuerzos >= 0),
  envio_bonificado   INTEGER NOT NULL DEFAULT 0 CHECK (envio_bonificado IN (0, 1)),
  descuento_efectivo TEXT    NOT NULL DEFAULT '',
  actualizado_en     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- lista/efectivo en NULL = ese tamaño todavía no está publicado y la web
-- no lo muestra (hoy es el caso del plan mensual XL).
CREATE TABLE IF NOT EXISTS plan_mensual_precios (
  tamano_id TEXT    PRIMARY KEY REFERENCES tamanos(id) ON DELETE CASCADE,
  lista     INTEGER CHECK (lista    IS NULL OR lista    >= 0),
  efectivo  INTEGER CHECK (efectivo IS NULL OR efectivo >= 0)
);

-- Cajón de sastre para los textos sueltos de la marca y del negocio
-- (número de WhatsApp, aclaración del envío, lema, Instagram…).
CREATE TABLE IF NOT EXISTS ajustes (
  clave          TEXT PRIMARY KEY,
  valor          TEXT NOT NULL DEFAULT '',
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);


-- =====================================================================
-- MENÚS
-- ---------------------------------------------------------------------
-- Un registro por DÍA servido, identificado por su fecha real. Guardar la
-- fecha (y no "semana 3 de septiembre") es lo que permite tener historial
-- para siempre, agrupar por mes en la grilla y cruzar menús con pedidos
-- en las estadísticas.
--
-- El historial NO se borra nunca: los meses viejos quedan en la tabla.
-- =====================================================================
CREATE TABLE IF NOT EXISTS menus (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha          TEXT    NOT NULL UNIQUE,          -- 'YYYY-MM-DD'
  dia_id         TEXT    NOT NULL,                 -- lunes … viernes
  mes            TEXT    NOT NULL,                 -- 'YYYY-MM', para agrupar la grilla
  estado         TEXT    NOT NULL DEFAULT 'borrador'
                         CHECK (estado IN ('borrador', 'publicado')),
  nota           TEXT    NOT NULL DEFAULT '',      -- nota opcional del día
  publicado_en   TEXT,                             -- NULL mientras es borrador
  creado_en      TEXT    NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_menus_mes    ON menus (mes, fecha);
CREATE INDEX IF NOT EXISTS idx_menus_estado ON menus (estado, fecha);

-- Un plato por menú y categoría. Si un día no hay una opción, la fila
-- simplemente no existe (o queda con disponible = 0): la web muestra
-- "No disponible", igual que hoy con `null` en menu.js.
CREATE TABLE IF NOT EXISTS menu_platos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id      INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  categoria_id TEXT    NOT NULL,
  nombre       TEXT    NOT NULL DEFAULT '',
  descripcion  TEXT    NOT NULL DEFAULT '',
  etiquetas    TEXT    NOT NULL DEFAULT '[]',      -- JSON: ["Sin TACC", …]
  disponible   INTEGER NOT NULL DEFAULT 1 CHECK (disponible IN (0, 1)),
  UNIQUE (menu_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_platos_menu ON menu_platos (menu_id);


-- =====================================================================
-- PEDIDOS
-- ---------------------------------------------------------------------
-- canal = 'app'      -> entró solo desde la landing (los dos botones del
--                       checkout cuentan como app)
-- canal = 'whatsapp' -> lo cargó la secretaria a mano en el panel porque
--                       llegó por WhatsApp directo
-- =====================================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,

  creado_en        TEXT    NOT NULL DEFAULT (datetime('now')),  -- ISO UTC
  -- Fecha local de Paraná (America/Argentina/Cordoba). La guardamos ya
  -- resuelta para poder filtrar "hoy" / "esta semana" sin pelear con la
  -- zona horaria dentro de SQL.
  fecha_local      TEXT    NOT NULL,                            -- 'YYYY-MM-DD'
  semana_local     TEXT    NOT NULL DEFAULT '',                 -- 'YYYY-Www' (ISO)
  dia_semana       INTEGER NOT NULL DEFAULT 0,                  -- 1 = lunes … 7 = domingo

  canal            TEXT    NOT NULL CHECK (canal IN ('app', 'whatsapp')),
  origen           TEXT    NOT NULL DEFAULT '',                 -- 'checkout-whatsapp' | 'checkout-confirmado' | 'panel'
  estado           TEXT    NOT NULL DEFAULT 'nuevo'
                           CHECK (estado IN ('nuevo', 'confirmado', 'entregado', 'cancelado')),

  cliente_nombre   TEXT    NOT NULL DEFAULT '',
  cliente_telefono TEXT    NOT NULL DEFAULT '',
  -- Sólo los dígitos del teléfono. Es la clave para detectar clientas que
  -- repiten aunque escriban el número con distinto formato.
  telefono_norm    TEXT    NOT NULL DEFAULT '',

  modalidad        TEXT    NOT NULL DEFAULT 'envio'
                           CHECK (modalidad IN ('envio', 'retiro')),
  zona_id          TEXT,
  direccion        TEXT    NOT NULL DEFAULT '',
  punto_id         TEXT,

  metodo_pago      TEXT    NOT NULL DEFAULT '',
  notas            TEXT    NOT NULL DEFAULT '',

  cantidad         INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  subtotal         INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  envio            INTEGER NOT NULL DEFAULT 0 CHECK (envio    >= 0),
  total            INTEGER NOT NULL DEFAULT 0 CHECK (total    >= 0),

  -- Evita que un doble toque en el checkout (o un reintento de red)
  -- registre el mismo pedido dos veces. NULL para los cargados a mano.
  clave_idem       TEXT    UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha    ON pedidos (fecha_local);
CREATE INDEX IF NOT EXISTS idx_pedidos_semana   ON pedidos (semana_local);
CREATE INDEX IF NOT EXISTS idx_pedidos_canal    ON pedidos (canal, fecha_local);
CREATE INDEX IF NOT EXISTS idx_pedidos_telefono ON pedidos (telefono_norm);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado   ON pedidos (creado_en);

-- Una fila por (día + categoría + tamaño) del pedido, igual que las líneas
-- del carrito de la web. Guardamos el precio y el nombre del plato del
-- momento: si mañana cambia la lista de precios o el menú, las
-- estadísticas viejas siguen siendo fieles a lo que se cobró.
CREATE TABLE IF NOT EXISTS pedido_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  fecha_menu      TEXT,                                  -- 'YYYY-MM-DD' si se conoce
  dia_id          TEXT    NOT NULL DEFAULT '',
  categoria_id    TEXT    NOT NULL,
  tamano_id       TEXT    NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  subtotal        INTEGER NOT NULL DEFAULT 0 CHECK (subtotal        >= 0),
  plato_nombre    TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_items_pedido    ON pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_items_categoria ON pedido_items (categoria_id);
