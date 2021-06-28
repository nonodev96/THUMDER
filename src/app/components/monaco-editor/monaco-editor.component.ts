import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;


@Component({
  selector: 'monaco-editor-component',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss']
})
export class MonacoEditorComponent implements OnInit {

  editorOptions_thumder = {theme: 'thumderTheme', language: 'thumderLanguage'};
  code_asm: string = ``;
  editor: IStandaloneCodeEditor;


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
    console.log($event);
    this.editor = $event;

    this.editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KEY_S, function () {
      alert('SAVE pressed!');
    });


    this.editor.deltaDecorations([], [
      {
        range: new monaco.Range(3, 1, 3, 1),
        options: {
          isWholeLine: true,
          className: 'myContentClass',
          glyphMarginClassName: 'myGlyphMarginClass'
        }
      }]
    );
  }

}
