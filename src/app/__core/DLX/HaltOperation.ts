import { Operation } from "@core/DLX/interfaces";

export class HaltOperation extends Operation {
  public constructor(name: string) {
    super(name);
  }
}
