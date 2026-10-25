# El pipeline de DLX

DLX es la arquitectura RISC que Hennessy y Patterson usan para enseñar la **segmentación** (*pipelining*): cada instrucción se divide en cinco etapas, y en cada ciclo hay una instrucción distinta en cada etapa, como en una cadena de montaje. Así, aunque una instrucción tarda cinco ciclos, termina una por ciclo.

Esta página explica la teoría y dónde verla en THUMDER. Para probarla, abre `ejemplos/19-riesgos.s`: cada bloque provoca un tipo de riesgo.

## Las cinco etapas

| Etapa | Nombre | Qué hace |
| :-- | :-- | :-- |
| **IF** | Búsqueda (*fetch*) | Lee de la memoria la instrucción que señala el PC y suma 4 al PC |
| **ID** | Decodificación (*decode*) | Decodifica la instrucción y lee sus registros. Los saltos se deciden aquí |
| **EX** | Ejecución (*execute*) | La ALU calcula el resultado, o la dirección de una carga o un almacenamiento |
| **MEM** | Memoria | Las cargas leen la memoria y los almacenamientos la escriben |
| **WB** | Escritura (*write back*) | El resultado se escribe en su registro |

Lo que pasa en cada etapa según el tipo de instrucción:

| Etapa | Aritmética o lógica | Carga o almacenamiento | Salto |
| :-- | :-- | :-- | :-- |
| IF | IR ← Mem[PC]; PC ← PC + 4 | IR ← Mem[PC]; PC ← PC + 4 | IR ← Mem[PC]; PC ← PC + 4 |
| ID | A ← Rs1; B ← Rs2 | A ← Rs1; B ← Rs2 | BTA ← PC + desplazamiento; si se cumple, PC ← BTA |
| EX | ALU ← A op B (o A op inmediato) | DMAR ← A + inmediato; SDR ← B | |
| MEM | | LDR ← Mem[DMAR], o Mem[DMAR] ← SDR | |
| WB | Rd ← ALU | Rd ← LDR | |

Las operaciones de coma flotante, la multiplicación y la división usan en EX sus propias unidades (faddEX, fmultEX y fdivEX), que tardan varios ciclos.

**En THUMDER**: la vista **Pipeline** enseña la instrucción de cada etapa y su pie explica qué hace cada una en el ciclo; la **Ruta de datos** dibuja los cables que se usan. Los registros IR, A, B, ALU, DMAR, SDR y LDR están en **Registros → Control**.

## Los riesgos

Un **riesgo** (*hazard*) es una situación en la que una instrucción no puede avanzar a su etapa siguiente en el próximo ciclo. Entonces se **detiene** (*stall*) y las que vienen detrás esperan con ella. Cada detención es un ciclo perdido, y aumenta el **CPI** (ciclos por instrucción), que en un pipeline ideal es 1.

### Riesgos de datos

Una instrucción necesita un dato que otra anterior todavía no ha producido. Para dos instrucciones *i* y *j*, con *j* detrás de *i*:

- **RAW** (lectura después de escritura): *j* lee un registro que *i* todavía no ha escrito. Es el más habitual.
- **WAW** (escritura después de escritura): *j* escribiría un registro antes que *i*. En DLX solo pasa con las unidades de coma flotante, que tardan más que las enteras.
- **WAR** (escritura después de lectura): no ocurre en DLX, porque se lee siempre en ID y se escribe siempre en WB.

```asm
        lw      r3, Dato(r0)    ; el dato llega al final de MEM
        add     r4, r3, r3      ; RAW: necesita r3 en EX, un ciclo antes
```

### Riesgos estructurales

Dos instrucciones necesitan a la vez el mismo recurso. En DLX pasa con las unidades de coma flotante, que no están segmentadas: si solo hay un divisor, una segunda división espera a que termine la primera.

### Riesgos de control

