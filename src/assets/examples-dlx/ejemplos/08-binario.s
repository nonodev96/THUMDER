;=============================================================================
; THUMDER - Ejemplo 08: Números en binario y conteo de bits
;-----------------------------------------------------------------------------
; Conceptos:
;   - Construir una cadena byte a byte con sb (store byte).
;   - Recorrer los 32 bits de una palabra con desplazamientos.
;   - El complemento a 2: -2026 tiene casi todos los bits a 1.
;   - Los formatos de printf: %d (decimal), %s (cadena) y %08x
;     (hexadecimal con 8 cifras, rellenando con ceros).
;   - Una subrutina sencilla: jal guarda la dirección de vuelta en r31 y
;     jr r31 vuelve.
;
; Qué mirar en THUMDER:
;   - La memoria en la etiqueta Cadena: se llena de caracteres '0' y '1'
;     (0x30 y 0x31 en ASCII).
;   - El registro r31 después de cada jal.
;
; Resultado:
;   2026 = 00000000000000000000011111101010, 8 unos, 0x000007ea
;   -2026 = 11111111111111111111100000010110, 24 unos, 0xfffff816
;   255 = 00000000000000000000000011111111, 8 unos, 0x000000ff
;   -1 = 11111111111111111111111111111111, 32 unos, 0xffffffff
;=============================================================================

        .data
Numeros: .word  2026, -2026, 255, -1
N:      .word   4
Cadena: .space  33              ; 32 cifras y el cero final
Fmt:    .asciiz "%d = %s, %d unos, 0x%08x\n"
        .align  2
Par:    .word   Fmt             ; printf(Fmt, n, Cadena, unos, n)
PN:     .space  4
PS:     .word   Cadena
PU:     .space  4
PH:     .space  4

        .text
        .global main
main:   addi    r10,r0,Numeros  ; r10: dirección del número actual
        lw      r11,N(r0)       ; r11: números que quedan

Bucle:  lw      r4,0(r10)       ; r4 = número
        jal     Binario         ; r2 = número de unos; Cadena = los bits
        sw      PN(r0),r4
        sw      PU(r0),r2
        sw      PH(r0),r4
        addi    r14,r0,Par
        trap    5
        addi    r10,r10,4
        subi    r11,r11,1
        bnez    r11,Bucle
        trap    0

;-----------------------------------------------------------------------------
; Binario: escribe en Cadena los 32 bits de r4, del más alto al más bajo,
; y devuelve en r2 cuántos están a 1. Usa r5 a r8.
;-----------------------------------------------------------------------------
Binario:
        add     r2,r0,r0        ; r2 = unos = 0
        add     r5,r4,r0        ; r5 = copia del número
        addi    r6,r0,Cadena    ; r6 = dirección del siguiente carácter
        addi    r7,r0,32        ; r7 = bits que quedan
BitBucle:
        srli    r8,r5,31        ; r8 = bit más alto (0 o 1)
        add     r2,r2,r8        ; cuenta los unos
        addi    r8,r8,'0'       ; 0 -> '0', 1 -> '1'
        sb      0(r6),r8
        slli    r5,r5,1         ; el siguiente bit pasa a ser el más alto
        addi    r6,r6,1
        subi    r7,r7,1
        bnez    r7,BitBucle
        sb      0(r6),r0        ; el cero que termina la cadena
        jr      r31             ; vuelve a quien llamó
