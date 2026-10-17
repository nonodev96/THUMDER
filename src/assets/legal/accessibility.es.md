# Declaración de accesibilidad

_Preparada el 17 de octubre de 2026, por autoevaluación_

THUMDER quiere que cualquier persona pueda aprender con él, también con lector de pantalla, solo con el teclado o con baja visión.

## Situación

THUMDER es **parcialmente conforme** con las [Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), nivel AA: cumple la mayoría de los criterios, con las limitaciones que se indican abajo.

## Qué se ha hecho

- **Teclado:** casi todo se maneja con el teclado, con el foco siempre visible. La simulación tiene atajos: F5 ejecuta o pausa, F10 avanza un ciclo, Mayúsculas+F10 retrocede uno, F8 llega al final y Mayúsculas+F5 carga el programa. Las ventanas flotantes de la vista múltiple se mueven con las flechas.
- **Lectores de pantalla:** los botones y controles tienen nombre; las tablas de código, memoria y registros se presentan como tablas; el estado de la simulación y los avisos se anuncian solos.
- **Texto además de dibujos:** la tabla de Código dice en qué etapa está cada instrucción y explica qué hace; Registros, Memoria y Estadísticas dan en texto lo que dibujan el pipeline y el diagrama de ciclos.
- **Visión:** temas claro y oscuro con el contraste comprobado, y un diseño que se adapta a pantallas estrechas y al zoom del navegador.
- **Movimiento:** se respeta la preferencia del sistema de reducir el movimiento.
- **Pruebas:** cada cambio pasa pruebas automáticas con [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.1 A y AA) en todas las vistas y en los dos temas.

## Limitaciones conocidas

- **Dibujos en canvas:** el pipeline, la ruta de datos y el diagrama de ciclos son dibujos. Su información está también en texto (ver arriba), pero algunos detalles, como el recorrido exacto de los datos por la ruta, solo se ven en el dibujo.
- **Editor de código:** el editor (Monaco) funciona con lector de pantalla, pero algunas marcas son visuales, como el subrayado de los errores; los errores también se listan en el panel de Problemas.
- **Vista múltiple:** ordenar las vistas arrastrándolas necesita ratón o pantalla táctil; con el teclado, cada vista puede abrirse como ventana flotante y moverse con las flechas.
- **Documentos de terceros:** algunas páginas de la documentación vienen de otros proyectos y pueden tener imágenes sin una descripción completa.

## Cuéntanos qué falla

Si encuentras una barrera, o necesitas un contenido en otro formato, abre una incidencia en [GitHub](https://github.com/nonodev96/THUMDER/issues) con la etiqueta «accesibilidad». Se responderá lo antes posible.
