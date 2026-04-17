import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { AuthService } from "../../__core/auth/auth.service";
import { ToastrService } from "ngx-toastr";
import { IndividualConfig } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { DEFAULT_CONFIG_TOAST } from "../../CONSTANTS";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AuthGuard  {

  constructor(private router: Router,
              private translate: TranslateService,
              private authService: AuthService,
              private toast: ToastrService) {
  }

  public async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (!this.authService.isLoggedIn) {
      if (this.router.url !== "/") {
        const config: Partial<IndividualConfig> = DEFAULT_CONFIG_TOAST;
        const lang_access_denied = await firstValueFrom(this.translate.get("TOAST.ACCESS_DENIED"));
        const lang_login_false = await firstValueFrom(this.translate.get("TOAST.LOGIN_FALSE"));
        this.toast.warning(lang_login_false, lang_access_denied, config);
      }
      await this.router.navigateByUrl("/account/login");
    }
    return Promise.resolve(this.authService.isLoggedIn);
  }

}
