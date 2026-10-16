import { Component, computed, inject } from "@angular/core";
import { NPM_VERSION } from "@app/CONSTANTS";
import { MachineService } from "@core/machine/machine.service";
import { ElectronService } from "@core/services";
import { Globals } from "@core/services/globals/globals.service";
import { TranslatePipe } from "@ngx-translate/core";
import { AppConfig } from "../../../../environments/_environment";

/** The footer: the status bar of the simulation (UI-10) and the version */
@Component({
  selector: "THUMDER-footer",
  templateUrl: "./footer.component.html",
  imports: [TranslatePipe],
})
export class FooterComponent {
  electronService = inject(ElectronService);
  globals = inject(Globals);
  machine = inject(MachineService);

  public version: string = NPM_VERSION;
  public environment: string = AppConfig.environment;

  /** What the simulator is doing */
  public readonly status = computed(() => {
    const state = this.machine.state;
    if (state.loads() === 0) return "IDLE";
    if (state.quiet()) return "QUIET";
    if (state.running()) return "RUNNING";
    if (state.complete()) return "COMPLETE";
    if (state.waitingForInput()) return "INPUT";
    if (state.breakpoint()) return "BREAKPOINT";
    if (!state.canSimulate()) return "ERRORS";
    return state.cycles() === 0 ? "LOADED" : "PAUSED";
  });

  public readonly statusText = computed(() => `STATUS.${this.status()}`);

  public readonly statusClass = computed(
    () =>
      ({
        IDLE: "badge-secondary",
        QUIET: "badge-info",
        RUNNING: "badge-success",
        COMPLETE: "badge-primary",
        INPUT: "badge-warning",
        BREAKPOINT: "badge-warning",
        ERRORS: "badge-danger",
        LOADED: "badge-secondary",
        PAUSED: "badge-secondary",
      })[this.status()],
  );

  /** The instruction fetched in the last cycle */
  public readonly fetched = computed(() => this.machine.state.pipeline()?.IF.text ?? "");
}
