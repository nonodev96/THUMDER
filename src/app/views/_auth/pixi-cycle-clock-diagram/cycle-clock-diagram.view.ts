import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { PixiCycleClockDiagramComponent } from "../../../components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";

@Component({
  selector: "view-cycle-clock-diagram",
  templateUrl: "./cycle-clock-diagram.view.html",
})
export class CycleClockDiagramView implements OnInit {
  @ViewChild(PixiCycleClockDiagramComponent) pixi_CycleClockDiagramComponent: PixiCycleClockDiagramComponent;
  public inCanvas = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }

  handleInCanvas($event): void {
    // console.log($event)
    this.inCanvas = $event as boolean;
  }

}
