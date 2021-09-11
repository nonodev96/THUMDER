import * as PIXI from 'pixi.js';
import { LinkedList, Queue } from 'datastructures-js';
import { PixiJSTable } from './PixiJSTable';
import { Utils } from './Pixi-Utils';

const styleFontTextInstruction = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 15,
  fill: 'white',
  stroke: '#000000',
  align: 'center',
  // strokeThickness: 0,
  // dropShadow: true,
  // dropShadowColor: "#000000",
  // dropShadowBlur: 5,
  // dropShadowAngle: Math.PI / 6,
  // dropShadowDistance: 6,
});

const styleFontTextSteps = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 15,
  fill: 'white',
  stroke: '#000000',
  // strokeThickness: 0,
  // dropShadow: true,
  // dropShadowColor: "#000000",
  // dropShadowBlur: 4,
  // dropShadowAngle: Math.PI / 6,
  // dropShadowDistance: 6,
});

export const DEFAULT_CYCLE = {
  IF: 1,
  IF_stall: 0,
  ID: 1,
  ID_stall: 0,
  intEX: 1,
  intEX_stall: 0,
  MEM: 1,
  MEM_stall: 0,
  WB: 1,
  WB_stall: 0,
};

export type ArrowDirection = {
  start: {
    instruction: number,
    step: number
  }
  to: {
    instruction: number,
    step: number
  }
};

export type CellPosition = {
  instruction: number,
  step: number
}

export type CycleType = {
  IF?: number,
  IF_stall?: number,
  ID?: number,
  ID_stall?: number,
  intEX?: number,
  intEX_stall?: number,
  MEM?: number,
  MEM_stall?: number,
  WB?: number
  WB_stall?: number
};

export class PixiTHUMDER_CycleClockDiagram extends PIXI.Container {
  table: PixiJSTable;

  tableSteps: PixiJSTable;

  tableInstructions: PixiJSTable;

  arrows: PIXI.Graphics;

  borderTitle: PIXI.Graphics;

  borderLeft: PIXI.Graphics;

  borderTop: PIXI.Graphics;

  realStep: number;

  stepToStart: number;

  instruction: number;

  // K => Row = instruction
  timer: Map<number, Queue<PIXI.Graphics>>;

  listArrows: LinkedList<ArrowDirection>;

  constructor() {
    super();
    this.table = new PixiJSTable();
    this.tableSteps = new PixiJSTable();
    this.tableInstructions = new PixiJSTable();
    this.arrows = new PIXI.Graphics();

    this.instruction = 0;
    this.realStep = 0;
    this.stepToStart = 0;

    this.borderTitle = new PIXI.Graphics();
    this.borderLeft = new PIXI.Graphics();
    this.borderTop = new PIXI.Graphics();

    this.timer = new Map();
    this.listArrows = new LinkedList();

    this.initTables();
    this.drawBorders();
  }

  public reset() {
    for (let i = this.table.rowCount - 1; i >= 0; i--) {
      this.table.deleteRow(i);
    }
    for (let i = this.tableInstructions.rowCount - 1; i >= 0; i--) {
      this.tableInstructions.deleteRow(i);
    }
    for (let i = 0; i < this.tableSteps.maxCols; i++) {
      this.tableSteps.deleteCell(0, 0);
    }

    this.arrows = new PIXI.Graphics();

    this.instruction = 0;
    this.realStep = 0;
    this.stepToStart = 0;

    this.timer = new Map();
    this.listArrows = new LinkedList();
  }

  private initTables() {
    this.table.position.x += 200;
    this.table.position.y += 50;
    this.table.zIndex = 1;

    this.arrows.zIndex = 2;

    this.tableSteps.position.x += 200;
    this.tableSteps.zIndex = 6;

    this.tableInstructions.position.y += 40;
    this.tableInstructions.zIndex = 7;
  }

  private drawBorders() {
    this.borderTitle = new PIXI.Graphics();
    this.borderTitle.lineStyle(2.5, 0x222222, 1);
    this.borderTitle.beginFill(0x333333);
    this.borderTitle.drawRect(0, 0, 200, 80);
    this.borderTitle.endFill();
    this.borderTitle.zIndex = 10;

    const text = new PIXI.Text('Cycle clock', {
      fontFamily: 'Arial',
      fontSize: 30,
      fill: 'white',
      stroke: '#000000',
    });
    text.position.x = (this.borderTitle.width / 2) - (text.width / 2);
    text.position.y = (this.borderTitle.height / 2) - (text.height / 2);
    this.borderTitle.addChild(text);

    this.borderLeft = new PIXI.Graphics();
    this.borderLeft.lineStyle(2.5, 0x222222, 1);
    this.borderLeft.beginFill(0x333333);
    this.borderLeft.drawRect(0, 0, 200, document.documentElement.clientWidth);
    this.borderLeft.endFill();
    this.borderLeft.zIndex = 5;

    this.borderTop = new PIXI.Graphics();
    this.borderTop.lineStyle(2.5, 0x222222, 1);
    this.borderTop.beginFill(0x333333);
    this.borderTop.drawRect(0, 0, document.documentElement.clientWidth, 80);
    this.borderTop.endFill();
    this.borderTop.zIndex = 4;
  }

