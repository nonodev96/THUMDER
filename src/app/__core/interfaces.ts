export class Int32 {
  private _value: number;

  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    if (newValue < -2147483648 || newValue > 2147483647 || Math.round(newValue) !== newValue) throw new Error("Rango no permitido");
    this._value = newValue;
  }
}

export class Float32 {
  private _value: number;

  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    if (newValue < -3.4e38 || newValue > +3.4e38 || Math.round(newValue) !== newValue) throw new Error("Rango no permitido");
    this._value = newValue;
  }
}

export class Double64 {
  private _value: number;

  get value(): number {
    return this._value;
  }

  set value(newValue: number) {
    if (newValue < -1.7E+308 || newValue > +1.7E+308 || Math.round(newValue) !== newValue) throw new Error("Rango no permitido");
    this._value = newValue;
  }
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
}
