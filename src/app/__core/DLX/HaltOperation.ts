import { Operation } from "./interfaces";

export class HaltOperation extends Operation {
  public constructor(name: string) {
    super(name);
  }
}
