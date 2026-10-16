;=============================================================================
; THUMDER - Ejemplo 03: Máximo de un vector
;-----------------------------------------------------------------------------
; Conceptos:
;   - Comparaciones: slt deja un 1 en el registro si el primer operando es
;     menor (con signo) y un 0 si no. DLX no tiene saltos "si es menor":
;     se compara con una instrucción "set" y se salta con beqz o bnez.
;   - La predicción "no tomado" de DLX: cuando el salto se toma, la
;     instrucción que ya se había buscado se aborta.
;
; Qué mirar en THUMDER:
;   - En el diagrama de ciclos aparece "Aborted" tras cada salto tomado:
;     es el ciclo perdido (detención de control).
;   - Estadísticas: saltos condicionales tomados y no tomados.
;
; Prueba:
;   Cambia slt por sltu (sin signo): -5 y -40 pasan a ser números enormes
;   y el máximo cambia. Los bits son los mismos; lo que cambia es cómo se
;   interpretan.
;
; Resultado: El maximo es 33
;=============================================================================

        .data
Datos:  .word   12, -5, 33, 7, 33, -40, 21, 9
N:      .word   8
Fmt:    .asciiz "El maximo es %d\n"
        .align  2
Par:    .word   Fmt
Valor:  .space  4

        .text
        .global main
main:   addi    r1,r0,Datos     ; r1: dirección del elemento actual
        lw      r2,N(r0)        ; r2: elementos que quedan
        lw      r3,0(r1)        ; r3: máximo = primer elemento
        addi    r1,r1,4
        subi    r2,r2,1

Bucle:  lw      r4,0(r1)        ; r4 = Datos[i]
        slt     r5,r3,r4        ; r5 = (máximo < Datos[i])
        beqz    r5,Sigue        ; si no es mayor, el máximo no cambia
        add     r3,r4,r0        ; nuevo máximo
Sigue:  addi    r1,r1,4
        subi    r2,r2,1
        bnez    r2,Bucle

        sw      Valor(r0),r3
        addi    r14,r0,Par
        trap    5               ; printf("El maximo es %d\n", máximo)
        trap    0
