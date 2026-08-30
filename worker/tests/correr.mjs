/* =====================================================================
   AUMÉ · worker/tests/correr.mjs
   Tests del worker y de los archivos .sql.

       npm run test:api

   Son los tests del BACKEND. Los de la web pública son los de Playwright
   (npm test) y siguen viviendo en tests/.

   POR QUÉ EXISTE ESTO
   ---------------------------------------------------------------------
   La semilla de D1 falló tres veces seguidas contra la base de verdad
   mientras pasaba perfecto en la prueba local, porque el SQLite de
   escritorio es más permisivo que D1. El grupo "sql-limites" existe para
   que eso no vuelva a pasar: revisa los .sql buscando las formas que D1
   rechaza, sin necesidad de conectarse a nada.
   ===================================================================== */

import { pathToFileURL } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');

/* ------------------------------------------------------- Herramientas */

let grupoActual = '';
const resultados = { ok: 0, mal: 0, salteados: 0 };
const fallos = [];

const api = {
  raiz: RAIZ,

  grupo(nombre) {
    grupoActual = nombre;
    console.log('\n\x1b[1m' + nombre + '\x1b[0m');
  },

  /* Afirma que algo es cierto */
  ok(etiqueta, condicion, detalle) {
    if (condicion) {
      resultados.ok++;
      console.log('  \x1b[32m✓\x1b[0m ' + etiqueta);
    } else {
      resultados.mal++;
      fallos.push(grupoActual + ' › ' + etiqueta + (detalle ? '\n      ' + detalle : ''));
      console.log('  \x1b[31m✗\x1b[0m ' + etiqueta + (detalle ? '\n      \x1b[31m' + detalle + '\x1b[0m' : ''));
    }
  },

  /* Afirma que dos valores son iguales (comparación por JSON) */
  igual(etiqueta, real, esperado) {
    const a = JSON.stringify(real), b = JSON.stringify(esperado);
    api.ok(etiqueta, a === b, a === b ? '' : 'obtuvo ' + a + ' · esperaba ' + b);
  },

  saltear(motivo) {
    resultados.salteados++;
    console.log('  \x1b[33m–\x1b[0m salteado: ' + motivo);
  }
};

/* ---------------------------------------------------------- Arranque */

const modulos = ['sql-limites.mjs', 'sql-datos.mjs', 'tiempo.mjs', 'api.mjs', 'precios.mjs', 'menus.mjs', 'pedidos.mjs', 'estadisticas.mjs'];

for (const archivo of modulos) {
  const url = pathToFileURL(path.join(import.meta.dirname, archivo)).href;
  let mod;
  try {
    mod = await import(url);
  } catch (e) {
    api.grupo(archivo);
    api.ok('el archivo de tests carga', false, e.message);
    continue;
  }

  api.grupo(mod.nombre || archivo);

  /* Cada grupo puede declararse no aplicable (por ejemplo, si esta
     versión de Node no trae node:sqlite). Eso no es un fallo. */
  if (mod.disponible) {
    const razon = await mod.disponible();
    if (razon) { api.saltear(razon); continue; }
  }

  try {
    await mod.correr(api);
  } catch (e) {
    api.ok('el grupo termina sin excepciones', false, e.stack || String(e));
  }
}

/* ---------------------------------------------------------- Resumen */

console.log('\n' + '─'.repeat(60));
if (fallos.length) {
  console.log('\x1b[31m' + resultados.mal + ' fallo(s):\x1b[0m');
  fallos.forEach((f) => console.log('  · ' + f));
}
console.log(
  (resultados.mal ? '\x1b[31m✗\x1b[0m' : '\x1b[32m✓\x1b[0m') + ' ' +
  resultados.ok + ' pasaron, ' + resultados.mal + ' fallaron' +
  (resultados.salteados ? ', ' + resultados.salteados + ' grupos salteados' : '')
);

process.exit(resultados.mal ? 1 : 0);
