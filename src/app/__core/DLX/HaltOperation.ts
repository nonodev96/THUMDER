import { Operation } from "./interfaces";

export class HaltOperation extends Operation {
  constructor(name: string) {
    super(name);
  }
}
