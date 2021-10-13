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
import { DecimalToBasePipe } from "./pipes/numbers/decimalToBase.pipe";
import { Binary_IEEE754_32_Pipe } from "./pipes/numbers/binary_IEEE754_32.pipe";
import { Binary_IEEE754_64_Pipe } from "./pipes/numbers/binary_IEEE754_64.pipe";
import { Decimal_IEEE754_32_Pipe } from "./pipes/numbers/decimal_IEEE754_32.pipe";
import { Decimal_IEEE754_64_Pipe } from "./pipes/numbers/decimal_IEEE754_64.pipe";
import { Uint_IEEE754_32_Pipe } from "./pipes/numbers/uint_IEEE754_32.pipe";
import { Uint_IEEE754_64_Pipe } from "./pipes/numbers/uint_IEEE754_64.pipe";
import { BinaryByteToNumberPipe } from "./pipes/numbers/binaryByteToNumberPipe.pipe";
import { PadStartPipe } from "./pipes/numbers/padStart.pipe";
import { BinaryToHexPipe } from "./pipes/numbers/binaryToHex.pipe";
import { ReplaceAllPipe } from "./pipes/numbers/replaceAll.pipe";

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
    DecimalToBasePipe,
    BinaryPipe,
    Binary_IEEE754_32_Pipe,
    Binary_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    BinaryToHexPipe,
    Decimal_IEEE754_32_Pipe,
    Decimal_IEEE754_64_Pipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    PadStartPipe,
    ReplaceAllPipe,
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
    DecimalToBasePipe,
    BinaryPipe,
    Binary_IEEE754_32_Pipe,
    Binary_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    BinaryToHexPipe,
    Decimal_IEEE754_32_Pipe,
    Decimal_IEEE754_64_Pipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    PadStartPipe,
    ReplaceAllPipe,
    HexadecimalPipe
  ]
})
export class SharedModule {
}
