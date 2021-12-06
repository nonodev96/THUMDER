import * as PIXI from 'pixi.js';
import { PixiUtils } from "./PixiUtils";

export type ColorType = number;
export type CoordsType = {
  x: number,
  y: number
};

const styleFontTextPipe = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 18,
  fill: 'black',
  stroke: '#000000',
  // strokeThickness: 0,
  // dropShadow: true,
  // dropShadowColor: "#000000",
  // dropShadowBlur: 4,
  // dropShadowAngle: Math.PI / 6,
  // dropShadowDistance: 6,
});

const styleFontTextBox = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fill: 'black',
  stroke: '#000000',
  // strokeThickness: 0,
  // dropShadow: true,
  // dropShadowColor: "#000000",
  // dropShadowBlur: 4,
  // dropShadowAngle: Math.PI / 6,
  // dropShadowDistance: 6,
});

export class PixiTHUMDER_Pipeline extends PIXI.Container {

  private readonly InstStages_text: PIXI.Text;
  private readonly IF_text: PIXI.Text;
  private readonly ID_text: PIXI.Text;
  private readonly intEX_text: PIXI.Text;
  private readonly MEM_text: PIXI.Text;
  private readonly WB_text: PIXI.Text;

  private faddEX_array: Array<PIXI.Text>;
  private fmultEX_array: Array<PIXI.Text>;
  private fdivEX_array: Array<PIXI.Text>;

  private faddEX_count;
  private fmultEX_count;
  private fdivEX_count;

  constructor(faddEX_count = 1, fmultEX_count = 1, fdivEX_count = 1) {
    super();
    this.InstStages_text = new PIXI.Text("Inst-Stages");
    this.IF_text = new PIXI.Text("", styleFontTextBox);
    this.ID_text = new PIXI.Text("", styleFontTextBox);
    this.intEX_text = new PIXI.Text("", styleFontTextBox);
    this.MEM_text = new PIXI.Text("", styleFontTextBox);
    this.WB_text = new PIXI.Text("", styleFontTextBox);

    this.faddEX_count = faddEX_count;
    this.fmultEX_count = fmultEX_count;
    this.fdivEX_count = fdivEX_count;
    this.faddEX_array = new Array<PIXI.Text>(this.faddEX_count);
    for (let i = 0; i < this.faddEX_count; i++) {
      this.faddEX_array[i] = new PIXI.Text("", styleFontTextBox);
    }
    this.fmultEX_array = new Array<PIXI.Text>(this.fmultEX_count);
    for (let i = 0; i < this.fmultEX_count; i++) {
      this.fmultEX_array[i] = new PIXI.Text("", styleFontTextBox);
    }
    this.fdivEX_array = new Array<PIXI.Text>(this.fdivEX_count);
    for (let i = 0; i < this.fdivEX_count; i++) {
      this.fdivEX_array[i] = new PIXI.Text("", styleFontTextBox);
    }
    this.initBoxes();
    this.initArrows();
    this.initTexts();
  }

  private initTexts() {
    this.InstStages_text.position.x = 175 - (this.InstStages_text.width) / 2;
    this.InstStages_text.position.y = 25;
    this.addChild(this.InstStages_text);

    this.drawText(this.IF_text, {
      x: 100 + 5,
      y: 115
    });
    this.drawText(this.ID_text, {
      x: 100 + 5,
      y: 215
    });
    this.drawText(this.intEX_text, {
      x: 100 + 5,
      y: 315
    });
    this.drawText(this.MEM_text, {
      x: 100 + 5,
      y: 415
    });
    this.drawText(this.WB_text, {
      x: 100 + 5,
      y: 515
    });

    for (let i = 0; i < this.faddEX_count; i++) {
      this.drawText(this.faddEX_array[i], {
        x: 400 + 5,
        y: 115 + (i * 100)
      });
    }
    for (let i = 0; i < this.fmultEX_count; i++) {
      this.drawText(this.fmultEX_array[i], {
        x: 650 + 5,
        y: 115 + (i * 100)
      });
    }
    for (let i = 0; i < this.fdivEX_count; i++) {
      this.drawText(this.fdivEX_array[i], {
        x: 900 + 5,
        y: 115 + (i * 100)
      });
    }
  }

