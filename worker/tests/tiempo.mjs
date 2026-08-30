/* =====================================================================
   AUMÉ · Fechas en hora de Paraná
   ---------------------------------------------------------------------
   El worker corre en UTC. Si guardáramos la fecha del pedido en UTC,
   todo lo que entre después de las 21:00 de Argentina contaría como del
   día siguiente y los resúmenes por día de la secretaria darían mal.
   ===================================================================== */

export const nombre = 'tiempo · fechas en hora de Paraná';

export async function correr(t) {
  const T = await import('../lib/tiempo.js');

  /* 00:30 UTC = 21:30 del día anterior en Paraná */
  t.igual('un pedido de las 21:30 cuenta como ese día, no como el siguiente',
    T.fechaLocal(new Date('2026-09-02T00:30:00Z')), '2026-09-01');
  t.igual('un pedido del mediodía',
    T.fechaLocal(new Date('2026-09-01T15:00:00Z')), '2026-09-01');
  t.igual('a la medianoche de Paraná ya empieza el día nuevo',
    T.fechaLocal(new Date('2026-09-02T03:00:00Z')), '2026-09-02');

  t.igual('2026-08-31 es lunes', [T.diaSemana('2026-08-31'), T.idDia('2026-08-31')], [1, 'lunes']);
  t.igual('2026-09-04 es viernes', [T.diaSemana('2026-09-04'), T.idDia('2026-09-04')], [5, 'viernes']);
  t.igual('2026-09-06 es domingo', [T.diaSemana('2026-09-06'), T.idDia('2026-09-06')], [7, 'domingo']);

  /* La semana del negocio arranca el lunes */
  t.ok('lunes y viernes caen en la misma semana',
    T.semanaISO('2026-08-31') === T.semanaISO('2026-09-04'));
  t.ok('el domingo cierra esa misma semana',
    T.semanaISO('2026-09-06') === T.semanaISO('2026-08-31'));
  t.ok('el lunes siguiente ya es otra semana',
    T.semanaISO('2026-09-07') !== T.semanaISO('2026-09-06'));
  t.ok('la semana tiene formato YYYY-Www', /^\d{4}-W\d{2}$/.test(T.semanaISO('2026-09-01')));

  t.igual('el mes de una fecha', T.mesDe('2026-09-04'), '2026-09');

  t.ok('acepta una fecha real', T.esFechaValida('2026-09-01'));
  t.ok('rechaza el 31 de febrero', !T.esFechaValida('2026-02-31'));
  t.ok('rechaza un formato suelto', !T.esFechaValida('1/9/2026'));
  t.ok('rechaza un texto vacío', !T.esFechaValida(''));
}
