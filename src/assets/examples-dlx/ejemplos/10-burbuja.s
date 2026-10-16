;=============================================================================
; THUMDER - Ejemplo 10: Ordenación por el método de la burbuja
;-----------------------------------------------------------------------------
; Conceptos:
;   - Dos bucles anidados: cada pasada lleva el mayor que queda a su
;     sitio, al final del vector, como una burbuja que sube.
;   - Intercambiar dos posiciones de memoria (lw, lw, sw, sw).
;   - Una bandera: si una pasada no intercambia nada, el vector ya está
;     ordenado y se termina antes.
;   - Una subrutina, Imprime, a la que se llama dos veces.
;
; El algoritmo, en C:
;   do {
;     cambios = 0;
;     for (i = 0; i < n - 1; i++)
;       if (v[i] > v[i+1]) { cambia v[i] y v[i+1]; cambios = 1; }
;     n = n - 1;
;   } while (cambios);
;
; Qué mirar en THUMDER:
;   - La memoria en la etiqueta Vector: los valores cambian de sitio.
;   - Estadísticas: cuántos saltos se toman. Prueba con un vector que ya
;     esté ordenado: solo hace una pasada.
;
; Resultado:
;   Antes:   29 3 -7 15 0 42 8 -1 23 11
;   Despues: -7 -1 0 3 8 11 15 23 29 42
;=============================================================================

        .data
Vector: .word   29, 3, -7, 15, 0, 42, 8, -1, 23, 11
N:      .word   10
TxtAntes: .asciiz "Antes:  "
TxtDespues: .asciiz "Despues:"
FmtNum: .asciiz " %d"
Salto:  .asciiz "\n"
        .align  2
ParTxt: .space  4               ; printf(texto)
ParNum: .word   FmtNum          ; printf(" %d", Valor)
Valor:  .space  4
ParSalto: .word Salto

        .text
        .global main
main:   addi    r4,r0,TxtAntes
        jal     Imprime

        lw      r2,N(r0)        ; r2 = n
Pasada: add     r3,r0,r0        ; r3 = cambios = 0
        addi    r5,r0,Vector    ; r5 = &v[i]
        subi    r6,r2,1         ; r6 = comparaciones de esta pasada
        beqz    r6,Ordenado     ; un solo elemento: nada que hacer

Compara:
        lw      r7,0(r5)        ; r7 = v[i]
        lw      r8,4(r5)        ; r8 = v[i+1]
        sgt     r9,r7,r8        ; ¿v[i] > v[i+1]?
        beqz    r9,Siguiente
        sw      0(r5),r8        ; intercambio
        sw      4(r5),r7
        addi    r3,r0,1         ; cambios = 1
Siguiente:
        addi    r5,r5,4
        subi    r6,r6,1
        bnez    r6,Compara

        subi    r2,r2,1         ; el último ya está en su sitio
        bnez    r3,Pasada       ; si hubo cambios, otra pasada

Ordenado:
        addi    r4,r0,TxtDespues
        jal     Imprime
        trap    0

;-----------------------------------------------------------------------------
; Imprime: escribe el texto de r4 y el vector. Usa r20 a r22.
;-----------------------------------------------------------------------------
Imprime:
        sw      ParTxt(r0),r4
        addi    r14,r0,ParTxt
        trap    5               ; printf(texto)
        addi    r20,r0,Vector
        lw      r21,N(r0)
ImpBucle:
        lw      r22,0(r20)
        sw      Valor(r0),r22
        addi    r14,r0,ParNum
        trap    5               ; printf(" %d", v[i])
        addi    r20,r20,4
        subi    r21,r21,1
        bnez    r21,ImpBucle
        addi    r14,r0,ParSalto
        trap    5               ; printf("\n")
        jr      r31
