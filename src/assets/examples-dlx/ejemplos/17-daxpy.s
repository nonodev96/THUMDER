;=============================================================================
; THUMDER - Ejemplo 17: DAXPY (Y = a * X + Y)
;-----------------------------------------------------------------------------
; Conceptos:
;   - El bucle clásico de Hennessy y Patterson para estudiar el pipeline:
;     es el núcleo de LINPACK ("Double precision A times X Plus Y").
;   - Cada vuelta tiene una cadena de dependencias: ld -> multd -> addd
;     -> sd. Cada instrucción espera a la anterior.
;   - El coste del control del bucle: dos addi, un subi y un bnez por
;     cada elemento.
;
; Qué mirar en THUMDER:
;   - El diagrama de ciclos: los R-Stall de multd (espera al ld), de addd
;     (espera a multd) y de sd (espera a addd).
;   - Estadísticas: apunta los ciclos totales y compáralos con los de
;     18-daxpy-desenrollado.s, que hace lo mismo en menos ciclos.
;
; Resultado: Y = 10.5 21 31.5 42 52.5 63 73.5 84
;=============================================================================

        .data
        .align  3
A:      .double 0.5
X:      .double 1, 2, 3, 4, 5, 6, 7, 8
Y:      .double 10, 20, 30, 40, 50, 60, 70, 80
N:      .word   8
FmtTxt: .asciiz "Y ="
FmtNum: .asciiz " %g"
Salto:  .asciiz "\n"
        .align  2
ParTxt: .word   FmtTxt
ParNum: .word   FmtNum          ; printf(" %g", Valor)
Valor:  .space  8
ParSalto: .word Salto

        .text
        .global main
main:   ld      f0,A(r0)        ; F0 = a
        addi    r1,r0,X         ; r1 = &X[i]
        addi    r2,r0,Y         ; r2 = &Y[i]
        lw      r3,N(r0)        ; r3 = elementos que quedan

Bucle:  ld      f2,0(r1)        ; F2 = X[i]
        multd   f4,f0,f2        ; F4 = a * X[i]      (R-Stall: espera al ld)
        ld      f6,0(r2)        ; F6 = Y[i]
        addd    f8,f4,f6        ; F8 = a * X[i] + Y[i] (espera a multd)
        sd      0(r2),f8        ; Y[i] = F8           (espera a addd)
        addi    r1,r1,8
        addi    r2,r2,8
        subi    r3,r3,1
        bnez    r3,Bucle

        jal     Imprime
        trap    0

;-----------------------------------------------------------------------------
; Imprime: escribe el vector Y. Usa r20 y r21.
;-----------------------------------------------------------------------------
Imprime:
        addi    r14,r0,ParTxt
        trap    5
        addi    r20,r0,Y
        lw      r21,N(r0)
ImpBucle:
        ld      f10,0(r20)
        sd      Valor(r0),f10
        addi    r14,r0,ParNum
        trap    5
        addi    r20,r20,8
        subi    r21,r21,1
        bnez    r21,ImpBucle
        addi    r14,r0,ParSalto
        trap    5
        jr      r31
