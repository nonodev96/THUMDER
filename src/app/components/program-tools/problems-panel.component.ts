import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Output } from "@angular/core";
import { EnumSeverity } from "@app/Types";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * The problems of the program (UI-06): the errors and the warnings of the assembler, each one with its line (a click
 * takes the editor there), and why the program cannot be simulated
 */
@Component({
  selector: "thumder-problems-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <section class="problems-panel" aria-labelledby="problemsTitle">
      <h4 class="h6" id="problemsTitle">
        {{ 'PROBLEMS.TITLE' | translate }}
        @if (loaded()) { <span class="badge" [class.badge-danger]="errorCount() > 0" [class.badge-success]="problems().length === 0" [class.badge-warning]="errorCount() === 0 && problems().length > 0">{{ problems().length }}</span> }
      </h4>
      @if (!loaded()) {
        <p class="text-muted small mb-0">{{ 'PROBLEMS.NOT_LOADED' | translate }}</p>
      } @else if (problems().length === 0) {
        <p class="text-success small mb-0"><i class="fas fa-check" aria-hidden="true"></i> {{ 'PROBLEMS.NONE' | translate }}</p>
      } @else {
        @if (errorCount() > 0) {
          <p class="text-danger small mb-1" role="alert">{{ 'PROBLEMS.CANNOT_SIMULATE' | translate: { count: errorCount() } }}</p>
        }
        <ul class="list-unstyled mb-0 problems-list">
          @for (problem of problems(); track $index) {
            <li>
              <button type="button" class="btn btn-link btn-sm text-left p-0" (click)="goToLine.emit(problem.line)">
                <i class="fas fa-fw" [class.fa-times-circle]="problem.severity === error" [class.text-danger]="problem.severity === error"
                  [class.fa-exclamation-triangle]="problem.severity !== error" [class.text-warning]="problem.severity !== error" aria-hidden="true"></i>
                <span class="sr-only">{{ (problem.severity === error ? 'PROBLEMS.ERROR' : 'PROBLEMS.WARNING') | translate }}</span>
                {{ 'PROBLEMS.LINE' | translate: { line: problem.line } }}: {{ problem.message }}
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class ProblemsPanelComponent {
  private machine = inject(MachineService);

  /** The line of a problem, chosen */
  @Output() public goToLine = new EventEmitter<number>();

  public readonly error = EnumSeverity.Error;
  public readonly loaded = computed(() => this.machine.state.loads() > 0);
  public readonly problems = this.machine.state.errors;
  public readonly errorCount = computed(() => this.problems().filter((problem) => problem.severity === EnumSeverity.Error).length);
}
