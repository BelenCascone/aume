/* =====================================================================
   AUMÉ · CONFIGURACIÓN DEL NEGOCIO
   ---------------------------------------------------------------------
   Acá viven los precios, los envíos, los puntos de retiro y los packs.
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

  /* --- PRECIO DE LA VIANDA ------------------------------------------
     El precio depende SOLO del tamaño, no del tipo de menú: una vianda
     Clásica y una Proteica valen lo mismo.                             */
  preciosVianda: {
    estandar: 9000,
    xl:       12800
  },

  /* --- Tamaños de porción ------------------------------------------- */
  tamanos: [
    { id: 'estandar', nombre: 'Menú del día',    gramos: '350gr' },
    { id: 'xl',       nombre: 'Menú del día XL', gramos: '500gr' }
  ],

  /* --- Tipos de menú (los 4 que cambian todas las semanas) ----------- */
  categorias: [
    {
      id: 'clasico',
      nombre: 'Clásico',
      descripcion: 'Los sabores de siempre, en su justa medida.',
      color: 'var(--c-clasico)',
      colorSuave: 'var(--c-clasico-suave)'
    },
    {
      id: 'vegetariano',
      nombre: 'Vegetariano',
      descripcion: 'Base vegetal, completo y nutritivo.',
      color: 'var(--c-vegetariano)',
      colorSuave: 'var(--c-vegetariano-suave)'
    },
    {
      id: 'proteico',
      nombre: 'Proteico',
      descripcion: 'Extra proteína para acompañar tu entrenamiento.',
      color: 'var(--c-proteico)',
      colorSuave: 'var(--c-proteico-suave)'
    },
    {
      id: 'ensalada',
      nombre: 'Ensalada',
      descripcion: 'Fresco, liviano y lleno de color.',
      color: 'var(--c-ensalada)',
      colorSuave: 'var(--c-ensalada-suave)'
    }
  ],

  /* --- Opción fija ---------------------------------------------------
     Está disponible TODOS los días, se muestre el tipo de menú que se
     muestre. No hay que cargarla cada semana en menu.js.               */
  extraFijo: {
    id: 'cesar',
    nombre: 'Ensalada César',
    descripcion: 'Nuestro clásico de siempre, disponible todos los días.',
    color: 'var(--c-ensalada)',
    colorSuave: 'var(--c-ensalada-suave)'
  },

  /* --- Días de la semana -------------------------------------------- */
  dias: [
    { id: 'lunes',     nombre: 'Lunes' },
    { id: 'martes',    nombre: 'Martes' },
    { id: 'miercoles', nombre: 'Miércoles' },
    { id: 'jueves',    nombre: 'Jueves' },
    { id: 'viernes',   nombre: 'Viernes' }
  ],

  /* --- ENVÍOS --------------------------------------------------------
     El costo es POR ENTREGA y depende de la zona.
     Las viandas sueltas siempre pagan envío; los packs semanales lo
     llevan bonificado (ver "packs" más abajo).                         */
  envio: {
    zonas: [
      { id: 'dentro', nombre: 'Dentro de bulevares', costo: 2000 },
      { id: 'fuera',  nombre: 'Fuera de bulevares',  costo: 2500 }
    ],
    aclaracion: 'Coordinamos el horario de entrega por WhatsApp.'
  },

  /* --- PACKS SEMANALES ----------------------------------------------
     Se elige la cantidad de días y el tamaño. El precio "efectivo" es
     el que ya está publicado (10% de descuento, redondeado a mano en
     algunos casos), así que va tal cual, no se calcula.
     envioBonificado: los packs no pagan envío.                         */
  packs: {
    envioBonificado: true,
    descuentoEfectivo: '10%',
    opciones: [
      {
        id: 'x5', dias: 5, nombre: 'Pack x5 días',
        precios: {
          estandar: { lista: 45000, efectivo: 40500 },
          xl:       { lista: 64000, efectivo: 57600 }
        }
      },
      {
        id: 'x4', dias: 4, nombre: 'Pack x4 días',
        precios: {
          estandar: { lista: 36000, efectivo: 32400 },
          xl:       { lista: 51200, efectivo: 46000 }
        }
      },
      {
        id: 'x3', dias: 3, nombre: 'Pack x3 días',
        precios: {
          estandar: { lista: 27000, efectivo: 24300 },
          xl:       { lista: 38400, efectivo: 34500 }
        }
      }
    ]
  },

  /* --- PLAN MENSUAL --------------------------------------------------
     Cambia todos los meses porque cambia la cantidad de días hábiles.
     El plan mensual SÍ paga envío (por cada entrega), igual que en el
     flyer de septiembre.

     👉 Para que el plan mensual pase a tener envío bonificado, poné
        envioBonificado: true                                           */
  planMensual: {
    envioBonificado: false,
    descuentoEfectivo: '15%',
    mes: 'Septiembre',
    almuerzos: 22,
    precios: {
      estandar: { lista: 198000, efectivo: 168300 },
      /* XL mensual todavía no está publicado. Cuando lo definan, poner
         los dos números acá y aparece solo en la web.                  */
      xl:       { lista: null,   efectivo: null }
    }
  },

  /* --- PREFERENCIA DE MENÚ (packs y plan mensual) --------------------
     Cuando alguien pide un pack o el plan mensual no elige plato por
     plato: elige qué TIPO de menú quiere que le armemos. Estas opciones
     salen de "categorias" (arriba) más la de combinar.                 */
  preferenciaCombinada: {
    id: 'combinado',
    nombre: 'Combinado',
    descripcion: 'Vamos variando entre los cuatro menús de la semana.'
  },

  /* --- OTROS PRODUCTOS ------------------------------------------------
     Todo lo que se suma al pedido por unidad, sin día ni tamaño:
     postres, yogures y congelados.

     "grupo" es sólo para ordenar la pantalla "Para sumar"; los grupos
     se definen abajo, en gruposProducto.

     ⚠️ PRECIOS A CONFIRMAR: los postres y los yogures están cargados
        con nombres y precios de EJEMPLO. Cambiá el nombre, el detalle y
        el precio de cada uno y listo; si alguno no va, borrá la línea
        entera (desde la llave { hasta la coma final).                  */
  productos: [
    {
      id: 'postre-flan',
      grupo: 'postres',
      nombre: 'Flan casero',                    /* ⚠️ CONFIRMAR */
      detalle: 'Porción individual',
      precio: 3500                              /* ⚠️ CONFIRMAR */
    },
    {
      id: 'postre-budin',
      grupo: 'postres',
      nombre: 'Budín de limón',                 /* ⚠️ CONFIRMAR */
      detalle: 'Porción individual',
      precio: 3500                              /* ⚠️ CONFIRMAR */
    },
    {
      id: 'yogur-natural',
      grupo: 'yogures',
      nombre: 'Yogur natural',                  /* ⚠️ CONFIRMAR */
      detalle: 'Pote individual',
      precio: 2800                              /* ⚠️ CONFIRMAR */
    },
    {
      id: 'yogur-granola',
      grupo: 'yogures',
      nombre: 'Yogur con granola',              /* ⚠️ CONFIRMAR */
      detalle: 'Pote individual con granola casera',
      precio: 3200                              /* ⚠️ CONFIRMAR */
    },
    {
      id: 'burger8',
      grupo: 'congelados',
      nombre: 'Hamburguesas de legumbres',
      detalle: 'Congeladas · Pack x8 unidades',
      precio: 13000
    }
  ],

  /* Grupos de la pantalla "Para sumar". El orden de esta lista es el
     orden en que se ven. Un producto sin grupo (o con un grupo que no
     está acá) cae en el último. */
  gruposProducto: [
    { id: 'postres',    nombre: 'Postres',    descripcion: 'Para cerrar el almuerzo.' },
    { id: 'yogures',    nombre: 'Yogures',    descripcion: 'Livianos, para la tarde.' },
    { id: 'congelados', nombre: 'Congelados', descripcion: 'Para tener siempre en el freezer.' }
  ],

  /* --- Puntos de retiro (Take Away) ---------------------------------
     Todos retiran a partir de las 12:00.                               */
  puntosRetiro: [
    {
      id: 'base',
      nombre: 'Local AUMÉ',
      direccion: 'San Martín 499',
      horarios: ['12:00 a 14:00 hs']
    },
    {
      id: 'oximarket',
      nombre: 'Oxymarket',
      direccion: 'Blas Parera 3308',
      horarios: ['12:30 a 13:30 hs', '17:00 a 21:00 hs']
    },
    {
      id: 'mesamies',
      nombre: 'Pastelería Mes Amies',
      direccion: 'Shopping La Paz',
      /* ⚠️ CONFIRMAR: hasta qué hora se puede retirar acá */
      horarios: ['Desde las 12:00 hs']
    }
  ],

  /* --- Métodos de pago -----------------------------------------------
     efectivo: true marca los pagos que acceden al descuento.           */
  metodosPago: [
    { id: 'efectivo',      nombre: 'Efectivo', efectivo: true },
    { id: 'transferencia', nombre: 'Transferencia bancaria' },
    { id: 'mercadopago',   nombre: 'Mercado Pago' }
  ]
};
