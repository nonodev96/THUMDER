import { Pipe, type PipeTransform } from "@angular/core";
import type { TypeTransformDecimalToBase } from "@app/Types";
import {
  bitsToFloat32,
  bitsToFloat64,
  bitsToUnsigned,
  changeBase,
  float32Bytes,
  float64Bytes,
  formatAscii,
  formatBytes,
  formatHalfWords,
  formatHex,
  formatWord,
} from "@core/numbers";

// The pipes of the registers, the memory and their windows: each one is a conversion of core/numbers.ts

const ZERO_32 = "0".repeat(32);

@Pipe({ name: "binary32_to_ascii" })
export class Binary32ToASCIIPipe implements PipeTransform {
  transform(bits: string = ZERO_32): string {
    return formatAscii(bits);
  }
}

@Pipe({ name: "binary32_to_bytes" })
export class Binary32ToBytesPipe implements PipeTransform {
  transform(bits: string = ZERO_32): string {
    return formatBytes(bits);
  }
}

@Pipe({ name: "binary32_to_halfword" })
export class Binary32ToHalfWordPipe implements PipeTransform {
  transform(bits: string = ZERO_32): string {
    return formatHalfWords(bits);
  }
}

@Pipe({ name: "binary32_to_word" })
export class Binary32ToWordPipe implements PipeTransform {
  transform(bits: string = ZERO_32): string {
    return formatWord(bits);
  }
}

@Pipe({ name: "binary32_to_decimal_IEEE754" })
export class Binary32ToDecimal_IEEE754Pipe implements PipeTransform {
  transform(bits: string): number {
    return bitsToFloat32(bits);
  }
}

@Pipe({ name: "binary64_to_decimal_IEEE754" })
export class Binary64ToDecimal_IEEE754Pipe implements PipeTransform {
  transform(bits: string): number {
    return bitsToFloat64(bits);
  }
}

@Pipe({ name: "binary_32_64_to_hexadecimal" })
export class BinaryToHexadecimal_FormatPipe implements PipeTransform {
  transform(bits: string = ZERO_32): string {
    return formatHex(bits);
  }
}

@Pipe({ name: "binary_to_number" })
export class BinaryByteToNumberPipe implements PipeTransform {
  transform(bits: string): number {
    return bitsToUnsigned(bits);
  }
}

@Pipe({ name: "uint_IEEE754_32" })
export class Uint_IEEE754_32_Pipe implements PipeTransform {
  transform(value: number): string {
    return float32Bytes(value);
  }
}

@Pipe({ name: "uint_IEEE754_64" })
export class Uint_IEEE754_64_Pipe implements PipeTransform {
  transform(value: number): string {
    return float64Bytes(value);
  }
}

@Pipe({ name: "from_base_to_base" })
export class FromBaseToBasePipe implements PipeTransform {
  transform(value: number | string, args = { from_base: 10, to_base: 10, maxLength: 0, fillString: "" }): string {
    return changeBase(value, args.from_base, args.to_base, args.maxLength, args.fillString);
  }
}

@Pipe({ name: "number_to_base" })
export class NumberToBasePipe implements PipeTransform {
  transform(value: number, args: TypeTransformDecimalToBase = { base: 10, maxLength: 0, fillString: "" }): string {
    return value.toString(args.base).padStart(args.maxLength ?? 0, args.fillString ?? "");
  }
}

@Pipe({ name: "number_to_hexadecimal" })
export class NumberToHexadecimalPipe implements PipeTransform {
  transform(value: number): string {
    return value.toString(16);
  }
}

@Pipe({ name: "pad_start" })
export class PadStartPipe implements PipeTransform {
  transform(value: string, args: { maxLength: number; fillString: string } = { maxLength: 32, fillString: "0" }): string {
    return value.padStart(args.maxLength, args.fillString);
  }
}