  private drawText(object: PIXI.Text, coords: CoordsType) {
    object.position.x = coords.x;
    object.position.y = coords.y;
    object.zIndex = 2;
    this.addChild(object);
  }

  private initArrows() {
    // IF
    this.drawArrow({
      x: 175,
      y: 50
    }, {
      x: 175,
      y: 100
    });
    // ID
    this.drawArrow({
      x: 175,
      y: 125
    }, {
      x: 175,
      y: 200
    });
    // intEX
    this.drawArrow({
      x: 175,
      y: 225
    }, {
      x: 175,
      y: 300
    });
    // MEM
    this.drawArrow({
      x: 175,
      y: 325
    }, {
      x: 175,
      y: 400
    });
    // WB
    this.drawArrow({
      x: 175,
      y: 425
    }, {
      x: 175,
      y: 500
    });
    this.drawArrow({
      x: 175,
      y: 525
    }, {
      x: 175,
      y: 600
    });

    // Lines
    this.drawLine({
      x: 175,
      y: 275
    }, {
      x: 300,
      y: 275
    });
    this.drawLine({
      x: 300,
      y: 275
    }, {
      x: 300,
      y: 50
    });
    this.drawLine({
      x: 300,
      y: 50
    }, {
      x: 975,
      y: 50
    });

    // input faddEX, fmultEX, fdivEX
    this.drawArrow({
      x: 400 + 75,
      y: 50
    }, {
      x: 400 + 75,
      y: 100
    });
    this.drawArrow({
      x: 650 + 75,
      y: 50
    }, {
      x: 650 + 75,
      y: 100
    });
    this.drawArrow({
      x: 900 + 75,
      y: 50
    }, {
      x: 900 + 75,
      y: 100
    });

    // output faddEX, fmultEX, fdivEX
    this.drawArrow({
      x: 400 + 75,
      y: 125
    }, {
      x: 400 + 75,
      y: 900
    });
    this.drawArrow({
      x: 650 + 75,
      y: 125
    }, {
      x: 650 + 75,
      y: 900
    });
    this.drawArrow({
      x: 900 + 75,
      y: 125
    }, {
      x: 900 + 75,
      y: 900
    });

    // faddEX, fmultEX, fdivEX to MEM
    this.drawLine({
      x: 975,
      y: 900
    }, {
      x: 300,
      y: 900
    });
    this.drawLine({
      x: 300,
      y: 900
    }, {
      x: 300,
      y: 375
    });

    this.drawArrow({
      x: 300,
      y: 375
    }, {
      x: 175,
      y: 375
    });
  }

  private initBoxes() {
    this.drawBox(0xFFFF00, {
      x: 100,
      y: 100
    }, "IF");
    this.drawBox(0XFFA200, {
      x: 100,
      y: 200
    }, "ID");
    this.drawBox(0XFF001C, {
      x: 100,
      y: 300
    }, "intEX");
    this.drawBox(0x00FF00, {
      x: 100,
      y: 400
    }, "MEM");
    this.drawBox(0XA2A2FF, {
      x: 100,
      y: 500
    }, "WB");

    for (let i = 0; i < this.faddEX_count; i++) {
      this.drawBox(0XFFC3FF, {
        x: 400,
        y: 100 + (i * 100)
      }, "faddEX[" + i + "]");
    }
    for (let i = 0; i < this.fmultEX_count; i++) {
      this.drawBox(0XC3FFC3, {
        x: 650,
        y: 100 + (i * 100)
      }, "fmultEX[" + i + "]");
    }
    for (let i = 0; i < this.fdivEX_count; i++) {
      this.drawBox(0XFFCB8E, {
        x: 900,
        y: 100 + (i * 100)
      }, "fdivEX[" + i + "]");
    }
  }

