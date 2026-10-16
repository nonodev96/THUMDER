;=============================================================================
; THUMDER - Ejemplo 04: Sucesión de Fibonacci
;-----------------------------------------------------------------------------
; Conceptos:
;   - Guardar resultados en una tabla de memoria (.space reserva bytes).
;   - Llamar a un trap dentro de un bucle.
;   - Los registros que usan los traps: R14 (parámetros) y R1 (resultado).
;     Por eso este programa no guarda nada en R1: printf lo sobrescribe
;     con el número de caracteres que ha escrito.
;
; Qué mirar en THUMDER:
;   - La consola muestra los números según se calculan.
;   - La memoria, a partir de la etiqueta Tabla: F(0)..F(19).
;   - Estadísticas: cada trap suma detenciones de trap (T-Stall).
;
; Resultado: 0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597 2584 4181
;=============================================================================

        .data
N:      .word   20              ; cuántos términos
Tabla:  .space  80              ; 20 palabras para F(0)..F(19)
Fmt:    .asciiz "%d "
Salto:  .asciiz "\n"
        .align  2
Par:    .word   Fmt             ; printf("%d ", Valor)
Valor:  .space  4
ParFin: .word   Salto           ; printf("\n")

        .text
        .global main
main:   lw      r5,N(r0)        ; r5: términos que quedan
        addi    r6,r0,Tabla     ; r6: dirección de F(i) (no R1: printf lo usa)
        add     r2,r0,r0        ; r2 = F(i)   = 0
        addi    r3,r0,1         ; r3 = F(i+1) = 1

Bucle:  sw      0(r6),r2        ; Tabla[i] = F(i)
        sw      Valor(r0),r2
        addi    r14,r0,Par
        trap    5               ; printf("%d ", F(i))
        add     r4,r2,r3        ; F(i+2) = F(i) + F(i+1)
        add     r2,r3,r0        ; avanzar: F(i)   <- F(i+1)
        add     r3,r4,r0        ;          F(i+1) <- F(i+2)
        addi    r6,r6,4
        subi    r5,r5,1
        bnez    r5,Bucle

        addi    r14,r0,ParFin
        trap    5               ; printf("\n")
        trap    0
