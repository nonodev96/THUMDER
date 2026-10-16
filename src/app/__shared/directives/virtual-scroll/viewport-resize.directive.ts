import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { Directive, ElementRef, inject, NgZone, type OnDestroy, type OnInit } from "@angular/core";

/**
 * The virtual scroll of the CDK measures itself only when the window changes its size. Its tables (code, memory,
 * registers) also change size when their card unfolds or fills the screen, when they are moved in the multiview and when
 * the sidebar folds: this measures them again whenever their own size changes. It applies to every
 * `cdk-virtual-scroll-viewport` of the modules that import it (SharedModule).
 */
@Directive({
  selector: "cdk-virtual-scroll-viewport",
  standalone: true,
})
export class ViewportResizeDirective implements OnInit, OnDestroy {
  private readonly viewport = inject(CdkVirtualScrollViewport);
  private readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly zone = inject(NgZone);
  private observer?: ResizeObserver;

  ngOnInit(): void {
    if (typeof ResizeObserver === "undefined") return;
    // Inside the zone: the rows of the new size are drawn by Angular
    this.observer = new ResizeObserver(() => this.zone.run(() => this.viewport.checkViewportSize()));
    this.observer.observe(this.element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
