import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { MonacoEditorComponent } from "../../../components/monaco-editor/monaco-editor.component";
import { XtermComponent } from "../../../components/xterm/xterm.component";
import { DOCUMENT } from "@angular/common";


@Component({
  selector: "app-ide",
  templateUrl: "./ide.view.html",
})
export class IDEView implements OnInit {

  @ViewChild(MonacoEditorComponent) monacoEditorComponent: MonacoEditorComponent;
  @ViewChild(XtermComponent) xtermComponent: XtermComponent;
  enableDebugger = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }

  toggleDebuggerTag() {
    this.monacoEditorComponent.toggleDebuggerTag();
  }

  getListOfTags() {
    this.monacoEditorComponent.getListOfTags();
  }

  toggleDebugger() {
    this.enableDebugger = !this.enableDebugger;

  }

  debugNextLine() {
    this.monacoEditorComponent.debugNextLine()

  }

  debugNextLineWithTag() {
    this.monacoEditorComponent.debugNextLineWithTag()
  }

  play() {

  }
}
