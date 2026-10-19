import { ChangeDetectionStrategy, Component, computed, Input, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { type DescriptionLang, describe } from "@core/engine/describe";
import {
  type CycleActivity,
  cycleActivity,
  hex32,
  type Occupant,
  STAGE_KEYS,
  type StageKey,
  UNIT_KEYS,
  type UnitKey,
} from "@core/machine/cycle-activity";
import { MachineService } from "@core/machine/machine.service";
import { explainCell } from "@core/machine/stall-explanation";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { map } from "rxjs";

/**
 * A value of the cycle: a register of the pipeline or of the bank, or a word of the memory, and what it got (←) or has
 * (=), with a note (the register it was read from, the address...)
 */
type Value = { name: string; value: string; note?: string; arrow?: "←" | "=" };

/** What a stage (or a floating point unit) does in this cycle */
type StageLine = {
  key: string;
  name: string;
  /** The class with the colour of the stage (styles.scss) */
  colour: string;
  occupant: Occupant | null;
  /** What it does (the description of the instruction for this stage), or why it is stalled */
  texts: string[];
  values: Value[];
};

const NAMES: Record<StageKey, string> = { IF: "IF", ID: "ID", intEX: "EX", MEM: "MEM", WB: "WB" };
const COLOURS: Record<StageKey, string> = { IF: "stage-IF", ID: "stage-ID", intEX: "stage-intEX", MEM: "stage-MEM", WB: "stage-WB" };
/** The stage of the description of an instruction (describe.ts) for each stage of the pipeline */
const DESCRIBED: Record<StageKey | UnitKey, string> = {
  IF: "IF",
  ID: "ID",
  intEX: "EX",
  MEM: "MEM",
  WB: "WB",
  faddEX: "faddEX",
  fmultEX: "fmultEX",
  fdivEX: "fdivEX",
};

/** An integer register in hexadecimal and, if it is small, in decimal */
const withDecimal = (value: number) => {
  const signed = value | 0;
  return Math.abs(signed) < 1_000_000 ? `${hex32(value)} (${signed})` : hex32(value);
};

/**
 * What each stage of the pipeline does in this cycle, one line each (as the stages of an instruction in the footer of
 * the code): the instruction, what the stage does with it (its description, or why it is stalled) and the values it
 * moves (the registers of the pipeline it writes, the registers of the bank it reads or writes, the memory it reads or
 * writes). Then the floating point units with an instruction and the forwarding used. For the footers of the pipeline
 * and of the datapath.
 */
@Component({
  selector: "thumder-pipeline-stages",
  templateUrl: "./pipeline-stages.component.html",
  styleUrls: ["./pipeline-stages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class PipelineStagesComponent {
  private machine = inject(MachineService);
  private translate = inject(TranslateService);

  /** The floating point units are listed (the datapath also draws them) */
  @Input() public units = true;

  private readonly lang = toSignal(this.translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es",
  });

  /** The labels of the program by address, to name the targets and the data */
  private readonly labels = computed(() => {
    const labels = new Map<number, string>();
    for (const symbol of this.machine.state.symbols()) {
      const address = Number.parseInt(symbol.address, 16) >>> 0;
      if (!labels.has(address)) labels.set(address, symbol.name);
    }
    return labels;
  });

  public readonly step = this.machine.state.step;

  public readonly activity = computed<CycleActivity>(() => {
    this.machine.state.diagram();
    return cycleActivity(this.machine.state.pipeline(), this.machine.state.cycle(), this.machine.diagram, (address) => {
      const code = this.machine.code.get(address as `0x${string}`);
      return code ? Number.parseInt(code.code, 16) >>> 0 : null;
    });
  });

  public readonly lines = computed<StageLine[]>(() => {
    const activity = this.activity();
    this.lang();
    const lines: StageLine[] = STAGE_KEYS.map((key) => ({
      key,
      name: NAMES[key],
      colour: COLOURS[key],
      occupant: activity.stages[key],
      texts: this.texts(key, activity.stages[key], activity.step),
      values: this.values(key, activity),
    }));
    if (!this.units) return lines;
    for (const unit of UNIT_KEYS) {
      const cells = activity.units[unit];
      cells.forEach((occupant, index) => {
        if (occupant === null) return;
        lines.push({
          key: `${unit}-${index}`,
          name: cells.length > 1 ? `${unit} ${index + 1}` : unit,
          colour: `${unit}_1`,
          occupant,
          texts: this.texts(unit, occupant, activity.step),
          values: [],
        });
      });
    }
    return lines;
  });

  /** What a stage does with its instruction, or why it waits */
  private texts(stage: StageKey | UnitKey, occupant: Occupant | null, step: number): string[] {
    if (occupant === null) return [];
    if (occupant.stall !== null && occupant.id !== null) {
      const diagram = this.machine.diagram;
      const row = diagram.indexOf(occupant.id);
      if (row >= 0) {
        return explainCell(diagram, row, step, this.machine.enabledForwarding).map((text) => this.translate.instant(text.key, text.params));
      }
    }
    if (occupant.decoded === null || occupant.address === null) return [];
    const lang: DescriptionLang = this.lang() === "en" ? "en" : "es";
    const description = describe(occupant.decoded, { address: occupant.address, labels: this.labels(), lang });
    const text = description.stages.find((item) => item.stage === DESCRIBED[stage])?.text;
    return text ? [text] : [];
  }

  /** The values a stage moves in this cycle */
  private values(stage: StageKey, activity: CycleActivity): Value[] {
    const occupant = activity.stages[stage];
    if (occupant === null || occupant.stall !== null) return [];
    const written = activity.written;
    const value = (name: string, shown = name): Value[] => {
      const number = written.get(name);
      return number === undefined ? [] : [{ name: shown, value: hex32(number) }];
    };
    switch (stage) {
      case "IF":
        return [...value("IR"), ...value("PC")];
      case "ID": {
        const values: Value[] = [];
        const decoded = occupant.decoded;
        const reads = occupant.use?.intReads ?? [];
        if (decoded && reads.includes(decoded.rs1) && written.has("A")) {
          values.push({ name: "A", value: `R${decoded.rs1} = ${withDecimal(written.get("A") as number)}` });
        }
        if (decoded && reads.includes(decoded.rs2) && written.has("B")) {
          values.push({ name: "B", value: `R${decoded.rs2} = ${withDecimal(written.get("B") as number)}` });
        }
        for (const register of occupant.use?.fpReads ?? []) {
          values.push({ name: `F${register}`, value: hex32(Number.parseInt(this.machine.registers.F[register].binary, 2)), arrow: "=" });
        }
        if (activity.branch) {
          values.push({
            name: "BTA",
            value: hex32(activity.branch.target),
            note: this.translate.instant(activity.branch.taken ? "STAGES.TAKEN" : "STAGES.NOT_TAKEN"),
          });
        }
        return values;
      }
      case "intEX":
        return [...value("DMAR"), ...value("SDR"), ...(written.has("DMAR") ? [] : value("ALU"))];
      case "MEM":
        return [
          ...activity.reads.map((read) => ({
            name: "LDR",
            value: hex32(written.get("LDR") ?? 0),
            note: `Mem[${hex32(read.address)}], ${this.translate.instant("STAGES.BYTES", { count: read.bytes })}`,
          })),
          ...activity.stores.map((store) => ({
            name: `Mem[${hex32(store.address)}]`,
            value: `0x${store.value.replace(/^0x/i, "")}`,
            note: this.translate.instant("STAGES.BYTES", { count: store.bytes }),
          })),
        ];
      case "WB":
        return activity.writeBack.map((write) => ({
          name: write.name,
          value: write.name.startsWith("R") ? withDecimal(write.value) : hex32(write.value),
        }));
    }
  }
}
