import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { AuthDirective } from "./directives/auth/auth.directive";
import { HexadecimalPipe } from "./pipes/numbers/hexadecimal.pipe";
import { LeftPadFilterPipe } from "./pipes/filter/LeftPadFilter.pipe";
import { BinaryPipe } from "./pipes/numbers/binary.pipe";
import { AsyncClickDirective } from './directives/async-await/async-click.directive';
import { AwaitClickDirective } from "./directives/async-await/await-click.directive";
import { RouterModule } from "@angular/router";

@NgModule({
    imports: [
        TranslateModule,
        CommonModule,
        FormsModule,
        RouterModule
    ],
  declarations: [
    PageNotFoundComponent,

    AsyncClickDirective,
    AwaitClickDirective,
    AuthDirective,
    WebviewDirective,

    LeftPadFilterPipe,
    BinaryPipe,
    HexadecimalPipe
  ],
  exports: [
    FormsModule,
    TranslateModule,

    PageNotFoundComponent,

    AsyncClickDirective,
    AwaitClickDirective,
    AuthDirective,
    WebviewDirective,

    LeftPadFilterPipe,
    BinaryPipe,
    HexadecimalPipe
  ]
})
export class SharedModule {
}
