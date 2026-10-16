import {
  type AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  inject,
  NgZone,
  type OnChanges,
  type OnDestroy,
  Output,
  Renderer2,
  type SimpleChanges,
} from "@angular/core";
import type { TypeWindowGeometry } from "@app/Types";
import { type Desk, EDGES, type Edge, keepInside, moveWindow, resizeWindow } from "./window-geometry";

/** What the keyboard moves or resizes a window, in px */
const KEY_STEP = 20;

/** What can be clicked in a title bar without moving the window */
const INTERACTIVE = "button, a, input, select, textarea, label, [contenteditable], .dropdown-menu";

/**
 * A window like the ones of an operating system, over its desk (the closest positioned parent): it moves by its title
 * bar (the header of its card), it is resized from its edges and corners, and a click brings it to the front. With the
 * focus inside it, Alt and the arrows move it and Alt, Shift and the arrows resize it. It tells where it is and how big
 * when the user lets it go (`geometryChange`); while it moves, it only changes its own styles (no change detection).
 */
@Directive({
  selector: "[thumderWindow]",
  standalone: true,
  host: { class: "thumder-window" },
})
export class WindowDirective implements OnChanges, AfterViewInit, OnDestroy {
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  @Input({ alias: "thumderWindow", required: true }) public geometry!: TypeWindowGeometry;
  /** Its place in the pile of windows: the highest, in front */
  @Input() public order = 0;
  @Output() public readonly geometryChange = new EventEmitter<TypeWindowGeometry>();
  /** The user clicked it: it goes to the front */
  @Output() public readonly raised = new EventEmitter<void>();

  private current: TypeWindowGeometry = { x: 0, y: 0, width: 0, height: 0 };
  private gesture: { mode: "move" | Edge; pointer: number; x: number; y: number; start: TypeWindowGeometry; desk: Desk } | null = null;
  private readonly removers: (() => void)[] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    // Its place in the pile changes at once (a click on its title bar raises it and starts a move)
    if (changes.order) this.element.style.zIndex = String(10 + this.order);
    // While the user moves or resizes it, the window is where the pointer says
    if (this.gesture !== null || !changes.geometry) return;
    this.current = { ...this.geometry };
    this.apply();
  }

  public ngAfterViewInit(): void {
    for (const edge of EDGES) {
      const handle: HTMLElement = this.renderer.createElement("div");
      this.renderer.addClass(handle, "thumder-window-handle");
      this.renderer.addClass(handle, `thumder-window-handle-${edge}`);
      this.renderer.setAttribute(handle, "data-edge", edge);
      this.renderer.setAttribute(handle, "aria-hidden", "true");
      this.renderer.appendChild(this.element, handle);
    }
    // The moves of the pointer change only the styles: outside Angular
    this.zone.runOutsideAngular(() => {
      const move = (event: PointerEvent) => this.onPointerMove(event);
      const end = (event: PointerEvent) => this.onPointerEnd(event);
      this.element.addEventListener("pointermove", move);
      this.element.addEventListener("pointerup", end);
      this.element.addEventListener("pointercancel", end);
      this.removers.push(
        () => this.element.removeEventListener("pointermove", move),
        () => this.element.removeEventListener("pointerup", end),
        () => this.element.removeEventListener("pointercancel", end),
      );
    });
  }

  public ngOnDestroy(): void {
    for (const remove of this.removers) remove();
  }

  /** The size of the desk: the window keeps its title bar inside it */
  private desk(): Desk {
    const parent = this.element.offsetParent as HTMLElement | null;
    return { width: parent?.clientWidth ?? window.innerWidth, height: Math.max(parent?.clientHeight ?? 0, window.innerHeight) };
  }

  private apply(): void {
    const { x, y, width, height } = this.current;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.element.style.zIndex = String(10 + this.order);
  }

  @HostListener("pointerdown", ["$event"])
  public onPointerDown(event: PointerEvent): void {
    this.raised.emit();
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    const edge = target.dataset.edge as Edge | undefined;
    const onTitleBar = target.closest(".card-header") !== null && target.closest(INTERACTIVE) === null;
    if (edge === undefined && !onTitleBar) return;
    // A maximized card fills the screen: it is not moved
    if (this.element.querySelector(".maximized-card") !== null) return;
    event.preventDefault();
    this.element.setPointerCapture(event.pointerId);
    this.element.classList.add("thumder-window-active");
    this.gesture = {
      mode: edge ?? "move",
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: { ...this.current },
      desk: this.desk(),
    };
  }

  private onPointerMove(event: PointerEvent): void {
    const gesture = this.gesture;
    if (gesture === null || event.pointerId !== gesture.pointer) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    this.current =
      gesture.mode === "move"
        ? moveWindow(gesture.start, dx, dy, gesture.desk)
        : resizeWindow(gesture.start, gesture.mode, dx, dy, gesture.desk);
    this.apply();
  }

  private onPointerEnd(event: PointerEvent): void {
    const gesture = this.gesture;
    if (gesture === null || event.pointerId !== gesture.pointer) return;
    this.gesture = null;
    this.element.classList.remove("thumder-window-active");
    if (this.element.hasPointerCapture(event.pointerId)) this.element.releasePointerCapture(event.pointerId);
    if (JSON.stringify(this.current) !== JSON.stringify(gesture.start)) this.zone.run(() => this.geometryChange.emit({ ...this.current }));
  }

  @HostListener("keydown", ["$event"])
  public onKeydown(event: KeyboardEvent): void {
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const arrow = arrows[event.key];
    if (!event.altKey || arrow === undefined) return;
    event.preventDefault();
    const [dx, dy] = [arrow[0] * KEY_STEP, arrow[1] * KEY_STEP];
    const desk = this.desk();
    this.current = event.shiftKey
      ? keepInside({ ...this.current, width: this.current.width + dx, height: this.current.height + dy }, desk)
      : moveWindow(this.current, dx, dy, desk);
    this.apply();
    this.geometryChange.emit({ ...this.current });
  }
}
