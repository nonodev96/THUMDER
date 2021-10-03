import * as PIXI from 'pixi.js'

export type ColorType = number
export type CoordsType = {
  x: number,
  y: number
}

const styleFontTextPipe = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 20,
  fill: 'black',
  stroke: '#000000',
  // strokeThickness: 0,
  // dropShadow: true,
  // dropShadowColor: "#000000",
  // dropShadowBlur: 4,
  // dropShadowAngle: Math.PI / 6,
  // dropShadowDistance: 6,
})

const styleFontTextBox = new PIXI.TextStyle({
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
})

export class PixiTHUMER_Pipeline extends PIXI.Container {

  private readonly IntStages_text: PIXI.Text
  private readonly IF_text: PIXI.Text
  private readonly ID_text: PIXI.Text
  private readonly intEX_text: PIXI.Text
  private readonly faddEX_text: PIXI.Text
  private readonly fmultEX_text: PIXI.Text
  private readonly fdivEX_text: PIXI.Text
  private readonly MEM_text: PIXI.Text
  private readonly WB_text: PIXI.Text

  constructor() {
    super()
    this.IntStages_text = new PIXI.Text("Int-Stages")
    this.IF_text = new PIXI.Text("test", styleFontTextBox)
    this.ID_text = new PIXI.Text("test", styleFontTextBox)
    this.intEX_text = new PIXI.Text("test", styleFontTextBox)
    this.faddEX_text = new PIXI.Text("test", styleFontTextBox)
    this.fmultEX_text = new PIXI.Text("test", styleFontTextBox)
    this.fdivEX_text = new PIXI.Text("test", styleFontTextBox)
    this.MEM_text = new PIXI.Text("test", styleFontTextBox)
    this.WB_text = new PIXI.Text("test", styleFontTextBox)
    this.initBoxes()
    this.initArrows()
    this.initTexts()
  }

  private initTexts() {
    this.IntStages_text.position.x = 175 - (this.IntStages_text.width) / 2
    this.IntStages_text.position.y = 20
    this.addChild(this.IntStages_text)


    this.drawText(this.IF_text, {x: 100 + 5, y: 100})
    this.drawText(this.ID_text, {x: 100 + 5, y: 200})
    this.drawText(this.intEX_text, {x: 100 + 5, y: 300})
    this.drawText(this.MEM_text, {x: 100 + 5, y: 400})
    this.drawText(this.WB_text, {x: 100 + 5, y: 500})


    this.drawText(this.faddEX_text, {x: 400 + 5, y: 100})
    this.drawText(this.fmultEX_text, {x: 650 + 5, y: 100})
    this.drawText(this.fdivEX_text, {x: 900 + 5, y: 100})

  }

  private drawText(object: PIXI.Text, coords: CoordsType) {
    object.position.x = coords.x
    object.position.y = coords.y
    object.zIndex = 2
    this.addChild(object)
  }

  private initArrows() {
    // IF
    this.drawArrow({x: 175, y: 50}, {x: 175, y: 100})
    // ID
    this.drawArrow({x: 175, y: 125}, {x: 175, y: 200})
    // intEX
    this.drawArrow({x: 175, y: 225}, {x: 175, y: 300})
    // MEM
    this.drawArrow({x: 175, y: 325}, {x: 175, y: 400})
    // WB
    this.drawArrow({x: 175, y: 425}, {x: 175, y: 500})
    this.drawArrow({x: 175, y: 525}, {x: 175, y: 600})

    // Lines
    this.drawLine({x: 175, y: 275}, {x: 300, y: 275})
    this.drawLine({x: 300, y: 275}, {x: 300, y: 50})
    this.drawLine({x: 300, y: 50}, {x: 975, y: 50})

    // input faddEX, fmultEX, fdivEX
    this.drawArrow({x: 400 + 75, y: 50}, {x: 400 + 75, y: 100})
    this.drawArrow({x: 650 + 75, y: 50}, {x: 650 + 75, y: 100})
    this.drawArrow({x: 900 + 75, y: 50}, {x: 900 + 75, y: 100})

    // output faddEX, fmultEX, fdivEX
    this.drawArrow({x: 400 + 75, y: 125}, {x: 400 + 75, y: 375})
    this.drawArrow({x: 650 + 75, y: 125}, {x: 650 + 75, y: 375})
    this.drawArrow({x: 900 + 75, y: 125}, {x: 900 + 75, y: 375})

    // faddEX, fmultEX, fdivEX to MEM
    this.drawArrow({x: 900 + 75, y: 375}, {x: 175, y: 375})
  }

