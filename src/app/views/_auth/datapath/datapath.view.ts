import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import type { TypeStall } from "@app/Types";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

type Occupant = { text: string; stall: TypeStall | null };

/** The colours of the stages, as in the cycle clock diagram */
const COLOURS: Record<string, string> = {
  IF: "#ffff00",
  ID: "#ff9900",
  intEX: "#ff6666",
  faddEX: "#00ccff",
  fmultEX: "#3399ff",
  fdivEX: "#9966ff",
  MEM: "#00ff00",
  WB: "#ff00ff",
};

/** The colour of the arrows of forwarding of the simulator (simulator.ts) */
const FORWARDING = 0x00aa00;

/**
 * The datapath of the pipeline of THUMDER (EDU-05), drawn for its model: IF, ID (where the branches are resolved),
 * the integer EX and the floating point units, MEM and WB, with the registers between the stages and the paths of
 * forwarding. Each stage lights up with the instruction it has in this cycle (orange if it is stalled), and the
 * forwarding paths used in the cycle are drawn in green.
 */
@Component({
  selector: "view-datapath",
  templateUrl: "./datapath.view.html",
  styleUrls: ["./datapath.view.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardDirective, CardWidgetDirective, TranslatePipe],
})
export class DatapathView {
  private machine = inject(MachineService);

  public readonly colours = COLOURS;
  public readonly step = this.machine.state.step;
  public readonly forwardingEnabled = computed(() => {
    this.machine.state.loads();
    return this.machine.enabledForwarding;
  });

  /** What each stage has in this cycle */
  public readonly stages = computed(() => {
    const pipeline = this.machine.state.pipeline();
    const occupant = (cell: { text: string; draw: boolean | TypeStall } | undefined): Occupant | null =>
      cell && cell.draw !== false && cell.text ? { text: cell.text, stall: cell.draw === true ? null : cell.draw } : null;
    return {
      IF: occupant(pipeline?.IF),
      ID: occupant(pipeline?.ID),
      intEX: occupant(pipeline?.intEX),
      MEM: occupant(pipeline?.MEM),
      WB: occupant(pipeline?.WB),
      faddEX: (pipeline?.faddEX ?? []).map(occupant),
      fmultEX: (pipeline?.fmultEX ?? []).map(occupant),
      fdivEX: (pipeline?.fdivEX ?? []).map(occupant),
    };
  });

  /** The forwarding used in this cycle: where the value comes from (EX/MEM or MEM/WB) and where it goes (EX or ID) */
  public readonly forwarding = computed(() => {
    this.machine.state.diagram();
    const cycle = this.step();
    const diagram = this.machine.diagram;
    const used = { fromMem: false, fromWb: false, toId: false, texts: [] as string[] };
    for (const arrow of diagram.arrows) {
      if (arrow.color !== FORWARDING || arrow.toCycle !== cycle) continue;
      const producer = diagram.cell(arrow.fromRow, cycle);
      const consumer = diagram.cell(arrow.toRow, cycle);
      if (producer === "WB") used.fromWb = true;
      else used.fromMem = true;
      if (consumer === "ID") used.toId = true;
      used.texts.push(`${diagram.rows[arrow.fromRow] ?? ""} → ${diagram.rows[arrow.toRow] ?? ""}`);
    }
    return used;
  });

  /** A floating point unit with an instruction */
  public readonly isBusy = (cell: Occupant | null): cell is Occupant => cell !== null;

  public fill(stage: string, occupant: Occupant | null): string {
    if (occupant === null) return "#f4f4f4";
    return occupant.stall ? "#ffcf66" : COLOURS[stage];
  }

  /** The text of a box: the instruction, cut to fit */
  public short(text: string, length = 22): string {
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  }
}
