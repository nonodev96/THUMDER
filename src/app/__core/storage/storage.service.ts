import { Injectable } from '@angular/core';
import { Observable, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
  }

  private storageSub = new Subject<string>();

  watchStorage(): Observable<any> {
    return this.storageSub.asObservable();
  }

  getItem(key: string): any {
    return localStorage.getItem(key);
  }

  setItem(key: string, data: any) {
    localStorage.setItem(key, data);
    this.storageSub.next(key);
  }
}
