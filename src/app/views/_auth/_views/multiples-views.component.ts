import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChildren } from "@angular/core";
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
export class MultiplesViewsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(CdkDrag) draggable_list: QueryList<CdkDrag>;
  public multiviewConfiguration: TypeMultiviewConfiguration = DEFAULT_MULTIVIEW_CONFIGURATION;
  public main_list_1 = [];
  public main_list_2 = [];

  constructor(public globals: Globals) {
  }

  ngOnInit(): void {
    this.multiviewConfiguration = JSON.parse(localStorage.getItem("multiview_configuration")) as TypeMultiviewConfiguration ?? DEFAULT_MULTIVIEW_CONFIGURATION;
    this.main_list_1 = this.multiviewConfiguration.list_1;
    this.main_list_2 = this.multiviewConfiguration.list_2;
  }

  ngAfterViewInit(): void {
    MultiplesViewsComponent.closeAllCards();
    this.main_list_1.push(this.draggable_list.toArray());
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

  ngOnDestroy(): void {

  }

  private static closeAllCards() {
    window.jQuery(".card").not("#card-debug").CardWidget("collapse");
  }


}
