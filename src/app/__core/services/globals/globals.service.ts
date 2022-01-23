import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class Globals {
  public showDebug: boolean = false;

  constructor() {
  }
}
