import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * The toasts of ToastService. Two live regions, always in the page so that the screen readers hear what is added: the
 * errors and the warnings interrupt (role alert), the rest waits (role status)
 */
@Component({
  selector: "thumder-toasts",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, NgTemplateOutlet],
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
      <div [class]="'thumder-toast thumder-toast--' + toast.kind" (mouseenter)="service.pause(toast.id)"
        (mouseleave)="service.resume(toast.id)" (focusin)="service.pause(toast.id)" (focusout)="service.resume(toast.id)">
        <i [class]="'fas fa-fw thumder-toast-icon ' + icons[toast.kind]" aria-hidden="true"></i>
        <div class="thumder-toast-body">
          @if (toast.title) {
            <p class="thumder-toast-title">{{ toast.title }}</p>
          }
          <p class="thumder-toast-message">{{ toast.message }}</p>
        </div>
        <button type="button" class="thumder-toast-close" [attr.aria-label]="'FORMS.CLOSE' | translate" [title]="'FORMS.CLOSE' | translate"
          (click)="service.close(toast.id)">
          <span aria-hidden="true">&times;</span>
        </button>
        @if (toast.timeOut > 0) {
          <span class="thumder-toast-time" [style.animation-duration.ms]="toast.timeOut" aria-hidden="true"></span>
        }
      </div>
    </ng-template>
  `,
})
export class ToastsComponent {
  public readonly service = inject(ToastService);
  public readonly toasts = this.service.toasts;
  public readonly icons: Record<string, string> = {
    info: "fa-info-circle",
    success: "fa-check-circle",
    warning: "fa-exclamation-triangle",
    error: "fa-times-circle",
  };
}
