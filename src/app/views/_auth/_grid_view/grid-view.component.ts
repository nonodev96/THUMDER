import { Component, type OnInit } from "@angular/core";
import type { GridsterConfig, GridsterItem } from "angular-gridster2";

@Component({
  selector: "app-grid-view",
  templateUrl: "./grid-view.component.html",
  styleUrls: ["./grid-view.component.scss"],
  standalone: false,
})
export class GridViewComponent implements OnInit {
  options!: GridsterConfig;
  dashboard!: Array<GridsterItem>;

  ngOnInit(): void {
    this.options = {
      draggable: {
        enabled: true,
        dragHandleClass: "drag-handler",
        ignoreContent: true,
      },
      resizable: {
        enabled: true,
      },
      displayGrid: "always",
      // compactType:        'compactLeft&Up',
      itemChangeCallback: GridViewComponent.itemChange,
      itemResizeCallback: GridViewComponent.itemResize,
    };

    this.dashboard = [
      {
        cols: 1,
        rows: 1,
        y: 0,
        x: 0,
        pipeline: true,
      },
      {
        cols: 2,
        rows: 1,
        y: 0,
        x: 0,
        calculator: true,
      },
    ];
  }

  public addItem() {
    this.dashboard.push({
      dragEnabled: true,
      resizeEnabled: true,
      cols: 1,
      rows: 1,
      x: 0,
      y: 0,
      itemVoid: true,
    });
  }

  public removeItem($event: MouseEvent | TouchEvent, item: GridsterItem): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.splice(this.dashboard.indexOf(item), 1);
  }

  static itemChange(item: any, itemComponent: any) {
    console.info("itemChanged", item, itemComponent);
  }

  static itemResize(item: any, itemComponent: any) {
    console.info("itemResized", item, itemComponent);
  }
}
