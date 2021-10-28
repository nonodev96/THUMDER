import { Injectable } from '@angular/core';
import { Observable, Subject } from "rxjs";
import {
  DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION,
  DEFAULT_LANG,
  DEFAULT_MEMORY_SIZE
} from "../../CONSTAST";

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    this.defaultDataInStorage();
  }

  private storageSub = new Subject<string>();

  watchStorage(): Observable<string> {
    return this.storageSub.asObservable();
  }

  getItem(key: string): any {
    return JSON.parse(localStorage.getItem(key));
  }

  setItem(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
    this.storageSub.next(key);
  }

  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  defaultDataInStorage() {
    if (!this.hasItem('lang')) {
      this.setItem('lang', DEFAULT_LANG)
    }
    if (!this.hasItem('memory_size')) {
      this.setItem('memory_size', DEFAULT_MEMORY_SIZE)
    }
    if (!this.hasItem('floating_point_stage_configuration')) {
      this.setItem('floating_point_stage_configuration', DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION)
    }
  }
}
