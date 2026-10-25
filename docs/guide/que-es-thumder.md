# ¿Qué es THUMDER?

THUMDER (*THe UltiMate Dlx EmulatoR*) es un simulador del procesador **DLX** para aprender cómo funciona un pipeline. Escribes un programa en ensamblador, lo cargas y ves, ciclo a ciclo, qué hace cada instrucción, qué registros y qué memoria cambia, y por qué se detiene.

![El editor con la etapa del pipeline de cada instrucción](img/editor-stages.png)

## Para quién es

- **Estudiantes** de Arquitectura o Estructura de Computadores: los ejemplos, los ejercicios y las explicaciones de cada vista siguen el temario clásico (Hennessy y Patterson, WinDLX).
- **Docentes**: un programa se comparte como ejercicio con un enlace, con la configuración de la máquina bloqueada si hace falta.
- **Cualquiera con curiosidad** por saber qué pasa dentro de un procesador.

## Qué simula

| Arquitectura | Qué es |
| :-- | :-- |
| **DLX** | El pipeline de cinco etapas de WinDLX (IF, ID, EX, MEM y WB): una instrucción por ciclo, en orden, con adelantamiento, detenciones y unidades de coma flotante. |
| **SuperDLX** | Un DLX superescalar con ejecución fuera de orden, como WinSuperDLX: varias instrucciones por ciclo, ventanas, ROB y predicción de saltos. |

El mismo programa termina igual en las dos: solo cambian los ciclos. La arquitectura se elige en la barra superior.

## Dónde se usa

- **En el navegador**, en <https://thumder.netlify.app>, sin instalar nada.
- **En el escritorio**: Windows, Linux y macOS.
- **En el móvil**: Android (APK) y, en iPhone y iPad, desde el navegador.

Todo ocurre en tu dispositivo: no hace falta cuenta ni servidor. Una cuenta solo sirve para tener los mismos ficheros en varios dispositivos. Cómo conseguir cada versión: [Instalar THUMDER](instalar.md).

## Por dónde seguir

1. [Primeros pasos](primeros-pasos.md): tu primera simulación en cinco minutos.
2. [Simular un programa](simular.md): los controles, los atajos y los puntos de ruptura.
3. [El pipeline de DLX](pipeline.md): la teoría que hay detrás de lo que ves.
