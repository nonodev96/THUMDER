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
import { MACHINE_REGISTERS_C, MACHINE_REGISTERS_D, MACHINE_REGISTERS_R } from "@app/CONSTANTS";
import type { TypeRegister, TypeRegisterControl, TypeRegisterToEdit } from "@app/Types";
import { isExact } from "@core/ieee754";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { bitsToHex } from "@core/numbers";
import {
  type BitField,
  EditRequestService,
  fieldOf,
  formatValue,
  ieeeOfBits,
  parseValue,
  type RegisterEditRequest,
  rangeOf,
  representations,
  type ValueField,
  type ValueFormat,
} from "@core/services/edit/edit-request.service";
import { TranslatePipe } from "@ngx-translate/core";
import { mediaSignal, NARROW } from "@shared/utils/media";
import { ModalDismissDirective } from "../../../__shared/directives/bootstrap/modal.directive";

/** The kinds of registers, a button each, with the registers they have */
const KINDS: { kind: TypeRegister; label: string; range: string }[] = [
  { kind: "Control", label: "EDIT_REGISTER.KIND_CONTROL", range: "PC, IR, A…" },
  { kind: "Integer", label: "EDIT_REGISTER.KIND_INTEGER", range: "R0–R31" },
  { kind: "Float", label: "EDIT_REGISTER.KIND_FLOAT", range: "F0–F31" },
  { kind: "Double", label: "EDIT_REGISTER.KIND_DOUBLE", range: "F0-F1…" },
];

/** The registers of control the simulator lets change: the others are latches of the pipeline, written every cycle */
const EDITABLE_CONTROL: TypeRegisterToEdit[] = ["PC", "FPSR"];

/** The register chosen first in each kind (R0 cannot be changed) */
const FIRST: Record<TypeRegister, TypeRegisterToEdit> = { Control: "PC", Integer: 1, Float: 0, Double: 0 };

/** The registers of each kind (a double is named by its even register) */
const REGISTERS_OF: Record<TypeRegister, TypeRegisterToEdit[]> = {
  Control: MACHINE_REGISTERS_C,
  Integer: MACHINE_REGISTERS_R,
  Float: Array.from({ length: 32 }, (_, index) => index as TypeRegisterToEdit),
  Double: MACHINE_REGISTERS_D,
};

/** A register of the list: its name, its value now and whether it can be changed */
type RegisterItem = { id: TypeRegisterToEdit; name: string; hex: string; zero: boolean; editable: boolean };

/** A bit of the grid: where it is in the value, its place (31..0), its IEEE 754 field and whether it is changed */
type BitCell = { index: number; bit: string; position: number; field: BitField; changed: boolean; gap: boolean };
type BitByte = { high: number; low: number; cells: BitCell[] };
type BitRow = { label: string; bytes: BitByte[] };

/** What happened with the last value applied */
type ApplyStatus = { kind: "saved" | "adjusted" | "rejected" | "error"; name: string; value: string };

/**
 * The dialog that edits a register: the kind and the register (with the value each one has now), its current value and
 * a new one written in hexadecimal, in decimal (with and without sign, or as a floating point number) or bit by bit,
 * every representation of the new value and, for a floating point register, what its IEEE 754 fields mean. Nothing is
 * written until «Apply»: then it goes to the simulator, and the dialog stays open with the value stored.
 */
