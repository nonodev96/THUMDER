import {Component, Inject, OnInit, ViewChild} from "@angular/core";
import { MonacoEditorComponent } from "../../../components/monaco-editor/monaco-editor.component";
import { XtermComponent } from "../../../components/xterm/xterm.component";
import {DOCUMENT} from "@angular/common";


@Component({
  selector: "app-ide",
  templateUrl: "./ide.component.html",
})
export class IDEComponent implements OnInit {

  @ViewChild(MonacoEditorComponent) monacoEditorComponent: MonacoEditorComponent;
  @ViewChild(XtermComponent) xtermComponent: XtermComponent;

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  ngOnInit(): void {
  }

  iter() {
    this.monacoEditorComponent.addNewDecorator();
  }

  toggleModal() {
  }
}
