import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, inject } from "@angular/core";

@Component({
  selector: "THUMDER-layout-admin",
  templateUrl: "./layout-admin.component.html",
  standalone: false,
})
export class LayoutAdminComponent implements AfterViewInit {
  private _document = inject<Document>(DOCUMENT);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngAfterViewInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }
}
