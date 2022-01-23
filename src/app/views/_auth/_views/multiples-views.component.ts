import { AfterViewInit, Component, OnInit, QueryList, ViewChildren } from "@angular/core";
import { TypeMultiviewConfiguration } from "../../../Types";
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag
} from "@angular/cdk/drag-drop";
import { Utils } from "../../../Utils";
import { Globals } from "../../../__core/services/globals/globals.service";
import { DEFAULT_MULTIVIEW_CONFIGURATION } from "../../../CONSTANTS";

@Component({
  selector:    "view-multiples-views",
  templateUrl: "./multiples-views.component.html",
  styleUrls:   []
})
export class MultiplesViewsComponent implements OnInit, AfterViewInit {
  @ViewChildren(CdkDrag) draggable_list: QueryList<CdkDrag>;
  public multiviewConfiguration: TypeMultiviewConfiguration = DEFAULT_MULTIVIEW_CONFIGURATION;
  public main = [];

  constructor(public globals: Globals) {
  }

  ngOnInit(): void {
    this.multiviewConfiguration = JSON.parse(localStorage.getItem("multiview_configuration")) as TypeMultiviewConfiguration;
  }

  ngAfterViewInit(): void {
    MultiplesViewsComponent.closeAllCards();
    this.main.push(this.draggable_list.toArray());
    const cards: any = window.jQuery(".card").not("#card-debug");
    cards.on("expanded.lte.cardwidget", async () => {
      await Utils.wait(500);
      window.dispatchEvent(new Event("resize"));
    });

    window.jQuery(".card").on("maximized.lte.cardwidget", async () => {
      await Utils.wait(500);
      window.dispatchEvent(new Event("resize"));
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    const nodeToMove = event.item.element.nativeElement;
    const {previousContainer, container, previousIndex, currentIndex} = event;
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


  moveWithinContainer(container, fromIndex, toIndex) {
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

  transferNodeToContainer(node, container, toIndex) {
    if (toIndex === container.children.length) {
      container.appendChild(node);
    } else {
      const targetItem = container.children[toIndex];
      targetItem.parentNode.insertBefore(node, targetItem);
    }
  }

  private static closeAllCards() {
    window.jQuery(".card").not("#card-debug").CardWidget("collapse");
  }


}
