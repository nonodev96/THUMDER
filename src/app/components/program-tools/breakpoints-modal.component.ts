import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { TypeBreakpoints } from "@app/Types";
import type { Watchpoint } from "@core/engine/runner";
import type { BreakpointStage } from "@core/engine/simulator";
import { type BreakpointStages, MachineService } from "@core/machine/machine.service";
import { StorageService } from "@core/storage/storage.service";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalDismissDirective, ModalService } from "@shared/directives/bootstrap/modal.directive";

export const BREAKPOINTS_MODAL = "programBreakpointsModal";

const SIZES = [1, 2, 4, 8] as const;

/**
 * The breakpoints (NUC-11): the stage each line waits for (IF, the default, is when its instruction is fetched; ID,
 * EX, MEM or WB, when it arrives there), and the addresses of the memory watched when they are read or written
 */
@Component({
  selector: "thumder-breakpoints-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, ModalDismissDirective],
  template: `
    <div class="modal fade" [id]="id" tabindex="-1" aria-labelledby="programBreakpointsTitle" aria-hidden="true" style="display: none">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="programBreakpointsTitle">{{ 'BREAKPOINTS.TITLE' | translate }}</h2>
            <button type="button" class="close" thumderModalDismiss [attr.aria-label]="'FORMS.CLOSE' | translate"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <h3 class="h6">{{ 'BREAKPOINTS.LINES' | translate }}</h3>
            <p class="small text-muted">{{ 'BREAKPOINTS.LINES_HELP' | translate }}</p>
            @if (lines().length === 0) {
              <p class="small">{{ 'BREAKPOINTS.NO_LINES' | translate }}</p>
            } @else {
              <table class="table table-sm mb-3" id="breakpointsLines">
                <thead>
                  <tr><th scope="col">{{ 'BREAKPOINTS.LINE' | translate }}</th><th scope="col">{{ 'BREAKPOINTS.CODE' | translate }}</th><th scope="col">{{ 'BREAKPOINTS.STAGE' | translate }}</th></tr>
                </thead>
                <tbody>
                  @for (line of lines(); track line.line) {
                    <tr>
                      <td>{{ line.line }}</td>
                      <td class="text-monospace small">{{ line.text }}</td>
                      <td>
                        <label class="sr-only" [for]="'breakpointStage-' + line.line">{{ 'BREAKPOINTS.STAGE' | translate }}</label>
                        <select class="custom-select custom-select-sm" [id]="'breakpointStage-' + line.line" [ngModel]="line.stage" (ngModelChange)="setStage(line.line, $event)">
                          @for (stage of stages; track stage) { <option [value]="stage">{{ stage }}</option> }
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }

            <h3 class="h6">{{ 'BREAKPOINTS.WATCHPOINTS' | translate }}</h3>
            <p class="small text-muted">{{ 'BREAKPOINTS.WATCHPOINTS_HELP' | translate }}</p>
            @if (watchpoints().length > 0) {
              <ul class="list-unstyled" id="breakpointsWatchpoints">
                @for (watch of watchpoints(); track $index) {
                  <li class="d-flex align-items-center mb-1">
                    <span class="text-monospace mr-2">{{ hex(watch.address) }}</span>
                    <span class="mr-2">({{ watch.bytes }} B)</span>
                    <span class="mr-2">{{ (watch.read && watch.write ? 'BREAKPOINTS.READ_WRITE' : watch.read ? 'BREAKPOINTS.READ' : 'BREAKPOINTS.WRITE') | translate }}</span>
                    <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeWatch($index)" [attr.aria-label]="'BREAKPOINTS.REMOVE' | translate">
                      <i class="fas fa-trash-alt" aria-hidden="true"></i>
                    </button>
                  </li>
                }
              </ul>
            }
            <form class="form-inline" (ngSubmit)="addWatch()">
              <label class="sr-only" for="watchAddress">{{ 'BREAKPOINTS.ADDRESS' | translate }}</label>
              <input type="text" class="form-control form-control-sm mr-2 mb-1 text-monospace" id="watchAddress" name="address" [(ngModel)]="address"
                [placeholder]="'BREAKPOINTS.ADDRESS' | translate" [class.is-invalid]="invalidAddress()" autocomplete="off">
              <label class="sr-only" for="watchBytes">{{ 'BREAKPOINTS.SIZE' | translate }}</label>
              <select class="custom-select custom-select-sm mr-2 mb-1" id="watchBytes" name="bytes" [(ngModel)]="bytes">
                @for (size of sizes; track size) { <option [ngValue]="size">{{ size }} B</option> }
              </select>
              <div class="custom-control custom-checkbox mr-2 mb-1">
                <input type="checkbox" class="custom-control-input" id="watchRead" name="read" [(ngModel)]="read">
                <label class="custom-control-label" for="watchRead">{{ 'BREAKPOINTS.READ' | translate }}</label>
              </div>
              <div class="custom-control custom-checkbox mr-2 mb-1">
                <input type="checkbox" class="custom-control-input" id="watchWrite" name="write" [(ngModel)]="write">
                <label class="custom-control-label" for="watchWrite">{{ 'BREAKPOINTS.WRITE' | translate }}</label>
              </div>
              <button type="submit" class="btn btn-sm btn-primary mb-1" id="watchAdd" [disabled]="!read && !write">{{ 'BREAKPOINTS.ADD' | translate }}</button>
              @if (invalidAddress()) { <div class="invalid-feedback d-block w-100">{{ 'BREAKPOINTS.INVALID_ADDRESS' | translate }}</div> }
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" thumderModalDismiss>{{ 'FORMS.CLOSE' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BreakpointsModalComponent {
  private machine = inject(MachineService);
  private storage = inject(StorageService);
  private modals = inject(ModalService);

  public readonly id = BREAKPOINTS_MODAL;
  public readonly stages: BreakpointStage[] = ["IF", "ID", "EX", "MEM", "WB"];
  public readonly sizes = SIZES;
  public readonly lines = signal<{ line: number; text: string; stage: BreakpointStage }[]>([]);
  public readonly watchpoints = signal<Watchpoint[]>([]);
  public readonly invalidAddress = signal(false);
  public address = "";
  public bytes: (typeof SIZES)[number] = 4;
  public read = false;
  public write = true;

  /** Opens it with the breakpoints of the editor and the text of their lines */
  public open(breakpoints: TypeBreakpoints, content: string, opener: EventTarget | null): void {
    const source = content.split("\n");
    const stages = (this.storage.getItem("breakpoint_stages") as BreakpointStages | null) ?? {};
    this.lines.set(
      Object.entries(breakpoints)
        .filter(([, active]) => active)
        .map(([line]) => Number(line))
        .sort((a, b) => a - b)
        .map((line) => ({ line, text: (source[line - 1] ?? "").trim(), stage: stages[line] ?? "IF" })),
    );
    this.watchpoints.set((this.storage.getItem("watchpoints") as Watchpoint[] | null) ?? []);
    this.invalidAddress.set(false);
    this.modals.open(this.id, opener as HTMLElement | null);
  }

  public hex(address: number): string {
    return `0x${address.toString(16).toUpperCase().padStart(8, "0")}`;
  }

  public setStage(line: number, stage: BreakpointStage): void {
    const stages = { ...((this.storage.getItem("breakpoint_stages") as BreakpointStages | null) ?? {}) };
    if (stage === "IF") delete stages[line];
    else stages[line] = stage;
    this.storage.setItem("breakpoint_stages", stages);
    this.lines.update((lines) => lines.map((item) => (item.line === line ? { ...item, stage } : item)));
    this.machine.updateRunBreakpoints();
  }

  public addWatch(): void {
    const text = this.address.trim().replace(/^0x/i, "");
    const address = /^[0-9a-f]{1,8}$/i.test(text) ? Number.parseInt(text, 16) : Number.NaN;
    if (!Number.isFinite(address) || address % this.bytes !== 0) {
      this.invalidAddress.set(true);
      return;
    }
    this.invalidAddress.set(false);
    this.save([...this.watchpoints(), { address, bytes: this.bytes, read: this.read, write: this.write }]);
    this.address = "";
  }

  public removeWatch(index: number): void {
    this.save(this.watchpoints().filter((_, i) => i !== index));
  }

  private save(watchpoints: Watchpoint[]): void {
    this.watchpoints.set(watchpoints);
    this.storage.setItem("watchpoints", watchpoints);
    this.machine.updateRunBreakpoints();
  }
}
