;=============================================================================
; THUMDER - Ejemplo 20: Media de los números que escribe el usuario
;-----------------------------------------------------------------------------
; Conceptos:
;   - Un programa de dos módulos: este y input.s (de los ejemplos de
;     WinDLX), que define la subrutina InputUnsigned con .global. THUMDER
;     añade input.s solo, porque está en la misma carpeta y declara el
;     símbolo que falta (la carpeta de ejemplos ya trae una copia).
;   - Leer de la consola: InputUnsigned escribe el texto de r1, lee una
;     línea con el trap 3 y devuelve en r1 el número escrito.
;   - Pasar de entero a doble: movi2fp copia los bits de un registro
;     entero a uno de coma flotante y cvti2d los convierte en un doble.
;   - La división en coma flotante (divd, fdivEX).
;
; Uso:
;   Escribe números en la consola del programa, uno por línea, y un 0
;   para terminar.
;
; Qué mirar en THUMDER:
;   - Mientras el programa espera una línea, la simulación se detiene y la
;     consola muestra un campo para escribirla.
;   - La vista de código: el de input.s se ensambla junto con el de este
;     fichero, en la misma memoria.
;   - Los registros F0 (la suma como entero) y F2 (la misma suma ya
;     convertida en doble): los mismos números, bits muy distintos.
;
; Ejemplo (escribiendo 4, 8, 15, 16, 23, 42 y 0):
;   Numero (0 para terminar): ...
;   6 numeros, suma 108, media 18
;=============================================================================

        .data
Pregunta: .asciiz "Numero (0 para terminar): "
FmtFin: .asciiz "%d numeros, suma %d, media %g\n"
SinDatos: .asciiz "No hay numeros\n"
        .align  2
ParFin: .word   FmtFin          ; printf(FmtFin, cuántos, suma, media)
PCuantos: .space 4
PSuma:  .space  4
PMedia: .space  8
ParSin: .word   SinDatos

        .text
        .global main
main:   add     r6,r0,r0        ; r6 = suma
        add     r7,r0,r0        ; r7 = cuántos
                                ; (InputUnsigned conserva r2 a r5 y
                                ; cambia r1, r13 y r14)
Lee:    addi    r1,r0,Pregunta
        jal     InputUnsigned   ; r1 = número leído
        beqz    r1,Calcula      ; un 0: se acabó
        add     r6,r6,r1
        addi    r7,r7,1
        j       Lee

Calcula:
        beqz    r7,Vacio        ; sin números no hay media
        movi2fp f0,r6           ; los bits de la suma, a F0...
        cvti2d  f2,f0           ; ...convertidos en doble: F2-F3
        movi2fp f4,r7
        cvti2d  f6,f4           ; F6-F7 = cuántos, en doble
        divd    f8,f2,f6        ; F8-F9 = media
        sw      PCuantos(r0),r7
        sw      PSuma(r0),r6
        sd      PMedia(r0),f8
        addi    r14,r0,ParFin
        trap    5
        trap    0

Vacio:  addi    r14,r0,ParSin
        trap    5
        trap    0
