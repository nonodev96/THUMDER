import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PUBLIC_WEB_URL } from "@app/CONSTANTS";
import { ConfigService } from "@core/config/config.service";
import { encodeExercise, LOCKABLE, type Lockable, MAX_CONTENT } from "@core/exercises/share";
import { logger } from "@core/logger/logger";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalDismissDirective, ModalService } from "@shared/directives/bootstrap/modal.directive";

export const SHARE_MODAL = "programShareModal";

/**
 * Shares the program as an exercise (EDU-07): a link with the program, the configuration of the machine, a statement
 * and the options locked while it is open. Everything goes in the link (no server)
 */
@Component({
  selector: "thumder-share-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, ModalDismissDirective],
  template: `
    <div class="modal fade" [id]="id" tabindex="-1" aria-labelledby="programShareTitle" aria-hidden="true" style="display: none">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="programShareTitle">{{ 'SHARE.TITLE' | translate }}</h2>
            <button type="button" class="close" thumderModalDismiss [attr.aria-label]="'FORMS.CLOSE' | translate"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <p class="small text-muted">{{ 'SHARE.HELP' | translate }}</p>
            <label for="shareStatement">{{ 'SHARE.STATEMENT' | translate }}</label>
            <textarea class="form-control form-control-sm mb-2" id="shareStatement" rows="3" maxlength="2000" [(ngModel)]="statement" (ngModelChange)="build()" cdkFocusInitial></textarea>
            <fieldset class="mb-2">
              <legend class="h6">{{ 'SHARE.LOCK' | translate }}</legend>
              @for (key of lockable; track key) {
                <div class="custom-control custom-checkbox">
                  <input type="checkbox" class="custom-control-input" [id]="'shareLock-' + key" [checked]="locked().includes(key)" (change)="toggle(key)">
                  <label class="custom-control-label" [for]="'shareLock-' + key">{{ 'SHARE.LOCK_' + key.toUpperCase() | translate }}</label>
                </div>
              }
            </fieldset>
            @if (tooLong()) {
              <p class="text-danger small" role="alert">{{ 'SHARE.TOO_LONG' | translate }}</p>
            } @else {
              <label for="shareLink">{{ 'SHARE.LINK' | translate }}</label>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control text-monospace" id="shareLink" readonly [value]="link()">
                <div class="input-group-append">
                  <button type="button" class="btn btn-outline-primary" id="shareCopy" (click)="copy()" [disabled]="!link()">{{ 'SHARE.COPY' | translate }}</button>
                </div>
              </div>
              <p class="small mt-1 mb-0" aria-live="polite">{{ copied() ? ('SHARE.COPIED' | translate) : '' }}</p>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" thumderModalDismiss>{{ 'FORMS.CLOSE' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ShareModalComponent {
  private config = inject(ConfigService);
  private modals = inject(ModalService);

  public readonly id = SHARE_MODAL;
  public readonly lockable = LOCKABLE;
  public readonly locked = signal<Lockable[]>(["architecture", "forwarding"]);
  public readonly link = signal("");
  public readonly copied = signal(false);
  public readonly tooLong = signal(false);
  public statement = "";
  private file = { name: "", content: "" };

  public open(file: { name: string; content: string }, opener: EventTarget | null): void {
    this.file = file;
    this.copied.set(false);
    void this.build();
    this.modals.open(this.id, opener as HTMLElement | null);
  }

  public toggle(key: Lockable): void {
    this.locked.update((locked) => (locked.includes(key) ? locked.filter((other) => other !== key) : [...locked, key]));
    void this.build();
  }

  /** The link: the web version of THUMDER (also from the desktop application, which has no address of its own) */
  public async build(): Promise<void> {
    this.copied.set(false);
    this.tooLong.set(this.file.content.length > MAX_CONTENT);
    if (this.tooLong()) return;
    const { architecture, superdlx, forwarding, floatingPoint, memorySize } = this.config.value();
    const data = await encodeExercise({
      version: 1,
      name: this.file.name,
      content: this.file.content,
      statement: this.statement,
      architecture,
      superdlx,
      forwarding,
      floatingPoint,
      memorySize,
      locked: this.locked(),
    });
    const base = location.protocol.startsWith("http") ? new URL(document.baseURI).href : PUBLIC_WEB_URL;
    this.link.set(`${base}auth/shared?d=${data}`);
  }

  public async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
    } catch (error) {
      // Without permission for the clipboard the text is selected, to copy it by hand
      logger.warn(error);
      (document.getElementById("shareLink") as HTMLInputElement | null)?.select();
    }
  }
}
