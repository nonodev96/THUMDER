# El simulador DLX de THUMDER

THUMDER ensambla y simula los programas por sí mismo, sin servidor. El código está en `src/app/__core/engine/` y es TypeScript puro (no depende de Angular). La referencia es el manual de WinDLX ([manual-simulador-dlx.md](manual-simulador-dlx.md)).

| Fichero | Qué hace |
| :-- | :-- |
| `isa.ts` | El repertorio de instrucciones: codificación, sintaxis, unidad de ejecución y registros dobles |
| `assembler.ts` | El ensamblador: de código fuente a memoria |
| `cpu.ts` | La memoria, los registros y lo que hace cada instrucción |
| `traps.ts` | Los traps de entrada y salida (`printf`, lectura de líneas…) |
| `pipeline.ts` | El pipeline, ciclo a ciclo |
| `reference.ts` | Un ejecutor sin pipeline, instrucción a instrucción, con el que se comprueba el pipeline |
| `simulator.ts` | Atiende las peticiones del protocolo (`SimulationInitRequest`, `SimulationNextStepRequest`…) |
| `runner.ts` | Las peticiones y el bucle de ejecución: ciclos al ritmo elegido, puntos de ruptura, espera de entrada y pausa |
| `simulator.worker.ts` | El Web Worker donde vive todo lo anterior |

Todo el proceso (ensamblar, simular y el bucle de ejecución) ocurre en un **Web Worker**, fuera del hilo de la página. La página envía las peticiones y la orden de ejecutar (con el retardo y los puntos de ruptura) y solo recibe los ciclos para dibujarlos. Con retardo 0, el Worker agrupa los ciclos que caben en un fotograma (16 ms, como mucho 500) en cada mensaje, así que un programa largo no bloquea la interfaz. El Worker se para solo al terminar el programa, en un punto de ruptura, en un error o cuando el programa espera una línea de la consola. Donde no hay Workers (las pruebas unitarias), el mismo código se ejecuta en la página.

THUMDER-server, el simulador anterior, ya no se usa: el cliente solo habla con su Worker.

### El protocolo del Worker

La página (`LocalSimulatorService`) y el Worker (`runner.ts`) se mandan objetos con `postMessage`. Las peticiones y sus respuestas van como texto JSON, igual que iban por el socket.

**De la página al Worker** (`ToSimulator`):

| Mensaje | Qué pide |
| :-- | :-- |
| `{ kind: "request", id, event, payload }` | Una petición (tabla de abajo); el Worker contesta con el mismo `id` |
| `{ kind: "run", delay, breakpoints, stages?, watchpoints?, until?, journal? }` | Ejecutar ciclo tras ciclo (`RunOptions`), `delay` ms entre uno y otro (0: lo más rápido posible), parando en las líneas `breakpoints` del fichero principal: al captar su instrucción o, según `stages`, al llegar a ID, EX, MEM o WB; y al leer o escribir las direcciones de `watchpoints`. Con `until`, para al llegar a ese número de ciclos, haciendo antes los cambios de `journal` en su ciclo (el paso atrás) |
| `{ kind: "pause" }` | Parar la ejecución |
| `{ kind: "speed", delay }` | Cambiar el ritmo de la ejecución que está en marcha |
| `{ kind: "breakpoints", lines, stages?, watchpoints? }` | Cambiar los puntos de ruptura durante la ejecución |

**Del Worker a la página** (`FromSimulator`):

| Mensaje | Qué contiene |
| :-- | :-- |
| `{ kind: "response", id, result }` o `{ kind: "response", id, error }` | La respuesta a una petición, o su error |
| `{ kind: "steps", steps }` | Los ciclos ejecutados desde el último mensaje (`LocalSimulationStep`). Cada ciclo lleva también `stalls` (por qué está parada cada instrucción: tipo de riesgo, registro, instrucción que lo causa y si el adelantamiento lo habría evitado), `reads` (lo que leen las cargas) y, si se paró en un punto de ruptura, `hit` |
| `{ kind: "stopped", reason }` | Por qué se ha parado: `complete`, `breakpoint`, `input`, `error` o `paused` |

**Las peticiones** (`event`):

| Petición | Datos | Respuesta |
| :-- | :-- | :-- |
| `UpdateConfigurationMachineRequest` | `TypeConfigurationMachine`: adelantamiento, unidades de coma flotante (cantidad y retardo) y tamaño de memoria | La configuración. Se manda antes de cargar, porque el programa se ensambla para ese tamaño de memoria |
| `SimulationInitRequest` | `LocalSimulationInitRequest`: el fichero (`filename`, `content`), los ficheros de su carpeta (`files`) y, si se eligieron a mano, los módulos que se ensamblan con él (`modules`) | `LocalSimulationInitResponse`: si se puede simular, los errores con su línea, las instrucciones, los datos en memoria, los símbolos (`symbols`) y los módulos cargados (`modules`) |
| `SimulationNextStepRequest` | Nada | Un ciclo (`LocalSimulationStep`): las etapas, las flechas del diagrama, los registros y la memoria que cambian, las estadísticas y lo que escribe el programa |
| `UpdateRegisterRequest` | `TypeRegisterToUpdate[]` (registro por nombre o número, valor en hexadecimal) | Los valores guardados y si se aceptaron todos |
| `UpdateMemoryRequest` | `TypeMemoryToUpdate[]` | Lo mismo para la memoria |
| `SimulationInputRequest` | `{ text }`: la línea escrita en la consola | `{ allOK: true }`; el programa sigue en el siguiente `run` o paso |
| `CompareForwardingRequest` | `{ init, configuration, maxCycles? }` | `CompareResponse`: el programa ejecutado hasta el final con y sin adelantamiento (ciclos, instrucciones, CPI y atascos de cada tipo) |

