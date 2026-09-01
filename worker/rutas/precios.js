/* =====================================================================
   AUMÉ · worker/rutas/precios.js   ·   /api/precios

   GET  público    -> lo consume la landing (y el panel)
   PUT  protegido  -> lo edita el panel

   La respuesta del GET viene con las mismas claves que
   assets/js/data/config.js a propósito: así la landing la puede mezclar
   encima de su config estática sin traducir nada, y si la API no
   responde se queda con los valores del archivo, que siguen siendo
   válidos. La base es la fuente de verdad; el archivo es el respaldo.
   ===================================================================== */

import { json, errores, leerJson } from '../lib/respuesta.js';

/* ------------------------------------------------------------ Lectura */

export async function leerPrecios(db) {
  const [tam, cat, dias, zonas, packs, packsPr, plan, planPr, puntos, pagos, prods, ajustes] =
    await db.batch([
      db.prepare('SELECT id, nombre, gramos, precio FROM tamanos WHERE activo = 1 ORDER BY orden'),
      db.prepare('SELECT id, nombre, descripcion, color, color_suave, es_fija FROM categorias WHERE activa = 1 ORDER BY orden'),
      db.prepare('SELECT id, nombre FROM dias WHERE activo = 1 ORDER BY orden'),
      db.prepare('SELECT id, nombre, costo FROM zonas_envio WHERE activa = 1 ORDER BY orden'),
      db.prepare('SELECT id, nombre, dias, envio_bonificado FROM packs WHERE activo = 1 ORDER BY orden'),
      db.prepare('SELECT pack_id, tamano_id, lista, efectivo FROM packs_precios'),
      db.prepare('SELECT mes, almuerzos, envio_bonificado, descuento_efectivo FROM plan_mensual WHERE id = 1'),
      db.prepare('SELECT tamano_id, lista, efectivo FROM plan_mensual_precios'),
      db.prepare('SELECT id, nombre, direccion, horarios FROM puntos_retiro WHERE activo = 1 ORDER BY orden'),
      db.prepare('SELECT id, nombre, efectivo FROM metodos_pago WHERE activo = 1 ORDER BY orden'),
      db.prepare('SELECT id, grupo, nombre, detalle, precio FROM productos WHERE activo = 1 ORDER BY orden'),
      db.prepare('SELECT clave, valor FROM ajustes')
    ]);

  const filas = (r) => (r && r.results) || [];
  const aj = {};
  filas(ajustes).forEach((a) => { aj[a.clave] = a.valor; });

  /* horarios se guarda como JSON. Si alguna fila quedó rota, mejor un
     punto de retiro sin horarios que una landing en blanco. */
  const jsonSeguro = (txt, porDefecto) => {
    try {
      const v = JSON.parse(txt);
      return Array.isArray(v) ? v : porDefecto;
    } catch (e) { return porDefecto; }
  };

  const preciosVianda = {};
  filas(tam).forEach((t) => { preciosVianda[t.id] = t.precio; });

  const categorias = filas(cat).filter((c) => !c.es_fija).map((c) => ({
    id: c.id, nombre: c.nombre, descripcion: c.descripcion,
    color: c.color, colorSuave: c.color_suave
  }));
  const fija = filas(cat).find((c) => c.es_fija);

  const porPack = {};
  filas(packsPr).forEach((p) => {
    porPack[p.pack_id] = porPack[p.pack_id] || {};
    porPack[p.pack_id][p.tamano_id] = { lista: p.lista, efectivo: p.efectivo };
  });

  const planPrecios = {};
  filas(planPr).forEach((p) => { planPrecios[p.tamano_id] = { lista: p.lista, efectivo: p.efectivo }; });

  const datos = {
    preciosVianda: preciosVianda,
    tamanos: filas(tam).map((t) => ({ id: t.id, nombre: t.nombre, gramos: t.gramos })),
    categorias: categorias,
    dias: filas(dias).map((d) => ({ id: d.id, nombre: d.nombre })),
    envio: {
      zonas: filas(zonas).map((z) => ({ id: z.id, nombre: z.nombre, costo: z.costo })),
      aclaracion: aj.envio_aclaracion || ''
    },
    packs: {
      envioBonificado: aj.packs_envio_bonificado === '1',
      descuentoEfectivo: aj.packs_descuento_efectivo || '',
      opciones: filas(packs).map((p) => ({
        id: p.id, dias: p.dias, nombre: p.nombre, precios: porPack[p.id] || {}
      }))
    },
    puntosRetiro: filas(puntos).map((p) => ({
      id: p.id, nombre: p.nombre, direccion: p.direccion,
      horarios: jsonSeguro(p.horarios, [])
    })),
    metodosPago: filas(pagos).map((m) => ({
      id: m.id, nombre: m.nombre, efectivo: m.efectivo === 1
    })),
    productos: filas(prods).map((p) => ({
      id: p.id, grupo: p.grupo, nombre: p.nombre, detalle: p.detalle, precio: p.precio
    })),
    whatsapp: aj.whatsapp || ''
  };

  if (fija) {
    datos.extraFijo = {
      id: fija.id, nombre: fija.nombre, descripcion: fija.descripcion,
      color: fija.color, colorSuave: fija.color_suave
    };
  }

  const p = plan && plan.results && plan.results[0];
  if (p) {
    datos.planMensual = {
      envioBonificado: p.envio_bonificado === 1,
      descuentoEfectivo: p.descuento_efectivo,
      mes: p.mes,
      almuerzos: p.almuerzos,
      precios: planPrecios
    };
  }

  return datos;
}

/* --------------------------------------------------------- Validación */

