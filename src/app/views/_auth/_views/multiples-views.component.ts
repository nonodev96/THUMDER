import type { CdkDragDrop } from "@angular/cdk/drag-drop";
import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from "@angular/cdk/drag-drop";
import { NgTemplateOutlet } from "@angular/common";
import {
  type AfterViewInit,
  Component,
  computed,
  type ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { AUTH_ROUTES, DEFAULT_MULTIVIEW_CONFIGURATION } from "@app/CONSTANTS";
import type { TypeMultiviewConfiguration, TypeWindowGeometry } from "@app/Types";
import { Utils } from "@app/Utils";
import { ConfigService } from "@core/config/config.service";
import { showsView } from "@core/engine/architectures";
import { MachineService } from "@core/machine/machine.service";
import { Globals } from "@core/services/globals/globals.service";
import { TranslatePipe } from "@ngx-translate/core";
import { CardRegistry } from "@shared/directives/card/card.directive";
import { WindowDirective } from "@shared/directives/window/window.directive";
import { MIN_WINDOW } from "@shared/directives/window/window-geometry";
import { CalculatorView } from "../calculator/calculator.view";
import { CodeView } from "../code/code.view";
import { DatapathView } from "../datapath/datapath.view";
import { MemoryView } from "../memory/memory.view";
import { CycleClockDiagramView } from "../pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "../pixi-pipeline/pipeline.view";
import { RegistersView } from "../registers/registers.view";
import { StatisticsView } from "../statistics/statistics.view";

/** Where floating windows make sense: from a tablet up (on a phone every window stays in its column) */
const WIDE = "(min-width: 768px)";

/** The views of the multiview: their name and their icon (the chips of a phone) */
const VIEWS: Record<string, { lang: string; icon?: string }> = {
  code: AUTH_ROUTES.CODE,
  cycle_clock_diagram: AUTH_ROUTES.CYCLE_CLOCK_DIAGRAM,
  memory: AUTH_ROUTES.MEMORY,
  pipeline: AUTH_ROUTES.PIPELINE,
  registers: AUTH_ROUTES.REGISTERS,
  datapath: AUTH_ROUTES.DATAPATH,
  calculator: AUTH_ROUTES.CALCULATOR,
  statistics: AUTH_ROUTES.STATISTICS,
};

/** The views shown on a phone (only this browser) */
const PHONE_KEY = "multiview_phone";
const PHONE_DEFAULT = ["pipeline", "registers"];

/** The size of a window that starts floating, at most */
const NEW_WINDOW = { width: 720, height: 520 } as const;

/**
 * The multiview: the windows of the simulator in two columns, ordered by dragging them. Each one can also float over
 * the multiview, like a window of an operating system that moves by its title bar and is resized from its edges
 * (WindowDirective), and go back to its column. Where they are and how big is saved in the configuration (`windows`).
 *
 * On a phone there is no room for columns nor windows: chips choose the views shown, open and one under the other (for
 * example the pipeline and the registers while the bar at the bottom runs the simulation cycle by cycle).
 */
@Component({
  selector: "view-multiples-views",
  templateUrl: "./multiples-views.component.html",
  styleUrls: [],
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    NgTemplateOutlet,
    CalculatorView,
    CdkDragHandle,
    PipelineView,
    RegistersView,
    StatisticsView,
    CycleClockDiagramView,
    MemoryView,
    CodeView,
    DatapathView,
    TranslatePipe,
    WindowDirective,
  ],
})
export class MultiplesViewsComponent implements OnInit, AfterViewInit, OnDestroy {
  globals = inject(Globals);
  private config = inject(ConfigService);
  private cards = inject(CardRegistry);
  /** The views of the architecture chosen: SuperDLX has no datapath */
  private readonly architecture = inject(MachineService).state.architecture;

  @ViewChild("desk", { static: true }) private desk!: ElementRef<HTMLElement>;

  public multiviewConfiguration: TypeMultiviewConfiguration = Utils.clone(DEFAULT_MULTIVIEW_CONFIGURATION);
  /** The two columns, with every window (also the floating ones, which go back to them) */
  private lists: [string[], string[]] = [[], []];
  /** The windows shown in each column (the ones that do not float): what the columns drag */
  public columns: [string[], string[]] = [[], []];
  /** The floating windows; the order of the keys is the one of the pile (the last one, in front) */
  public readonly windows = signal<Record<string, TypeWindowGeometry>>({});

  private readonly media = window.matchMedia?.(WIDE) ?? null;
  public readonly wide = signal(this.media?.matches ?? true);
  private readonly onMedia = (event: MediaQueryListEvent) => {
    this.wide.set(event.matches);
    this.refreshColumns();
  };

  /** The floating windows, in a fixed order (the pile is their z-index: the DOM does not move while they are used) */
  public readonly floating = computed(() => {
    const windows = this.windows();
    if (!this.wide()) return [];
    return [...this.lists[0], ...this.lists[1]].filter((name) => name in windows && this.isEnabled(name));
  });

