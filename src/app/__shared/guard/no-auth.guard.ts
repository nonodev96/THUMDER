import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from "../../__core/auth/auth.service";
import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(public authService: AuthService, public router: Router) {
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (this.authService.isLoggedIn) {
      await this.router.navigateByUrl('/');
    }
    return Promise.resolve(!this.authService.isLoggedIn);
  }

}
