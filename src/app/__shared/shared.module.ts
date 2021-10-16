import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { AuthDirective } from "./directives/auth/auth.directive";

import { RouterModule } from "@angular/router";

import { AsyncClickDirective } from './directives/async-await/async-click.directive';
import { AwaitClickDirective } from "./directives/async-await/await-click.directive";

import { BinaryPipe } from "./pipes/numbers/Binary.pipe";
import { Binary32ToASCIIPipe } from "./pipes/numbers/Binary32ToASCII.pipe";
import { Binary32ToBytesPipe } from "./pipes/numbers/Binary32ToBytes.pipe";
import { Binary32ToDecimal_IEEE754Pipe } from "./pipes/numbers/Binary32ToDecimal_IEEE754.pipe";
import { Binary32ToHalfWordPipe } from "./pipes/numbers/Binary32ToHalfWord.pipe";
import { Binary64ToDecimal_IEEE754Pipe } from "./pipes/numbers/Binary64ToDecimal_IEEE754.pipe";
import { NumberToBinary32_IEEE754Pipe } from "./pipes/numbers/NumberToBinary32_IEEE754.pipe";
import { NumberToBinary64_IEEE754Pipe } from "./pipes/numbers/NumberToBinary64_IEEE754.pipe";
import { NumberToHexadecimalPipe } from "./pipes/numbers/NumberToHexadecimal.pipe";
import { PadStartFilterPipe } from "./pipes/filter/LeftPadFilter.pipe";
import { NumberToBasePipe } from "./pipes/numbers/NumberToBase.pipe";
import { BinaryToHexadecimal_FormatPipe } from "./pipes/numbers/BinaryToHexadecimal_Format.pipe";
import { Uint_IEEE754_32_Pipe } from "./pipes/numbers/uint_IEEE754_32.pipe";
import { Uint_IEEE754_64_Pipe } from "./pipes/numbers/uint_IEEE754_64.pipe";
import { BinaryByteToNumberPipe } from "./pipes/numbers/BinaryToNumber.pipe";
import { PadStartPipe } from "./pipes/numbers/PadStart.pipe";
import { ReplaceAllPipe } from "./pipes/numbers/ReplaceAll.pipe";

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

    BinaryPipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary32ToHalfWordPipe,
    Binary64ToDecimal_IEEE754Pipe,
    NumberToBinary32_IEEE754Pipe,
    NumberToBinary64_IEEE754Pipe,
    NumberToHexadecimalPipe,
    PadStartFilterPipe,
    NumberToBasePipe,
    BinaryToHexadecimal_FormatPipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    PadStartPipe,
    ReplaceAllPipe
  ],
  exports: [
    FormsModule,
    TranslateModule,

    PageNotFoundComponent,

    AsyncClickDirective,
    AwaitClickDirective,
    AuthDirective,
    WebviewDirective,

    BinaryPipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary32ToHalfWordPipe,
    Binary64ToDecimal_IEEE754Pipe,
    NumberToBinary32_IEEE754Pipe,
    NumberToBinary64_IEEE754Pipe,
    NumberToHexadecimalPipe,
    PadStartFilterPipe,
    NumberToBasePipe,
    BinaryToHexadecimal_FormatPipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    PadStartPipe,
    ReplaceAllPipe
  ]
})
export class SharedModule {
}