/* Un importe en pesos enteros. Nada de decimales, negativos ni textos:
   esto termina en la web pública y en la plata que se cobra. */
function importe(v, campo, errs, permiteNulo) {
  if (v === null || v === undefined || v === '') {
    if (permiteNulo) return null;
    errs.push(campo + ': hace falta un número');
    return null;
  }
  let n;
  if (typeof v === 'number') {
    n = v;
  } else if (typeof v === 'string') {
    /* Se aceptan "9000", "9.000" y "$ 9.000": nadie tiene que aprender un
       formato para cargar un precio. Pero se limpian SÓLO los separadores
       conocidos, y lo que queda tiene que ser todo dígitos.

       Antes acá se borraba cualquier cosa que no fuera un dígito, así que
       "gratis" quedaba en "" y terminaba guardándose como 0. Un precio en
       cero se publica en la web y se cobra. */
    const limpio = v.trim().replace(/[\s$.,]/g, '');
    if (!/^\d+$/.test(limpio)) { errs.push(campo + ': tiene que ser un número'); return null; }
    n = Number(limpio);
  } else {
    errs.push(campo + ': tiene que ser un número');
    return null;
  }
  if (!Number.isInteger(n)) { errs.push(campo + ': tiene que ser un número entero'); return null; }
  if (n < 0) { errs.push(campo + ': no puede ser negativo'); return null; }
  if (n > 99999999) { errs.push(campo + ': es demasiado grande'); return null; }
  return n;
}

function texto(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

/* --------------------------------------------------------- Escritura */

async function guardar(ctx) {
  const leido = await leerJson(ctx.request);
  if (!leido.ok) return errores.datosInvalidos([leido.motivo]);

  const c = leido.cuerpo;
  const errs = [];
  const ops = [];
  const db = ctx.db;

  /* --- Precio de la vianda por tamaño --- */
  if (c.preciosVianda && typeof c.preciosVianda === 'object') {
    for (const [id, valor] of Object.entries(c.preciosVianda)) {
      const n = importe(valor, 'Precio de ' + id, errs);
      if (n !== null) ops.push(db.prepare('UPDATE tamanos SET precio = ? WHERE id = ?').bind(n, id));
    }
  }

  /* --- Envío por zona --- */
  if (c.envio && Array.isArray(c.envio.zonas)) {
    for (const z of c.envio.zonas) {
      const n = importe(z.costo, 'Envío ' + (z.id || '?'), errs);
      if (n !== null) ops.push(db.prepare('UPDATE zonas_envio SET costo = ? WHERE id = ?').bind(n, z.id));
    }
  }
  if (c.envio && typeof c.envio.aclaracion === 'string') {
    ops.push(db.prepare("INSERT INTO ajustes (clave, valor, actualizado_en) VALUES ('envio_aclaracion', ?, datetime('now')) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = excluded.actualizado_en")
      .bind(texto(c.envio.aclaracion, 200)));
  }

  /* --- Packs semanales: lista y efectivo por tamaño --- */
  if (c.packs && Array.isArray(c.packs.opciones)) {
    for (const p of c.packs.opciones) {
      for (const [tamId, pr] of Object.entries(p.precios || {})) {
        const lista = importe(pr.lista, 'Pack ' + p.id + ' ' + tamId + ' (lista)', errs, true);
        const efec = importe(pr.efectivo, 'Pack ' + p.id + ' ' + tamId + ' (efectivo)', errs, true);
        ops.push(db.prepare('UPDATE packs_precios SET lista = ?, efectivo = ? WHERE pack_id = ? AND tamano_id = ?')
          .bind(lista, efec, p.id, tamId));
      }
    }
  }

  /* --- Plan mensual --- */
  if (c.planMensual && typeof c.planMensual === 'object') {
    const pm = c.planMensual;
    const almuerzos = importe(pm.almuerzos, 'Almuerzos del plan mensual', errs, true);
    ops.push(db.prepare("UPDATE plan_mensual SET mes = ?, almuerzos = ?, envio_bonificado = ?, descuento_efectivo = ?, actualizado_en = datetime('now') WHERE id = 1")
      .bind(texto(pm.mes, 40), almuerzos === null ? 0 : almuerzos,
            pm.envioBonificado ? 1 : 0, texto(pm.descuentoEfectivo, 10)));

    /* lista/efectivo en null = ese tamaño todavía no se publicó y la web
       no lo muestra. Es el caso del XL mensual hoy. */
    for (const [tamId, pr] of Object.entries(pm.precios || {})) {
      const lista = importe(pr.lista, 'Plan mensual ' + tamId + ' (lista)', errs, true);
      const efec = importe(pr.efectivo, 'Plan mensual ' + tamId + ' (efectivo)', errs, true);
      ops.push(db.prepare('UPDATE plan_mensual_precios SET lista = ?, efectivo = ? WHERE tamano_id = ?')
        .bind(lista, efec, tamId));
    }
  }

  if (errs.length) return errores.datosInvalidos(errs);
  if (!ops.length) return errores.datosInvalidos(['No mandaste ningún precio para cambiar.']);

  /* batch() es atómico: o entran todos los cambios o no entra ninguno.
     Nunca queremos media lista de precios actualizada. */
  await db.batch(ops);

  return json({
    guardado: true,
    cambios: ops.length,
    por: ctx.identidad ? ctx.identidad.email : null,
    precios: await leerPrecios(db)
  });
}

/* ------------------------------------------------------------ Rutas */

export function registrar(router) {
  router.get('/api/precios', async (ctx) => json(await leerPrecios(ctx.db)), { publica: true });
  router.put('/api/precios', guardar);
}
