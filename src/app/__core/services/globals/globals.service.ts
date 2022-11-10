import { Injectable } from "@angular/core";
import {CdkDragDrop, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";

@Injectable({
  providedIn: "root"
})
export class Globals {
  public showDebug: boolean = false;

  public drop(event: CdkDragDrop<any[]>) {
    const nodeToMove = event.item.element.nativeElement;
    const { previousContainer, container, previousIndex, currentIndex } = event;
    if (previousContainer === container) {
      moveItemInArray(container.data, previousIndex, currentIndex);
      this.moveWithinContainer(
        container.element.nativeElement,
        previousIndex,
        currentIndex
      );
      window.dispatchEvent(new Event("resize"));
    } else {
      transferArrayItem(
        previousContainer.data,
        container.data,
        previousIndex,
        currentIndex
      );
      this.transferNodeToContainer(
        nodeToMove,
        container.element.nativeElement,
        currentIndex
      );
      window.dispatchEvent(new Event("resize"));
      Promise.resolve().then(() => {
        previousContainer.removeItem(event.item);
        event.item.dropContainer = container;
        event.item._dragRef._withDropContainer(container._dropListRef);
        container.addItem(event.item);
      });
    }
  }

  public moveWithinContainer(container, fromIndex, toIndex) {
    if (fromIndex === toIndex) {
      return;
    }
    const nodeToMove = container.children[fromIndex];
    const targetNode = container.children[toIndex];
    if (fromIndex < toIndex) {
      targetNode.parentNode.insertBefore(nodeToMove, targetNode.nextSibling);
    } else {
      targetNode.parentNode.insertBefore(nodeToMove, targetNode);
    }
  }

  public transferNodeToContainer(node, container, toIndex) {
    if (toIndex === container.children.length) {
      container.appendChild(node);
    } else {
      const targetItem = container.children[toIndex];
      targetItem.parentNode.insertBefore(node, targetItem);
    }
  }
}
