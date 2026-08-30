/* =====================================================================
   AUMÉ · worker/lib/access.js
   Quién puede entrar al panel.

   El login NO lo hacemos nosotros: lo hace Cloudflare Access, que se
   configura a mano en el dashboard (ver docs/panel-admin.md). Access
   corta el acceso ANTES de que el pedido llegue hasta acá y, cuando lo
   deja pasar, agrega una firma con la identidad de quien entró.

   Este archivo vuelve a verificar esa firma. Es a propósito: si algún día
   una ruta queda fuera de la política de Access por error, la API sigue
   estando cerrada igual.

   Doc de Cloudflare:
   https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
   ===================================================================== */

/* --------------------------------------------------------- Utilidades */

function base64UrlABytes(txt) {
  const b64 = txt.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const crudo = atob(relleno);
  const bytes = new Uint8Array(crudo.length);
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

function base64UrlAJson(txt) {
  return JSON.parse(new TextDecoder().decode(base64UrlABytes(txt)));
}

/* ------------------------------------------------------- Claves (JWKS)
   Las claves públicas del equipo cambian muy de vez en cuando. Las
   guardamos en memoria del isolate por unos minutos para no pedirlas en
   cada request. */

const CACHE_CLAVES = new Map();   // dominio -> { vence, claves: Map<kid, CryptoKey> }
const TTL_CLAVES_MS = 10 * 60 * 1000;

async function traerClaves(dominioEquipo) {
  const enCache = CACHE_CLAVES.get(dominioEquipo);
  if (enCache && enCache.vence > Date.now()) return enCache.claves;

  const url = 'https://' + dominioEquipo + '/cdn-cgi/access/certs';
  const res = await fetch(url, { cf: { cacheTtl: 600, cacheEverything: true } });
  if (!res.ok) throw new Error('No se pudieron leer las claves de Access (' + res.status + ')');

  const cuerpo = await res.json();
  const claves = new Map();

  for (const jwk of cuerpo.keys || []) {
    if (!jwk.kid) continue;
    try {
      const clave = await crypto.subtle.importKey(
        'jwk',
        { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
      claves.set(jwk.kid, clave);
    } catch (e) { /* una clave rota no invalida las demás */ }
  }

  if (!claves.size) throw new Error('Access no devolvió ninguna clave usable');

  CACHE_CLAVES.set(dominioEquipo, { vence: Date.now() + TTL_CLAVES_MS, claves });
  return claves;
}

/* ------------------------------------------------- Verificar el token */

async function verificarToken(token, dominioEquipo, aud) {
  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('El token no tiene el formato esperado');

  const [cabeceraB64, cargaB64, firmaB64] = partes;
  const cabecera = base64UrlAJson(cabeceraB64);

  if (cabecera.alg !== 'RS256') throw new Error('Algoritmo de firma inesperado: ' + cabecera.alg);

  const claves = await traerClaves(dominioEquipo);
  const clave = claves.get(cabecera.kid);
  if (!clave) throw new Error('El token está firmado con una clave que no conocemos');

  const firmado = new TextEncoder().encode(cabeceraB64 + '.' + cargaB64);
  const firmaOk = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', clave, base64UrlABytes(firmaB64), firmado
  );
  if (!firmaOk) throw new Error('La firma del token no es válida');

  const carga = base64UrlAJson(cargaB64);
  const ahora = Math.floor(Date.now() / 1000);
  const margen = 60;   // tolerancia por relojes desfasados

  if (typeof carga.exp === 'number' && carga.exp + margen < ahora) {
    throw new Error('La sesión venció, volvé a entrar');
  }
  if (typeof carga.nbf === 'number' && carga.nbf - margen > ahora) {
    throw new Error('El token todavía no es válido');
  }

  const emisorEsperado = 'https://' + dominioEquipo;
  if (carga.iss !== emisorEsperado) {
    throw new Error('El token no lo emitió el equipo esperado');
  }

  const audiencias = Array.isArray(carga.aud) ? carga.aud : [carga.aud];
  if (!audiencias.includes(aud)) {
    throw new Error('El token es de otra aplicación de Access');
  }

  return {
    email: carga.email || '',
    id: carga.sub || '',
    vence: carga.exp || 0
  };
}

/* --------------------------------------------------------- Entrada */

/* Devuelve { ok: true, identidad } o { ok: false, motivo, estado }.

   Fallar cerrado es a propósito: si en producción faltan las variables de
   Access, la API del panel NO responde. Preferimos que el panel se rompa
   ruidosamente antes que quedar abierto sin que nadie se entere. */
export async function identificar(request, env) {
  const dominioEquipo = (env.ACCESS_TEAM_DOMAIN || '').trim();
  const aud = (env.ACCESS_AUD || '').trim();
  const entorno = (env.AUME_ENTORNO || 'produccion').trim();

  if (!dominioEquipo || !aud) {
    if (entorno === 'produccion') {
      return {
        ok: false,
        estado: 503,
        motivo: 'El panel todavía no tiene configurado Cloudflare Access ' +
                '(faltan ACCESS_TEAM_DOMAIN y ACCESS_AUD). Ver docs/panel-admin.md.'
      };
    }
    /* En local y en staging se puede trabajar sin Access montado. */
    return { ok: true, identidad: { email: 'dev@local', id: 'dev', simulada: true } };
  }

  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    leerCookie(request, 'CF_Authorization');

  if (!token) {
    return { ok: false, estado: 401, motivo: 'Entrá al panel desde el enlace de Cloudflare Access.' };
  }

  try {
    const identidad = await verificarToken(token, dominioEquipo, aud);
    return { ok: true, identidad };
  } catch (e) {
    return { ok: false, estado: 401, motivo: e.message };
  }
}

function leerCookie(request, nombre) {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;
  for (const trozo of cookies.split(';')) {
    const i = trozo.indexOf('=');
    if (i < 0) continue;
    if (trozo.slice(0, i).trim() === nombre) return trozo.slice(i + 1).trim();
  }
  return null;
}