`MachineService` es quien usa este protocolo. Al cargar, manda `UpdateConfigurationMachineRequest` y después `SimulationInitRequest`. F10 es una `SimulationNextStepRequest`. F5 es un `run`, del que va dibujando los ciclos según llegan. Pausar es un `pause`. F8 (hasta el final sin dibujar) es un `run` sin retardo en el que la página solo actualiza las vistas al parar. El paso atrás (Mayúsculas+F10) carga de nuevo el mismo programa y hace un `run` con `until` igual a los ciclos menos uno y el diario de lo que hizo la persona (líneas de la consola, registros y memoria cambiados a mano), así que el estado es exactamente el del ciclo anterior.

`MachineService` guarda el estado en *signals* de solo lectura (`state`: paso, línea, pipeline, estadísticas, salida, errores, símbolos...) y el diagrama de ciclos en un modelo de datos (`CycleDiagramModel`) que guarda los últimos ciclos (100 a 100.000, en la configuración) con el motivo de cada atasco.

## 1. Ensamblado

Es un ensamblador de dos pasadas: la primera da su dirección a cada etiqueta y la segunda escribe la memoria.

- **Segmentos:** el código va a partir de `$TEXT` (0x100) y los datos a partir de `$DATA` (0x1000). `.text` y `.data` cambian de segmento y aceptan una dirección (`.data 0x2000`).
- **Directivas:** `.align n`, `.ascii`, `.asciiz`, `.byte`, `.half`, `.word`, `.float`, `.double`, `.space n` y `.global`.
- **Expresiones:** como en C: números decimales, hexadecimales (`0x1F`), octales (`017`) y caracteres (`'0'`); símbolos; los operadores `* / % + - << >> & ^ | ~` y paréntesis. Los inmediatos admiten `#` (`addi r1,r0,#4`).
- **Codificación real:** cada instrucción se codifica en sus 32 bits con los códigos de WinDLX, los mismos que usa el desensamblador de THUMDER. Por ejemplo, `addi r1,r0,0` es `0x20010000`.
- **Errores:** se comprueban el número de operandos, los registros (los dobles tienen que ser pares), los rangos de inmediatos y desplazamientos y los símbolos que no existen. Cada error sale marcado en su línea en el editor, y un programa con errores no se puede simular.
- **Varios ficheros:** como en WinDLX, las etiquetas de cada fichero son suyas y solo se comparten las que se declaran con `.global`. Si a un programa le falta un símbolo, THUMDER añade los ficheros de la misma carpeta que lo declaran `.global` (por ejemplo, `gcm.s` usa `InputUnsigned` de `input.s`).
- **Inicio:** la ejecución empieza en `main` si existe y, si no, en `$TEXT`.

## 2. Carga

Las instrucciones y los datos de las directivas se escriben en la memoria. La memoria es *big-endian*: el byte 0 de una palabra es el más significativo. El código y los datos llegan a las vistas de código y de memoria antes del primer ciclo.

## 3. Ejecución en el pipeline

Cada ciclo, la etapa IF lee de la memoria la palabra que señala el PC y la decodifica. Así, lo que se ejecuta es lo que hay en memoria: si un programa escribe sobre su propio código, se ejecuta lo nuevo.

### Etapas

- **IF:** busca la instrucción y suma 4 al PC.
- **ID:** decodifica y lee los registros. Los saltos y las bifurcaciones se resuelven aquí.
- **EX:** la unidad entera (intEX) tarda 1 ciclo. Las de coma flotante (faddEX, fmultEX y fdivEX) tardan su retardo, de 1 a 8 unidades de cada tipo, y cada unidad está ocupada durante todo su retardo. MULT, MULTU, DIV y DIVU también usan estas unidades, aunque operen con enteros.
- **MEM:** las cargas y los almacenamientos.
- **WB:** escribe en los registros en la primera mitad del ciclo, así que una instrucción que está en ID lee el valor nuevo en la segunda mitad.

### Reglas de temporización

