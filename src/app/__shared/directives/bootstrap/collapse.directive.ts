import { Directive, ElementRef, HostBinding, HostListener, Injectable, Input, inject, type OnDestroy, type OnInit } from "@angular/core";

/** The panels of each accordion: opening one closes the others */
@Injectable({
  providedIn: "root",
})
export class CollapseGroups {
  private readonly groups = new Map<string, Set<CollapseDirective>>();

  public add(group: string, panel: CollapseDirective): void {
    this.groups.set(group, (this.groups.get(group) ?? new Set()).add(panel));
  }

  public delete(group: string, panel: CollapseDirective): void {
    this.groups.get(group)?.delete(panel);
  }

  public closeOthers(group: string, panel: CollapseDirective): void {
    for (const other of this.groups.get(group) ?? []) if (other !== panel) other.close();
  }
}

/**
 * A panel of Bootstrap 4 that opens and closes (the class `show` of `.collapse`), what its JavaScript did with jQuery.
 * Panels with the same `thumderCollapseGroup` are an accordion. It is opened by an element with `thumderCollapseToggle`.
 */
@Directive({
  selector: "[thumderCollapse]",
  exportAs: "thumderCollapse",
  standalone: true,
})
export class CollapseDirective implements OnInit, OnDestroy {
  private readonly groups = inject(CollapseGroups);
  public readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  /** The accordion of the panel */
  @Input() thumderCollapseGroup = "";

  /** Starts open */
  @Input() set thumderCollapseOpen(open: boolean) {
    this.isOpen = open;
  }

  @HostBinding("class.show")
  public isOpen = false;

  ngOnInit(): void {
    if (this.thumderCollapseGroup) this.groups.add(this.thumderCollapseGroup, this);
  }

  ngOnDestroy(): void {
    if (this.thumderCollapseGroup) this.groups.delete(this.thumderCollapseGroup, this);
  }

  public open(): void {
    if (this.thumderCollapseGroup) this.groups.closeOthers(this.thumderCollapseGroup, this);
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }
}

/** The link or button that opens and closes a panel: `[thumderCollapseToggle]="panel"`, with `#panel="thumderCollapse"` */
@Directive({
  selector: "[thumderCollapseToggle]",
  standalone: true,
})
export class CollapseToggleDirective {
  @Input({ required: true }) thumderCollapseToggle!: CollapseDirective;

  @HostBinding("attr.aria-expanded")
  public get expanded(): boolean {
    return this.thumderCollapseToggle.isOpen;
  }

  @HostBinding("attr.aria-controls")
  public get controls(): string | null {
    return this.thumderCollapseToggle.element.id || null;
  }

  @HostListener("click", ["$event"])
  public onClick(event: Event): void {
    event.preventDefault();
    this.thumderCollapseToggle.toggle();
  }
}
