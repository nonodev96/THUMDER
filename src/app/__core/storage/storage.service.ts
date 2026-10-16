import { Injectable } from "@angular/core";
import { DEFAULT_BREAKPOINTS, DEFAULT_INTERFACE_FILE_ITEM, DEFAULT_LANG } from "@app/CONSTANTS";
import { type Observable, Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class StorageService {
  private storageSub = new Subject<string>();

  constructor() {
    this.defaultDataInStorage();
  }

  public watchStorage(): Observable<string> {
    return this.storageSub.asObservable();
  }

  public getItem(key: string): any {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  }

  public setItem(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
    this.storageSub.next(key);
  }

  public hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  public defaultDataInStorage(): void {
    // Spanish used to be saved as "sp", which is not a language code
    if (this.getItem("lang") === "sp") {
      this.setItem("lang", "es");
    }
    if (!this.hasItem("lang")) {
      this.setItem("lang", DEFAULT_LANG);
    }
    if (!this.hasItem("interfaceFileItem")) {
      this.setItem("interfaceFileItem", DEFAULT_INTERFACE_FILE_ITEM);
    }
    if (!this.hasItem("breakpoints")) {
      this.setItem("breakpoints", DEFAULT_BREAKPOINTS);
    }
    // The configuration (thumder_configuration) is in ConfigService (core/config)
  }
}
