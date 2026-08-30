/* =====================================================================
   AUMÉ · worker/lib/origen.js
   Defensa contra CSRF en las rutas del panel.

   POR QUÉ HACE FALTA
   ---------------------------------------------------------------------
   Cloudflare Access protege /admin/* y deja la cookie CF_Authorization en
   el navegador. Esa cookie viaja sola en CADA pedido al dominio, así que
   si la nutri tiene el panel abierto y entra a otra página cualquiera,
   esa página podría disparar un PUT /api/precios "a nombre de ella".

   Por eso, en todo lo que ESCRIBE (POST/PUT/PATCH/DELETE) exigimos que el
   pedido venga de nuestro propio sitio. Las lecturas (GET) no cambian
   nada, así que no lo piden.
   ===================================================================== */

const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS'];

export function esMismoOrigen(request, url) {
  if (METODOS_SEGUROS.includes(request.method)) return true;

  /* Los navegadores modernos mandan esta cabecera y no se puede falsificar
     desde JavaScript. Si está, alcanza con ella. */
  const destino = request.headers.get('Sec-Fetch-Site');
  if (destino) return destino === 'same-origin';

  /* Respaldo para navegadores que no la manden: comparamos el Origin. */
  const origen = request.headers.get('Origin');
  if (origen) {
    try { return new URL(origen).origin === url.origin; } catch (e) { return false; }
  }

  /* Sin ninguna de las dos no podemos afirmar que venga de nuestro sitio.
     Un fetch() del navegador siempre manda al menos una, así que esto no
     rompe al panel; sí frena pedidos armados a mano desde otro lado. */
  return false;
}
