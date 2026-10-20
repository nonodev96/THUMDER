import { Injectable, inject } from "@angular/core";

import { MachineService } from "@core/machine/machine.service";
import { EditorStateService } from "@core/services/editor/editor-state.service";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslateService } from "@ngx-translate/core";

/**
 * What the controls of the simulation do (the navbar, the bar at the bottom of a phone and the keyboard shortcuts): load
 * the code, run or pause, one cycle forward or back, run to the end without drawing, and clear the machine
 */
@Injectable({ providedIn: "root" })
export class SimulationControlsService {
  private machine = inject(MachineService);
  private toast = inject(ToastService);
  private editorState = inject(EditorStateService);
  private translate = inject(TranslateService);

  /** Loads the saved file in the simulator (the changes of the editor that are not saved are not loaded: it says so) */
  public async load(): Promise<void> {
    await this.machine.reset();
    if (this.editorState.unsaved()) {
      this.toast.warning(this.translate.instant("SIMULATION.LOADED_UNSAVED"), this.translate.instant("SIMULATION.LOADED_UNSAVED_TITLE"));
    }
  }

  public async togglePlayPause(): Promise<void> {
    if (this.machine.isRunning) await this.machine.pause();
    else await this.machine.resume();
  }

  public async step(): Promise<void> {
    await this.machine.nextStep();
  }

  public async stepBack(): Promise<void> {
    await this.machine.stepBack();
  }

  public async runToEnd(): Promise<void> {
    await this.machine.runToEnd();
  }

  /** Everything to zero (the memory, the code and the registers), without a program: Load loads it again */
  public async clear(): Promise<void> {
    await this.machine.clear();
    this.toast.info(this.translate.instant("SIMULATION.CLEARED"), this.translate.instant("SIMULATION.CLEARED_TITLE"));
  }
}
