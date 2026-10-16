import { DOCUMENT } from "@angular/common";
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Injectable,
  Input,
  inject,
  type OnDestroy,
  type OnInit,
  Output,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Subject } from "rxjs";

// The cards of AdminLTE fold and fill the screen with these directives (what its CardWidget plugin did with jQuery). The
// CSS of AdminLTE does the rest with the classes `collapsed-card`, `was-collapsed` and `maximized-card` (on the card and
// on `html`, which stops scrolling the page behind it).

export type CardChange = "collapsed" | "expanded" | "maximized" | "minimized";

/** The cards of the page, to fold them all at once (the multiview) and to know when any of them changes */
@Injectable({
  providedIn: "root",
})
export class CardRegistry {
  private readonly cards = new Set<CardDirective>();
  public readonly changes$ = new Subject<{ card: CardDirective; change: CardChange }>();

  public add(card: CardDirective): void {
    this.cards.add(card);
  }

  public delete(card: CardDirective): void {
    this.cards.delete(card);
  }

  public collapseAll(except: (card: CardDirective) => boolean = () => false): void {
    for (const card of this.cards) if (!except(card)) card.collapse();
  }

  public get isAnyMaximized(): boolean {
    return [...this.cards].some((card) => card.isMaximized);
  }
}

/**
 * A card that folds and fills the screen. It starts folded with the class `collapsed-card` in the template. Its buttons
 * and its title use `thumderCardWidget`.
 */
@Directive({
  selector: "[thumderCard]",
  exportAs: "thumderCard",
  standalone: true,
})
export class CardDirective implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly registry = inject(CardRegistry);
  private readonly widgets = new Set<CardWidgetDirective>();
  public readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  @Output() readonly collapsed = new EventEmitter<void>();
  @Output() readonly expanded = new EventEmitter<void>();
  @Output() readonly maximized = new EventEmitter<void>();
  @Output() readonly minimized = new EventEmitter<void>();

  public get id(): string {
    return this.element.id;
  }

  public get isCollapsed(): boolean {
    return this.element.classList.contains("collapsed-card");
  }

  public get isMaximized(): boolean {
    return this.element.classList.contains("maximized-card");
  }

  ngOnInit(): void {
    this.registry.add(this);
  }

  ngOnDestroy(): void {
    this.registry.delete(this);
    // A maximized card that disappears must not leave the page without scroll
    if (this.isMaximized && !this.registry.isAnyMaximized) this.document.documentElement.classList.remove("maximized-card");
  }

  public collapse(): void {
    if (this.isCollapsed) return;
    this.element.classList.add("collapsed-card");
    this.changed("collapsed");
  }

  public expand(): void {
    if (!this.isCollapsed) return;
    this.element.classList.remove("collapsed-card");
    this.changed("expanded");
  }

  public toggle(): void {
    if (this.isCollapsed) this.expand();
    else this.collapse();
  }

  /** The whole screen, also when it was folded (`was-collapsed` shows its body) */
  public maximize(): void {
    if (this.isMaximized) return;
    this.element.classList.add("maximized-card");
    if (this.isCollapsed) this.element.classList.add("was-collapsed");
    this.document.documentElement.classList.add("maximized-card");
    this.changed("maximized");
  }

  public minimize(): void {
    if (!this.isMaximized) return;
    this.element.classList.remove("maximized-card", "was-collapsed");
    if (!this.registry.isAnyMaximized) this.document.documentElement.classList.remove("maximized-card");
    this.changed("minimized");
  }

  public toggleMaximize(): void {
    if (this.isMaximized) this.minimize();
    else this.maximize();
  }

  /** @internal The buttons of the card show its state */
  public addWidget(widget: CardWidgetDirective): void {
    this.widgets.add(widget);
  }

  /** @internal */
  public deleteWidget(widget: CardWidgetDirective): void {
    this.widgets.delete(widget);
  }

  private changed(change: CardChange): void {
    for (const widget of this.widgets) widget.update();
    this[change].emit();
    this.registry.changes$.next({ card: this, change });
  }
}

/** A button (or the title) of a card: `thumderCardWidget="collapse"` folds it and `"maximize"` fills the screen with it */
@Directive({
  selector: "[thumderCardWidget]",
  standalone: true,
})
export class CardWidgetDirective implements OnInit, OnDestroy {
  private readonly card = inject(CardDirective);
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  // Optional: the tests of the directive have no translations
  private readonly translate = inject(TranslateService, { optional: true });
  private languageChanges?: { unsubscribe(): void };
  /** A button with only an icon: its name for the screen readers comes from here (A11Y-03) */
  private named = false;

  @Input({ required: true }) thumderCardWidget!: "collapse" | "maximize";

  ngOnInit(): void {
    // The title of a card also folds it: a button for the keyboard and the screen readers (A11Y-02)
    if (this.element.tagName !== "BUTTON") {
      this.element.setAttribute("role", "button");
      this.element.setAttribute("tabindex", "0");
    }
    this.named = this.element.tagName === "BUTTON" && !this.element.hasAttribute("aria-label") && !this.element.textContent?.trim();
    this.languageChanges = this.translate?.onLangChange.subscribe(() => this.update());
    this.card.addWidget(this);
    this.update();
  }

  ngOnDestroy(): void {
    this.card.deleteWidget(this);
    this.languageChanges?.unsubscribe();
  }

  @HostListener("click", ["$event"])
  public onClick(event: Event): void {
    event.preventDefault();
    if (this.thumderCardWidget === "collapse") this.card.toggle();
    else this.card.toggleMaximize();
  }

  /** Enter and Space on a title that folds the card (a button does it by itself) */
  @HostListener("keydown", ["$event"])
  public onKeydown(event: KeyboardEvent): void {
    if (this.element.tagName === "BUTTON" || (event.key !== "Enter" && event.key !== " ")) return;
    this.onClick(event);
  }

  /** The icon and the state for screen readers: `fa-minus` / `fa-plus` and `fa-expand` / `fa-compress`, as AdminLTE */
  public update(): void {
    const icon = this.element.querySelector("i.fas");
    let label: string;
    if (this.thumderCardWidget === "collapse") {
      icon?.classList.toggle("fa-minus", !this.card.isCollapsed);
      icon?.classList.toggle("fa-plus", this.card.isCollapsed);
      this.element.setAttribute("aria-expanded", String(!this.card.isCollapsed));
      label = this.card.isCollapsed ? "FORMS.EXPAND" : "FORMS.COLLAPSE";
    } else {
      icon?.classList.toggle("fa-expand", !this.card.isMaximized);
      icon?.classList.toggle("fa-compress", this.card.isMaximized);
      this.element.setAttribute("aria-pressed", String(this.card.isMaximized));
      label = this.card.isMaximized ? "FORMS.RESTORE" : "FORMS.MAXIMIZE";
    }
    if (this.named && this.translate) {
      const text = this.translate.instant(label);
      this.element.setAttribute("aria-label", text);
      this.element.setAttribute("title", text);
    }
  }
}
