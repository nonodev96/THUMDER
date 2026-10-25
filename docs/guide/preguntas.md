# Preguntas frecuentes

## Uso

### He cambiado el programa, pero se simula el de antes

La simulación usa la versión **guardada** del fichero. Guarda (<kbd>Ctrl</kbd>+<kbd>S</kbd>) y vuelve a cargar (<kbd>Ctrl</kbd>+<kbd>F9</kbd>). Si cargas con cambios sin guardar, THUMDER te avisa.

### No puedo guardar un ejemplo

Las carpetas **ejemplos** y **ejercicios** son de solo lectura. Al guardar un programa suyo se crea una copia en **mis ejemplos** (o **mis ejercicios**), y esa copia es la que se abre a partir de entonces.

### El programa se queda parado y no avanza

Mira la barra de estado, abajo:

- **Esperando una línea de la consola**: el programa ha ejecutado un `trap 3`. Escribe la línea en la consola y pulsa <kbd>Intro</kbd>.
- **Parado en un punto de ruptura**: pulsa **Ejecutar** o **Paso** para seguir.
- **Con errores**: el programa no se ha podido ensamblar; los errores están en el panel **Problemas**, debajo del editor.
- **Terminado**: el programa ha llegado a `trap 0`. Carga otra vez para repetirlo.

### El programa da un error al ejecutarse

Una dirección fuera de la memoria, un acceso sin alinear (una palabra tiene que estar en una dirección múltiplo de 4), una división entera por cero o una palabra que no es una instrucción paran la simulación. THUMDER dice el error y la dirección. Revisa las directivas `.align` y las direcciones de tus datos, y el tamaño de la memoria en la configuración.

### ¿Por qué se detiene esta instrucción?

En **Ciclos de reloj**, haz clic en la detención: THUMDER explica qué dato faltaba, qué instrucción lo producía y si el adelantamiento la habría evitado. Los tipos de detención se explican en [El pipeline de DLX](pipeline.md#las-detenciones-en-thumder).

### ¿Cómo empiezo un programa en una dirección concreta?

La ejecución empieza en la etiqueta `main` si existe y, si no, al principio del código (`0x100`). `.text` y `.data` aceptan una dirección (`.data 0x2000`).

### ¿Puedo usar varios ficheros?

Sí. Los símbolos que un fichero declara con `.global` los pueden usar los demás de la misma carpeta. THUMDER añade solo los que hacen falta, o puedes elegirlos en **Herramientas del programa → Módulos**. El ejemplo `20-media-entrada.s` usa `input.s` así.

## Ficheros y cuenta

### ¿Dónde están mis ficheros?

Sin cuenta, en ese navegador o ese dispositivo. Si borras los datos del sitio o desinstalas la aplicación, se pierden: descárgalos antes (**Descargar todo (.zip)**). Con cuenta, también en la nube.

### ¿Cómo paso mis ficheros a otro ordenador?

Inicia sesión con la misma cuenta en los dos. Sin cuenta: **Descargar todo (.zip)** en uno e **Importar** el `.zip` en el otro.

### ¿Necesito una cuenta?

No. Todo funciona sin cuenta; solo sirve para sincronizar los ficheros entre dispositivos ([Cuenta y privacidad](cuenta.md)).

## THUMDER y WinDLX

### ¿Funcionan mis programas de WinDLX?

Sí: THUMDER usa el mismo ensamblador, las mismas directivas, los mismos traps y los mismos códigos de instrucción que WinDLX, y simula el mismo pipeline. Las pocas diferencias (por ejemplo, que la ejecución empieza en `main`) están en [El simulador por dentro](../simulador.md#6-diferencias-con-windlx).

### ¿Los resultados son iguales que en WinDLX?

Los ciclos y las detenciones siguen las reglas del manual de WinDLX, y cada regla tiene su prueba. Además, cada ejemplo se comprueba contra un ejecutor de referencia sin pipeline: el estado final tiene que ser idéntico.

### ¿Por qué un mismo programa tarda distinto en DLX y en SuperDLX?

Porque SuperDLX ejecuta varias instrucciones por ciclo y fuera de orden. El resultado del programa es el mismo; solo cambian los ciclos. Las estadísticas de SuperDLX comparan las dos.

## Problemas técnicos

### La aplicación de escritorio no abre: el sistema dice que no es segura

No está firmada, porque los certificados son de pago. En Windows: **Más información → Ejecutar de todas formas**. En macOS: clic derecho → **Abrir**. Más detalles en [Instalar THUMDER](instalar.md).

### Algo no funciona como debería

Abre una incidencia en [GitHub](https://github.com/nonodev96/THUMDER/issues) con el programa, la configuración y lo que esperabas que pasara. El botón **Depuración**, al pie de la página, enseña la versión y la ruta, que ayudan a encontrar el problema.
