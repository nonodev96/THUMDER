import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { ConfigService } from "@core/config/config.service";
import { ARCHITECTURES, type ArchitectureId, architectureOf } from "@core/engine/architectures";
import { ExerciseService } from "@core/exercises/exercise.service";
import { MachineService } from "@core/machine/machine.service";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { DropdownDirective } from "@shared/directives/bootstrap/dropdown.directive";

/**
 * The architecture simulated, in the header: DLX (the pipeline of WinDLX) or SuperDLX (superscalar). Choosing another one
 * saves it in the configuration and loads the program again in the new machine; the views of the machine follow it. An
 * exercise that locks the architecture does not let it change. `variant`: a dropdown of the navbar, or the options in
 * the menu «More» of a phone
 */
@Component({
  selector: "thumder-architecture-selector",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DropdownDirective, TranslatePipe],
  template: `
    @let now = current();
    @if (variant() === 'bar') {
      <div class="dropdown d-inline-block" thumderDropdown>
        <button type="button" class="btn dropdown-toggle architecture-toggle" id="architectureSelector" aria-haspopup="true" aria-expanded="false"
          [attr.aria-label]="('ARCH.TITLE' | translate) + ': ' + now.name" [title]="('ARCH.TITLE' | translate) + ': ' + now.name" [disabled]="busy()">
          <i class="fa-fw {{ now.icon }}" aria-hidden="true"></i>
          <span class="architecture-name" aria-hidden="true">{{ now.name }}</span>
          @if (locked()) { <i class="fas fa-lock architecture-lock" aria-hidden="true"></i> }
        </button>
        <div class="dropdown-menu architecture-menu border-0 shadow" aria-labelledby="architectureSelector">
          <p class="dropdown-header" aria-hidden="true">{{ 'ARCH.TITLE' | translate }}</p>
          @for (architecture of architectures; track architecture.id) {
            <button type="button" class="dropdown-item architecture-item" [id]="'architecture-' + architecture.id"
              [class.active]="architecture.id === now.id" [attr.aria-pressed]="architecture.id === now.id"
              [disabled]="locked() && architecture.id !== now.id" (click)="choose(architecture.id)">
              <span class="architecture-item-name"><i class="fa-fw {{ architecture.icon }}" aria-hidden="true"></i> {{ architecture.name }}</span>
              <span class="architecture-item-summary">{{ architecture.summary | translate }}</span>
            </button>
          }
          @if (locked()) {
            <p class="architecture-note" id="architectureLocked"><i class="fas fa-lock" aria-hidden="true"></i> {{ 'ARCH.LOCKED' | translate }}</p>
          } @else {
            <p class="architecture-note">{{ 'ARCH.RELOADS' | translate }}</p>
          }
        </div>
      </div>
    } @else {
      <p class="dropdown-header" aria-hidden="true">{{ 'ARCH.TITLE' | translate }}</p>
      @for (architecture of architectures; track architecture.id) {
        <button type="button" class="dropdown-item" [id]="'moreArchitecture-' + architecture.id" [class.active]="architecture.id === now.id"
          [attr.aria-pressed]="architecture.id === now.id" [disabled]="locked() && architecture.id !== now.id" (click)="choose(architecture.id)">
          <i class="fa-fw {{ architecture.icon }}" aria-hidden="true"></i> {{ architecture.name }}
          @if (locked() && architecture.id === now.id) { <i class="fas fa-lock ml-1" aria-hidden="true"></i> }
        </button>
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .architecture-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border: 1px solid var(--thumder-border-strong);
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--thumder-primary-text);
      background-color: var(--thumder-primary-soft);
      white-space: nowrap;

      &:hover,
      &:focus-visible {
        border-color: var(--thumder-primary);
      }
    }

    .architecture-lock {
      font-size: 0.7rem;
      color: var(--thumder-muted);
    }

    .architecture-menu .dropdown-header {
      color: var(--thumder-muted);
    }

    .architecture-menu {
      min-width: 19rem;
      max-width: calc(100vw - 2rem);
      padding: 0.4rem;
    }

    .architecture-item {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      border-radius: var(--thumder-radius);
      white-space: normal;
    }

    .architecture-item-name {
      font-weight: 600;
    }

    .architecture-item-summary {
      font-size: 0.8rem;
      color: var(--thumder-muted);
    }

    .architecture-item.active .architecture-item-summary {
      color: inherit;
    }

    .architecture-note {
      margin: 0.35rem 0.5rem 0.15rem;
      font-size: 0.75rem;
      color: var(--thumder-muted);
    }
  `,
})
export class ArchitectureSelectorComponent {
  private machine = inject(MachineService);
  private config = inject(ConfigService);
  private exercises = inject(ExerciseService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  public readonly variant = input<"bar" | "menu">("bar");
  public readonly architectures = ARCHITECTURES;
  /** The architecture of the machine (the one of the program loaded) */
  public readonly current = computed(() => architectureOf(this.machine.state.architecture()));
  public readonly busy = signal(false);

  /** The exercise open in the editor locks the architecture */
  public readonly locked = computed(() => {
    this.machine.state.loads();
    this.machine.state.fileKey();
    return this.exercises.currentLock()?.locked.includes("architecture") ?? false;
  });

  public async choose(id: ArchitectureId): Promise<void> {
    if (id === this.current().id || this.locked() || this.busy()) return;
    this.busy.set(true);
    try {
      this.config.update({ architecture: id });
      if (await this.machine.resetMachineStatus()) {
        const name = architectureOf(id).name;
        this.toast.info(this.translate.instant("ARCH.CHANGED", { name }), this.translate.instant("ARCH.TITLE"));
      }
    } finally {
      this.busy.set(false);
    }
  }
}
