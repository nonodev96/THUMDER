import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  Injector,
  inject,
  signal,
  untracked,
} from "@angular/core";
import { BYTES_OF_TYPE_DATA } from "@core/DLX/typeDataValues";
import { isExact } from "@core/ieee754";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { bitsToHex, toAddress } from "@core/numbers";
import {
  type BitField,
  EditRequestService,
  fieldOf,
  formatValue,
  ieeeOfBits,
  type MemoryEditRequest,
  type MemoryTypeData,
  parseValue,
  rangeOf,
  representations,
  type ValueField,
  type ValueFormat,
} from "@core/services/edit/edit-request.service";
import { TranslatePipe } from "@ngx-translate/core";
import { mediaSignal, NARROW } from "@shared/utils/media";
import { ModalDismissDirective } from "../../../__shared/directives/bootstrap/modal.directive";

/** The types of data, a button each, with their size */
const TYPES: { type: MemoryTypeData; label: string }[] = [
  { type: "Byte", label: "EDIT_MEMORY.TYPE_BYTE" },
  { type: "HalfWord", label: "EDIT_MEMORY.TYPE_HALF_WORD" },
  { type: "Word", label: "EDIT_MEMORY.TYPE_WORD" },
  { type: "Float", label: "EDIT_MEMORY.TYPE_FLOAT" },
  { type: "Double", label: "EDIT_MEMORY.TYPE_DOUBLE" },
];

/** A label of the program near the address: on it (offset 0) or before it, at most this many bytes */
const NEAR_LABEL = 0x100;

/** Where a data can start: a multiple of its size (of 4 for a double, two words in a row) */
const alignmentOf = (type: MemoryTypeData) => Math.min(BYTES_OF_TYPE_DATA[type], 4);

/** A bit of the grid: in the data (its index in the value) or around it, in the same word (index -1) */
type BitCell = { index: number; bit: string; position: number; field: BitField; changed: boolean; gap: boolean };
type BitByte = { address: string; edited: boolean; high: number; low: number; cells: BitCell[] };

/** Why an address cannot be edited, and the addresses near it that can be (a misaligned one) */
type AddressError = { key: string; params?: Record<string, string | number>; fixes?: number[] };

type ApplyStatus = { kind: "saved" | "adjusted" | "rejected" | "error"; name: string; value: string };

/**
 * The dialog that edits the memory: the type of data and its address (checked as it is typed, with buttons to the
 * previous and the next one and the labels of the program), the value there now and a new one written in hexadecimal,
 * in decimal, as a character or bit by bit, the word (or the two words) that hold it with its bytes marked, and every
 * representation of the new value. Nothing is written until «Apply»: then it goes to the simulator.
 */
