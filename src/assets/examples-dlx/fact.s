;*********** WINDLX EX.3: FACTORIAL		*************
;*********** (C) 1991 GüNTHER RAIDL		*************
;*********** MODIFIED: 1992 MAZIAR KHOSRAVIPOUR *************
;--------------------------------------------------------------------------
; PROGRAM BEGIN AT SYMBOL MAIN
; REQUIRES MODULE INPUT
; READ A NUMBER FROM STDIN AND CALCULATE THE FACTORIAL (TYPE: DOUBLE)
; THE RESULT IS WRITTEN TO STDOUT
;--------------------------------------------------------------------------

		        .DATA
PROMPT: 	    .ASCIIZ 	"AN INTEGER VALUE >1 : "

PRINTFFORMAT:	.ASCIIZ 	"FACTORIAL = %G\N\N"
		        .ALIGN		2
PRINTFPAR:	    .WORD		PRINTFFORMAT
PRINTFVALUE:	.SPACE		8


		.TEXT
		.GLOBAL	MAIN
MAIN:
		;*** READ VALUE FROM STDIN INTO R1
		ADDI		R1, R0, PROMPT
		JAL		    INPUTUNSIGNED
		
		;*** INIT VALUES
		MOVI2FP 	F10, R1		;R1 -> D0	D0..COUNT REGISTER
		CVTI2D		F0, F10
		ADDI		R2, R0, 1 	;1 -> D2	D2..RESULT
		MOVI2FP		F11, R2
		CVTI2D		F2, F11
		MOVD		F4, F2		;1-> D4 	D4..CONSTANT 1
		
		;*** BREAK LOOP IF D0 = 1
LOOP:		
        LED		    F0, F4		;D0 <= 1 ?
		BFPT		FINISH
		
		;*** MULTIPLICATION AND NEXT LOOP
		MULTD		F2, F2, F0
		SUBD		F0, F0, F4
		J		    LOOP

FINISH: 	;*** WRITE RESULT TO STDOUT
		SD		    PRINTFVALUE, F2
		ADDI		R14, R0, PRINTFPAR
		TRAP		5
				
		;*** END
		TRAP		0	
		
