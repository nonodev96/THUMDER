import { Component, OnInit, ViewChild } from '@angular/core';
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import { HttpClient } from "@angular/common/http";
import { XtermComponent } from "../xterm/xterm.component";


@Component({
  selector: 'thumder-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss']
})
export class MonacoEditorComponent implements OnInit {

  editor: IStandaloneCodeEditor;
  editorOptions_thumder = {
    theme: 'thumderTheme',
    language: 'thumderLanguage'
  };
  code_asm: string = ``;
  oldDecoration: string[] = [];
  i = 0;

  private httpClient: HttpClient;

  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  ngOnInit(): void {
    this.httpClient.get('/assets/examples-dlx/win-dlx.s', {responseType: 'text'})
      .subscribe(data => {
        this.code_asm = data;
      });
  }

  public onInitEditor($event: any) {
    this.editor = $event;
    this.editor.layout();

    this.editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KEY_S, function () {
      alert('SAVE pressed!');
    });

    this.editor.onDidChangeCursorSelection((e) => {

    });

    this.editor.onDidChangeModelDecorations((e) => {

    });
  }

  addNewDecorator() {
    this.oldDecoration = this.editor.deltaDecorations(this.oldDecoration, []);

    this.oldDecoration = this.editor.deltaDecorations(this.oldDecoration, [{
        range: new monaco.Range(this.i, 1, this.i, 1),
        options: {
          isWholeLine: true,
          className: 'myContentClass',
          glyphMarginClassName: 'fas fa-angle-double-right'
        }
      }]
    );
    this.i++;
  }

}
