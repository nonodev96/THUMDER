import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { AUTH_ROUTES, NPM_VERSION } from "@app/CONSTANTS";
import type { PublicRoutesList } from "@app/Types";
import { ArchitectureSelectorComponent } from "@components/architecture-selector/architecture-selector.component";
import { SimulationControlsComponent } from "@components/simulation-controls/simulation-controls.component";
import { AuthService } from "@core/auth/auth.service";
import { ConfigService } from "@core/config/config.service";
import { showsView } from "@core/engine/architectures";
import { MachineService } from "@core/machine/machine.service";
import { ConsentService } from "@core/services/consent/consent.service";
import { ElectronService } from "@core/services/electron/electron.service";
import { PageService } from "@core/services/layout/page.service";
import { SidebarService } from "@core/services/layout/sidebar.service";
import { SimulationControlsService } from "@core/services/simulation/simulation-controls.service";
import { SoundService } from "@core/services/sound/sound.service";
import { type ThemeChoice, ThemeService } from "@core/services/theme/theme.service";
import { TranslatePipe } from "@ngx-translate/core";
import { mediaSignal, PHONE } from "@shared/utils/media";
import { DropdownDirective } from "../../../__shared/directives/bootstrap/dropdown.directive";

type Route = PublicRoutesList[string];

/** The views by sections, as in the home page */
const GROUPS: { title: string; routes: Route[] }[] = [
  {
    title: "PAGES.INDEX.MACHINE",
    routes: [
      AUTH_ROUTES.PIPELINE,
      AUTH_ROUTES.CYCLE_CLOCK_DIAGRAM,
      AUTH_ROUTES.DATAPATH,
      AUTH_ROUTES.REGISTERS,
      AUTH_ROUTES.MEMORY,
      AUTH_ROUTES.CODE,
      AUTH_ROUTES.STATISTICS,
    ],
  },
  { title: "PAGES.INDEX.IDE", routes: [AUTH_ROUTES.EDITOR, AUTH_ROUTES.FILE_MANAGER, AUTH_ROUTES.MULTIVIEW, AUTH_ROUTES.EXERCISES] },
  { title: "PAGES.INDEX.UTILS", routes: [AUTH_ROUTES.CALCULATOR, AUTH_ROUTES.DOCUMENTATION, AUTH_ROUTES.CONFIG] },
  { title: "PAGES.INDEX.DEBUG", routes: [AUTH_ROUTES.LOGGER, AUTH_ROUTES.PROFILE] },
];

/**
 * The navbar. On the left, where to go: home, every view by sections and the places of the work (editor, files,
 * multiview). On the right, the simulation (its controls and its speed) and the preferences (theme, language,
 * configuration). On a phone it shows the name of the view, and the rest is in «More» (the controls of the simulation
 * are in the bar at the bottom). It also has the shortcuts of the simulation (F9, F8...), as a debugger.
 */
@Component({
  selector: "THUMDER-auth-navbar",
  templateUrl: "./auth-navbar.component.html",
  imports: [RouterLink, RouterLinkActive, DropdownDirective, TranslatePipe, SimulationControlsComponent, ArchitectureSelectorComponent],
})
export class AuthNavbarComponent {
  app = inject<AppComponent>(AppComponent);
  machine = inject(MachineService);
  authService = inject(AuthService);
  sidebar = inject(SidebarService);
  config = inject(ConfigService);
  theme = inject(ThemeService);
  page = inject(PageService);
  consent = inject(ConsentService);
  controls = inject(SimulationControlsService);
  public sound = inject(SoundService);

  public readonly phone = mediaSignal(PHONE);
  public readonly version = NPM_VERSION;

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

  /** The views by sections, as in the home page: the ones of the architecture chosen (SuperDLX has no datapath) */
  public readonly groups = computed(() => {
    const architecture = this.machine.state.architecture();
    return GROUPS.map((group) => ({
      ...group,
      routes: group.routes.filter((route) => route.show && showsView(architecture, route.path.replace(/-/g, "_"))),
    })).filter((group) => group.routes.length > 0);
  });

  /** The places of the work, always at hand on a wide screen */
  public readonly quickLinks: Route[] = [AUTH_ROUTES.EDITOR, AUTH_ROUTES.FILE_MANAGER, AUTH_ROUTES.MULTIVIEW];

  /**
   * The shortcuts of the simulation, as in the debuggers of Delphi and Lazarus, with keys the browsers do not use (F5
   * and Shift+F5 reload the page, F10 opens the menu of Firefox): F9 runs or pauses, F8 runs one cycle, Shift+F8 goes
   * back one, Shift+F9 runs to the end without drawing and Ctrl+F9 loads the code. They are caught before the editor
   * (Monaco uses F8 for its problems) and always, also when nothing can be simulated yet
   */
  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.altKey || event.metaKey || (event.key !== "F8" && event.key !== "F9")) return;
    const action =
      event.key === "F9"
        ? event.ctrlKey
          ? () => this.controls.load()
          : event.shiftKey
            ? () => this.controls.runToEnd()
            : () => this.controls.togglePlayPause()
        : event.ctrlKey
          ? null
          : event.shiftKey
            ? () => this.controls.stepBack()
            : () => this.controls.step();
    if (action === null) return;
    event.preventDefault();
    event.stopPropagation();
    // Load and step back always; the rest, with a program that can be simulated
    const always = event.ctrlKey || (event.key === "F8" && event.shiftKey);
    if (always || this.machine.canSimulate) void action();
  };

  constructor() {
    const destroyRef = inject(DestroyRef);
    document.addEventListener("keydown", this.onKeydown, true);
    destroyRef.onDestroy(() => document.removeEventListener("keydown", this.onKeydown, true));

    // The desktop application on Windows and Linux: the navbar is the title bar of the window
    const electron = inject(ElectronService);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      const nav = host.querySelector<HTMLElement>("nav.main-header");
      if (nav !== null) destroyRef.onDestroy(electron.followTitleBar(nav));
    });
  }

  /** The sounds of the simulation on or off (the rest of their configuration stays) */
  public toggleSound(): void {
    const sound = this.config.value().sound;
    this.config.update({ sound: { ...sound, enabled: !sound.enabled } });
    // Turned on: a short chord says it sounds
    if (!sound.enabled) {
      this.sound.unlock();
      this.sound.event("load");
    }
  }
}
