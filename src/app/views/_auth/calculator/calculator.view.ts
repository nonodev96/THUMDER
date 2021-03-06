import { Component, OnInit } from "@angular/core";
import { DEFAULT_BINARY_32_BITS, DEFAULT_BINARY_64_BITS } from "../../../CONSTANTS";
import { Utils } from "../../../Utils";

@Component({
  selector:    "view-calculator",
  templateUrl: "./calculator.view.html",
  styleUrls:   []
})
export class CalculatorView implements OnInit {

  private _valueByte: Uint8Array = new Uint8Array([ 0 ]);
  private _valueHalfWord: Uint16Array = new Uint16Array([ 0 ]);
  private _valueWord: Uint32Array = new Uint32Array([ 0 ]);
  private _valueIntWord: Int32Array = new Int32Array([ 0 ]);
  private _value32Float: string = DEFAULT_BINARY_32_BITS;
  private _value64Double: string = DEFAULT_BINARY_64_BITS;

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
    return parseInt((this._valueIntWord[0] >>> 0).toString(2), 2).toString(16).padStart(8, "0").toUpperCase();
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

  // region IEEE754 32 bits
  get binary32_IEEE754_Value(): number {
    return Utils.convertIEEE754_Binary32Bits_To_Number(this._value32Float);
  }

  set binary32_IEEE754_Value(value: number) {
    this._value32Float = Utils.convertIEEE754_Number_To_Binary32Bits(value);
  }

  get binary32_IEEE754_Hexadecimal(): string {
    return parseInt(this._value32Float, 2).toString(16).padStart(8, "0").toUpperCase();
  }

  set binary32_IEEE754_Hexadecimal(value: string) {
    this._value32Float = parseInt(value, 16).toString(2).padStart(32, "0");
  }

  get binary32_IEEE754_Binary(): string {
    return this._value32Float;
  }

  set binary32_IEEE754_Binary(binary: string) {
    this._value32Float = binary.padStart(32, "0");
  }

  // endregion

  // ==================================================================================================================

  // region IEEE754 32 bits
  get binary64_IEEE754_Value(): number {
    return Utils.convertIEEE754_Binary64Bits_To_Number(this._value64Double);
  }

  set binary64_IEEE754_Value(value: number) {
    this._value64Double = Utils.convertIEEE754_Number_To_Binary64Bits(value);
  }

  get binary64_IEEE754_Hexadecimal(): string {
    return parseInt(this._value64Double, 2).toString(16).padStart(16, "0").toUpperCase();
  }

  set binary64_IEEE754_Hexadecimal(value: string) {
    this._value64Double = parseInt(value, 16).toString(2).padStart(64, "0");
  }

  get binary64_IEEE754_Binary(): string {
    return this._value64Double;
  }

  set binary64_IEEE754_Binary(binary: string) {
    this._value64Double = binary.padStart(64, "0");
  }

  // endregion

  constructor() {
  }

  ngOnInit(): void {
  }

}
