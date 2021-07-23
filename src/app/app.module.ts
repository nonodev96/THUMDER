import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './__core/core.module';
import { SharedModule } from './__shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { UtilityService } from "./__core/utility.service";

import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';


// _layouts
import { AdminComponent } from "./_layouts/admin/admin.component";
import { AuthComponent } from "./_layouts/auth/auth.component";

// _admin views

// _auth views
import { FileManagerComponent } from './views/_auth/file-manager/file-manager.component';
import { IDEComponent } from "./views/_auth/ide/ide.component";
import { ProfileComponent } from "./views/_auth/profile/profile.component";

// no _layouts views
import { LoginComponent } from "./views/login/login.component";
import { RegisterComponent } from "./views/register/register.component";
import { ForgotPasswordComponent } from "./views/forgot-password/forgot-passwordComponent";

// Index
import { IndexComponent } from "./views/_index/index.component";


import { LandingComponent } from "./views/landing/landing.component";

import { AdminNavbarComponent } from "./components/navbars/admin-navbar/admin-navbar.component";
import { AuthNavbarComponent } from "./components/navbars/auth-navbar/auth-navbar.component";
import { FooterAdminComponent } from "./components/footers/footer-admin/footer-admin.component";
import { FooterComponent } from "./components/footers/footer/footer.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";

import { PipelinePixiComponent } from './components/pipeline-pixi/pipeline-pixi.component';
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';
import { XtermComponent } from './components/xterm/xterm.component';

import { AsideLeftComponent } from './components/aside/aside-left/aside-left.component';
import { AsideRightComponent } from './components/aside/aside-right/aside-right.component';

import { DxFileManagerModule, DxListModule, DxPopupModule, DxToolbarModule } from "devextreme-angular";
import MonacoConfig from "../monaco-config";
import { DocsComponent } from './views/_auth/docs/docs.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,

    SidebarComponent,
    FooterComponent,
    FooterAdminComponent,

    AuthNavbarComponent,
    AdminNavbarComponent,

    AdminComponent,
    AuthComponent,

    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    IndexComponent,
    LandingComponent,
    ProfileComponent,

    IDEComponent,
    MonacoEditorComponent,
    PipelinePixiComponent,
    XtermComponent,
    FileManagerComponent,

    AsideLeftComponent,
    AsideRightComponent,
    DocsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,

    AppRoutingModule,
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
    DxFileManagerModule,
    DxPopupModule,
    // use forRoot() in main app module only.
  ],
  providers: [
    AppComponent,
    UtilityService,
  ],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