@Component({
  selector: "THUMDER-edit-register-binary32",
  templateUrl: "./edit-register-binary32.component.html",
  styleUrls: ["./edit-register-binary32.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalDismissDirective, TranslatePipe],
})
export class EditRegisterBinary32Component {
  public machine = inject(MachineService);
  private requests = inject(EditRequestService);
  private host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private injector = inject(Injector);

  public readonly kinds = KINDS;
  public readonly kind = signal<TypeRegister>("Control");
  public readonly register = signal<TypeRegisterToEdit>("PC");
  /** The new value while it is being edited (null: none, the dialog shows the current one) */
  private readonly draft = signal<string | null>(null);
  /** The input being written: its text stays as it is typed until it loses the focus */
  private readonly typing = signal<{ field: ValueField; text: string; bits: string | null } | null>(null);
  public readonly status = signal<ApplyStatus | null>(null);
  public readonly applying = signal(false);
  /** The bit of the grid that takes the focus with Tab (the arrows move it) */
  public readonly focusBit = signal(0);
  /** The register chosen last in each kind */
  private readonly last: Record<TypeRegister, TypeRegisterToEdit> = { ...FIRST };
  /** On a phone the keyboard would cover the dialog: no input takes the focus when it opens */
  protected readonly narrow = mediaSignal(NARROW);

  public readonly format = computed<ValueFormat>(() => {
    const kind = this.kind();
    return { bits: kind === "Double" ? 64 : 32, float: kind === "Float" || kind === "Double" };
  });

  /** The registers of the kind chosen, with their values (again when the machine changes them) */
  public readonly registers = computed<RegisterItem[]>(() => {
    this.machine.state.values();
    this.machine.state.loads();
    const kind = this.kind();
    return REGISTERS_OF[kind].map((id) => {
      const bits = this.read(kind, id);
      return { id, name: this.nameOf(kind, id), hex: bitsToHex(bits), zero: !bits.includes("1"), editable: this.isEditable(kind, id) };
    });
  });

  public readonly name = computed(() => this.nameOf(this.kind(), this.register()));
  public readonly editable = computed(() => this.isEditable(this.kind(), this.register()));
  public readonly current = computed(() => {
    this.machine.state.values();
    this.machine.state.loads();
    return this.read(this.kind(), this.register());
  });
  public readonly bits = computed(() => this.draft() ?? this.current());
  public readonly dirty = computed(() => this.bits() !== this.current());
  public readonly changedBits = computed(() => {
    const bits = this.bits();
    const current = this.current();
    let count = 0;
    for (let i = 0; i < bits.length; i++) if (bits[i] !== current[i]) count++;
    return count;
  });
  public readonly invalid = computed(() => this.typing()?.bits === null);
  public readonly canApply = computed(() => this.editable() && this.dirty() && !this.invalid() && !this.applying());
  public readonly hasProgram = computed(() => this.machine.state.code().length > 0);

  /** The inputs of the kind: an integer in hexadecimal and decimal, or a floating point number */
  public readonly fields = computed<ValueField[]>(() => (this.format().float ? ["hex", "float"] : ["hex", "signed", "unsigned"]));

  public readonly rows = computed<BitRow[]>(() => {
    const bits = this.bits();
    const current = this.current();
    const format = this.format();
    const first = Number(this.register());
    const rows: BitRow[] = [];
    for (let row = 0; row < bits.length / 32; row++) {
      const bytes: BitByte[] = [];
      for (let byte = 0; byte < 4; byte++) {
        const start = row * 32 + byte * 8;
        const cells: BitCell[] = [];
        for (let index = start; index < start + 8; index++) {
          cells.push({
            index,
            bit: bits[index],
            position: bits.length - 1 - index,
            field: fieldOf(index, format),
            changed: bits[index] !== current[index],
            gap: index - start === 3,
          });
        }
        bytes.push({ high: bits.length - 1 - start, low: bits.length - 8 - start, cells });
      }
      // A double: the high half in the even register and the low one in the odd register
      rows.push({ label: this.kind() === "Double" ? `F${first + row}` : "", bytes });
    }
    return rows;
  });

  public readonly representations = computed(() => representations(this.bits(), this.format()));
  public readonly ieee = computed(() => (this.format().float ? ieeeOfBits(this.bits(), this.format()) : null));
  public readonly currentIeee = computed(() => (this.format().float ? ieeeOfBits(this.current(), this.format()) : null));

  /** The number written does not fit exactly in the bits (null when it cannot be told, or nothing is being written) */
  public readonly rounded = computed(() => {
    const typing = this.typing();
    const ieee = this.ieee();
    if (typing?.field !== "float" || typing.bits === null || ieee === null) return null;
    return isExact(typing.text, ieee.exact) === false ? { text: typing.text.trim(), exact: ieee.exact } : null;
  });

  constructor() {
    // A view asked for the dialog: it opens on what it asked for, with nothing edited
    effect(() => {
      const request = this.requests.register();
      if (request) untracked(() => this.openOn(request));
    });
  }

  private openOn(request: RegisterEditRequest): void {
    const kind = request.kind ?? this.kind();
    this.kind.set(kind);
    this.choose(request.register ?? this.last[kind]);
  }

  private nameOf(kind: TypeRegister, id: TypeRegisterToEdit): string {
    switch (kind) {
      case "Control":
        return String(id);
      case "Integer":
        return `R${id}`;
      case "Float":
        return `F${id}`;
      case "Double":
        return `F${id}-F${Number(id) + 1}`;
    }
  }

  private isEditable(kind: TypeRegister, id: TypeRegisterToEdit): boolean {
    if (kind === "Control") return EDITABLE_CONTROL.includes(id);
    return !(kind === "Integer" && Number(id) === 0);
  }

  /** The bits of a register now (a double: the even register and the next one) */
  private read(kind: TypeRegister, id: TypeRegisterToEdit): string {
    const registers = this.machine.registers;
    const index = Number(id);
    switch (kind) {
      case "Control":
        return registers[id as TypeRegisterControl].binary;
      case "Integer":
        return registers.R[index].binary;
      case "Float":
        return registers.F[index].binary;
      case "Double":
        return registers.F[index].binary + registers.F[index + 1].binary;
    }
  }

  /** Another register: what was being edited is forgotten */
  private choose(id: TypeRegisterToEdit): void {
    this.register.set(id);
    this.last[this.kind()] = id;
    this.draft.set(null);
    this.typing.set(null);
    this.status.set(null);
    this.focusBit.set(0);
  }

  public selectKind(kind: TypeRegister): void {
    if (kind === this.kind()) return;
    this.kind.set(kind);
    this.choose(this.last[kind]);
  }

  public selectRegister(id: TypeRegisterToEdit | string): void {
    const item = this.registers().find((register) => String(register.id) === String(id));
    if (item && item.id !== this.register()) this.choose(item.id);
  }

  /** The list of registers is a group of radio buttons: the arrows, Home and End choose another one */
  public onRegisterKeydown(event: KeyboardEvent): void {
    const list = this.registers();
    const index = list.findIndex((item) => item.id === this.register());
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: list.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = (next + list.length) % list.length;
    this.choose(list[target].id);
    queueMicrotask(() => this.host.querySelector<HTMLElement>(`#editRegisterChip-${target}`)?.focus());
  }

  // ─── The new value ─────────────────────────────────────────────────────────────────────────────────────────────────

  /** The text of an input: what is being typed in it, or the new value written its way */
  public text(field: ValueField): string {
    const typing = this.typing();
    return typing?.field === field ? typing.text : formatValue(field, this.bits(), this.format());
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

  /** Leaving a valid input writes it again in its own way (2a → 0000002A) */
  public onBlur(field: ValueField): void {
    const typing = this.typing();
    if (typing?.field === field && typing.bits !== null) this.typing.set(null);
  }

  public toggle(index: number): void {
    if (!this.editable()) return;
    const bits = this.bits();
    this.draft.set(`${bits.slice(0, index)}${bits[index] === "1" ? "0" : "1"}${bits.slice(index + 1)}`);
    this.typing.set(null);
    this.status.set(null);
    this.focusBit.set(index);
  }

  /** The grid of bits is one stop of Tab: the arrows go from bit to bit (up and down, a byte), Home and End to the ends */
  public onBitKeydown(event: KeyboardEvent): void {
    const count = this.bits().length;
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
    this.host.querySelector<HTMLElement>(`#modal-EditRegister [data-bit="${target}"]`)?.focus();
  }

  public revert(): void {
    this.draft.set(null);
    this.typing.set(null);
    this.status.set(null);
  }

  /** A value of the register as the summary writes it: in decimal (the signed one for R) or as a number */
  public decimalOf(bits: string): string {
    if (this.format().float) return formatValue("float", bits, this.format());
    return formatValue(this.kind() === "Integer" ? "signed" : "unsigned", bits, this.format());
  }

  public hexOf(bits: string): string {
    return `0x${bitsToHex(bits)}`;
  }

  /** Enter in an input applies the value */
  public onEnter(event: Event): void {
    event.preventDefault();
    const typing = this.typing();
    if (typing?.bits !== null) this.typing.set(null);
    void this.apply();
  }

  /**
   * Writes the new value: in the registers of the page and in the simulator, which answers with the value it has stored
   * (FPSR keeps one bit). The dialog stays open, with the value stored as the current one
   */
  public async apply(): Promise<void> {
    if (!this.canApply()) return;
    const kind = this.kind();
    const id = this.register();
    const name = this.name();
    const bits = this.bits();
    const index = Number(id);
    this.keepFocus();
    this.applying.set(true);
    try {
      switch (kind) {
        case "Control":
          this.machine.registers.setRegisterControlWithBinary(id as TypeRegisterControl, bits);
          break;
        case "Integer":
          this.machine.registers.setRegisterIntegerWithBinary(index, bits);
          break;
        case "Float":
          this.machine.registers.setRegisterFloatWithBinary(index, bits);
          break;
        case "Double":
          this.machine.registers.setRegisterDoubleWithBinary(index, bits);
          break;
      }
      const accepted = await this.machine.updateRegisters([{ register: id, typeRegister: kind, hexadecimalValue: bitsToHex(bits) }]);
      this.draft.set(null);
      this.typing.set(null);
      const stored = this.read(kind, id);
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
    if (document.activeElement !== this.host.querySelector("#editRegisterApply")) return;
    afterNextRender(() => this.host.querySelector<HTMLElement>("#editRegister-hex")?.focus(), { injector: this.injector });
  }
}
