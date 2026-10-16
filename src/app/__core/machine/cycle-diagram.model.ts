import type { TypeCycleCell, TypePipeline, TypePipelineStage, TypeStall } from "@app/Types";
import type { StallInfo } from "@core/engine/simulator";

/** What a cell of the diagram shows: the stage of the instruction in that cycle, or the stall that holds it */
export type DiagramLabel = TypePipelineStage | TypeStall;

/** An arrow of the diagram: a result forwarded from an instruction to another, or the cause of a stall */
export type DiagramArrow = { fromRow: number; fromCycle: number; toRow: number; toCycle: number; color: number };

/** Why an instruction is stalled in a cycle (EDU-01): `cause` is the row of the instruction that causes it */
export type DiagramStall = Omit<StallInfo, "row" | "cycle">;

const STAGES = ["IF", "ID", "intEX", "MEM", "WB"] as const;
const UNITS = ["faddEX", "fmultEX", "fdivEX"] as const;

/**
 * The cycle clock diagram as data (no PixiJS): one row per instruction fetched and, in each row, the stage (or the stall)
 * of the instruction in each cycle, with the reason of each stall. MachineService fills it cycle by cycle and the canvas
 * draws it. It keeps the last `limit` cycles (NUC-11, the history of WinDLX): the rows that only have older cycles go.
 *
 * The rows have two numbers: their id (the order in which the instructions were fetched, as the simulator numbers
 * them) and their index (their place among the rows kept). The methods take indexes; `firstRow` is the id of index 0.
 */
export class CycleDiagramModel {
  /** How many cycles it keeps */
  public limit = Number.POSITIVE_INFINITY;

  private readonly rowTexts: string[] = [];
  private readonly rowCells: Map<number, DiagramLabel>[] = [];
  private readonly rowStalls: Map<number, DiagramStall>[] = [];
  private readonly lastCycles: number[] = [];
  private arrowList: DiagramArrow[] = [];
  private added = 0;
  private dropped = 0;
  private start = 0;
  private cycleCount = 0;

  /** The instructions kept, in the order they were fetched */
  public get rows(): readonly string[] {
    return this.rowTexts;
  }

  /** The id of the first row kept */
  public get firstRow(): number {
    return this.dropped;
  }

  /** The first cycle kept */
  public get firstCycle(): number {
    return this.start;
  }

  /** The cycles run (the last one is `cycles - 1`) */
  public get cycles(): number {
    return this.cycleCount;
  }

  /** The arrows between the rows kept, with indexes */
  public get arrows(): readonly DiagramArrow[] {
    if (this.dropped === 0) return this.arrowList;
    return this.arrowList
      .filter((arrow) => arrow.fromRow >= this.dropped && arrow.toRow >= this.dropped)
      .map((arrow) => ({ ...arrow, fromRow: arrow.fromRow - this.dropped, toRow: arrow.toRow - this.dropped }));
  }

  public cell(row: number, cycle: number): DiagramLabel | undefined {
    return cycle < this.start ? undefined : this.rowCells[row]?.get(cycle);
  }

  /** The cells of a row, in the order of the cycles */
  public cellsOf(row: number): [cycle: number, label: DiagramLabel][] {
    return [...(this.rowCells[row] ?? new Map())].filter(([cycle]) => cycle >= this.start).sort(([a], [b]) => a - b);
  }

  /** Why the instruction of a row is stalled in a cycle, if it is */
  public stall(row: number, cycle: number): DiagramStall | undefined {
    return cycle < this.start ? undefined : this.rowStalls[row]?.get(cycle);
  }

  /** The text of the instruction of a row id (undefined if it is not kept) */
  public textOf(id: number): string | undefined {
    return this.rowTexts[id - this.dropped];
  }

  /** The index of a row id (-1 if it is not kept) */
  public indexOf(id: number): number {
    const index = id - this.dropped;
    return index >= 0 && index < this.rowTexts.length ? index : -1;
  }

  public reset(): void {
    this.rowTexts.length = 0;
    this.rowCells.length = 0;
    this.rowStalls.length = 0;
    this.lastCycles.length = 0;
    this.arrowList = [];
    this.added = 0;
    this.dropped = 0;
    this.start = 0;
    this.cycleCount = 0;
  }

  /** A new instruction (fetched in this cycle): a new row. Returns its id */
  public addInstruction(text: string): number {
    this.rowTexts.push(text);
    this.rowCells.push(new Map());
    this.rowStalls.push(new Map());
    this.lastCycles.push(-1);
    return this.added++;
  }

  /** Where each instruction is in a cycle: its stage, a floating point unit or a stall */
  public addCycle(pipeline: TypePipeline, cycle: number): void {
    for (const stage of STAGES) this.place(pipeline[stage], stage, cycle);
    for (const unit of UNITS) for (const cell of pipeline[unit] ?? []) this.place(cell, unit, cycle);
    this.cycleCount = Math.max(this.cycleCount, cycle + 1);
    this.trim();
  }

  public addArrow(arrow: DiagramArrow): void {
    this.arrowList.push(arrow);
  }

  public addStalls(stalls: readonly StallInfo[]): void {
    for (const { row, cycle, ...stall } of stalls) {
      const index = this.indexOf(row);
      if (index >= 0) this.rowStalls[index].set(cycle, stall);
    }
  }

  private place(cell: TypeCycleCell, stage: TypePipelineStage, cycle: number): void {
    if (cell.draw === false || cell.addressRow < 0 || cell.addressRow < this.dropped) return;
    // A row the diagram has not seen yet (it should not happen): it is created empty
    while (this.added <= cell.addressRow) this.addInstruction("");
    const index = cell.addressRow - this.dropped;
    this.rowCells[index].set(cycle, cell.draw === true ? stage : cell.draw);
    this.lastCycles[index] = Math.max(this.lastCycles[index], cycle);
  }

  /** Over the limit, the oldest cycles go, with the rows that have nothing newer */
  private trim(): void {
    if (this.cycleCount - this.start <= this.limit) return;
    this.start = this.cycleCount - this.limit;
    let gone = 0;
    while (gone < this.rowTexts.length && this.lastCycles[gone] < this.start) gone++;
    if (gone > 0) {
      this.rowTexts.splice(0, gone);
      this.rowCells.splice(0, gone);
      this.rowStalls.splice(0, gone);
      this.lastCycles.splice(0, gone);
      this.dropped += gone;
    }
    this.arrowList = this.arrowList.filter((arrow) => arrow.toCycle >= this.start && arrow.fromRow >= this.dropped);
  }
}
