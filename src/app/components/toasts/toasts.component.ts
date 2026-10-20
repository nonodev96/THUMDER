import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { type Toast, ToastService } from "@core/services/toast/toast.service";
import { TranslatePipe } from "@ngx-translate/core";

/** How far a finger has to slide a notice to close it */
const SWIPE = 80;

/**
 * The notices of ToastService: cards with the colours of the theme, the icon of their kind, their title and message, a
 * button to close them and a thin line with the time they have left (it waits while the pointer or the focus is on
 * them). They come in from the side on a wide screen and from below on a phone, where they take the width over the bar
 * of the simulation and a finger slides them away. Two live regions, always in the page so that the screen readers hear
 * what is added: the errors and the warnings interrupt (role alert), the rest waits (role status)
 */
@Component({
  selector: "thumder-toasts",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, NgTemplateOutlet],
  styleUrls: ["./toasts.component.scss"],
  template: `
    <div class="thumder-toasts">
      <div role="alert" aria-live="assertive" class="thumder-toasts-region">
        @for (toast of toasts(); track toast.id) {
          @if (toast.kind === "error" || toast.kind === "warning") {
            <ng-container *ngTemplateOutlet="item; context: { $implicit: toast }"></ng-container>
          }
        }
      </div>
      <div role="status" aria-live="polite" class="thumder-toasts-region">
        @for (toast of toasts(); track toast.id) {
          @if (toast.kind === "info" || toast.kind === "success") {
            <ng-container *ngTemplateOutlet="item; context: { $implicit: toast }"></ng-container>
          }
        }
      </div>
    </div>

    <ng-template #item let-toast>
      <div [class]="'thumder-toast thumder-toast--' + toast.kind" [class.thumder-toast--leaving]="toast.leaving"
        [class.thumder-toast--dragging]="swiping()?.id === toast.id"
        [style.transform]="swiping()?.id === toast.id ? 'translateX(' + swiping()!.dx + 'px)' : null"
        [style.opacity]="swiping()?.id === toast.id ? 1 - Math.min(1, Math.abs(swiping()!.dx) / 220) : null"
        (mouseenter)="service.pause(toast.id)" (mouseleave)="service.resume(toast.id)" (focusin)="service.pause(toast.id)"
        (focusout)="service.resume(toast.id)" (pointerdown)="onDown($event, toast)" (pointermove)="onMove($event, toast)"
        (pointerup)="onUp($event, toast)" (pointercancel)="onUp($event, toast)">
        <span class="thumder-toast-icon" aria-hidden="true"><i [class]="'fas ' + icons[toast.kind]"></i></span>
        <div class="thumder-toast-body">
          @if (toast.title) {
            <p class="thumder-toast-title">
              {{ toast.title }}
              @if (toast.count > 1) { <span class="thumder-toast-count">×{{ toast.count }}</span> }
            </p>
          }
          <p class="thumder-toast-message">
            {{ toast.message }}
            @if (!toast.title && toast.count > 1) { <span class="thumder-toast-count">×{{ toast.count }}</span> }
          </p>
        </div>
        <button type="button" class="thumder-toast-close" [attr.aria-label]="'FORMS.CLOSE' | translate" [title]="'FORMS.CLOSE' | translate"
          (click)="service.close(toast.id)">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        @if (toast.duration > 0) {
          <!-- Again from the start each time the same notice comes back -->
          @for (round of [toast.count]; track round) {
            <span class="thumder-toast-time" [style.animation-duration.ms]="toast.duration" aria-hidden="true"></span>
          }
        }
      </div>
    </ng-template>
  `,
})
export class ToastsComponent {
  public readonly service = inject(ToastService);
  public readonly toasts = this.service.toasts;
  public readonly Math = Math;
  public readonly icons: Record<string, string> = {
    info: "fa-info",
    success: "fa-check",
    warning: "fa-exclamation",
    error: "fa-times",
  };

  /** The notice a finger is sliding, and how far */
  public readonly swiping = signal<{ id: number; dx: number; x: number; pointerId: number } | null>(null);

  public onDown(event: PointerEvent, toast: Toast): void {
    if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("button")) return;
    this.swiping.set({ id: toast.id, dx: 0, x: event.clientX, pointerId: event.pointerId });
    this.service.pause(toast.id);
  }

  public onMove(event: PointerEvent, toast: Toast): void {
    const swipe = this.swiping();
    if (swipe?.id !== toast.id || swipe.pointerId !== event.pointerId) return;
    this.swiping.set({ ...swipe, dx: event.clientX - swipe.x });
  }

  public onUp(event: PointerEvent, toast: Toast): void {
    const swipe = this.swiping();
    if (swipe?.id !== toast.id || swipe.pointerId !== event.pointerId) return;
    this.swiping.set(null);
    if (Math.abs(swipe.dx) > SWIPE) this.service.close(toast.id);
    else this.service.resume(toast.id);
  }
}
