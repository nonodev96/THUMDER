import { Component, OnInit } from '@angular/core';
import { GridsterConfig, GridsterItem } from "angular-gridster2";

@Component({
  selector:    'app-grid-view',
  templateUrl: './grid-view.component.html',
  styleUrls:   [ './grid-view.component.scss' ]
})
export class GridViewComponent implements OnInit {
  options: GridsterConfig;
  dashboard: Array<GridsterItem>;

  constructor() {
  }

  ngOnInit(): void {
    this.options = {
      draggable:   {
        enabled:         true,
        dragHandleClass: 'drag-handler',
        ignoreContent:   true
      },
      resizable:   {
        enabled: true
      },
      displayGrid: 'always',
      // compactType:        'compactLeft&Up',
      itemChangeCallback: GridViewComponent.itemChange,
      itemResizeCallback: GridViewComponent.itemResize,
    };

    this.dashboard = [
      {
        cols: 1, rows: 1, y: 0, x: 0, pipeline: true
      },
      {
        cols: 2, rows: 1, y: 0, x: 0, calculator: true
      }
    ];
  }

  public addItem() {
    this.dashboard.push({
        dragEnabled:   true,
        resizeEnabled: true,
        cols:          1,
        rows:          1,
        x:             0,
        y:             0,
        itemVoid:      true
      }
    );
  }

  public removeItem($event: MouseEvent | TouchEvent, item): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.splice(this.dashboard.indexOf(item), 1);
  }

  static itemChange(item, itemComponent) {
    console.info('itemChanged', item, itemComponent);
  }

  static itemResize(item, itemComponent) {
    console.info('itemResized', item, itemComponent);
  }

}
