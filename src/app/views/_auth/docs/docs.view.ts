import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { type AfterViewInit, Component, inject, type OnInit, type QueryList, ViewChildren } from "@angular/core";
import type { TypeIdTitleFile } from "@app/Types";
import { Globals } from "@core/services/globals/globals.service";
import { TranslatePipe } from "@ngx-translate/core";
import { DocsItemComponent } from "../../../components/docs-item/docs-item.component";
// import { fetchAndActivate, getRemoteConfig, getValue } from "@angular/fire/remote-config";

@Component({
  selector: "view-docs",
  templateUrl: "./docs.view.html",
  styleUrls: [],
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, DocsItemComponent, CdkDragHandle, TranslatePipe],
})
export class DocsView implements OnInit, AfterViewInit {
  globals = inject(Globals);

  public main_list: TypeIdTitleFile[] = [
    { id: "README", title: "DOCS.T_INSTRUCTION_SET", file: "assets/docs.md", lang: "en" },
    { id: "Tabla", title: "DOCS.T_OPCODES", file: "assets/md/DLX-TABLE-Instructions.md", lang: "en" },
    { id: "Account", title: "DOCS.T_ACCOUNT", file: "assets/wiki/00.Account.md", lang: "es" },
    { id: "Instructions", title: "DOCS.T_EXECUTION", file: "assets/wiki/00.TheExecutionOfInstructions.md", lang: "es" },
    { id: "TheRegisterWindow", title: "DOCS.T_REGISTERS", file: "assets/wiki/01.TheRegisterWindow.md", lang: "es" },
    { id: "TheMemoryWindow", title: "DOCS.T_MEMORY", file: "assets/wiki/02.TheMemoryWindow.md", lang: "es" },
    { id: "TheCodeWindow", title: "DOCS.T_CODE", file: "assets/wiki/03.TheCodeWindow.md", lang: "es" },
    { id: "ThePipelineWindow", title: "DOCS.T_PIPELINE", file: "assets/wiki/04.ThePipelineWindow.md", lang: "es" },
    { id: "TheClockCycleDiagramWindow", title: "DOCS.T_DIAGRAM", file: "assets/wiki/04.TheClockCycleDiagramWindow.md", lang: "es" },
    { id: "TheStatisticsWindow", title: "DOCS.T_STATISTICS", file: "assets/wiki/05.TheStatisticsWindow.md", lang: "es" },
    { id: "TheBreakpoints", title: "DOCS.T_BREAKPOINTS", file: "assets/wiki/06.TheBreakpoints.md", lang: "es" },
    { id: "TheExecutionProcess", title: "DOCS.T_PROCESS", file: "assets/wiki/07.TheExecutionProcess.md", lang: "es" },
    { id: "TheConfiguration", title: "DOCS.T_CONFIG", file: "assets/wiki/08.TheConfiguration.md", lang: "es" },
    { id: "FileManager", title: "DOCS.T_FILES", file: "assets/wiki/09.FileManager.md", lang: "es" },
    { id: "FileEditor", title: "DOCS.T_EDITOR", file: "assets/wiki/10.FileEditor.md", lang: "es" },
    { id: "Multiview", title: "DOCS.T_MULTIVIEW", file: "assets/wiki/11.Multiview.md", lang: "es" },
  ];
  // public docsEnabled: string = "";

  @ViewChildren(CdkDrag)
  public draggable_list!: QueryList<CdkDrag>;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // const analytics = getAnalytics();
    // const remoteConfig = getRemoteConfig();
    // fetchAndActivate(remoteConfig)
    //   .then((s) => {
    //     this.docsEnabled = JSON.parse(getValue(remoteConfig, "docs").asString()) as string;
    //     logger.info("activar?", this.docsEnabled)
    //   })
    //   .catch((err) => {
    //     // ...
    //   });
  }

  public MyDrop($event: CdkDragDrop<any[]>): void {
    if ($event.previousContainer === $event.container) {
      moveItemInArray($event.container.data, $event.previousIndex, $event.currentIndex);
    }
  }
}
