export class Int32 {
  // Se almacena en decimal, siempre
  private _binary: string = "";

  // get value(): number {
  //   return this._value;
  // }
  //
  // set value(newValue: number) {
  //   // if (newValue < 0 || newValue > 4294967295 || Math.round(newValue) !== newValue) throw new Error("Rango no permitido");
  //   this._value = newValue;
  //   this._binary = newValue.toString(2).padStart(32, '0');
  // }

  get binary(): string {
    return this._binary.padStart(32, '0');
  }

  set binary(newBinary: string) {
    this._binary = newBinary;
    // this._value = parseInt(newBinary, 2);
  }
}

export class Float32 {
  private _value: number = 0;
  private _binary: string = "";

  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    if (newValue < -3.4e38 || newValue > +3.4e38) throw new Error("Rango no permitido");
    this._value = newValue;
  }

  get binary(): string {
    return this._binary.padStart(32, '0');
  }

  set binary(newBinary: string) {
    this._binary = newBinary;
  }
}

export class Double64 {
  private _value: number = 0;
  private _binary: string = "";

  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    if (newValue < -1.7E+308 || newValue > +1.7E+308) throw new Error("Rango no permitido");
    this._value = newValue;
  }

  get binary(): string {
    return this._binary.padStart(64, '0');
  }

  set binary(newBinary: string) {
    this._binary = newBinary;
  }
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
}
