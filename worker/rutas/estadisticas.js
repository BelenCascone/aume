/* =====================================================================
   AUMÉ · worker/rutas/estadisticas.js   ·   /api/estadisticas

   El tablero para los dueños. La idea no es mostrar números lindos sino
   contestar preguntas que cambian decisiones:

   · ¿Qué menú conviene cocinar más? -> porTipo
   · ¿La web sirve o todo sigue entrando por WhatsApp? -> porCanal
   · ¿Estamos creciendo? -> semanas
   · ¿Cuánto deja cada pedido? -> ticketPromedio
   · ¿Conviene reforzar el reparto o los puntos de retiro? -> entrega
   · ¿Qué día hay que cocinar más? -> porDiaEntrega
   · ¿Las clientas vuelven? -> clientas

   Todo sale de lo que efectivamente se cobró: los pedido_items guardan
   el precio del momento, así que cambiar la lista de precios hoy no
   reescribe la historia.
   ===================================================================== */

import { json, errores } from '../lib/respuesta.js';
import { fechaLocal, esFechaValida } from '../lib/tiempo.js';

/* Los ORDER BY llevan un segundo criterio a propósito: sin desempate,
   dos categorías con la misma cantidad salen en orden arbitrario y el
   tablero muestra un "menú más pedido" distinto en cada recarga. */
const DIAS_SEMANA = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function restarDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function diasEntre(desdeISO, hastaISO) {
  const a = Date.parse(desdeISO + 'T12:00:00Z');
  const b = Date.parse(hastaISO + 'T12:00:00Z');
  return Math.round((b - a) / 86400000);
}

function filas(r) { return (r && r.results) || []; }

/* Los pedidos cancelados no cuentan: no se cocinaron ni se cobraron.
   Contarlos infla la recaudación y ensucia todas las decisiones. */
const VIVOS = "estado != 'cancelado'";

