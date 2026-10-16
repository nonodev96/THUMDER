import { DOCUMENT } from "@angular/common";
import { type AfterViewInit, Component, effect, inject, type OnDestroy, type OnInit, signal, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { DEFAULT_INTERFACE_FILE_ITEM, TOAST } from "@app/CONSTANTS";
import { EnumLogLevel, type InterfaceFileItem, type TypeBreakpoints, type TypeExtrasIDE } from "@app/Types";
import { MonacoEditorComponent } from "@components/monaco-editor/monaco-editor.component";
import { BreakpointsModalComponent } from "@components/program-tools/breakpoints-modal.component";
import { ModulesModalComponent } from "@components/program-tools/modules-modal.component";
import { ProblemsPanelComponent } from "@components/program-tools/problems-panel.component";
import { ShareModalComponent } from "@components/program-tools/share-modal.component";
import { SymbolsModalComponent } from "@components/program-tools/symbols-modal.component";
import { ConfigService } from "@core/config/config.service";
import { type ExerciseLock, ExerciseService } from "@core/exercises/exercise.service";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { copyFolderOf, isBuiltin } from "@core/services/file-system/builtin-files";
import { FileSystemService, type THUMDER_FileItem } from "@core/services/file-system/file-system.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { ModalOpenDirective } from "@shared/directives/bootstrap/modal.directive";
import { ToastrService } from "ngx-toastr";
import { firstValueFrom, Subscription } from "rxjs";
import * as env from "../../../../environments/_environment";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";
import { MonacoEditorComponent as MonacoEditorComponent_1 } from "../../../components/monaco-editor/monaco-editor.component";

@Component({
  selector: "view-editor",
  templateUrl: "./editor.view.html",
  styleUrls: [],
  imports: [
    CardDirective,
    CardWidgetDirective,
    MonacoEditorComponent_1,
    TranslatePipe,
    ModalOpenDirective,
    ProblemsPanelComponent,
    ModulesModalComponent,
    SymbolsModalComponent,
    BreakpointsModalComponent,
    ShareModalComponent,
  ],
})
export class EditorView implements OnInit, AfterViewInit, OnDestroy {
  private _document = inject<Document>(DOCUMENT);
  private router = inject(Router);
  private machine = inject(MachineService);
  private config = inject(ConfigService);
  private fileSystem = inject(FileSystemService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastrService);

  public env = env.AppConfig;

  @ViewChild(MonacoEditorComponent)
  public monacoEditorComponent!: MonacoEditorComponent;
  @ViewChild(ModulesModalComponent) public modules!: ModulesModalComponent;
  @ViewChild(BreakpointsModalComponent) public breakpointsModal!: BreakpointsModalComponent;
  @ViewChild(ShareModalComponent) public share!: ShareModalComponent;

  private exercises = inject(ExerciseService);
  /** The exercise of the file, if it is a shared one (EDU-07) */
  public readonly lock = signal<ExerciseLock | null>(null);
  /** The file is a program of THUMDER (read only: a change is saved as a copy) */
  public readonly builtin = signal(false);
  public readonly copyFolder = signal("");

  public interfaceFileItem: InterfaceFileItem = DEFAULT_INTERFACE_FILE_ITEM;
  private initializedSubscription: Subscription = new Subscription();
  private breakpointSubscription: Subscription = new Subscription();
  private fileSaveSubscription: Subscription = new Subscription();
  /** Monaco has the file: the errors and the line of the simulation can be shown */
  private readonly ready = signal(false);

  private readonly extrasIDE: TypeExtrasIDE;
  public isMaximize = false;
  private destroyed = false;

  constructor() {
    this.extrasIDE = this.router.currentNavigation()?.extras.state as TypeExtrasIDE;
    // The errors of the assembler, marked on their lines
    effect(() => {
      const errors = this.machine.state.errors();
      if (this.ready()) this.monacoEditorComponent.printErrorsInEditor(errors);
    });
    // The line of the instruction just fetched (-1: nothing loaded)
    effect(() => {
      const line = this.machine.state.line();
      if (!this.ready()) return;
      if (line === -1) this.monacoEditorComponent.clearDecorationAllLines();
      else this.monacoEditorComponent.printLine(line);
    });
  }

  ngOnInit(): void {}

  /** A maximized card leaves more room for the editor */
  public onMaximized(maximized: boolean): void {
    this.isMaximize = maximized;
    this.monacoEditorComponent.height = maximized ? 88 : 70;
  }

  ngAfterViewInit(): void {
    this.initializedSubscription = this.monacoEditorComponent.getInitializedObservable().subscribe(async (isInitialized) => {
      if (isInitialized) {
        const interfaceFileItem_storaged = localStorage.getItem("interfaceFileItem");
        if (!interfaceFileItem_storaged) {
          throw new Error("No interface file item found in local storage");
        }

        const breakpoints_storaged = localStorage.getItem("breakpoints");
        if (!breakpoints_storaged) {
          throw new Error("No breakpoints found in local storage");
        }

        this.interfaceFileItem = (this.extrasIDE?.interfaceFileItem ??
          JSON.parse(interfaceFileItem_storaged) ??
          DEFAULT_INTERFACE_FILE_ITEM) as InterfaceFileItem;

        this.showFile(this.interfaceFileItem);
        await this.monacoEditorComponent.setEditorFile(this.interfaceFileItem);
        await this.monacoEditorComponent.setEditorContent(this.interfaceFileItem.content);

        const breakpoints = (JSON.parse(breakpoints_storaged) as TypeBreakpoints) ?? {};
        await this.monacoEditorComponent.setBreakpoints(breakpoints);
        this.ready.set(true);
      }
    });
    this.breakpointSubscription = this.monacoEditorComponent.getBreakpointsObservable().subscribe((breakpoints) => {
      this.machine.breakpointManager.updateManager(breakpoints);
      // A run going on stops at the new ones
      this.machine.updateRunBreakpoints();
    });
    this.fileSaveSubscription = this.monacoEditorComponent.getFileSaveStorageObservable().subscribe(async (editorFile) => {
      await EditorView.saveFileInLocalStorage(editorFile);
      await this.saveFileInCloudStorage(editorFile);
    });
  }

  async ngOnDestroy(): Promise<void> {
    this.destroyed = true;
    if (this.config.value().autoSave) {
      const breakpoints = this.monacoEditorComponent.getBreakpoints();
      localStorage.setItem("breakpoints", JSON.stringify(breakpoints));
      await this.closeAndSave();
    } else {
      localStorage.setItem("breakpoints", JSON.stringify({}));
    }
    this.initializedSubscription.unsubscribe();
    this.breakpointSubscription.unsubscribe();
    this.fileSaveSubscription.unsubscribe();
    return Promise.resolve();
  }

  /** What the editor says about the file: its exercise, and whether it is a program of THUMDER */
  private showFile(file: InterfaceFileItem): void {
    this.lock.set(this.exercises.lockOf(file.key));
    this.builtin.set(isBuiltin(file));
    this.copyFolder.set(copyFolderOf(file.path));
  }

  public toggleDebuggerTag(): void {
    this.monacoEditorComponent.toggleDebuggerTag();
  }

  public getListOfTags(): void {
    this.machine.writeToLog("ListOfTags: {0}", EnumLogLevel.Debug, [{ index: 0, value: this.monacoEditorComponent.getListOfTags() }]);
  }

  public async closeAndSave(): Promise<void> {
    const editorFile = await this.monacoEditorComponent.getEditorFile();

    await EditorView.saveFileInLocalStorage(editorFile);
    await this.saveFileInCloudStorage(editorFile);
  }

  private static async saveFileInLocalStorage(editorFile: THUMDER_FileItem): Promise<void> {
    localStorage.setItem("interfaceFileItem", JSON.stringify(editorFile));
  }

  /** Saves the file in the file manager (in the browser and, with an account, in it too) */
  private async saveFileInCloudStorage(editorFile: THUMDER_FileItem): Promise<void> {
    // The editor keeps one object for its file, which changes when it goes on with a copy
    const key = editorFile.key;
    const wasBuiltin = isBuiltin(editorFile);
    try {
      const saved = await this.fileSystem.editFileItem(editorFile);
      // A program of THUMDER without changes: there is nothing to save
      if (isBuiltin(saved)) return;
      // A program of THUMDER that was changed (saved as a copy), or a file that was not in the file manager any more
      // (created again): it has a new key, and the editor and its exercise go on with it
      if (saved.key !== key) {
        this.exercises.adopt(key, saved.key);
        await EditorView.saveFileInLocalStorage(saved);
        if (!this.destroyed) {
          this.interfaceFileItem = saved;
          await this.monacoEditorComponent.setEditorFile(saved);
          this.showFile(saved);
        }
      }

      const title = await firstValueFrom(this.translate.get("TOAST.TITLE_SAVE_FILE"));
      const message = wasBuiltin
        ? await firstValueFrom(this.translate.get("FILE_MANAGER.COPIED", { path: FileSystemService.join(saved.path, saved.name) }))
        : await firstValueFrom(this.translate.get("TOAST.MESSAGE_SAVE_FILE"));
      this.toastService.success(message, title, TOAST.success);
    } catch (error) {
      logger.error(error);
      const title = await firstValueFrom(this.translate.get("TOAST.TITLE_ERROR_SAVE_FILE"));
      const message = await firstValueFrom(this.translate.get("TOAST.MESSAGE_ERROR_SAVE_FILE"));
      this.toastService.error(message, title, TOAST.error);
    }
  }
}
