import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { AuthService } from "../../__core/auth/auth.service";
import { ToastrService } from "ngx-toastr";
import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";
import { TranslateService } from "@ngx-translate/core";
import { DEFAULT_CONFIG_TOAST } from "../../CONSTANTS";

@Injectable({
  providedIn: "root"
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router,
              private translate: TranslateService,
              private authService: AuthService,
              private toast: ToastrService) {
  }

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (!this.authService.isLoggedIn) {
      if (this.router.url !== "/") {
        const config: Partial<IndividualConfig> = DEFAULT_CONFIG_TOAST;
        const lang_access_denied = await this.translate.get("TOAST.ACCESS_DENIED").toPromise();
        const lang_login_false = await this.translate.get("TOAST.LOGIN_FALSE").toPromise();
        this.toast.warning(lang_login_false, lang_access_denied, config);
      }
      await this.router.navigateByUrl("/login");
    }
    return Promise.resolve(this.authService.isLoggedIn);
  }

}
