import { DOCUMENT } from "@angular/common";
import { Component, computed, DestroyRef, effect, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NPM_VERSION } from "@app/CONSTANTS";
import { SimulationControlsComponent } from "@components/simulation-controls/simulation-controls.component";
import { MachineService } from "@core/machine/machine.service";
import { ElectronService } from "@core/services";
import { ConsentService } from "@core/services/consent/consent.service";
import { Globals } from "@core/services/globals/globals.service";
import { TranslatePipe } from "@ngx-translate/core";
import { mediaSignal, PHONE } from "@shared/utils/media";
import { AppConfig } from "../../../../environments/_environment";

/**
 * The footer: the status bar of the simulation (UI-10), the legal texts and the version. On a phone it is a bar at the
 * bottom of the screen, as in an app: the state of the simulation and its controls (the legal texts are in «More» of
 * the navbar). It hides while the keyboard is open
 */
@Component({
  selector: "THUMDER-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
  imports: [TranslatePipe, RouterLink, SimulationControlsComponent],
})
export class FooterComponent {
  electronService = inject(ElectronService);
  globals = inject(Globals);
  machine = inject(MachineService);
  consent = inject(ConsentService);
  private document = inject(DOCUMENT);

  public version: string = NPM_VERSION;
  public environment: string = AppConfig.environment;

  public readonly phone = mediaSignal(PHONE);
  /** The keyboard of the phone is open (a text field, or the editor, has the focus): the bar leaves it the room */
  public readonly typing = signal(false);

  constructor() {
    // The content leaves room for the bar of the phone
    effect(() => this.document.body.classList.toggle("thumder-has-dock", this.phone()));
    // The keyboard of a phone is open: a text field has the focus and the screen lost most of its height
    let tallest = this.document.defaultView?.innerHeight ?? 0;
    const onChange = () => {
      const view = this.document.defaultView;
      const element = this.document.activeElement as HTMLElement | null;
      const editable =
        element !== null &&
        (element.isContentEditable ||
          (element.tagName === "INPUT" &&
            !["button", "checkbox", "radio", "range", "submit"].includes((element as HTMLInputElement).type)) ||
          element.tagName === "TEXTAREA");
      const height = view?.visualViewport?.height ?? view?.innerHeight ?? 0;
      tallest = Math.max(tallest, view?.innerHeight ?? 0);
      this.typing.set(editable && tallest - height > 120);
    };
    const view = this.document.defaultView;
    this.document.addEventListener("focusin", onChange);
    this.document.addEventListener("focusout", onChange);
    view?.visualViewport?.addEventListener("resize", onChange);
    view?.addEventListener("resize", onChange);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener("focusin", onChange);
      this.document.removeEventListener("focusout", onChange);
      view?.visualViewport?.removeEventListener("resize", onChange);
      view?.removeEventListener("resize", onChange);
      this.document.body.classList.remove("thumder-has-dock");
    });
  }

  /** What the simulator is doing */
  public readonly status = computed(() => {
    const state = this.machine.state;
    // Nothing loaded: before the first load, or after the button of the navbar that resets the machine
    if (state.loads() === 0 || (state.code().length === 0 && state.errors().length === 0 && !state.canSimulate())) return "IDLE";
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

  /** The instruction fetched in the last cycle (the operands separated by one space) */
  public readonly fetched = computed(() => (this.machine.state.pipeline()?.IF.text ?? "").replace(/\s+/g, " ").trim());
}
