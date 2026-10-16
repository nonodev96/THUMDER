import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";

/** The pages to sign in: only for a guest, and only when THUMDER has accounts (Firebase) */
export const NoAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  if (authService.hasAccounts && authService.isGuest()) return true;
  return inject(Router).parseUrl("/");
};
