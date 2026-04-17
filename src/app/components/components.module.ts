import { DragDropModule } from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import { RouterModule } from "@angular/router";
import { CovalentCodeEditorModule } from "@covalent/code-editor";
import { DxFileManagerModule } from "devextreme-angular";
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { MarkdownModule } from "ngx-markdown";
import { SharedModule } from "../__shared/shared.module";
import { AsideLeftComponent } from "./aside/aside-left/aside-left.component";
import { AsideRightComponent } from "./aside/aside-right/aside-right.component";
import { BreadcrumbComponent } from "./breadcrumb/breadcrumb.component";
import { DocsItemComponent } from "./docs-item/docs-item.component";
import { FooterComponent } from "./footers/footer/footer.component";
import { FooterAdminComponent } from "./footers/footer-admin/footer-admin.component";
import { EditMemoryBinary32Component } from "./modals/edit-memory-binary32/edit-memory-binary32.component";
import { EditRegisterBinary32Component } from "./modals/edit-register-binary32/edit-register-binary32.component";
import { ModalComponent } from "./modals/modal/modal.component";
import { ModalBottomComponent } from "./modals/modal-bottom/modal-bottom.component";
import { MonacoEditorComponent } from "./monaco-editor/monaco-editor.component";
import { AdminNavbarComponent } from "./navbars/admin-navbar/admin-navbar.component";
import { AuthNavbarComponent } from "./navbars/auth-navbar/auth-navbar.component";
import { PixiCycleClockDiagramComponent } from "./pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";
import { PixiPipelineComponent } from "./pixi-pipeline/pixi-pipeline.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { DebugComponent } from "./windows/debug/debug.component";
import { XtermComponent } from "./xterm/xterm.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ScrollingModule,
    CovalentCodeEditorModule,
    DxFileManagerModule,
    TableVirtualScrollModule,
    MatTableModule,
    SharedModule,
    DragDropModule,
    MarkdownModule,
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
    DocsItemComponent,
    // MemoryComponent,

    EditMemoryBinary32Component,
    EditRegisterBinary32Component,
    ModalBottomComponent,
    ModalComponent,
    DebugComponent,
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
    DocsItemComponent,
    PixiPipelineComponent,

    EditMemoryBinary32Component,
    EditRegisterBinary32Component,
    ModalComponent,
    ModalBottomComponent,
    DebugComponent,
  ],
})
export class ComponentsModule {}
