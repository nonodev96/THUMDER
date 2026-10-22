import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import type { TypeAddress } from "@app/Types";
import type { SnapshotSource, SnapshotUnit, SuperscalarSnapshot } from "@core/engine/superscalar";
import { type PoolKey, SIDES, type Side } from "@core/engine/superscalar-config";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";

const at = (pc: number) => `0x${(pc >>> 0).toString(16).toUpperCase().padStart(8, "0")}` as TypeAddress;

/** The name of a kind of unit in the translations: SUPERSCALAR.POOLS.INT_ALU... */
export const poolLabel = (pool: PoolKey | null) =>
  pool === null ? "SUPERSCALAR.POOLS.NONE" : `SUPERSCALAR.POOLS.${pool.replace(".", "_").toUpperCase()}`;

/** The state of a 2-bit counter of the BTB */
const COUNTER = ["SUPERSCALAR.BTB.STRONG_NOT", "SUPERSCALAR.BTB.WEAK_NOT", "SUPERSCALAR.BTB.WEAK_TAKEN", "SUPERSCALAR.BTB.STRONG_TAKEN"];

/**
 * The machine of SuperDLX in this cycle (WinSuperDLX shows each structure in a window of its own): the instruction
 * queue, the instruction windows with the operands each instruction waits for, the functional units, the reorder
 * buffers, the load and store buffers, the registers renamed and the branch target buffer. Everything is read from
 * the state of MachineService (`superscalar`): this view keeps nothing of its own.
 */
@Component({
  selector: "thumder-superscalar-machine",
  templateUrl: "./superscalar-machine.component.html",
  styleUrls: ["./superscalar-machine.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class SuperscalarMachineComponent {
  private machine = inject(MachineService);

  public readonly sides = SIDES;
  public readonly snapshot = this.machine.state.superscalar;
  public readonly stats = this.machine.state.superscalarStats;
  public readonly canSimulate = this.machine.state.canSimulate;
  public readonly parameters = computed(() => {
    this.machine.state.loads();
    return this.machine.superscalarParameters;
  });

  /** Instructions per cycle so far */
  public readonly ipc = computed(() => {
    const stats = this.stats();
    return stats && stats.cycles > 0 ? stats.instructions / stats.cycles : 0;
  });

  /** The units of each half */
  public readonly units = computed(() => {
    const snapshot = this.snapshot();
    const of = (side: Side) => snapshot?.units.filter((unit) => unit.pool.startsWith(`${side}.`)) ?? [];
    return { int: of("int"), fp: of("fp") };
  });

  /** The text of the instruction at an address (from the code loaded) */
  public text(pc: number): string {
    this.machine.state.code();
    return this.machine.code.get(at(pc))?.instruction ?? at(pc);
  }

  public address(value: number | undefined): string {
    return value === undefined ? "" : at(value);
  }

  public poolLabel(pool: PoolKey | null): string {
    return poolLabel(pool);
  }

  public busy(unit: SnapshotUnit): number {
    return unit.slots.filter((slot) => slot !== null).length;
  }

  /** Where an operand that is not ready comes from: the instruction and its ROB entry */
  public sourceTitle(source: SnapshotSource): string {
    return source.ready ? source.name : `${source.name} ← #${source.row} (ROB ${source.side === "fp" ? "FP" : "INT"} ${source.slot})`;
  }

  public counter(state: number): string {
    return COUNTER[state] ?? "";
  }

  public occupancy(used: number, size: number): number {
    return size > 0 ? Math.min(100, Math.round((used / size) * 100)) : 0;
  }

  public robOf(snapshot: SuperscalarSnapshot, side: Side) {
    return snapshot.rob[side];
  }
}
