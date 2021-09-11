import 'reflect-metadata';
import '../polyfills';

import { AppConfig } from '../environments/environment';
import { RouterModule } from "@angular/router";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './__core/core.module';
import { SharedModule } from './__shared/shared.module';
import { AuthGuard } from './__shared/guard/auth.guard';

import { NoAuthGuard } from './__shared/guard/no-auth.guard';

import { AppRoutingModule } from './app-routing.module';
// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app.component';

import { ToastrModule } from "ngx-toastr";

import { MONACO_PATH, MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { UtilityService } from "./__core/utility.service";
// _layouts

import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";

import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";
// _admin views
// _auth views
import { FileManagerView } from './views/_auth/file-manager/file-manager.view';

import { IDEView } from "./views/_auth/ide/ide.view";
import { ProfileView } from "./views/_auth/profile/profile.view";
// no _layouts views
import { LoginView } from "./views/login/login.view";

import { RegisterView } from "./views/register/register.view";
import { ForgotPasswordView } from "./views/forgot-password/forgot-password.view";


// Index


import { IndexView } from "./views/_index/index.view";
import { LandingView } from "./views/landing/landing.view";
import { DxFileManagerModule, DxListModule, DxPopupModule, DxToolbarModule } from "devextreme-angular";
import { DocsView } from './views/_auth/docs/docs.view';
import { ComponentsModule } from "./components/components.module";
import { TableVirtualScrollModule } from "ng-table-virtual-scroll";
import { HexadecimalPipe } from "./__shared/pipes/numbers/hexadecimal.pipe";
// import { SocketProviderConnect } from "./__core/services/SocketProviderConnect";
import { CookieService } from "ngx-cookie-service";
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";
import { PipelineView } from "./views/_auth/pixi-pipeline/pipeline.view";
import { CycleClockDiagramView } from "./views/_auth/pixi-cycle-clock-diagram/cycle-clock-diagram.view";

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const socketIoConfig: SocketIoConfig = {
  url: 'http://localhost:3000',
  options: {
    transports: ['websocket']
  }
};


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
    ProfileView,

    IDEView,
    CycleClockDiagramView,
    PipelineView,

    FileManagerView,

    DocsView,
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
    SocketIoModule.forRoot(socketIoConfig),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MonacoEditorModule,
    TableVirtualScrollModule,


    DxToolbarModule,
    DxListModule,
    DxPopupModule,
    DxFileManagerModule,
    // use forRoot() in main app module only.

    BrowserAnimationsModule,
    AngularFireModule.initializeApp(AppConfig.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
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
    // SocketProviderConnect,
    CookieService
  ],
  exports: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
