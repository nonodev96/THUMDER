import { Component, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Ieee754Component } from "@components/ieee754/ieee754.component";
import { TranslatePipe } from "@ngx-translate/core";
import { CardDirective, CardWidgetDirective } from "../../../__shared/directives/card/card.directive";

@Component({
  selector: "view-calculator",
  templateUrl: "./calculator.view.html",
  styleUrls: [],
  imports: [CardDirective, CardWidgetDirective, FormsModule, TranslatePipe, Ieee754Component],
})
export class CalculatorView implements OnInit {
  private _valueByte: Uint8Array = new Uint8Array([0]);
  private _valueHalfWord: Uint16Array = new Uint16Array([0]);
  private _valueWord: Uint32Array = new Uint32Array([0]);
  private _valueIntWord: Int32Array = new Int32Array([0]);

  // region Byte
  get binary08_Value(): number {
    return parseInt(this._valueByte[0].toString(2), 2);
  }

  set binary08_Value(value: number) {
    this._valueByte[0] = value;
  }

  get binary08_Hexadecimal(): string {
    return parseInt(this._valueByte[0].toString(2), 2).toString(16).padStart(2, "0").toUpperCase();
  }

  set binary08_Hexadecimal(value: string) {
    this._valueByte[0] = parseInt(value, 16);
  }

  get binary08_Binary(): string {
    return this._valueByte[0].toString(2).padStart(8, "0");
  }

  set binary08_Binary(binary: string) {
    this._valueByte[0] = parseInt(binary, 2);
  }

  // endregion

  // ==================================================================================================================

  // region HalfWord
  get binary16_Value(): number {
    return parseInt(this._valueHalfWord[0].toString(2), 2);
  }

  set binary16_Value(value: number) {
    this._valueHalfWord[0] = value;
  }

  get binary16_Hexadecimal(): string {
    return parseInt(this._valueHalfWord[0].toString(2), 2).toString(16).padStart(4, "0").toUpperCase();
  }

  set binary16_Hexadecimal(value: string) {
    this._valueHalfWord[0] = parseInt(value, 16);
  }

  get binary16_Binary(): string {
    return this._valueHalfWord[0].toString(2).padStart(16, "0");
  }

  set binary16_Binary(binary: string) {
    this._valueHalfWord[0] = parseInt(binary, 2);
  }

  // endregion

  // ==================================================================================================================

  // region Word Uint
  get binary32_Value(): number {
    return parseInt(this._valueWord[0].toString(2), 2);
  }

  set binary32_Value(value: number) {
    this._valueWord[0] = value;
  }

  get binary32_Hexadecimal(): string {
    return parseInt(this._valueWord[0].toString(2), 2).toString(16).padStart(8, "0").toUpperCase();
  }

  set binary32_Hexadecimal(value: string) {
    this._valueWord[0] = parseInt(value, 16);
  }

  get binary32_Binary(): string {
    return this._valueWord[0].toString(2).padStart(32, "0");
  }

  set binary32_Binary(binary: string) {
    this._valueWord[0] = parseInt(binary, 2);
  }

  // endregion

  // ==================================================================================================================

  // region Word Int
  get binary32Int_Value(): number {
    return parseInt(this._valueIntWord[0].toString(2), 2);
  }

  set binary32Int_Value(value: number) {
    this._valueIntWord[0] = value;
  }

  get binary32Int_Hexadecimal(): string {
    return parseInt((this._valueIntWord[0] >>> 0).toString(2), 2)
      .toString(16)
      .padStart(8, "0")
      .toUpperCase();
  }

  set binary32Int_Hexadecimal(value: string) {
    this._valueIntWord[0] = parseInt(value, 16) >> 0;
  }

  get binary32Int_Binary(): string {
    return (this._valueIntWord[0] >>> 0).toString(2).padStart(32, "0");
  }

  set binary32Int_Binary(binary: string) {
    this._valueIntWord[0] = parseInt(binary, 2) >> 0;
  }

  // endregion

  // ==================================================================================================================

  ngOnInit(): void {}
}