async function tablero(ctx) {
  const q = ctx.url.searchParams;
  const hoy = fechaLocal();

  const hasta = esFechaValida(q.get('hasta')) ? q.get('hasta') : hoy;
  const desde = esFechaValida(q.get('desde')) ? q.get('desde') : restarDias(hasta, 27);

  if (desde > hasta) {
    return errores.datosInvalidos(['La fecha "desde" tiene que ser anterior a "hasta".']);
  }

  const p = [desde, hasta];
  const db = ctx.db;

  /* Filtro común. Los ítems se filtran por el pedido al que pertenecen,
     no por su propia fecha: lo que importa es cuándo entró la venta. */
  const wP = 'WHERE ' + VIVOS + ' AND fecha_local BETWEEN ? AND ?';
  const wI = 'JOIN pedidos p ON p.id = i.pedido_id WHERE p.' + VIVOS +
             ' AND p.fecha_local BETWEEN ? AND ?';

  const [
    totalesRes, canalRes, tipoRes, tamanoRes, entregaRes,
    diaPedidoRes, diaEntregaRes, semanaRes, pagoRes, zonaRes, clientasRes,
    favoritaRes
  ] = await db.batch([
    db.prepare('SELECT COUNT(*) AS pedidos, COALESCE(SUM(cantidad),0) AS viandas, ' +
      'COALESCE(SUM(total),0) AS plata, COALESCE(SUM(envio),0) AS envios ' +
      'FROM pedidos ' + wP).bind(...p),

    db.prepare('SELECT canal, COUNT(*) AS pedidos, COALESCE(SUM(cantidad),0) AS viandas, ' +
      'COALESCE(SUM(total),0) AS plata FROM pedidos ' + wP + ' GROUP BY canal').bind(...p),

    db.prepare('SELECT i.categoria_id AS id, SUM(i.cantidad) AS viandas, SUM(i.subtotal) AS plata ' +
      'FROM pedido_items i ' + wI + ' GROUP BY i.categoria_id ORDER BY viandas DESC, id').bind(...p),

    db.prepare('SELECT i.tamano_id AS id, SUM(i.cantidad) AS viandas, SUM(i.subtotal) AS plata ' +
      'FROM pedido_items i ' + wI + ' GROUP BY i.tamano_id ORDER BY viandas DESC, id').bind(...p),

    db.prepare('SELECT modalidad AS id, COUNT(*) AS pedidos, COALESCE(SUM(total),0) AS plata ' +
      'FROM pedidos ' + wP + ' GROUP BY modalidad').bind(...p),

    db.prepare('SELECT dia_semana AS n, COUNT(*) AS pedidos FROM pedidos ' + wP +
      ' GROUP BY dia_semana ORDER BY pedidos DESC, dia_semana').bind(...p),

    db.prepare('SELECT i.dia_id AS id, SUM(i.cantidad) AS viandas FROM pedido_items i ' + wI +
      " AND i.dia_id != '' GROUP BY i.dia_id ORDER BY viandas DESC, id").bind(...p),

    db.prepare('SELECT semana_local AS semana, COUNT(*) AS pedidos, ' +
      'COALESCE(SUM(cantidad),0) AS viandas, COALESCE(SUM(total),0) AS plata ' +
      'FROM pedidos ' + wP + ' GROUP BY semana_local ORDER BY semana_local').bind(...p),

    db.prepare('SELECT metodo_pago AS id, COUNT(*) AS pedidos, COALESCE(SUM(total),0) AS plata ' +
      'FROM pedidos ' + wP + ' GROUP BY metodo_pago ORDER BY pedidos DESC, id').bind(...p),

    db.prepare('SELECT zona_id AS id, COUNT(*) AS pedidos FROM pedidos ' + wP +
      " AND modalidad = 'envio' AND zona_id IS NOT NULL GROUP BY zona_id ORDER BY pedidos DESC").bind(...p),

    /* Una clienta = un teléfono. Es lo único estable: el nombre lo
       escribe distinto cada vez y no hay cuentas de usuario. */
    db.prepare('SELECT telefono_norm AS tel, MAX(cliente_nombre) AS nombre, ' +
      'COUNT(*) AS pedidos, COALESCE(SUM(total),0) AS plata, MAX(fecha_local) AS ultimo ' +
      'FROM pedidos ' + wP + " AND telefono_norm != '' " +
      'GROUP BY telefono_norm ORDER BY pedidos DESC, plata DESC, tel').bind(...p),

    /* Qué categoría pide más cada clienta. Viene ordenada de mayor a
       menor, así que la primera fila de cada teléfono es la favorita. */
    db.prepare('SELECT p.telefono_norm AS tel, i.categoria_id AS cat, ' +
      'SUM(i.cantidad) AS viandas FROM pedido_items i ' + wI +
      " AND p.telefono_norm != '' GROUP BY p.telefono_norm, i.categoria_id " +
      'ORDER BY tel, viandas DESC, cat').bind(...p)
  ]);

  const t = filas(totalesRes)[0] || { pedidos: 0, viandas: 0, plata: 0, envios: 0 };

  const porCanal = {
    app: { pedidos: 0, viandas: 0, plata: 0 },
    whatsapp: { pedidos: 0, viandas: 0, plata: 0 }
  };
  for (const c of filas(canalRes)) {
    porCanal[c.canal] = { pedidos: c.pedidos, viandas: c.viandas, plata: c.plata };
  }

  const entrega = { envio: { pedidos: 0, plata: 0 }, retiro: { pedidos: 0, plata: 0 } };
  for (const e of filas(entregaRes)) {
    entrega[e.id] = { pedidos: e.pedidos, plata: e.plata };
  }

  const clientas = filas(clientasRes);
  const repiten = clientas.filter((c) => c.pedidos > 1);

  /* La favorita de cada teléfono: como la consulta viene ordenada por
     viandas de mayor a menor, alcanza con quedarse con la primera fila
     que aparece de cada uno. */
  const favorita = new Map();
  for (const f of filas(favoritaRes)) {
    if (!favorita.has(f.tel)) favorita.set(f.tel, f.cat);
  }
  const conFavorita = (c) => ({ ...c, categoria: favorita.get(c.tel) || null });

  /* Para reconquistar no sirve cualquiera que pidió poco: alguien que
     pidió por primera vez esta semana no es una clienta perdida, es una
     clienta nueva, y escribirle una oferta sería molestarla. Por eso
     miramos sólo a las que hace más de dos semanas que no vuelven. */
  const dormidaDesde = restarDias(hasta, 14);
  const dormidas = clientas
    .filter((c) => c.ultimo <= dormidaDesde)
    .sort((a, b) => a.pedidos - b.pedidos || a.ultimo.localeCompare(b.ultimo) ||
                    a.tel.localeCompare(b.tel))
    .slice(0, 10)
    .map((c) => ({ ...conFavorita(c), diasSinPedir: diasEntre(c.ultimo, hasta) }));

  const semanas = filas(semanaRes);

  /* Crecimiento: la última semana contra la anterior. Con una sola
     semana de datos no hay comparación posible, y decir "+100%" sería
     inventar. */
  let crecimiento = null;
  if (semanas.length >= 2) {
    const ult = semanas[semanas.length - 1];
    const ant = semanas[semanas.length - 2];
    crecimiento = {
      semana: ult.semana,
      pedidos: ult.pedidos - ant.pedidos,
      plata: ult.plata - ant.plata,
      pctPedidos: ant.pedidos ? Math.round((ult.pedidos - ant.pedidos) * 100 / ant.pedidos) : null
    };
  }

  const diasPedido = filas(diaPedidoRes).map((d) => ({
    n: d.n, nombre: DIAS_SEMANA[d.n] || '?', pedidos: d.pedidos
  }));

  return json({
    desde, hasta, hoy,

    totales: {
      pedidos: t.pedidos,
      viandas: t.viandas,
      plata: t.plata,
      envios: t.envios,
      /* Redondeados a peso: mostrar centavos en un tablero es ruido. */
      ticketPromedio: t.pedidos ? Math.round(t.plata / t.pedidos) : 0,
      viandasPorPedido: t.pedidos ? Math.round(t.viandas * 10 / t.pedidos) / 10 : 0
    },

    porCanal,
    porTipo: filas(tipoRes),
    porTamano: filas(tamanoRes),
    entrega,
    porDiaPedido: diasPedido,
    porDiaEntrega: filas(diaEntregaRes),
    semanas,
    crecimiento,
    pagos: filas(pagoRes),
    zonas: filas(zonaRes),

    clientas: {
      total: clientas.length,
      repiten: repiten.length,
      pctRepiten: clientas.length ? Math.round(repiten.length * 100 / clientas.length) : 0,
      /* Sólo las que repiten, que son las que interesan para fidelizar.
         El teléfono va entero porque la secretaria lo necesita para
         llamarlas: es la misma información que ya ve en el listado. */
      top: repiten.slice(0, 10).map(conFavorita),
      reconquistar: dormidas
    }
  });
}

export function registrar(router) {
  router.get('/api/estadisticas', tablero);
}