@Component({
  selector: "THUMDER-edit-memory-binary32",
  templateUrl: "./edit-memory-binary32.component.html",
  // The styles of the dialogs of edition are the ones of the register dialog
  styleUrls: ["../edit-register-binary32/edit-register-binary32.component.scss", "./edit-memory-binary32.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalDismissDirective, TranslatePipe],
})
export class EditMemoryBinary32Component {
  public machine = inject(MachineService);
  private requests = inject(EditRequestService);
  private host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private injector = inject(Injector);

  public readonly types = TYPES;
  public readonly typeData = signal<MemoryTypeData>("Word");
  /** The text of the input of the address (hexadecimal, with or without 0x) */
  public readonly addressText = signal("00000000");
  private readonly draft = signal<string | null>(null);
  private readonly typing = signal<{ field: ValueField; text: string; bits: string | null } | null>(null);
  public readonly status = signal<ApplyStatus | null>(null);
  public readonly applying = signal(false);
  public readonly focusBit = signal(0);
  protected readonly narrow = mediaSignal(NARROW);

  public readonly bytes = computed(() => BYTES_OF_TYPE_DATA[this.typeData()]);
  public readonly alignment = computed(() => alignmentOf(this.typeData()));
  public readonly format = computed<ValueFormat>(() => {
    const type = this.typeData();
    return { bits: (BYTES_OF_TYPE_DATA[type] * 8) as ValueFormat["bits"], float: type === "Float" || type === "Double" };
  });
  private readonly memorySize = computed(() => {
    this.machine.state.loads();
    return this.machine.memory.memorySizeBytes;
  });

  /** The address written, if a data of the type can be edited there, or why not */
  public readonly check = computed(() => this.checkAddress());
  public readonly index = computed(() => this.check().index);

  /** The previous and the next data of the type (null at the ends of the memory) */
  public readonly previous = computed(() => {
    const index = this.index();
    return index !== null && index - this.bytes() >= 0 ? index - this.bytes() : null;
  });
  public readonly next = computed(() => {
    const index = this.index();
    return index !== null && index + 2 * this.bytes() <= this.memorySize() ? index + this.bytes() : null;
  });

  /** The labels of the program, by address */
  public readonly symbols = computed(() =>
    this.machine.state
      .symbols()
      .map((symbol) => ({ name: symbol.name, index: Number.parseInt(symbol.address, 16) >>> 0 }))
      .sort((a, b) => a.index - b.index || a.name.localeCompare(b.name)),
  );
  /** The labels on the address or, without one, the closest one before it */
  public readonly labels = computed(() => {
    const index = this.index();
    if (index === null) return { at: [] as string[], near: null };
    const symbols = this.symbols();
    const at = symbols.filter((symbol) => symbol.index === index).map((symbol) => symbol.name);
    const before = symbols.filter((symbol) => symbol.index < index && index - symbol.index <= NEAR_LABEL).pop();
    return {
      at,
      near: at.length === 0 && before ? { name: before.name, offset: `0x${(index - before.index).toString(16).toUpperCase()}` } : null,
    };
  });
  /** The instructions of the program in the words of the data: changing them changes the program */
  public readonly instructions = computed(() => {
    const index = this.index();
    if (index === null) return [];
    const first = index - (index % 4);
    const words = new Set([toAddress(first), toAddress(first + Math.max(0, this.bytes() - 4))]);
    return this.machine.state
      .code()
      .filter((instruction) => words.has(toAddress(Number.parseInt(instruction.address, 16))))
      .map((instruction) => instruction.instruction);
  });

  public readonly current = computed(() => {
    this.machine.state.values();
    this.machine.state.loads();
    const index = this.index();
    return index === null ? null : this.machine.memory.getMemoryBinaryByIndex(index, this.bytes());
  });
  public readonly bits = computed(() => this.draft() ?? this.current());
  public readonly dirty = computed(() => this.current() !== null && this.bits() !== this.current());
  public readonly changedBits = computed(() => {
    const bits = this.bits() ?? "";
    const current = this.current() ?? "";
    let count = 0;
    for (let i = 0; i < bits.length; i++) if (bits[i] !== current[i]) count++;
    return count;
  });
  public readonly invalid = computed(() => this.typing()?.bits === null);
  public readonly canApply = computed(() => this.index() !== null && this.dirty() && !this.invalid() && !this.applying());
  public readonly hasProgram = computed(() => this.machine.state.code().length > 0);

  public readonly fields = computed<ValueField[]>(() => {
    if (this.format().float) return ["hex", "float"];
    return this.typeData() === "Byte" ? ["hex", "signed", "unsigned", "char"] : ["hex", "signed", "unsigned"];
  });

  /** The word (two for a double) that holds the data: its bytes, the ones of the data marked and editable */
  public readonly words = computed<BitByte[][]>(() => {
    this.machine.state.values();
    const index = this.index();
    const bits = this.bits();
    const current = this.current();
    if (index === null || bits === null || current === null) return [];
    const format = this.format();
    const bytes = this.bytes();
    const first = index - (index % 4);
    const words: BitByte[][] = [];
    for (let word = 0; word < Math.ceil((index - first + bytes) / 4); word++) {
      const around = this.machine.memory.getMemoryWordBinaryByIndex(first + word * 4);
      const row: BitByte[] = [];
      for (let byte = 0; byte < 4; byte++) {
        const address = first + word * 4 + byte;
        const offset = (address - index) * 8;
        const edited = address >= index && address < index + bytes;
        const cells: BitCell[] = [];
        for (let bit = 0; bit < 8; bit++) {
          const at = offset + bit;
          cells.push(
            edited
              ? {
                  index: at,
                  bit: bits[at],
                  position: bits.length - 1 - at,
                  field: fieldOf(at, format),
                  changed: bits[at] !== current[at],
                  gap: bit === 3,
                }
              : { index: -1, bit: around[byte * 8 + bit], position: 31 - byte * 8 - bit, field: null, changed: false, gap: bit === 3 },
          );
        }
        row.push({ address: toAddress(address), edited, high: bits.length - 1 - offset, low: bits.length - 8 - offset, cells });
      }
      words.push(row);
    }
    return words;
  });

  public readonly representations = computed(() => {
    const bits = this.bits();
    return bits === null ? [] : representations(bits, this.format());
  });
  public readonly ieee = computed(() => {
    const bits = this.bits();
    return bits !== null && this.format().float ? ieeeOfBits(bits, this.format()) : null;
  });
  public readonly rounded = computed(() => {
    const typing = this.typing();
    const ieee = this.ieee();
    if (typing?.field !== "float" || typing.bits === null || ieee === null) return null;
    return isExact(typing.text, ieee.exact) === false ? { text: typing.text.trim(), exact: ieee.exact } : null;
  });

  constructor() {
    // A view asked for the dialog: it opens on what it asked for (or where it was), with nothing edited
    effect(() => {
      const request = this.requests.memory();
      if (request) untracked(() => this.openOn(request));
    });
  }

  private checkAddress(): { index: number | null; error: AddressError | null } {
    const digits = this.addressText().trim().replace(/^0x/i, "").replace(/[\s_]/g, "");
    if (!/^[0-9a-f]{1,8}$/i.test(digits)) return { index: null, error: { key: "EDIT_MEMORY.INVALID_ADDRESS" } };
    const index = Number.parseInt(digits, 16);
    const bytes = this.bytes();
    const align = this.alignment();
    if (index % align !== 0) {
      const down = index - (index % align);
      const fixes = [down, down + align].filter((fix) => fix + bytes <= this.memorySize());
      return { index: null, error: { key: "EDIT_MEMORY.MISALIGNED", params: { bytes, align }, fixes } };
    }
    const size = this.memorySize();
    if (index + bytes > size) {
      return { index: null, error: { key: "EDIT_MEMORY.OUT_OF_MEMORY", params: { size, last: toAddress(size - bytes) } } };
    }
    return { index, error: null };
  }

  private openOn(request: MemoryEditRequest): void {
    if (request.typeData) this.typeData.set(request.typeData);
    if (request.address !== undefined) this.goTo(request.address);
    else this.goTo(this.index() ?? 0);
  }

  /** Another address (lowered to a multiple of the size of the type): what was being edited is forgotten */
  public goTo(index: number): void {
    const align = this.alignment();
    const aligned = Math.max(0, Math.min(index - (index % align), this.memorySize() - this.bytes()));
    this.addressText.set(toAddress(aligned).slice(2));
    this.forget();
  }

  private forget(): void {
    this.draft.set(null);
    this.typing.set(null);
    this.status.set(null);
    this.focusBit.set(0);
  }

  public selectType(type: MemoryTypeData): void {
    if (type === this.typeData()) return;
    const index = this.index();
    this.typeData.set(type);
    if (index !== null) this.goTo(index);
    else this.forget();
  }

  public onAddress(text: string): void {
    const before = this.index();
    this.addressText.set(text);
    if (this.index() !== before) this.forget();
  }

  /** Leaving a valid address writes it with its 8 digits */
  public onAddressBlur(): void {
    const index = this.index();
    if (index !== null) this.addressText.set(toAddress(index).slice(2));
  }

  /** In the address: the arrows go to the previous and the next data, and Enter to the new value */
  public onAddressKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      this.step(event.key === "ArrowUp" ? -1 : 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (this.index() !== null) this.host.querySelector<HTMLElement>("#editMemory-hex")?.focus();
    }
  }

  public step(direction: -1 | 1): void {
    const target = direction < 0 ? this.previous() : this.next();
    if (target !== null) this.goTo(target);
  }

  public goToLabel(value: string): void {
    if (value !== "") this.goTo(Number(value));
  }

  // ─── The new value ─────────────────────────────────────────────────────────────────────────────────────────────────

  public text(field: ValueField): string {
    const typing = this.typing();
    if (typing?.field === field) return typing.text;
    const bits = this.bits();
    return bits === null ? "" : formatValue(field, bits, this.format());
  }

  public isInvalid(field: ValueField): boolean {
    const typing = this.typing();
    return typing?.field === field && typing.bits === null;
  }

  public range(field: ValueField): { min: string; max: string } {
    return field === "signed" || field === "unsigned" ? rangeOf(field, this.format()) : { min: "", max: "" };
  }

  public onInput(field: ValueField, text: string): void {
    const bits = parseValue(field, text, this.format());
    this.typing.set({ field, text, bits });
    this.status.set(null);
    if (bits !== null) this.draft.set(bits);
  }

  public onBlur(field: ValueField): void {
    const typing = this.typing();
    if (typing?.field === field && typing.bits !== null) this.typing.set(null);
  }

  public toggle(index: number): void {
    const bits = this.bits();
    if (index < 0 || bits === null) return;
    this.draft.set(`${bits.slice(0, index)}${bits[index] === "1" ? "0" : "1"}${bits.slice(index + 1)}`);
    this.typing.set(null);
    this.status.set(null);
    this.focusBit.set(index);
  }

  /** The bits of the data are one stop of Tab: the arrows go from bit to bit (up and down, a byte) */
  public onBitKeydown(event: KeyboardEvent): void {
    const count = this.format().bits;
    const at = this.focusBit();
    const moves: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: at + 8,
      ArrowUp: at - 8,
      Home: 0,
      End: count - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = Math.min(count - 1, Math.max(0, next));
    this.focusBit.set(target);
    this.host.querySelector<HTMLElement>(`#editMemoryModal [data-bit="${target}"]`)?.focus();
  }

  public revert(): void {
    this.draft.set(null);
    this.typing.set(null);
    this.status.set(null);
  }

  public decimalOf(bits: string | null): string {
    if (bits === null) return "";
    return formatValue(this.format().float ? "float" : "signed", bits, this.format());
  }

  public hexAddress(index: number): string {
    return toAddress(index);
  }

  public hexOf(bits: string | null): string {
    return bits === null ? "—" : `0x${bitsToHex(bits)}`;
  }

  public onEnter(event: Event): void {
    event.preventDefault();
    if (this.typing()?.bits !== null) this.typing.set(null);
    void this.apply();
  }

  /** Writes the new value: in the memory of the page and in the simulator, and reads again what is stored */
  public async apply(): Promise<void> {
    const index = this.index();
    const bits = this.bits();
    if (!this.canApply() || index === null || bits === null) return;
    const name = toAddress(index);
    const bytes = this.bytes();
    this.keepFocus();
    this.applying.set(true);
    try {
      this.machine.memory.setMemoryBinaryByIndex(index, bits);
      const accepted = await this.machine.updateMemory([{ typeData: this.typeData(), address: name, value: bitsToHex(bits, bytes * 2) }]);
      this.draft.set(null);
      this.typing.set(null);
      const stored = this.machine.memory.getMemoryBinaryByIndex(index, bytes);
      const status = !accepted ? "rejected" : stored === bits ? "saved" : "adjusted";
      this.status.set({ kind: status, name, value: this.hexOf(stored) });
    } catch (error) {
      logger.error(error);
      this.status.set({ kind: "error", name, value: this.hexOf(bits) });
    } finally {
      this.applying.set(false);
    }
  }

  /** Applied with its button, which is disabled now: the focus goes to the hexadecimal input, and stays in the dialog */
  private keepFocus(): void {
    if (document.activeElement !== this.host.querySelector("#editMemoryApply")) return;
    afterNextRender(() => this.host.querySelector<HTMLElement>("#editMemory-hex")?.focus(), { injector: this.injector });
  }
}
