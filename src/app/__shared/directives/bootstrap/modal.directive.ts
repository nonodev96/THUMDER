import { type FocusTrap, FocusTrapFactory } from "@angular/cdk/a11y";
import { DOCUMENT } from "@angular/common";
import { Directive, ElementRef, HostListener, Injectable, Input, inject } from "@angular/core";

/** The duration of the fade of Bootstrap 4 (`.modal.fade`): after it the modal stops being displayed */
const TRANSITION_MS = 300;

type OpenModal = {
  element: HTMLElement;
  backdrop: HTMLElement;
  focusTrap: FocusTrap;
  opener: HTMLElement | null;
  onKeydown: (event: KeyboardEvent) => void;
  onClick: (event: MouseEvent) => void;
};

/**
 * The modals of Bootstrap 4 (what its JavaScript did with jQuery), with the same markup: a `.modal` with an id. It shows
 * the modal and its backdrop, keeps the focus inside, closes with Escape and with a click outside the dialog, and gives
 * the focus back to the button that opened it.
 */
@Injectable({
  providedIn: "root",
})
export class ModalService {
  private readonly document = inject(DOCUMENT);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly opened = new Map<string, OpenModal>();
  private readonly hiding = new Map<string, ReturnType<typeof setTimeout>>();

  public isOpen(id: string): boolean {
    return this.opened.has(id);
  }

  public open(id: string, opener: HTMLElement | null = null): void {
    const element = this.document.getElementById(id);
    if (!element || this.opened.has(id)) return;
    this.finishHiding(id, element);

    const backdrop = this.document.createElement("div");
    backdrop.className = "modal-backdrop fade";
    this.document.body.appendChild(backdrop);
    this.document.body.classList.add("modal-open");

    element.style.display = "block";
    element.removeAttribute("aria-hidden");
    element.setAttribute("aria-modal", "true");
    element.setAttribute("role", "dialog");
    // A reflow before `show`, so the fade runs
    void element.offsetHeight;
    element.classList.add("show");
    backdrop.classList.add("show");

    const focusTrap = this.focusTrapFactory.create(element);
    focusTrap.focusInitialElementWhenReady().then((focused) => {
      if (!focused) element.focus();
    });
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close(id);
      }
    };
    // The modal covers the whole screen: a click on it, and not on its dialog, is a click outside
    const onClick = (event: MouseEvent) => {
      if (event.target === element) this.close(id);
    };
    element.addEventListener("keydown", onKeydown);
    element.addEventListener("click", onClick);
    this.opened.set(id, { element, backdrop, focusTrap, opener, onKeydown, onClick });
  }

  public close(id: string): void {
    const modal = this.opened.get(id);
    if (!modal) return;
    this.opened.delete(id);
    const { element, backdrop, focusTrap, opener, onKeydown, onClick } = modal;
    element.removeEventListener("keydown", onKeydown);
    element.removeEventListener("click", onClick);
    focusTrap.destroy();
    element.classList.remove("show");
    backdrop.classList.remove("show");
    if (this.opened.size === 0) this.document.body.classList.remove("modal-open");
    this.hiding.set(
      id,
      setTimeout(() => {
        this.finishHiding(id, element);
        backdrop.remove();
      }, TRANSITION_MS),
    );
    opener?.focus();
  }

  /** The end of the fade: the modal is not displayed */
  private finishHiding(id: string, element: HTMLElement): void {
    const timer = this.hiding.get(id);
    if (timer !== undefined) clearTimeout(timer);
    this.hiding.delete(id);
    if (element.classList.contains("show")) return;
    element.style.display = "none";
    element.setAttribute("aria-hidden", "true");
    element.removeAttribute("aria-modal");
  }
}

/** A button that opens a modal: `thumderModalOpen="id-of-the-modal"` */
@Directive({
  selector: "[thumderModalOpen]",
  standalone: true,
})
export class ModalOpenDirective {
  private readonly modals = inject(ModalService);
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  @Input({ required: true }) thumderModalOpen!: string;

  @HostListener("click", ["$event"])
  public onClick(event: Event): void {
    event.preventDefault();
    this.modals.open(this.thumderModalOpen, this.element);
  }
}

/** A button that closes the modal it is in */
@Directive({
  selector: "[thumderModalDismiss]",
  standalone: true,
})
export class ModalDismissDirective {
  private readonly modals = inject(ModalService);
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  @HostListener("click", ["$event"])
  public onClick(event: Event): void {
    event.preventDefault();
    const modal = this.element.closest<HTMLElement>(".modal");
    if (modal?.id) this.modals.close(modal.id);
  }
}
