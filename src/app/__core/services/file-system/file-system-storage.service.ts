import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import firebase from "firebase/app";
import Timestamp = firebase.firestore.Timestamp;

import { Utils } from "../../../Utils";
import { THUMDER_FileItem } from "./file-system.service";
import { InterfaceFileItem, InterfaceUser } from "../../../Types";


@Injectable({
  providedIn: "root"
})
export class FileSystemStorageService {
  private fileItems_Collections: AngularFirestoreCollection<InterfaceFileItem>;
  private readonly UID: string = "";

  constructor(private httpClient: HttpClient,
              private afs: AngularFirestore) {
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    this.UID = userData.uid;
    this.fileItems_Collections = this.afs.collection<InterfaceFileItem>("/fileitems", (ref) => {
      return ref.where("e1_uid", "==", this.UID);
    });
  }

  public async generateDefaultFiles(): Promise<number> {
    if (await this.isInitialize()) {
      return Promise.resolve(1);
    }
    const files = [ "prim.s", "win-dlx.s" ];
    for (const filename of files) {
      const defaultFileItem = new THUMDER_FileItem("", false, []);
      defaultFileItem.name = filename;
      defaultFileItem.key = Utils.uuidv4();
      defaultFileItem.e1_uid = this.UID;
      defaultFileItem.dateModified = new Date();
      defaultFileItem.content = await this.httpClient.get("assets/examples-dlx/" + filename, { responseType: "text" }).toPromise();
      await this.addFileItem(defaultFileItem);
    }
    return Promise.resolve(0);
  }

  public getAllFilesFromFirestore(): Observable<InterfaceFileItem[]> {
    return this.fileItems_Collections.valueChanges([ "added", "removed", "modified" ]).pipe(
      map((changes) => {
        const items = changes.map((interfaceFileItem) => {
          const time = interfaceFileItem.dateModified as unknown as Timestamp;
          return {
            ...interfaceFileItem,
            dateModified: new Timestamp(time.seconds, time.nanoseconds).toDate()
          } as unknown as InterfaceFileItem;
        });
        return items.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
      })
    );
  }

  public getFileItemsAsObservable(): Observable<InterfaceFileItem[]> {
    return this.fileItems_Collections.snapshotChanges().pipe(
      map((changes) => {
        return changes.map((c) => {
          const time = c.payload.doc.data().dateModified as unknown as Timestamp;
          return {
            $key: c.payload.doc.id,
            ...c.payload.doc.data(),
            dateModified: new Timestamp(time.seconds, time.nanoseconds).toDate()
          } as unknown as InterfaceFileItem;
        });
      })
    );
  }

  public async addFileItem(fileItem: THUMDER_FileItem): Promise<THUMDER_FileItem> {
    try {
      const $key = this.afs.createId();
      const { path, isDirectory, pathKeys } = fileItem;
      const thumderFileItem = new THUMDER_FileItem(path, isDirectory, pathKeys);
      thumderFileItem.$key = $key;
      thumderFileItem.content = fileItem.content ?? "";
      thumderFileItem.dataItem = fileItem.dataItem ?? "";
      thumderFileItem.dateModified = fileItem.dateModified ?? new Date();
      thumderFileItem.description = fileItem.description ?? "";
      thumderFileItem.e1_uid = this.UID;
      thumderFileItem.f_id = fileItem.f_id ?? "";
      thumderFileItem.hasSubDirectories = fileItem.hasSubDirectories ?? false;
      thumderFileItem.isDirectory = fileItem.isDirectory ?? false;
      thumderFileItem.key = fileItem.key ?? "";
      thumderFileItem.name = fileItem.name ?? "";
      thumderFileItem.path = fileItem.path ?? "";
      thumderFileItem.pathKeys = fileItem.pathKeys ?? [];
      thumderFileItem.size = fileItem.size ?? 0;
      thumderFileItem.thumbnail = fileItem.thumbnail ?? "";

      const obj: InterfaceFileItem = {
        $key:              thumderFileItem.$key,
        content:           thumderFileItem.content,
        dataItem:          thumderFileItem.dataItem,
        dateModified:      thumderFileItem.dateModified,
        description:       thumderFileItem.description,
        e1_uid:            thumderFileItem.e1_uid,
        f_id:              thumderFileItem.f_id,
        hasSubDirectories: thumderFileItem.hasSubDirectories,
        isDirectory:       thumderFileItem.isDirectory,
        key:               thumderFileItem.key,
        name:              thumderFileItem.name,
        path:              thumderFileItem.path,
        pathKeys:          thumderFileItem.pathKeys,
        size:              thumderFileItem.size,
        thumbnail:         thumderFileItem.thumbnail,
      };

      console.log("New document in firestore with ID: %s, %o", $key, obj);
      await this.fileItems_Collections.doc($key).set(obj, { merge: true });
      return Promise.resolve(thumderFileItem);
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  }

  public async deleteFileItem($key: string): Promise<void> {
    try {
      console.debug("The document with ID will be deleted on firestore: %s", $key);
      await this.fileItems_Collections.doc($key).delete();
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
  }

  public async editFileItem(fileItem: THUMDER_FileItem, $key: string): Promise<void> {
    try {
      console.debug("Se va a editar en el servidor el documento con ID: %s", $key);
      const id = $key ?? this.afs.createId();
      const data = { $key: id, ...fileItem };
      const result_void = await this.fileItems_Collections.doc(id).set(data);
      return Promise.resolve(result_void);
    } catch (error) {
      console.error(error);
      return Promise.reject(error.message);
    }
  }

  public async isInitialize(): Promise<boolean> {
    const citiesRef: AngularFirestoreCollection<InterfaceFileItem> = this.afs.collection("/fileitems", ref => ref.where("e1_uid", "==", this.UID));
    const vector = await citiesRef.get().toPromise();
    return Promise.resolve(vector.size > 0);
  }
}
