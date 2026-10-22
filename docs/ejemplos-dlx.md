# Ejemplos de DLX

En `src/assets/examples-dlx/ejemplos/` hay 20 programas clásicos, ordenados de más sencillo a más avanzado. Cada uno empieza con una cabecera que explica los conceptos, qué mirar en THUMDER mientras se ejecuta, una prueba para hacer y el resultado que imprime.

En THUMDER están siempre en la carpeta `ejemplos` del gestor de ficheros, de solo lectura, con los 20 programas e `input.s`, el módulo de lectura de los ejemplos de WinDLX que usa el ejemplo 20. Si cambias uno, al guardar se crea una copia en `mis ejemplos`.

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

Los ejemplos 17 y 18 se miran juntos: hacen lo mismo y la diferencia está en las estadísticas. El 19 se ejecuta paso a paso (F8), buscando en el diagrama de ciclos las etiquetas de cada bloque.

## Ejemplos de SuperDLX

En `ejemplos/superdlx` hay cinco programas para [SuperDLX](superdlx.md), el DLX superescalar (se elige en la cabecera). Funcionan también en DLX, y su cabecera dice qué cambia de una arquitectura a otra.

| Nº | Fichero | Qué enseña | Imprime |
| :-- | :-- | :-- | :-- |
| 01 | `01-paralelismo.s` | El paralelismo entre instrucciones: una cadena de sumas frente a cuatro acumuladores, el IPC y la máquina escalar | `Un acumulador: 528` y `Cuatro acumuladores: 528` |
| 02 | `02-renombrado.s` | Dependencias verdaderas y falsas (WAR y WAW), el renombrado con el ROB y los registros renombrados | `A = 36, B = 360, C = 3600` |
| 03 | `03-prediccion-de-saltos.s` | La BTB y los contadores de 2 bits, un salto de bucle frente a un «if» que alterna, las instrucciones anuladas | cuántos pares e impares hay, dos veces |
| 04 | `04-dependencias-en-memoria.s` | Los almacenamientos se escriben al confirmarse; las cargas que esperan a un almacenamiento anterior | `En memoria: 120, en un registro: 120` |
| 05 | `05-rob-y-coma-flotante.s` | La confirmación en orden, una división en la cabeza del ROB, el tamaño del ROB y las dos mitades de la máquina | `Suma de 1/i para i = 1..8: 2.71786` |

Cada uno tiene ejercicios guiados en el tema «Superescalar (SuperDLX)» de la vista de ejercicios, que fijan la arquitectura y la máquina: el 01 con la máquina de WinSuperDLX y con una escalar, el 03 con y sin predicción, y el 05 con un ROB de coma flotante de 4 y de 20 entradas. Otro compara el producto escalar (ejemplo 16) en DLX y en SuperDLX.

## Cómo se comprueban

`src/app/__core/engine/classics.spec.ts` ensambla y ejecuta cada ejemplo:

- sin errores ni avisos de ensamblado, y la salida tiene que ser la que dice su cabecera en «Resultado»;
- en el pipeline, con cuatro configuraciones (con y sin adelantamiento, y unidades de coma flotante rápidas o lentas), con el mismo estado final que el ejecutor de referencia;
- los de SuperDLX (`superdlx-examples.spec.ts`), igual en DLX y en SuperDLX, y lo que dicen sus comentarios: que en DLX los dos bucles del 01 tardan lo mismo y en SuperDLX el de cuatro acumuladores menos, que en el 02 hay varias versiones de R4 a la vez y cambiar de registro no ahorra ciclos, que el 03 falla más con los números alternos y sin predicción no anula nada, que en el 04 esperan 14 cargas, y que en el 05 un ROB de 4 entradas tarda mucho más y uno de 40 no mejora;
- lo que dicen los comentarios: que planificar el bucle del 02 ahorra 16 ciclos, que el 18 tarda menos que el 17 y solo él gana con cuatro multiplicadores, que cada bloque del 19 produce su detención (y la de «Adelanta» y «UsaCarga» sube a 2 ciclos sin adelantamiento), que los recursivos dejan la pila como estaba, y los resultados en memoria del 10, el 12 y el 13.
