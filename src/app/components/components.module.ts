import { DragDropModule } from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import { RouterModule } from "@angular/router";
import { CovalentCodeEditorModule } from "@covalent/code-editor";
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { MarkdownModule } from "ngx-markdown";
import { SharedModule } from "@shared/shared.module";
import { AsideLeftComponent } from "@components/aside/aside-left/aside-left.component";
import { AsideRightComponent } from "@components/aside/aside-right/aside-right.component";
import { BreadcrumbComponent } from "@components/breadcrumb/breadcrumb.component";
import { DocsItemComponent } from "@components/docs-item/docs-item.component";
import { FooterComponent } from "@components/footers/footer/footer.component";
import { FooterAdminComponent } from "@components/footers/footer-admin/footer-admin.component";
import { EditMemoryBinary32Component } from "@components/modals/edit-memory-binary32/edit-memory-binary32.component";
import { EditRegisterBinary32Component } from "@components/modals/edit-register-binary32/edit-register-binary32.component";
import { ModalComponent } from "@components/modals/modal/modal.component";
import { ModalBottomComponent } from "@components/modals/modal-bottom/modal-bottom.component";
import { MonacoEditorComponent } from "@components/monaco-editor/monaco-editor.component";
import { AdminNavbarComponent } from "@components/navbars/admin-navbar/admin-navbar.component";
import { AuthNavbarComponent } from "@components/navbars/auth-navbar/auth-navbar.component";
import { PixiCycleClockDiagramComponent } from "@components/pixi-cycle-clock-diagram/pixi-cycle-clock-diagram.component";
import { PixiPipelineComponent } from "@components/pixi-pipeline/pixi-pipeline.component";
import { SidebarComponent } from "@components/sidebar/sidebar.component";
import { DebugComponent } from "@components/windows/debug/debug.component";
import { XtermComponent } from "@components/xterm/xterm.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ScrollingModule,
    CovalentCodeEditorModule,
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
