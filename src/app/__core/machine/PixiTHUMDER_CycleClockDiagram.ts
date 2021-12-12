import * as PIXI from "pixi.js";
import { LinkedList, Queue } from "datastructures-js";
import { PixiTHUMDER_Table } from "./PixiTHUMDER_Table";
import { PixiUtils } from "./PixiUtils";

const styleFontTextInstruction = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 15,
  fill: "white",
  stroke: "#000000",
  align: "center"
  // strokeThickness: 0,
  // dropShadow: true,
  // dropShadowColor: "#000000",
  // dropShadowBlur: 5,
  // dropShadowAngle: Math.PI / 6,
  // dropShadowDistance: 6,
});

const styleFontTextSteps = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 15,
  fill: "white",
  stroke: "#000000"
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
  WB_stall: 0
};

export type TypeArrowDirection = {
  start: {
    instruction: number,
    step: number
  }
  to: {
    instruction: number,
    step: number
  }
};

export type TypeCellPosition = {
  instructionPosition: number,
  stepPosition: number
};

export type TypeCycleType = {
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

export type TypeRowInstruction = number;

export type TypeData_Queue_PIXI_Graphics_ = {
  startStep?: number
  endStep?: number
  queue: Queue<PIXI.Graphics>
};


export class PixiTHUMDER_CycleClockDiagram extends PIXI.Container {

  public realStep: number;

  public instructions: number;

  private table: PixiTHUMDER_Table;

  private tableSteps: PixiTHUMDER_Table;

  private tableInstructions: PixiTHUMDER_Table;

  private arrows: PIXI.Graphics;

  private borderTitle: PIXI.Graphics;

  private borderLeft: PIXI.Graphics;

  private borderTop: PIXI.Graphics;

  private stepToStart: number;

  private last: number;

  // K => { Row = instruction, Column = step}
  private timerVoid: PixiUtils.THUMDER_Map<TypeCellPosition, PIXI.Graphics>;
  private timer: PixiUtils.THUMDER_Map<TypeCellPosition, PIXI.Graphics>;
  private listArrows: LinkedList<TypeArrowDirection>;
  private readonly preDrawArrow: boolean;

  constructor(preDrawArrow = false) {
    super();
    this.preDrawArrow = preDrawArrow;
    this.table = new PixiTHUMDER_Table();
    this.tableSteps = new PixiTHUMDER_Table();
    this.tableInstructions = new PixiTHUMDER_Table();
    this.arrows = new PIXI.Graphics();

    this.instructions = 0;
    this.realStep = 0;
    this.stepToStart = 0;
    this.last = 0;

    this.borderTitle = new PIXI.Graphics();
    this.borderLeft = new PIXI.Graphics();
    this.borderTop = new PIXI.Graphics();

    this.timerVoid = new PixiUtils.THUMDER_Map();
    this.timer = new PixiUtils.THUMDER_Map();
    this.listArrows = new LinkedList();

    this.initTables();
    this.drawBorders();
  }

  set borderTopWidth(width: number) {
    this.borderTop.width = width;
  }

  set borderLeftHeight(height: number) {
    this.borderLeft.height = height;
  }

  public reset() {
    for (const position of this.table.getAllPositions()) {
      this.table.deleteCell(position.row, position.col);
    }

    for (const position of this.tableInstructions.getAllPositions()) {
      this.tableInstructions.deleteCell(position.row, position.col);
    }

    for (const position of this.tableSteps.getAllPositions()) {
      this.tableSteps.deleteCell(position.row, position.col);
    }

    this.instructions = 0;
    this.realStep = 0;
    this.stepToStart = 0;
    this.last = 1;

    this.timerVoid = new PixiUtils.THUMDER_Map();
    this.timer = new PixiUtils.THUMDER_Map();
    this.listArrows = new LinkedList();

    while (this.arrows.children[0]) {
      this.arrows.removeChild(this.arrows.children[0]);
    }
    this.arrows = new PIXI.Graphics();

  }

  private initTables() {
    this.table.position.x += 200;
    this.table.position.y += 80;
    this.table.zIndex = 1;

    this.arrows.zIndex = 2;

    this.tableSteps.position.x += 200;
    this.tableSteps.position.y += 20;
    this.tableSteps.zIndex = 6;

    this.tableInstructions.position.y = 80;
    this.tableInstructions.zIndex = 7;
  }

  private drawBorders() {
    this.borderTitle = new PIXI.Graphics();
    this.borderTitle.lineStyle(2.5, 0x222222, 1);
    this.borderTitle.beginFill(0x333333);
    this.borderTitle.drawRect(0, 0, 200, 80);
    this.borderTitle.endFill();
    this.borderTitle.zIndex = 10;

    const text = new PIXI.Text("Cycle clock", {
      fontFamily: "Arial",
      fontSize: 30,
      fill: "white",
      stroke: "#000000"
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

  public addInstruction(text: string, pipe: TypeCycleType = DEFAULT_CYCLE, stepsToWait = 0) {
    this.drawInstruction(text);

    for (let i = 0; i < this.stepToStart + stepsToWait; i++) {
      this.drawCycle("", 0xCCCCCC, 0xBBBBBB, {
        instructionPosition: this.instructions,
        stepPosition: i
      });
    }

    this.stepToStart += (pipe.IF ?? DEFAULT_CYCLE.IF);
    this.last = this.stepToStart - 2;
    for (let i = 0; i < (pipe.IF_stall ?? DEFAULT_CYCLE.IF_stall); i++) this.drawCycle("💣", 0xFFFF00);
    for (let i = 0; i < (pipe.IF ?? DEFAULT_CYCLE.IF); i++) this.drawCycle("IF", 0xFFFF00);
    // this.stepToStart += (pipe.IF_stall ?? DEFAULT_CYCLE.IF_stall);

    for (let i = 0; i < (pipe.ID_stall ?? DEFAULT_CYCLE.ID_stall); i++) this.drawCycle("💣", 0xFF9900);
    for (let i = 0; i < (pipe.ID ?? DEFAULT_CYCLE.ID); i++) this.drawCycle("ID", 0xFF9900);
    // this.stepToStart += (pipe.ID_stall ?? DEFAULT_CYCLE.ID_stall);

    for (let i = 0; i < (pipe.intEX_stall ?? DEFAULT_CYCLE.intEX_stall); i++) this.drawCycle("💣", 0xFF0000);
    for (let i = 0; i < (pipe.intEX ?? DEFAULT_CYCLE.intEX); i++) this.drawCycle("intEX", 0xFF0000);
    // this.stepToStart += (pipe.intEX_stall ?? DEFAULT_CYCLE.intEX_stall);

    for (let i = 0; i < (pipe.MEM_stall ?? DEFAULT_CYCLE.MEM_stall); i++) this.drawCycle("💣", 0x00FF00);
    for (let i = 0; i < (pipe.MEM ?? DEFAULT_CYCLE.MEM); i++) this.drawCycle("MEM", 0x00FF00);
    // this.stepToStart += (pipe.MEM_stall ?? DEFAULT_CYCLE.MEM_stall);

    for (let i = 0; i < (pipe.WB_stall ?? DEFAULT_CYCLE.WB_stall); i++) this.drawCycle("💣", 0xFF00FF);
    for (let i = 0; i < (pipe.WB ?? DEFAULT_CYCLE.WB); i++) this.drawCycle("WB", 0xFF00FF);
    // this.stepToStart += (pipe.WB_stall ?? DEFAULT_CYCLE.WB_stall);

    // this.table.addRow();
    this.instructions++;
  }

  public addArrow(instructionArrow: TypeArrowDirection) {
    this.listArrows.insertFirst(instructionArrow);
  }

  /**
   * https://didactalia.net/comunidad/materialeducativo/recurso/calculadoras-de-progresiones-aritmeticas/f0ee1413-0276-7915-8ec2-fe0b2b31f6fc
   * https://math.stackexchange.com/questions/1314006/drawing-an-arrow
   */
  private drawArrow(arrowDirection: TypeArrowDirection, color = 0xFF0000) {
    const initDistance_x = 210 + 37.5;
    const initDistance_y = 90 + 12.5;
    const start_x = initDistance_x + (arrowDirection.start.step * 87.5);
    const start_y = initDistance_y + (arrowDirection.start.instruction * 37.5);
    const to_x = initDistance_x + (arrowDirection.to.step * 87.5);
    const to_y = initDistance_y + (arrowDirection.to.instruction * 37.5);
    const bezierArrow = PixiUtils.drawArrow(start_x, start_y, to_x, to_y, color);
    this.arrows.addChild(bezierArrow);
  }

  private drawInstruction(textValue: string) {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, 0x0033FF, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(0, 0, 175, 25);
    rectangle.endFill();
    rectangle.zIndex = 11;
    const text = new PIXI.Text(textValue, styleFontTextInstruction);
    text.position.x += (rectangle.width / 2) - (text.width / 2);
    text.position.y += ((rectangle.height - text.height) / 2) - 2.5;
    rectangle.addChild(text);
    this.tableInstructions.setCell(this.instructions, 0, rectangle);
    this.tableInstructions.drawCell(this.instructions, 0);

  }

  private drawSteps(displayStep: number = this.realStep) {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, 0x0033FF, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(0, 0, 75, 25);
    rectangle.endFill();
    const text = new PIXI.Text(`${displayStep}`, styleFontTextInstruction);
    text.position.x += (rectangle.width - text.width) / 2;
    text.position.y += ((rectangle.height - text.height) / 2) - 2.5;
    rectangle.addChild(text);
    this.tableSteps.setCell(0, displayStep, rectangle);
    this.tableSteps.drawCell(0, displayStep);
  }

  private drawCycle(code: "" | "💣" | "ID" | "IF" | "intEX" | "MEM" | "WB" | "TEST" | null = null, colorLineStyle = 0xCCCCCC, colorFill = 0xBBBBBB, cellAt: TypeCellPosition | null = null) {
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
    let key = cellAt;
    if (key === null) {
      this.last++;
      key = {
        instructionPosition: this.instructions,
        stepPosition: this.last
      };
    }
    if (code === "") {
      if (!this.timerVoid.has(key)) {
        this.timerVoid.set(key, rectangle);
      }
    } else {
      if (!this.timer.has(key)) {
        this.timer.set(key, rectangle);
      }
    }
  }

  public nextStep(displayStep: number = this.realStep): void {
    this.drawSteps(displayStep);
    this.realStep++;
    for (let instructionPosition = 0; instructionPosition < this.instructions; instructionPosition++) {
      for (let stepPosition = 0; stepPosition < this.realStep; stepPosition++) {
        const key = {
          instructionPosition: instructionPosition,
          stepPosition: stepPosition
        };
        //  if (this.timerVoid.has(key) && !this.table.existCell(instructionPosition, stepPosition)) {
        //    const graphicsVoid = this.timerVoid.get(key) as PIXI.Container;
        //    this.table.setCell(instructionPosition, stepPosition, graphicsVoid);
        //    this.table.drawCell(instructionPosition, stepPosition);
        //  }
        if (this.timer.has(key) && !this.table.existCell(instructionPosition, stepPosition)) {
          const graphics = this.timer.get(key) as PIXI.Container;
          this.table.setCell(instructionPosition, stepPosition, graphics);
          this.table.drawCell(instructionPosition, stepPosition);
        }
      }
    }
    let listArrows;
    if (this.preDrawArrow) {
      listArrows = this.listArrows.toArray().filter((value) => this.realStep === value.to.step);
    } else {
      listArrows = this.listArrows.toArray().filter((value) => this.realStep - 1 === value.to.step);
    }
    for (const arrow of listArrows) {
      this.drawArrow(arrow);
    }
    // TODO
    // si esta al final de la caja de visualización desplazar a la derecha
  }

  public moveLeft() {
    const max = this.tableSteps.width + this.tableSteps.x;
    if (max > 280) {
      this.table.position.x -= 10;
      this.tableSteps.position.x -= 10;
      this.arrows.position.x -= 10;
    }
  }

  public moveRight() {
    if (this.table.position.x < 200) {
      this.table.position.x += 10;
      this.tableSteps.position.x += 10;
      this.arrows.position.x += 10;
    }
  }

  public moveTop() {
    const max = this.tableInstructions.height + this.tableInstructions.y;
    if (max > 110) {
      this.table.position.y -= 10;
      this.tableInstructions.y -= 10;
      this.arrows.position.y -= 10;
    }
  }

  public moveBottom() {
    if (this.table.position.y < 80) {
      this.table.position.y += 10;
      this.tableInstructions.y += 10;
      this.arrows.position.y += 10;
    }
  }

  public debug() {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2.5, 0x002200, 1);
    rectangle.beginFill(0x002200);
    rectangle.drawRect(0, 0, 75, 25);
    rectangle.endFill();
    rectangle.zIndex = 11;
    const step = new PIXI.Text("text", styleFontTextSteps);
    step.position.x += (rectangle.width - step.width) / 2;
    step.position.y += 5;
    rectangle.addChild(step);

    rectangle.position.y += 5;
    this.table.setCell(0, 0, rectangle);
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

  toString(): string {
    return JSON.stringify({
      stepToStart: this.stepToStart,
      realStep: this.realStep
    });
  }
}
