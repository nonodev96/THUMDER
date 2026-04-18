import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";

export const NoAuthGuard: CanActivateFn = async (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    await router.navigateByUrl("/");
  }
  return !authService.isLoggedIn;
};
