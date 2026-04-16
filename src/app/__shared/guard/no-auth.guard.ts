import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { AuthService } from "../../__core/auth/auth.service";

@Injectable({
  providedIn: "root"
})
export class NoAuthGuard  {

  constructor(public authService: AuthService, public router: Router) {
  }

  public async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (this.authService.isLoggedIn) {
      await this.router.navigateByUrl("/");
    }
    return Promise.resolve(!this.authService.isLoggedIn);
  }
}
