import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from "@angular/cdk/drag-drop";
import { UpperCasePipe } from "@angular/common";
import { Component, computed, effect, inject, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { TypeFloatingPointStageConfiguration, TypeMultiviewConfiguration } from "@app/Types";
import { changesMachine, defaultConfig, type SoundConfig, type ThumderConfig, validateConfig } from "@core/config/config";
import { ConfigService } from "@core/config/config.service";
import { ExerciseService } from "@core/exercises/exercise.service";
import type { Lockable } from "@core/exercises/share";
import { MachineService } from "@core/machine/machine.service";
import { Globals } from "@core/services/globals/globals.service";
import { SoundService } from "@core/services/sound/sound.service";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalService } from "@shared/directives/bootstrap/modal.directive";
import { ModalDismissDirective } from "../../../__shared/directives/bootstrap/modal.directive";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

type FloatingPointUnit = keyof TypeFloatingPointStageConfiguration;

/** The modal that asks before a change of the configuration throws away the simulation going on */
const CONFIRM_MODAL = "configConfirmModal";

@Component({
  selector: "view-config",
  templateUrl: "./config.view.html",
  styleUrls: ["./config.view.scss"],
  imports: [
    CardDirective,
    CardWidgetDirective,
    FormsModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragHandle,
    ModalDismissDirective,
    UpperCasePipe,
    TranslatePipe,
  ],
})
export class ConfigView {
  globals = inject(Globals);
  private config = inject(ConfigService);
  private machine = inject(MachineService);
  private modals = inject(ModalService);
  private exercises = inject(ExerciseService);
  private soundService = inject(SoundService);

  /** The options the exercise open in the editor locks (EDU-07): shown, but they cannot change */
  public readonly lock = signal(this.exercises.currentLock());

  public isLocked(key: Lockable): boolean {
    return this.lock()?.locked.includes(key) ?? false;
  }

  public readonly units: { key: FloatingPointUnit; label: string }[] = [
    { key: "addition", label: "CONFIG.ADDITION" },
    { key: "multiplication", label: "CONFIG.MULTIPLICATION" },
    { key: "division", label: "CONFIG.DIVISION" },
  ];

  // The form: a copy of the configuration (core/config), changed by the inputs until it is saved
  public enabledForwardingConfiguration = true;
  public floatingPointStageConfiguration!: TypeFloatingPointStageConfiguration;
  public memorySizeConfiguration = 0;
  public timeSimulationConfiguration = 0;
  public autoSaveConfiguration = true;
  public multiviewConfiguration!: TypeMultiviewConfiguration;
  public diagramHistoryConfiguration = 0;

  /** The sounds: they are saved at once (not with the form), so that they can be tried */
  public readonly sound = computed(() => this.config.value().sound);

  public setSound(change: Partial<SoundConfig>, preview = false): void {
    this.config.update({ sound: { ...this.sound(), ...change } });
    if (preview || change.enabled === true) {
      this.soundService.unlock();
      this.soundService.event("load");
    }
  }

  public previewSound(): void {
    this.soundService.preview();
  }

  /** What the user asked to save while the confirmation is open */
  private pending: ThumderConfig | null = null;

  constructor() {
    // The saved configuration (validated: with the values adjusted to their limits) fills the form again; the sounds and
    // the floating windows are saved apart, and changing them does not undo what the form has not saved yet
    const formPart = computed(() => {
      const { sound: _sound, windows: _windows, ...rest } = this.config.value();
      return JSON.stringify(rest);
    });
    effect(() => {
      formPart();
      untracked(() => this.fill(this.config.value()));
    });
  }

  private fill(config: ThumderConfig): void {
    const copy = structuredClone(config);
    this.enabledForwardingConfiguration = copy.forwarding;
    this.floatingPointStageConfiguration = copy.floatingPoint;
    this.memorySizeConfiguration = copy.memorySize;
    this.timeSimulationConfiguration = copy.delay;
    this.autoSaveConfiguration = copy.autoSave;
    this.multiviewConfiguration = copy.multiview;
    this.diagramHistoryConfiguration = copy.diagramHistory;
  }

  /** What the form says, valid */
  private fromForm(): ThumderConfig {
    return validateConfig({
      forwarding: this.enabledForwardingConfiguration,
      floatingPoint: this.floatingPointStageConfiguration,
      memorySize: this.memorySizeConfiguration,
      delay: this.timeSimulationConfiguration,
      autoSave: this.autoSaveConfiguration,
      multiview: this.multiviewConfiguration,
      diagramHistory: this.diagramHistoryConfiguration,
      // Not in the form: the floating windows of the multiview and the sounds (saved at once) stay as they are
      windows: this.config.value().windows,
      sound: this.config.value().sound,
    });
  }

  /**
   * Saving or restoring the defaults. A change of what the simulator uses (forwarding, units, memory) loads the program
   * again: if a simulation is going on, the user confirms it first. The rest (speed, autosave, windows) is saved as it is
   */
  public request(action: "save" | "reset", opener: EventTarget | null): void {
    const next = action === "reset" ? defaultConfig() : this.fromForm();
    const reload = changesMachine(this.config.value(), next);
    if (reload && (this.machine.step > 0 || this.machine.isRunning)) {
      this.pending = next;
      this.modals.open(CONFIRM_MODAL, opener as HTMLElement | null);
    } else {
      void this.apply(next, reload);
    }
  }

  public async confirm(): Promise<void> {
    this.modals.close(CONFIRM_MODAL);
    if (this.pending) await this.apply(this.pending, true);
    this.pending = null;
  }

  private async apply(next: ThumderConfig, reload: boolean): Promise<void> {
    this.config.save(next);
    if (reload) await this.machine.resetMachineStatus();
  }

  /** The values out of range, to their limits (as they will be saved), when an input loses the focus */
  public clampValues(): void {
    const valid = this.fromForm();
    this.floatingPointStageConfiguration = valid.floatingPoint;
    this.memorySizeConfiguration = valid.memorySize;
    this.timeSimulationConfiguration = valid.delay;
    this.diagramHistoryConfiguration = valid.diagramHistory;
  }
}
