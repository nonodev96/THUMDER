;=============================================================================
; THUMDER - Ejemplo 11: Búsqueda binaria
;-----------------------------------------------------------------------------
; Conceptos:
;   - Buscar en un vector ordenado partiéndolo por la mitad: en cada paso
;     se descarta la mitad en la que no puede estar. Con 15 elementos
;     bastan 4 pasos (2^4 = 16); una búsqueda secuencial necesitaría 15.
;   - Dividir entre 2 con un desplazamiento (srai) y multiplicar por 4
;     (el tamaño de una palabra) con slli.
;   - Una subrutina que devuelve dos valores: r2 (la posición, o -1 si no
;     está) y r3 (los pasos que ha dado).
;
; El algoritmo, en C:
;   izq = 0; der = n - 1;
;   while (izq <= der) {
;     mitad = (izq + der) / 2;
;     if (v[mitad] == clave) return mitad;
;     if (v[mitad] < clave) izq = mitad + 1; else der = mitad - 1;
;   }
;   return -1;
;
; Qué mirar en THUMDER:
;   - Los registros r5 (izq), r6 (der) y r7 (mitad) en cada vuelta.
;
; Resultado:
;   19 esta en la posicion 7, pasos: 1
;   23 esta en la posicion 8, pasos: 4
;   2 esta en la posicion 0, pasos: 4
;   47 esta en la posicion 14, pasos: 4
;   20 no esta, pasos: 4
;=============================================================================

        .data
Primos: .word   2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47
N:      .word   15
Claves: .word   19, 23, 2, 47, 20
NClaves: .word  5
FmtSi:  .asciiz "%d esta en la posicion %d, pasos: %d\n"
FmtNo:  .asciiz "%d no esta, pasos: %d\n"
        .align  2
ParSi:  .word   FmtSi           ; printf(FmtSi, clave, posición, pasos)
SiC:    .space  4
SiP:    .space  4
SiN:    .space  4
ParNo:  .word   FmtNo           ; printf(FmtNo, clave, pasos)
NoC:    .space  4
NoN:    .space  4

        .text
        .global main
main:   addi    r10,r0,Claves   ; r10: puntero a la clave actual
        lw      r11,NClaves(r0) ; r11: claves que quedan

Bucle:  lw      r4,0(r10)       ; r4 = clave
        jal     Busca
        slti    r8,r2,0         ; ¿posición < 0?
        bnez    r8,NoEsta
        sw      SiC(r0),r4
        sw      SiP(r0),r2
        sw      SiN(r0),r3
        addi    r14,r0,ParSi
        j       Imprime
NoEsta: sw      NoC(r0),r4
        sw      NoN(r0),r3
        addi    r14,r0,ParNo
Imprime:
        trap    5
        addi    r10,r10,4
        subi    r11,r11,1
        bnez    r11,Bucle
        trap    0

;-----------------------------------------------------------------------------
; Busca: busca r4 en Primos. Devuelve en r2 su posición (o -1) y en r3 los
; pasos. Usa r5 a r9.
;-----------------------------------------------------------------------------
Busca:  add     r3,r0,r0        ; pasos = 0
        add     r5,r0,r0        ; izq = 0
        lw      r6,N(r0)
        subi    r6,r6,1         ; der = n - 1
BBucle: sgt     r8,r5,r6        ; ¿izq > der?
        bnez    r8,NoHay
        addi    r3,r3,1         ; un paso más
        add     r7,r5,r6
        srai    r7,r7,1         ; mitad = (izq + der) / 2
        slli    r8,r7,2         ; desplazamiento = mitad * 4
        lw      r9,Primos(r8)   ; r9 = v[mitad]
        seq     r8,r9,r4
        bnez    r8,Hay          ; encontrado
        slt     r8,r9,r4
        beqz    r8,Izquierda
        addi    r5,r7,1         ; v[mitad] < clave: a la derecha
        j       BBucle
Izquierda:
        subi    r6,r7,1         ; v[mitad] > clave: a la izquierda
        j       BBucle
Hay:    add     r2,r7,r0
        jr      r31
NoHay:  addi    r2,r0,-1
        jr      r31
