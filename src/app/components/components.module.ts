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

// import { MonacoEditorModule } from "@materia-ui/ngx-monaco-editor";
import { DxFileManagerModule } from "devextreme-angular";
// import { MemoryComponent } from './memory/memory.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { MatTableModule } from "@angular/material/table";

import { SharedModule } from "../__shared/shared.module";
import { PixiPipelineComponent } from './pixi-pipeline/pixi-pipeline.component';
import { EditMemoryBinary32Component } from './modals/edit-memory-binary32/edit-memory-binary32.component';
import { EditRegisterBinary32Component } from "./modals/edit-register-binary32/edit-register-binary32.component";
import { ModalBottomComponent } from './modals/modal-bottom/modal-bottom.component';
import { CovalentCodeEditorModule } from "@covalent/code-editor";
import { ModalComponent } from './modals/modal/modal.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BrowserModule,
    ScrollingModule,

    // npm
    // MonacoEditorModule,
    CovalentCodeEditorModule,
    DxFileManagerModule,
    TableVirtualScrollModule,
    MatTableModule,

    SharedModule,
    CovalentCodeEditorModule
  ],
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
    // MemoryComponent,

    EditMemoryBinary32Component,
    EditRegisterBinary32Component,
    ModalBottomComponent,
    ModalComponent,
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
    PixiPipelineComponent,

    EditMemoryBinary32Component,
    EditRegisterBinary32Component,
    ModalComponent,
    ModalBottomComponent,
  ]
})
export class ComponentsModule {
}
