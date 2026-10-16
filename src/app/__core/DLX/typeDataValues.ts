import type { TypeData } from "@app/Types";
import { float32ToBits, float64ToBits, int8ToBits, int16ToBits, int32ToBits } from "@core/numbers";

/** Bytes of memory that a value of each type takes */
export const BYTES_OF_TYPE_DATA: Record<TypeData, number> = { Byte: 1, HalfWord: 2, Word: 4, Float: 4, Double: 8, ASCII: 1 };

/** The bits of a value of a type (integers in two's complement, floating point in IEEE 754), or null if it does not fit */
export function valueToBinary(typeData: TypeData, value: number): string | null {
  switch (typeData) {
    case "Byte":
    case "HalfWord":
    case "Word": {
      const bits = BYTES_OF_TYPE_DATA[typeData] * 8;
      // Signed or unsigned: from -2^(n-1) to 2^n - 1
      if (!Number.isInteger(value) || value < -(2 ** (bits - 1)) || value > 2 ** bits - 1) return null;
      if (typeData === "Byte") return int8ToBits(value);
      if (typeData === "HalfWord") return int16ToBits(value);
      return int32ToBits(value);
    }
    case "Float":
      return float32ToBits(value);
    case "Double":
      return float64ToBits(value);
    default:
      return null;
  }
}
