;=============================================================================
; THUMDER - Ejemplo 02: Suma de los elementos de un vector
;-----------------------------------------------------------------------------
; Conceptos:
;   - Recorrer un vector con un puntero: cada palabra ocupa 4 bytes.
;   - Bucles con un contador que baja hasta cero (subi + bnez).
;   - Riesgos de datos: una instrucción que usa el valor que acaba de
;     cargar (lw) espera un ciclo aunque haya adelantamiento.
;
; Qué mirar en THUMDER:
;   - En el diagrama de ciclos, "add r3,r3,r4" espera (R-Stall) al lw que
;     va justo delante: es el riesgo de uso de una carga.
;   - "bnez r2,Bucle" también espera: el salto se resuelve en ID y necesita
;     el resultado del "subi" que va delante.
;   - Estadísticas: detenciones RAW por cargas y por saltos.
;
; Prueba:
;   Reordena el cuerpo del bucle así: lw, subi, addi, add, bnez. Hace lo
;   mismo, pero ninguna instrucción usa el resultado de la anterior: las
;   detenciones desaparecen y el programa tarda 16 ciclos menos. Es la
;   planificación de instrucciones que hacen los compiladores.
;
; Resultado: La suma es 50
;=============================================================================

        .data
Vector: .word   3, 7, -2, 15, 8, 4, 10, 5
N:      .word   8               ; número de elementos
Fmt:    .asciiz "La suma es %d\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, Valor)
Valor:  .space  4

        .text
        .global main
main:   addi    r1,r0,Vector    ; r1: dirección del elemento actual
        lw      r2,N(r0)        ; r2: elementos que quedan
        add     r3,r0,r0        ; r3: suma = 0

Bucle:  lw      r4,0(r1)        ; r4 = Vector[i]
        add     r3,r3,r4        ; suma = suma + Vector[i]  (R-Stall)
        addi    r1,r1,4         ; siguiente elemento
        subi    r2,r2,1         ; uno menos
        bnez    r2,Bucle        ; ¿quedan?  (R-Stall: espera al subi)

        sw      Valor(r0),r3    ; el valor para printf
        addi    r14,r0,Par
        trap    5               ; printf("La suma es %d\n", suma)
        trap    0
