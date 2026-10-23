import { DOCUMENT } from "@angular/common";
import { Component, computed, DestroyRef, type ElementRef, effect, inject, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NPM_VERSION } from "@app/CONSTANTS";
import { SimulationControlsComponent } from "@components/simulation-controls/simulation-controls.component";
import { MachineService } from "@core/machine/machine.service";
import { STATUS_BADGES, simulationStatus } from "@core/machine/simulation-status";
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
  /** The bar shown (the footer or the bar of the phone), to measure it */
  private readonly bar = viewChild<ElementRef<HTMLElement>>("bar");

  /** The keyboard of the phone is open (a text field, or the editor, has the focus): the bar leaves it the room */
  public readonly typing = signal(false);

  constructor() {
    // The content leaves room for the bar of the phone
    effect(() => this.document.body.classList.toggle("thumder-has-dock", this.phone()));
    // What the bar takes at the bottom of the screen (--thumder-footer-height): the content, the panels that stay on the
    // screen, the console and the notices leave it room. It changes with the width (a line or two), the state of the
    // simulation and the bar of a phone; a footer that is not fixed (a phone sideways) takes nothing
    const measure = () => {
      const element = this.bar()?.nativeElement;
      const fixed = element !== undefined && getComputedStyle(element).position === "fixed";
      const height = fixed ? Math.ceil(element.getBoundingClientRect().height) : 0;
      this.document.documentElement.style.setProperty("--thumder-footer-height", `${height}px`);
    };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    effect((onCleanup) => {
      const element = this.bar()?.nativeElement;
      if (!element) return;
      observer?.observe(element);
      measure();
      onCleanup(() => observer?.unobserve(element));
    });
    this.document.defaultView?.addEventListener("resize", measure);
    // The keyboard of a phone is open: a text field has the focus and the screen lost most of its height
    let tallest = this.document.defaultView?.innerHeight ?? 0;
    const onChange = () => {
      const view = this.document.defaultView;
      const element = this.document.activeElement as HTMLElement | null;
      const editable =
        element !== null &&
        (element.isContentEditable ||
          // Monaco writes with the EditContext API of Chrome: a div with an editContext, not a field
          (element as HTMLElement & { editContext?: unknown }).editContext != null ||
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
      observer?.disconnect();
      view?.removeEventListener("resize", measure);
      this.document.removeEventListener("focusin", onChange);
      this.document.removeEventListener("focusout", onChange);
      view?.visualViewport?.removeEventListener("resize", onChange);
      view?.removeEventListener("resize", onChange);
      this.document.body.classList.remove("thumder-has-dock");
    });
  }

  /** What the simulator is doing */
  public readonly status = computed(() => simulationStatus(this.machine.state));

  public readonly statusText = computed(() => `STATUS.${this.status()}`);

  public readonly statusClass = computed(() => STATUS_BADGES[this.status()]);

  /** The instruction fetched in the last cycle (the operands separated by one space) */
  public readonly fetched = computed(() => (this.machine.state.pipeline()?.IF.text ?? "").replace(/\s+/g, " ").trim());
}
