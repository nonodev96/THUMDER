import { Directive, ElementRef, HostListener, inject } from "@angular/core";

/**
 * A dropdown of Bootstrap 4 (what its JavaScript did with jQuery), on the element with the class `dropdown`: its
 * `.dropdown-toggle` opens and closes its `.dropdown-menu`. It closes when an option is chosen, when the user clicks
 * outside and with Escape (which gives the focus back to the button); the arrows move between the options.
 */
@Directive({
  selector: "[thumderDropdown]",
  exportAs: "thumderDropdown",
  standalone: true,
})
export class DropdownDirective {
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

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

  /** The classes of Bootstrap (`show` on the dropdown and on its menu) and `aria-expanded` on the button */
  private setOpen(open: boolean): void {
    this.element.classList.toggle("show", open);
    this.menu?.classList.toggle("show", open);
    this.toggleButton?.setAttribute("aria-expanded", String(open));
  }
}