Un salto cambia el PC, pero no se sabe si salta hasta ID. Mientras tanto, IF ya ha captado la instrucción siguiente. DLX supone que el salto **no se toma**: si se toma, esa instrucción se **anula** y se pierde un ciclo.

## El adelantamiento

El **adelantamiento** (*forwarding*) lleva un resultado directamente de la salida de la ALU o de la memoria a la entrada de la ALU, sin esperar a que se escriba en el registro. Resuelve casi todos los riesgos RAW.

| Situación | Con adelantamiento | Sin adelantamiento |
| :-- | :-- | :-- |
| Usar el resultado de la ALU de la instrucción anterior | Sin detención | 2 ciclos |
| Usar el dato de una carga anterior | 1 ciclo | 2 ciclos |
| Un salto usa el resultado de la instrucción anterior | 1 ciclo | Espera a que el dato se escriba |
| Usar el resultado de una unidad de coma flotante | Espera a que la unidad termine | Espera a que el dato se escriba |

El registro se escribe en la primera mitad del ciclo y se lee en la segunda, así que una instrucción en ID lee el valor que escribe WB en ese mismo ciclo.

**En THUMDER**: el adelantamiento se activa o se quita en la [configuración](configuracion.md). En el diagrama de ciclos, cada adelantamiento es una flecha verde, y la pestaña **Con y sin adelantamiento** de las estadísticas compara las dos formas.

## Las detenciones en THUMDER

THUMDER usa los nombres de WinDLX en el diagrama de ciclos:

| Nombre | Causa | Cómo evitarla |
| :-- | :-- | :-- |
| `R-Stall` | RAW: falta un dato | Activa el adelantamiento, o separa la instrucción que produce el dato de la que lo usa |
| `W-Stall` | WAW: otra instrucción más lenta escribe el mismo registro | Usa otro registro de destino |
| `S-Stall` | Estructural: no hay una unidad de coma flotante libre | Pon más unidades en la configuración, o separa las operaciones |
| `Stall` | Una instrucción entera y una de coma flotante quieren MEM a la vez (pasa antes la de coma flotante) | Reordena las instrucciones |
| `T-Stall` | Un trap espera en IF a que se vacíe el pipeline | Inevitable: los traps hablan con el exterior |
| `Aborted` | La instrucción se captó detrás de un salto tomado | Reorganiza el bucle para que el salto se tome menos |

Haz clic en una detención del diagrama: THUMDER dice qué registro faltaba, qué instrucción lo producía y si el adelantamiento la habría evitado.

## Planificar el código

Muchas detenciones desaparecen cambiando el orden de las instrucciones, sin cambiar lo que hace el programa: entre una carga y su uso, pon una instrucción que no dependa de ella.

Antes, `add` espera un ciclo por el dato de `lw`:

```asm
loop:   lw      r2, 0(r1)
        add     r3, r3, r2      ; R-Stall: r2 todavía no ha llegado
        addi    r1, r1, 4
```

Después, `addi` ocupa ese ciclo y no hay detención:

```asm
loop:   lw      r2, 0(r1)
        addi    r1, r1, 4
        add     r3, r3, r2      ; r2 llega por adelantamiento
```

El ejemplo `02-suma-vector.s` lo enseña con números, y los ejemplos `17-daxpy.s` y `18-daxpy-desenrollado.s` llevan la idea más lejos: desenrollar un bucle para tener más instrucciones independientes que intercalar.

## Más allá de una instrucción por ciclo

DLX capta como mucho una instrucción por ciclo, así que su CPI nunca baja de 1. **SuperDLX** capta y ejecuta varias por ciclo y fuera de orden, con renombrado de registros, un buffer de reordenación (ROB) y predicción de saltos: [SuperDLX](../superdlx.md).

Para profundizar, el [manual de WinDLX](../manual-simulador-dlx.md) explica el pipeline con todo detalle, y el ensamblado y las reglas exactas que sigue THUMDER están en [El simulador por dentro](../simulador.md).
