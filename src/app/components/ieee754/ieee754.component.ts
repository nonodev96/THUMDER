import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { DOUBLE, decode, encode, type FloatFormat, isExact, numberOf, parseDecimal, SINGLE } from "@core/ieee754";
import { bitsToHex, hexToBits } from "@core/numbers";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

type Field = "sign" | "exponent" | "fraction";

/**
 * A number in IEEE 754, single or double precision: written in decimal, hexadecimal or binary, its bits (each one can
 * be clicked to change it) split in sign, exponent and fraction, what each field means, the formula with its values
 * and the exact value the bits keep (and whether it is not the one written)
 */
@Component({
  selector: "thumder-ieee754",
  templateUrl: "./ieee754.component.html",
  styleUrls: ["./ieee754.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class Ieee754Component {
  private translate = inject(TranslateService);

  public readonly formats = [SINGLE, DOUBLE];
  public readonly format = signal<FloatFormat>(SINGLE);
  public readonly bits = signal(encode(3.14, SINGLE));
  public readonly decimalText = signal("3.14");
  public readonly hexText = signal(bitsToHex(encode(3.14, SINGLE)));
  public readonly binaryText = signal(encode(3.14, SINGLE));
  public readonly decimalInvalid = signal(false);
  public readonly hexInvalid = signal(false);
  public readonly binaryInvalid = signal(false);

  public readonly decoded = computed(() => decode(this.bits(), this.format()));
  /** The number written is not the one kept (null when it cannot be told: an exponent, Infinity...) */
  public readonly rounded = computed(() => {
    const exact = isExact(this.decimalText(), this.decoded().exact);
    return exact === false;
  });

  /** The bits with their field and their place (the bit 31 or 63 first) */
  public readonly cells = computed(() => {
    const format = this.format();
    return this.bits()
      .split("")
      .map((bit, index) => {
        const field: Field = index === 0 ? "sign" : index <= format.exponent ? "exponent" : "fraction";
        const start = field === "sign" ? 0 : field === "exponent" ? 1 : 1 + format.exponent;
        return { bit, index, field, position: format.bits - 1 - index, gap: (index - start) % 4 === 3 };
      });
  });
  public readonly fields: Field[] = ["sign", "exponent", "fraction"];

  public cellsOf(field: Field) {
    return this.cells().filter((cell) => cell.field === field);
  }

  /** A number in the language of the interface (all its digits) */
  public format_(text: string): string {
    const lang = this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es";
    return lang === "es" ? text.replace(".", ",") : text;
  }

  public setFormat(format: FloatFormat): void {
    if (format === this.format()) return;
    // The number written in the other format (the nearest one it can keep); without one, the value of the bits
    const written = this.decimalInvalid() ? null : parseDecimal(this.decimalText());
    const value = written ?? numberOf(this.bits(), this.format());
    this.format.set(format);
    this.setBits(encode(value, format), written !== null);
  }

  /** New bits: the three texts show them (the decimal one, unless it is being written) */
  private setBits(bits: string, keepDecimal: boolean): void {
    this.bits.set(bits);
    this.hexText.set(bitsToHex(bits));
    this.binaryText.set(bits);
    this.hexInvalid.set(false);
    this.binaryInvalid.set(false);
    if (!keepDecimal) {
      this.decimalText.set(String(numberOf(bits, this.format())));
      this.decimalInvalid.set(false);
    }
  }

  public onDecimal(text: string): void {
    this.decimalText.set(text);
    const value = parseDecimal(text);
    this.decimalInvalid.set(value === null);
    if (value !== null) this.setBits(encode(value, this.format()), true);
  }

  public onHex(text: string): void {
    const digits = text.trim().replace(/^0x/i, "").replace(/\s/g, "");
    this.hexText.set(text);
    const valid = /^[0-9a-f]+$/i.test(digits) && digits.length <= this.format().bits / 4;
    this.hexInvalid.set(!valid);
    if (valid) {
      const bits = hexToBits(digits, this.format().bits);
      this.setBits(bits, false);
      this.hexText.set(text);
    }
  }

  public onBinary(text: string): void {
    const digits = text.replace(/\s/g, "");
    this.binaryText.set(text);
    const valid = /^[01]+$/.test(digits) && digits.length <= this.format().bits;
    this.binaryInvalid.set(!valid);
    if (valid) {
      this.setBits(digits.padStart(this.format().bits, "0"), false);
      this.binaryText.set(text);
    }
  }

  /** A click on a bit changes it */
  public toggle(index: number): void {
    const bits = this.bits();
    this.setBits(`${bits.slice(0, index)}${bits[index] === "1" ? "0" : "1"}${bits.slice(index + 1)}`, false);
  }
}
