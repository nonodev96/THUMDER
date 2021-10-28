import { Component, Inject } from '@angular/core';
import { DOCUMENT } from "@angular/common";
import { NavigationEnd, Router } from "@angular/router";

import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './__core/services';
import { StorageService } from "./__core/storage/storage.service";

import MonacoConfig from "../monaco-config";
import { DEFAULT_LANG } from "./CONSTAST";
import { MachineService } from "./__core/machine/machine.service";
import { TypeLang } from "./types";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  lang: string = DEFAULT_LANG;

  constructor(@Inject(DOCUMENT)
              private document: Document,
              private storageService: StorageService,
              private machine: MachineService,
              private electronService: ElectronService,
              private translate: TranslateService,
              private router: Router
  ) {
    console.log("ElectronService.debug: ", ElectronService.debug)

    this.lang = this.storageService.getItem('lang')

    this.document.documentElement.lang = this.lang;
    this.translate.setDefaultLang(this.lang);
    // clean the route class when you travel and end de navigation
    router.events.subscribe((route) => {
      if (route instanceof NavigationEnd) {
        this.document.body.className = ""
      }
    });
    MonacoConfig.onMonacoLoad();
  }

  getLang() {
    this.lang = this.storageService.getItem('lang')
    return this.lang
  }

  setLang(lang: TypeLang) {
    this.storageService.setItem('lang', lang)
    this.lang = lang
    this.translate.setDefaultLang(lang);
  }
}
