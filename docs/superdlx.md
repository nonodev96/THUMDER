# SuperDLX: el DLX superescalar

THUMDER simula dos arquitecturas con el mismo repertorio de instrucciones, el mismo ensamblador y los mismos programas:

- **DLX**, el pipeline de cinco etapas de WinDLX (IF, ID, EX, MEM, WB): una instrucción por ciclo, en orden ([el simulador DLX](simulador.md)).
- **SuperDLX**, un DLX **superescalar con ejecución fuera de orden**, como el de [WinSuperDLX](https://github.com/oslugr/WinSuperDLX): capta, decodifica y confirma varias instrucciones por ciclo, las ejecuta en cuanto tienen sus operandos y una unidad libre, y las confirma en orden con un buffer de reordenación (ROB).

Un programa acaba con los mismos registros, la misma memoria y la misma salida en las dos: solo cambian los ciclos. Así se puede comparar el mismo programa en una máquina y en otra.

## Cómo se elige

- En la **cabecera**, el botón de la arquitectura (`DLX` o `SuperDLX`). En el móvil está en el menú «Más».
- En la **configuración**, sección «Arquitectura», donde están también los parámetros de SuperDLX.

Al cambiarla, el programa se carga de nuevo en la otra máquina. Un ejercicio guiado o compartido puede fijar la arquitectura: entonces no se puede cambiar mientras esté abierto. Los ejercicios del tema «Superescalar (SuperDLX)» fijan SuperDLX.

## La máquina

```
            ┌───────────────┐
 memoria ──►│   Captación   │◄── BTB (predicción con contadores de 2 bits)
            └──────┬────────┘
                   ▼
            Cola de instrucciones
                   │
            ┌──────▼────────┐  renombrado: cada operando es un valor o la entrada del ROB que lo producirá
            │ Decodificación│──────────────────────────────────────────────┐
            └──┬─────────┬──┘                                              │
               ▼         ▼                                                 ▼
       Ventana entera   Ventana de coma flotante          ROB entero   ROB de coma flotante
               │         │                                    ▲              ▲
               ▼         ▼                                    │ resultados   │
   ALU, desplazamiento, comparación,      suma, multiplicación, división,      │
   direcciones y saltos (enteras)         conversión, comparación, direcciones │
               │                          y saltos (coma flotante)              │
               └──── buffer de cargas y buffer de almacenamientos ── memoria ──┘
                                              │
                               Confirmación en orden (escribe los registros)
```

La máquina tiene dos mitades, la entera y la de coma flotante, cada una con su **ventana de instrucciones** (estaciones de reserva) y su **ROB**. Una instrucción va a la mitad del registro que escribe: las de coma flotante, las cargas y almacenamientos de coma flotante (`lf`, `ld`, `sf`, `sd`), las comparaciones de coma flotante (escriben el FPSR) y sus saltos (`bfpt`, `bfpf`) van a la de coma flotante; el resto, a la entera.

### Lo que pasa en cada ciclo

Las etapas se simulan de la última a la primera, para que lo que produce una etapa lo use la siguiente en el ciclo siguiente:

1. **Confirmación.** Desde la cabeza de cada ROB, en orden, hasta `commit` instrucciones de cada uno. Aquí se escriben los registros. Un almacenamiento se libera para escribirse en memoria (necesita su dato). Un trap se ejecuta cuando es la instrucción más antigua de la máquina y los almacenamientos anteriores ya están en memoria; su resultado (R1) se confirma en el ciclo siguiente. Un error del programa (dirección fuera de la memoria, división por cero, instrucción no válida) para la simulación cuando su instrucción llega a la cabeza: los de las instrucciones anuladas no la paran.
2. **Escritura del resultado.** Las instrucciones cuya unidad termina en este ciclo tienen su resultado en el ROB; las que lo esperan pueden empezar en este mismo ciclo. Una carga tiene su dirección y pasa a esperar la memoria.
3. **Memoria.** Las cargas, en orden, leen la memoria si ningún almacenamiento anterior puede escribir alguno de sus bytes; una carga cuya dirección no se conoce todavía detiene a las más jóvenes. Después se escriben los almacenamientos liberados, en orden, con los accesos que queden (`accesses` por ciclo). Un acceso tarda `latency` ciclos. No hay adelantamiento de un almacenamiento a una carga: la carga espera a que se escriba.
4. **Emisión.** De cada ventana (primero la entera), las instrucciones más antiguas que tienen sus operandos van a una unidad libre de su tipo. Las unidades **no están segmentadas**: cada una está ocupada toda su latencia. Un salto se resuelve aquí: si la predicción falla, se anula todo lo captado detrás de él y la captación sigue por el camino correcto en el ciclo siguiente.
5. **Decodificación.** Hasta `decode` instrucciones de la cola pasan a su ventana y a su ROB (y al buffer de cargas o de almacenamientos), con sus registros renombrados: cada operando es un valor (del ROB o de los registros) o la instrucción del ROB que lo producirá. Se detiene si la ventana, el ROB o el buffer que necesita la instrucción están llenos. Un `jr` o `jalr` cuyo registro ya se conoce se resuelve aquí.
6. **Captación.** Hasta `fetch` instrucciones a la cola. Un salto condicional se busca en la BTB: si está, su contador de 2 bits predice; si no está, entra y se predice tomado. `j` se resuelve en la captación y `jal` sigue en ella por su destino; `jr` y `jalr` detienen la captación hasta conocer su registro. Tras `trap 0` no se capta nada más.

Las instrucciones `nop` y `j` se resuelven en la captación y no ocupan la cola ni el ROB; se confirman cuando se han confirmado todas las anteriores.

### Los parámetros

Son los del fichero `MACHINE` de WinSuperDLX, con sus valores por defecto:

| Parámetro | Por defecto | Límites |
| :-- | :-- | :-- |
| Instrucciones captadas, decodificadas y confirmadas por ciclo | 6, 4 y 4 | 1 a 16 |
| Cola de instrucciones | 20 | 1 a 128 |
| ROB entero y de coma flotante | 20 y 20 | 2 a 128 |
| Ventanas entera y de coma flotante | 20 y 20 | 1 a 128 |
| Buffers de cargas y de almacenamientos | 5 y 5 | 1 a 64 |
| Entradas de la BTB | 111 | 1 a 4096 |
| Memoria: latencia y accesos por ciclo | 1 y 4 | 1 a 50, 1 a 16 |
| Unidades enteras (cantidad y latencia) | ALU 4 y 1, desplazamiento 2 y 1, comparación 1 y 1, direcciones 4 y 1, saltos 1 y 1 | 1 a 20, 1 a 50 |
| Unidades de coma flotante | suma 4 y 2, multiplicación 4 y 5, división 2 y 10, conversión 2 y 2, comparación 1 y 1, direcciones 4 y 1, saltos 1 y 1 | 1 a 20, 1 a 50 |

La configuración tiene tres máquinas predefinidas: la de WinSuperDLX, una **escalar** (una instrucción por ciclo y una unidad de cada tipo, para ver qué aporta ser superescalar) y una **muy ancha** (ocho por ciclo y estructuras grandes). La predicción de saltos se puede desactivar: entonces la captación se detiene en cada salto hasta que se resuelve.

Las multiplicaciones y divisiones de enteros (`mult`, `div`...) usan, como en DLX, el multiplicador y el divisor de coma flotante, aunque son de la mitad entera (sus registros son enteros).

## Las vistas

| Vista | Con SuperDLX |
| :-- | :-- |
| Pipeline | La máquina en el ciclo: la cola, las ventanas con los operandos que espera cada instrucción, las unidades funcionales con los ciclos que les faltan, los dos ROB, los buffers de cargas y almacenamientos, los registros renombrados y la BTB con sus contadores |
| Ciclos de reloj | Cada instrucción en una fila, con lo que hace en cada ciclo: F (captada), q (en la cola), D (decodificada), w (espera en la ventana), E (en su unidad), M (memoria), W (resultado), r (espera en el ROB), C (confirmada) y X (anulada). La tabla de sucesos da el ciclo de cada paso de todas las instrucciones (se exporta a CSV). Al elegir una instrucción se ve cuánto esperó en cada sitio |
| Estadísticas | IPC y CPI, cuántos ciclos confirman 0, 1, 2... instrucciones, por qué se detienen la captación, la decodificación y la confirmación, las esperas en las ventanas (operandos o unidad), la predicción de saltos, el uso de cada unidad, la ocupación media de cada estructura y el mismo programa en DLX y en SuperDLX |
| Registros, memoria y código | Los mismos: los registros son los confirmados. El código y el editor marcan el estado de cada instrucción: en la cola, en la ventana, en su unidad, espera la memoria, lee la memoria, terminada, confirmada o anulada |
| Ruta de datos | Es la del pipeline de DLX: con SuperDLX no está en los menús |

Los puntos de ruptura funcionan igual: una línea para cuando se capta una de sus instrucciones o, según la etapa elegida, cuando se decodifica (ID), empieza en su unidad (EX), accede a la memoria (MEM) o se confirma (WB). La vigilancia de la memoria, el paso atrás, la velocidad y ejecutar hasta el final sin dibujar también funcionan con SuperDLX.

## Ejemplos y ejercicios

En la carpeta `ejemplos/superdlx` del gestor de ficheros hay cinco programas comentados ([la guía de los ejemplos](ejemplos-dlx.md#ejemplos-de-superdlx)): el paralelismo entre instrucciones, el renombrado de registros, la predicción de saltos, las dependencias a través de la memoria y el ROB con las instrucciones largas.

En la vista de ejercicios, el tema «Superescalar (SuperDLX)» tiene nueve ejercicios guiados. Cada uno fija la arquitectura y la máquina, y sus respuestas salen de la simulación (también de las estadísticas propias de SuperDLX, como los fallos de predicción o los ciclos sin confirmar):

| Ejercicio | Programa | Máquina | Pregunta por |
| :-- | :-- | :-- | :-- |
| Paralelismo entre instrucciones | `01-paralelismo.s` | WinSuperDLX | ciclos, instrucciones, ciclos sin confirmar |
| Una instrucción por ciclo | `01-paralelismo.s` | escalar | ciclos, ciclos sin confirmar |
| Renombrado de registros | `02-renombrado.s` | WinSuperDLX | R6, ciclos |
| Predicción de saltos con contadores de 2 bits | `03-prediccion-de-saltos.s` | WinSuperDLX | saltos, fallos, anuladas, ciclos |
| Sin predicción de saltos | `03-prediccion-de-saltos.s` | sin predicción | ciclos, esperas de la captación, anuladas |
| Dependencias a través de la memoria | `04-dependencias-en-memoria.s` | WinSuperDLX | cargas, cargas que esperaron, ciclos |
| Un ROB pequeño | `05-rob-y-coma-flotante.s` | ROB de coma flotante de 4 | ciclos, ciclos con el ROB lleno |
| Un ROB de 20 entradas | `05-rob-y-coma-flotante.s` | WinSuperDLX | ciclos, ciclos con el ROB lleno |
| DLX frente a SuperDLX | `16-producto-escalar.s` | WinSuperDLX | ciclos, instrucciones |

## Diferencias con WinSuperDLX

THUMDER sigue el modelo de SuperDLX y sus parámetros, con estas diferencias, la mayoría para que el resultado del programa sea siempre el correcto:

1. **Desambiguación de memoria.** Una carga espera también a los almacenamientos anteriores cuya dirección no se conoce todavía, y a los traps anteriores (el trap 3 escribe en memoria). SuperDLX solo compara con las direcciones ya calculadas, y una carga podía adelantar a un almacenamiento que escribía lo mismo.
2. **Sincronización de los dos ROB.** En SuperDLX un salto ocupa una entrada en los dos ROB. En THUMDER ocupa solo la de su mitad, y una instrucción no se confirma mientras el otro ROB tenga un salto anterior sin resolver, un trap anterior sin ejecutar o un error anterior.
3. **Decodificación.** Se detiene cuando la ventana, el ROB o el buffer **de la instrucción** están llenos (SuperDLX exige sitio en las dos ventanas y los dos ROB).
4. **Errores precisos.** Un error se produce al confirmar la instrucción; los de las instrucciones anuladas no paran la simulación.
5. **`trap 0`** se capta, detiene la captación y termina el programa al confirmarse (SuperDLX lo ejecuta en la captación y espera a que se vacíe la máquina).
6. **`nop`** ocupa una de las instrucciones captadas del ciclo (SuperDLX no la cuenta).
7. **Las instrucciones anuladas** salen del ROB en el ciclo del fallo de predicción (SuperDLX las marca y las quita al llegar a la cabeza).
8. **Predicción.** Solo el esquema de SuperDLX: un contador de 2 bits por entrada de la BTB, que empieza en «tomado (débil)»; las colisiones no actualizan la entrada. WinSuperDLX añadió esquemas con más bits de historia que THUMDER no tiene.
9. **`mult` y `div` de enteros** trabajan con registros enteros, como en WinDLX (en SuperDLX, como en el DLX original, trabajan con registros de coma flotante).

## Origen y licencia

SuperDLX es de Cecile Moura y el grupo ACAPS de la Universidad McGill (1993); WinSuperDLX, su interfaz para Windows, es de Mario David Barragán García, Antonio Jesús Contreras Sánchez, Emilio José Garnica López y Julio Ortega Lopera (Universidad de Granada, 2002). Los dos son software libre con licencia GPL.

El modo SuperDLX de THUMDER es una **implementación propia en TypeScript**, escrita a partir del modelo descrito en el código y la documentación de WinSuperDLX: no copia ni traduce su código, sus textos ni sus ejemplos, así que THUMDER sigue con su licencia MIT.

## Por dentro

| Fichero | Qué hace |
| :-- | :-- |
| `src/app/__core/engine/architectures.ts` | Las arquitecturas, su nombre y sus vistas |
| `src/app/__core/engine/superscalar-config.ts` | Los parámetros de SuperDLX, sus límites, su validación y las máquinas predefinidas |
| `src/app/__core/engine/superscalar.ts` | La máquina, ciclo a ciclo, y lo que ven las vistas en cada ciclo (`snapshot`) |
| `src/app/__core/machine/superscalar-timeline.ts` | La historia de las instrucciones para el diagrama de ciclos |
| `src/app/components/architecture-selector/` | El botón de la cabecera |
| `src/app/components/superscalar-machine/` y `superscalar-diagram/` | La máquina y el diagrama de ciclos |
| `src/app/views/_auth/statistics/superscalar-statistics.component.ts` | Las estadísticas |

El simulador del Worker (`simulator.ts`) crea la máquina de la arquitectura de la configuración (`UpdateConfigurationMachineRequest` lleva `architecture` y `superscalar`). Cada ciclo de SuperDLX lleva en `superscalar.events` lo que hizo cada instrucción; la máquina entera (`superscalar.snapshot`) y sus estadísticas solo van en el último ciclo de cada mensaje, que es el que dibuja la página. `CompareArchitecturesRequest` ejecuta el programa hasta el final en DLX y en SuperDLX.

### Cómo se comprueba

- Los 30 programas de ejemplo (los de DLX y los de SuperDLX) acaban en SuperDLX con los mismos registros, la misma memoria, la misma salida y el mismo número de instrucciones que el ejecutor de referencia, con cinco máquinas distintas (la de WinSuperDLX, la escalar, la muy ancha, sin predicción y con buffers mínimos y memoria lenta).
- En cada ciclo se comprueba que ninguna estructura pasa de su tamaño, que no se captan, decodifican ni confirman más instrucciones de las permitidas, que cada ROB confirma en orden y que nada confirmado se anula.
- Pruebas de temporización: instrucciones independientes en paralelo, cadenas de dependencias, el uso del resultado en el ciclo siguiente, las cargas, las esperas por almacenamientos, la predicción de un bucle, las unidades no segmentadas, las dos mitades y los errores en el camino equivocado.
- Los ejemplos de SuperDLX hacen lo que dicen sus comentarios (`superdlx-examples.spec.ts`), y los ejercicios preguntan lo que dicen: que la máquina escalar tarda más del doble, que sin predicción no se anula nada pero se tarda más, que el ROB pequeño tarda más (`exercises.spec.ts`).
- Pruebas e2e de la cabecera, las vistas, la configuración, los ejemplos, un ejercicio guiado y la accesibilidad (axe) en los dos temas.

### Cómo se añade otra arquitectura

1. Su nombre y sus vistas en `architectures.ts`.
2. Su máquina, con `tick()`, `registers`, `memory`, `nextPC` y `cycle`, y su paso al protocolo en `simulator.ts` (`createEngine`).
3. Su configuración en `config.ts` y en la vista de configuración.
4. Sus vistas, que eligen lo que muestran con `MachineService.state.architecture`.
