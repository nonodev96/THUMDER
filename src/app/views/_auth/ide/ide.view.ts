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
  isMaximize = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
    window.jQuery('#card-IDE').on('maximized.lte.cardwidget', ($event) => {
      this.isMaximize = true;
      this.monacoEditorComponent.height = 88;
      console.log(this.monacoEditorComponent.height)
    })
    window.jQuery('#card-IDE').on('minimized.lte.cardwidget', ($event) => {
      this.isMaximize = false;
      this.monacoEditorComponent.height = 70;
      console.log(this.monacoEditorComponent.height)
    })
  }

  toggleDebuggerTag() {
    this.monacoEditorComponent.toggleDebuggerTag();
  }

  getListOfTags() {
    console.log(this.monacoEditorComponent.getListOfTags());
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

  changeHeight() {
    this.monacoEditorComponent.height = 1000;
  }
}
