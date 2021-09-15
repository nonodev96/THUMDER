import { Component, Inject } from '@angular/core';
import { DOCUMENT } from "@angular/common";
import { NavigationEnd, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';

import { ElectronService } from './__core/services';
import { SocketProviderConnectService } from "./__core/services/socket-provider-connect.service";

import { DEFAULT_LANG } from "./CONSTAST";
import { TasksService } from "./__core/services/tasks/tasks.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  lang: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private electronService: ElectronService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.lang = localStorage.getItem('lang') ?? DEFAULT_LANG
    this.translate.setDefaultLang(this.lang);

    console.log("ElectronService.debug: ", ElectronService.debug)
    if (ElectronService.isElectronApp) {
      console.log('Run in electron');
      // window.$ = require('jquery');
      // console.log(process.env);
      // console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      // console.log('NodeJS childProcess', this.electronService.childProcess);
    }
    if (ElectronService.isServer) {
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
    localStorage.setItem('lang', lang)
    this.lang = lang
    this.translate.setDefaultLang(lang)
  }

  getLang() {
    this.lang = localStorage.getItem('lang')
    return this.lang
  }

  setLang(lang: string) {
    localStorage.setItem('lang', lang)
    this.lang = lang
    this.translate.setDefaultLang(lang);
  }
}
