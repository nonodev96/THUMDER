import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import {
  NgcCookieConsentService,
  NgcInitializeEvent,
  NgcStatusChangeEvent,
  NgcNoCookieLawEvent
} from "ngx-cookieconsent";

import MonacoConfig from "../monaco-config";
import { DEFAULT_LANG } from "./CONSTANTS";
import { TypeLang } from "./Types";
import { ElectronService } from "./__core/services";
import { StorageService } from "./__core/storage/storage.service";
import { MachineService } from "./__core/machine/machine.service";
import { AuthService } from "./__core/auth/auth.service";

declare const AppAdminLTE: {
  initMainPage();
};

import enMessages from 'devextreme/localization/messages/en.json';
import esMessages from 'devextreme/localization/messages/es.json';
import { locale, loadMessages, formatMessage } from 'devextreme/localization';

@Component({
  selector:    "app-root",
  templateUrl: "./app.component.html",
  styleUrls:   ["./app.component.scss"]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

  public lang: string = DEFAULT_LANG;
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
    this.auth.getIsLoggingObservable().subscribe((isLogging) => {
      if (isLogging) this.storageService.defaultDataInStorage();
    });
    this.router.events.subscribe((route) => {
      if (route instanceof NavigationStart) {
        this.document.body.className = "";
        this.document.body.classList.add("dx-viewport", "sidebar-mini", "layout-fixed", "layout-footer-fixed", "layout-navbar-fixed");
      }
      if (route instanceof NavigationEnd) {
        window.jQuery("body").Layout();
        const cards: any = window.jQuery(".card");
        cards.on("expanded.lte.cardwidget", () => {
          const resize = window.dispatchEvent(new Event("resize"));
        });
      }
    });
    MonacoConfig.onMonacoLoad();
  }

  ngOnInit(): void {
    AppAdminLTE.initMainPage();
    this.lang = this.storageService.getItem("lang");
    this.document.documentElement.lang = this.lang;
    this.translate.addLangs(["en", "sp"]);
    this.translate.setDefaultLang(this.lang);

    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => {
      // you can use this.ccService.getConfig() to do stuff...
      document.getElementById("cookieconsent:link").addEventListener("click", async (_$event) => {
        console.log("Go to cookies");
        await this.router.navigateByUrl("/landing/about");
        await new Promise(resolve => setTimeout(resolve, 750));
        document.getElementById("collapse-header-cookies").click();
      });
    });
    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(() => {
      // you can use this.ccService.getConfig() to do stuff...
    });
    this.initializeSubscription = this.ccService.initialize$.subscribe((_$event: NgcInitializeEvent) => {
      // you can use this.ccService.getConfig() to do stuff...
    });
    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(($event: NgcStatusChangeEvent) => {
      // you can use this.ccService.getConfig() to do stuff...
      localStorage.setItem("cookieconsent", $event.status);
    });
    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(() => {
      // you can use this.ccService.getConfig() to do stuff...
    });
    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe((_$event: NgcNoCookieLawEvent) => {
      // you can use this.ccService.getConfig() to do stuff...
    });
    this.updateCookiesConsentLang();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.popupOpenSubscription.unsubscribe();
    this.popupCloseSubscription.unsubscribe();
    this.initializeSubscription.unsubscribe();
    this.statusChangeSubscription.unsubscribe();
    this.revokeChoiceSubscription.unsubscribe();
    this.noCookieLawSubscription.unsubscribe();
  }

  public getLang() {
    this.lang = this.storageService.getItem("lang");
    return this.lang;
  }

  public setLang(lang: TypeLang) {
    this.storageService.setItem("lang", lang);
    this.lang = lang;
    this.translate.setDefaultLang(lang);
    // this.updateDevExpressLocation(lang);
    this.updateCookiesConsentLang();
  }

  private updateCookiesConsentLang() {
    this.translate
      .get(["cookie.header", "cookie.message", "cookie.dismiss", "cookie.allow", "cookie.deny", "cookie.link", "cookie.policy"])
      .subscribe((data) => {
        this.ccService.getConfig().content = this.ccService.getConfig().content || {};
        // Override default messages with the translated ones
        this.ccService.getConfig().content.header = data["cookie.header"];
        this.ccService.getConfig().content.message = data["cookie.message"];
        this.ccService.getConfig().content.dismiss = data["cookie.dismiss"];
        this.ccService.getConfig().content.allow = data["cookie.allow"];
        this.ccService.getConfig().content.deny = data["cookie.deny"];
        this.ccService.getConfig().content.link = data["cookie.link"];
        this.ccService.getConfig().content.policy = data["cookie.policy"];

        this.ccService.destroy(); // remove previous cookie bar (with default messages)
        this.ccService.init(this.ccService.getConfig()); // update config with translated messages
      });
  }

  private updateDevExpressLocation(lang: TypeLang) {
    if (lang === "en") {
      loadMessages(enMessages);
      locale("en")
    } else if (lang === "sp") {
      const esMessagesDefault = {
        es: {
          "dxFileManager-commandDelete":                        "Borrar",
          "dxFileManager-rootDirectoryName":                    "Archivos",
          "dxFileManager-commandRename":                        "Rename",
          "dxFileManager-listDetailsColumnCaptionName":         "Nombre",
          "dxFileManager-listDetailsColumnCaptionDateModified": "Fecha modificada",
        }
      };
      const op1 = { ...esMessages.es };
      const op2 = { ...esMessagesDefault.es }
      const copy = { ...op1, ...op2 };
      loadMessages(copy);
      locale("es");
    }
  }
}
