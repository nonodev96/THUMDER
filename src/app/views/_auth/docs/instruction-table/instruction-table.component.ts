import { NgTemplateOutlet } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  Injector,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import type { DescriptionLang } from "@core/engine/describe";
import { BY_MNEMONIC, type Unit } from "@core/engine/isa";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { map } from "rxjs";
import {
  CATEGORIES,
  type CatalogEntry,
  type Category,
  countByCategory,
  EXAMPLE_ADDRESS,
  hex2,
  instructionCatalog,
  MATRIX_BITS,
  type MatrixCell,
  opcodeMatrices,
  searchCatalog,
} from "./instruction-table.catalog";

/** The width from which the list and the details of the instruction chosen go side by side */
const WIDE = 680;

/** The stage of the description (describe.ts) and the colour of its badge */
const STAGE_COLOURS: Record<string, string> = {
  IF: "if",
  ID: "id",
  EX: "ex",
  faddEX: "fadd",
  fmultEX: "fmult",
  fdivEX: "fdiv",
  MEM: "mem",
  WB: "wb",
};

/** The name of each execution unit in the pipeline */
const UNIT_STAGES: Record<Unit, string> = { int: "intEX", fadd: "faddEX", fmul: "fmultEX", fdiv: "fdivEX" };

/**
 * The instruction table of the documentation: every DLX instruction of THUMDER, to search and to filter by category.
 * On a phone, a list of cards that unfold their details; on a wide screen, the list and the details side by side. Then
 * the maps of the codes (8 × 8), whose cells open their instruction. The address can name one: `&i=ADD`.
 */
