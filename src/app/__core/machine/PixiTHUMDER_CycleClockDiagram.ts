import * as PIXI from "pixi.js";
import { PixiTHUMDER_Table } from "./PixiTHUMDER_Table";
import { PixiUtils } from "./PixiUtils";
import { TypePipelineStage, TypePipeline, TypeStall, TypeStage } from "../../Types";

const styleFontTextInstruction = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize:   15,
  fill:       "white",
  stroke:     "#000000",
  align:      "center"
});

const styleFontTextSteps = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize:   15,
  fill:       "white",
  stroke:     "#000000"
});

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

export class PixiTHUMDER_CycleClockDiagram extends PIXI.Container {

  public realStep: number;

  public instructions: number;

  private table: PixiTHUMDER_Table;

  private tableSteps: PixiTHUMDER_Table;

  private tableInstructions: PixiTHUMDER_Table;

  private arrows: PIXI.Graphics[];

  private arrowsContainer: PIXI.Container;

  private borderTitle: PIXI.Graphics;

  private borderLeft: PIXI.Graphics;

  private borderTop: PIXI.Graphics;

  private stepToStart: number;

  private last: number;

  // K => { Row = instruction, Column = step}
  // private timerVoid: PixiUtils.THUMDER_Map<TypeCellPosition, PIXI.Graphics>;
  // private timer: PixiUtils.THUMDER_Map<TypeCellPosition, PIXI.Graphics>;
  // private listArrows: LinkedList<TypeArrowDirection>;

  constructor() {
    super();
    this.table = new PixiTHUMDER_Table();
    this.tableSteps = new PixiTHUMDER_Table();
    this.tableInstructions = new PixiTHUMDER_Table();

    this.instructions = 0;
    this.realStep = 0;
    this.stepToStart = 0;
    this.last = 0;

    this.borderTitle = new PIXI.Graphics();
    this.borderLeft = new PIXI.Graphics();
    this.borderTop = new PIXI.Graphics();
    this.arrowsContainer = new PIXI.Container();
    this.arrows = [];

    // this.timerVoid = new PixiUtils.THUMDER_Map();
    // this.timer = new PixiUtils.THUMDER_Map();
    // this.listArrows = new LinkedList();

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

    // this.timerVoid = new PixiUtils.THUMDER_Map();
    // this.timer = new PixiUtils.THUMDER_Map();
    // this.listArrows = new LinkedList();

    for (const arrow of this.arrows) {
      this.removeChild(arrow);
    }
    this.arrows = [];
    while (this.arrowsContainer.children[0]) {
      this.arrowsContainer.removeChild(this.arrowsContainer.children[0]);
    }
    this.arrowsContainer = new PIXI.Container();
    this.arrowsContainer.zIndex = 2;
  }

