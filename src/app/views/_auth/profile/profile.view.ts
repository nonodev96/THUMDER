import { UpperCasePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { nativePlatform } from "@core/services/mobile/mobile";
import { TranslatePipe } from "@ngx-translate/core";
import { ModalDismissDirective, ModalService } from "@shared/directives/bootstrap/modal.directive";

/** The modal that asks before deleting the account */
export const DELETE_ACCOUNT_MODAL = "profileDeleteModal";

@Component({
  selector: "view-profile",
  templateUrl: "./profile.view.html",
  styleUrls: [],
  imports: [RouterLink, TranslatePipe, UpperCasePipe, ModalDismissDirective],
})
export class ProfileView {
  authService = inject(AuthService);
  files = inject(FileSystemStorageService);
  private modals = inject(ModalService);
  private router = inject(Router);

  /** The application of Android or iOS: the files are on the device, not in a browser */
  public readonly app = nativePlatform() !== null;

  /** The account is being deleted */
  public readonly deleting = signal(false);
  /** The account can only be deleted a few minutes after signing in: it has been longer */
  public readonly signInAgain = signal(false);

  public askDelete(opener: EventTarget | null): void {
    this.signInAgain.set(false);
    this.modals.open(DELETE_ACCOUNT_MODAL, opener as HTMLElement | null);
  }

  public async confirmDelete(): Promise<void> {
    this.deleting.set(true);
    const result = await this.authService.DeleteAccount();
    this.deleting.set(false);
    if (result === "sign-in-again") this.signInAgain.set(true);
    else this.modals.close(DELETE_ACCOUNT_MODAL);
  }

  /** Leaving the page from the modal (its link to what is deleted): it closes first, with its backdrop */
  public closeDelete(): void {
    this.modals.close(DELETE_ACCOUNT_MODAL);
  }

  /** Signs out (the files that are not in the account yet go to it) and goes to sign in again */
  public async signInAgainToDelete(): Promise<void> {
    this.modals.close(DELETE_ACCOUNT_MODAL);
    await this.authService.SignOut();
    await this.router.navigate(["/account/login"]);
  }
}
