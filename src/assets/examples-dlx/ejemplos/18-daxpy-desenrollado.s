;=============================================================================
; THUMDER - Ejemplo 18: DAXPY con el bucle desenrollado
;-----------------------------------------------------------------------------
; Conceptos:
;   - Desenrollar un bucle: cada vuelta procesa 4 elementos en vez de 1,
;     así que el control del bucle (addi, subi, bnez) se ejecuta 4 veces
;     menos.
;   - Planificar las instrucciones: primero todas las cargas, luego las
;     multiplicaciones, luego las sumas y al final los almacenamientos.
;     Mientras una multiplicación está en fmulEX, el pipeline sigue con
;     otras instrucciones que no dependen de ella.
;   - Hacen falta más registros: cada elemento usa los suyos (F2..F16).
;   - Es lo que hace un compilador con -O3. Exige que N sea múltiplo de 4
;     (si no, hace falta un bucle más para los que sobran).
;
; Qué mirar en THUMDER:
;   - Estadísticas: muchos menos ciclos que 17-daxpy.s, con el mismo
;     resultado.
;   - El pipeline: las cuatro multd se ponen en cola para fmulEX, que solo
;     tiene una unidad (S-Stall, riesgo estructural).
;
; Prueba:
;   En Configuración, pon 4 unidades de multiplicación: las cuatro multd
;   se ejecutan a la vez y el bucle es aún más rápido. Con 17-daxpy.s no
;   cambia nada, porque nunca hay dos multd a la vez.
;
; Resultado: Y = 10.5 21 31.5 42 52.5 63 73.5 84
;=============================================================================

        .data
        .align  3
A:      .double 0.5
X:      .double 1, 2, 3, 4, 5, 6, 7, 8
Y:      .double 10, 20, 30, 40, 50, 60, 70, 80
N:      .word   8               ; múltiplo de 4
FmtTxt: .asciiz "Y ="
FmtNum: .asciiz " %g"
Salto:  .asciiz "\n"
        .align  2
ParTxt: .word   FmtTxt
ParNum: .word   FmtNum
Valor:  .space  8
ParSalto: .word Salto

        .text
        .global main
main:   ld      f0,A(r0)        ; F0 = a
        addi    r1,r0,X         ; r1 = &X[i]
        addi    r2,r0,Y         ; r2 = &Y[i]
        lw      r3,N(r0)
        srli    r3,r3,2         ; r3 = vueltas = N / 4

Bucle:  ld      f2,0(r1)        ; las cuatro X
        ld      f4,8(r1)
        ld      f6,16(r1)
        ld      f8,24(r1)
        multd   f2,f0,f2        ; las cuatro multiplicaciones
        multd   f4,f0,f4
        multd   f6,f0,f6
        multd   f8,f0,f8
        ld      f10,0(r2)       ; las cuatro Y, mientras multiplica
        ld      f12,8(r2)
        ld      f14,16(r2)
        ld      f16,24(r2)
        addd    f10,f10,f2      ; las cuatro sumas
        addd    f12,f12,f4
        addd    f14,f14,f6
        addd    f16,f16,f8
        sd      0(r2),f10       ; y los cuatro resultados
        sd      8(r2),f12
        sd      16(r2),f14
        sd      24(r2),f16
        addi    r1,r1,32        ; 4 elementos de 8 bytes
        addi    r2,r2,32
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
        ld      f18,0(r20)
        sd      Valor(r0),f18
        addi    r14,r0,ParNum
        trap    5
        addi    r20,r20,8
        subi    r21,r21,1
        bnez    r21,ImpBucle
        addi    r14,r0,ParSalto
        trap    5
        jr      r31
