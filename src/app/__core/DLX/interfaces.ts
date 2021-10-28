export interface InterfaceOperation {
  readonly name;
}

export abstract class Operation implements InterfaceOperation {
  private readonly _name;

  protected constructor(name: string) {
    this._name = name;
  }

  get name() {
    return this._name;
  }

}
