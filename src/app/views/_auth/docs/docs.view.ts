import { Component, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from "@angular/core";
import { Router } from "@angular/router";
import { MarkdownComponent, MarkdownService } from "ngx-markdown";
import { ViewportScroller } from "@angular/common";
import { REGEX_IS_ABSOLUTE_HREF } from "../../../CONSTANTS";
import { Globals } from "../../../__core/services/globals/globals.service";
import { CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";

@Component({
  selector:    "view-docs",
  templateUrl: "./docs.view.html",
  styleUrls:   []
})
export class DocsView implements OnInit {
  public main_list: { id: string, title: string, file: string }[] = [
    {
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
    },
    {
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
    },
  ];

  @ViewChildren(CdkDrag)
  public draggable_list: QueryList<CdkDrag>;

  @ViewChild("markdownComponentID", { static: false })
  private markdownComponentID: MarkdownComponent;
  private listenObj: any;

  constructor(private markdownService: MarkdownService,
              private scroller: ViewportScroller,
              private router: Router,
              private renderer: Renderer2,
              public globals: Globals) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  MyDrop($event: CdkDragDrop<any[]>) {
    if ($event.previousContainer === $event.container) {
      console.log($event);
      moveItemInArray($event.container.data, $event.previousIndex, $event.currentIndex);
    }
  }

  public onMarkdownLoad(): void {
    if (this.markdownComponentID) {
      this.listenObj = this.renderer.listen(this.markdownComponentID.element.nativeElement, "click", (e: Event) => {
        if (e.target && (e.target as any).tagName === "A") {
          const el = (e.target as HTMLElement);
          const linkURL = el.getAttribute && el.getAttribute("href");
          if (linkURL && !REGEX_IS_ABSOLUTE_HREF.test(linkURL)) {
            e.preventDefault();
            const id = linkURL.replace("#", "");
            this.scrollToAnchor(id);
          }
        }
      });
    }
  }

  private scrollToAnchor(scrollToAnchor: string): void {
    this.scroller.scrollToAnchor(scrollToAnchor);
  }
}
