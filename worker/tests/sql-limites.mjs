/* =====================================================================
   AUMÉ · Límites que D1 impone a los .sql
   ---------------------------------------------------------------------
   Este grupo NO se conecta a ninguna base: lee los archivos .sql y busca
   las formas que D1 rechaza.

   EL PROBLEMA QUE VIENE A EVITAR
   ---------------------------------------------------------------------
   D1 tolera muchos menos términos en un SELECT compuesto que el SQLite
   de escritorio. Y en SQLite, un INSERT de varias filas

       INSERT INTO t (a) VALUES (1), (2), (3);

   se compila internamente como un SELECT compuesto

       SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3

   así que cuenta para ese límite aunque no se vea ningún UNION escrito.
   Resultado: un .sql que anda perfecto en la prueba local revienta
   contra la base de verdad con

       ERROR  too many terms in compound SELECT: SQLITE_ERROR

   Pasó tres veces con worker/db/semilla.sql. La regla es simple y no
   cuesta nada cumplirla: UNA FILA POR INSERT y nada de UNION.
   ===================================================================== */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const nombre = 'sql-limites · lo que D1 no acepta en un .sql';

/* Saca comentarios y vacía las cadenas de texto, para no confundir un
   "UNION" que aparece dentro de un comentario con uno de verdad. */
export function limpiar(sql) {
  let salida = '';
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];

    if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === "'") {
      i++;
      /* '' adentro de una cadena es un apóstrofo escapado, no el cierre */
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") { i += 2; continue; }
        if (sql[i] === "'") { i++; break; }
        i++;
      }
      salida += "''";
      continue;
    }
    salida += c;
    i++;
  }
  return salida;
}

export function statements(sql) {
  return limpiar(sql).split(';').map((s) => s.trim()).filter(Boolean);
}

/* Cuántas filas tiene el VALUES de un INSERT. Con las cadenas ya
   vaciadas, alcanza con contar los paréntesis de primer nivel. */
export function filasDelValues(stmt) {
  const m = /\bVALUES\b/i.exec(stmt);
  if (!m) return 0;

  let nivel = 0, filas = 0;
  for (let i = m.index + m[0].length; i < stmt.length; i++) {
    const c = stmt[i];
    if (c === '(') { if (nivel === 0) filas++; nivel++; }
    else if (c === ')') nivel--;
  }
  return filas;
}

export function correr(t) {
  const dir = path.join(t.raiz, 'worker', 'db');
  const archivos = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  t.ok('hay archivos .sql para revisar', archivos.length > 0);

  for (const archivo of archivos) {
    const sql = readFileSync(path.join(dir, archivo), 'utf8');
    const stmts = statements(sql);

    /* 1) Ningún operador de conjunto: son SELECT compuestos explícitos */
    const compuestos = stmts.filter((s) => /\b(UNION|INTERSECT|EXCEPT)\b/i.test(s));
    t.ok(
      archivo + ': sin UNION / INTERSECT / EXCEPT',
      compuestos.length === 0,
      compuestos.length ? compuestos.length + ' statement(s), el primero empieza con: ' +
        compuestos[0].slice(0, 70).replace(/\s+/g, ' ') : ''
    );

    /* 2) Un INSERT de varias filas ES un SELECT compuesto encubierto */
    const multi = stmts
      .map((s) => ({ s, filas: filasDelValues(s) }))
      .filter((x) => x.filas > 1);

    t.ok(
      archivo + ': ningún INSERT de varias filas',
      multi.length === 0,
      multi.length
        ? multi.length + ' statement(s); el peor tiene ' +
          Math.max(...multi.map((x) => x.filas)) + ' filas: ' +
          multi[0].s.slice(0, 70).replace(/\s+/g, ' ')
        : ''
    );

    t.ok(archivo + ': tiene statements', stmts.length > 0);
  }
}
