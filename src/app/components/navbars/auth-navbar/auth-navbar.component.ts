import { DOCUMENT } from "@angular/common";
import { Component, computed, HostListener, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { AUTH_ROUTES, TOAST } from "@app/CONSTANTS";
import { AuthService } from "@core/auth/auth.service";
import { ConfigService } from "@core/config/config.service";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { EditorStateService } from "@core/services/editor/editor-state.service";
import { SidebarService } from "@core/services/layout/sidebar.service";
import { type ThemeChoice, ThemeService } from "@core/services/theme/theme.service";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { DropdownDirective } from "../../../__shared/directives/bootstrap/dropdown.directive";

@Component({
  selector: "THUMDER-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
  imports: [RouterLink, DropdownDirective, TranslatePipe],
})
export class AuthNavbarComponent {
  private _document = inject<Document>(DOCUMENT);
  app = inject<AppComponent>(AppComponent);
  machine = inject(MachineService);
  authService = inject(AuthService);
  sidebar = inject(SidebarService);
  config = inject(ConfigService);
  theme = inject(ThemeService);
  private toast = inject(ToastService);
  private editorState = inject(EditorStateService);
  private translate = inject(TranslateService);

  public readonly themes: { choice: ThemeChoice; label: string; icon: string }[] = [
    { choice: "light", label: "THEME.LIGHT", icon: "fa-sun" },
    { choice: "dark", label: "THEME.DARK", icon: "fa-moon" },
    { choice: "system", label: "THEME.SYSTEM", icon: "fa-desktop" },
  ];

  /** The paces of the simulation (UI-04): ms between cycles */
  public readonly speeds = [
    { delay: 0, label: "SIMULATION.SPEED_MAX" },
    { delay: 25, label: "SIMULATION.SPEED_FAST" },
    { delay: 100, label: "SIMULATION.SPEED_NORMAL" },
    { delay: 250, label: "SIMULATION.SPEED_SLOW" },
    { delay: 1000, label: "SIMULATION.SPEED_VERY_SLOW" },
  ];

  /** The name of the pace chosen (or of the nearest one, for a pace written in the configuration) */
  public readonly speedLabel = computed(() => {
    const delay = this.config.value().delay;
    return this.speeds.reduce((best, speed) => (Math.abs(speed.delay - delay) < Math.abs(best.delay - delay) ? speed : best)).label;
  });

  public readonly PRIVATE_AUTH_ROUTES = Object.values(AUTH_ROUTES);

  // F5 runs or pauses, F10 runs one cycle, Shift+F10 goes back one, F8 runs to the end without drawing and Shift+F5 loads
  // the code (like a debugger)
  @HostListener("document:keydown", ["$event"])
  public async onKeydown(event: KeyboardEvent): Promise<void> {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === "F5" && event.shiftKey) {
      event.preventDefault();
      await this.reset();
    } else if (event.key === "F5" && this.machine.canSimulate) {
      event.preventDefault();
      await this.togglePlayPause();
    } else if (event.key === "F10" && event.shiftKey) {
      event.preventDefault();
      await this.stepBack();
    } else if (event.key === "F10" && this.machine.canSimulate) {
      event.preventDefault();
      await this.nextStep();
    } else if (event.key === "F8" && this.machine.canSimulate) {
      event.preventDefault();
      await this.runToEnd();
    }
  }

  public async stepBack(): Promise<void> {
    await this.machine.stepBack();
  }

  public async runToEnd(): Promise<void> {
    await this.machine.runToEnd();
  }

  public async togglePlayPause(): Promise<void> {
    if (this.machine.isRunning === false) {
      await this.machine.resume();
    } else {
      await this.machine.pause();
    }
  }

  public async reset(): Promise<void> {
    await this.machine.reset();
    // The simulator loads the saved file: the changes of the editor are not in what was loaded
    if (this.editorState.unsaved()) {
      this.toast.warning(
        this.translate.instant("SIMULATION.LOADED_UNSAVED"),
        this.translate.instant("SIMULATION.LOADED_UNSAVED_TITLE"),
        TOAST.warning,
      );
    }
  }

  /** Everything to zero (the memory, the code and the registers), without a program: Load loads it again */
  public async clear(): Promise<void> {
    await this.machine.clear();
    this.toast.info(this.translate.instant("SIMULATION.CLEARED"), this.translate.instant("SIMULATION.CLEARED_TITLE"), TOAST.info);
  }

  public async nextStep(): Promise<void> {
    await this.machine.nextStep();
    return Promise.resolve();
  }

  public async end(): Promise<void> {
    await this.machine.end();
    return Promise.resolve();
  }

  public async debug(): Promise<void> {
    logger.info(this.machine.getAllStatusMachine());
    return Promise.resolve();
  }
}