  private initBoxes() {
    this.drawBox(0xFFFF00, {x: 100, y: 100}, "IF")
    this.drawBox(0XFFA200, {x: 100, y: 200}, "ID")
    this.drawBox(0XFF001C, {x: 100, y: 300}, "intEX")
    this.drawBox(0x00FF00, {x: 100, y: 400}, "MEM")
    this.drawBox(0XA2A2FF, {x: 100, y: 500}, "WB")

    this.drawBox(0XFFC3FF, {x: 400, y: 100}, "faddEX")
    this.drawBox(0XC3FFC3, {x: 650, y: 100}, "fmultEX")
    this.drawBox(0XFFCB8E, {x: 900, y: 100}, "fdivEX")
  }

  private drawBox(color: ColorType, positionStart: CoordsType, text: string) {
    const rectangle = new PIXI.Graphics()
    rectangle.lineStyle(2, 0x002200, 1)
    rectangle.beginFill(color)
    rectangle.drawRect(positionStart.x, positionStart.y, 150, 50)
    rectangle.endFill()
    rectangle.zIndex = 1

    const pixi_text = new PIXI.Text(text, styleFontTextPipe)
    pixi_text.position.x = (positionStart.x - (pixi_text.width + 10))
    pixi_text.position.y = (positionStart.y + 5)
    rectangle.addChild(pixi_text)
    this.addChild(rectangle)
  }

  private drawLine(from: CoordsType, to: CoordsType) {
    const start_x = from.x
    const start_y = from.y
    const to_x = to.x
    const to_y = to.y
    const bezierArrow = new PIXI.Graphics()
    bezierArrow.lineStyle(2, 0x000000)
    bezierArrow.moveTo(start_x, start_y)
    bezierArrow.lineTo(to_x, to_y)

    this.addChild(bezierArrow)
  }

  private drawArrow(from: CoordsType, to: CoordsType) {
    const start_x = from.x
    const start_y = from.y
    const to_x = to.x
    const to_y = to.y

    const L1 = Math.sqrt((to_x - start_x) ** 2 + (to_y - start_y) ** 2)
    const angle = 35
    const x3 = to_x + (15 / L1) * ((start_x - to_x) * Math.abs(Math.cos(angle)) + (start_y - to_y) * Math.abs(Math.sin(angle)))
    const y3 = to_y + (15 / L1) * ((start_y - to_y) * Math.abs(Math.cos(angle)) - (start_x - to_x) * Math.abs(Math.sin(angle)))
    const x4 = to_x + (15 / L1) * ((start_x - to_x) * Math.abs(Math.cos(angle)) - (start_y - to_y) * Math.abs(Math.sin(angle)))
    const y4 = to_y + (15 / L1) * ((start_y - to_y) * Math.abs(Math.cos(angle)) + (start_x - to_x) * Math.abs(Math.sin(angle)))

    const bezierArrow = new PIXI.Graphics()
    bezierArrow.lineStyle(2, 0x000000)
    bezierArrow.moveTo(start_x, start_y)
    bezierArrow.lineTo(to_x, to_y)
    bezierArrow.moveTo(x3, y3)
    bezierArrow.lineTo(to_x, to_y)
    bezierArrow.moveTo(x4, y4)
    bezierArrow.lineTo(to_x, to_y)

    this.addChild(bezierArrow)
  }

  public update_IF_text(value: string): void {
    this.IF_text.text = value
  }

  public update_ID_text(value: string): void {
    this.ID_text.text = value
  }

  public update_intEX_text(value: string): void {
    this.intEX_text.text = value
  }

  public update_faddEX_text(value: string): void {
    this.faddEX_text.text = value
  }

  public update_fmultEX_text(value: string): void {
    this.fmultEX_text.text = value
  }

  public update_fdivEX_text(value: string): void {
    this.fdivEX_text.text = value
  }

  public update_MEM_text(value: string): void {
    this.MEM_text.text = value
  }

  public update_WB_text(value: string): void {
    this.WB_text.text = value
  }

  public reset() {
    this.update_ID_text('');
    this.update_intEX_text('');
    this.update_faddEX_text('');
    this.update_fmultEX_text('');
    this.update_fdivEX_text('');
    this.update_MEM_text('');
    this.update_WB_text('');
  }

  public draw(): PIXI.Container {
    return this
  }

  public toString(): string {
    return JSON.stringify({
      "IF_text": this.IF_text.text,
      "ID_text": this.ID_text.text,
      "intEX_text": this.intEX_text.text,
      "faddEX_text": this.faddEX_text.text,
      "fmultEX_text": this.fmultEX_text.text,
      "fdivEX_text": this.fdivEX_text.text,
      "MEM_text": this.MEM_text.text,
      "WB_text": this.WB_text.text,
    })
  }
}
