/* =====================================================================
   AUMÉ · MENÚ DE LA SEMANA
   ---------------------------------------------------------------------
   👉 ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE EDITAR CADA SEMANA.

   CÓMO SE EDITA
   1. Cambiá el texto de "semana" (lo que se ve arriba del menú).
   2. Cambiá el "nombre" y la "descripcion" de cada plato.
   3. Guardá el archivo y listo. No se toca nada más.

   REGLAS
   • Respetá siempre las comillas ' ' y la coma , al final de cada línea.
   • Si un día NO hay una opción, escribí:   null
     Ejemplo:   ensalada: null,
     (la tarjeta de ese día aparece como "No disponible")
   • "etiquetas" es opcional: son los cartelitos chiquitos del plato.
     Podés borrarlas o dejar la lista vacía:   etiquetas: []
   ===================================================================== */

window.AUME_MENU = {

  /* Texto que se muestra arriba del menú */
  semana: 'Semana del 31/08 al 04/09',

  /* Nota opcional debajo del título (poné '' para ocultarla) */
  nota: 'Los pedidos de la semana se reciben hasta el domingo a las 20:00 hs.',

  platos: {

    /* ------------------------------- LUNES ------------------------- */
    lunes: {
      clasico: {
        nombre: 'Milanesa de ternera al horno con puré rústico',
        descripcion: 'Milanesa horneada con costra de avena y puré de papa y calabaza.',
        etiquetas: ['Sin fritura']
      },
      vegetariano: {
        nombre: 'Tarta de calabaza, puerro y queso',
        descripcion: 'Masa casera integral con relleno cremoso de calabaza asada.',
        etiquetas: ['Vegetariano']
      },
      proteico: {
        nombre: 'Pollo grillado con quinoa y vegetales asados',
        descripcion: 'Suprema marinada en hierbas sobre quinoa y mix de estación.',
        etiquetas: ['Alto en proteína', 'Sin TACC']
      },
      ensalada: {
        nombre: 'César de pollo',
        descripcion: 'Lechuga, pollo grillado, croutons, queso y aderezo césar liviano.',
        etiquetas: ['Fresca']
      }
    },

    /* ------------------------------- MARTES ------------------------ */
    martes: {
      clasico: {
        nombre: 'Pastel de papas',
        descripcion: 'Carne cortada a cuchillo con cubierta de papa y batata.',
        etiquetas: []
      },
      vegetariano: {
        nombre: 'Wok de vegetales con arroz yamaní',
        descripcion: 'Salteado de vegetales de estación con salsa de soja y jengibre.',
        etiquetas: ['Vegano']
      },
      proteico: {
        nombre: 'Salmón rosado con puré de coliflor',
        descripcion: 'Al horno con limón y eneldo, sobre puré liviano de coliflor.',
        etiquetas: ['Omega 3', 'Sin TACC']
      },
      ensalada: {
        nombre: 'Mediterránea con garbanzos',
        descripcion: 'Garbanzos, tomate, pepino, aceitunas, queso y oliva.',
        etiquetas: ['Vegetariana']
      }
    },

    /* ----------------------------- MIÉRCOLES ----------------------- */
    miercoles: {
      clasico: {
        nombre: 'Canelones de carne y verdura',
        descripcion: 'Con salsa de tomate casera y un toque de queso gratinado.',
        etiquetas: []
      },
      vegetariano: {
        nombre: 'Ñoquis de calabaza con salsa fileto',
        descripcion: 'Ñoquis caseros de calabaza con albahaca fresca.',
        etiquetas: ['Vegetariano']
      },
      proteico: {
        nombre: 'Bowl de carne magra, boniato y brócoli',
        descripcion: 'Cubos de nalga salteados con boniato asado y brócoli al vapor.',
        etiquetas: ['Alto en proteína']
      },
      ensalada: {
        nombre: 'Verde con atún y huevo',
        descripcion: 'Mix de hojas, atún, huevo, tomate cherry y semillas.',
        etiquetas: ['Sin TACC']
      }
    },

    /* ------------------------------ JUEVES ------------------------- */
    jueves: {
      clasico: {
        nombre: 'Pollo al verdeo con arroz primavera',
        descripcion: 'Pechuga en salsa de verdeo liviana y arroz con vegetales.',
        etiquetas: []
      },
      vegetariano: {
        nombre: 'Hamburguesas de lentejas con puré de zanahoria',
        descripcion: 'Burgers caseras de lenteja y avena, horneadas.',
        etiquetas: ['Vegano', 'Fuente de fibra']
      },
      proteico: {
        nombre: 'Omelette de claras con vegetales y pavita',
        descripcion: 'Relleno de espinaca, morrón y pavita, con ensalada tibia.',
        etiquetas: ['Alto en proteína', 'Sin TACC']
      },
      ensalada: {
        nombre: 'Caprese con quinoa',
        descripcion: 'Tomate, muzzarella, albahaca y quinoa con oliva.',
        etiquetas: ['Vegetariana']
      }
    },

    /* ------------------------------ VIERNES ------------------------ */
    viernes: {
      clasico: {
        nombre: 'Lasaña de carne y bechamel',
        descripcion: 'Capas de pasta fresca, carne y bechamel casera.',
        etiquetas: []
      },
      vegetariano: {
        nombre: 'Zapallitos rellenos con arroz integral',
        descripcion: 'Rellenos de vegetales, arroz integral y queso gratinado.',
        etiquetas: ['Vegetariano']
      },
      proteico: {
        nombre: 'Merluza al horno con ensalada de legumbres',
        descripcion: 'Filet de merluza con provenzal y ensalada tibia de porotos.',
        etiquetas: ['Alto en proteína', 'Sin TACC']
      },
      ensalada: {
        nombre: 'Thai de pollo y repollo',
        descripcion: 'Repollo, zanahoria, pollo, maní y aderezo de lima y jengibre.',
        etiquetas: ['Fresca']
      }
    }
  }
};
