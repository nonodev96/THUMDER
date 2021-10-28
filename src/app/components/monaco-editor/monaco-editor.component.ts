import MonacoConfig from "../../../monaco-config";
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { TypeTags } from "../../types";
import { MachineService } from "../../__core/machine/machine.service";
import * as monaco from "monaco-editor";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import IModelDecoration = monaco.editor.IModelDecoration;
import IStandaloneEditorConstructionOptions = monaco.editor.IStandaloneEditorConstructionOptions;

@Component({
  selector: 'thumder-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss']
})
export class MonacoEditorComponent implements OnInit {
  // export function create(domElement: HTMLElement, options?: IStandaloneEditorConstructionOptions, override?: IEditorOverrideServices): IStandaloneCodeEditor;

  private httpClient: HttpClient;

  public readonly EDITOR_OPTIONS_THUMDER: IStandaloneEditorConstructionOptions = MonacoConfig.defaultOptions;

  public _height = 70;

  public code_asm: string = '';

  private editor: IStandaloneCodeEditor;
  // private oldDecorationDebugTag_targetId: { line: number, target_id: string } []= [];
  private oldDecorationDebugTag_targetId: string[] = [];
  private oldDecorationDebugLine: string[] = [];
  private iteratorLine: number = 1;

  constructor(private http: HttpClient,
              private machine: MachineService) {
    this.httpClient = http;
  }

  set height(value: number) {
    this._height = value;
    this.editor.layout();
  }

  get height() {
    return this._height;
  }

  ngOnInit(): void {
    this.httpClient.get('assets/examples-dlx/prim.s', {responseType: 'text'})
      .subscribe(data => {
        // console.log(data)
        this.code_asm = data;
      });
  }

  editorInitialized($event: IStandaloneCodeEditor) {
    console.log('editorInitialized', $event);
    this.editor = $event;

    this.editor.layout();

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {

    });
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D, () => {
      this.toggleDebuggerTag();
    });
    this.editor.onDidChangeCursorSelection((e) => {

    });
    this.editor.onDidChangeModelDecorations((e) => {

    });
  }

  editorLanguageChanged() {
    // console.log('editorLanguageChanged');
  }

  editorConfigurationChanged() {
    // console.log('editorConfigurationChanged');
  }

  editorValueChange() {
    // console.log('editorValueChange');
  }

  callBackFunc($event_text: any) {
    // console.log('callBackFunc', $event_text)
  }

  /*
   * Controllers
   */
  public debug() {
    const line = this.editor.getPosition().lineNumber ?? 1;
    const decorations = this.editor.getModel().getLineDecorations(line);
    const decorations_target_id = decorations.map(v => v.id);

    console.log("line", line);
    console.log("decorations", decorations);
    console.log("decorations_target_id", decorations_target_id);
    console.log("getAllDecorations", this.editor.getModel().getAllDecorations());
    console.log("oldDecorationDebugTag_targetId", this.oldDecorationDebugTag_targetId);
    console.log("decorations.some( fas fa-circle color-red )", decorations.some(value => value.options.glyphMarginClassName === "fas fa-circle color-red"));
  }

  public toggleDebuggerTag() {
    const line = this.editor.getPosition().lineNumber ?? 1;
    const decorations = this.editor.getModel().getLineDecorations(line);
    const decorations_target_id = decorations.map(v => v.id);

    if (decorations.some(value => value.options.glyphMarginClassName === "fas fa-circle color-red")) {
      // Eliminamos la tag
      this.oldDecorationDebugTag_targetId = this.editor.getModel().deltaDecorations([...decorations_target_id], []);
    } else {
      // Añadimos la tag
      this.oldDecorationDebugTag_targetId = this.editor.getModel().deltaDecorations([], [
          {
            range: new monaco.Range(line, 0, line, 0),
            options: {
              isWholeLine: true,
              // inlineClassName: 'fas fa-circle color-red',
              glyphMarginClassName: 'fas fa-circle color-red',
            }
          }
        ]
      );
    }

    this.machine.tagsDebugger = this.getListOfTags();

  }

  public getListOfTags(): TypeTags {
    const vectorOfInstructions: TypeTags = [];
    const lineCount = this.editor.getModel().getLineCount();

    for (let line = 0; line < lineCount; line++) {
      const decorations = this.editor.getModel().getLineDecorations(line);
      if (decorations.some(value => value.options.glyphMarginClassName === "fas fa-circle color-red")) {

        vectorOfInstructions.push({
          line: line,
          content: this.editor.getModel().getLineContent(line),
        });

      }
    }
    return vectorOfInstructions;
  }


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
