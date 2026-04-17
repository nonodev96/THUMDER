import { NgModule, SecurityContext } from "@angular/core";
import { RouterModule } from "@angular/router";
import { initializeApp, provideFirebaseApp, /*getApp*/ } from '@angular/fire/app';
import {
  provideAuth, getAuth, /* initializeAuth, browserLocalPersistence, browserPopupRedirectResolver*/
} from "@angular/fire/auth";
import { provideStorage, getStorage } from "@angular/fire/storage";
import { provideFirestore, getFirestore, /*initializeFirestore*/ } from '@angular/fire/firestore';
import {
  provideAnalytics,
  getAnalytics,
  UserTrackingService,
  ScreenTrackingService,
  /*initializeAnalytics*/
} from '@angular/fire/analytics';
import { provideDatabase, getDatabase } from "@angular/fire/database";
import { provideFunctions, getFunctions } from "@angular/fire/functions";
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { providePerformance, getPerformance } from '@angular/fire/performance';
import { provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';

import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// devextreme
import { DxFileManagerModule, DxListModule, DxPopupModule, DxToolbarModule } from "devextreme-angular";
// Monaco
// import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { CovalentCodeEditorModule } from "@covalent/code-editor";

// TOAST
import { ToastrModule } from "ngx-toastr";
// SOCKET
// import { SocketIoModule } from "ngx-socket-io";
// NG-TABLE
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
// Cookies
import { CookieService } from "ngx-cookie-service";
// ngx-markdown
import { MarkdownModule, MARKED_OPTIONS, MarkedRenderer } from "ngx-markdown";
// ngx-cookieconsent
import { NgcCookieConsentModule, NgcCookieConsentConfig } from "ngx-cookieconsent";
// ng2-charts
import { NgChartsModule } from 'ng2-charts';
// angular-gridster2
import { GridsterModule } from 'angular-gridster2';

// Services
import { UtilityService } from "./__core/services/utility/utility.service";
// NG Translate
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

// MODULES
import { ComponentsModule } from "./components/components.module";
import { AppRoutingModule } from "./app-routing.module";

import { CoreModule } from "./__core/core.module";

// APP
import { AppConfig } from "../environments/_environment";
// import { CONFIG_WEBSOCKET } from "./CONSTANTS";
import { AppComponent } from "./app.component";


import { SharedModule } from "./__shared/shared.module";


// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";
import { LayoutLandingComponent } from "./_layouts/landing/layout-landing.component";

// Index
import { IndexView } from "./views/_index/index.view";
// AoT requires an exported function for factories

const domain = "localhost";

const cookieConfig: NgcCookieConsentConfig = {
  enabled: false,
  // autoOpen: isElectronApp,
  cookie:   {
    domain: domain
  },
  palette:  {
    popup:  {
      background: "#000"
    },
    button: {
      background: "#f1d600"
    }
  },
  theme:    "edgeless",
  type:     "opt-out",
  content:  {
    href: "#/landing/about"
  },
  elements: {
    messagelink: `
    <span id="cookieconsent:desc" class="cc-message">{{message}}&nbsp;
        <a id="cookieconsent:link" aria-label="learn more about cookies" tabindex="0" class="cc-link">{{link}}</a>
    </span>
    `
  }
};


export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

export function markedOptionsFactory(): object {
  const defaultMarkedRenderer = new MarkedRenderer();
  const markedRenderer = new MarkedRenderer();

  markedRenderer.table = ((token: any) => {
    const defaultHtml = defaultMarkedRenderer.table(token);
    return defaultHtml.replace('<table>', '<table class="table table-striped">');
  }) as any;

  markedRenderer.heading = (({ text, depth }: any) => {
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `<h${depth}><a class="anchor" href="#${escapedText}" id="${escapedText}"><span class="header-link"></span></a> ${text}</h${depth}>`;
  }) as any;

  markedRenderer.link = (({ href, title, text }: any) => {
    if (!href) {
      return defaultMarkedRenderer.link({ href, title, text } as any);
    }
    const isElectron = window && window.process && window.process.type;
    if (isElectron) {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        return `<a href="javascript:;" onclick="window.require('electron').shell.openExternal('${href}');" title="${title}">${text}</a>`;
      } else if (href.indexOf("#") !== -1) {
        return `<a href="javascript:;" title="${title}">${text}</a>`;
      }
    } else {
      return `<a href="${href}" title="${title}">${text}</a>`;
    }
  }) as any;

  return {
    renderer:    markedRenderer,
    headerIds:   true,
    gfm:         true,
    breaks:      false,
    pedantic:    false,
    smartLists:  true,
    smartypants: false
  };
}

// const app = initializeApp(AppConfig.firebase);

@NgModule({ declarations: [
        AppComponent,
        LayoutAdminComponent,
        LayoutAuthComponent,
        LayoutLandingComponent,
        IndexView,
    ],
    exports: [],
    bootstrap: [
        AppComponent
    ], imports: [CoreModule,
        SharedModule,
        ComponentsModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        AppRoutingModule,
        NgChartsModule,
        GridsterModule,
        NgcCookieConsentModule.forRoot(cookieConfig),
        MarkdownModule.forRoot({
            sanitize: SecurityContext.NONE,
            loader: HttpClient,
            markedOptions: {
                provide: MARKED_OPTIONS,
                useFactory: markedOptionsFactory
            }
        }),
        ToastrModule.forRoot(),
        // SocketIoModule.forRoot(CONFIG_WEBSOCKET),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        // MonacoEditorModule,
        DxToolbarModule,
        DxListModule,
        DxPopupModule,
        DxFileManagerModule,
        // use forRoot() in main app module only.
        provideFirebaseApp(() => initializeApp(AppConfig.firebase)),
        provideAuth(() => getAuth()),
        provideAnalytics(() => getAnalytics()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideDatabase(() => getDatabase()),
        provideFunctions(() => getFunctions()),
        provideMessaging(() => getMessaging()),
        providePerformance(() => getPerformance()),
        provideRemoteConfig(() => getRemoteConfig()),
        MatSortModule,
        MatTableModule,
        ScrollingModule,
        TableVirtualScrollModule,
        DragDropModule], providers: [
        UtilityService,
        CookieService,
        UserTrackingService,
        ScreenTrackingService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {
}
