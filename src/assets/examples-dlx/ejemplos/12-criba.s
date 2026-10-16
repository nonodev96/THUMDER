;=============================================================================
; THUMDER - Ejemplo 12: La criba de Eratóstenes
;-----------------------------------------------------------------------------
; Conceptos:
;   - Un vector de bytes como tabla de marcas: Compuesto[i] vale 1 si i no
;     es primo. La memoria empieza a cero, así que al principio ningún
;     número está marcado.
;   - Direccionamiento con desplazamiento: sb 0(r7) con r7 = Compuesto + j.
;   - El algoritmo: el primer número sin marcar es primo; se marcan todos
;     sus múltiplos y se pasa al siguiente sin marcar.
;
; Qué mirar en THUMDER:
;   - La memoria en la etiqueta Compuesto: los múltiplos se van marcando.
;   - Compara con prim.s, que prueba a dividir cada número: la criba no
;     necesita ni una sola división.
;
; Prueba:
;   Cambia el límite N (y el tamaño de Compuesto) para buscar más primos.
;
; Resultado:
;   2 3 5 7 11 13 17 19 23 29 31 37 41 43 47 53 59 61 67 71 73 79 83 89 97
;   Hay 25 primos menores que 100
;=============================================================================

        .data
N:      .word   100
Compuesto: .space 100           ; un byte por número: 0 primo, 1 compuesto
FmtNum: .asciiz "%d "
FmtFin: .asciiz "\nHay %d primos menores que %d\n"
        .align  2
ParNum: .word   FmtNum
Valor:  .space  4
ParFin: .word   FmtFin
Total:  .space  4
Limite: .space  4

        .text
        .global main
main:   lw      r2,N(r0)        ; r2 = N
        addi    r3,r0,2         ; r3 = i = 2
        add     r4,r0,r0        ; r4 = primos encontrados

Bucle:  slt     r5,r3,r2        ; ¿i < N?
        beqz    r5,Fin
        lbu     r6,Compuesto(r3) ; ¿está marcado?
        bnez    r6,Siguiente

        addi    r4,r4,1         ; i es primo
        sw      Valor(r0),r3
        addi    r14,r0,ParNum
        trap    5

        add     r7,r3,r3        ; j = 2i: el primer múltiplo
        addi    r8,r0,1
Marca:  slt     r5,r7,r2        ; ¿j < N?
        beqz    r5,Siguiente
        sb      Compuesto(r7),r8 ; Compuesto[j] = 1
        add     r7,r7,r3        ; j = j + i
        j       Marca

Siguiente:
        addi    r3,r3,1
        j       Bucle

Fin:    sw      Total(r0),r4
        sw      Limite(r0),r2
        addi    r14,r0,ParFin
        trap    5
        trap    0
