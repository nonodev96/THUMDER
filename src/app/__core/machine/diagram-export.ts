import type { CycleDiagramModel } from "@core/machine/cycle-diagram.model";
import { cssColour, LABEL_COLOURS } from "@core/services/theme/palette";

// The cycle clock diagram for the reports of the practicals (EDU-06): a table (CSV) and a drawing (SVG), of every cycle
// it keeps, with the colours of the canvas (the variables of theme.scss, as in the light theme: a white sheet)

/** A field of CSV: in quotes when it has a separator, a quote or a line break */
const field = (value: string | number) => {
  const text = String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const cycles = (diagram: CycleDiagramModel) =>
  Array.from({ length: Math.max(0, diagram.cycles - diagram.firstCycle) }, (_, i) => diagram.firstCycle + i);

/** One row per instruction and one column per cycle, with the stage or the stall */
export function diagramToCsv(diagram: CycleDiagramModel): string {
  const columns = cycles(diagram);
  const lines = [["Instruction", ...columns].map(field).join(",")];
  diagram.rows.forEach((text, row) => {
    lines.push([text, ...columns.map((cycle) => diagram.cell(row, cycle) ?? "")].map(field).join(","));
  });
  return `${lines.join("\n")}\n`;
}

const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The diagram as a drawing: the instructions on the left, the cycles above, the cells and the arrows */
export function diagramToSvg(diagram: CycleDiagramModel): string {
  const labelText = cssColour("diagram-label-text", "#1e1b4b");
  const cellText = cssColour("on-stage", "#0f172a");
  const [left, top, column, row, cellWidth, cellHeight] = [200, 50, 60, 28, 54, 22];
  const columns = cycles(diagram);
  const width = left + columns.length * column + 10;
  const height = top + diagram.rows.length * row + 10;
  const x = (cycle: number) => left + (cycle - diagram.firstCycle) * column + (column - cellWidth) / 2;
  const y = (index: number) => top + index * row + (row - cellHeight) / 2;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, sans-serif" font-size="12">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
  ];
  for (const cycle of columns) {
    parts.push(`<text x="${x(cycle) + cellWidth / 2}" y="${top - 18}" text-anchor="middle" fill="${labelText}">${cycle}</text>`);
  }
  diagram.rows.forEach((text, index) => {
    parts.push(`<text x="8" y="${y(index) + cellHeight / 2 + 4}" fill="${labelText}">${escapeXml(text)}</text>`);
    for (const [cycle, label] of diagram.cellsOf(index)) {
      parts.push(
        `<rect x="${x(cycle)}" y="${y(index)}" width="${cellWidth}" height="${cellHeight}" rx="4" fill="${cssColour(LABEL_COLOURS[label])}" stroke="${cellText}" stroke-opacity="0.25"/>`,
        `<text x="${x(cycle) + cellWidth / 2}" y="${y(index) + cellHeight / 2 + 4}" text-anchor="middle" fill="${cellText}">${escapeXml(label)}</text>`,
      );
    }
  });
  for (const arrow of diagram.arrows) {
    if (arrow.fromCycle < diagram.firstCycle) continue;
    const colour = `#${arrow.color.toString(16).padStart(6, "0")}`;
    parts.push(
      `<line x1="${x(arrow.fromCycle) + cellWidth / 2 + 10}" y1="${y(arrow.fromRow) + cellHeight / 2 + 4}" x2="${x(arrow.toCycle) + cellWidth / 2 - 10}" y2="${y(arrow.toRow) + cellHeight / 2 - 4}" stroke="${colour}" stroke-width="2" marker-end="url(#arrow)"/>`,
    );
  }
  parts.splice(
    2,
    0,
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>',
  );
  parts.push("</svg>");
  return parts.join("\n");
}
