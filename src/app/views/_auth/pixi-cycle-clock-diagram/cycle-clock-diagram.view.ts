import { DOCUMENT } from "@angular/common";
import { Component, Inject, type OnInit, ViewChild } from "@angular/core";
import { PixiCycleClockDiagramComponent } from "../../../components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";

@Component({
  selector: "view-cycle-clock-diagram",
  templateUrl: "./cycle-clock-diagram.view.html",
  standalone: false,
})
export class CycleClockDiagramView implements OnInit {
  @ViewChild(PixiCycleClockDiagramComponent)
  public pixi_CycleClockDiagramComponent: PixiCycleClockDiagramComponent;

  public inCanvas: boolean = false;

  constructor(
    @Inject(DOCUMENT)
    private _document: Document,
  ) {}

  ngOnInit(): void {}

  public handleInCanvas($event): void {
    this.inCanvas = $event as boolean;
  }
}
