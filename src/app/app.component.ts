import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from "@angular/common";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";

import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './__core/services';
import { StorageService } from "./__core/storage/storage.service";

import MonacoConfig from "../monaco-config";
import { DEFAULT_LANG } from "./CONSTAST";
import { MachineService } from "./__core/machine/machine.service";
import { TypeLang } from "./types";
import { AuthService } from "./__core/auth/auth.service";
import { Subscription } from "rxjs";
import {
  NgcCookieConsentService,
  NgcInitializeEvent,
  NgcStatusChangeEvent,
  NgcNoCookieLawEvent
} from 'ngx-cookieconsent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  lang: string = DEFAULT_LANG;
  private popupOpenSubscription: Subscription;
  private popupCloseSubscription: Subscription;
  private initializeSubscription: Subscription;
  private statusChangeSubscription: Subscription;
  private revokeChoiceSubscription: Subscription;
  private noCookieLawSubscription: Subscription;


  constructor(@Inject(DOCUMENT) private document: Document,
              public auth: AuthService,
              private ccService: NgcCookieConsentService,
              private storageService: StorageService,
              private machine: MachineService,
              private electronService: ElectronService,
              private translate: TranslateService,
              private router: Router) {
    console.log("ElectronService.debug: ", ElectronService.debug);

    // clean the route class when you travel and end de navigation
    this.router.events.subscribe((route) => {
      if (route instanceof NavigationStart) {
        this.document.body.className = "";
      }
      if (route instanceof NavigationEnd) {
        const cards: any = window.jQuery('.card');
        cards.on('expanded.lte.cardwidget', () => {
          const resize = window.dispatchEvent(new Event('resize'));
          console.log('resize', resize);
        });
      }
    });
    MonacoConfig.onMonacoLoad();
  }

  ngOnInit(): void {
    this.lang = this.storageService.getItem('lang');
    this.document.documentElement.lang = this.lang;
    this.translate.addLangs(['en', 'sp']);
    this.translate.setDefaultLang(this.lang);

    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
        console.log('popupOpen');
      });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
        console.log('popuClose');
      });

    this.initializeSubscription = this.ccService.initialize$.subscribe(
      (event: NgcInitializeEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
        console.log(`initialize: ${JSON.stringify(event)}`);
      });

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      (event: NgcStatusChangeEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
        console.log(`statusChange: ${JSON.stringify(event)}`);
      });

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
        console.log(`revokeChoice`);
      });

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
      (event: NgcNoCookieLawEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
        console.log(`noCookieLaw: ${JSON.stringify(event)}`);
      });
  }

  ngOnDestroy(): void {
    this.popupOpenSubscription.unsubscribe();
    this.popupCloseSubscription.unsubscribe();
    this.initializeSubscription.unsubscribe();
    this.statusChangeSubscription.unsubscribe();
    this.revokeChoiceSubscription.unsubscribe();
    this.noCookieLawSubscription.unsubscribe();
  }

  getLang() {
    this.lang = this.storageService.getItem('lang');
    return this.lang;
  }

  setLang(lang: TypeLang) {
    this.storageService.setItem('lang', lang);
    this.lang = lang;
    this.translate.setDefaultLang(lang);
  }
}
