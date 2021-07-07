import { Component, OnInit, ViewChild } from '@angular/core';
import { Application, Texture, Sprite, Container, Graphics } from 'pixi.js';

@Component({
  selector: 'app-pipeline-pixi',
  templateUrl: './pipeline-pixi.component.html',
  styleUrls: ['./pipeline-pixi.component.scss']
})
export class PipelinePixiComponent implements OnInit {

  @ViewChild('pixiContainer') pixiContainer;
  public pApp: Application;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.pApp = new Application({width: 800, height: 600, backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1,});
    this.pixiContainer.nativeElement.appendChild(this.pApp.view);




    const container = new Container();

    this.pApp.stage.addChild(container);

// Create a new texture
    const texture = Texture.from('assets/img/angular.jpg');

// Create a 5x5 grid of bunnies
    for (let i = 0; i < 25; i++) {
      const bunny = new Sprite(texture);
      bunny.anchor.set(0.5);
      bunny.x = (i % 5) * 40;
      bunny.y = Math.floor(i / 5) * 40;
      container.addChild(bunny);
    }

// Move container to the center
    container.x = this.pApp.screen.width / 2;
    container.y = this.pApp.screen.height / 2;

// Center bunny sprite in local container coordinates
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;

// Listen for animate update
    this.pApp.ticker.add((delta) => {
      // rotate the container!
      // use delta to create frame-independent transform
      container.rotation -= 0.01 * delta;
    });





    let graphics = new Graphics();
    graphics.beginFill(0xFFFF00);

    graphics.lineStyle(5, 0xFF0000);

    graphics.drawRect(0, 0, 300, 200);

    this.pApp.stage.addChild(graphics);

    this.pApp.stage.scale.x = 0.5;
    this.pApp.stage.scale.y = 0.5;
  }

}
