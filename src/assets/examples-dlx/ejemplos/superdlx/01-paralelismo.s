;=============================================================================
; THUMDER - Ejemplo SuperDLX 01: Paralelismo entre instrucciones
;-----------------------------------------------------------------------------
; Conceptos:
;   - Un procesador superescalar ejecuta a la vez las instrucciones que no
;     dependen unas de otras: el límite es el paralelismo del programa.
;   - Una cadena de dependencias (cada suma usa el resultado de la
;     anterior) va a una instrucción por ciclo, por ancha que sea la máquina.
;   - Los dos bucles suman el mismo vector, 8 elementos en cada vuelta: el
;     primero con un acumulador (una cadena de 8 sumas por vuelta) y el
;     segundo con cuatro acumuladores independientes, que se juntan al final.
;
; Qué mirar en THUMDER (elige SuperDLX en la cabecera):
;   - El diagrama de ciclos: en "Uno" las sumas esperan en la ventana (w)
;     una detrás de otra; en "Cuatro" empiezan (E) varias en el mismo ciclo.
;   - Pipeline: en la ventana entera, cada "add" de "Uno" espera a la
;     instrucción de antes (R3 <- #n).
;   - Estadísticas: las instrucciones por ciclo (IPC). Compáralas con la
;     máquina escalar de la configuración (una instrucción por ciclo).
;
; Prueba:
;   Con DLX los dos bucles tardan lo mismo: el pipeline ejecuta una
;   instrucción por ciclo en orden y el adelantamiento resuelve las
;   dependencias. La diferencia solo aparece cuando caben varias a la vez.
;
; Resultado:
;   Un acumulador: 528
;   Cuatro acumuladores: 528
;=============================================================================

        .data
Vector: .word   1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
        .word   17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
N:      .word   4               ; vueltas: 8 elementos en cada una
FmtUno: .asciiz "Un acumulador: %d\n"
FmtCuatro: .asciiz "Cuatro acumuladores: %d\n"
        .align  2
ParUno: .word   FmtUno          ; printf(FmtUno, Valor)
Valor:  .space  4
ParCuatro: .word FmtCuatro      ; printf(FmtCuatro, Valor2)
Valor2: .space  4

        .text
        .global main
main:   addi    r1,r0,Vector
        lw      r2,N(r0)
        add     r3,r0,r0        ; r3: la suma, en un solo acumulador

Uno:    lw      r4,0(r1)
        lw      r5,4(r1)
        lw      r6,8(r1)
        lw      r7,12(r1)
        lw      r8,16(r1)
        lw      r9,20(r1)
        lw      r10,24(r1)
        lw      r11,28(r1)
        add     r3,r3,r4        ; cada suma espera a la anterior:
        add     r3,r3,r5        ; una cadena de ocho
        add     r3,r3,r6
        add     r3,r3,r7
        add     r3,r3,r8
        add     r3,r3,r9
        add     r3,r3,r10
        add     r3,r3,r11
        addi    r1,r1,32
        subi    r2,r2,1
        bnez    r2,Uno

Prepara: addi   r1,r0,Vector
        lw      r2,N(r0)
        add     r12,r0,r0       ; cuatro acumuladores: r12, r13, r15 y r16
        add     r13,r0,r0
        add     r15,r0,r0
        add     r16,r0,r0

Cuatro: lw      r4,0(r1)
        lw      r5,4(r1)
        lw      r6,8(r1)
        lw      r7,12(r1)
        lw      r8,16(r1)
        lw      r9,20(r1)
        lw      r10,24(r1)
        lw      r11,28(r1)
        add     r12,r12,r4      ; cuatro cadenas de dos sumas:
        add     r13,r13,r5      ; las cuatro primeras pueden empezar
        add     r15,r15,r6      ; en el mismo ciclo
        add     r16,r16,r7
        add     r12,r12,r8
        add     r13,r13,r9
        add     r15,r15,r10
        add     r16,r16,r11
        addi    r1,r1,32
        subi    r2,r2,1
        bnez    r2,Cuatro

Junta:  add     r12,r12,r13     ; la suma de los cuatro
        add     r15,r15,r16
        add     r12,r12,r15

Fin:    sw      Valor(r0),r3
        addi    r14,r0,ParUno
        trap    5
        sw      Valor2(r0),r12
        addi    r14,r0,ParCuatro
        trap    5
        trap    0
