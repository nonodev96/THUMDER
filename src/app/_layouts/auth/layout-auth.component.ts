import { DOCUMENT } from "@angular/common";
import { Component, inject, type OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Globals } from "@core/services/globals/globals.service";
import { SidebarService } from "@core/services/layout/sidebar.service";
import { TranslatePipe } from "@ngx-translate/core";
import { AsideLeftComponent } from "../../components/aside/aside-left/aside-left.component";
import { AsideRightComponent } from "../../components/aside/aside-right/aside-right.component";
import { BreadcrumbComponent } from "../../components/breadcrumb/breadcrumb.component";
import { DlxIoComponent } from "../../components/dlx-io/dlx-io.component";
import { FooterComponent } from "../../components/footers/footer/footer.component";
import { EditMemoryBinary32Component } from "../../components/modals/edit-memory-binary32/edit-memory-binary32.component";
import { EditRegisterBinary32Component } from "../../components/modals/edit-register-binary32/edit-register-binary32.component";
import { AuthNavbarComponent } from "../../components/navbars/auth-navbar/auth-navbar.component";
import { DebugComponent } from "../../components/windows/debug/debug.component";

@Component({
  selector: "THUMDER-layout-auth",
  templateUrl: "./layout-auth.component.html",
  imports: [
    AuthNavbarComponent,
    AsideLeftComponent,
    BreadcrumbComponent,
    RouterOutlet,
    EditMemoryBinary32Component,
    EditRegisterBinary32Component,
    AsideRightComponent,
    FooterComponent,
    DlxIoComponent,
    DebugComponent,
    TranslatePipe,
  ],
})
export class LayoutAuthComponent implements OnInit {
  private _document = inject<Document>(DOCUMENT);
  globals = inject(Globals);
  sidebar = inject(SidebarService);

  ngOnInit(): void {
    this._document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
    this.sidebar.init();
  }
}
