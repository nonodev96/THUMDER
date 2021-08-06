import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { AuthDirective } from "./directives/auth/auth.directive";
import { HexadecimalPipe } from "./pipes/numbers/hexadecimal.pipe";

@NgModule({
  declarations: [
    PageNotFoundComponent,
    WebviewDirective,
    AuthDirective,
    HexadecimalPipe
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule
  ],
  exports: [
    TranslateModule,
    WebviewDirective,
    FormsModule,
    HexadecimalPipe
  ]
})
export class SharedModule {
}
