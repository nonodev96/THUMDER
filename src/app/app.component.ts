import {Component, Inject} from '@angular/core';
import {ElectronService} from './__core/services';
import {TranslateService} from '@ngx-translate/core';
import {AppConfig} from '../environments/environment';
import {NavigationEnd, Router} from "@angular/router";
import {DOCUMENT} from "@angular/common";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private electronService: ElectronService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.translate.setDefaultLang('sp');

    if (electronService.isElectron) {
      console.log(process.env);
      // window.$ = require('jquery');
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
    // clean the route class when you travel and end de navigation
    router.events.subscribe((route) => {
      if (route instanceof NavigationEnd) {

        this.document.body.className = ""

      }
    });
  }

  change(lang: string): void {
    this.translate.setDefaultLang(lang);
  }
}
