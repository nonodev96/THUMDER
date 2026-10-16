;=============================================================================
; THUMDER - Ejemplo 06: Máximo común divisor (algoritmo de Euclides)
;-----------------------------------------------------------------------------
; Conceptos:
;   - División entera (div): va a la unidad de división (fdivEX), la más
;     lenta del procesador (19 ciclos por defecto).
;   - DLX no tiene instrucción de resto: resto = a - (a / b) * b.
;   - Un bucle "mientras" (while): la condición se comprueba al principio.
;
; El algoritmo:
;   mcd(a, b) = mcd(b, a mod b), hasta que b vale 0. Entonces el mcd es a.
;   Cada paso se imprime como una división: a = cociente x b + resto.
;
; Qué mirar en THUMDER:
;   - El pipeline: div ocupa fdivEX durante muchos ciclos y las
;     instrucciones que dependen de él esperan (R-Stall).
;   - Estadísticas: las detenciones RAW por coma flotante son las esperas
;     a div y a mult.
;
; Prueba:
;   gcm.s (en la carpeta de ejemplos de WinDLX) calcula lo mismo restando
;   en vez de dividir. Compara los ciclos de los dos con números como
;   1000 y 3: restar muchas veces puede salir más caro que dividir.
;
; Resultado:
;   1071 = 2 x 462 + 147
;   462 = 3 x 147 + 21
;   147 = 7 x 21 + 0
;   mcd(1071, 462) = 21
;=============================================================================

        .data
A:      .word   1071
B:      .word   462
FmtPaso: .asciiz "%d = %d x %d + %d\n"
FmtFin: .asciiz "mcd(%d, %d) = %d\n"
        .align  2
ParPaso: .word  FmtPaso         ; printf(FmtPaso, a, cociente, b, resto)
PA:     .space  4
PQ:     .space  4
PB:     .space  4
PR:     .space  4
ParFin: .word   FmtFin          ; printf(FmtFin, A, B, mcd)
FA:     .space  4
FB:     .space  4
FM:     .space  4

        .text
        .global main
main:   lw      r2,A(r0)        ; r2 = a
        lw      r3,B(r0)        ; r3 = b

Mientras:
        beqz    r3,Fin          ; while (b != 0)
        div     r4,r2,r3        ; r4 = cociente = a / b      (fdivEX)
        mult    r5,r4,r3        ; r5 = cociente * b          (fmulEX)
        sub     r6,r2,r5        ; r6 = resto = a - cociente * b

        sw      PA(r0),r2       ; imprime el paso
        sw      PQ(r0),r4
        sw      PB(r0),r3
        sw      PR(r0),r6
        addi    r14,r0,ParPaso
        trap    5

        add     r2,r3,r0        ; a <- b
        add     r3,r6,r0        ; b <- resto
        j       Mientras

Fin:    lw      r7,A(r0)
        sw      FA(r0),r7
        lw      r7,B(r0)
        sw      FB(r0),r7
        sw      FM(r0),r2       ; el mcd es el último divisor
        addi    r14,r0,ParFin
        trap    5
        trap    0
