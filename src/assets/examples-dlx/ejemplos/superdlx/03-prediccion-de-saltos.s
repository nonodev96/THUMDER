;=============================================================================
; THUMDER - Ejemplo SuperDLX 03: Predicción de saltos
;-----------------------------------------------------------------------------
; Conceptos:
;   - Para no esperar a cada salto, la captación predice si se toma con la
;     BTB: un contador de 2 bits por salto (00 y 01 no tomado, 10 y 11
;     tomado) que sube cuando se toma y baja cuando no.
;   - Un fallo de predicción anula todo lo captado detrás del salto y la
;     captación empieza de nuevo por el camino correcto.
;   - El salto de un bucle se predice bien: falla solo al salir. El de un
;     "if" depende de los datos: si alternan, el contador no acierta.
;   - La subrutina Cuenta se llama dos veces con los mismos números en
;     distinto orden: alternos (impar, par, impar...) y agrupados (primero
;     los impares y luego los pares).
;
; Qué mirar en THUMDER (elige SuperDLX en la cabecera):
;   - Pipeline, «BTB y predicción»: el contador del "beqz" de Cuenta.
;   - El diagrama de ciclos: los saltos mal predichos (marcados) y las
;     instrucciones anuladas detrás de ellos (X).
;   - Estadísticas, pestaña «Saltos»: los aciertos del predictor.
;
; Prueba:
;   Desactiva la predicción en la configuración: no se anula nada, pero la
;   captación espera a cada salto y el programa tarda más.
;
; Resultado:
;   Alternos: 8 pares y 8 impares
;   Agrupados: 8 pares y 8 impares
;=============================================================================

        .data
Alternos:  .word 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
Agrupados: .word 1, 3, 5, 7, 9, 11, 13, 15, 2, 4, 6, 8, 10, 12, 14, 16
N:      .word   16
FmtAlt: .asciiz "Alternos: %d pares y %d impares\n"
FmtAgr: .asciiz "Agrupados: %d pares y %d impares\n"
        .align  2
ParAlt: .word   FmtAlt          ; printf(FmtAlt, pares, impares)
Pares1: .space  4
Impares1: .space 4
ParAgr: .word   FmtAgr          ; printf(FmtAgr, pares, impares)
Pares2: .space  4
Impares2: .space 4

        .text
        .global main
main:
Primera: addi   r1,r0,Alternos
        jal     Cuenta
        sw      Pares1(r0),r6
        sw      Impares1(r0),r7
        addi    r14,r0,ParAlt
        trap    5

Segunda: addi   r1,r0,Agrupados
        jal     Cuenta
        sw      Pares2(r0),r6
        sw      Impares2(r0),r7
        addi    r14,r0,ParAgr
        trap    5
        trap    0

;-----------------------------------------------------------------------------
; Cuenta: los pares (r6) y los impares (r7) de los N números desde r1
;-----------------------------------------------------------------------------
Cuenta: lw      r2,N(r0)
        add     r6,r0,r0
        add     r7,r0,r0
Bucle:  lw      r4,0(r1)
        andi    r5,r4,1         ; r5 = 1 si es impar
        beqz    r5,Par          ; el "if": depende del número
        addi    r7,r7,1         ; impar
        j       Sigue
Par:    addi    r6,r6,1         ; par
Sigue:  addi    r1,r1,4
        subi    r2,r2,1
        bnez    r2,Bucle        ; el salto del bucle: casi siempre tomado
        jr      r31
