import { CdkDrag } from "@angular/cdk/drag-drop";
import { type AfterViewInit, Component, inject, type OnDestroy, type OnInit, type QueryList, ViewChildren } from "@angular/core";
import { DEFAULT_MULTIVIEW_CONFIGURATION } from "@app/CONSTANTS";
import type { TypeMultiviewConfiguration } from "@app/Types";
import { Utils } from "@app/Utils";
import { Globals } from "@core/services/globals/globals.service";

@Component({
  selector: "view-multiples-views",
  templateUrl: "./multiples-views.component.html",
  styleUrls: [],
  standalone: false,
})
export class MultiplesViewsComponent implements OnInit, AfterViewInit, OnDestroy {
  globals = inject(Globals);

  @ViewChildren(CdkDrag) draggable_list!: QueryList<CdkDrag>;
  public multiviewConfiguration: TypeMultiviewConfiguration = DEFAULT_MULTIVIEW_CONFIGURATION;
  public main_list_1: string[] = [];
  public main_list_2: string[] = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.multiviewConfiguration =
      (JSON.parse(localStorage.getItem("multiview_configuration") ?? "null") as TypeMultiviewConfiguration) ??
      DEFAULT_MULTIVIEW_CONFIGURATION;
    this.main_list_1 = this.multiviewConfiguration.list_1;
    this.main_list_2 = this.multiviewConfiguration.list_2;
  }

  ngAfterViewInit(): void {
    MultiplesViewsComponent.closeAllCards();
    this.main_list_1.push(...this.draggable_list.toArray().map((d) => String(d.data)));
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

  ngOnDestroy(): void {}

  private static closeAllCards() {
    window.jQuery(".card").not("#card-debug").CardWidget("collapse");
  }
}
