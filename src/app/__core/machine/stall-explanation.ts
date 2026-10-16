import type { CycleDiagramModel } from "@core/machine/cycle-diagram.model";

/** A text of the translations (MACHINE.EXPLAIN_*) and its parameters */
export type Explanation = { key: string; params: Record<string, string | number> };

/**
 * What a cell of the cycle clock diagram means (EDU-01): the stage of the instruction or, for a stall, why it waits:
 * the register and the instruction that produces it, and whether forwarding would have avoided it. `forwarding` is
 * whether the simulation runs with forwarding. Returns the texts to show, in order, or [] for an empty cell
 */
export function explainCell(diagram: CycleDiagramModel, row: number, cycle: number, forwarding: boolean): Explanation[] {
  const label = diagram.cell(row, cycle);
  if (label === undefined) return [];
  const instruction = diagram.rows[row] || `#${diagram.firstRow + row}`;
  const stall = diagram.stall(row, cycle);
  if (stall === undefined) {
    const stalled = ["R-Stall", "W-Stall", "S-Stall", "T-Stall", "Stall", "Aborted"].includes(label);
    return [{ key: stalled ? "MACHINE.EXPLAIN_STALL" : "MACHINE.EXPLAIN_STAGE", params: { instruction, stage: label, cycle } }];
  }
  const cause = stall.cause === undefined ? "" : (diagram.textOf(stall.cause) ?? `#${stall.cause}`);
  const params = { instruction, cause, register: stall.register ?? "", cycle, label: stall.label };
  const texts: Explanation[] = [{ key: `MACHINE.EXPLAIN_${stall.kind.toUpperCase()}`, params }];
  if (stall.kind === "raw") {
    if (forwarding) texts.push({ key: "MACHINE.EXPLAIN_RAW_REAL", params });
    else if (stall.forwardingHelps) texts.push({ key: "MACHINE.EXPLAIN_RAW_FORWARDING_HELPS", params });
    else texts.push({ key: "MACHINE.EXPLAIN_RAW_NOT_YET", params });
  }
  return texts;
}

/** The stalls kept in the diagram, in order of cycle and row, as [row, cycle] */
export function stallCells(diagram: CycleDiagramModel): [row: number, cycle: number][] {
  const cells: [number, number][] = [];
  for (let row = 0; row < diagram.rows.length; row++) {
    for (const [cycle, label] of diagram.cellsOf(row)) {
      if (
        label === "R-Stall" ||
        label === "W-Stall" ||
        label === "S-Stall" ||
        label === "T-Stall" ||
        label === "Stall" ||
        label === "Aborted"
      ) {
        cells.push([row, cycle]);
      }
    }
  }
  return cells.sort(([rowA, cycleA], [rowB, cycleB]) => cycleA - cycleB || rowA - rowB);
}
