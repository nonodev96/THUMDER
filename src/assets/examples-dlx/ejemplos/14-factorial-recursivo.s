;=============================================================================
; THUMDER - Ejemplo 14: Factorial recursivo y la pila
;-----------------------------------------------------------------------------
; Conceptos:
;   - Una función recursiva: n! = n * (n-1)!, con 1! = 0! = 1.
;   - La pila: cada llamada guarda en ella lo que necesitará después
;     (su dirección de vuelta y su n), porque la llamada siguiente usará
;     los mismos registros.
;   - El convenio de registros que siguen los compiladores de DLX:
;       r4      el argumento
;       r2      el resultado
;       r29     el puntero de pila (SP); la pila crece hacia abajo
;       r31     la dirección de vuelta (la escribe jal)
;
; La pila durante Fact(3), en el momento del caso base:
;       FinPila ->  +----------------------+
;                   | vuelta a main, n = 3 |  marco de Fact(3)
;                   | vuelta a Fact, n = 2 |  marco de Fact(2)
;       r29     ->  | vuelta a Fact, n = 1 |  marco de Fact(1)
;
; Qué mirar en THUMDER:
;   - El registro r29 baja 8 bytes en cada llamada y sube 8 en cada
;     vuelta.
;   - La memoria justo antes de FinPila: los marcos de cada llamada.
;   - El diagrama de ciclos: jal y jr son saltos incondicionales; la
;     instrucción que se busca detrás de ellos se aborta.
;
; Resultado: 7! = 5040 (calculado con recursividad)
;=============================================================================

        .data
N:      .word   7
Fmt:    .asciiz "%d! = %d (calculado con recursividad)\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, n, n!)
ParN:   .space  4
ParR:   .space  4
Pila:   .space  512             ; espacio para 64 marcos de 8 bytes
FinPila:                        ; la pila empieza aquí y crece hacia abajo

        .text
        .global main
main:   addi    r29,r0,FinPila  ; SP = el final de la pila
        lw      r4,N(r0)        ; argumento: n
        jal     Fact            ; r2 = n!
        lw      r4,N(r0)
        sw      ParN(r0),r4
        sw      ParR(r0),r2
        addi    r14,r0,Par
        trap    5
        trap    0

;-----------------------------------------------------------------------------
; Fact: r2 = r4! (r4 >= 0). Usa r5.
;-----------------------------------------------------------------------------
Fact:   subi    r29,r29,8       ; reserva un marco de dos palabras
        sw      4(r29),r31      ; guarda la dirección de vuelta
        sw      0(r29),r4       ; guarda n

        slei    r5,r4,1         ; ¿n <= 1?
        beqz    r5,Recursivo
        addi    r2,r0,1         ; caso base: devuelve 1
        j       Vuelta

Recursivo:
        subi    r4,r4,1
        jal     Fact            ; r2 = (n-1)!  (cambia r4 y r31)
        lw      r4,0(r29)       ; recupera n de la pila
        mult    r2,r2,r4        ; r2 = n * (n-1)!

Vuelta: lw      r31,4(r29)      ; recupera la dirección de vuelta
        addi    r29,r29,8       ; libera el marco
        jr      r31
