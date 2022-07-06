import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Router } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { ToastrService } from "ngx-toastr";
import { Subscription } from "rxjs";
import { MonacoEditorComponent } from "../../../components/monaco-editor/monaco-editor.component";
import { EnumLogLevel, InterfaceFileItem, TypeBreakpoints, TypeExtrasIDE } from "../../../Types";
import { FileSystemService, THUMDER_FileItem } from "../../../__core/services/file-system/file-system.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { DEFAULT_INTERFACE_FILE_ITEM } from "../../../CONSTANTS";
import * as env  from "../../../../environments/_environment";

@Component({
  selector:    "view-editor",
  templateUrl: "./editor.view.html",
  styleUrls:   []
})
export class EditorView implements OnInit, AfterViewInit, OnDestroy {

  public env = env.AppConfig;

  @ViewChild(MonacoEditorComponent)
  public monacoEditorComponent: MonacoEditorComponent;

  public interfaceFileItem: InterfaceFileItem = DEFAULT_INTERFACE_FILE_ITEM;
  private initializedSubscription: Subscription = new Subscription();
  private breakpointSubscription: Subscription = new Subscription();
  private debuggerSubscription: Subscription = new Subscription();
  private fileSaveSubscription: Subscription = new Subscription();
  private lineSubscription: Subscription = new Subscription();

  private readonly extrasIDE: TypeExtrasIDE;
  public date: Date = new Date();
  public isMaximize = false;

  constructor(@Inject(DOCUMENT)
              private document: Document,
              private router: Router,
              private machine: MachineService,
              private fileSystem: FileSystemService,
              private translate: TranslateService,
              private toastService: ToastrService) {
    this.extrasIDE = this.router.getCurrentNavigation().extras.state as TypeExtrasIDE;
    setInterval(() => {
      this.date = new Date();
    }, 1000);
  }

  ngOnInit(): void {
    window.jQuery("#card-IDE").on("maximized.lte.cardwidget", (_$event) => {
      this.isMaximize = true;
      this.monacoEditorComponent.height = 88;
    });
    window.jQuery("#card-IDE").on("minimized.lte.cardwidget", (_$event) => {
      this.isMaximize = false;
      this.monacoEditorComponent.height = 70;
    });
  }


  ngAfterViewInit(): void {
    this.initializedSubscription = this.monacoEditorComponent.getInitializedObservable().subscribe(async (isInitialized) => {
      if (isInitialized) {
        this.interfaceFileItem = (
          this.extrasIDE?.interfaceFileItem ??
          JSON.parse(localStorage.getItem("interfaceFileItem")) ??
          DEFAULT_INTERFACE_FILE_ITEM
        ) as InterfaceFileItem;

        await this.monacoEditorComponent.setEditorFile(this.interfaceFileItem);
        await this.monacoEditorComponent.setEditorContent(this.interfaceFileItem.content);

        const breakpoints = JSON.parse(localStorage.getItem("breakpoints")) as TypeBreakpoints ?? {};
        await this.monacoEditorComponent.setBreakpoints(breakpoints);
      }
    });
    this.breakpointSubscription = this.monacoEditorComponent.getBreakpointsObservable().subscribe((breakpoints) => {
      this.machine.breakpointManager.updateManager(breakpoints);
    });
    this.debuggerSubscription = this.machine.getDebuggerObservable().subscribe((line) => {
      this.monacoEditorComponent.printLine(line);
    });
    this.debuggerSubscription = this.machine.getErrorsInCodeObservable().subscribe((errors) => {
      this.monacoEditorComponent.printErrorsInEditor(errors);
    });
    this.lineSubscription = this.machine.getLineObservable().subscribe((line) => {
      if (line === -1) {
        this.monacoEditorComponent.clearDecorationAllLines();
      } else {
        this.monacoEditorComponent.printLine(line);
      }
    });
    this.fileSaveSubscription = this.monacoEditorComponent.getFileSaveStorageObservable().subscribe(async (editorFile) => {
      await EditorView.saveFileInLocalStorage(editorFile);
      await this.saveFileInCloudStorage(editorFile);
    });
  }

  async ngOnDestroy(): Promise<void> {
    const auto_save = JSON.parse(localStorage.getItem("auto_save_configuration") ?? "false");
    if (auto_save) {
      const breakpoints = this.monacoEditorComponent.getBreakpoints();
      localStorage.setItem("breakpoints", JSON.stringify(breakpoints));
      await this.closeAndSave()
    } else {
      localStorage.setItem("breakpoints", JSON.stringify({}));
    }
    this.initializedSubscription.unsubscribe();
    this.breakpointSubscription.unsubscribe();
    this.debuggerSubscription.unsubscribe();
    this.fileSaveSubscription.unsubscribe();
    this.lineSubscription.unsubscribe();
    return Promise.resolve();
  }

  public toggleDebuggerTag(): void {
    this.monacoEditorComponent.toggleDebuggerTag();
  }

  public getListOfTags(): void {
    this.machine.writeToLog("ListOfTags: {0}", EnumLogLevel.Debug, [
      { index: 0, value: this.monacoEditorComponent.getListOfTags() }
    ]);
  }

  public async closeAndSave(): Promise<void> {
    const editorFile = await this.monacoEditorComponent.getEditorFile();

    await EditorView.saveFileInLocalStorage(editorFile);
    await this.saveFileInCloudStorage(editorFile);
  }

  private static async saveFileInLocalStorage(editorFile: THUMDER_FileItem): Promise<void> {
    localStorage.setItem("interfaceFileItem", JSON.stringify(editorFile));
  }

  private async saveFileInCloudStorage(editorFile: THUMDER_FileItem): Promise<void> {
    try {
      await this.fileSystem.editFileItem(editorFile, editorFile.$key);

      const title = await this.translate.get("TOAST.TITLE_SAVE_FILE").toPromise();
      const message = await this.translate.get("TOAST.MESSAGE_SAVE_FILE").toPromise();
      this.toastService.success(message, title, {
        timeOut:       1500,
        positionClass: "toast-bottom-left"
      });
    } catch (error) {
      console.error(error);
      const title = await this.translate.get("TOAST.TITLE_ERROR_SAVE_FILE").toPromise();
      const message = await this.translate.get("TOAST.MESSAGE_ERROR_SAVE_FILE").toPromise();
      this.toastService.error(message, title, {
        timeOut:       2500,
        positionClass: "toast-bottom-left"
      });
    }
  }
}
