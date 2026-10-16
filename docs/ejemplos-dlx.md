# Ejemplos de DLX

En `src/assets/examples-dlx/ejemplos/` hay 20 programas clásicos, ordenados de más sencillo a más avanzado. Cada uno empieza con una cabecera que explica los conceptos, qué mirar en THUMDER mientras se ejecuta, una prueba para hacer y el resultado que imprime.

Para tenerlos en THUMDER: **Gestor de ficheros → + → DLX examples**. Se crea la carpeta `ejemplos` con los 20 programas e `input.s`, el módulo de lectura de los ejemplos de WinDLX que usa el ejemplo 20.

| Nº | Fichero | Qué enseña | Imprime |
| :-- | :-- | :-- | :-- |
| 01 | `01-hola-mundo.s` | Segmentos `.data` y `.text`, `.asciiz`, traps 5 (`printf`) y 0 | `Hola, mundo desde DLX!` |
| 02 | `02-suma-vector.s` | Recorrer un vector, bucles con contador, riesgo de uso de una carga y planificación de instrucciones | `La suma es 50` |
| 03 | `03-maximo.s` | Comparaciones con `slt`, saltos condicionales, la predicción «no tomado», con y sin signo | `El maximo es 33` |
| 04 | `04-fibonacci.s` | Tablas en memoria, traps en un bucle, los registros que cambian los traps (R1 y R14) | los 20 primeros términos |
| 05 | `05-factorial.s` | `mult` en la unidad fmulEX y sus detenciones, `printf` con varios parámetros | `10! = 3628800` |
| 06 | `06-mcd-euclides.s` | `div` en fdivEX, el resto sin instrucción de resto, bucles «mientras» | los pasos de Euclides y `mcd(1071, 462) = 21` |
| 07 | `07-multiplica-desplazando.s` | Operaciones con bits (`andi`, `slli`, `srli`) y cómo multiplica el hardware | `123 x 45 = 5535` |
| 08 | `08-binario.s` | Cadenas con `sb`, los 32 bits de una palabra, complemento a 2, `%08x`, subrutinas con `jal` y `jr` | cuatro números en binario y sus unos |
| 09 | `09-cadenas.s` | `lbu` y `sb`, cadenas de C, `strlen`, invertir, comparar, tablas de punteros | longitud, inversa y palíndromo de tres palabras |
| 10 | `10-burbuja.s` | Ordenación con dos bucles anidados, intercambio en memoria, bandera de parada | el vector antes y después |
| 11 | `11-busqueda-binaria.s` | Búsqueda en un vector ordenado, `srai` para dividir entre 2, subrutinas que devuelven dos valores | posición y pasos de cinco claves |
| 12 | `12-criba.s` | La criba de Eratóstenes con un vector de bytes, sin divisiones | los 25 primos menores que 100 |
| 13 | `13-matrices.s` | Matrices por filas, tres bucles anidados, recorrer filas y columnas con punteros | el producto de dos matrices de 3 x 3 |
| 14 | `14-factorial-recursivo.s` | Recursividad, la pila (r29), marcos de llamada, el convenio de registros | `7! = 5040` |
| 15 | `15-hanoi.s` | Recursividad con cuatro argumentos y dos llamadas, `printf` con `%c` | los 7 movimientos de 3 discos |
| 16 | `16-producto-escalar.s` | Dobles (`.double`, `ld`, `multd`, `addd`), registros pares, unidades de coma flotante | `X . Y = 16.5` |
| 17 | `17-daxpy.s` | El bucle DAXPY de Hennessy y Patterson y su cadena de dependencias | `Y = 10.5 21 ... 84` |
| 18 | `18-daxpy-desenrollado.s` | Desenrollar y planificar un bucle, riesgos estructurales, más unidades de multiplicación | lo mismo que el 17, en menos ciclos |
| 19 | `19-riesgos.s` | Un catálogo de riesgos: RAW con y sin adelantamiento, carga, salto, control, MEM, estructural, WAW y trap | nada: se mira el diagrama de ciclos |
| 20 | `20-media-entrada.s` | Dos módulos (`.global`), leer de la consola (trap 3), pasar de entero a doble, `divd` | la media de los números que se escriben |

Los ejemplos 17 y 18 se miran juntos: hacen lo mismo y la diferencia está en las estadísticas. El 19 se ejecuta paso a paso (F10), buscando en el diagrama de ciclos las etiquetas de cada bloque.

## Cómo se comprueban

`src/app/__core/engine/classics.spec.ts` ensambla y ejecuta cada ejemplo:

- sin errores ni avisos de ensamblado, y la salida tiene que ser la que dice su cabecera en «Resultado»;
- en el pipeline, con cuatro configuraciones (con y sin adelantamiento, y unidades de coma flotante rápidas o lentas), con el mismo estado final que el ejecutor de referencia;
- lo que dicen los comentarios: que planificar el bucle del 02 ahorra 16 ciclos, que el 18 tarda menos que el 17 y solo él gana con cuatro multiplicadores, que cada bloque del 19 produce su detención (y la de «Adelanta» y «UsaCarga» sube a 2 ciclos sin adelantamiento), que los recursivos dejan la pila como estaba, y los resultados en memoria del 10, el 12 y el 13.