  private initTables() {
    this.table.position.x += 200;
    this.table.position.y += 80;
    this.table.zIndex = 1;

    this.arrowsContainer.zIndex = 2;

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
      fontSize:   30,
      fill:       "white",
      stroke:     "#000000"
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

  public nextStep(pipeline: TypePipeline, step: number = this.realStep) {
    this.drawSteps();
    const stages: TypePipelineStage[] = [ "IF", "ID", "intEX", "MEM", "WB" ];
    for (const iterStage of stages) {
      const stage = iterStage as TypeStage;
      if (pipeline[stage].draw === true) {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle(iterStage);
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
      // if (pipeline[stage].draw === false) {
      //   const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("Aborted");
      //   this.table.setCell(pipeline[stage].addressRow, step, cell);
      //   this.table.drawCell(pipeline[stage].addressRow, step);
      // }
      if (pipeline[stage].draw === "Aborted") {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("Aborted");
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
      if (pipeline[stage].draw === "R-Stall") {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("R-Stall");
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
      if (pipeline[stage].draw === "T-Stall") {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("T-Stall");
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
      if (pipeline[stage].draw === "W-Stall") {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("W-Stall");
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
      if (pipeline[stage].draw === "S-Stall") {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("S-Stall");
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
      if (pipeline[stage].draw === "Stall") {
        const cell = PixiTHUMDER_CycleClockDiagram.drawCycle("Stall");
        this.table.setCell(pipeline[stage].addressRow, step, cell);
        this.table.drawCell(pipeline[stage].addressRow, step);
      }
    }
    this.realStep++;
  }

  public addInstruction(text: string) {
    this.drawInstruction(text);
    this.instructions++;
  }


  public addArrow(instructionArrow: TypeArrowDirection, color: number) {
    this.drawArrow(instructionArrow, color);
  }

  /**
   * https://didactalia.net/comunidad/materialeducativo/recurso/calculadoras-de-progresiones-aritmeticas/f0ee1413-0276-7915-8ec2-fe0b2b31f6fc
   * https://math.stackexchange.com/questions/1314006/drawing-an-arrow
   */
  private drawArrow(arrowDirection: TypeArrowDirection, color = 0xFF0000) {
    const initDistance_x = 210 + 37.5;
    const initDistance_y = 90 + 12.5;
    const start_x = initDistance_x + (arrowDirection.start.step * 87.5) + 15;
    const start_y = initDistance_y + (arrowDirection.start.instruction * 37.5) + 5;
    const to_x = initDistance_x + (arrowDirection.to.step * 87.5) - 15;
    const to_y = initDistance_y + (arrowDirection.to.instruction * 37.5) - 5;
    const bezierArrow = PixiUtils.drawArrow(start_x, start_y, to_x, to_y, color);
    bezierArrow.zIndex = 80;
    this.arrows.push(bezierArrow);
    this.arrowsContainer.addChild(bezierArrow);
    this.addChild(this.arrowsContainer);
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
    const text = new PIXI.Text(`${ displayStep }`, styleFontTextInstruction);
    text.position.x += (rectangle.width - text.width) / 2;
    text.position.y += ((rectangle.height - text.height) / 2) - 2.5;
    rectangle.addChild(text);
    this.tableSteps.setCell(0, displayStep, rectangle);
    this.tableSteps.drawCell(0, displayStep);
  }

  private static drawCycle(code: TypePipelineStage | TypeStall | null = null): PIXI.Graphics {
    const rectangle = new PIXI.Graphics();
    let colorLineStyle: number; // 0xCCCCCC;
    switch (code) {
      case "Aborted": {
        colorLineStyle = 0xCCCCCC;
        break;
      }
      case "R-Stall": {
        colorLineStyle = 0xFFAF00;
        break;
      }
      case "T-Stall": {
        colorLineStyle = 0xFFBF00;
        break;
      }
      case "W-Stall": {
        colorLineStyle = 0xFFCF00;
        break;
      }
      case "Stall": {
        colorLineStyle = 0xFFDF00;
        break;
      }
      case "IF": {
        colorLineStyle = 0xFFFF00;
        break;
      }
      case "ID": {
        colorLineStyle = 0xFF9900;
        break;
      }
      case "intEX": {
        colorLineStyle = 0xFF0000;
        break;
      }
      case "MEM": {
        colorLineStyle = 0x00FF00;
        break;
      }
      case "WB": {
        colorLineStyle = 0xFF00FF;
        break;
      }
      default: {
        colorLineStyle = 0xCCCCCC;
        break;
      }
    }
    rectangle.lineStyle(2.5, colorLineStyle, 1);
    rectangle.beginFill(0xBBBBBB);
    rectangle.drawRect(0, 0, 75, 25);
    rectangle.endFill();
    rectangle.zIndex = 11;
    if (code != null) {
      const step = new PIXI.Text(code, styleFontTextSteps);
      step.position.x += (rectangle.width - step.width) / 2;
      step.position.y += 5;
      rectangle.addChild(step);
    }
    return rectangle;
  }


  public moveLeft() {
    const max = this.tableSteps.width + this.tableSteps.x;
    if (max > 280) {
      this.table.position.x -= 10;
      this.tableSteps.position.x -= 10;
      this.arrowsContainer.position.x -= 10;
    }
  }

  public moveRight() {
    if (this.table.position.x < 200) {
      this.table.position.x += 10;
      this.tableSteps.position.x += 10;
      this.arrowsContainer.position.x += 10;
    }
  }

  public moveTop() {
    const max = this.tableInstructions.height + this.tableInstructions.y;
    if (max > 110) {
      this.table.position.y -= 10;
      this.tableInstructions.y -= 10;
      this.arrowsContainer.position.y -= 10;
    }
  }

  public moveBottom() {
    if (this.table.position.y < 80) {
      this.table.position.y += 10;
      this.tableInstructions.y += 10;
      this.arrowsContainer.position.y += 10;
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
    this.addChild(this.arrowsContainer);
    this.addChild(this.borderTop);
    this.addChild(this.borderLeft);
    this.addChild(this.borderTitle);
    return this;
  }

  toString(): string {
    return JSON.stringify({
      stepToStart: this.stepToStart,
      realStep:    this.realStep
    });
  }
}
