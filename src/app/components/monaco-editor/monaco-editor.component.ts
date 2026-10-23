import {
  type AfterViewInit,
  Component,
  type ElementRef,
  effect,
  Input,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import type { InterfaceFileItem, TypeBreakpoints, TypeComponentStatus, TypeErrorInCode, TypeTags } from "@app/Types";
import { THUMDER_FileItem } from "@core/services/file-system/file-system.service";
import { ThemeService } from "@core/services/theme/theme.service";
// The editor without the languages of Monaco (THUMDER has its own: DLX)
import * as monaco from "monaco-editor/esm/vs/editor/edcore.main.js";
import { type Observable, ReplaySubject, Subject } from "rxjs";
import MonacoConfig from "../../monaco-config";

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IStandaloneEditorConstructionOptions = monaco.editor.IStandaloneEditorConstructionOptions;
const EditorOption = monaco.editor.EditorOption;

@Component({
  selector: "THUMDER-monaco-editor",
  templateUrl: "./monaco-editor.component.html",
  styleUrls: ["./monaco-editor.component.scss"],
})
export class MonacoEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public inputTheme: string = "thumderTheme";

  @Input()
  public inputLanguage: string = "thumderLanguage";

  public readonly EDITOR_OPTIONS_THUMDER: IStandaloneEditorConstructionOptions = MonacoConfig.defaultOptions;
  public _height: number = 70;
  // public content: string = "";

  public editorFile: THUMDER_FileItem = new THUMDER_FileItem("", false, []);
  private breakpoints: TypeBreakpoints = {};
  private editor!: IStandaloneCodeEditor;
  private executionDecorations: string[] = [];
  private oldDecorationDebugTag_targetId: string[] = [];

  // Monaco is created in ngAfterViewInit, before the view that holds it subscribes: the last value is kept for it
  public initialized$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  public breakpoints$: Subject<TypeBreakpoints> = new Subject<TypeBreakpoints>();
  public componentStatus$: Subject<TypeComponentStatus> = new Subject<TypeComponentStatus>();
  public editorFileSave$: Subject<THUMDER_FileItem> = new Subject<THUMDER_FileItem>();

  /** The text as it was opened or last saved, to know whether there are changes */
  private savedContent = "";
  /** The text has changes that are not saved (the simulator loads the saved version) */
  public readonly dirty = signal(false);

  private theme = inject(ThemeService);
  private ready = false;

  constructor() {
    // The dark theme of DLX with the dark theme of THUMDER (UI-07)
    effect(() => {
      const dark = this.theme.dark();
      if (this.ready) monaco.editor.setTheme(this.themeName(dark));
    });
  }

  private themeName(dark = this.theme.dark()): string {
    return dark && this.inputTheme === "thumderTheme" ? "thumderThemeDark" : this.inputTheme;
  }

  set height(value: number) {
    this._height = value;
    this.editor?.layout();
  }

  get height(): number {
    return this._height;
  }

  ngOnInit(): void {
    this.componentStatus$.next("OnInit");
  }

  @ViewChild("container", { static: true })
  private container!: ElementRef<HTMLDivElement>;

  /** Monaco, created in its element (it follows the size of the element by itself: automaticLayout) */
  ngAfterViewInit(): void {
    this.componentStatus$.next("AfterViewInit");
    // The language and the theme of DLX, before the editor that uses them
    MonacoConfig.onMonacoLoad();
    const editor = monaco.editor.create(this.container.nativeElement, {
      ...this.EDITOR_OPTIONS_THUMDER,
      automaticLayout: true,
      value: this.editorFile.content,
      language: this.inputLanguage,
      theme: this.themeName(),
    });
    this.ready = true;
    editor.onDidChangeModelContent(() => {
      this.editorFile.content = editor.getValue();
      this.dirty.set(this.editorFile.content !== this.savedContent);
    });
    this.editorInitialized(editor);
  }

  ngOnDestroy(): void {
    this.componentStatus$.next("OnDestroy");
    this.editor?.getModel()?.dispose();
    this.editor?.dispose();
  }

  public getInitializedObservable(): Observable<boolean> {
    return this.initialized$.asObservable();
  }

  public getBreakpointsObservable(): Observable<TypeBreakpoints> {
    return this.breakpoints$.asObservable();
  }

  public getComponentStatusObservable(): Observable<TypeComponentStatus> {
    return this.componentStatus$.asObservable();
  }

  public getFileSaveStorageObservable(): Observable<THUMDER_FileItem> {
    return this.editorFileSave$.asObservable();
  }

  public editorInitialized($event: IStandaloneCodeEditor): void {
    this.editor = $event;
    MonacoConfig.onMonacoLoad();
    monaco.editor.setTheme(this.themeName());
    const model = this.editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, this.inputLanguage);
    }
    this.editor.layout();
    this.editor.updateOptions({ readOnly: this.editorFile.$key === "" });
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      this.save();
    });
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      this.toggleDebuggerTag();
    });
    this.fitToWidth(this.editor.getLayoutInfo().width);
    this.editor.onDidLayoutChange((layout) => this.fitToWidth(layout.width));
    this.editor.onDidChangeCursorSelection((_$event) => {});
    this.editor.onDidChangeModelDecorations((_$event) => {
      this.breakpoints = this.getAllBreakpoints();
      this.breakpoints$.next(this.breakpoints);
    });
    this.initialized$.next(true);
  }

  /** In a narrow editor (a phone, a small window) the code gets the room of the minimap and of the folding margin */
  private narrow: boolean | null = null;

  private fitToWidth(width: number): void {
    const narrow = width > 0 && width < 600;
    if (narrow === this.narrow) return;
    this.narrow = narrow;
    this.editor.updateOptions({ minimap: { enabled: !narrow }, folding: !narrow, lineNumbersMinChars: narrow ? 3 : 5 });
  }

  /*
   * Controllers
   */

  public toggleDebuggerTag(line: number | null = null): void {
    const lineNum: number = line ?? this.editor.getPosition()?.lineNumber ?? 1;
    const decorations = this.editor.getModel()!.getLineDecorations(lineNum);
    const decorations_target_id = decorations.map((v) => v.id);
    if (decorations.some((value) => value.options.glyphMarginClassName === "fas fa-circle color-red")) {
      this.breakpoints[lineNum] = false;
      this.oldDecorationDebugTag_targetId = this.editor.getModel()!.deltaDecorations([...decorations_target_id], []);
    } else {
      this.breakpoints[lineNum] = true;
      const newDecoration = {
        range: new monaco.Range(lineNum, 0, lineNum, 0),
        options: {
          isWholeLine: true,
          // inlineClassName: 'fas fa-circle color-red',
          glyphMarginClassName: "fas fa-circle color-red",
        },
      };
      this.oldDecorationDebugTag_targetId = this.editor.getModel()!.deltaDecorations([], [newDecoration]);
    }
    localStorage.setItem("breakpoints", JSON.stringify(this.breakpoints));
  }

  public getListOfTags(): TypeTags {
    const vectorOfInstructions: TypeTags = [];
    const lineCount = this.editor.getModel()!.getLineCount();
    for (let line = 0; line < lineCount; line++) {
      const decorations = this.editor.getModel()!.getLineDecorations(line);
      if (decorations.some((value) => value.options.glyphMarginClassName === "fas fa-circle color-red")) {
        vectorOfInstructions.push({
          line: line,
          content: this.editor.getModel()!.getLineContent(line),
        });
      }
    }
    return vectorOfInstructions;
  }

  public getAllBreakpoints(): TypeBreakpoints {
    const allDecorations = this.editor.getModel()!.getAllDecorations();
    const tags: { [line: number]: boolean } = {};
    for (const decoration of allDecorations) {
      if (decoration.options.glyphMarginClassName === "fas fa-circle color-red") {
        tags[decoration.range.startLineNumber] = true;
      }
    }
    return tags;
  }

  /**
   * What the instructions of each line are doing in the cycle shown (EditorView, execution-marks.ts): the line with the
   * colour of its stage or state and its name at the end (the colour is not the only sign). The editor scrolls to
   * `focus` when it is out of sight
   */
  public showExecution(marks: { line: number; kind: string; label: string }[], focus: number | null): void {
    const model = this.editor?.getModel();
    if (!model) return;
    const count = model.getLineCount();
    const decorations = marks
      .filter(({ line }) => line >= 1 && line <= count)
      .map(({ line, kind, label }) => ({
        range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
        options: {
          isWholeLine: true,
          className: `exec-line exec-${kind}`,
          after: { content: label, inlineClassName: `exec-label exec-${kind}` },
        },
      }));
    this.executionDecorations = this.editor.deltaDecorations(this.executionDecorations, decorations);
    if (focus !== null && focus >= 1 && focus <= count) this.editor.revealLineInCenterIfOutsideViewport(focus);
  }

  /** Takes the cursor to a line, in the middle of the editor */
  public goToLine(line: number): void {
    this.editor.revealLineInCenter(line);
    this.editor.setPosition({ lineNumber: line, column: 1 });
    this.editor.focus();
  }

  /** The text written in the editor */
  public getContent(): string {
    return this.editor?.getValue() ?? "";
  }

  public printErrorsInEditor(errors: TypeErrorInCode[]): void {
    const markers = errors.map((error) => {
      return {
        startColumn: 1,
        endColumn: 1000,
        startLineNumber: error.line,
        endLineNumber: error.line,
        message: error.message,
        severity: error.severity as unknown as monaco.MarkerSeverity,
      } as monaco.editor.IMarkerData;
    });
    const model = this.editor.getModel();
    if (model) {
      monaco.editor.setModelMarkers(model, "IDK", markers);
    }
  }

  public async setBreakpoints(breakpoints: TypeBreakpoints): Promise<void> {
    this.breakpoints = breakpoints;
    for (const line of Object.keys(this.breakpoints)) {
      this.toggleDebuggerTag(parseInt(line, 10));
    }
    return Promise.resolve();
  }

  public getBreakpoints(): TypeBreakpoints {
    return this.breakpoints;
  }

  public async setEditorFile(fileItem: InterfaceFileItem): Promise<void> {
    this.editorFile.$key = fileItem.$key;
    this.editorFile.f_id = fileItem.f_id;
    this.editorFile.e1_uid = fileItem.e1_uid;
    this.editorFile.key = fileItem.key;
    this.editorFile.pathKeys = fileItem.pathKeys;
    this.editorFile.path = fileItem.path;
    this.editorFile.name = fileItem.name;
    this.editorFile.content = fileItem.content;
    this.editorFile.description = fileItem.description;
    this.editorFile.dateModified = fileItem.dateModified;
    this.editorFile.size = fileItem.size;
    this.editorFile.isDirectory = fileItem.isDirectory;
    this.editorFile.hasSubDirectories = fileItem.hasSubDirectories;
    this.editorFile.thumbnail = fileItem.thumbnail;
    this.editorFile.dataItem = fileItem.dataItem;

    this.editor.updateOptions({ readOnly: this.editorFile.$key === "" });

    return Promise.resolve();
  }

  public async setEditorContent(content: string): Promise<void> {
    this.editorFile.content = content;
    this.savedContent = content;
    this.editor.setValue(this.editorFile.content);
    this.dirty.set(false);
    return Promise.resolve();
  }

  /** The text that was just saved: the changes up to here are not pending any more */
  public markSaved(content: string): void {
    this.savedContent = content;
    this.dirty.set((this.editor?.getValue() ?? content) !== content);
  }

  public isReadOnly(): boolean {
    return this.editor?.getOption(EditorOption.readOnly) ?? true;
  }

  public getEditorFile(): THUMDER_FileItem {
    return this.editorFile;
  }

  public save(): void {
    this.updatedEditorFile();
    this.editorFileSave$.next(this.editorFile);
  }

  private updatedEditorFile(): void {
    if (this.editorFile.$key === "") {
      throw new Error("Debes crear un fichero antes de guardarlo");
    }
    this.editorFile.content = this.editor?.getModel()?.getLinesContent()?.join("\n") ?? "";
  }
}
