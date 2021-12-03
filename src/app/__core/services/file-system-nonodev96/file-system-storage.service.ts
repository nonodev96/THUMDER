import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { AngularFireDatabase, AngularFireList } from "@angular/fire/database";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { Utils } from "../../../Utils";
import { FileItem } from "./file-system.service";
import { InterfaceFileItem, InterfaceUser } from "../../../types";
import firebase from "firebase/app";
import "firebase/firestore";
import Timestamp = firebase.firestore.Timestamp;


@Injectable({
  providedIn: 'root'
})
export class FileSystemStorageService {
  private fileItems_Collections: AngularFirestoreCollection<InterfaceFileItem>;
  private readonly UID: string;

  constructor(private httpClient: HttpClient,
              private afs: AngularFirestore,
              private db: AngularFireDatabase) {
    const userData = JSON.parse(localStorage.getItem('user')) as InterfaceUser;
    this.UID = userData.uid;
    this.fileItems_Collections = this.afs.collection<InterfaceFileItem>('/fileitems', (ref) => {
      return ref.where("e1_uid", "==", this.UID);
    });
  }


  public async initialize(): Promise<number> {
    if (await this.isInitialize()) {
      return Promise.resolve(1);
    }
    console.log('FileSystem isInitialize');
    return Promise.resolve(0);
  }

  public async generateDefaultFiles(): Promise<number> {
    if (await this.isInitialize()) {
      return Promise.resolve(1);
    }
    const filename = 'prim.s';
    const defaultFileItem = new FileItem('', false, []);
    defaultFileItem.name = filename;
    defaultFileItem.key = Utils.uuidv4();

    const content = await this.httpClient.get('assets/examples-dlx/' + filename, {responseType: 'text'}).toPromise();
    const defaultInterfaceFileItem: InterfaceFileItem = {
      ...defaultFileItem,
      dateModified: Timestamp.fromDate(new Date()),
      e1_uid: this.UID,
      content: content,
      f_id: '',
      path: '',
      pathKeys: [],
      description: ''
    };
    console.debug("Se quiere crear un fichero con los siguientes datos %o", defaultInterfaceFileItem);
    await this.addFileItem(defaultInterfaceFileItem);
    return Promise.resolve(0);
  }

  public getInterfaceFileItems(): Observable<InterfaceFileItem[]> {
    return this.fileItems_Collections.snapshotChanges().pipe(
      map((changes) => {
        //  console.log(items)
        return changes.map((c) => {
          return {
            $key: c.payload.doc.id,
            ...c.payload.doc.data(),
          } as InterfaceFileItem;
        });
      })
    );
    //  return this.fileItems_Collections.valueChanges();
  }


  public async addFileItem(interfaceFileItem: InterfaceFileItem): Promise<void> {
    try {
      const clearItem: InterfaceFileItem = {
        key: interfaceFileItem.key ?? '',
        pathKeys: interfaceFileItem.pathKeys ?? [],
        path: interfaceFileItem.path ?? '',
        name: interfaceFileItem.name ?? '',
        isDirectory: interfaceFileItem.isDirectory ?? false,
        hasSubDirectories: interfaceFileItem.hasSubDirectories ?? false,
        dateModified: interfaceFileItem.dateModified ?? Timestamp.fromDate(new Date()),
        thumbnail: interfaceFileItem.thumbnail ?? '',
        size: interfaceFileItem.size ?? 0,
        dataItem: interfaceFileItem.dataItem ?? {},

        e1_uid: this.UID,
        f_id: interfaceFileItem.f_id ?? '',
        description: interfaceFileItem.description ?? '',
        content: interfaceFileItem.content ?? ''
      };
      const id = this.afs.createId();
      console.log("El nuevo fichero con ID", id, clearItem);
      await this.fileItems_Collections.doc(id).set(clearItem, {merge: true});
    } catch (error) {
      console.error(error);
    }
    return Promise.resolve();
  }

  public async deleteFileItem(id: string): Promise<void> {
    try {
      console.debug("Se va a borrar en el servidor el documento con ID %s", id);
      const result = await this.fileItems_Collections.doc(id).delete();
      return Promise.resolve(result);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
  }

  public async editFileItem(fileItem: InterfaceFileItem, $key: string): Promise<void> {
    try {
      const id = $key ?? this.afs.createId();
      const data = {$key: id, ...fileItem};
      const result_void = await this.fileItems_Collections.doc(id).set(data);
      return Promise.resolve(result_void);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
  }

  private async isInitialize(): Promise<boolean> {
    const citiesRef: AngularFirestoreCollection<InterfaceFileItem> = this.afs.collection('/fileitems', ref => ref.where('e1_uid', '==', this.UID));
    const vector = await citiesRef.get().toPromise();
    return Promise.resolve(vector.size > 0);
  }
}
