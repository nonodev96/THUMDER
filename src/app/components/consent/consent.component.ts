import { ChangeDetectionStrategy, Component, type ElementRef, effect, inject, signal, ViewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ConsentService } from "@core/services/consent/consent.service";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * The banner of privacy (the first visit to the web) and the window to choose what THUMDER may do: analytics and error
 * reports. Rejecting is as easy as accepting (one button each, the same size), and the choice can be changed at any time
 * from the footer. The window is a native dialog: it keeps the focus inside and Escape closes it
 */
@Component({
  selector: "thumder-consent",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  templateUrl: "./consent.component.html",
  styleUrl: "./consent.component.scss",
})
export class ConsentComponent {
  public readonly consent = inject(ConsentService);

  @ViewChild("dialog", { static: true }) private dialog!: ElementRef<HTMLDialogElement>;

  /** What the switches of the window say (saved with «Save my choice») */
  public readonly analytics = signal(false);
  public readonly errors = signal(true);

  constructor() {
    effect(() => {
      const dialog = this.dialog?.nativeElement;
      if (!dialog) return;
      if (this.consent.settingsOpen() && !dialog.open) {
        // An answer not given yet starts with the optional things off
        this.analytics.set(this.consent.decided() && this.consent.analytics());
        this.errors.set(this.consent.decided() ? this.consent.errors() : true);
        dialog.showModal();
      } else if (!this.consent.settingsOpen() && dialog.open) {
        dialog.close();
      }
    });
  }

  public saveChoice(): void {
    this.consent.save({ analytics: this.analytics(), errors: this.errors() });
  }

  /** Escape or the close button: the choice does not change */
  public onClose(): void {
    this.consent.closeSettings();
  }
}
