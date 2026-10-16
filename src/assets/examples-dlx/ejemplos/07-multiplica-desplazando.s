;=============================================================================
; THUMDER - Ejemplo 07: Multiplicar con sumas y desplazamientos
;-----------------------------------------------------------------------------
; Conceptos:
;   - Las operaciones con bits: andi (y lógico), slli y srli
;     (desplazamientos a la izquierda y a la derecha).
;   - Cómo multiplica el hardware: como a mano, pero en binario. Por cada
;     bit a 1 del multiplicador se suma el multiplicando desplazado.
;
; Ejemplo con 6 x 5 (5 = 101 en binario):
;        110        multiplicando (6)
;      x 101        multiplicador (5)
;      -----
;        110        bit 0 = 1: se suma 6
;       0000        bit 1 = 0: no se suma
;    + 11000        bit 2 = 1: se suma 6 desplazado 2 bits (24)
;      -----
;      11110        30
;
; Qué mirar en THUMDER:
;   - Los registros r1 (multiplicando), r2 (multiplicador) y r3 (producto)
;     en cada vuelta del bucle.
;   - Estadísticas: el bucle da tantas vueltas como bits tiene el
;     multiplicador (6 para 45 = 101101). Al final, mult hace lo mismo en
;     la unidad fmulEX para comprobar el resultado.
;
; Resultado: 123 x 45 = 5535 (con mult: 5535)
;=============================================================================

        .data
X:      .word   123             ; multiplicando
Y:      .word   45              ; multiplicador
Fmt:    .asciiz "%d x %d = %d (con mult: %d)\n"
        .align  2
Par:    .word   Fmt
PX:     .space  4
PY:     .space  4
PP:     .space  4
PM:     .space  4

        .text
        .global main
main:   lw      r1,X(r0)        ; r1 = multiplicando
        lw      r2,Y(r0)        ; r2 = multiplicador
        add     r3,r0,r0        ; r3 = producto = 0

Bucle:  beqz    r2,Fin          ; sin más bits a 1: se acabó
        andi    r4,r2,1         ; r4 = bit más bajo del multiplicador
        beqz    r4,NoSuma
        add     r3,r3,r1        ; bit a 1: producto += multiplicando
NoSuma: slli    r1,r1,1         ; multiplicando * 2
        srli    r2,r2,1         ; multiplicador / 2: el siguiente bit
        j       Bucle

Fin:    lw      r5,X(r0)        ; lo mismo con la instrucción mult
        lw      r6,Y(r0)
        mult    r7,r5,r6
        sw      PX(r0),r5
        sw      PY(r0),r6
        sw      PP(r0),r3
        sw      PM(r0),r7
        addi    r14,r0,Par
        trap    5
        trap    0
