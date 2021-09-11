import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { XtermComponent } from "../xterm/xterm.component";
import MonacoConfig from "../../../monaco-config";
import { filter, take } from "rxjs/operators";
import { MonacoEditorConstructionOptions, MonacoEditorLoaderService } from "@materia-ui/ngx-monaco-editor";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
// import { editor } from "monaco-editor";
// import IEditorOption = editor.IEditorOption;


@Component({
  selector: 'thumder-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss']
})
export class MonacoEditorComponent implements OnInit {

  public editorOptions_thumder: MonacoEditorConstructionOptions = {
    theme: 'thumderTheme',
    language: 'thumderLanguage',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    glyphMargin: true
  };
  public code_asm: string = ``;

  private httpClient: HttpClient;
  private editor: IStandaloneCodeEditor;
  private oldDecorationDebugTag: string[] = [];
  private oldDecorationDebugLine: string[] = [];
  private iteratorLine: number = 1;

  constructor(http: HttpClient, private monacoLoaderService: MonacoEditorLoaderService) {
    this.httpClient = http;
    this.monacoLoaderService.isMonacoLoaded$
      .pipe(
        filter(isLoaded => !!isLoaded),
        take(1)
      )
      .subscribe(() => {
        MonacoConfig.onMonacoLoad();
      });
  }

  ngOnInit(): void {
    this.httpClient.get('assets/examples-dlx/win-dlx.s', {responseType: 'text'})
      .subscribe(data => {
        // console.log(data)
        this.code_asm = data;
      });
  }

  public onInitEditor($event: any) {
    this.editor = $event;
    this.editor.layout();

    this.editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KEY_S, function () {
      alert('SAVE pressed!');
    });
    this.editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KEY_D, () => {
      this.toggleDebuggerTag();
    });

    this.editor.onDidChangeCursorSelection((e) => {

    });

    this.editor.onDidChangeModelDecorations((e) => {

    });
  }

  /*
   * Controllers
   */


  public toggleDebuggerTag() {
    const line = this.editor.getPosition().lineNumber ?? 1;
    // this.oldDecoration = this.editor.deltaDecorations(this.oldDecoration, []);
    const decorations = this.editor.getModel().getLineDecorations(line);

    if (decorations.some(value => value.options.glyphMarginClassName === "fas fa-circle color-red")) {
      this.oldDecorationDebugTag = this.editor.deltaDecorations(this.oldDecorationDebugTag, []);
    } else {
      this.oldDecorationDebugTag = this.editor.deltaDecorations([], [...decorations, {
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            glyphMarginClassName: 'fas fa-circle color-red',
          }
        }]
      );
    }
  }

  /**
   * Devuelve una lista de las lineas marcadas con la tag de debug
   */
  public getListOfTags(): { line: number, content: string }[] {
    const vectorOfInstructions: { line: number, content: string }[] = []
    const lineCount = this.editor.getModel().getLineCount()

    for (let line = 0; line < lineCount; line++) {
      const decorations = this.editor.getModel().getLineDecorations(line)
      if (decorations.some(value => value.options.glyphMarginClassName === "fas fa-circle color-red")) {
        vectorOfInstructions.push({
          line: line,
          content: this.editor.getModel().getLineContent(line)
        });
      }
    }

    return vectorOfInstructions;
  }

  /**
   * Itera linea por linea a traves del documento
   */
  public debugNextLine() {
    const lineCount = this.editor.getModel().getLineCount()
    this.iteratorLine = this.iteratorLine % lineCount === 0 ? 1 : this.iteratorLine + 1;
    this.printLine(this.iteratorLine)
  }

  /**
   * Este método busca las lineas marcadas como debug y va iterando en ellas
   */
  public debugNextLineWithTag() {
    const listOfTags = this.getListOfTags();
    const listOfTags_filter = listOfTags.filter(value => value.line > this.iteratorLine)
    this.iteratorLine = listOfTags_filter.length > 0 ? listOfTags_filter.shift().line : 1;
    this.printLine(this.iteratorLine)
  }

  /**
   * Este método pinta una linea en concreto de rojo
   *
   * @param line
   * @private
   */
  private printLine(line: number) {
    this.oldDecorationDebugLine = this.editor.deltaDecorations(this.oldDecorationDebugLine, [{
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'debugLine'
        }
      }]
    );
  }

}
