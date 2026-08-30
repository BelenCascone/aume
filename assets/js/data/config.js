/* =====================================================================
   AUMÉ · CONFIGURACIÓN DEL NEGOCIO
   ---------------------------------------------------------------------
   Este archivo contiene los datos que casi NUNCA cambian:
   teléfono, precios, reglas de envío y puntos de retiro.
   Para cambiar el MENÚ DE LA SEMANA editá: assets/js/data/menu.js
   ===================================================================== */

window.AUME_CONFIG = {

  /* --- Datos de contacto ------------------------------------------- */
  marca: {
    nombre: 'AUMÉ',
    lema: 'El equilibrio perfecto entre nutrirse y comer rico',
    origen: 'Del latín «Aurea Mediocritas»: la justa medida entre dos extremos.',
    ciudad: 'Paraná, Entre Ríos',
    instagram: 'aume.viandas',
    instagramUrl: 'https://instagram.com/aume.viandas'
  },

  /* Número de WhatsApp que recibe los pedidos.
     Formato internacional SIN + ni espacios.  Argentina = 54 9 + área + número
     Acá: 343 5038054 (Paraná)  ->  '5493435038054'                        */
  whatsapp: '5493435038054',

  /* --- Categorías de menú (colores de marca) ------------------------
     ⚠️ ACTUALIZAR PRECIOS al valor vigente.                            */
  categorias: [
    {
      id: 'clasico',
      nombre: 'Clásico',
      descripcion: 'Los sabores de siempre, en su justa medida.',
      color: 'var(--c-clasico)',
      colorSuave: 'var(--c-clasico-suave)',
      precios: { estandar: 8500, xl: 10500 }
    },
    {
      id: 'vegetariano',
      nombre: 'Vegetariano',
      descripcion: 'Base vegetal, completo y nutritivo.',
      color: 'var(--c-vegetariano)',
      colorSuave: 'var(--c-vegetariano-suave)',
      precios: { estandar: 8500, xl: 10500 }
    },
    {
      id: 'proteico',
      nombre: 'Proteico',
      descripcion: 'Extra proteína para acompañar tu entrenamiento.',
      color: 'var(--c-proteico)',
      colorSuave: 'var(--c-proteico-suave)',
      precios: { estandar: 9500, xl: 11500 }
    },
    {
      id: 'ensalada',
      nombre: 'Ensalada',
      descripcion: 'Fresco, liviano y lleno de color.',
      color: 'var(--c-ensalada)',
      colorSuave: 'var(--c-ensalada-suave)',
      precios: { estandar: 8000, xl: 9800 }
    }
  ],

  /* --- Tamaños de porción ------------------------------------------- */
  tamanos: [
    { id: 'estandar', nombre: 'Estándar', gramos: '350gr' },
    { id: 'xl',       nombre: 'XL',       gramos: '500gr' }
  ],

  /* --- Días de la semana -------------------------------------------- */
  dias: [
    { id: 'lunes',     nombre: 'Lunes' },
    { id: 'martes',    nombre: 'Martes' },
    { id: 'miercoles', nombre: 'Miércoles' },
    { id: 'jueves',    nombre: 'Jueves' },
    { id: 'viernes',   nombre: 'Viernes' }
  ],

  /* --- Reglas de envío ----------------------------------------------
     minimoGratis: cantidad de viandas a partir de la cual el envío
     queda BONIFICADO.                                                  */
  envio: {
    costo: 1800,          /* ⚠️ ACTUALIZAR costo de envío */
    minimoGratis: 5,
    zona: 'Paraná y alrededores',
    aclaracion: 'Entregas de 11:30 a 13:30 hs.'
  },

  /* --- Puntos de retiro (Take Away) --------------------------------- */
  puntosRetiro: [
    {
      id: 'base',
      nombre: 'Base AUMÉ',
      direccion: 'San Martín 499',
      horarios: ['12:00 a 14:00 hs']
    },
    {
      id: 'oximarket',
      nombre: 'OXIMARKET',
      direccion: 'Blas Parera y Los Robles',
      horarios: ['12:30 a 13:30 hs', '17:00 a 21:00 hs']
    },
    {
      id: 'mesamies',
      nombre: 'MES AMIES',
      direccion: 'Venezuela 61',
      horarios: ['12:00 a 21:00 hs']
    }
  ],

  /* --- Métodos de pago ----------------------------------------------- */
  metodosPago: [
    { id: 'transferencia', nombre: 'Transferencia bancaria' },
    { id: 'efectivo',      nombre: 'Efectivo' },
    { id: 'mercadopago',   nombre: 'Mercado Pago' }
  ]
};
