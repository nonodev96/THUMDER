import {AfterViewInit, Component, OnDestroy, OnInit} from "@angular/core";
import {Observable, Subject} from "rxjs";
import * as monaco from "monaco-editor";
import {InterfaceFileItem, TypeBreakpoints, TypeComponentStatus, TypeErrorInCode, TypeTags} from "../../Types";
import MonacoConfig from "../../../monaco-config";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import IStandaloneEditorConstructionOptions = monaco.editor.IStandaloneEditorConstructionOptions;
import {THUMDER_FileItem} from "../../__core/services/file-system/file-system.service";


@Component({
  selector: "thumder-monaco-editor",
  templateUrl: "./monaco-editor.component.html",
  styleUrls: ["./monaco-editor.component.scss"]
})
export class MonacoEditorComponent implements OnInit, AfterViewInit, OnDestroy {

  public readonly EDITOR_OPTIONS_THUMDER: IStandaloneEditorConstructionOptions = MonacoConfig.defaultOptions;
  public _height = 70;
  // public content: string = "";

  public file: THUMDER_FileItem = new THUMDER_FileItem("", false, []);
  public breakpoints: TypeBreakpoints = {};
  private editor: IStandaloneCodeEditor;
  private oldDecorationDebugTag_targetId: string[] = [];
  private oldDecorationDebugLine: string[] = [];
  private iteratorLine: number = 1;

  public initialized$: Subject<boolean> = new Subject<boolean>();
  public breakpoints$: Subject<TypeBreakpoints> = new Subject<TypeBreakpoints>();
  public componentStatus$: Subject<TypeComponentStatus> = new Subject<TypeComponentStatus>();
  public fileSave$: Subject<THUMDER_FileItem> = new Subject<THUMDER_FileItem>();

  constructor() {
  }

  set height(value: number) {
    this._height = value;
    this.editor.layout();
  }

  get height(): number {
    return this._height;
  }

  ngOnInit(): void {
    this.componentStatus$.next("OnInit");
  }

  ngAfterViewInit(): void {
    this.componentStatus$.next("AfterViewInit");
  }

  ngOnDestroy(): void {
    this.componentStatus$.next("OnDestroy");
  }

