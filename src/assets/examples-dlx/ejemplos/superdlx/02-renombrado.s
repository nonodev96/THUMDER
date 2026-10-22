;=============================================================================
; THUMDER - Ejemplo SuperDLX 02: Renombrado de registros
;-----------------------------------------------------------------------------
; Conceptos:
;   - Las dependencias verdaderas (RAW: una instrucción lee lo que escribe
;     otra) obligan a esperar. Las falsas no:
;       WAR: una instrucción escribe un registro que otra anterior lee;
;       WAW: dos instrucciones escriben el mismo registro.
;   - El renombrado las quita: cada instrucción escribe en su entrada del
;     ROB, y las que leen el registro esperan a esa entrada, no al registro.
;     Así hay varias versiones de R4 a la vez, una por cada carga.
;   - Este bucle usa R4 para todo: las tres cargas de cada vuelta tienen
;     dependencias WAR y WAW entre sí, y aun así van en paralelo.
;
; Qué mirar en THUMDER (elige SuperDLX en la cabecera):
;   - Pipeline, «Registros renombrados»: R4 apunta a la última instrucción
;     que lo escribe; en la ventana entera, cada "add" espera a su carga
;     (R4 <- #n), no a la última.
;   - El diagrama de ciclos: ninguna carga espera a las sumas de antes (que
;     leen el R4 anterior): empiezan (E) en el ciclo siguiente a su
;     decodificación (D).
;
; Prueba:
;   Cambia la segunda carga y su suma a R8, y la tercera a R9: los ciclos
;   no cambian, porque el renombrado ya había quitado esas dependencias.
;
; Resultado: A = 36, B = 360, C = 3600
;=============================================================================

        .data
A:      .word   1, 2, 3, 4, 5, 6, 7, 8
B:      .word   10, 20, 30, 40, 50, 60, 70, 80
C:      .word   100, 200, 300, 400, 500, 600, 700, 800
N:      .word   8
Fmt:    .asciiz "A = %d, B = %d, C = %d\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, suma de A, de B y de C)
SumaA:  .space  4
SumaB:  .space  4
SumaC:  .space  4

        .text
        .global main
main:   addi    r1,r0,A         ; r1, r2 y r3: un elemento de cada vector
        addi    r2,r0,B
        addi    r3,r0,C
        lw      r10,N(r0)
        add     r5,r0,r0        ; r5, r6 y r7: las tres sumas
        add     r6,r0,r0
        add     r7,r0,r0

Bucle:  lw      r4,0(r1)        ; R4 = A[i]
        add     r5,r5,r4
        lw      r4,0(r2)        ; R4 = B[i]  (WAR y WAW con lo de arriba)
        add     r6,r6,r4
        lw      r4,0(r3)        ; R4 = C[i]  (WAR y WAW otra vez)
        add     r7,r7,r4
        addi    r1,r1,4
        addi    r2,r2,4
        addi    r3,r3,4
        subi    r10,r10,1
        bnez    r10,Bucle

        sw      SumaA(r0),r5
        sw      SumaB(r0),r6
        sw      SumaC(r0),r7
        addi    r14,r0,Par
        trap    5
        trap    0
