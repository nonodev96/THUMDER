# Ejercicios

Los ejercicios hacen preguntas sobre un programa, y THUMDER comprueba tus respuestas con la propia simulación. Están en **Ejercicios**, en el grupo **Máquina** del menú lateral.

## Hacer un ejercicio guiado

1. Abre **Ejercicios** y elige uno. Cada tarjeta dice su tema, cuántas preguntas tiene y con qué programa.
2. Pulsa **Empezar** (o **Continuar**, si ya lo habías empezado). Se abre el programa con la configuración del ejercicio, que queda **bloqueada** mientras lo haces.
3. Ejecuta el programa hasta el final: **Ejecutar** (<kbd>F9</kbd>) o **Al final** (<kbd>Mayús</kbd>+<kbd>F9</kbd>).
4. Mira el diagrama de ciclos y las estadísticas, y contesta. **Comprobar** dice si cada respuesta es correcta.

Si te atascas, **Ver las soluciones** las enseña. Tu progreso se guarda en el dispositivo.

## Los temas

| Tema | Programas | Qué se practica |
| :-- | :-- | :-- |
| **Riesgos de datos** | `02-suma-vector.s`, con y sin adelantamiento | Las detenciones RAW y lo que ahorra el adelantamiento |
| **Riesgos de control** | `03-maximo.s` | Los saltos tomados y las instrucciones anuladas |
| **Riesgos estructurales** | `18-daxpy-desenrollado.s` | Una sola unidad de multiplicación para muchas operaciones |
| **Coma flotante** | `16-producto-escalar.s` | Las unidades de coma flotante y sus latencias |
| **Bucles y subrutinas** | `05-factorial.s`, `14-factorial-recursivo.s` | Un bucle con una unidad lenta, la recursividad y la pila |
| **Memoria** | `10-burbuja.s` | Ordenar un vector en memoria |
| **Superescalar (SuperDLX)** | Los cinco de `ejemplos/superdlx` y `16-producto-escalar.s` | Paralelismo, renombrado, predicción de saltos, dependencias en memoria, el ROB y DLX frente a SuperDLX |

Los ejercicios de SuperDLX fijan la arquitectura y la máquina (por ejemplo, la de WinSuperDLX frente a una escalar, o con y sin predicción de saltos). Se detallan en [SuperDLX](../superdlx.md#ejemplos-y-ejercicios).

## Compartir un ejercicio

Cualquier programa se puede compartir como ejercicio con un enlace, por ejemplo para una clase:

1. Abre el programa en el editor y pulsa **Compartir**, en las herramientas del programa.
2. Escribe un **enunciado** (opcional) y elige qué se **bloquea** mientras se hace: el adelantamiento, las unidades de coma flotante, el tamaño de la memoria o la arquitectura.
3. **Copiar** copia el enlace.

El enlace lleva el programa y la configuración, sin pasar por ningún servidor. Quien lo abre recibe una copia en su carpeta **compartidos**, con la configuración del ejercicio. Si el programa es muy largo, no cabe en un enlace: compártelo como fichero.

## Ideas para practicar por tu cuenta

- Ejecuta un ejemplo con y sin adelantamiento y compara los ciclos.
- Reordena las instrucciones de `02-suma-vector.s` para quitar sus detenciones ([Planificar el código](pipeline.md#planificar-el-código)).
- Ejecuta `17-daxpy.s` y `18-daxpy-desenrollado.s` con una y con cuatro unidades de multiplicación.
- Ejecuta el mismo programa en DLX y en SuperDLX, y compara el CPI con el IPC.