  private drawBox(color: ColorType, positionStart: CoordsType, text: string) {
    const rectangle = new PIXI.Graphics();
    rectangle.lineStyle(2, 0x002200, 1);
    rectangle.beginFill(color);
    rectangle.drawRect(positionStart.x, positionStart.y, 150, 50);
    rectangle.endFill();
    rectangle.zIndex = 1;

    const pixi_text = new PIXI.Text(text, styleFontTextPipe);
    pixi_text.position.x = (positionStart.x - (pixi_text.width + 10));
    pixi_text.position.y = (positionStart.y) + 15;
    rectangle.addChild(pixi_text);
    this.addChild(rectangle);
  }

  private drawLine(from: CoordsType, to: CoordsType) {
    const start_x = from.x;
    const start_y = from.y;
    const to_x = to.x;
    const to_y = to.y;
    const bezierArrow = new PIXI.Graphics();
    bezierArrow.lineStyle(3, 0x000000);
    bezierArrow.moveTo(start_x, start_y);
    bezierArrow.lineTo(to_x, to_y);

    this.addChild(bezierArrow);
  }

  private drawArrow(from: CoordsType, to: CoordsType) {
    const start_x = from.x;
    const start_y = from.y;
    const to_x = to.x;
    const to_y = to.y;
    const bezierArrow = PixiUtils.drawArrow(start_x, start_y, to_x, to_y, 0x000000);
    this.addChild(bezierArrow);
  }

  public update_IF_text(value: string): void {
    this.IF_text.text = value;
  }

  public update_ID_text(value: string): void {
    this.ID_text.text = value;
  }

  public update_intEX_text(value: string): void {
    this.intEX_text.text = value;
  }

  public update_faddEX_text(unit: number, value: string): void {
    if (this.faddEX_count > unit)
      this.faddEX_array[unit].text = value;
  }

  public update_fmultEX_text(unit: number, value: string): void {
    if (this.fmultEX_count > unit)
      this.fmultEX_array[unit].text = value;
  }

  public update_fdivEX_text(unit: number, value: string): void {
    if (this.fdivEX_count > unit)
      this.fdivEX_array[unit].text = value;
  }

  public update_MEM_text(value: string): void {
    this.MEM_text.text = value;
  }

  public update_WB_text(value: string): void {
    this.WB_text.text = value;
  }

  public draw(): PIXI.Container {
    return this;
  }

  public toString(): string {
    const faddEX_array = this.faddEX_array.map(v => v.text);
    const fmultEX_array = this.fmultEX_array.map(v => v.text);
    const fdivEX_array = this.fdivEX_array.map(v => v.text);
    return JSON.stringify({
      "IF_text": this.IF_text.text,
      "ID_text": this.ID_text.text,
      "intEX_text": this.intEX_text.text,
      "MEM_text": this.MEM_text.text,
      "WB_text": this.WB_text.text,
      "faddEX_array": faddEX_array,
      "fmultEX_array": fmultEX_array,
      "fdivEX_array": fdivEX_array,
    });
  }

  public reset(faddEX_count: number, fmultEX_count: number, fdivEX_count: number) {
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.removeChild(this.children[i]);
    }

    this.faddEX_count = faddEX_count;
    this.fmultEX_count = fmultEX_count;
    this.fdivEX_count = fdivEX_count;

    this.faddEX_array = new Array<PIXI.Text>(this.faddEX_count);
    for (let i = 0; i < this.faddEX_count; i++) {
      this.faddEX_array[i] = new PIXI.Text("", styleFontTextBox);
    }
    this.fmultEX_array = new Array<PIXI.Text>(this.fmultEX_count);
    for (let i = 0; i < this.fmultEX_count; i++) {
      this.fmultEX_array[i] = new PIXI.Text("", styleFontTextBox);
    }
    this.fdivEX_array = new Array<PIXI.Text>(this.fdivEX_count);
    for (let i = 0; i < this.fdivEX_count; i++) {
      this.fdivEX_array[i] = new PIXI.Text("", styleFontTextBox);
    }
    this.IF_text.text = "";
    this.ID_text.text = "";
    this.intEX_text.text = "";
    this.MEM_text.text = "";
    this.WB_text.text = "";

    this.initBoxes();
    this.initArrows();
    this.initTexts();
  }
}
