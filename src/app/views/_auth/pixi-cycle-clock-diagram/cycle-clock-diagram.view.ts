import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit, ViewChild } from "@angular/core";
import { PixiCycleClockDiagramComponent } from "@components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";

@Component({
  selector: "view-cycle-clock-diagram",
  templateUrl: "./cycle-clock-diagram.view.html",
  standalone: false,
})
export class CycleClockDiagramView implements OnInit {
  private _document = inject<Document>(DOCUMENT);

  @ViewChild(PixiCycleClockDiagramComponent)
  public pixi_CycleClockDiagramComponent!: PixiCycleClockDiagramComponent;

  public inCanvas: boolean = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}

  public handleInCanvas($event: boolean): void {
    this.inCanvas = $event;
  }
}
