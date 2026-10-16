;=============================================================================
; THUMDER - Ejemplo 01: Hola, mundo
;-----------------------------------------------------------------------------
; Conceptos:
;   - Los segmentos de datos (.data) y de código (.text).
;   - Las cadenas terminadas en cero (.asciiz).
;   - Los traps, la forma de hablar con el exterior: el trap 5 es printf()
;     y el trap 0 termina el programa.
;
; Cómo funciona:
;   Los traps leen sus parámetros de la memoria. R14 guarda la dirección
;   del primero; para printf, el primer parámetro es la dirección de la
;   cadena de formato. El resultado del trap se deja en R1.
;
; Qué mirar en THUMDER:
;   - La consola del programa (se abre sola) muestra el saludo.
;   - En el diagrama de ciclos, cada trap espera en IF (T-Stall) hasta que
;     el pipeline queda vacío: así nada se ejecuta a medias mientras el
;     programa habla con el exterior.
;
; Resultado: Hola, mundo desde DLX!
;=============================================================================

        .data
Saludo: .asciiz "Hola, mundo desde DLX!\n"
        .align  2               ; los parámetros son palabras: múltiplos de 4
Par:    .word   Saludo          ; parámetro de printf: dirección del formato

        .text
        .global main
main:   addi    r14,r0,Par      ; R14 = dirección de los parámetros
        trap    5               ; printf("Hola, mundo desde DLX!\n")
        trap    0               ; fin del programa
