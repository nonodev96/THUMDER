import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, Inject } from "@angular/core";

@Component({
  selector: "THUMDER-layout-admin",
  templateUrl: "./layout-admin.component.html",
  standalone: false,
})
export class LayoutAdminComponent implements AfterViewInit {
  constructor(@Inject(DOCUMENT)
              private document: Document) {
  }

  ngAfterViewInit(): void {
    this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
  }
}
