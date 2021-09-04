import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";

import { XtermComponent } from "./xterm/xterm.component";
import { AsideLeftComponent } from "./aside/aside-left/aside-left.component";
import { AsideRightComponent } from "./aside/aside-right/aside-right.component";
import { FooterComponent } from "./footers/footer/footer.component";
import { FooterAdminComponent } from "./footers/footer-admin/footer-admin.component";
import { MonacoEditorComponent } from "./monaco-editor/monaco-editor.component";
import { AdminNavbarComponent } from "./navbars/admin-navbar/admin-navbar.component";
import { AuthNavbarComponent } from "./navbars/auth-navbar/auth-navbar.component";
import { PixiCycleClockDiagramComponent } from "./pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

import { MonacoEditorModule } from "@materia-ui/ngx-monaco-editor";
import { DxFileManagerModule } from "devextreme-angular";
import { MemoryComponent } from './memory/memory.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { MatTableModule } from "@angular/material/table";

import { SharedModule } from "../__shared/shared.module";
import { PixiPipelineComponent } from './pixi-pipeline/pixi-pipeline.component';


@NgModule({
  declarations: [
    // Aside
    AsideLeftComponent,
    AsideRightComponent,
    // Footer
    FooterComponent,
    FooterAdminComponent,
    // Monaco
    MonacoEditorComponent,
    // Navbar
    AdminNavbarComponent,
    AuthNavbarComponent,
    // Pixi
    PixiCycleClockDiagramComponent,
    PixiPipelineComponent,

    // Sidebar
    SidebarComponent,
    // xTerm
    XtermComponent,
    BreadcrumbComponent,
    MemoryComponent,


  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BrowserModule,
    ScrollingModule,

    // npm
    MonacoEditorModule,
    DxFileManagerModule,
    TableVirtualScrollModule,
    MatTableModule,

    SharedModule
  ],
  exports: [
    // Aside
    AsideLeftComponent,
    AsideRightComponent,
    // Footer
    FooterComponent,
    FooterAdminComponent,
    // Monaco
    MonacoEditorComponent,
    // Navbar
    AdminNavbarComponent,
    AuthNavbarComponent,
    // Pipeline
    PixiCycleClockDiagramComponent,
    // Sidebar
    SidebarComponent,
    // xTerm
    XtermComponent,
    BreadcrumbComponent,
    PixiPipelineComponent
  ]
})
export class ComponentsModule {
}
