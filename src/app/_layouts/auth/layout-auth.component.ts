import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, inject } from "@angular/core";
import { Globals } from "@core/services/globals/globals.service";

@Component({
  selector: "THUMDER-layout-auth",
  templateUrl: "./layout-auth.component.html",
  standalone: false,
})
export class LayoutAuthComponent implements AfterViewInit {
  private _document = inject<Document>(DOCUMENT);
  globals = inject(Globals);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngAfterViewInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
    const trees: any = window.jQuery('[data-widget="treeview"]');
    trees.Treeview("toggleRow");
  }
}
