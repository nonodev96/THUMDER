import { Operation } from "./interfaces";

export class Operation_Register extends Operation {
  private argumentSyntax = /^ *R(\d+) *, *R(\d+) *, *R(\d+) *$/;
  private operation: (a: number, b: number) => number;

  public constructor(name: string, operation: (a: number, b: number) => number) {
    super(name);
    this.operation = operation;
  }

  public getArgumentSyntax(): RegExp {
    return this.argumentSyntax;
  }

  public getExpectedArgCount(): number {
    return 3;
  }
}
