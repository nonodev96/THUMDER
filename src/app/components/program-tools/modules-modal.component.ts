import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { InterfaceFileItem } from "@app/Types";
import { MachineService, type ProgramModules } from "@core/machine/machine.service";
import { FileSystemService } from "@core/services/file-system/file-system.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalDismissDirective, ModalService } from "@shared/directives/bootstrap/modal.directive";

export const MODULES_MODAL = "programModulesModal";

/**
 * The modules of the program (NUC-10, «Load Code or Data» of WinDLX): the other .s files of its folder that are
 * assembled with it. Automatic: those that define, with .global, the symbols the program needs
 */
@Component({
  selector: "thumder-modules-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, ModalDismissDirective],
  template: `
    <div class="modal fade" [id]="id" tabindex="-1" aria-labelledby="programModulesTitle" aria-hidden="true" style="display: none">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="programModulesTitle">{{ 'MODULES.TITLE' | translate: { name: file()?.name ?? '' } }}</h2>
            <button type="button" class="close" thumderModalDismiss [attr.aria-label]="'FORMS.CLOSE' | translate"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <p class="small text-muted">{{ 'MODULES.HELP' | translate }}</p>
            <div class="custom-control custom-radio">
              <input type="radio" class="custom-control-input" id="modulesAuto" name="modulesMode" [checked]="automatic()" (change)="automatic.set(true)" cdkFocusInitial>
              <label class="custom-control-label" for="modulesAuto">{{ 'MODULES.AUTOMATIC' | translate }}</label>
            </div>
            <div class="custom-control custom-radio mb-2">
              <input type="radio" class="custom-control-input" id="modulesChosen" name="modulesMode" [checked]="!automatic()" (change)="automatic.set(false)">
              <label class="custom-control-label" for="modulesChosen">{{ 'MODULES.CHOSEN' | translate }}</label>
            </div>
            @if (candidates().length === 0) {
              <p class="small mb-0">{{ 'MODULES.NONE' | translate }}</p>
            }
            <fieldset [disabled]="automatic()" class="ml-4">
              <legend class="sr-only">{{ 'MODULES.CHOSEN' | translate }}</legend>
              @for (name of candidates(); track name) {
                <div class="custom-control custom-checkbox">
                  <input type="checkbox" class="custom-control-input" [id]="'module-' + $index" [checked]="chosen().includes(name)" (change)="toggle(name)">
                  <label class="custom-control-label" [for]="'module-' + $index">{{ name }}</label>
                </div>
              }
            </fieldset>
            @if (machine.state.modules().length > 0) {
              <p class="small mt-2 mb-0">{{ 'MODULES.LOADED' | translate: { names: machine.state.modules().join(', ') } }}</p>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" thumderModalDismiss>{{ 'FORMS.CANCEL' | translate }}</button>
            <button type="button" class="btn btn-primary" id="programModulesSave" (click)="save()">{{ 'MODULES.SAVE' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModulesModalComponent {
  public machine = inject(MachineService);
  private storage = inject(StorageService);
  private fileSystem = inject(FileSystemService);
  private modals = inject(ModalService);

  public readonly id = MODULES_MODAL;
  public readonly file = signal<InterfaceFileItem | null>(null);
  public readonly candidates = signal<string[]>([]);
  public readonly automatic = signal(true);
  public readonly chosen = signal<string[]>([]);

  private get all(): ProgramModules {
    return (this.storage.getItem("program_modules") as ProgramModules | null) ?? {};
  }

  /** Opens it for the file of the editor */
  public async open(opener: EventTarget | null): Promise<void> {
    const file = this.storage.getItem("interfaceFileItem") as InterfaceFileItem;
    this.file.set(file);
    this.candidates.set((await this.fileSystem.programFiles(file)).map((module) => module.name).sort());
    const chosen = this.all[file.key];
    this.automatic.set(chosen === undefined);
    this.chosen.set(chosen ?? [...this.machine.state.modules()]);
    this.modals.open(this.id, opener as HTMLElement | null);
  }

  public toggle(name: string): void {
    this.chosen.update((chosen) => (chosen.includes(name) ? chosen.filter((other) => other !== name) : [...chosen, name]));
  }

  /** Saves the choice and loads the program again with it */
  public async save(): Promise<void> {
    const file = this.file();
    if (file === null) return;
    const all = { ...this.all };
    if (this.automatic()) delete all[file.key];
    else all[file.key] = this.candidates().filter((name) => this.chosen().includes(name));
    this.storage.setItem("program_modules", all);
    this.modals.close(this.id);
    if (!this.machine.isRunning) await this.machine.resetMachineStatus();
  }
}
