# Ficheros y editor

Tus programas viven en el **Gestor de ficheros** y se escriben en el **Editor**. Los dos están en el grupo **IDE** del menú lateral.

## El gestor de ficheros

En la raíz siempre hay dos carpetas de THUMDER, de solo lectura:

| Carpeta | Qué tiene |
| :-- | :-- |
| **ejemplos** | 20 programas comentados de DLX, de «Hola, mundo» a un DAXPY desenrollado, y en `ejemplos/superdlx` cinco para SuperDLX. Se explican en [Ejemplos comentados](../ejemplos-dlx.md). |
| **ejercicios** | Los programas de los [ejercicios guiados](ejercicios.md). |

Junto a ellas están tus ficheros. La primera vez hay dos programas clásicos de WinDLX para empezar: `prim.s` y `win-dlx.s`.

### Lo que puedes hacer

| Para | Haz |
| :-- | :-- |
| Abrir un programa | Doble clic o <kbd>Intro</kbd> |
| Crear un programa o una carpeta | **Nuevo → Programa DLX (.s)** o **Nueva carpeta** |
| Importar programas | **Importar**, o arrastra los ficheros a la lista. Acepta `.s`, `.txt` y `.zip` |
| Descargar | **Descargar**: un fichero tal cual, o varios o una carpeta en un `.zip`. **Descargar todo (.zip)** guarda todos tus ficheros |
| Seleccionar varios | <kbd>Ctrl</kbd>+clic |
| Renombrar | <kbd>F2</kbd> |
| Eliminar | <kbd>Supr</kbd>. No se puede deshacer |
| Mover | Arrastra el elemento a una carpeta, o a la ruta de arriba para subirlo |

Cada fila tiene también un menú de acciones con todo lo anterior.

### Las copias de los ejemplos

Los programas de THUMDER no se pueden cambiar. Si editas uno y guardas, se crea una copia en **mis ejemplos** (o **mis ejercicios**), y a partir de ahí trabajas con tu copia. También puedes copiar un programa o una carpeta entera con **Copiar a mis ficheros**.

### Dónde se guardan

Sin cuenta, en el navegador o en el dispositivo (el gestor dice «En este navegador» o «En este dispositivo»). Si borras los datos del sitio, se pierden: descarga antes lo que quieras conservar. Con una cuenta, se sincronizan con la nube y los tienes en todos tus dispositivos ([Cuenta y privacidad](cuenta.md)).

## El editor

El editor es el de Visual Studio Code (Monaco), con lo necesario para el ensamblador de DLX:

- **Resaltado** de instrucciones, registros, etiquetas, directivas y comentarios.
- **Autocompletado** de las instrucciones, con un ejemplo de sus operandos.
- **Ayuda al pasar el ratón** por una instrucción: su sintaxis y qué hace (en inglés).
- **Errores al momento**: los más sencillos se marcan mientras escribes; los demás, al cargar el programa.

### Guardar

<kbd>Ctrl</kbd>+<kbd>S</kbd> guarda. Mientras hay cambios sin guardar, el título del editor dice **Sin guardar**.

> La simulación usa la versión **guardada** del fichero. Si cargas con cambios sin guardar, THUMDER te avisa: guarda y vuelve a cargar.

Con **Auto guardado** activado (en la [configuración](configuracion.md)), el fichero se guarda al salir del editor.

### Mientras simulas

Cada instrucción que está en la máquina lleva una etiqueta con su etapa y su línea se colorea. En SuperDLX, la etiqueta es su estado: en la cola, en la ventana, en su unidad, terminada, confirmada... El editor sigue a la instrucción que se acaba de captar. Más detalles en [Simular un programa](simular.md).

### Herramientas del programa

Debajo del editor, en **Herramientas y problemas del programa**:

| Herramienta | Para qué sirve |
| :-- | :-- |
| **Problemas** | Los errores y avisos del ensamblado, con su línea. Pulsa uno para ir a ella |
| **Módulos** | Los otros ficheros `.s` de la misma carpeta que se ensamblan con el programa, como «Load Code or Data» de WinDLX. Por defecto, los que definen con `.global` los símbolos que faltan |
| **Símbolos** | Las etiquetas del programa con su dirección, después de cargar |
| **Puntos de ruptura** | En qué etapa para cada punto de ruptura y qué memoria se vigila ([Simular un programa](simular.md#puntos-de-ruptura)) |
| **Compartir** | Un enlace con el programa como ejercicio ([Ejercicios](ejercicios.md#compartir-un-ejercicio)) |

## Un programa mínimo

```asm
        .data
msg:    .asciiz "Hola, DLX\n"
        .align  2
args:   .word   msg

        .text
        .global main
main:   addi    r14, r0, args   ; R14 apunta a los parámetros del trap
        trap    5               ; printf
        trap    0               ; fin del programa
```

El código empieza en la dirección `0x100` y los datos en `0x1000`. La ejecución empieza en `main` si existe. Todas las instrucciones están en [La tabla de instrucciones](../../DLX-TABLE-Instructions.md).
