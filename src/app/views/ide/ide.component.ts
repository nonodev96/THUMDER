import { Component, OnInit, ViewChild } from "@angular/core";
import { MonacoEditorComponent } from "../../components/monaco-editor/monaco-editor.component";
import { XtermComponent } from "../../components/xterm/xterm.component";
import { ModalsComponent } from "../../components/modals/modals.component";

@Component({
  selector: "app-ide",
  templateUrl: "./ide.component.html",
})
export class IDEComponent implements OnInit {

  @ViewChild(MonacoEditorComponent) monacoEditorComponent: MonacoEditorComponent;
  @ViewChild(XtermComponent) xtermComponent: XtermComponent;
  @ViewChild(ModalsComponent) modalsComponent: ModalsComponent;

  constructor() {
  }

  ngOnInit(): void {
  }

  iter() {
    this.monacoEditorComponent.addNewDecorator();
  }

  toggleModal() {
    this.modalsComponent.toggleModal()
  }
}
