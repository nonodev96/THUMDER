import type { TypePipelineCellInstruction, TypePipelineInstructions } from "@app/Types";
import { PIXI } from "@core/machine/pixi";
import { cssColourNumber } from "@core/services/theme/palette";

export type ColorType = number;

export type CoordsType = {
  x: number;
  y: number;
};

type StageKey = "IF" | "ID" | "intEX" | "MEM" | "WB";
type UnitKey = "faddEX" | "fmultEX" | "fdivEX";

/** The floating point units of each kind: how many and how many cycles each one takes */
export type PipelineUnits = Record<UnitKey, { count: number; delay: number }>;

/** The texts of the drawing, in the language of the interface */
export type PipelineLabels = {
  /** What each stage does (Búsqueda, Decodificación...) */
  stages: Record<StageKey, string>;
  empty: string;
  registers: string;
  /** The units of a kind: «×2, 5 ciclos» */
  units: (count: number, cycles: number) => string;
};

/** How a cycle is drawn: how long the instructions take to go to their new place (0: at once) and, for the floating
 * point units, the cycle of its unit each instruction is in */
export type PipelineStepOptions = { duration: number; progress?: ReadonlyMap<number, number> };

const SANS = ["Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"];
const MONO = ["JetBrains Mono", "Fira Code", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "DejaVu Sans Mono", "monospace"];

// The geometry, in units of the drawing (the component scales it to the card)
const MARGIN = 24;
const BOX_WIDTH = 176;
const BOX_HEIGHT = 112;
const HEADER = 30;
const EX_WIDTH = 196;
const GAP = 52;
const TOP = 28;
const UNIT_HEIGHT = 64;
const UNIT_GAP = 8;
const GROUP_LABEL = 22;
const GROUP_GAP = 14;
const TOKEN_WIDTH = 156;
const TOKEN_HEIGHT = 32;
const UNIT_TOKEN_WIDTH = 150;
const UNIT_TOKEN_HEIGHT = 26;

const COLUMNS: Record<StageKey, number> = (() => {
  const IF = 64;
  const ID = IF + BOX_WIDTH + GAP;
  const intEX = ID + BOX_WIDTH + GAP;
  const MEM = intEX + EX_WIDTH + GAP;
  const WB = MEM + BOX_WIDTH + GAP;
  return { IF, ID, intEX, MEM, WB };
})();
const BUS_LEFT = COLUMNS.ID + BOX_WIDTH + GAP / 2;
const BUS_RIGHT = COLUMNS.intEX + EX_WIDTH + GAP / 2;
const ROW_Y = TOP + HEADER + 32;

const STAGES: StageKey[] = ["IF", "ID", "intEX", "MEM", "WB"];
const UNITS: UnitKey[] = ["faddEX", "fmultEX", "fdivEX"];
const STAGE_NAMES: Record<StageKey, string> = { IF: "IF", ID: "ID", intEX: "EX", MEM: "MEM", WB: "WB" };
const COLOUR_NAMES: Record<StageKey | UnitKey, string> = {
  IF: "stage-if",
  ID: "stage-id",
  intEX: "stage-ex",
  MEM: "stage-mem",
  WB: "stage-wb",
  faddEX: "stage-fadd",
  fmultEX: "stage-fmult",
  fdivEX: "stage-fdiv",
};

/** A place of the drawing where an instruction can be: a stage or a floating point unit */
type Slot = {
  key: string;
  kind: StageKey | UnitKey;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where its instruction goes */
  centre: CoordsType;
};