  editorInitialized($event: IStandaloneCodeEditor): void {
    this.editor = $event;
    this.editor.layout();
    this.editor.updateOptions({readOnly: this.file.$key == ""});
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, async () => {
      await this.save();
    });
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D, () => {
      this.toggleDebuggerTag();
    });
    this.editor.onDidChangeCursorSelection((_$event) => {

    });
    this.editor.onDidChangeModelDecorations((_$event) => {
      this.breakpoints = this.getAllBreakpoints();
      this.breakpoints$.next(this.breakpoints);
    });
    this.initialized$.next(true);
  }

  getInitializedObservable(): Observable<boolean> {
    return this.initialized$.asObservable();
  }

  getBreakpointsObservable(): Observable<TypeBreakpoints> {
    return this.breakpoints$.asObservable();
  }

  getComponentStatusObservable(): Observable<TypeComponentStatus> {
    return this.componentStatus$.asObservable();
  }

  getFileSaveObservable(): Observable<InterfaceFileItem> {
    return this.fileSave$.asObservable();
  }

  async updateContent(content: string): Promise<void> {
    this.file.content = content;
    this.editor.setValue(this.file.content);
    return Promise.resolve();
  }

  editorLanguageChanged(): void {
    // console.log('editorLanguageChanged');
  }

  editorConfigurationChanged(): void {
    // console.log('editorConfigurationChanged');
  }

  editorValueChange(): void {
    // console.log('editorValueChange');
  }

  callBackFunc(_$event_text: any): void {
    // console.log('callBackFunc', $event_text)
  }

  /*
   * Controllers
   */

  public debug(): void {
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

  public toggleDebuggerTag(line: number = null): void {
    line = line ?? this.editor.getPosition().lineNumber ?? 1;
    const decorations = this.editor.getModel().getLineDecorations(line);
    const decorations_target_id = decorations.map(v => v.id);
    if (decorations.some(value => value.options.glyphMarginClassName === "fas fa-circle color-red")) {
      // remove the tag
      this.breakpoints[line] = false;
      this.oldDecorationDebugTag_targetId = this.editor.getModel().deltaDecorations([...decorations_target_id], []);
    } else {
      // add the tag
      this.breakpoints[line] = true;
      const newDecoration = {
        range: new monaco.Range(line, 0, line, 0),
        options: {
          isWholeLine: true,
          // inlineClassName: 'fas fa-circle color-red',
          glyphMarginClassName: "fas fa-circle color-red",
        }
      };
      this.oldDecorationDebugTag_targetId = this.editor.getModel().deltaDecorations([], [newDecoration]);
    }
    localStorage.setItem("breakpoints", JSON.stringify(this.breakpoints));
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

  public debugNextLine(): void {
    const lineCount = this.editor.getModel().getLineCount();
    this.iteratorLine = this.iteratorLine % lineCount === 0 ? 1 : this.iteratorLine + 1;
    this.printLine(this.iteratorLine);
  }

  // public debugToLine(iteratorLine: number): void {
  //   console.log("debugToLine");
  //   const lineCount = this.editor.getModel().getLineCount();
  //   this.iteratorLine = iteratorLine % lineCount;
  //   this.printLine(this.iteratorLine);
  // }

  public debugNextLineWithTag(): void {
    const listOfTags = this.getListOfTags();
    const listOfTags_filter = listOfTags.filter(value => value.line > this.iteratorLine);
    this.iteratorLine = listOfTags_filter.length > 0 ? listOfTags_filter.shift().line : 1;
    this.printLine(this.iteratorLine);
  }

  public getAllBreakpoints(): TypeBreakpoints {
    const allDecorations = this.editor.getModel().getAllDecorations();
    const tags: { [line: number]: boolean } = {};
    for (const decoration of allDecorations) {
      if (decoration.options.glyphMarginClassName === "fas fa-circle color-red") {
        tags[decoration.range.startLineNumber] = true;
      }
    }
    return tags;
  }

  public clearLines(): void {
    this.oldDecorationDebugLine = this.editor.deltaDecorations(this.oldDecorationDebugLine, []);
  }

  public printLine(line: number): void {
    const newDecoration = {
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: "debug-line"
      }
    };
    this.oldDecorationDebugLine = this.editor.deltaDecorations(this.oldDecorationDebugLine, [newDecoration]);
  }

  public printErrorsInEditor(errors: TypeErrorInCode[]) {
    const markers = errors.map(error => {
      return {
        startColumn: 1,
        endColumn: 1000,
        startLineNumber: error.line,
        endLineNumber: error.line,
        message: error.message,
        severity: error.severity as unknown as monaco.MarkerSeverity
      } as monaco.editor.IMarkerData
    })
    monaco.editor.setModelMarkers(this.editor.getModel(), "IDK", markers)
  }

  public async save(): Promise<void> {
    if (this.file.$key === "") {
      console.warn("Debes crear un fichero antes de guardarlo");
      return Promise.resolve();
    }
    localStorage.setItem("interfaceFileItem", JSON.stringify(this.file));
    this.fileSave$.next(this.file);
    return Promise.resolve();
  }

  public async setBreakpoints(breakpoints: TypeBreakpoints): Promise<void> {
    this.breakpoints = breakpoints;
    for (const line of Object.keys(this.breakpoints)) {
      this.toggleDebuggerTag(parseInt(line));
    }
    return Promise.resolve();
  }

  public async updateFile(fileItem: InterfaceFileItem): Promise<void> {
    console.log(this.file, fileItem);
    this.file.$key = fileItem.$key;
    this.file.f_id = fileItem.f_id;
    this.file.e1_uid = fileItem.e1_uid;
    this.file.key = fileItem.key;
    this.file.pathKeys = fileItem.pathKeys;
    this.file.path = fileItem.path;
    this.file.name = fileItem.name;
    this.file.content = fileItem.content;
    this.file.description = fileItem.description;
    this.file.dateModified = fileItem.dateModified;
    this.file.size = fileItem.size;
    this.file.isDirectory = fileItem.isDirectory;
    this.file.hasSubDirectories = fileItem.hasSubDirectories;
    this.file.thumbnail = fileItem.thumbnail;
    this.file.dataItem = fileItem.dataItem;

    this.editor.updateOptions({readOnly: this.file.$key == ""});

    return Promise.resolve();
  }
}
