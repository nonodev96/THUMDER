import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from "@angular/core";
import { PipelineStagesComponent } from "@components/pipeline-stages/pipeline-stages.component";
import { ConfigService } from "@core/config/config.service";
import { type CycleActivity, cycleActivity, type Occupant, type StageKey, UNIT_KEYS, type UnitKey } from "@core/machine/cycle-activity";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { DetailsDirective } from "../../../__shared/directives/details/details.directive";

/** The colours of the stages (the variables of theme.scss), as in the cycle clock diagram */
const COLOURS: Record<StageKey | UnitKey, string> = {
  IF: "var(--thumder-stage-if)",
  ID: "var(--thumder-stage-id)",
  intEX: "var(--thumder-stage-ex)",
  MEM: "var(--thumder-stage-mem)",
  WB: "var(--thumder-stage-wb)",
  faddEX: "var(--thumder-stage-fadd)",
  fmultEX: "var(--thumder-stage-fmult)",
  fdivEX: "var(--thumder-stage-fdiv)",
};

/** The columns of the drawing (units of its viewBox, 1200 × 640): the five stages and the registers between them */
export const STAGES = [
  { key: "IF", name: "IF", title: "DATAPATH.STAGE_IF", x: 12, width: 184 },
  { key: "ID", name: "ID", title: "DATAPATH.STAGE_ID", x: 278, width: 190 },
  { key: "intEX", name: "EX", title: "DATAPATH.STAGE_EX", x: 550, width: 180 },
  { key: "MEM", name: "MEM", title: "DATAPATH.STAGE_MEM", x: 812, width: 168 },
  { key: "WB", name: "WB", title: "DATAPATH.STAGE_WB", x: 1062, width: 126 },
] as const satisfies readonly { key: StageKey; name: string; title: string; x: number; width: number }[];

const LATCH_WIDTH = 66;
const LATCHES = [
  { name: "IF/ID", x: 204 },
  { name: "ID/EX", x: 476 },
  { name: "EX/MEM", x: 738 },
  { name: "MEM/WB", x: 988 },
] as const;

/** The instructions of the five stages travel along this line, above the datapath */
const TOKEN_Y = 54;
const TOKEN_WIDTH = 170;
const TOKEN_HEIGHT = 28;
/** The rows of the floating point units, under the ALU */
const UNIT_ROWS: Record<UnitKey, { y: number; name: string }> = {
  faddEX: { y: 420, name: "FADD" },
  fmultEX: { y: 458, name: "FMUL" },
  fdivEX: { y: 496, name: "FDIV" },
};
const UNIT_X = 556;
const UNIT_WIDTH = 168;
const UNIT_SLOTS_X = 618;
const UNIT_SLOTS_WIDTH = 102;

/**
 * The wires of the datapath: where they go and which stage uses them (its colour). Each cycle lights the ones used and
 * sends a pulse along them, from where the value comes from to where it goes.
 */
