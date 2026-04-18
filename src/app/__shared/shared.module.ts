import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { PageNotFoundComponent } from "@shared/components";
import { WebviewDirective } from "@shared/directives";
import { AsyncClickDirective } from "@shared/directives/async-await/async-click.directive";
import { AwaitClickDirective } from "@shared/directives/async-await/await-click.directive";
import { AuthDirective } from "@shared/directives/auth/auth.directive";
import { PadStartFilterPipe } from "@shared/pipes/filter/LeftPadFilter.pipe";
import { BinaryPipe } from "@shared/pipes/numbers/Binary.pipe";
import { Binary32ToASCIIPipe } from "@shared/pipes/numbers/Binary32ToASCII.pipe";
import { Binary32ToBytesPipe } from "@shared/pipes/numbers/Binary32ToBytes.pipe";
import { Binary32ToDecimal_IEEE754Pipe } from "@shared/pipes/numbers/Binary32ToDecimal_IEEE754.pipe";
import { Binary32ToHalfWordPipe } from "@shared/pipes/numbers/Binary32ToHalfWord.pipe";
import { Binary32ToWordPipe } from "@shared/pipes/numbers/Binary32ToWord.pipe";
import { Binary64ToDecimal_IEEE754Pipe } from "@shared/pipes/numbers/Binary64ToDecimal_IEEE754.pipe";
import { BinaryToHexadecimal_FormatPipe } from "@shared/pipes/numbers/BinaryToHexadecimal_Format.pipe";
import { BinaryByteToNumberPipe } from "@shared/pipes/numbers/BinaryToNumber.pipe";
import { FromBaseToBasePipe } from "@shared/pipes/numbers/FromBaseToBase.pipe";
import { NumberToBasePipe } from "@shared/pipes/numbers/NumberToBase.pipe";
import { NumberToBinary32_IEEE754Pipe } from "@shared/pipes/numbers/NumberToBinary32_IEEE754.pipe";
import { NumberToBinary64_IEEE754Pipe } from "@shared/pipes/numbers/NumberToBinary64_IEEE754.pipe";
import { NumberToHexadecimalPipe } from "@shared/pipes/numbers/NumberToHexadecimal.pipe";
import { PadStartPipe } from "@shared/pipes/numbers/PadStart.pipe";
import { ReplaceAllPipe } from "@shared/pipes/numbers/ReplaceAll.pipe";
import { Uint_IEEE754_32_Pipe } from "@shared/pipes/numbers/uint_IEEE754_32.pipe";
import { Uint_IEEE754_64_Pipe } from "@shared/pipes/numbers/uint_IEEE754_64.pipe";
import { ObjectsPipe } from "@shared/pipes/Objects/objects.pipe";

@NgModule({
  imports: [TranslateModule, CommonModule, FormsModule, RouterModule],
  declarations: [
    PageNotFoundComponent,

    AsyncClickDirective,
    AwaitClickDirective,
    AuthDirective,
    WebviewDirective,

    BinaryPipe,
    Binary32ToASCIIPipe,
    Binary32ToBytesPipe,
    Binary32ToWordPipe,
    Binary32ToHalfWordPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary64ToDecimal_IEEE754Pipe,
    NumberToBinary32_IEEE754Pipe,
    NumberToBinary64_IEEE754Pipe,
    NumberToHexadecimalPipe,
    PadStartFilterPipe,
    NumberToBasePipe,
    BinaryToHexadecimal_FormatPipe,
    FromBaseToBasePipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    PadStartPipe,
    ReplaceAllPipe,
    ObjectsPipe,
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
    Binary32ToWordPipe,
    Binary32ToHalfWordPipe,
    Binary32ToDecimal_IEEE754Pipe,
    Binary64ToDecimal_IEEE754Pipe,
    NumberToBinary32_IEEE754Pipe,
    NumberToBinary64_IEEE754Pipe,
    NumberToHexadecimalPipe,
    PadStartFilterPipe,
    NumberToBasePipe,
    BinaryToHexadecimal_FormatPipe,
    FromBaseToBasePipe,
    Uint_IEEE754_32_Pipe,
    Uint_IEEE754_64_Pipe,
    BinaryByteToNumberPipe,
    PadStartPipe,
    ReplaceAllPipe,
    ObjectsPipe,
  ],
})
export class SharedModule {}
