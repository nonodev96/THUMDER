import { Component, Inject } from '@angular/core';
import { DOCUMENT } from "@angular/common";
import { NavigationEnd, Router } from "@angular/router";

import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './__core/services';
import { StorageService } from "./__core/storage/storage.service";

import { DEFAULT_LANG } from "./CONSTAST";
import MonacoConfig from "../monaco-config";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  lang: string = DEFAULT_LANG;

  constructor(@Inject(DOCUMENT)
              private document: Document,
              private electronService: ElectronService,
              private storageService: StorageService,
              private translate: TranslateService,
              private router: Router
  ) {
    if (this.storageService.getItem('lang') === null) {
      this.storageService.setItem('lang', DEFAULT_LANG)
    }
    this.lang = this.storageService.getItem('lang')
    this.document.documentElement.lang = this.lang;
    this.translate.setDefaultLang(this.lang);
    console.log("ElectronService.debug: ", ElectronService.debug)
    // clean the route class when you travel and end de navigation
    router.events.subscribe((route) => {
      if (route instanceof NavigationEnd) {
        this.document.body.className = ""
      }
    });
    MonacoConfig.onMonacoLoad();
  }

  change(lang: string): void {
    this.storageService.setItem('lang', lang)
    this.lang = lang
    this.translate.setDefaultLang(lang)
  }

  getLang() {
    this.lang = this.storageService.getItem('lang')
    return this.lang
  }

  setLang(lang: string) {
    this.storageService.setItem('lang', lang)
    this.lang = lang
    this.translate.setDefaultLang(lang);
  }
}