const WIRES = {
  // IF: the PC reads the instruction memory, +4 gives the next PC and the multiplexer chooses PC+4 or the target
  pcIm: { d: "M 98 282 H 114", stage: "IF" },
  imIr: { d: "M 194 300 H 208", stage: "IF" },
  pcAdd: { d: "M 90 246 V 232 H 108 V 140 H 118", stage: "IF" },
  addNpc: { d: "M 152 151 H 208", stage: "IF" },
  npcMux: { d: "M 170 151 V 110 H 80 V 176", stage: "IF" },
  muxPc: { d: "M 61 200 V 246", stage: "IF" },
  // ID: the registers are read, the immediate is extended and the branches are resolved
  npcBranch: { d: "M 270 151 H 300", stage: "ID" },
  btaMux: { d: "M 360 124 V 92 H 42 V 176", stage: "ID" },
  irRf: { d: "M 270 300 H 300", stage: "ID" },
  rfBranch: { d: "M 340 196 V 174", stage: "ID" },
  rfA: { d: "M 420 232 H 480", stage: "ID" },
  rfB: { d: "M 420 320 H 480", stage: "ID" },
  irImm: { d: "M 286 300 V 413 H 306", stage: "ID" },
  immEx: { d: "M 402 413 H 480", stage: "ID" },
  // EX: the multiplexers of the forwarding and the ALU
  aMux: { d: "M 542 232 H 556", stage: "intEX" },
  bMux: { d: "M 542 320 H 556", stage: "intEX" },
  immMux: { d: "M 542 413 H 550 V 332 H 556", stage: "intEX" },
  muxAluA: { d: "M 580 232 H 600", stage: "intEX" },
  muxAluB: { d: "M 580 320 H 600", stage: "intEX" },
  aluOut: { d: "M 680 275 H 742", stage: "intEX" },
  bStore: { d: "M 548 320 V 372 H 742", stage: "intEX" },
  // MEM: the data memory, or the result of the ALU that goes on
  dmAddress: { d: "M 804 275 H 834", stage: "MEM" },
  dmWrite: { d: "M 804 372 H 834", stage: "MEM" },
  dmRead: { d: "M 958 300 H 992", stage: "MEM" },
  bypass: { d: "M 804 275 H 820 V 450 H 992", stage: "MEM" },
  // WB: the multiplexer chooses what was read or the result, and it is written in the bank of registers
  lmdWb: { d: "M 1054 300 H 1080", stage: "WB" },
  aluWb: { d: "M 1054 450 H 1080", stage: "WB" },
  wbRf: { d: "M 1104 375 H 1160 V 612 H 400 V 354", stage: "WB" },
  // Forwarding: from the registers after EX and after MEM, back to EX (and to ID for the branches)
  fwdMemEx: { d: "M 820 275 V 556 H 562 V 340", stage: "forwarding" },
  fwdWbEx: { d: "M 1130 375 V 584 H 574 V 340", stage: "forwarding" },
  fwdMemId: { d: "M 820 275 V 556 H 440 V 168 H 420", stage: "forwarding" },
  fwdWbId: { d: "M 1130 375 V 584 H 448 V 160 H 420", stage: "forwarding" },
} as const satisfies Record<string, { d: string; stage: StageKey | "forwarding" }>;

export type WireKey = keyof typeof WIRES;

/** The wires drawn always (the forwarding to ID only appears when it is used) */
const BASE_WIRES = (Object.keys(WIRES) as WireKey[]).filter(
  (key) => !key.startsWith("fwd") && !["btaMux", "npcMux", "wbRf", "bypass"].includes(key),
);

/** A field of a register between stages: its name, its value (8 hexadecimal digits) and whether it changed now */
type Field = { name: string; y: number; value: string; changed: boolean };

/** An instruction drawn on the datapath: it keeps its element while it goes through the stages, so it slides */
type Token = {
  id: number;
  text: string;
  x: number;
  y: number;
  scale: number;
  colour: string;
  stall: string | null;
};

const hex8 = (value: number | undefined) => (value === undefined ? "--------" : (value >>> 0).toString(16).toUpperCase().padStart(8, "0"));
const binaryValue = (binary: string) => Number.parseInt(binary || "0", 2) >>> 0;

/**
 * The datapath of the pipeline of THUMDER (EDU-05), drawn for its model: IF (PC, +4, instruction memory), ID (bank of
 * registers, sign extension, branches resolved in ID), EX (the multiplexers of the forwarding, the integer ALU and the
 * floating point units), MEM (data memory) and WB, with the registers between the stages and the paths of forwarding.
 *
 * Each cycle the instructions slide to their new stage (each one keeps its element), the registers between the stages
 * flash with the clock and show what they capture, and a pulse runs along the wires each stage uses: the PC to the
 * memory, the registers read, the result of the ALU, the access to the memory, the write in the bank, the forwarding.
 * The footer says, stage by stage, what each one does.
 */
