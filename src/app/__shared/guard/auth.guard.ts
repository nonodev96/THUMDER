import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../__core/auth/auth.service";
import { ToastrService } from "ngx-toastr";
import { IndividualConfig } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { DEFAULT_CONFIG_TOAST } from "../../CONSTANTS";
import { firstValueFrom } from "rxjs";

export const AuthGuard: CanActivateFn = async (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const translate = inject(TranslateService);
  const toast = inject(ToastrService);

  if (!authService.isLoggedIn) {
    if (router.url !== "/") {
      const config: Partial<IndividualConfig> = DEFAULT_CONFIG_TOAST;
      const lang_access_denied = await firstValueFrom(translate.get("TOAST.ACCESS_DENIED"));
      const lang_login_false = await firstValueFrom(translate.get("TOAST.LOGIN_FALSE"));
      toast.warning(lang_login_false, lang_access_denied, config);
    }
    await router.navigateByUrl("/account/login");
  }
  return authService.isLoggedIn;
};
