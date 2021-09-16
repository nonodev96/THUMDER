import 'reflect-metadata';
import '../polyfills';

import { RouterModule } from "@angular/router";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { ScrollingModule } from "@angular/cdk/scrolling";

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

// devextreme
import { DxFileManagerModule, DxListModule, DxPopupModule, DxToolbarModule } from "devextreme-angular";
// Monaco
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
// TOAST
import { ToastrModule } from "ngx-toastr";
// SOCKET
import { SocketIoModule } from "ngx-socket-io";
// NG-TABLE
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
// Cookies
import { CookieService } from "ngx-cookie-service";

// Services
import { UtilityService } from "./__core/utility.service";

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// MODULES
import { ComponentsModule } from "./components/components.module";
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './__core/core.module';

// APP
import { AppConfig } from '../environments/environment';
import { CONFIG_WEBSOCKET } from "./CONSTAST";
import { AppComponent } from './app.component';


import { SharedModule } from './__shared/shared.module';
import { AuthGuard } from './__shared/guard/auth.guard';
import { NoAuthGuard } from './__shared/guard/no-auth.guard';


// _layouts
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";

// _admin views
// _auth views
import { DocsView } from './views/_auth/docs/docs.view';
import { FileManagerView } from './views/_auth/file-manager/file-manager.view';
import { IDEView } from "./views/_auth/ide/ide.view";
import { CycleClockDiagramView } from "./views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";
import { PipelineView } from "./views/_auth/pixi-pipeline/pipeline.view";
import { ProfileView } from "./views/_auth/profile/profile.view";

// no _layouts views
import { DebugView } from './views/debug/debug-view';
import { ForgotPasswordView } from "./views/forgot-password/forgot-password.view";
import { LandingView } from "./views/landing/landing.view";
import { LoginView } from "./views/login/login.view";
import { RegisterView } from "./views/register/register.view";

// Index
import { IndexView } from "./views/_index/index.view";
import { RegistersView } from './views/_auth/registers/registers.view';
import { CodeView } from './views/_auth/code/code.view';
import { MachineService } from "./__core/machine/machine.service";
import { Utils } from "./Utils";
import { MemoryView } from './views/_auth/memory/memory.view';


// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}


@NgModule({
  declarations: [
    AppComponent,


    LayoutAdminComponent,
    LayoutAuthComponent,

    LoginView,
    RegisterView,
    ForgotPasswordView,
    IndexView,
    LandingView,


    CodeView,
    DocsView,
    FileManagerView,
    IDEView,
    MemoryView,
    CycleClockDiagramView,
    PipelineView,
    ProfileView,
    RegistersView,

    DebugView,
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

    ToastrModule.forRoot(),
    SocketIoModule.forRoot(CONFIG_WEBSOCKET),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MonacoEditorModule,


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
    TableVirtualScrollModule
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
    CookieService,
    MachineService,
    {
      provide: APP_INITIALIZER,
      useFactory: Utils.initServicesFactory,
      deps: [MachineService],
      multi: true
    }
  ],
  exports: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
