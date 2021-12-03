import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { MonacoEditorComponent } from "../../../components/monaco-editor/monaco-editor.component";
import { InterfaceFileItem, TypeExtrasIDE } from "../../../types";
import { FileSystemService } from "../../../__core/services/file-system-nonodev96/file-system.service";
import { Utils } from "../../../Utils";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { MachineService } from "../../../__core/machine/machine.service";
import { Subscription } from "rxjs";
import { DEFAULT_INTERFACE_FILE_ITEM } from "../../../CONSTAST";

@Component({
  selector: "view-ide",
  templateUrl: "./ide.view.html",
  styleUrls: []
})
export class IDEView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MonacoEditorComponent) monacoEditorComponent: MonacoEditorComponent;
  isMaximize = false;

  public interfaceFileItem: InterfaceFileItem = DEFAULT_INTERFACE_FILE_ITEM;
  private initializedSubscription: Subscription = new Subscription();
  private breakpointSubscription: Subscription = new Subscription();
  private debuggerSubscription: Subscription = new Subscription();
  private lineSubscription: Subscription = new Subscription();
  private readonly extrasIDE: TypeExtrasIDE;

  constructor(@Inject(DOCUMENT) private document: Document,
              private router: Router,
              private machine: MachineService,
              private fileSystem: FileSystemService,
              private translate: TranslateService,
              private toastService: ToastrService) {
    this.extrasIDE = this.router.getCurrentNavigation().extras.state as TypeExtrasIDE;
  }

  ngOnInit(): void {
    window.jQuery('#card-IDE').on('maximized.lte.cardwidget', ($event) => {
      this.isMaximize = true;
      this.monacoEditorComponent.height = 88;
    });
    window.jQuery('#card-IDE').on('minimized.lte.cardwidget', ($event) => {
      this.isMaximize = false;
      this.monacoEditorComponent.height = 70;
    });
  }


  ngAfterViewInit(): void {
    this.initializedSubscription = this.monacoEditorComponent.getInitializedObservable().subscribe(async (isInitialized) => {
      if (isInitialized) {
        let content = '';
        let interfaceFileItem: InterfaceFileItem = DEFAULT_INTERFACE_FILE_ITEM;
        if (this.extrasIDE) {
          interfaceFileItem = this.extrasIDE.interfaceFileItem ?? Utils.new_InterfaceFileItem();
          content = interfaceFileItem.content;
          localStorage.setItem('interfaceFileItem', JSON.stringify(interfaceFileItem));
        } else {
          interfaceFileItem = JSON.parse(localStorage.getItem('interfaceFileItem')) as InterfaceFileItem;
          content = interfaceFileItem.content ?? '';
        }
        this.interfaceFileItem = interfaceFileItem;
        await this.monacoEditorComponent.updateContent(content);
        const breakpoints = JSON.parse(localStorage.getItem('breakpoints'));
        this.monacoEditorComponent.setBreakpoints(breakpoints);
        return Promise.resolve();
      }
    });
    this.breakpointSubscription = this.monacoEditorComponent.getBreakpointsObservable().subscribe((breakpoints) => {
      this.machine.breakpointManager.updateManager(breakpoints);
    });
    this.debuggerSubscription = this.machine.getDebuggerObservable().subscribe((line) => {
      this.monacoEditorComponent.printLine(line);
    });
    this.lineSubscription = this.machine.getLineObservable().subscribe((line) => {
      this.monacoEditorComponent.printLine(line);
    });
  }

  async ngOnDestroy(): Promise<void> {
    const auto_save = localStorage.getItem('auto_save');
    if (auto_save) {
      localStorage.setItem('breakpoints', JSON.stringify(this.monacoEditorComponent.breakpoints));
      await this.save();
    } else {
      localStorage.setItem('breakpoints', JSON.stringify({}));
    }
    this.initializedSubscription.unsubscribe();
    this.breakpointSubscription.unsubscribe();
    this.debuggerSubscription.unsubscribe();
    this.lineSubscription.unsubscribe();
    return Promise.resolve();
  }

  toggleDebuggerTag(): void {
    this.monacoEditorComponent.toggleDebuggerTag();
  }

  getListOfTags(): void {
    this.machine.log(this.monacoEditorComponent.getListOfTags());
  }

  changeHeight(): void {
    this.monacoEditorComponent.height = 1000;
  }

  public async save(): Promise<void> {
    let interfaceFileItem;
    const updateContent = this.monacoEditorComponent.content;
    if (this.extrasIDE) {
      interfaceFileItem = this.extrasIDE.interfaceFileItem;
    } else {
      interfaceFileItem = JSON.parse(localStorage.getItem('interfaceFileItem'));
    }
    interfaceFileItem.content = updateContent;
    localStorage.setItem('interfaceFileItem', JSON.stringify(interfaceFileItem));
    try {
      await this.fileSystem.editFileItem(interfaceFileItem, interfaceFileItem.$key);

      const title = await this.translate.get('TOAST.TITLE_SAVE_FILE').toPromise();
      const message = await this.translate.get('TOAST.MESSAGE_SAVE_FILE').toPromise();
      this.toastService.success(message, title, {
        timeOut: 1500,
        positionClass: 'toast-bottom-left'
      });
    } catch (error) {
      console.error(error);
      const title = await this.translate.get('TOAST.TITLE_ERROR_SAVE_FILE').toPromise();
      const message = await this.translate.get('TOAST.MESSAGE_ERROR_SAVE_FILE').toPromise();
      this.toastService.error(message, title, {
        timeOut: 2500,
        positionClass: 'toast-bottom-left'
      });
    }

    return Promise.resolve();
  }
}
