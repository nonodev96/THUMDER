;=============================================================================
; THUMDER - Ejemplo 09: Cadenas de caracteres
;-----------------------------------------------------------------------------
; Conceptos:
;   - Cargar y guardar bytes: lbu (carga un byte sin signo) y sb.
;   - Cadenas al estilo de C: una sucesión de bytes que acaba en 0.
;   - Tres subrutinas que reciben direcciones en r4 y r5, como funciones
;     de C: Longitud (strlen), Invierte e Iguales (strcmp).
;   - DLX solo compara un registro con cero (beqz, bnez): para comparar
;     dos registros se usa antes una instrucción "set" (seq, sne...).
;   - Una tabla de punteros: Palabras guarda direcciones, no caracteres.
;
; Qué mirar en THUMDER:
;   - La memoria en la etiqueta Reves: la palabra al revés, byte a byte.
;   - El diagrama de ciclos: cada lbu seguido de una instrucción que usa
;     el byte provoca un R-Stall.
;
; Prueba:
;   Añade tus palabras a la tabla Palabras (la tabla termina en 0).
;   Recuerda que las cadenas van sin tildes: cada carácter es un byte.
;
; Resultado:
;   reconocer: 9 letras, al reves reconocer, palindromo: si
;   arquitectura: 12 letras, al reves arutcetiuqra, palindromo: no
;   anilina: 7 letras, al reves anilina, palindromo: si
;=============================================================================

        .data
P1:     .asciiz "reconocer"
P2:     .asciiz "arquitectura"
P3:     .asciiz "anilina"
Si:     .asciiz "si"
No:     .asciiz "no"
Fmt:    .asciiz "%s: %d letras, al reves %s, palindromo: %s\n"
Reves:  .space  64              ; la palabra al revés
        .align  2
Palabras: .word P1, P2, P3, 0   ; tabla de punteros terminada en 0
Par:    .word   Fmt             ; printf(Fmt, palabra, longitud, Reves, si/no)
PPal:   .space  4
PLon:   .space  4
PRev:   .word   Reves
PSiNo:  .space  4

        .text
        .global main
main:   addi    r10,r0,Palabras ; r10: puntero a la tabla

Bucle:  lw      r11,0(r10)      ; r11 = dirección de la palabra
        beqz    r11,Fin         ; un 0: fin de la tabla
        sw      PPal(r0),r11

        add     r4,r11,r0
        jal     Longitud        ; r2 = longitud
        sw      PLon(r0),r2

        add     r4,r11,r0
        addi    r5,r0,Reves
        jal     Invierte        ; Reves = la palabra al revés

        add     r4,r11,r0
        addi    r5,r0,Reves
        jal     Iguales         ; r2 = 1 si son iguales
        addi    r6,r0,Si
        bnez    r2,Imprime
        addi    r6,r0,No
Imprime:
        sw      PSiNo(r0),r6
        addi    r14,r0,Par
        trap    5
        addi    r10,r10,4
        j       Bucle

Fin:    trap    0

;-----------------------------------------------------------------------------
; Longitud: r2 = número de caracteres de la cadena de r4 (sin el 0)
;-----------------------------------------------------------------------------
Longitud:
        add     r2,r0,r0
LonBucle:
        add     r7,r4,r2        ; dirección del carácter r2
        lbu     r8,0(r7)
        beqz    r8,LonFin       ; el 0 final
        addi    r2,r2,1
        j       LonBucle
LonFin: jr      r31

;-----------------------------------------------------------------------------
; Invierte: copia en r5 la cadena de r4 al revés. Llama a Longitud, así que
; guarda antes r31 (si no, la dirección de vuelta se perdería).
;-----------------------------------------------------------------------------
Invierte:
        add     r9,r31,r0       ; guarda la dirección de vuelta
        jal     Longitud        ; r2 = longitud (no cambia r4 ni r5)
        add     r7,r4,r2        ; r7 = detrás del último carácter
InvBucle:
        seq     r6,r7,r4        ; ¿se ha llegado al principio?
        bnez    r6,InvFin
        subi    r7,r7,1
        lbu     r8,0(r7)        ; del final hacia el principio...
        sb      0(r5),r8        ; ...y del principio hacia el final
        addi    r5,r5,1
        j       InvBucle
InvFin: sb      0(r5),r0        ; el 0 final
        jr      r9

;-----------------------------------------------------------------------------
; Iguales: r2 = 1 si las cadenas de r4 y r5 son iguales y 0 si no
; (una palabra es un palíndromo si es igual a ella misma al revés)
;-----------------------------------------------------------------------------
Iguales:
        lbu     r7,0(r4)
        lbu     r8,0(r5)
        sne     r2,r7,r8
        bnez    r2,Distintas    ; un carácter distinto
        beqz    r7,SonIguales   ; las dos se acaban a la vez
        addi    r4,r4,1
        addi    r5,r5,1
        j       Iguales
Distintas:
        add     r2,r0,r0
        jr      r31
SonIguales:
        addi    r2,r0,1
        jr      r31
