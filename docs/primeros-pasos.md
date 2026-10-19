# Primeros pasos

THUMDER es un simulador del procesador **DLX**: escribes un programa en ensamblador, lo cargas y ves, ciclo a ciclo, cómo avanza cada instrucción por el pipeline, qué registros y qué posiciones de memoria cambia, y por qué se detiene. Todo ocurre en tu navegador (o en la aplicación de escritorio): no hace falta cuenta ni conexión.

## 1. Abre un programa

En el **Gestor de ficheros** tienes siempre dos carpetas de solo lectura:

- **ejemplos**: 20 programas clásicos comentados, de «Hola, mundo» a un bucle DAXPY desenrollado.
- **ejercicios**: los programas de los ejercicios guiados.

Haz doble clic en uno (por ejemplo `ejemplos/02-suma-vector.s`) y se abre en el **Editor**. Si lo cambias, al guardar se crea una copia en tus ficheros (`mis ejemplos`), porque los originales no se pueden modificar. Para escribir tu propio programa: **Nuevo → Programa DLX (.s)**.

## 2. Carga el código

Pulsa el botón de cargar de la barra superior (las dos flechas) o **Mayúsculas+F5**. THUMDER ensambla el programa, pone el código y los datos en la memoria y deja la máquina en el ciclo 0. Si hay errores, se marcan en su línea del editor y en el panel de **Problemas**.

> La simulación usa la versión **guardada** del fichero. Si el editor avisa de que hay cambios sin guardar, guarda (**Ctrl+S**) antes de cargar.

## 3. Simula

| Acción | Botón | Teclado |
| :-- | :-- | :-- |
| Un ciclo | Flecha a la derecha | F10 |
| Un ciclo atrás | Flecha a la izquierda | Mayúsculas+F10 |
| Ejecutar o pausar | Triángulo | F5 |
| Hasta el final, sin dibujar cada ciclo | Doble flecha | F8 |
| Velocidad | Indicador de velocidad | |
| Reiniciar la máquina (memoria, código y registros) | Papelera de la barra | |

La simulación se para sola al terminar, en un punto de ruptura, en un error o cuando el programa pide un dato por la consola.

## 4. Mira qué pasa

- **Pipeline**: qué instrucción hay en cada etapa (IF, ID, EX, MEM, WB y las unidades de coma flotante); con cada ciclo las instrucciones se desplazan a su etapa siguiente, y el pie explica qué hace cada etapa con la suya y qué valores mueve.
- **Ciclos de reloj**: una fila por instrucción con la etapa de cada ciclo; haz clic en una detención para ver por qué ocurre.
- **Registros** y **Memoria**: los valores, en varias representaciones.
- **Código**: el código máquina, la etapa de cada instrucción y una descripción de lo que hace.
- **Estadísticas**: ciclos, CPI, detenciones por tipo y la comparación con y sin adelantamiento.
- **Ruta de datos**: el camino de los datos en el ciclo actual: el PC que lee la memoria de instrucciones, los registros que se leen y se escriben en el banco, la ALU, la memoria de datos y los adelantamientos. Los cables que se usan se iluminan, los registros entre etapas (IF/ID, ID/EX, EX/MEM, MEM/WB) enseñan lo que capturan con el reloj y el pie lo cuenta etapa por etapa.
- **Vista múltiple**: varias vistas a la vez; cada una puede salir como ventana flotante.
- **Sonido**: cada etapa del pipeline tiene su nota (un ciclo con el pipeline lleno suena como un acorde), una detención suena como un golpe sordo y una instrucción anulada por un salto, como algo que cae. Se quita o se ajusta en **Configuración → Sonido** y en el menú de la velocidad.

## 5. Sigue aprendiendo

- **Ejercicios**: preguntas sobre un programa que THUMDER comprueba con la propia simulación.
- **Configuración**: el adelantamiento, las unidades de coma flotante, el tamaño de la memoria, la velocidad y el sonido.
- La parte **La arquitectura DLX** de esta documentación explica las instrucciones, sus códigos y el pipeline.
