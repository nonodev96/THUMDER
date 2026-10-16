;=============================================================================
; THUMDER - Ejemplo 16: Producto escalar en coma flotante
;-----------------------------------------------------------------------------
; Conceptos:
;   - Números en coma flotante de doble precisión (.double, 8 bytes).
;     Cada uno ocupa dos registros F: F0-F1, F2-F3... por eso las
;     instrucciones de dobles solo admiten registros pares.
;   - ld y sd cargan y guardan 8 bytes; multd y addd operan con dobles.
;   - Las unidades de coma flotante: multd va a fmulEX (5 ciclos por
;     defecto) y addd a faddEX (2 ciclos).
;   - El producto escalar: X . Y = suma de X[i] * Y[i].
;
; Qué mirar en THUMDER:
;   - El pipeline: multd y addd pasan por sus unidades.
;   - El diagrama de ciclos: addd espera (R-Stall) a que termine multd.
;     Además, cada addd necesita el F8 del anterior: todas las sumas van
;     en cadena sobre el mismo acumulador.
;   - Los registros F en formato doble.
;
; Prueba:
;   Cambia en Configuración el número y el retardo de las unidades de
;   multiplicación y suma y mira cómo cambian los ciclos.
;
; Resultado: X . Y = 16.5
;=============================================================================

        .data
        .align  3               ; los dobles, en múltiplos de 8
X:      .double 1.5, 2, -3, 4.25, 0.5, 10
Y:      .double 2, 0.5, 1, 4, -8, 0.25
N:      .word   6
Fmt:    .asciiz "X . Y = %g\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, resultado)
Res:    .space  8               ; el doble va justo detrás del formato

        .text
        .global main
main:   addi    r1,r0,X         ; r1 = &X[i]
        addi    r2,r0,Y         ; r2 = &Y[i]
        lw      r3,N(r0)        ; r3 = elementos que quedan
        subd    f8,f8,f8        ; F8 = suma = 0.0

Bucle:  ld      f2,0(r1)        ; F2 = X[i]
        ld      f4,0(r2)        ; F4 = Y[i]
        multd   f6,f2,f4        ; F6 = X[i] * Y[i]     (fmulEX)
        addd    f8,f8,f6        ; suma += X[i] * Y[i]  (faddEX)
        addi    r1,r1,8         ; cada doble ocupa 8 bytes
        addi    r2,r2,8
        subi    r3,r3,1
        bnez    r3,Bucle

        sd      Res(r0),f8
        addi    r14,r0,Par
        trap    5               ; printf("X . Y = %g\n", suma)
        trap    0