@Component({
  selector: "thumder-instruction-table",
  templateUrl: "./instruction-table.component.html",
  styleUrls: ["./instruction-table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, TranslatePipe],
})
export class InstructionTableComponent {
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);

  private readonly explorer = viewChild<ElementRef<HTMLElement>>("explorer");
  private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");

  public readonly categories = CATEGORIES;
  public readonly bits = MATRIX_BITS;
  public readonly matrices = opcodeMatrices();
  public readonly address = `0x${EXAMPLE_ADDRESS.toString(16).toUpperCase().padStart(8, "0")}`;
  public readonly hex2 = hex2;

  public readonly lang = toSignal(this.translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? this.translate.getFallbackLang() ?? "es",
  });
  private readonly descriptionLang = computed<DescriptionLang>(() => (this.lang() === "en" ? "en" : "es"));
  public readonly entries = computed(() => instructionCatalog(this.descriptionLang()));

  public readonly query = signal("");
  public readonly category = signal<Category | null>(null);
  /** The instructions that match the search (of every category, for the counts of the chips) */
  private readonly found = computed(() => searchCatalog(this.entries(), this.query()));
  public readonly counts = computed(() => countByCategory(this.found()));
  public readonly total = computed(() => this.found().length);
  public readonly results = computed(() => {
    const category = this.category();
    return category ? this.found().filter((entry) => entry.category === category) : this.found();
  });
  public readonly searching = computed(() => this.query().trim() !== "" || this.category() !== null);
  /** The list by categories; when searching or filtering, one list, the closest first */
  public readonly groups = computed<{ category: Category | null; entries: CatalogEntry[] }[]>(() => {
    const results = this.results();
    if (this.searching()) return [{ category: null, entries: results }];
    return CATEGORIES.map((category) => ({ category, entries: results.filter((entry) => entry.category === category) }));
  });
  /** The instructions of the list, to grey the others in the maps */
  public readonly matching = computed(() => new Set(this.results().map((entry) => entry.mnemonic)));

  public readonly selected = signal<string | null>(null);
  public readonly wide = signal(typeof window !== "undefined" && window.innerWidth >= 1200);
  /** Whether the width is known (until then, the instruction of the address waits) */
  private measured = false;
  private pending: string | null = null;
  /** The instruction whose details are shown: the chosen one or, side by side, the first of the list */
  public readonly shown = computed(() => {
    const chosen = this.entries().find((entry) => entry.mnemonic === this.selected());
    return chosen ?? (this.wide() ? (this.results()[0] ?? null) : null);
  });

  constructor() {
    // The instruction of the address: ?i=ADD (or #ADD)
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const mnemonic = (params.get("i") ?? this.route.snapshot.fragment ?? "").toUpperCase();
      if (!BY_MNEMONIC.has(mnemonic) || mnemonic === this.selected()) return;
      this.selected.set(mnemonic);
      this.reveal(mnemonic, true);
    });

    // Side by side when there is room for both (the width of the page, not of the window: the index takes a part)
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(([entry]) => this.measure(entry.contentRect.width));
    afterNextRender(() => {
      this.measure(this.host.nativeElement.clientWidth);
      observer?.observe(this.host.nativeElement);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  private measure(width: number): void {
    if (width <= 0) return;
    const wide = width >= WIDE;
    const changed = wide !== this.wide();
    this.wide.set(wide);
    if (this.measured) return;
    // The instruction of the address, once the layout is known (after it is drawn, if it changes)
    this.measured = true;
    const pending = this.pending;
    this.pending = null;
    if (pending && changed) this.reveal(pending, true);
    else if (pending) this.scrollTo(pending, true);
  }

  /** A card of the list: on a phone it unfolds or folds; side by side, it shows its details */
  public toggle(entry: CatalogEntry): void {
    const open = this.wide() || this.selected() !== entry.mnemonic;
    this.choose(open ? entry.mnemonic : null);
    if (this.wide()) {
      const panel = this.panel()?.nativeElement;
      if (panel) panel.scrollTop = 0;
    } else if (open) {
      this.reveal(entry.mnemonic, false);
    }
  }

  /** A cell of a map: its instruction, in the list (without the search or the filter if they leave it out) */
  public openCell(cell: MatrixCell): void {
    if (!cell.mnemonic) return;
    if (!this.matching().has(cell.mnemonic)) {
      this.query.set("");
      this.category.set(null);
    }
    this.choose(cell.mnemonic);
    this.reveal(cell.mnemonic, true);
  }

  public setCategory(category: Category | null): void {
    this.category.set(this.category() === category ? null : category);
  }

  public clear(): void {
    this.query.set("");
    this.category.set(null);
  }

  /** The arrows move along the list (side by side, they also show the instruction) */
  public onListKey(event: KeyboardEvent): void {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = [...this.host.nativeElement.querySelectorAll<HTMLButtonElement>(".itable-item-button")];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : Math.min(buttons.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)));
    buttons[next].focus();
    if (this.wide()) buttons[next].click();
  }

  /** A formula in parts, to draw its arrows (←) larger than the font does */
  public formula(summary: string): string[] {
    return summary.split("←");
  }

  public stageColour(stage: string): string {
    return STAGE_COLOURS[stage] ?? "ex";
  }

  public unitStage(unit: Unit): string {
    return UNIT_STAGES[unit];
  }

  public unitColour(unit: Unit): string {
    return unit === "int" ? "ex" : STAGE_COLOURS[UNIT_STAGES[unit]];
  }

  public bitsOf(value: number, length = 6): string {
    return value.toString(2).padStart(length, "0");
  }

  /** The instruction chosen, in the address (without a new entry in the history) */
  private choose(mnemonic: string | null): void {
    this.selected.set(mnemonic);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { i: mnemonic }, queryParamsHandling: "merge", replaceUrl: true });
  }

  /** Brings the card of an instruction into view (and, side by side, the list and its details) */
  private reveal(mnemonic: string, always: boolean): void {
    if (!this.measured) this.pending = mnemonic;
    else afterNextRender(() => this.scrollTo(mnemonic, always), { injector: this.injector });
  }

  private scrollTo(mnemonic: string, always: boolean): void {
    const item = document.getElementById(`itable-${mnemonic}`);
    if (!item) return;
    if (this.wide()) {
      // In the list, a third of the way down (under the title of its category); then the list and the details
      const list = item.closest<HTMLElement>(".itable-list");
      if (list) list.scrollTop += item.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 3;
      if (always) this.explorer()?.nativeElement.scrollIntoView({ block: "start" });
    } else if (always || item.getBoundingClientRect().top < 64) {
      item.scrollIntoView({ block: "start" });
    }
  }
}
