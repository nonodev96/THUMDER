import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from "../../__core/auth/auth.service";
import { Observable } from 'rxjs';
import { ToastrService } from "ngx-toastr";
import { IndividualConfig } from "ngx-toastr/toastr/toastr-config";
import { TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router,
              private translate: TranslateService,
              private authService: AuthService,
              private toast: ToastrService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(async (resolve) => {

      if (!this.authService.isLoggedIn) {
        const config: Partial<IndividualConfig> = {
          progressBar: true,
          progressAnimation: 'decreasing',
          closeButton: true
        };
        const lang_access_denied = await this.translate.get('TOAST.ACCESS_DENIED').toPromise();
        const lang_login_false = await this.translate.get('TOAST.LOGIN_FALSE').toPromise();
        this.toast.warning(lang_login_false, lang_access_denied, config);
      }

      resolve(this.authService.isLoggedIn);
    })
  }

}
