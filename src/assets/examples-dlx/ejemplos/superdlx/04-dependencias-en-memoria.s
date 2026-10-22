;=============================================================================
; THUMDER - Ejemplo SuperDLX 04: Dependencias a través de la memoria
;-----------------------------------------------------------------------------
; Conceptos:
;   - Los almacenamientos escriben la memoria cuando se confirman, en orden.
;     Hasta entonces esperan en el buffer de almacenamientos.
;   - Una carga no puede adelantar a un almacenamiento anterior que puede
;     escribir sus bytes: espera a que se escriba (las cargas sí adelantan a
;     los almacenamientos de otras direcciones).
;   - El primer bucle guarda la suma en memoria en cada vuelta: cada carga
;     de Total espera al almacenamiento de la vuelta anterior. El segundo la
;     lleva en un registro y la guarda una vez al final.
;
; Qué mirar en THUMDER (elige SuperDLX en la cabecera):
;   - Pipeline, «Buffer de cargas»: la carga de Total espera a un
;     almacenamiento; en el de almacenamientos, el "sw" espera a confirmarse.
;   - El diagrama de ciclos: en "EnMemoria" cada vuelta tarda mucho más que
;     en "EnRegistro".
;   - Estadísticas, pestaña «Detenciones»: las cargas que esperaron.
;
; Resultado: En memoria: 120, en un registro: 120
;=============================================================================

        .data
Vector: .word   1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
N:      .word   15
Total:  .word   0               ; la suma del primer bucle
Fmt:    .asciiz "En memoria: %d, en un registro: %d\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, Total, Total2)
Valor1: .space  4
Valor2: .space  4

        .text
        .global main
main:   addi    r1,r0,Vector
        lw      r2,N(r0)

EnMemoria:
        lw      r4,0(r1)
        lw      r5,Total(r0)    ; espera al sw de la vuelta anterior
        add     r5,r5,r4
        sw      Total(r0),r5    ; se escribe al confirmarse
        addi    r1,r1,4
        subi    r2,r2,1
        bnez    r2,EnMemoria

        addi    r1,r0,Vector
        lw      r2,N(r0)
        add     r5,r0,r0
EnRegistro:
        lw      r4,0(r1)
        add     r5,r5,r4        ; la suma, en un registro
        addi    r1,r1,4
        subi    r2,r2,1
        bnez    r2,EnRegistro

Imprime: lw     r6,Total(r0)
        sw      Valor1(r0),r6
        sw      Valor2(r0),r5
        addi    r14,r0,Par
        trap    5
        trap    0
