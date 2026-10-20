import { Directive, ElementRef, HostListener, Input, inject, type OnChanges, type OnInit, type SimpleChanges } from "@angular/core";

/** Where it is kept which details the user left open or closed, by name (only in this browser) */
const STORAGE = "thumder_details";

function savedStates(): Record<string, boolean> {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) ?? "{}");
    return value !== null && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/**
 * The details of the footer of a card (a <details> with its <summary>): the user shows or hides them, and they stay as
 * they were left the next time, one name for each footer. `reveal` opens them each time its value changes to something
 * (for example, the instruction chosen in the code, whose detail is in the footer).
 */
@Directive({
  selector: "details[thumderDetails]",
  standalone: true,
  host: { class: "thumder-details" },
})
export class DetailsDirective implements OnInit, OnChanges {
  private readonly element: HTMLDetailsElement = inject(ElementRef<HTMLDetailsElement>).nativeElement;

  @Input({ alias: "thumderDetails", required: true }) public name!: string;
  /** Open while the user has not closed them */
  @Input() public startOpen = true;
  /** Each time it changes to something, they open */
  @Input() public reveal: unknown;

  public ngOnInit(): void {
    this.element.open = savedStates()[this.name] ?? this.startOpen;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const reveal = changes.reveal;
    if (reveal && !reveal.firstChange && reveal.currentValue) this.element.open = true;
  }

  @HostListener("toggle")
  public onToggle(): void {
    const states = savedStates();
    if (states[this.name] === this.element.open) return;
    try {
      // Only what differs from how it starts
      if (this.element.open === this.startOpen) delete states[this.name];
      else states[this.name] = this.element.open;
      localStorage.setItem(STORAGE, JSON.stringify(states));
    } catch {
      // Without storage it stays as it is until the page is reloaded
    }
  }
}
