import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
  type AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  type ElementRef,
  HostBinding,
  Input,
  inject,
  NgZone,
  type OnDestroy,
  type QueryList,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ViewportResizeDirective } from "@shared/directives/virtual-scroll/viewport-resize.directive";

/**
 * A column of a `thumder-virtual-table`: its key, its header, its width (a size of CSS grid: 10rem, 2fr, minmax...) and,
 * inside, how a cell is drawn (`let-row`)
 */
@Directive({ selector: "ng-template[thumderColumn]", standalone: true })
export class VirtualTableColumnDirective {
  @Input({ required: true, alias: "thumderColumn" }) public key!: string;
  @Input() public header = "";
  @Input() public width = "1fr";
  public readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

/**
 * A table of many rows (the code, the memory, the registers) that only draws the visible ones (CDK virtual scroll): the
 * header stays above, the rows are a CSS grid with the widths of the columns, and in a narrow card the whole table
 * scrolls sideways. For the screen readers it is a table (roles table, row, columnheader and cell) and the list can be
 * reached with the keyboard to scroll it.
 *
 * With `stickyFirst`, the first column (the name of each row) stays in its place when the table scrolls sideways. It is
 * moved by what the table scrolled (the variable --thumder-scroll-x): the rows scroll in their own viewport, where
 * `position: sticky` would not see the scroll of the table.
 */
@Component({
  selector: "thumder-virtual-table",
  imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, ViewportResizeDirective, NgTemplateOutlet],
  template: `
    <div class="thumder-table-scroll" #scroll>
      <div class="thumder-table" role="table" [attr.aria-label]="label" [attr.aria-rowcount]="rows.length + 1" [style.min-width]="minWidth">
        <div role="rowgroup">
          <div class="thumder-table-row thumder-table-header" role="row" aria-rowindex="1" [style.grid-template-columns]="grid">
            @for (column of shown; track column.key) {
              <div class="thumder-table-cell" role="columnheader">{{ column.header }}</div>
            }
          </div>
        </div>
        <cdk-virtual-scroll-viewport [itemSize]="itemSize" [style.height]="fill ? null : height" class="thumder-table-body" role="rowgroup" tabindex="0"
          [attr.aria-label]="label">
          <div *cdkVirtualFor="let row of rows; let index = index; trackBy: trackBy" class="thumder-table-row thumder-row" role="row"
            [attr.aria-rowindex]="index + 2" [style.grid-template-columns]="grid" [style.height.px]="itemSize" [class]="rowClass(row)"
            [class.thumder-row-target]="index === target">
            @for (column of shown; track column.key) {
              <div class="thumder-table-cell" role="cell"><ng-container *ngTemplateOutlet="column.template; context: { $implicit: row }"></ng-container></div>
            }
          </div>
        </cdk-virtual-scroll-viewport>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      /* A height in % (a card that fills the screen): the table fills its container and the list takes what is left */
      :host(.fill) { height: 100%; }
      :host(.fill) .thumder-table-scroll, :host(.fill) .thumder-table { height: 100%; display: flex; flex-direction: column; }
      :host(.fill) .thumder-table-body { flex: 1 1 auto; min-height: 0; }
      .thumder-table-scroll { overflow-x: auto; border: 1px solid var(--thumder-border); border-radius: 0.25rem; }
      .thumder-table { font-family: monospace; }
      .thumder-table-row { display: grid; align-items: center; border-bottom: 1px solid var(--thumder-border); }
      /* The header measures its columns with the font of the rows (widths in ch line up) and writes with its own */
      .thumder-table-header { font-family: monospace; font-weight: bold; background: var(--thumder-surface-2); color: var(--thumder-text-2); min-height: 2.5rem; border-bottom-width: 2px; }
      .thumder-table-header > .thumder-table-cell { font-family: Arial, Helvetica, sans-serif; }
      .thumder-table-cell { padding: 0 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .thumder-table-body:focus-visible { outline: 2px solid var(--thumder-primary); outline-offset: -2px; }
      :host(.sticky-first) .thumder-table-cell:first-child {
        position: relative;
        z-index: 1;
        align-self: stretch;
        display: flex;
        align-items: center;
        transform: translateX(var(--thumder-scroll-x, 0px));
        background-color: var(--thumder-surface);
        box-shadow: 1px 0 0 var(--thumder-border);
        font-weight: 600;
      }
      :host(.sticky-first) .thumder-table-header .thumder-table-cell:first-child { background-color: var(--thumder-surface-2); }
      /* The row that scrollToIndex() went to, for a moment */
      .thumder-row-target { outline: 3px solid var(--thumder-primary); outline-offset: -3px; }
      .thumder-row-target > .thumder-table-cell:first-child { font-weight: 700; }
    `,
  ],
})
export class VirtualTableComponent<T = unknown> implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild("scroll", { static: true }) private scroll!: ElementRef<HTMLElement>;
  @ViewChild(CdkVirtualScrollViewport) private viewport?: CdkVirtualScrollViewport;
  /** The row that scrollToIndex() went to (-1: none) */
  public target = -1;
  private targetTimer?: ReturnType<typeof setTimeout>;
  private readonly onScroll = () => {
    const element = this.scroll.nativeElement;
    element.style.setProperty("--thumder-scroll-x", `${element.scrollLeft}px`);
  };

  /** The rows */
  @Input() public rows: readonly T[] = [];
  /** The keys of the columns shown, in order (the columns of the template that are not here are not drawn) */
  @Input() public columns: readonly string[] = [];
  /** The height of a row, in px */
  @Input() public itemSize = 32;
  /** The height of the list (CSS) */
  @Input() public height = "60vh";
  /** The width under which the table scrolls sideways (CSS) */
  @Input() public minWidth = "0";
  @Input() public label = "";
  @Input() public rowClass: (row: T) => string = () => "";
  /** The first column stays when the table scrolls sideways */
  @HostBinding("class.sticky-first")
  @Input()
  public stickyFirst = false;
  @Input() public trackBy: (index: number, row: T) => unknown = (index) => index;

  @HostBinding("class.fill")
  public get fill(): boolean {
    return this.height.trim().endsWith("%");
  }

  @ContentChildren(VirtualTableColumnDirective) private definitions?: QueryList<VirtualTableColumnDirective>;

  public get shown(): VirtualTableColumnDirective[] {
    const definitions = this.definitions?.toArray() ?? [];
    return this.columns.flatMap((key) => definitions.filter((definition) => definition.key === key));
  }

  public ngAfterViewInit(): void {
    // Only a variable of CSS changes: outside Angular
    this.zone.runOutsideAngular(() => this.scroll.nativeElement.addEventListener("scroll", this.onScroll, { passive: true }));
  }

  public ngOnDestroy(): void {
    this.scroll.nativeElement.removeEventListener("scroll", this.onScroll);
    clearTimeout(this.targetTimer);
  }

  /** Scrolls the list to a row, with a few rows above it, and marks it for a moment */
  public scrollToIndex(index: number): void {
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.viewport?.scrollToIndex(Math.max(0, index - 3), reduce ? "auto" : "smooth");
    this.target = index;
    clearTimeout(this.targetTimer);
    this.targetTimer = setTimeout(() => {
      this.target = -1;
      this.cdr.markForCheck();
    }, 3000);
    this.cdr.markForCheck();
  }

  public get grid(): string {
    return this.shown.map((column) => column.width).join(" ");
  }
}
