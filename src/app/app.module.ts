import { DragDropModule } from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { NgModule, SecurityContext } from "@angular/core";
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
  /*initializeAnalytics*/
} from "@angular/fire/analytics";
import {
  initializeApp,
  provideFirebaseApp /*getApp*/,
} from "@angular/fire/app";
import {
  getAuth /* initializeAuth, browserLocalPersistence, browserPopupRedirectResolver*/,
  provideAuth,
} from "@angular/fire/auth";
import { getDatabase, provideDatabase } from "@angular/fire/database";
import {
  getFirestore,
  /*initializeFirestore*/ provideFirestore,
} from "@angular/fire/firestore";
import { getFunctions, provideFunctions } from "@angular/fire/functions";
import { getMessaging, provideMessaging } from "@angular/fire/messaging";
import { getPerformance, providePerformance } from "@angular/fire/performance";
import {
  getRemoteConfig,
  provideRemoteConfig,
} from "@angular/fire/remote-config";
import { getStorage, provideStorage } from "@angular/fire/storage";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";
// import { CONFIG_WEBSOCKET } from "./CONSTANTS";
import { AppComponent } from "@app/app.component";
import { AppRoutingModule } from "@app/app-routing.module";
// MODULES
import { ComponentsModule } from "@components/components.module";
import { CoreModule } from "@core/core.module";
// Services
import { UtilityService } from "@core/services/utility/utility.service";
// _layouts
import { LayoutAdminComponent } from "@layout/admin/layout-admin.component";
import { LayoutAuthComponent } from "@layout/auth/layout-auth.component";
import { LayoutLandingComponent } from "@layout/landing/layout-landing.component";
// NG Translate
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { SharedModule } from "@shared/shared.module";
// Index
import { IndexView } from "@views/_index/index.view";
// angular-gridster2
import { GridsterModule } from "angular-gridster2";
// SOCKET
// import { SocketIoModule } from "ngx-socket-io";
// NG-TABLE
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
// ng2-charts
import { NgChartsModule } from "ng2-charts";
// Cookies
import { CookieService } from "ngx-cookie-service";
// ngx-cookieconsent
import {
  type NgcCookieConsentConfig,
  NgcCookieConsentModule,
} from "ngx-cookieconsent";
// ngx-markdown
import {
  MARKED_OPTIONS,
  MarkdownModule,
  MarkedRenderer,
  type MarkedOptions,
} from "ngx-markdown";

// TOAST
import { ToastrModule } from "ngx-toastr";
// APP
import { AppConfig } from "../environments/_environment";

// AoT requires an exported function for factories

const domain = "localhost";

const cookieConfig: NgcCookieConsentConfig = {
  enabled: false,
  // autoOpen: isElectronApp,
  cookie: {
    domain: domain,
  },
  palette: {
    popup: {
      background: "#000",
    },
    button: {
      background: "#f1d600",
    },
  },
  theme: "edgeless",
  type: "opt-out",
  content: {
    href: "#/landing/about",
  },
  elements: {
    messagelink: `
    <span id="cookieconsent:desc" class="cc-message">{{message}}&nbsp;
        <a id="cookieconsent:link" aria-label="learn more about cookies" tabindex="0" class="cc-link">{{link}}</a>
    </span>
    `,
  },
};

import { Parser, type Tokens } from "marked";

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer({});

  renderer.table = (token: Tokens.Table) => {
    const parser = new Parser({});
    return parser
      .parse([token])
      .replace("<table>", "<table class='table table-striped'>");
  };

  renderer.blockquote = ({ tokens }) => {
    return (
      '<blockquote class="blockquote"><p>' +
      Parser.parse(tokens) +
      "</p></blockquote>"
    );
  };

  renderer.link = ({ href, title, tokens }: Tokens.Link): string => {
    // Renderizar los tokens internos a string
    const text =
      renderer.parser?.parseInline(tokens) ??
      tokens.map((t) => ("text" in t ? t.text : "")).join("");
    const safeTitle = title ? ` title="${title}"` : "";

    if (!href) {
      return `<a${safeTitle}>${text}</a>`;
    }

    const isElectron = (window as any)?.process?.type;

    if (isElectron) {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        const safeHref = href.replace(/'/g, "\\'");
        return `<a href="javascript:;" onclick="window.require('electron').shell.openExternal('${safeHref}');"${safeTitle}>${text}</a>`;
      } else if (href.includes("#")) {
        return `<a href="javascript:;"${safeTitle}>${text}</a>`;
      }
      // href local (no http, no #) — enlace normal
      return `<a href="${href}"${safeTitle}>${text}</a>`;
    }

    return `<a href="${href}"${safeTitle}>${text}</a>`;
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
  };
}

// const app = initializeApp(AppConfig.firebase);

@NgModule({
  declarations: [
    AppComponent,
    LayoutAdminComponent,
    LayoutAuthComponent,
    LayoutLandingComponent,
    IndexView,
  ],
  exports: [],
  bootstrap: [AppComponent],
  imports: [
    CoreModule,
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
        useFactory: markedOptionsFactory,
      },
    }),
    ToastrModule.forRoot(),
    // SocketIoModule.forRoot(CONFIG_WEBSOCKET),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    // MonacoEditorModule,
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
    DragDropModule,
  ],
  providers: [
    UtilityService,
    CookieService,
    UserTrackingService,
    ScreenTrackingService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
