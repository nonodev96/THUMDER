;=============================================================================
; THUMDER - Ejemplo SuperDLX 05: El ROB y las instrucciones largas
;-----------------------------------------------------------------------------
; Conceptos:
;   - Las instrucciones se confirman en orden: una división de 10 ciclos en
;     la cabeza del ROB retiene a todas las que van detrás, aunque hayan
;     terminado.
;   - El ROB es la ventana de la máquina: cuantas más entradas, más
;     instrucciones de vueltas siguientes pueden empezar mientras tanto. Con
;     un ROB pequeño se llena y la decodificación se para.
;   - La máquina tiene dos mitades: las instrucciones enteras se confirman
;     en su ROB sin esperar a la división, que está en el de coma flotante.
;   - El bucle suma 1/1 + 1/2 + ... + 1/8: las divisiones son
;     independientes, solo la suma (addd) espera a cada una.
;
; Qué mirar en THUMDER (elige SuperDLX en la cabecera):
;   - Pipeline: el ROB de coma flotante, con la división en la cabeza y las
;     de detrás terminadas, esperando; y las dos unidades de división.
;   - Estadísticas, pestaña «Detenciones»: «ROB de coma flotante lleno».
;
; Prueba:
;   En la configuración, pon el ROB de coma flotante en 4 entradas: las
;   divisiones casi no se solapan y el programa tarda mucho más. Con 40 no
;   mejora: el límite pasan a ser las dos unidades de división.
;
; Resultado: Suma de 1/i para i = 1..8: 2.71786
;=============================================================================

        .data
        .align  3
Uno:    .double 1
N:      .word   8
Fmt:    .asciiz "Suma de 1/i para i = 1..8: %g\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, Suma)
Suma:   .space  8

        .text
        .global main
main:   ld      f0,Uno(r0)      ; F0 = 1.0
        movi2fp f8,r0           ; F8-F9: la suma, 0.0
        cvti2d  f8,f8
        addi    r2,r0,1         ; r2 = i
        lw      r3,N(r0)

Bucle:  movi2fp f2,r2           ; i, de entero a doble
        cvti2d  f4,f2
        divd    f6,f0,f4        ; 1/i: 10 ciclos en un divisor
        addd    f8,f8,f6        ; suma = suma + 1/i (espera a su división)
        addi    r2,r2,1
        subi    r3,r3,1
        bnez    r3,Bucle

        sd      Suma(r0),f8
        addi    r14,r0,Par
        trap    5
        trap    0
