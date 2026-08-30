/* =====================================================================
   AUMÉ · worker/lib/tiempo.js
   Fechas en hora de Paraná.

   El worker corre en UTC. Si guardáramos la fecha del pedido en UTC, todo
   lo que entre después de las 21:00 de Argentina contaría como del día
   siguiente y los resúmenes por día de la secretaria darían mal.
   Argentina no tiene horario de verano: siempre UTC-3.
   ===================================================================== */

const ZONA = 'America/Argentina/Cordoba';   // misma hora que Paraná

/* 'YYYY-MM-DD' del momento indicado, en hora de Paraná */
export function fechaLocal(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(fecha);
  return partes;   // en-CA ya devuelve YYYY-MM-DD
}

/* 1 = lunes … 7 = domingo, en hora de Paraná */
export function diaSemana(fechaISO) {
  const d = new Date(fechaISO + 'T12:00:00Z');   // mediodía: nunca cambia de día
  const js = d.getUTCDay();                      // 0 = domingo
  return js === 0 ? 7 : js;
}

const IDS_DIA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

/* 'lunes' … 'domingo' a partir de una fecha 'YYYY-MM-DD' */
export function idDia(fechaISO) {
  return IDS_DIA[diaSemana(fechaISO) - 1];
}

/* Semana ISO: 'YYYY-Www'. Sirve para agrupar "esta semana" sin ambigüedad
   (la semana arranca el lunes, como el negocio). */
export function semanaISO(fechaISO) {
  const d = new Date(fechaISO + 'T12:00:00Z');
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);          // jueves de esa semana
  const anio = d.getUTCFullYear();
  const inicioAnio = new Date(Date.UTC(anio, 0, 1));
  const numero = Math.ceil(((d - inicioAnio) / 86400000 + 1) / 7);
  return anio + '-W' + String(numero).padStart(2, '0');
}

/* 'YYYY-MM' — para agrupar la grilla de menús por mes */
export function mesDe(fechaISO) {
  return String(fechaISO).slice(0, 7);
}

/* Momento actual en ISO UTC, que es lo que guardamos en creado_en */
export function ahoraISO() {
  return new Date().toISOString();
}

/* true si el texto es una fecha 'YYYY-MM-DD' que existe de verdad
   (descarta '2026-02-31' y cualquier cosa con formato raro) */
export function esFechaValida(txt) {
  if (typeof txt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(txt)) return false;
  const d = new Date(txt + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === txt;
}
