// The example programs of THUMDER (src/assets/examples-dlx) and a console, for the tests
import type { ProgramIO } from "@core/engine/traps";
import base from "../../../assets/examples-dlx/base.s";
import e01HolaMundo from "../../../assets/examples-dlx/ejemplos/01-hola-mundo.s";
import e02SumaVector from "../../../assets/examples-dlx/ejemplos/02-suma-vector.s";
import e03Maximo from "../../../assets/examples-dlx/ejemplos/03-maximo.s";
import e04Fibonacci from "../../../assets/examples-dlx/ejemplos/04-fibonacci.s";
import e05Factorial from "../../../assets/examples-dlx/ejemplos/05-factorial.s";
import e06McdEuclides from "../../../assets/examples-dlx/ejemplos/06-mcd-euclides.s";
import e07MultiplicaDesplazando from "../../../assets/examples-dlx/ejemplos/07-multiplica-desplazando.s";
import e08Binario from "../../../assets/examples-dlx/ejemplos/08-binario.s";
import e09Cadenas from "../../../assets/examples-dlx/ejemplos/09-cadenas.s";
import e10Burbuja from "../../../assets/examples-dlx/ejemplos/10-burbuja.s";
import e11BusquedaBinaria from "../../../assets/examples-dlx/ejemplos/11-busqueda-binaria.s";
import e12Criba from "../../../assets/examples-dlx/ejemplos/12-criba.s";
import e13Matrices from "../../../assets/examples-dlx/ejemplos/13-matrices.s";
import e14FactorialRecursivo from "../../../assets/examples-dlx/ejemplos/14-factorial-recursivo.s";
import e15Hanoi from "../../../assets/examples-dlx/ejemplos/15-hanoi.s";
import e16ProductoEscalar from "../../../assets/examples-dlx/ejemplos/16-producto-escalar.s";
import e17Daxpy from "../../../assets/examples-dlx/ejemplos/17-daxpy.s";
import e18DaxpyDesenrollado from "../../../assets/examples-dlx/ejemplos/18-daxpy-desenrollado.s";
import e19Riesgos from "../../../assets/examples-dlx/ejemplos/19-riesgos.s";
import e20MediaEntrada from "../../../assets/examples-dlx/ejemplos/20-media-entrada.s";
import fact from "../../../assets/examples-dlx/fact.s";
import gcm from "../../../assets/examples-dlx/gcm.s";
import input from "../../../assets/examples-dlx/input.s";
import prim from "../../../assets/examples-dlx/prim.s";
import windlx from "../../../assets/examples-dlx/win-dlx.s";

export const EXAMPLES: Record<string, string> = {
  "base.s": base,
  "fact.s": fact,
  "gcm.s": gcm,
  "input.s": input,
  "prim.s": prim,
  "win-dlx.s": windlx,
};

/** The classic examples (src/assets/examples-dlx/ejemplos), by file name */
export const CLASSICS: Record<string, string> = {
  "01-hola-mundo.s": e01HolaMundo,
  "02-suma-vector.s": e02SumaVector,
  "03-maximo.s": e03Maximo,
  "04-fibonacci.s": e04Fibonacci,
  "05-factorial.s": e05Factorial,
  "06-mcd-euclides.s": e06McdEuclides,
  "07-multiplica-desplazando.s": e07MultiplicaDesplazando,
  "08-binario.s": e08Binario,
  "09-cadenas.s": e09Cadenas,
  "10-burbuja.s": e10Burbuja,
  "11-busqueda-binaria.s": e11BusquedaBinaria,
  "12-criba.s": e12Criba,
  "13-matrices.s": e13Matrices,
  "14-factorial-recursivo.s": e14FactorialRecursivo,
  "15-hanoi.s": e15Hanoi,
  "16-producto-escalar.s": e16ProductoEscalar,
  "17-daxpy.s": e17Daxpy,
  "18-daxpy-desenrollado.s": e18DaxpyDesenrollado,
  "19-riesgos.s": e19Riesgos,
  "20-media-entrada.s": e20MediaEntrada,
};

/** A console with the lines to type and what the program writes */
export function testIO(lines: string[] = []): ProgramIO & { output: string } {
  const pending = [...lines];
  const io = {
    output: "",
    write(text: string) {
      io.output += text;
    },
    readLine() {
      return pending.length > 0 ? `${pending.shift()}\n` : null;
    },
  };
  return io;
}