@Component({
  selector: "view-datapath",
  templateUrl: "./datapath.view.html",
  styleUrls: ["./datapath.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, DetailsDirective, PipelineStagesComponent, TranslatePipe],
})
export class DatapathView {
  private machine = inject(MachineService);
  private config = inject(ConfigService);

  public readonly stages = STAGES;
  public readonly latches = LATCHES;
  public readonly latchWidth = LATCH_WIDTH;
  public readonly wires = WIRES;
  public readonly baseWires = BASE_WIRES;
  public readonly tokenWidth = TOKEN_WIDTH;
  public readonly tokenHeight = TOKEN_HEIGHT;
  public readonly unitRows = UNIT_KEYS.map((key) => ({ key, ...UNIT_ROWS[key], colour: COLOURS[key] }));
  public readonly unitX = UNIT_X;
  public readonly unitWidth = UNIT_WIDTH;
  public readonly unitSlotsX = UNIT_SLOTS_X;
  public readonly unitSlotsWidth = UNIT_SLOTS_WIDTH;

  public readonly step = this.machine.state.step;
  public readonly forwardingEnabled = computed(() => {
    this.machine.state.loads();
    return this.machine.enabledForwarding;
  });

  /** The configuration of the floating point units: how many of each and their cycles */
  public readonly unitsConfig = computed(() => {
    this.machine.state.loads();
    const { addition, multiplication, division } = this.machine.floatingPointStageConfiguration;
    return { faddEX: addition, fmultEX: multiplication, fdivEX: division } as Record<UnitKey, { count: number; delay: number }>;
  });

  /**
   * How long the movements of a cycle last (CSS): most of the time between cycles while it runs (none when it runs too
   * fast to follow them), or a calm 650 ms step by step
   */
  public readonly duration = computed(() => {
    if (!this.machine.state.running()) return 650;
    const delay = this.config.value().delay;
    return delay < 120 ? 0 : Math.min(650, Math.round(delay * 0.8));
  });

  public readonly activity = computed<CycleActivity>(() => {
    this.machine.state.diagram();
    return cycleActivity(this.machine.state.pipeline(), this.machine.state.cycle(), this.machine.diagram, (address) => {
      const code = this.machine.code.get(address as `0x${string}`);
      return code ? Number.parseInt(code.code, 16) >>> 0 : null;
    });
  });

  /** The results of the ALU by instruction, so MEM/WB shows the one of the instruction in MEM (a new program empties it) */
  private readonly results = new Map<number, number>();

  constructor() {
    effect(() => {
      this.machine.state.loads();
      untracked(() => this.results.clear());
    });
  }

  /** The instructions of the cycle: the five stages on their line, the floating point units in their rows */
  public readonly tokens = computed<Token[]>(() => {
    const activity = this.activity();
    const tokens: Token[] = [];
    for (const stage of STAGES) {
      const occupant = activity.stages[stage.key];
      if (occupant?.id === null || occupant === null) continue;
      // The last column is narrower: its instruction does not go beyond the drawing
      const centre = Math.min(stage.x + stage.width / 2, 1192 - TOKEN_WIDTH / 2);
      tokens.push(this.token(occupant, centre - TOKEN_WIDTH / 2, TOKEN_Y, 1, COLOURS[stage.key]));
    }
    for (const unit of UNIT_KEYS) {
      const cells = activity.units[unit];
      const slot = UNIT_SLOTS_WIDTH / Math.max(1, cells.length);
      cells.forEach((occupant, index) => {
        if (occupant === null || occupant.id === null) return;
        const scale = Math.min(0.6, (slot - 4) / TOKEN_WIDTH);
        const x = UNIT_SLOTS_X + index * slot + (slot - TOKEN_WIDTH * scale) / 2;
        const y = UNIT_ROWS[unit].y + (30 - TOKEN_HEIGHT * scale) / 2;
        tokens.push(this.token(occupant, x, y, scale, COLOURS[unit]));
      });
    }
    return tokens;
  });

  private token(occupant: Occupant, x: number, y: number, scale: number, colour: string): Token {
    const aborted = occupant.stall === "Aborted";
    // The assembler separates the operands with tabs: one space
    const clean = occupant.text.replace(/\s+/g, " ").trim();
    return {
      id: occupant.id as number,
      text: clean.length > 21 ? `${clean.slice(0, 20)}…` : clean,
      x,
      y,
      scale,
      colour: aborted ? "var(--thumder-stage-aborted)" : occupant.stall ? "var(--thumder-stall-w)" : colour,
      stall: occupant.stall,
    };
  }

  /** Each stage: whether it has an instruction and whether it is stalled (its column lights up) */
  public readonly zones = computed(() => {
    const activity = this.activity();
    return STAGES.map((stage) => {
      const occupant = activity.stages[stage.key];
      const busy = occupant !== null || (stage.key === "intEX" && UNIT_KEYS.some((unit) => activity.units[unit].some((cell) => cell)));
      return { ...stage, busy, stalled: occupant?.stall != null && occupant.stall !== "Aborted", colour: COLOURS[stage.key] };
    });
  });

  /** What the registers between the stages capture at the end of this cycle */
  public readonly fields = computed<Field[][]>(() => {
    const activity = this.activity();
    this.machine.state.values();
    const registers = this.machine.registers;
    const written = activity.written;
    const id = activity.stages.ID;
    const ex = activity.stages.intEX;
    const mem = activity.stages.MEM;
    // The result of the instruction in EX is kept for when it is in MEM (a side effect without signals: it only
    // remembers values)
    const alu = written.get("ALU");
    if (alu !== undefined && ex?.id != null && ex.stall === null) this.results.set(ex.id, alu);
    else if (alu !== undefined) {
      // A floating point unit that starts: its instruction is the one without a result yet
      const started = UNIT_KEYS.flatMap((unit) => activity.units[unit]).find((cell) => cell?.id != null && !this.results.has(cell.id));
      if (started?.id != null) this.results.set(started.id, alu);
    }
    if (this.results.size > 64) this.results.delete(this.results.keys().next().value as number);
    const imm = id?.decoded && id.decoded.def.format === "I" && id.stall === null ? id.decoded.imm : undefined;
    const memResult = mem?.id == null ? undefined : this.results.get(mem.id);
    const exAddress = written.get("DMAR");
    return [
      [
        { name: "NPC", y: 151, value: hex8(binaryValue(registers.IMAR.binary) + 4), changed: written.has("IMAR") },
        { name: "IR", y: 300, value: hex8(binaryValue(registers.IR.binary)), changed: written.has("IR") },
      ],
      [
        { name: "A", y: 232, value: hex8(binaryValue(registers.A.binary)), changed: written.has("A") },
        { name: "B", y: 320, value: hex8(binaryValue(registers.B.binary)), changed: written.has("B") },
        { name: "Imm", y: 413, value: hex8(imm), changed: imm !== undefined },
      ],
      [
        {
          name: exAddress === undefined ? "ALU" : "ALU/dir",
          y: 275,
          value: hex8(exAddress ?? binaryValue(registers.ALU.binary)),
          changed: written.has("ALU") || exAddress !== undefined,
        },
        { name: "B/SDR", y: 372, value: hex8(binaryValue(registers.SDR.binary)), changed: written.has("SDR") },
      ],
      [
        { name: "LMD", y: 300, value: hex8(binaryValue(registers.LDR.binary)), changed: written.has("LDR") },
        { name: "ALU", y: 450, value: hex8(memResult), changed: memResult !== undefined && mem?.stall === null },
      ],
    ];
  });

  /** The values inside the boxes: the PC, the instruction read, the branch, the registers and the memory used */
  public readonly boxes = computed(() => {
    const activity = this.activity();
    this.machine.state.values();
    const registers = this.machine.registers;
    const written = activity.written;
    const id = activity.stages.ID;
    const reads = id && id.stall === null && id.use ? [...id.use.intReads.map((r) => `R${r}`), ...id.use.fpReads.map((r) => `F${r}`)] : [];
    const read = activity.reads[0];
    const store = activity.stores[0];
    return {
      pc: { value: hex8(binaryValue(registers.PC.binary)), changed: written.has("PC") },
      fetched: written.has("IMAR") ? hex8(written.get("IMAR")) : null,
      branch: activity.branch ? { target: hex8(activity.branch.target), taken: activity.branch.taken } : null,
      reads: [...new Set(reads)].join(", "),
      writes: activity.writeBack.map((write) => ({ name: write.name, value: hex8(write.value) })),
      memory: read
        ? { kind: "read" as const, address: hex8(read.address), value: hex8(written.get("LDR")) }
        : store
          ? { kind: "write" as const, address: hex8(store.address), value: store.value.replace(/^0x/i, "").slice(0, 8) }
          : null,
      alu: ex(activity) ? hex8(written.get("ALU") ?? written.get("DMAR")) : null,
    };
  });

  /** The wires used in this cycle */
  public readonly active = computed<WireKey[]>(() => {
    const activity = this.activity();
    const written = activity.written;
    const { IF, ID, intEX, MEM, WB } = activity.stages;
    const working = (occupant: Occupant | null) => occupant !== null && occupant.stall === null;
    const keys: WireKey[] = [];
    const add = (...wires: WireKey[]) => keys.push(...wires);
    if (written.has("IR") && IF !== null) add("pcIm", "imIr", "pcAdd", "addNpc");
    if (activity.branch?.taken) add("btaMux", "muxPc");
    else if (written.has("IR") && IF !== null) add("npcMux", "muxPc");
    if (working(ID) && ID) {
      add("irRf");
      if (ID.decoded?.def.format === "I") add("irImm", "immEx");
      if (written.has("A") && ID.use?.intReads.includes(ID.decoded?.rs1 ?? -1)) add("rfA");
      if (written.has("B") && ID.use?.intReads.includes(ID.decoded?.rs2 ?? -1)) add("rfB");
      const control = ["branch", "fbranch", "jump", "jreg"].includes(ID.decoded?.def.syntax ?? "");
      if (control) add("npcBranch", "rfBranch");
    }
    if (ex(activity) && intEX) {
      add("aMux", "muxAluA", "aluOut");
      if (intEX.decoded?.def.format === "I") add("immMux", "muxAluB");
      else add("bMux", "muxAluB");
      if (written.has("SDR")) add("bStore");
    }
    if (working(MEM)) {
      if (activity.reads.length > 0) add("dmAddress", "dmRead");
      else if (activity.stores.length > 0) add("dmAddress", "dmWrite");
      else add("bypass");
    }
    if (working(WB) && activity.writeBack.length > 0) {
      const load = ["load", "fload"].includes(WB?.decoded?.def.syntax ?? "");
      add(load ? "lmdWb" : "aluWb", "wbRf");
    }
    for (const forward of activity.forwarding) {
      if (forward.from === "EX/MEM") add(forward.to === "ID" ? "fwdMemId" : "fwdMemEx");
      else add(forward.to === "ID" ? "fwdWbId" : "fwdWbEx");
    }
    return [...new Set(keys)];
  });

  /** The colour of a wire in use: the one of its stage (the forwarding, green) */
  public wireColour(key: WireKey): string {
    const stage = WIRES[key].stage;
    return stage === "forwarding" ? "var(--thumder-forwarding)" : COLOURS[stage];
  }

  /** The busy units of each kind of floating point unit */
  public unitCells(unit: UnitKey): (Occupant | null)[] {
    return this.activity().units[unit];
  }

  public slotWidth(unit: UnitKey): number {
    return UNIT_SLOTS_WIDTH / Math.max(1, this.unitCells(unit).length);
  }

  /** A floating point unit with an instruction */
  public readonly isBusy = (cell: Occupant | null): cell is Occupant => cell !== null;
}

/** The instruction in the integer EX works in this cycle (it computes a result or an address) */
function ex(activity: CycleActivity): boolean {
  const occupant = activity.stages.intEX;
  return occupant !== null && occupant.stall === null && (activity.written.has("ALU") || activity.written.has("DMAR"));
}
