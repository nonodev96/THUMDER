import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Application, Texture, Sprite, Container, Graphics } from 'pixi.js';

@Component({
  selector: 'app-pipeline-pixi',
  templateUrl: './pipeline-pixi.component.html',
  styleUrls: ['./pipeline-pixi.component.scss']
})
export class PipelinePixiComponent implements OnInit, AfterViewInit {

  widthBox = 200;
  widthArrowActivate = 5;

  @ViewChild('pixiContainer') pixiContainer;
  public pApp: Application;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.pApp = new Application({
      width: 1600,
      height: 800,
      backgroundColor: 0x1099bb,
      resolution: window.devicePixelRatio || 1,
    });
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);


    const stage = new Container();


    const graphics = new Graphics();
    graphics.beginFill(0xFFFF00);
    graphics.drawRect(50, 50, this.widthBox, 100);


    graphics.beginFill(0xFFFF00);
    graphics.drawRect(50, 200, this.widthBox, 100);


    graphics.beginFill(0xFFFF00);
    graphics.drawRect(50, 350, this.widthBox, 100);

    graphics.beginFill(0xFFFF00);
    graphics.drawRect(50, 500, this.widthBox, 100);

    graphics.beginFill(0xFFFF00);
    graphics.drawRect(50, 650, this.widthBox, 100);

    // faddEX, fmulEX, fdivEX
    graphics.beginFill(0xFFFF00);
    graphics.drawRect(300, 50, this.widthBox, 100);

    graphics.beginFill(0xFFFF00);
    graphics.drawRect(550, 50, this.widthBox, 100);


    stage.addChild(graphics);

    this.pApp.stage.addChild(this.bezierArrow([150, 150], [0, 0], [150, 200]));
    this.pApp.stage.addChild(graphics);

  }

  /**
   * http://jsfiddle.net/tahirahmed/jy156qox/
   *
   * @param start
   * @param cpXY2
   * @param to
   */
  bezierArrow(start = [0, 0], cpXY2 = [100, 100], to = [0, 0]) {
    const line = new Graphics().lineStyle(this.widthArrowActivate, 0xff0000);
    line.moveTo(start[0], start[1]);
    line.lineTo(to[0], to[1]);
    return line

  };

}
