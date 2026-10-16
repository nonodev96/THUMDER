;=============================================================================
; THUMDER - Ejemplo 05: Factorial con enteros
;-----------------------------------------------------------------------------
; Conceptos:
;   - La multiplicación de enteros (mult) no se hace en la unidad entera:
;     va a la unidad de multiplicación de coma flotante (fmulEX), que
;     tarda varios ciclos (5 por defecto).
;   - Riesgo de datos con una unidad lenta: cada mult usa el resultado
;     del anterior y tiene que esperar a que termine.
;   - printf con dos parámetros: van uno detrás de otro en memoria.
;
; Qué mirar en THUMDER:
;   - El pipeline: las instrucciones mult pasan por fmulEX.
;   - El diagrama de ciclos: R-Stall mientras el mult anterior sigue en
;     la unidad.
;
; Prueba:
;   En Configuración, baja el retardo de la multiplicación a 1 ciclo y
;   compara los ciclos totales en Estadísticas. Con N = 13 el resultado
;   ya no cabe en 32 bits: mult se queda con los 32 bits bajos.
;
; Resultado: 10! = 3628800
;=============================================================================

        .data
N:      .word   10
Fmt:    .asciiz "%d! = %d\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, n, n!)
ParN:   .space  4
ParR:   .space  4

        .text
        .global main
main:   lw      r2,N(r0)        ; r2 = n
        addi    r4,r0,1         ; r4 = resultado = 1
        add     r5,r2,r0        ; r5 = contador = n
        beqz    r5,Fin          ; 0! = 1

Bucle:  mult    r4,r4,r5        ; resultado = resultado * contador (fmulEX)
        subi    r5,r5,1
        bnez    r5,Bucle

Fin:    sw      ParN(r0),r2
        sw      ParR(r0),r4
        addi    r14,r0,Par
        trap    5               ; printf("%d! = %d\n", n, n!)
        trap    0
