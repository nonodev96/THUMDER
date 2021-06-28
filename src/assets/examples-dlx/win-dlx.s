.data

MATORIG:    .word 10, 11, 15, 160, 15, 9, 9, 8
            .word 10, 14, 150, 165, 150, 20, 14, 8
            .word 15, 20, 153, 185, 165, 44, 35, 15
            .word 25, 40, 175, 200, 195, 63, 45, 28
            .word 40, 53, 190, 205, 200, 85, 77, 33
            .word 53, 100, 203, 225, 210, 110, 80, 40
            .word 40, 140, 210, 230, 215, 133, 84, 43
            .word 63, 120, 208, 222, 207, 122, 55, 15

MATRESUL:	    .space 256
ADYACENTES: 	.space 16

.text

main:
	ADDI R28, R0, #4    ; CTE EN 4
	ADDI R29, R0, #1    ; CTE EN 1

	ADDI R17, R0, 0		; indice fila
	ADDI R18, R0, 0		; indice columna

	ADDI R26, R0, #32   ; CTE EN 32 (TAM FILA)
	ADD R2, R0, R0	    ; indice de la matriz.
	ADD R25, R0, R0

Estructura:
	AND R6, R0, R0      ; casilla del vector de ocupacion variable.
	OR  R5, R0, R0      ; contador de numeros introducidos.
	LW	R1, MATORIG(R2)
	; Comprobar arriba.
	SUB R3, R2, R26
	SGT R4, R0, R3
	BNEZ R4, saltoAbajo
	JAL GuardoElementoEnVector

saltoAbajo:
	; Comprobar izquierda.
	BEQZ R2, saltoArriba ; Si es 0, no tiene izquierda y nos saldriamos de la matriz.
	SUB R3, R2, R0
	ADD R4, R0, R26
	DIV R7, R3, R4
	MULT R7, R7, R4
	SUB R4, R3, R7
	BEQZ R4, saltoArriba
	SUB R3, R2, R28
	JAL GuardoElementoEnVector

saltoArriba:
	; Comprobar abajo.
	ADD R3, R2, R26
	SLTI R4, R3, #256
	BEQZ R4, saltoIzquierda
	JAL GuardoElementoEnVector

saltoIzquierda:
	; Comprobar derecha.
	SEQI R3, R2, #252   ; Esta al final, no debe comprobar.
	BNEZ R3, saltoDerecha
	ADD R3, R2, R28     ; dividendo
	ADD R4, R0, R26     ; divisor
	DIV R7, R3, R4      ; cociente
	MULT R7, R7, R4
	SUB R4, R3, R7
	BEQZ R4, saltoDerecha
	JAL GuardoElementoEnVector

saltoDerecha:
	; Calcular el minimo con un mejor hasta ahora.
	ADD R6, R0, R0
	LW R12, ADYACENTES(R6)
	OR R10, R0, R29
	J condicionMinimo
cuerpoMinimo:
	ADD R6, R6, R28
	LW R14, ADYACENTES(R6)
	SLT R13, R14, R12
	BEQZ R13, seguirMinimo
	ADD R12, R14, R0
seguirMinimo:
	ADD R10, R10, R29
condicionMinimo:
	SLT R11, R10, R5
	BNEZ R11, cuerpoMinimo

	SW MATRESUL(R2), R12


Fin:
	ADDI R2,R2,4
	SEQI R23,R18,7
	BNEZ R23,SALTO2
	ADDI R18,R18,1
	J SALTO1

SALTO2:
	SUBI R18,R0,0
	ADDI R17,R17,1

SALTO1:
	; Compruebo si he acabado
	SEQI R23, R18, 0
	SEQI R24, R17, 8
	AND  R25, R23, R24
	BEQZ R25, Estructura

	trap 0

GuardoElementoEnVector:
	LW R3, MATORIG(R3)
	SW ADYACENTES(R6), R3
	ADD R6, R6, R28
	ADD R5, R5, R29
	JR R31
