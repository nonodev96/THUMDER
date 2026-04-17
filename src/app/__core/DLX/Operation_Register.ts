import { Operation } from "./interfaces";

export class Operation_Register extends Operation {
  private argumentSyntax = /^ *R(\d+) *, *R(\d+) *, *R(\d+) *$/;

  public constructor(name: string, _operation: (a: number, b: number) => number) {
    super(name);
  }

  public getArgumentSyntax(): RegExp {
    return this.argumentSyntax;
  }

  public getExpectedArgCount(): number {
    return 3;
  }
}
