# landing-v2 · Propuesta de rediseño

Carpeta aparte, **no toca nada de la landing actual**. Para verla: doble clic en
`index.html`. Todos los links entre páginas son relativos, así que funciona
abriéndola desde el disco, sin servidor.

## Qué hay acá

| Archivo | Qué es |
|---|---|
| `index.html` | La home, corta. Portada, números y días de vianda, adelanto del menú, y el bloque de **empresas con el formulario de presupuesto**. |
| `menu.html` | La semana completa (5 días) + los cuatro menús + la César. |
| `precios.html` | Precios, envíos, retiro, packs (3/4/5 y plan mensual), los 3 pasos y los puntos de retiro. |
| `nosotros.html` | Manifiesto, *Aurea Mediocritas* y testimonios. |
| `tips.html` | La grilla del blog. |
| `estilos.css` | Todo el estilo de las cinco páginas, en un solo archivo. |

## Por qué se partió en páginas

El problema era el scroll infinito en celular. La home pasó de ~12 pantallas a
~4. Lo que no decide una compra —precios al detalle, quiénes somos, el blog—
se fue a su propia página, y lo que sí decide —qué se come, cuándo hay, y el
contacto de empresas— quedó arriba.

La navegación en celular es una fila de pastillas que se desliza en horizontal
bajo el logo. No hay menú hamburguesa a propósito: esconde justo lo que
queremos que encuentren.

## Lo que falta antes de publicarla

1. **Las fotos.** Los recuadros rayados dicen cuál va en cada lugar y en qué
   proporción: portada 4:5 vertical, cada plato 16:10, la cocina 5:4.
2. **Conectar los datos.** Hoy el menú, los packs y los puntos de retiro están
   escritos a mano en el HTML. Tienen que salir de `config.js` / `menu.js` como
   en la landing actual (`landing.js` ya hace ese trabajo, hay que apuntarlo a
   estos nodos).
3. **La tipografía de marca.** Acá va `Questrial` de Google Fonts como suplente
   de **Glacial Indifference**, que no está en Google Fonts. Al integrarla al
   sitio hay que volver a la de marca, que ya está en `assets/fonts/`.
4. **Unificar la hoja de estilos.** `estilos.css` repite los tokens de
   `assets/css/styles.css` para que esta carpeta se pueda abrir sola. Al
   integrarla, conviene importar los tokens de `styles.css` y dejar acá sólo lo
   propio de la landing.
5. **El formulario de empresas.** Hoy sólo muestra un aviso. Hay que engancharlo
   a `cotizacion.js`, que ya manda con `fetch` (la política de seguridad del
   sitio no permite el envío HTML común).
6. **Precios que quedaron en `—`.** Los packs y las direcciones de los puntos de
   retiro van vacíos a propósito, para no publicar datos viejos.

## Precios que sí están escritos

Salen del `README.md` del repo: vianda de 350 gr **$9.000**, XL de 500 gr
**$12.800**, envío **$2.000** dentro de bulevares y **$2.500** fuera, retiro
sin costo.
