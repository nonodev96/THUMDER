import { type AfterViewInit, Directive, ElementRef, HostListener, Input, inject, NgZone, type OnDestroy, Renderer2 } from "@angular/core";
import type { Edge } from "../window/window-geometry";
import { type PanelSize, resizePanel } from "./resizable-geometry";

/** Where the sizes chosen by the user are kept, one per panel (only in this browser) */
const STORAGE = "thumder_panel_sizes";

/** What the keyboard resizes a panel, in px */
const KEY_STEP = 20;

function savedSizes(): Record<string, PanelSize> {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) ?? "{}");
    return value !== null && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveSize(name: string, size: PanelSize | null): void {
  try {
    const sizes = savedSizes();
    if (size === null) delete sizes[name];
    else sizes[name] = size;
    localStorage.setItem(STORAGE, JSON.stringify(sizes));
  } catch {
    // Without storage the size lasts until the page is reloaded
  }
}

/**
 * A panel fixed over the views (the console of the program, the debug window) that the user resizes from some of its
 * edges and corners: the opposite edges stay where the panel is anchored. Its size is kept in this browser, one per
 * panel, and a double click on an edge goes back to the size of its styles. With the focus inside it, Alt, Shift and the
 * arrows resize it too. The styles of the panel limit it (max-width, max-height); while it is resized, it only changes
 * its own styles (no change detection).
 */
@Directive({
  selector: "[thumderResizable]",
  standalone: true,
  host: { class: "thumder-resizable" },
})
export class ResizableDirective implements AfterViewInit, OnDestroy {
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  /** The name its size is kept with */
  @Input({ alias: "thumderResizable", required: true }) public name!: string;
  /** The edges and corners it is resized from: the free ones (a panel anchored to the bottom right, n, w and nw) */
  @Input() public edges: readonly Edge[] = ["e", "s", "se"];

  private gesture: { edge: Edge; pointer: number; x: number; y: number; start: PanelSize; handle: HTMLElement } | null = null;
  private readonly removers: (() => void)[] = [];

  public ngAfterViewInit(): void {
    const saved = savedSizes()[this.name];
    if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) this.apply(saved);
    this.zone.runOutsideAngular(() => {
      for (const edge of this.edges) {
        const handle: HTMLElement = this.renderer.createElement("div");
        this.renderer.addClass(handle, "thumder-window-handle");
        this.renderer.addClass(handle, `thumder-window-handle-${edge}`);
        this.renderer.setAttribute(handle, "data-edge", edge);
        this.renderer.setAttribute(handle, "aria-hidden", "true");
        this.renderer.appendChild(this.element, handle);
        const listeners: [string, (event: PointerEvent) => void][] = [
          ["pointerdown", (event) => this.onPointerDown(event, edge, handle)],
          ["pointermove", (event) => this.onPointerMove(event)],
          ["pointerup", (event) => this.onPointerEnd(event)],
          ["pointercancel", (event) => this.onPointerEnd(event)],
        ];
        for (const [type, listener] of listeners) {
          handle.addEventListener(type, listener as EventListener);
          this.removers.push(() => handle.removeEventListener(type, listener as EventListener));
        }
        // A double click goes back to the size of its styles
        const reset = () => this.reset();
        handle.addEventListener("dblclick", reset);
        this.removers.push(() => handle.removeEventListener("dblclick", reset));
      }
    });
  }

  public ngOnDestroy(): void {
    for (const remove of this.removers) remove();
  }

  private size(): PanelSize {
    const box = this.element.getBoundingClientRect();
    return { width: Math.round(box.width), height: Math.round(box.height) };
  }

  private apply(size: PanelSize): void {
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;
    this.element.classList.add("thumder-resized");
  }

  private reset(): void {
    this.element.style.removeProperty("width");
    this.element.style.removeProperty("height");
    this.element.classList.remove("thumder-resized");
    saveSize(this.name, null);
  }

  private onPointerDown(event: PointerEvent, edge: Edge, handle: HTMLElement): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture(event.pointerId);
    this.element.classList.add("thumder-resizing");
    this.gesture = { edge, pointer: event.pointerId, x: event.clientX, y: event.clientY, start: this.size(), handle };
  }

  private onPointerMove(event: PointerEvent): void {
    const gesture = this.gesture;
    if (gesture === null || event.pointerId !== gesture.pointer) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    this.apply(resizePanel(gesture.start, gesture.edge, event.clientX - gesture.x, event.clientY - gesture.y, viewport));
  }

  private onPointerEnd(event: PointerEvent): void {
    const gesture = this.gesture;
    if (gesture === null || event.pointerId !== gesture.pointer) return;
    this.gesture = null;
    this.element.classList.remove("thumder-resizing");
    if (gesture.handle.hasPointerCapture(event.pointerId)) gesture.handle.releasePointerCapture(event.pointerId);
    // What it measures (its styles may have limited it)
    const size = this.size();
    if (size.width !== gesture.start.width || size.height !== gesture.start.height) {
      this.apply(size);
      saveSize(this.name, size);
    }
  }

  @HostListener("keydown", ["$event"])
  public onKeydown(event: KeyboardEvent): void {
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const arrow = arrows[event.key];
    if (!event.altKey || !event.shiftKey || arrow === undefined) return;
    event.preventDefault();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    // As from the bottom right corner: right, wider; down, taller
    this.apply(resizePanel(this.size(), "se", arrow[0] * KEY_STEP, arrow[1] * KEY_STEP, viewport));
    const size = this.size();
    this.apply(size);
    saveSize(this.name, size);
  }
}
