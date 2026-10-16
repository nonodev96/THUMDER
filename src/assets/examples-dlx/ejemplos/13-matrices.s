;=============================================================================
; THUMDER - Ejemplo 13: Producto de matrices
;-----------------------------------------------------------------------------
; Conceptos:
;   - Matrices guardadas por filas: el elemento (i, j) de una matriz de
;     3 x 3 está en la posición i * 3 + j, es decir, en el byte
;     (i * 3 + j) * 4.
;   - Tres bucles anidados: C[i][j] = suma de A[i][k] * B[k][j].
;   - Recorrer una fila (+4 bytes) y una columna (+12 bytes, una fila
;     entera) con punteros, sin calcular cada dirección desde cero.
;   - Elegir bien los registros: los punteros no pueden ir en r1 ni en
;     r14, porque el printf de cada elemento los cambia.
;
; Qué mirar en THUMDER:
;   - La memoria en la etiqueta C: aparecen los 9 resultados.
;   - Estadísticas: 27 multiplicaciones en fmulEX. Cada suma espera a su
;     multiplicación (R-Stall).
;
; Resultado:
;     30  24  18
;     84  69  54
;    138 114  90
;=============================================================================

        .data
A:      .word   1, 2, 3
        .word   4, 5, 6
        .word   7, 8, 9
B:      .word   9, 8, 7
        .word   6, 5, 4
        .word   3, 2, 1
C:      .space  36              ; 9 palabras para el resultado
FmtNum: .asciiz "%4d"
Salto:  .asciiz "\n"
        .align  2
ParNum: .word   FmtNum
Valor:  .space  4
ParSalto: .word Salto

        .text
        .global main
main:   addi    r15,r0,A        ; r15 = &A[i][0]: principio de la fila i
        addi    r3,r0,C         ; r3 = &C[i][j]
        addi    r10,r0,3        ; r10 = filas que quedan

Fila:   addi    r2,r0,B         ; r2 = &B[0][j]: principio de la columna j
        addi    r11,r0,3        ; r11 = columnas que quedan

Columna:
        add     r4,r15,r0       ; r4 recorre la fila i de A
        add     r5,r2,r0        ; r5 recorre la columna j de B
        add     r6,r0,r0        ; r6 = suma = 0
        addi    r12,r0,3        ; r12 = productos que quedan
Producto:
        lw      r7,0(r4)        ; A[i][k]
        lw      r8,0(r5)        ; B[k][j]
        mult    r9,r7,r8
        add     r6,r6,r9        ; suma += A[i][k] * B[k][j]
        addi    r4,r4,4         ; siguiente de la fila
        addi    r5,r5,12        ; siguiente de la columna (una fila más)
        subi    r12,r12,1
        bnez    r12,Producto

        sw      0(r3),r6        ; C[i][j] = suma
        sw      Valor(r0),r6
        addi    r14,r0,ParNum
        trap    5               ; printf("%4d", C[i][j])
        addi    r3,r3,4
        addi    r2,r2,4         ; siguiente columna de B
        subi    r11,r11,1
        bnez    r11,Columna

        addi    r14,r0,ParSalto
        trap    5               ; printf("\n")
        addi    r15,r15,12      ; siguiente fila de A
        subi    r10,r10,1
        bnez    r10,Fila
        trap    0