  public addInstruction(text: string, cycle: CycleType = DEFAULT_CYCLE, stepsToWait = 0) {
    this.drawInstruction(text);

    for (let i = 0; i < this.stepToStart + stepsToWait; i++) {
      this.drawCycle('', 0xCCCCCC, 0xBBBBBB, {
        instruction: this.instruction,
        step: i,
      });
    }

    for (let i = 0; i < (cycle.IF_stall ?? DEFAULT_CYCLE.IF_stall); i++) this.drawCycle('💣', 0xFFFF00);
    for (let i = 0; i < (cycle.IF ?? DEFAULT_CYCLE.IF); i++) this.drawCycle('IF', 0xFFFF00);
    this.stepToStart += (cycle.IF_stall ?? DEFAULT_CYCLE.IF_stall);
    this.stepToStart += (cycle.IF ?? DEFAULT_CYCLE.IF);

    for (let i = 0; i < (cycle.ID_stall ?? DEFAULT_CYCLE.ID_stall); i++) this.drawCycle('💣', 0xFF9900);
    for (let i = 0; i < (cycle.ID ?? DEFAULT_CYCLE.ID); i++) this.drawCycle('ID', 0xFF9900);

    for (let i = 0; i < (cycle.intEX_stall ?? DEFAULT_CYCLE.intEX_stall); i++) this.drawCycle('💣', 0xFF0000);
    for (let i = 0; i < (cycle.intEX ?? DEFAULT_CYCLE.intEX); i++) this.drawCycle('intEX', 0xFF0000);

    for (let i = 0; i < (cycle.MEM_stall ?? DEFAULT_CYCLE.MEM_stall); i++) this.drawCycle('💣', 0x00FF00);
    for (let i = 0; i < (cycle.MEM ?? DEFAULT_CYCLE.MEM); i++) this.drawCycle('MEM', 0x00FF00);

    for (let i = 0; i < (cycle.WB_stall ?? DEFAULT_CYCLE.WB_stall); i++) this.drawCycle('💣', 0xFF00FF);
    for (let i = 0; i < (cycle.WB ?? DEFAULT_CYCLE.WB); i++) this.drawCycle('WB', 0xFF00FF);

    this.table.addRow();
    this.instruction++;
  }

  public addArrow(instructionArrow: ArrowDirection) {
    this.listArrows.insertFirst(instructionArrow);
  }

  /**
   * https://didactalia.net/comunidad/materialeducativo/recurso/calculadoras-de-progresiones-aritmeticas/f0ee1413-0276-7915-8ec2-fe0b2b31f6fc
   * https://math.stackexchange.com/questions/1314006/drawing-an-arrow
   */
  private drawArrow(arrowDirection: ArrowDirection, color = 0xFF0000) {
    const initDistance_x = 210 + 37.5;
    const initDistance_y = 90 + 12.5;

    const start_x = initDistance_x + (arrowDirection.start.step * 87.5);
    const start_y = initDistance_y + (arrowDirection.start.instruction * 37.5);

    const to_x = initDistance_x + (arrowDirection.to.step * 87.5);
    const to_y = initDistance_y + (arrowDirection.to.instruction * 37.5);
    const L1 = Math.sqrt((to_x - start_x) ** 2 + (to_y - start_y) ** 2);
    const angle = 35;
    const x3 = to_x + (15 / L1) * ((start_x - to_x) * Math.abs(Math.cos(angle)) + (start_y - to_y) * Math.abs(Math.sin(angle)));
    const y3 = to_y + (15 / L1) * ((start_y - to_y) * Math.abs(Math.cos(angle)) - (start_x - to_x) * Math.abs(Math.sin(angle)));
    const x4 = to_x + (15 / L1) * ((start_x - to_x) * Math.abs(Math.cos(angle)) - (start_y - to_y) * Math.abs(Math.sin(angle)));
    const y4 = to_y + (15 / L1) * ((start_y - to_y) * Math.abs(Math.cos(angle)) + (start_x - to_x) * Math.abs(Math.sin(angle)));

    const bezierArrow = new PIXI.Graphics();
    bezierArrow.lineStyle(3, color);
    bezierArrow.moveTo(start_x, start_y);
    bezierArrow.lineTo(to_x, to_y);
    bezierArrow.moveTo(x3, y3);
    bezierArrow.lineTo(to_x, to_y);
    bezierArrow.moveTo(x4, y4);
    bezierArrow.lineTo(to_x, to_y);

    this.arrows.addChild(bezierArrow);
  }

