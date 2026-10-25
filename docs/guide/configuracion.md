# Configuración

La máquina que simulas se ajusta en **Configuración**, al final del menú lateral. Cada opción explica allí mismo qué hace.

> Cambiar la máquina vuelve a cargar el programa y se pierde la simulación en curso: THUMDER te lo pregunta antes de guardar. **Valores por defecto** lo devuelve todo a como venía.

## Arquitectura

**DLX** o **SuperDLX**. También se elige en la barra superior. Los programas terminan igual en las dos: solo cambian los ciclos.

## Pipeline (DLX)

| Opción | Qué hace | Por defecto |
| :-- | :-- | :-- |
| **Activar adelantamientos** | Una instrucción recibe el resultado de la anterior en cuanto se calcula, sin esperar a que se escriba en los registros. Sin adelantamiento, cada dependencia de datos cuesta hasta dos ciclos más (`R-Stall`) | Activado |
| **Unidades de coma flotante** | Cuántas unidades hay de sumas, multiplicaciones y divisiones (de 1 a 8) y cuántos ciclos tarda cada operación (de 1 a 50). Las unidades no están segmentadas: con una sola, una segunda operación espera a que termine la primera (`S-Stall`) | 1 de cada; 2, 5 y 19 ciclos |

Prueba el mismo programa con y sin adelantamiento, o con más unidades: la pestaña **Con y sin adelantamiento** de las estadísticas hace la primera comparación por ti.

## SuperDLX

Los parámetros del fichero `MACHINE` de WinSuperDLX:

- **Máquinas predefinidas**: la de WinSuperDLX (por defecto), una **escalar** (una instrucción por ciclo, para ver qué aporta ser superescalar) y una **muy ancha** (ocho por ciclo).
- **Instrucciones por ciclo**: cuántas se captan, se decodifican y se confirman.
- **Colas y buffers**: el tamaño de la cola de instrucciones, los ROB, las ventanas, los buffers de cargas y almacenamientos y la BTB.
- **Predicción de saltos**: sin ella, la captación se detiene en cada salto hasta que se resuelve.
- **Memoria de datos**: los ciclos de un acceso y cuántos accesos hay por ciclo.
- **Unidades funcionales** enteras y de coma flotante: cuántas hay y su latencia.

Todos los valores y sus límites están en [SuperDLX](../superdlx.md#los-parámetros).

## Memoria

**Tamaño de la memoria**, en bytes: de 512 a 1.048.576 y múltiplo de 8. Por defecto, 32.768. El código empieza en `0x100` y los datos en `0x1000`.

## Simulación

| Opción | Qué hace |
| :-- | :-- |
| **Tiempo entre ciclos (milisegundos)** | La pausa entre un ciclo y el siguiente al ejecutar (<kbd>F9</kbd>). Con 0, lo más rápido posible. Por defecto, 250. También se elige en el menú de la velocidad |
| **Historial del diagrama de ciclos** | Cuántos ciclos guarda el diagrama, de 100 a 100.000 (por defecto, 2.000). Con un historial largo, los programas largos usan más memoria |

## Editor

**Auto guardado** (activado por defecto): al salir del editor, guarda el fichero y sus puntos de ruptura. Sin él, los cambios sin guardar y los puntos de ruptura se pierden al salir.

## Multiples vistas

Qué ventanas muestra la vista múltiple y en qué columna. Se ordenan arrastrándolas por su asa.

## Sonido

Activa el sonido de la simulación, elige si suena cada etapa o solo los avisos (programa cargado, errores, punto de ruptura, entrada por la consola y fin), y el volumen. **Probar el sonido** te deja oírlo antes.

## Lo que no está en Configuración

- **El idioma** (español o inglés) y **el tema** (claro, oscuro o el del sistema) se eligen en la barra superior.
- **La privacidad**: **Ajustes de privacidad**, al pie de cada página ([Cuenta y privacidad](cuenta.md)).

La configuración se guarda en el dispositivo, no en la cuenta.
