import { type CdkDragDrop, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class Globals {
  public showDebug: boolean = false;

  /** Moves the dropped item in its list or to the other list; the views (@for) follow the data */
  public drop(event: CdkDragDrop<string[]>) {
    const { previousContainer, container, previousIndex, currentIndex } = event;
    if (previousContainer === container) {
      moveItemInArray(container.data, previousIndex, currentIndex);
    } else {
      transferArrayItem(previousContainer.data, container.data, previousIndex, currentIndex);
    }
  }
}
