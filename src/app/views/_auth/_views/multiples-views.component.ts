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
import { DEFAULT_MULTIVIEW_CONFIGURATION } from "@app/CONSTANTS";
import type { TypeMultiviewConfiguration, TypeWindowGeometry } from "@app/Types";
import { Utils } from "@app/Utils";
import { ConfigService } from "@core/config/config.service";
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

/** The size of a window that starts floating, at most */
const NEW_WINDOW = { width: 720, height: 520 } as const;

/**
 * The multiview: the windows of the simulator in two columns, ordered by dragging them. Each one can also float over
 * the multiview, like a window of an operating system that moves by its title bar and is resized from its edges
 * (WindowDirective), and go back to its column. Where they are and how big is saved in the configuration (`windows`).
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
    // multiview). A window that unfolds or fills the screen measures its tables and canvases itself (ResizeObserver)
    this.cards.collapseAll((card) => card.id === "card-debug" || card.element.closest(".thumder-window") !== null);
  }

  ngOnDestroy(): void {
    this.media?.removeEventListener?.("change", this.onMedia);
  }

  public isEnabled(name: string): boolean {
    return this.multiviewConfiguration[name] === true;
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