  private drawInstruction(text_value: string) {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, 0x0033FF, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(0, 0, 175, 25);
    rectangle.endFill();
    rectangle.zIndex = 11;

    const text = new PIXI.Text(text_value, styleFontTextInstruction);
    text.position.x += (rectangle.width / 2) - (text.width / 2);
    text.position.y += ((rectangle.height - text.height) / 2) - 2.5;
    rectangle.addChild(text);

    this.tableInstructions.addRow();
    this.tableInstructions.addCell(rectangle);
  }

  private drawSteps() {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, 0x0033FF, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(0, 0, 75, 25);
    rectangle.endFill();
    const text = new PIXI.Text(`${this.realStep}`, styleFontTextInstruction);
    text.position.x += (rectangle.width - text.width) / 2;
    text.position.y += ((rectangle.height - text.height) / 2) - 2.5;
    rectangle.addChild(text);
    this.tableSteps.addCell(rectangle);
  }

  private drawCycle(code: '' | '💣' | 'ID' | 'IF' | 'intEX' | 'MEM' | 'WB' | 'TEST' | null = null, colorLineStyle = 0xCCCCCC, colorFill = 0xBBBBBB, cellAt: CellPosition | null = null) {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, colorLineStyle, 1);
    rectangle.beginFill(colorFill);
    rectangle.drawRect(0, 0, 75, 25);
    rectangle.endFill();
    rectangle.zIndex = 11;
    if (code != null) {
      const step = new PIXI.Text(code, styleFontTextSteps);
      step.position.x += (rectangle.width - step.width) / 2;
      step.position.y += 5;
      rectangle.addChild(step);
    }

    // if (cellAt != null) {
    //   rectangle.position.y += 5;
    //   this.table.addCellAt(rectangle, cellAt.instruction, cellAt.step);
    // } else {
    //   this.table.addCell(rectangle);
    // }

    let i = this.instruction;
    if (cellAt !== null) {
      i = cellAt.instruction;
    }
    const queue = this.timer.get(i) ?? new Queue<PIXI.Graphics>();
    queue.enqueue(rectangle);
    this.timer.set(i, queue);
  }

  public nextStep(): void {
    const result = Utils.MapToArray(this.timer);

    for (const time of result) {
      const instruction = time.key;
      const v = time.value;
      const rec = v.dequeue();
      if (rec !== null) {
        this.table.addCell(rec, instruction);
      }
    }
    const listArrows = this.listArrows.toArray()
      .filter((value) => this.realStep === value.to.step);

    for (const arrow of listArrows) {
      this.drawArrow(arrow);
    }

    this.drawSteps();
    this.realStep++;
  }

  public draw(): PIXI.Container {
    this.addChild(this.table.draw());
    this.addChild(this.tableSteps.draw());
    this.addChild(this.tableInstructions.draw());

    this.addChild(this.borderTop);
    this.addChild(this.borderLeft);
    this.addChild(this.borderTitle);

    this.addChild(this.arrows);

    return this;
  }

  public moveLeft() {
    this.table.position.x -= 20;
    this.tableSteps.position.x -= 20;
    this.arrows.position.x -= 20;
  }

  public moveRight() {
    if (this.table.position.x < 200) {
      this.table.position.x += 20;
      this.tableSteps.position.x += 20;
      this.arrows.position.x += 20;
    }
  }

  public moveTop() {
    this.table.position.y -= 20;
    this.tableInstructions.y -= 20;
    this.arrows.position.y -= 20;
  }

  public moveBottom() {
    if (this.table.position.y < 50) {
      this.table.position.y += 20;
      this.tableInstructions.y += 20;
      this.arrows.position.y += 20;
    }
  }

  public debug() {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, 0x002200, 1);
    rectangle.beginFill(0x002200);
    rectangle.drawRect(0, 0, 75, 25);
    rectangle.endFill();
    rectangle.zIndex = 11;
    const step = new PIXI.Text('text', styleFontTextSteps);
    step.position.x += (rectangle.width - step.width) / 2;
    step.position.y += 5;
    rectangle.addChild(step);

    rectangle.position.y += 5;
    this.table.addCell(rectangle, 0);
  }

  toString(): string {
    return JSON.stringify({
      step: this.stepToStart,
      timer: this.timer,
    });
  }
}
