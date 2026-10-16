import { UpperCasePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "view-profile",
  templateUrl: "./profile.view.html",
  styleUrls: [],
  imports: [RouterLink, TranslatePipe, UpperCasePipe],
})
export class ProfileView {
  authService = inject(AuthService);
  files = inject(FileSystemStorageService);
}
