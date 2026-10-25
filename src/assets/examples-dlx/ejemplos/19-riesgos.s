;=============================================================================
; THUMDER - Ejemplo 19: Catálogo de riesgos del pipeline
;-----------------------------------------------------------------------------
; Conceptos:
;   - Los riesgos (hazards) del pipeline: situaciones en las que una
;     instrucción no puede avanzar al ritmo de una etapa por ciclo.
;     Pueden ser de datos (RAW, WAW), estructurales y de control.
;   - El adelantamiento (forwarding), que resuelve casi todos los RAW.
;
; Este programa no calcula nada útil: cada bloque provoca un tipo de
; riesgo para verlo en el diagrama de ciclos.
;
; Qué mirar en THUMDER:
;   Ejecútalo paso a paso (F8) y busca en el diagrama de ciclos la
;   instrucción con la etiqueta de cada bloque:
;
;   Etiqueta      Riesgo                            Qué se ve
;   -----------   -------------------------------   ----------------------
;   Adelanta      RAW resuelto con adelantamiento   nada: no hay detención
;   UsaCarga      RAW tras una carga (lw)           R-Stall de 1 ciclo
;   Decide        RAW en un salto (se resuelve      R-Stall
;                 en ID)
;   NoSeEjecuta   de control: salto tomado          Aborted (antes espera
;                                                   en IF con beqz)
;   EnteraMEM     dos instrucciones quieren MEM     Stall (pasa antes la
;                 a la vez                          de coma flotante)
;   Divide2       estructural: fdivEX ocupada       S-Stall
;   Escribe2      WAW: escribir F8 antes que una    W-Stall
;                 instrucción más lenta
;   Fin           el trap espera a que se vacíe     T-Stall
;                 el pipeline
;
; Prueba:
;   Desactiva el adelantamiento (forwarding) en Configuración y vuelve a
;   ejecutarlo: "Adelanta" pasa a esperar 2 ciclos, y "UsaCarga" también.
;=============================================================================

        .data
Dato:   .word   7
        .align  3
Uno:    .double 1.0
Dos:    .double 2.0

        .text
        .global main
main:   ld      f0,Uno(r0)      ; datos de coma flotante para los
        ld      f2,Dos(r0)      ; bloques 4 a 6, cargados con tiempo
        nop
        nop

        ; 1. RAW resuelto con adelantamiento: el resultado de addi pasa
        ;    directamente de la salida de la ALU a su entrada
        addi    r1,r0,5
Adelanta:
        add     r2,r1,r1        ; r2 = 10, sin esperar

        ; 2. RAW tras una carga: el dato no existe hasta el final de MEM
        lw      r3,Dato(r0)
UsaCarga:
        add     r4,r3,r3        ; r4 = 14: espera 1 ciclo (R-Stall)

        ; 3. RAW en un salto: beqz necesita r5 en ID, un ciclo antes que
        ;    una instrucción normal
        subi    r5,r4,14        ; r5 = 0
Decide: beqz    r5,Tomado       ; espera a subi (R-Stall) y salta
NoSeEjecuta:
        addi    r6,r0,1         ; ya buscada cuando se toma el salto: Aborted
Tomado:

        ; 4. Dos instrucciones terminan su ejecución a la vez: la de coma
        ;    flotante pasa antes a MEM y la entera espera
        addd    f10,f0,f2       ; faddEX, 2 ciclos
EnteraMEM:
        add     r7,r1,r1        ; acabaría en intEX a la vez (Stall)

        ; 5. Riesgo estructural: solo hay una unidad de división
        divd    f4,f0,f2        ; ocupa fdivEX 19 ciclos
Divide2:
        divd    f6,f2,f0        ; espera a que se libere (S-Stall)

        ; 6. WAW: addd acabaría antes que multd y, sin esperar, F8 se
        ;    quedaría con el valor de multd (2.0) en vez del suyo (3.0)
        multd   f8,f0,f2        ; fmulEX, 5 ciclos: F8 = 2.0
Escribe2:
        addd    f8,f0,f2        ; espera a multd (W-Stall): F8 = 3.0

        ; 7. Un trap espera en IF hasta que el pipeline está vacío
Fin:    trap    0