| Situación | Con adelantamiento | Sin adelantamiento |
| :-- | :-- | :-- |
| Una instrucción usa el resultado de la ALU de la anterior | Sin detención | 2 detenciones (`R-Stall`) |
| Una instrucción usa el valor de una carga anterior | 1 detención (`R-Stall`) | 2 detenciones (`R-Stall`) |
| Un salto usa el resultado de la instrucción anterior (se resuelve en ID) | 1 detención (`R-Stall`) | Espera a que el productor esté en WB |
| Un salto se toma (predecir no efectivo) | Se aborta la instrucción buscada después (`Aborted`): 1 ciclo | Igual |
| Una instrucción usa el resultado de una unidad de coma flotante | Espera hasta el final de la unidad (`R-Stall`) | Espera hasta WB |

Además:

- **`W-Stall`:** la instrucción espera en ID mientras otra anterior con el mismo registro de destino sigue en una unidad de ejecución. Es el ejemplo del manual (sección 6.1): `ADDD F0,F2,F4` seguida de `MOVF F1,F4`.
- **`S-Stall`:** no queda ninguna unidad libre del tipo que hace falta.
- **`Stall`:** una instrucción de coma flotante y una entera terminan a la vez. La de coma flotante entra antes en MEM y la entera espera en intEX.
- **`T-Stall`:** un trap espera en IF hasta que el pipeline queda vacío. Un trap 3 sin entrada también espera, hasta que se escribe una línea en la consola.

Todas estas reglas están en las pruebas de `pipeline.spec.ts`, con la línea temporal que se espera para cada instrucción.

### Estadísticas

Como en WinDLX: ciclos, instrucciones que han pasado por ID, detenciones (RAW, y entre ellas las debidas a cargas, a saltos y a coma flotante; WAW, estructurales, de control y de trap), saltos condicionales efectivos y no efectivos, cargas y almacenamientos, instrucciones de cada unidad de coma flotante y traps.

## 4. Traps y consola (DLX-I/O)

La dirección del primer parámetro va en R14 y el resultado se deja en R1 (sección 5 del manual).

| Trap | Qué hace en THUMDER |
| :-- | :-- |
| 0 | Termina el programa |
| 1 y 2 | Abrir y cerrar ficheros: en el navegador no hay ficheros, así que `open` devuelve -1 |
| 3 | Lee una línea de la consola (la entrada estándar, descriptor 0); el programa espera hasta que se escribe |
| 4 | Escribe un bloque en la salida estándar o en la de errores (descriptores 1 y 2) |
| 5 | `printf` con `%d %i %u %x %X %o %c %s %f %e %g` y sus opciones (anchura, precisión, `-`, `+`, `0`, `#`); los `double` ocupan 8 bytes en los parámetros |

Lo que escribe el programa aparece en la **consola del programa**, que se abre sola. Cuando el programa pide una línea, la consola muestra un campo para escribirla.

## 5. Errores durante la ejecución

Una dirección fuera de la memoria, un acceso sin alinear, una división entera por cero, una palabra que no es una instrucción o un trap que no existe detienen la simulación. Se muestra el mensaje y en qué dirección ocurrió.

## 6. Diferencias con WinDLX

- **Comparaciones sin signo:** las tablas de WinDLX de THUMDER no tienen código para `SEQU`…`SGEU` ni `SEQUI`…`SGEUI`. THUMDER les asigna códigos libres (funciones 0x10 a 0x15 y códigos de operación 0x30 a 0x35).
- **Punto de entrada:** WinDLX empieza en `$TEXT`; THUMDER empieza en `main` si existe, aunque un módulo quede antes por orden alfabético.
- **Ficheros:** en el navegador no hay ficheros (traps 1, 2 y 4 solo con los descriptores 0, 1 y 2).
- **Excepciones:** `RFE`, `MOVI2S` y `MOVS2I` no están implementadas.

## 7. Cómo se comprueba

- **Ensamblador** (`assembler.spec.ts`): codificaciones de WinDLX, directivas, errores con su línea y todos los ejemplos de `src/assets/examples-dlx`.
- **Ejemplos clásicos** (`classics.spec.ts`): los 20 programas de [ejemplos-dlx.md](ejemplos-dlx.md) imprimen lo que dicen sus cabeceras y terminan igual en el pipeline que en el ejecutor de referencia, con las cuatro configuraciones.
- **Semántica** (`reference.spec.ts`): `prim.s` deja los 10 primeros primos en `Table`, `gcm.s` con `input.s` imprime `gcM=6` para 12 y 18, `fact.s` calcula 5! = 120 con `double` y `base.s` cuenta los días por encima de 14 grados.
- **Pipeline** (`pipeline.spec.ts`):
  - las líneas temporales de las reglas de arriba;
  - todos los ejemplos con cuatro configuraciones (con y sin adelantamiento, y unidades de coma flotante rápidas o lentas). Con cada una, el estado final (registros, memoria y número de instrucciones) tiene que ser idéntico al del ejecutor de referencia.
- **Ejecución** (`runner.spec.ts`): hasta el final, puntos de ruptura, entrada por la consola, ritmo y pausa, y errores de las peticiones.
- **Integración** (`simulator.spec.ts` y `machine.service.spec.ts`): el protocolo, la entrada por la consola y el recorrido completo desde THUMDER.
