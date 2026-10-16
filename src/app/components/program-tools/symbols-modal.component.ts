import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalDismissDirective } from "@shared/directives/bootstrap/modal.directive";

export const SYMBOLS_MODAL = "programSymbolsModal";

/** The labels of the program loaded and their addresses (NUC-11, WinDLX: Memory → Symbols) */
@Component({
  selector: "thumder-symbols-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ModalDismissDirective],
  template: `
    <div class="modal fade" [id]="id" tabindex="-1" aria-labelledby="programSymbolsTitle" aria-hidden="true" style="display: none">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="programSymbolsTitle">{{ 'SYMBOLS.TITLE' | translate }}</h2>
            <button type="button" class="close" thumderModalDismiss [attr.aria-label]="'FORMS.CLOSE' | translate"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <label class="sr-only" for="symbolsFilter">{{ 'SYMBOLS.FILTER' | translate }}</label>
            <input type="search" class="form-control form-control-sm mb-2" id="symbolsFilter" cdkFocusInitial
              [placeholder]="'SYMBOLS.FILTER' | translate" (input)="filter.set($any($event.target).value)">
            @if (machine.state.symbols().length === 0) {
              <p class="text-muted small mb-0">{{ 'SYMBOLS.NONE' | translate }}</p>
            } @else {
              <table class="table table-sm table-striped mb-0" id="symbolsTable">
                <thead>
                  <tr>
                    <th scope="col">{{ 'SYMBOLS.NAME' | translate }}</th>
                    <th scope="col">{{ 'SYMBOLS.ADDRESS' | translate }}</th>
                    <th scope="col">{{ 'SYMBOLS.FILE' | translate }}</th>
                    <th scope="col">{{ 'SYMBOLS.SCOPE' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (symbol of symbols(); track symbol.file + symbol.name) {
                    <tr>
                      <td class="text-monospace">{{ symbol.name }}</td>
                      <td class="text-monospace">{{ symbol.address }}</td>
                      <td>{{ symbol.file }}</td>
                      <td>{{ (symbol.global ? 'SYMBOLS.GLOBAL' : 'SYMBOLS.LOCAL') | translate }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" thumderModalDismiss>{{ 'FORMS.CLOSE' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SymbolsModalComponent {
  public machine = inject(MachineService);
  public readonly id = SYMBOLS_MODAL;
  public readonly filter = signal("");
  public readonly symbols = computed(() => {
    const text = this.filter().trim().toLowerCase();
    return this.machine.state
      .symbols()
      .filter((symbol) => !text || symbol.name.toLowerCase().includes(text) || symbol.address.toLowerCase().includes(text));
  });
}
