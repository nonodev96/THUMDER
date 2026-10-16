import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarService } from "@core/services/layout/sidebar.service";
import { TranslatePipe } from "@ngx-translate/core";
import { AsideLeftComponent } from "../../components/aside/aside-left/aside-left.component";
import { AsideRightComponent } from "../../components/aside/aside-right/aside-right.component";
import { BreadcrumbComponent } from "../../components/breadcrumb/breadcrumb.component";
import { FooterComponent } from "../../components/footers/footer/footer.component";
import { AuthNavbarComponent } from "../../components/navbars/auth-navbar/auth-navbar.component";

@Component({
  selector: "THUMDER-layout-landing",
  templateUrl: "./layout-landing.component.html",
  imports: [
    AuthNavbarComponent,
    AsideLeftComponent,
    BreadcrumbComponent,
    RouterOutlet,
    AsideRightComponent,
    FooterComponent,
    TranslatePipe,
  ],
})
export class LayoutLandingComponent implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  sidebar = inject(SidebarService);

  ngOnInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
    // The landing pages start with the sidebar folded (before the navbar shows its state)
    this.sidebar.collapse();
  }
}
