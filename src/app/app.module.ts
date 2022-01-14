import "reflect-metadata";
import "../polyfills";

import { NgModule, SecurityContext } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { ScrollingModule } from "@angular/cdk/scrolling";

import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule, HttpClient } from "@angular/common/http";

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
import { MarkdownModule, MarkedOptions, MarkedRenderer } from "ngx-markdown";
// ngx-cookieconsent
import { NgcCookieConsentModule, NgcCookieConsentConfig } from "ngx-cookieconsent";

// Services
import { UtilityService } from "./__core/utility.service";

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
import { AuthGuard } from "./__shared/guard/auth.guard";
import { NoAuthGuard } from "./__shared/guard/no-auth.guard";


// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";
import { LayoutLandingComponent } from "./_layouts/landing/layout-landing.component";

// _admin views
// _auth views
import { MultiplesViewsComponent } from "./views/_auth/_views/multiples-views.component";
import { CalculatorView } from "./views/_auth/calculator/calculator.view";
import { CodeView } from "./views/_auth/code/code.view";
import { ConfigView } from "./views/_auth/config/config.view";
import { DocsView } from "./views/_auth/docs/docs.view";
import { FileManagerView } from "./views/_auth/file-manager/file-manager.view";
import { EditorView } from "./views/_auth/editor/editor.view";
import { LoggerView } from "./views/_auth/logger/logger.view";
import { MemoryView } from "./views/_auth/memory/memory.view";
import { CycleClockDiagramView } from "./views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "./views/_auth/pixi-pipeline/pipeline.view";
import { ProfileView } from "./views/_auth/profile/profile.view";
import { RegistersView } from "./views/_auth/registers/registers.view";
import { StatisticsView } from "./views/_auth/statistics/statistics.view";

// no _layouts views
import { AboutView } from "./views/_landing/about/about.view";
import { LandingView } from "./views/_landing/landing/landing.view";
import { DebugView } from "./views/debug/debug-view";
import { ForgotPasswordView } from "./views/forgot-password/forgot-password.view";
import { LoginView } from "./views/login/login.view";
import { RegisterView } from "./views/register/register.view";

// Index
import { IndexView } from "./views/_index/index.view";
// AoT requires an exported function for factories

import * as PIXI from "pixi.js";

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.SORTABLE_CHILDREN = true;
import { ElectronService } from "./__core/services";
import { DragDropModule } from "@angular/cdk/drag-drop";

const isServer = ElectronService.isServer;
const domain = "localhost";

const cookieConfig: NgcCookieConsentConfig = {
  enabled: isServer,
  // autoOpen: isElectronApp,
  cookie: {
    domain: domain
  },
  palette: {
    popup: {
      background: "#000"
    },
    button: {
      background: "#f1d600"
    }
  },
  theme: "edgeless",
  type: "opt-out",
  content: {
    href: "#"
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

export function markedOptionsFactory(): MarkedOptions {
  const markedRenderer = new MarkedRenderer();

  markedRenderer.heading = (text: string, level: number) => {
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, "-");
    return `
<h${level}>
    <a class="anchor" href="#${escapedText}" id="${escapedText}">
        <span class="header-link"></span>
    </a> ${text}
</h${level}>`;
  };

  return {
    renderer: markedRenderer,
    headerIds: true,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false
  };
}

@NgModule({
  declarations: [
    AppComponent,

    DebugView,
    MultiplesViewsComponent,

    LayoutAdminComponent,
    LayoutAuthComponent,
    LayoutLandingComponent,

    LoginView,
    RegisterView,
    ForgotPasswordView,
    IndexView,
    LandingView,
    AboutView,

    CalculatorView,
    CodeView,
    ConfigView,
    DocsView,
    FileManagerView,
    EditorView,
    LoggerView,
    MemoryView,
    CycleClockDiagramView,
    PipelineView,
    ProfileView,
    RegistersView,
    StatisticsView
  ],
  imports: [

    CoreModule,
    SharedModule,
    ComponentsModule,

    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,

    AppRoutingModule,
    NgcCookieConsentModule.forRoot(cookieConfig),

    MarkdownModule.forRoot({
      sanitize:      SecurityContext.NONE,
      loader:        HttpClient,
      markedOptions: {
        provide:    MarkedOptions,
        useFactory: markedOptionsFactory
      }
    }),
    ToastrModule.forRoot(),
    // SocketIoModule.forRoot(CONFIG_WEBSOCKET),
    TranslateModule.forRoot({
      loader: {
        provide:    TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps:       [HttpClient]
      }
    }),
    // MonacoEditorModule,
    CovalentCodeEditorModule,


    DxToolbarModule,
    DxListModule,
    DxPopupModule,
    DxFileManagerModule,
    // use forRoot() in main app module only.

    BrowserAnimationsModule,
    AngularFireModule.initializeApp(AppConfig.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,

    MatSortModule,
    MatTableModule,
    ScrollingModule,
    TableVirtualScrollModule,
    DragDropModule
  ],
  providers: [
    // {
    //   provide: MONACO_PATH,
    //   useValue: 'https://unpkg.com/browse/monaco-editor@0.26.1/min/vs/'
    // },
    AppComponent,
    AuthGuard,
    NoAuthGuard,
    UtilityService,
    CookieService
    /*
        MachineService,
        {
          provide: APP_INITIALIZER,
          useFactory: Utils.initServicesFactory,
          deps: [MachineService],
          multi: true
        }
     */
  ],
  exports: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
