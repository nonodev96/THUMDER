import { Directive, ElementRef, HostListener, inject, type OnDestroy } from "@angular/core";

/** The space kept between a menu placed over the page and the edges of the window */
const MARGIN = 4;

/**
 * A dropdown of Bootstrap 4 (what its JavaScript did with jQuery), on the element with the class `dropdown`: its
 * `.dropdown-toggle` opens and closes its `.dropdown-menu`. It closes when an option is chosen, when the user clicks
 * outside and with Escape (which gives the focus back to the button); the arrows move between the options.
 *
 * A menu that a container with scroll would cut (the options of a row of a table) is placed over the page, next to
 * its button, and opens upwards when there is no room below; it closes when that container scrolls.
 */
@Directive({
  selector: "[thumderDropdown]",
  exportAs: "thumderDropdown",
  standalone: true,
})
export class DropdownDirective implements OnDestroy {
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private floating = false;
  private readonly onScroll = (event: Event) => {
    if (!this.menu?.contains(event.target as Node)) this.close();
  };
  private readonly onResize = () => this.close();

  public get isOpen(): boolean {
    return this.menu?.classList.contains("show") ?? false;
  }

  private get toggleButton(): HTMLElement | null {
    return this.element.querySelector(".dropdown-toggle");
  }

  private get menu(): HTMLElement | null {
    return this.element.querySelector(".dropdown-menu");
  }

  private get items(): HTMLElement[] {
    return [...(this.menu?.querySelectorAll<HTMLElement>(".dropdown-item:not(.disabled):not(:disabled)") ?? [])];
  }

  public open(): void {
    this.setOpen(true);
  }

  public close(): void {
    this.setOpen(false);
  }

  public toggle(): void {
    this.setOpen(!this.isOpen);
  }

  @HostListener("click", ["$event"])
  public onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.toggleButton?.contains(target)) {
      event.preventDefault();
      this.toggle();
    } else if (target.closest(".dropdown-item")) {
      this.close();
    }
  }

  @HostListener("document:click", ["$event"])
  public onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.element.contains(event.target as Node)) this.close();
  }

  @HostListener("keydown", ["$event"])
  public onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.isOpen) {
      event.preventDefault();
      this.close();
      this.toggleButton?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!this.isOpen) this.open();
    const items = this.items;
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = current < 0 ? (event.key === "ArrowDown" ? 0 : items.length - 1) : current + (event.key === "ArrowDown" ? 1 : -1);
    items[Math.min(items.length - 1, Math.max(0, next))].focus();
  }

  public ngOnDestroy(): void {
    this.land();
  }

  /** The classes of Bootstrap (`show` on the dropdown and on its menu) and `aria-expanded` on the button */
  private setOpen(open: boolean): void {
    this.element.classList.toggle("show", open);
    this.menu?.classList.toggle("show", open);
    this.toggleButton?.setAttribute("aria-expanded", String(open));
    if (open) this.float();
    else this.land();
  }

  /** The part of the window that the containers with scroll (or hidden overflow) of the dropdown let see */
  private visibleArea(): { top: number; right: number; bottom: number; left: number } | null {
    let area: { top: number; right: number; bottom: number; left: number } | null = null;
    for (let parent = this.element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.overflowX === "visible" && style.overflowY === "visible") continue;
      const box = parent.getBoundingClientRect();
      area = area
        ? {
            top: Math.max(area.top, box.top),
            right: Math.min(area.right, box.right),
            bottom: Math.min(area.bottom, box.bottom),
            left: Math.max(area.left, box.left),
          }
        : { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
    }
    return area;
  }

  /** A menu that its containers would cut goes over the page (`position: fixed`), below or above its button */
  private float(): void {
    const menu = this.menu;
    const toggle = this.toggleButton;
    const area = this.visibleArea();
    if (!menu || !toggle || !area) return;
    const box = menu.getBoundingClientRect();
    const cut = box.top < area.top || box.bottom > area.bottom || box.left < area.left || box.right > area.right;
    if (!cut || box.width === 0) return;

    const button = toggle.getBoundingClientRect();
    Object.assign(menu.style, {
      position: "fixed",
      top: "0px",
      left: "0px",
      right: "auto",
      bottom: "auto",
      margin: "0",
      transform: "none",
    });
    // Where (0, 0) is: a transformed parent moves it
    const origin = menu.getBoundingClientRect();
    const { width, height } = origin;
    const alignRight = menu.classList.contains("dropdown-menu-right");
    const left = Math.min(Math.max(MARGIN, alignRight ? button.right - width : button.left), window.innerWidth - width - MARGIN);
    const below = button.bottom + 2;
    const above = button.top - height - 2;
    const top = below + height > window.innerHeight - MARGIN && above >= MARGIN ? above : below;
    menu.style.left = `${left - origin.left}px`;
    menu.style.top = `${top - origin.top}px`;

    this.floating = true;
    document.addEventListener("scroll", this.onScroll, true);
    window.addEventListener("resize", this.onResize);
  }

  /** The menu back in its place */
  private land(): void {
    if (!this.floating) return;
    this.floating = false;
    document.removeEventListener("scroll", this.onScroll, true);
    window.removeEventListener("resize", this.onResize);
    const menu = this.menu;
    if (menu)
      for (const property of ["position", "top", "left", "right", "bottom", "margin", "transform"]) menu.style.removeProperty(property);
  }
}
