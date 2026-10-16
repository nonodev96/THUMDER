;=============================================================================
; THUMDER - Ejemplo 15: Las torres de Hanoi
;-----------------------------------------------------------------------------
; Conceptos:
;   - Recursividad con varios argumentos (r4 a r7) y dos llamadas
;     recursivas en cada nivel.
;   - Marcos de pila de 5 palabras: la dirección de vuelta y los cuatro
;     argumentos, que cada llamada cambia.
;   - printf con caracteres (%c).
;
; El problema:
;   Hay que pasar n discos de la torre A a la C, de uno en uno y sin
;   poner nunca un disco sobre otro más pequeño. Para mover n discos de
;   origen a destino:
;     1. se mueven n-1 discos de origen a la torre auxiliar;
;     2. se mueve el disco n de origen a destino;
;     3. se mueven los n-1 discos de la auxiliar a destino.
;   Hacen falta 2^n - 1 movimientos.
;
; Qué mirar en THUMDER:
;   - El registro r29 (la pila) baja y sube con cada llamada.
;   - Estadísticas: los saltos (jal, jr) y los traps.
;
; Prueba:
;   Con N = 4 salen 15 movimientos y con N = 5, 31.
;
; Resultado:
;   Disco 1: A -> C
;   Disco 2: A -> B
;   Disco 1: C -> B
;   Disco 3: A -> C
;   Disco 1: B -> A
;   Disco 2: B -> C
;   Disco 1: A -> C
;   Movimientos: 7
;=============================================================================

        .data
N:      .word   3
FmtMov: .asciiz "Disco %d: %c -> %c\n"
FmtFin: .asciiz "Movimientos: %d\n"
        .align  2
ParMov: .word   FmtMov          ; printf(FmtMov, disco, origen, destino)
PDisco: .space  4
POrig:  .space  4
PDest:  .space  4
ParFin: .word   FmtFin
PTotal: .space  4
Pila:   .space  800
FinPila:

        .text
        .global main
main:   addi    r29,r0,FinPila  ; SP
        add     r10,r0,r0       ; r10 = movimientos (nadie más lo usa)
        lw      r4,N(r0)        ; n
        addi    r5,r0,'A'       ; origen
        addi    r6,r0,'C'       ; destino
        addi    r7,r0,'B'       ; auxiliar
        jal     Hanoi
        sw      PTotal(r0),r10
        addi    r14,r0,ParFin
        trap    5
        trap    0

;-----------------------------------------------------------------------------
; Hanoi: mueve r4 discos de la torre r5 a la r6 usando la r7
;-----------------------------------------------------------------------------
Hanoi:  beqz    r4,Nada         ; 0 discos: nada que hacer
        subi    r29,r29,20      ; marco: r31, r4, r5, r6, r7
        sw      16(r29),r31
        sw      12(r29),r4
        sw      8(r29),r5
        sw      4(r29),r6
        sw      0(r29),r7

        ; 1. Hanoi(n-1, origen, auxiliar, destino)
        subi    r4,r4,1
        add     r8,r6,r0        ; intercambia destino y auxiliar
        add     r6,r7,r0
        add     r7,r8,r0
        jal     Hanoi

        ; 2. Mueve el disco n de origen a destino
        lw      r4,12(r29)
        lw      r5,8(r29)
        lw      r6,4(r29)
        sw      PDisco(r0),r4
        sw      POrig(r0),r5
        sw      PDest(r0),r6
        addi    r14,r0,ParMov
        trap    5
        addi    r10,r10,1

        ; 3. Hanoi(n-1, auxiliar, destino, origen)
        subi    r4,r4,1
        lw      r5,0(r29)       ; origen = auxiliar
        lw      r7,8(r29)       ; auxiliar = origen
        jal     Hanoi           ; (r6 sigue siendo el destino)

        lw      r31,16(r29)
        addi    r29,r29,20
Nada:   jr      r31