/** The colours of the theme (theme.scss), read again with each theme */
function palette() {
  return {
    surface: cssColourNumber("surface", "#ffffff"),
    surface2: cssColourNumber("surface-2", "#f8fafc"),
    border: cssColourNumber("border", "#e2e8f0"),
    borderStrong: cssColourNumber("border-strong", "#cbd5e1"),
    text: cssColourNumber("text", "#0f172a"),
    text2: cssColourNumber("text-2", "#334155"),
    muted: cssColourNumber("muted", "#475569"),
    onStage: cssColourNumber("on-stage", "#0f172a"),
    stall: cssColourNumber("stall-r", "#f59e0b"),
    stallSoft: cssColourNumber("stall-w", "#fcd34d"),
    aborted: cssColourNumber("stage-aborted", "#cbd5e1"),
    primary: cssColourNumber("primary", "#4f46e5"),
    dark: document.documentElement.dataset.theme === "dark",
    stage: (kind: StageKey | UnitKey) => cssColourNumber(COLOUR_NAMES[kind], "#cccccc"),
  };
}

type Palette = ReturnType<typeof palette>;

/** A colour between two (t from 0 to 1) */
function mix(a: number, b: number, t: number): number {
  const channel = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** A text that stays smooth when the drawing is scaled (pixi.ts makes the textures NEAREST, for the pixel art) */
function smoothText(value: string, style: Partial<PIXI.ITextStyle>, resolution: number): PIXI.Text {
  const text = new PIXI.Text(value, style);
  text.resolution = resolution;
  text.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
  return text;
}

/** An instruction: a pill with its text, that slides from stage to stage */
class Token extends PIXI.Container {
  private readonly pill = new PIXI.Graphics();
  private readonly label: PIXI.Text;
  private readonly badge = new PIXI.Container();
  private readonly badgeBack = new PIXI.Graphics();
  private readonly badgeText: PIXI.Text;
  private readonly strike = new PIXI.Graphics();
  public slot = "";
  /** The animation: the points it goes through, and when it started */
  public path: CoordsType[] = [];
  public start = 0;
  public duration = 0;
  public fade: "in" | "out" | null = null;
  public gone = false;

  constructor(resolution: number) {
    super();
    this.label = smoothText("", { fontFamily: MONO, fontSize: 14, fontWeight: "700", fill: 0x0f172a }, resolution);
    this.label.anchor.set(0.5);
    this.badgeText = smoothText("", { fontFamily: MONO, fontSize: 10, fontWeight: "700", fill: 0x0f172a }, resolution);
    this.badgeText.anchor.set(0.5);
    this.badge.addChild(this.badgeBack, this.badgeText);
    this.addChild(this.pill, this.label, this.strike, this.badge);
  }

  public set(text: string, stall: string | null, colour: number, width: number, height: number, colours: Palette): void {
    const aborted = stall === "Aborted";
    const fill = aborted ? colours.aborted : stall ? colours.stallSoft : colour;
    this.pill.clear();
    // The shadow, then the pill
    this.pill
      .beginFill(0x000000, colours.dark ? 0.35 : 0.12)
      .drawRoundedRect(-width / 2, -height / 2 + 2, width, height, height / 2)
      .endFill();
    this.pill
      .lineStyle(stall && !aborted ? 2.5 : 1.5, stall && !aborted ? colours.stall : mix(fill, 0x0f172a, 0.45), 1)
      .beginFill(fill)
      .drawRoundedRect(-width / 2, -height / 2, width, height, height / 2)
      .endFill();
    // The assembler separates the operands with tabs: one space
    const clean = text.replace(/\s+/g, " ").trim();
    const max = Math.floor((width - 20) / (height > 28 ? 8.6 : 7.6));
    this.label.text = clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
    this.label.style.fontSize = height > 28 ? 14 : 12;
    this.label.style.fill = colours.onStage;
    this.strike.clear();
    if (aborted) {
      this.strike
        .lineStyle(1.5, colours.onStage, 0.8)
        .moveTo(-this.label.width / 2, 0)
        .lineTo(this.label.width / 2, 0);
    }
    this.badge.visible = stall !== null;
    if (stall !== null) {
      this.badgeText.text = stall;
      this.badgeText.style.fill = colours.onStage;
      const badgeWidth = this.badgeText.width + 12;
      this.badgeBack.clear();
      this.badgeBack
        .lineStyle(1.5, colours.surface, 1)
        .beginFill(aborted ? colours.aborted : colours.stall)
        .drawRoundedRect(-badgeWidth / 2, -8, badgeWidth, 16, 8)
        .endFill();
      this.badge.position.set(width / 2 - badgeWidth / 2 + 4, -height / 2 - 4);
    }
  }

  public setResolution(resolution: number): void {
    this.label.resolution = resolution;
    this.badgeText.resolution = resolution;
  }

  /** Where it is at `now` of its animation; returns whether it is still moving */
  public step(now: number): boolean {
    if (this.path.length === 0) return false;
    const t = this.duration <= 0 ? 1 : Math.min(1, (now - this.start) / this.duration);
    const eased = ease(t);
    // Along the path, by its length
    const lengths = this.path.slice(1).map((point, i) => Math.hypot(point.x - this.path[i].x, point.y - this.path[i].y));
    const total = lengths.reduce((sum, length) => sum + length, 0);
    let distance = eased * total;
    let i = 0;
    while (i < lengths.length - 1 && distance > lengths[i]) distance -= lengths[i++];
    const from = this.path[i];
    const to = this.path[Math.min(i + 1, this.path.length - 1)];
    const part = lengths[i] ? distance / lengths[i] : 1;
    this.position.set(from.x + (to.x - from.x) * part, from.y + (to.y - from.y) * part);
    if (this.fade === "in") this.alpha = eased;
    if (this.fade === "out") this.alpha = 1 - eased;
    if (t >= 1) {
      this.path = [];
      if (this.fade === "out") this.gone = true;
      this.fade = null;
      return false;
    }
    return true;
  }
}

/**
 * The pipeline of THUMDER (PixiJS), from left to right: IF, ID, EX (the integer unit and, under it, the floating point
 * units of the configuration), MEM and WB. Each box has the colour of its stage when it has an instruction, and the
 * instructions are pills that keep their place in the drawing: with each cycle they slide to their new stage along the
 * wires (from ID down to a floating point unit, from it up to MEM), the new one comes in from the left and the one that
 * leaves WB goes out on the right. A stalled instruction is striped, with its stall; an aborted one, crossed out.
 * The colours follow the theme and the texts of the instructions are monospace.
 */
export class PixiTHUMDER_Pipeline extends PIXI.Container {
  private readonly boxes = new PIXI.Graphics();
  private readonly wires = new PIXI.Graphics();
  private readonly flows = new PIXI.Graphics();
  private readonly texts = new PIXI.Container();
  private readonly tokenLayer = new PIXI.Container();
  private readonly tokens = new Map<number | string, Token>();
  private readonly addressTexts = new Map<string, PIXI.Text>();
  private readonly emptyTexts = new Map<string, PIXI.Text>();
  private readonly progressTexts = new Map<string, PIXI.Text>();
  private slots: Slot[] = [];
  private units: PipelineUnits;
  private labels: PipelineLabels;
  private colours: Palette = palette();
  private resolution = 2;
  /** What each place has in this cycle */
  private occupied = new Map<string, { cell: TypePipelineCellInstruction; progress?: number }>();
  /** The wires the instructions went along in this cycle, lit while they move */
  private moves: CoordsType[][] = [];
  private moveStart = 0;
  private moveDuration = 0;

  constructor(units: PipelineUnits, labels: PipelineLabels) {
    super();
    this.units = units;
    this.labels = labels;
    this.addChild(this.wires, this.flows, this.boxes, this.texts, this.tokenLayer);
    this.layout();
  }

  public draw(): PIXI.Container {
    return this;
  }

  /** A new configuration, theme or language: everything is drawn again (the instructions stay where they are) */
  public reset(units: PipelineUnits, labels: PipelineLabels): void {
    this.units = units;
    this.labels = labels;
    for (const token of this.tokens.values()) token.destroy({ children: true });
    this.tokens.clear();
    this.tokenLayer.removeChildren();
    this.occupied.clear();
    this.moves = [];
    this.layout();
  }

  /** The texts are drawn with this many pixels per unit (sharp when the drawing is zoomed) */
  public setResolution(resolution: number): void {
    if (Math.abs(resolution - this.resolution) < 0.25) return;
    this.resolution = resolution;
    for (const child of this.texts.children) if (child instanceof PIXI.Text) child.resolution = resolution;
    for (const token of this.tokens.values()) token.setResolution(resolution);
  }

  private text(value: string, style: Partial<PIXI.ITextStyle>, x: number, y: number, anchor: [number, number] = [0, 0]): PIXI.Text {
    const text = smoothText(value, { fontFamily: SANS, fontSize: 12, fill: this.colours.text, ...style }, this.resolution);
    text.anchor.set(...anchor);
    text.position.set(x, y);
    this.texts.addChild(text);
    return text;
  }

  /** The places, the wires and the names */
  private layout(): void {
    this.colours = palette();
    for (const child of this.texts.removeChildren()) child.destroy();
    this.addressTexts.clear();
    this.emptyTexts.clear();
    this.progressTexts.clear();
    this.slots = STAGES.map((kind) => {
      const width = kind === "intEX" ? EX_WIDTH : BOX_WIDTH;
      const x = COLUMNS[kind];
      return { key: kind, kind, index: 0, x, y: TOP, width, height: BOX_HEIGHT, centre: { x: x + width / 2, y: ROW_Y } };
    });
    let y = TOP + BOX_HEIGHT + 34;
    const groups: { kind: UnitKey; y: number }[] = [];
    for (const kind of UNITS) {
      const { count } = this.units[kind];
      if (count <= 0) continue;
      groups.push({ kind, y });
      y += GROUP_LABEL;
      for (let index = 0; index < count; index++) {
        this.slots.push({
          key: `${kind}-${index}`,
          kind,
          index,
          x: COLUMNS.intEX,
          y,
          width: EX_WIDTH,
          height: UNIT_HEIGHT,
          centre: { x: COLUMNS.intEX + EX_WIDTH / 2, y: y + 39 },
        });
        y += UNIT_HEIGHT + UNIT_GAP;
      }
      y += GROUP_GAP;
    }

    // The names of the boxes and of the groups of units
    for (const slot of this.slots) {
      if (slot.kind === "faddEX" || slot.kind === "fmultEX" || slot.kind === "fdivEX") {
        this.text(
          `${slot.kind} ${slot.index + 1}`,
          { fontFamily: MONO, fontSize: 11, fontWeight: "700", fill: this.colours.onStage },
          slot.x + 12,
          slot.y + 11,
          [0, 0.5],
        );
        this.progressTexts.set(
          slot.key,
          this.text("", { fontFamily: MONO, fontSize: 10.5, fill: this.colours.onStage }, slot.x + slot.width - 10, slot.y + 11, [1, 0.5]),
        );
        this.emptyTexts.set(
          slot.key,
          this.text(
            this.labels.empty,
            { fontSize: 11, fontStyle: "italic", fill: this.colours.muted },
            slot.centre.x,
            slot.centre.y,
            [0.5, 0.5],
          ),
        );
        continue;
      }
      const stage = slot.kind as StageKey;
      const name = this.text(
        STAGE_NAMES[stage],
        { fontSize: 14, fontWeight: "800", fill: this.colours.onStage },
        slot.x + 12,
        slot.y + HEADER / 2,
        [0, 0.5],
      );
      this.text(
        this.labels.stages[stage],
        { fontSize: 11.5, fill: this.colours.onStage },
        name.x + name.width + 8,
        slot.y + HEADER / 2 + 0.5,
        [0, 0.5],
      );
      this.addressTexts.set(
        slot.key,
        this.text("", { fontFamily: MONO, fontSize: 10.5, fill: this.colours.muted }, slot.centre.x, slot.y + slot.height - 12, [0.5, 0.5]),
      );
      this.emptyTexts.set(
        slot.key,
        this.text(
          this.labels.empty,
          { fontSize: 12, fontStyle: "italic", fill: this.colours.muted },
          slot.centre.x,
          slot.centre.y,
          [0.5, 0.5],
        ),
      );
    }
    for (const group of groups) {
      const { count, delay } = this.units[group.kind];
      this.text(
        group.kind,
        { fontFamily: MONO, fontSize: 12, fontWeight: "700", fill: this.colours.text2 },
        COLUMNS.intEX + 2,
        group.y + 8,
        [0, 0.5],
      );
      this.text(
        this.labels.units(count, delay),
        { fontSize: 11, fill: this.colours.muted },
        COLUMNS.intEX + EX_WIDTH,
        group.y + 8,
        [1, 0.5],
      );
    }
    this.text("PC", { fontFamily: MONO, fontSize: 12, fontWeight: "700", fill: this.colours.text2 }, MARGIN + 10, ROW_Y - 16, [0.5, 0.5]);
    const end = COLUMNS.WB + BOX_WIDTH;
    this.text(
      this.labels.registers,
      { fontSize: 11, fill: this.colours.muted, wordWrap: true, wordWrapWidth: 64, align: "center" },
      end + 32,
      ROW_Y + 10,
      [0.5, 0],
    );
    this.drawWires(end);
    this.drawBoxes();
  }

  private unitSlots(): Slot[] {
    return this.slots.filter(
      (slot) => slot.kind !== "IF" && slot.kind !== "ID" && slot.kind !== "intEX" && slot.kind !== "MEM" && slot.kind !== "WB",
    );
  }

  private drawWires(end: number): void {
    const g = this.wires;
    const ink = this.colours.borderStrong;
    g.clear();
    const arrow = (from: CoordsType, to: CoordsType) => {
      g.lineStyle(2.5, ink, 1).moveTo(from.x, from.y).lineTo(to.x, to.y);
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      g.lineStyle(0)
        .beginFill(ink)
        .drawPolygon([
          to.x,
          to.y,
          to.x - 10 * Math.cos(angle - 0.45),
          to.y - 10 * Math.sin(angle - 0.45),
          to.x - 10 * Math.cos(angle + 0.45),
          to.y - 10 * Math.sin(angle + 0.45),
        ])
        .endFill();
    };
    const line = (points: CoordsType[]) => {
      g.lineStyle(2.5, ink, 1).moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) g.lineTo(point.x, point.y);
    };
    arrow({ x: MARGIN, y: ROW_Y }, { x: COLUMNS.IF, y: ROW_Y });
    arrow({ x: COLUMNS.IF + BOX_WIDTH, y: ROW_Y }, { x: COLUMNS.ID, y: ROW_Y });
    arrow({ x: COLUMNS.ID + BOX_WIDTH, y: ROW_Y }, { x: COLUMNS.intEX, y: ROW_Y });
    arrow({ x: COLUMNS.intEX + EX_WIDTH, y: ROW_Y }, { x: COLUMNS.MEM, y: ROW_Y });
    arrow({ x: COLUMNS.MEM + BOX_WIDTH, y: ROW_Y }, { x: COLUMNS.WB, y: ROW_Y });
    arrow({ x: end, y: ROW_Y }, { x: end + 60, y: ROW_Y });
    const units = this.unitSlots();
    if (units.length > 0) {
      const last = units[units.length - 1].centre.y;
      // From ID to each unit, and from each unit to MEM
      line([
        { x: BUS_LEFT, y: ROW_Y },
        { x: BUS_LEFT, y: last },
      ]);
      line([
        { x: BUS_RIGHT, y: last },
        { x: BUS_RIGHT, y: ROW_Y },
      ]);
      for (const slot of units) {
        arrow({ x: BUS_LEFT, y: slot.centre.y }, { x: slot.x, y: slot.centre.y });
        line([
          { x: slot.x + slot.width, y: slot.centre.y },
          { x: BUS_RIGHT, y: slot.centre.y },
        ]);
      }
      g.lineStyle(0).beginFill(ink).drawCircle(BUS_LEFT, ROW_Y, 4).drawCircle(BUS_RIGHT, ROW_Y, 4).endFill();
    }
  }

  /** The boxes: lit with the colour of their stage when they have an instruction (striped amber if it is stalled) */
  private drawBoxes(): void {
    const g = this.boxes;
    const colours = this.colours;
    g.clear();
    for (const slot of this.slots) {
      const here = this.occupied.get(slot.key);
      const colour = colours.stage(slot.kind);
      const stalled = here !== undefined && here.cell.draw !== true && here.cell.draw !== "Aborted";
      const unit = slot.height === UNIT_HEIGHT;
      const header = unit ? 22 : HEADER;
      // The shadow and the box
      g.lineStyle(0)
        .beginFill(0x000000, colours.dark ? 0.3 : 0.07)
        .drawRoundedRect(slot.x, slot.y + 3, slot.width, slot.height, 12)
        .endFill();
      g.lineStyle(here ? 2.5 : 1.5, here ? (stalled ? colours.stall : mix(colour, colours.text, 0.35)) : colours.borderStrong, 1)
        .beginFill(here ? mix(colours.surface, colour, colours.dark ? 0.22 : 0.16) : colours.surface)
        .drawRoundedRect(slot.x, slot.y, slot.width, slot.height, 12)
        .endFill();
      // The header, with the colour of the stage (paler when it is empty)
      const headerColour = here ? colour : mix(colours.surface, colour, colours.dark ? 0.55 : 0.45);
      g.lineStyle(0)
        .beginFill(headerColour)
        .drawRoundedRect(slot.x + 1.5, slot.y + 1.5, slot.width - 3, header, 10.5)
        .endFill();
      g.beginFill(headerColour)
        .drawRect(slot.x + 1.5, slot.y + header / 2, slot.width - 3, header / 2 + 1.5)
        .endFill();
      // The progress of the instruction in its floating point unit
      const progress = here?.progress;
      const delay = unit ? this.units[slot.kind as UnitKey].delay : 0;
      if (unit && progress !== undefined && delay > 0) {
        const width = slot.width - 24;
        g.beginFill(colours.border)
          .drawRoundedRect(slot.x + 12, slot.y + slot.height - 7, width, 4, 2)
          .endFill();
        g.beginFill(mix(colour, colours.text, 0.35))
          .drawRoundedRect(slot.x + 12, slot.y + slot.height - 7, (width * Math.min(progress, delay)) / delay, 4, 2)
          .endFill();
      }
      const progressText = this.progressTexts.get(slot.key);
      if (progressText) progressText.text = progress !== undefined && delay > 0 ? `${Math.min(progress, delay)}/${delay}` : "";
      const empty = this.emptyTexts.get(slot.key);
      if (empty) empty.visible = here === undefined;
      const address = this.addressTexts.get(slot.key);
      if (address) address.text = here?.cell.address ?? "";
    }
  }

  /** The place of a cell of the pipeline */
  private slotOf(kind: StageKey | UnitKey, index = 0): Slot | undefined {
    return this.slots.find((slot) => slot.kind === kind && slot.index === index);
  }

  /** The way from one place to another: along the wires */
  private route(from: Slot, to: Slot): CoordsType[] {
    const a = from.centre;
    const b = to.centre;
    if (from.kind === "ID" && to.height === UNIT_HEIGHT) {
      return [a, { x: BUS_LEFT, y: a.y }, { x: BUS_LEFT, y: b.y }, b];
    }
    if (from.height === UNIT_HEIGHT && to.kind === "MEM") {
      return [a, { x: BUS_RIGHT, y: a.y }, { x: BUS_RIGHT, y: b.y }, b];
    }
    return [a, b];
  }

  /**
   * The instructions of a cycle. Each one goes from where it was to its new place in `duration` ms; returns whether
   * something moves (then `tick` has to be called on each frame until it returns false)
   */
  public processStep(instructions: TypePipelineInstructions, options: PipelineStepOptions = { duration: 0 }): boolean {
    const now = performance.now();
    const cells: { slot: Slot; cell: TypePipelineCellInstruction }[] = [];
    for (const stage of STAGES) {
      const cell = instructions[stage];
      const slot = this.slotOf(stage);
      if (slot && cell.draw !== false && cell.text) cells.push({ slot, cell });
    }
    for (const unit of UNITS) {
      for (const cell of instructions[unit] ?? []) {
        const slot = this.slotOf(unit, cell.unit);
        if (slot && cell.draw !== false && cell.text) cells.push({ slot, cell });
      }
    }
    this.occupied = new Map(
      cells.map(({ slot, cell }) => [slot.key, { cell, progress: cell.id === undefined ? undefined : options.progress?.get(cell.id) }]),
    );
    this.moves = [];
    const seen = new Set<number | string>();
    for (const { slot, cell } of cells) {
      const id = cell.id ?? slot.key;
      seen.add(id);
      let token = this.tokens.get(id);
      const unit = slot.height === UNIT_HEIGHT;
      const width = unit ? UNIT_TOKEN_WIDTH : TOKEN_WIDTH;
      const height = unit ? UNIT_TOKEN_HEIGHT : TOKEN_HEIGHT;
      if (token === undefined) {
        // A new instruction comes in from the left of its place
        token = new Token(this.resolution);
        this.tokens.set(id, token);
        this.tokenLayer.addChild(token);
        token.position.set(slot.centre.x - 60, slot.centre.y);
        token.alpha = 0;
        token.path = [{ x: slot.centre.x - 60, y: slot.centre.y }, slot.centre];
        token.fade = "in";
      } else if (token.slot !== slot.key) {
        const from = this.slots.find((place) => place.key === token?.slot);
        token.path = from ? this.route(from, slot) : [token.position.clone(), slot.centre];
        token.fade = null;
        token.alpha = 1;
        this.moves.push(token.path);
      } else {
        token.path = [];
        token.position.set(slot.centre.x, slot.centre.y);
      }
      token.slot = slot.key;
      token.start = now;
      token.duration = options.duration;
      token.set(cell.text, cell.draw === true ? null : String(cell.draw), this.colours.stage(slot.kind), width, height, this.colours);
    }
    // The instructions that left: out on the right (from WB) or where they were
    for (const [id, token] of this.tokens) {
      if (seen.has(id)) continue;
      const from = token.position.clone();
      token.path = token.slot === "WB" ? [from, { x: from.x + 90, y: from.y }] : [from, { x: from.x, y: from.y + 12 }];
      if (token.slot === "WB")
        this.moves.push([
          { x: from.x + BOX_WIDTH / 2, y: from.y },
          { x: from.x + 90, y: from.y },
        ]);
      token.fade = "out";
      token.start = now;
      token.duration = options.duration;
      token.slot = "";
    }
    this.moveStart = now;
    this.moveDuration = options.duration;
    this.drawBoxes();
    return this.tick(now);
  }

  /** A frame of the animation; returns whether something still moves */
  public tick(now = performance.now()): boolean {
    let moving = false;
    for (const [id, token] of this.tokens) {
      if (token.step(now)) moving = true;
      if (token.gone || (token.slot === "" && token.path.length === 0)) {
        this.tokens.delete(id);
        token.destroy({ children: true });
      }
    }
    this.drawFlows(now);
    return moving;
  }

  /** The wires the instructions go along, lit in the colour of the primary while they move */
  private drawFlows(now: number): void {
    const g = this.flows;
    g.clear();
    const t = this.moveDuration <= 0 ? 1 : (now - this.moveStart) / this.moveDuration;
    if (t >= 1 || this.moves.length === 0) return;
    const alpha = 0.9 * (1 - ease(Math.max(0, t)));
    for (const path of this.moves) {
      g.lineStyle(5, this.colours.primary, alpha).moveTo(path[0].x, path[0].y);
      for (const point of path.slice(1)) g.lineTo(point.x, point.y);
    }
  }

  public toString(): string {
    return JSON.stringify(Object.fromEntries([...this.occupied].map(([key, value]) => [key, value.cell.text])));
  }
}
