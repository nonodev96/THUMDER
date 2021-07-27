import 'reflect-metadata';
import '../polyfills';

import { AppConfig } from '../environments/environment';
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { BrowserModule } from '@angular/platform-browser';

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { LayoutAdminComponent } from "./_layouts/admin/layout-admin.component";
import { LayoutAuthComponent } from "./_layouts/auth/layout-auth.component";

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


import { DxFileManagerModule, DxListModule, DxPopupModule, DxToolbarModule } from "devextreme-angular";
import MonacoConfig from "../monaco-config";
import { DocsComponent } from './views/_auth/docs/docs.component';
import { ComponentsModule } from "./components/components.module";

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,



    LayoutAdminComponent,
    LayoutAuthComponent,

    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    IndexComponent,
    LandingComponent,
    ProfileComponent,

    IDEComponent,

    FileManagerComponent,

    DocsComponent,
  ],
  imports: [

    CoreModule,
    SharedModule,
    ComponentsModule,


    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

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
    DxPopupModule,
    DxFileManagerModule,
    // use forRoot() in main app module only.

    AngularFireModule.initializeApp(AppConfig.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
  ],
  providers: [
    AppComponent,
    UtilityService,
  ],
  exports: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