  /** The multiview is as tall as its lowest floating window */
  public readonly height = computed(() =>
    this.wide() ? Math.max(0, ...Object.values(this.windows()).map((window) => window.y + window.height + 16)) : 0,
  );

  /** The views of the multiview, in their order, with their name and icon, for the chips of a phone */
  public readonly views = computed(() => {
    this.wide();
    return [...this.lists[0], ...this.lists[1]]
      .filter((name) => this.isEnabled(name) && name in VIEWS)
      .map((name) => ({ name, ...VIEWS[name] }));
  });

  /** The views shown on a phone */
  public readonly phoneShown = signal<string[]>(MultiplesViewsComponent.savedPhone());

  private static savedPhone(): string[] {
    try {
      const saved = JSON.parse(localStorage.getItem(PHONE_KEY) ?? "null");
      return Array.isArray(saved) ? saved.filter((name) => typeof name === "string") : PHONE_DEFAULT;
    } catch {
      return PHONE_DEFAULT;
    }
  }

  /** A view is drawn: always on a wide screen; on a phone, if its chip is on */
  public isShown(name: string): boolean {
    return this.wide() || this.phoneShown().includes(name);
  }

  /** The chip of a view: shows it or hides it (on a phone) */
  public togglePhone(name: string): void {
    const shown = this.phoneShown();
    const next = shown.includes(name) ? shown.filter((other) => other !== name) : [...shown, name];
    this.phoneShown.set(next);
    try {
      localStorage.setItem(PHONE_KEY, JSON.stringify(next));
    } catch {
      // Without storage the choice lasts until the page closes
    }
  }

  ngOnInit(): void {
    // A copy: the lists change when the cards are dragged
    const config = this.config.value();
    this.multiviewConfiguration = structuredClone(config.multiview);
    this.lists = [this.multiviewConfiguration.list_1, this.multiviewConfiguration.list_2];
    this.windows.set(structuredClone(config.windows));
    this.refreshColumns();
    this.media?.addEventListener?.("change", this.onMedia);
  }

  ngAfterViewInit(): void {
    // The windows of the columns start folded (not the floating ones, nor the debug window, which is not part of the
    // multiview). A window that unfolds or fills the screen measures its tables and canvases itself (ResizeObserver).
    // On a phone the views shown are the ones chosen: open
    if (!this.wide()) return;
    this.cards.collapseAll((card) => card.id === "card-debug" || card.element.closest(".thumder-window") !== null);
  }

  ngOnDestroy(): void {
    this.media?.removeEventListener?.("change", this.onMedia);
  }

  public isEnabled(name: string): boolean {
    return this.multiviewConfiguration[name] === true && showsView(this.architecture(), name);
  }

  public isFloating(name: string): boolean {
    return this.wide() && name in this.windows();
  }

  /** The place of a floating window in the pile */
  public orderOf(name: string): number {
    return Object.keys(this.windows()).indexOf(name);
  }

  private refreshColumns(): void {
    this.columns = [this.lists[0].filter((name) => !this.isFloating(name)), this.lists[1].filter((name) => !this.isFloating(name))];
  }

  /** Moves a card and remembers the new layout (the floating windows keep their column, at its end) */
  public drop(event: CdkDragDrop<string[]>): void {
    this.globals.drop(event);
    this.lists = [
      [...this.columns[0], ...this.lists[0].filter((name) => this.isFloating(name))],
      [...this.columns[1], ...this.lists[1].filter((name) => this.isFloating(name))],
    ];
    this.multiviewConfiguration = { ...this.multiviewConfiguration, list_1: this.lists[0], list_2: this.lists[1] };
    this.config.update({ multiview: this.multiviewConfiguration });
  }

  /** A window of a column floats over the multiview where it was, in front of the others; or goes back to its column */
  public toggleFloating(name: string, button: EventTarget | null): void {
    const windows = { ...this.windows() };
    if (name in windows) {
      delete windows[name];
    } else {
      const desk = this.desk.nativeElement.getBoundingClientRect();
      const card = (button as HTMLElement | null)?.closest(".multiview-item")?.getBoundingClientRect();
      const count = Object.keys(windows).length;
      windows[name] = {
        x: Math.round(card ? card.left - desk.left : 24 * (count + 1)),
        y: Math.round(card ? card.top - desk.top : 24 * (count + 1)),
        width: Math.round(Math.max(MIN_WINDOW.width, Math.min(card?.width ?? NEW_WINDOW.width, NEW_WINDOW.width))),
        height: NEW_WINDOW.height,
      };
    }
    this.save(windows);
    this.refreshColumns();
  }

  public moved(name: string, geometry: TypeWindowGeometry): void {
    this.save({ ...this.windows(), [name]: geometry });
  }

  /** A clicked window goes to the front */
  public raise(name: string): void {
    const windows = this.windows();
    const names = Object.keys(windows);
    if (names[names.length - 1] === name) return;
    const { [name]: geometry, ...rest } = windows;
    this.save({ ...rest, [name]: geometry });
  }

  private save(windows: Record<string, TypeWindowGeometry>): void {
    this.windows.set(windows);
    this.config.update({ windows });
  }
}
