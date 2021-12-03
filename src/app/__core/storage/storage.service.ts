import { Injectable } from '@angular/core';
import { Observable, Subject } from "rxjs";
import {
  DEFAULT_AUTO_SAVE,
  DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION, DEFAULT_INTERFACE_FILE_ITEM,
  DEFAULT_LANG,
  DEFAULT_MEMORY_SIZE, DEFAULT_MULTIVIEW_CONFIGURATION, DEFAULT_TIME_SIMULATION
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

  setItem(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
    this.storageSub.next(key);
  }

  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  defaultDataInStorage(): void {
    if (!this.hasItem('floating_point_stage_configuration')) {
      this.setItem('floating_point_stage_configuration', DEFAULT_FLOATING_POINT_STAGE_CONFIGURATION);
    }
    if (!this.hasItem('multiview_configuration')) {
      this.setItem('multiview_configuration', DEFAULT_MULTIVIEW_CONFIGURATION);
    }
    if (!this.hasItem('memory_size')) {
      this.setItem('memory_size', DEFAULT_MEMORY_SIZE);
    }
    if (!this.hasItem('time_simulation')) {
      this.setItem('time_simulation', DEFAULT_TIME_SIMULATION);
    }
    if (!this.hasItem('lang')) {
      this.setItem('lang', DEFAULT_LANG);
    }
    if (!this.hasItem('auto_save')) {
      this.setItem('auto_save', DEFAULT_AUTO_SAVE);
    }
    if (!this.hasItem('interfaceFileItem')) {
      this.setItem('interfaceFileItem', DEFAULT_INTERFACE_FILE_ITEM);
    }
  }
}
