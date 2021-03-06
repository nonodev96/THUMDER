import { Component, OnInit, AfterViewInit, QueryList, ViewChildren } from "@angular/core";
import { Globals } from "../../../__core/services/globals/globals.service";
import { CdkDrag, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { TypeIdTitleFile } from "../../../Types";
// import { fetchAndActivate, getRemoteConfig, getValue } from "@angular/fire/remote-config";

@Component({
  selector:    "view-docs",
  templateUrl: "./docs.view.html",
  styleUrls:   []
})
export class DocsView implements OnInit, AfterViewInit {
  public main_list: TypeIdTitleFile[] = [ {
    id:    "README",
    title: "README",
    file:  "assets/docs.md"
  }, {
    id:    "Tabla",
    title: "Tabla DLX - OPCODES",
    file:  "assets/md/DLX-TABLE-Instructions.md"
  }, {
    id:    "Account",
    title: "Account",
    file:  "assets/wiki/00.Account.md"
  }, {
    id:    "Instructions",
    title: "Instructions",
    file:  "assets/wiki/00.TheExecutionOfInstructions.md"
  }, {
    id:    "TheRegisterWindow",
    title: "The Register window",
    file:  "assets/wiki/01.TheRegisterWindow.md"
  }, {
    id:    "TheMemoryWindow",
    title: "The Memory Window",
    file:  "assets/wiki/02.TheMemoryWindow.md"
  }, {
    id:    "TheCodeWindow",
    title: "The Code Window",
    file:  "assets/wiki/03.TheCodeWindow.md"
  }, {
    id:    "ThePipelineWindow",
    title: "The Pipeline Window",
    file:  "assets/wiki/04.ThePipelineWindow.md"
  }, {
    id:    "TheClockCycleDiagramWindow",
    title: "The Clock Cycle Diagram Window",
    file:  "assets/wiki/04.TheClockCycleDiagramWindow.md"
  }, {
    id:    "TheStatisticsWindow",
    title: "The Statistics Window",
    file:  "assets/wiki/05.TheStatisticsWindow.md"
  }, {
    id:    "TheBreakpoints",
    title: "The Breakpoints",
    file:  "assets/wiki/06.TheBreakpoints.md"
  }, {
    id:    "TheExecutionProcess",
    title: "The Execution Process",
    file:  "assets/wiki/07.TheExecutionProcess.md"
  }, {
    id:    "TheConfiguration",
    title: "The Configuration",
    file:  "assets/wiki/08.TheConfiguration.md"
  }, {
    id:    "FileManager",
    title: "File Manager",
    file:  "assets/wiki/09.FileManager.md"
  }, {
    id:    "FileEditor",
    title: "File Editor",
    file:  "assets/wiki/10.FileEditor.md"
  }, {
    id:    "Multiview",
    title: "Multiview",
    file:  "assets/wiki/11.Multiview.md"
  } ];
  // public docsEnabled: string = "";

  @ViewChildren(CdkDrag)
  public draggable_list: QueryList<CdkDrag>;

  constructor(public globals: Globals) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // const analytics = getAnalytics();
    // const remoteConfig = getRemoteConfig();
    // fetchAndActivate(remoteConfig)
    //   .then((s) => {
    //     this.docsEnabled = JSON.parse(getValue(remoteConfig, "docs").asString()) as string;
    //     console.log("activar?", this.docsEnabled)
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
