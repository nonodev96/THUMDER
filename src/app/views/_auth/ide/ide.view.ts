import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { MonacoEditorComponent } from "../../../components/monaco-editor/monaco-editor.component";
import { TypeExtrasIDE } from "../../../types";
import { FileSystemService } from "../../../__core/services/file-system-nonodev96/file-system.service";
import { Utils } from "../../../Utils";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { MachineService } from "../../../__core/machine/machine.service";

@Component({
  selector: "view-ide",
  templateUrl: "./ide.view.html",
  styleUrls: []
})
export class IDEView implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MonacoEditorComponent) monacoEditorComponent: MonacoEditorComponent;
  isMaximize = false;

  extrasIDE: TypeExtrasIDE;

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
    this.monacoEditorComponent.getInitializedObservable().subscribe(async (isInitialized) => {
      if (isInitialized) {
        let content = '';
        if (this.extrasIDE) {
          const interfaceFileItem = this.extrasIDE.interfaceFileItem ?? Utils.new_InterfaceFileItem();
          content = interfaceFileItem.content;
          localStorage.setItem('interfaceFileItem', JSON.stringify(interfaceFileItem));
        } else {
          content = JSON.parse(localStorage.getItem('interfaceFileItem')).content ?? '';
        }
        await this.monacoEditorComponent.updateContent(content);
        const breakpoints = JSON.parse(localStorage.getItem('breakpoints'));
        this.monacoEditorComponent.setBreakpoints(breakpoints);
        return Promise.resolve();
      }
    });
    this.monacoEditorComponent.getBreakpointsObservable().subscribe((breakpoints) => {
      this.machine.breakpointManager.updateManager(breakpoints);
    });
    this.machine.getDebuggerObservable().subscribe((line) => {
      this.monacoEditorComponent.printLine(line);
    });
    this.machine.getLineObservable().subscribe((line) => {
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
    return Promise.resolve();
  }

  toggleDebuggerTag(): void {
    this.monacoEditorComponent.toggleDebuggerTag();
  }

  getListOfTags(): void {
    console.log(this.monacoEditorComponent.getListOfTags());
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
      this.toastService.success(message, title, {timeOut: 1500});
    } catch (error) {
      console.error(error);
      const title = await this.translate.get('TOAST.TITLE_ERROR_SAVE_FILE').toPromise();
      const message = await this.translate.get('TOAST.MESSAGE_ERROR_SAVE_FILE').toPromise();
      this.toastService.error(message, title, {timeOut: 2500});
    }

    return Promise.resolve();
  }
}
