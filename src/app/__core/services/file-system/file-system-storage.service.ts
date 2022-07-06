import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  Firestore,
  query,
  where,
  doc,
  // getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  // onSnapshot,
  // onSnapshotsInSync,
  // for valueChanges and snapShotChanges
  // docSnapshots,
  collectionChanges,
  collectionData,
  // docData,
  Query,
  DocumentData,
  DocumentChange,
  // DocumentSnapshot,
  CollectionReference,
  // DocumentReference,
  QuerySnapshot
} from "@angular/fire/firestore";

import { THUMDER_FileItem } from "./file-system.service";
import { Utils } from "../../../Utils";
import { InterfaceUser } from "../../../Types";

@Injectable({
  providedIn: "root"
})
export class FileSystemStorageService {

  private readonly dbFileItemsPath = "/fileitems";

  // https://dev.to/jdgamble555/angular-12-with-firebase-9-49a0
  constructor(private httpClient: HttpClient,
              private afs: Firestore) {
  }

  // TODO
  public async isInitialize(): Promise<boolean> {
    const documents = await getDocs(this.queryAllFilesFromUser());
    return Promise.resolve(documents.size > 0);
  }

  public async generateDefaultFiles(): Promise<number> {
    if (await this.isInitialize()) {
      return Promise.resolve(1);
    }
    const files = ["prim.s", "win-dlx.s"];
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    for (const filename of files) {
      const defaultFileItem = new THUMDER_FileItem("", false, []);
      defaultFileItem.name = filename;
      defaultFileItem.key = Utils.uuidv4();
      defaultFileItem.e1_uid = userData.uid;
      defaultFileItem.dateModified = new Date();
      defaultFileItem.content = await this.httpClient.get("assets/examples-dlx/" + filename, { responseType: "text" }).toPromise();
      await this.createFileItem(defaultFileItem);
    }
    return Promise.resolve(0);
  }

  public queryFileFromUser(filename: string): Promise<QuerySnapshot<DocumentData>> {
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    return getDocs(query(
      collection(this.afs, this.dbFileItemsPath),
      where("e1_uid", "==", userData.uid),
      where("name", "==", filename)
    ));
  }

  private queryAllFilesFromUser(): Query<DocumentData> {
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    return query(
      collection(this.afs, this.dbFileItemsPath),
      where("e1_uid", "==", userData.uid),
    )
  }

  private collectionFileItems(): Promise<QuerySnapshot<DocumentData>> {
    return getDocs(this.queryAllFilesFromUser());
  }

  // Observable<InterfaceFileItem[]>
  public getAllFilesFromFirestoreAsObservable(): Observable<THUMDER_FileItem[]> {
    return this.FileItems_Collections_valueChanges().pipe(
      map((changes) => {
        const items = changes.map((interfaceFileItem) => {
          // const time = interfaceFileItem.dateModified as unknown as Timestamp;
          return {
            ...interfaceFileItem,
            // dateModified: new Timestamp(time.seconds, time.nanoseconds).toDate()
          } as unknown as THUMDER_FileItem;
        });
        return items.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
      })
    );
  }

  public async createFileItem(fileItem: THUMDER_FileItem): Promise<boolean> {
    try {
      const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
      const newDocument = this.createNewDocument();

      const { path, isDirectory, pathKeys } = fileItem;
      const thumderFileItem = new THUMDER_FileItem(path, isDirectory, pathKeys);
      thumderFileItem.$key = newDocument.id; // ID firebase doc

      thumderFileItem.e1_uid = userData.uid;
      thumderFileItem.content = fileItem.content ?? "";
      thumderFileItem.dataItem = fileItem.dataItem ?? "";
      thumderFileItem.dateModified = fileItem.dateModified ?? new Date();
      thumderFileItem.description = fileItem.description ?? "";
      thumderFileItem.f_id = fileItem.f_id ?? "";
      thumderFileItem.hasSubDirectories = fileItem.hasSubDirectories ?? false;
      thumderFileItem.isDirectory = fileItem.isDirectory ?? false;
      thumderFileItem.key = fileItem.key ?? "";
      thumderFileItem.name = fileItem.name ?? "";
      thumderFileItem.path = fileItem.path ?? "";
      thumderFileItem.pathKeys = fileItem.pathKeys ?? [];
      thumderFileItem.size = fileItem.size ?? 0;
      thumderFileItem.thumbnail = fileItem.thumbnail ?? "";

      console.log("New document in firestore with ID: %s, %o", thumderFileItem.$key, thumderFileItem);
      await setDoc(newDocument.ref, JSON.parse(JSON.stringify(thumderFileItem)), { merge: true })
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  }

  public async deleteFileItem($key: string): Promise<boolean> {
    await deleteDoc(doc(this.afs, this.dbFileItemsPath, $key));
    return Promise.resolve(true)
  }

  public async updateFileItem($key: string, fileItem: THUMDER_FileItem): Promise<boolean> {
    await updateDoc(doc(this.afs, this.dbFileItemsPath, $key), JSON.parse(JSON.stringify(fileItem)));
    return Promise.resolve(true)
  }
/*
  //  Documents
  public FileItem_Documents_valueChanges(id): Observable<THUMDER_FileItem> {
    return docData(
      doc(this.afs, this.dbFileItemsPath, id) as DocumentReference<THUMDER_FileItem>
    );
  }

  public FileItem_Documents_snapShotChanges(id): Observable<DocumentSnapshot<THUMDER_FileItem>> {
    return docSnapshots(
      doc(this.afs, id) as DocumentReference<THUMDER_FileItem>
    );
  }
*/
  // Collections
  public FileItems_Collections_valueChanges(): Observable<THUMDER_FileItem[]> {
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    return collectionData<THUMDER_FileItem>(
      query<THUMDER_FileItem>(
        collection(this.afs, this.dbFileItemsPath) as CollectionReference<THUMDER_FileItem>,
        where('e1_uid', '==', userData.uid)
      ), { idField: '$key' }
    );
  }

  public FileItems_Collections_snapShotChanges(): Observable<DocumentChange<THUMDER_FileItem>[]> {
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    return collectionChanges<THUMDER_FileItem>(
      query<THUMDER_FileItem>(
        collection(this.afs, this.dbFileItemsPath) as CollectionReference<THUMDER_FileItem>,
        where('e1_uid', '==', userData.uid)
      )
    );
  }

  public createNewDocument() {
    const newDocument = doc(collection(this.afs, this.dbFileItemsPath));
    return {
      ref: newDocument,
      id:  newDocument.id
    };
  }

  public async getAllFilesFromFirestore(): Promise<QuerySnapshot<THUMDER_FileItem>> {
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    return getDocs<THUMDER_FileItem>(
      query<THUMDER_FileItem>(
        collection(this.afs, this.dbFileItemsPath) as CollectionReference<THUMDER_FileItem>,
        where('e1_uid', '==', userData.uid)
      )
    );
  }

  public async getFiles(): Promise<THUMDER_FileItem[]> {
    const files: THUMDER_FileItem[] = [];
    const userData = JSON.parse(localStorage.getItem("user")) as InterfaceUser;
    const q = query<THUMDER_FileItem>(
      collection(this.afs, this.dbFileItemsPath) as CollectionReference<THUMDER_FileItem>,
      where("e1_uid", "==", userData.uid)
    );
    const querySnapshot = await getDocs<THUMDER_FileItem>(q);
    querySnapshot.forEach((doc) => {
      files.push(doc.data());
    });
    return files;
  }
}

// update file
// delete file
// create file
// async data
// generate 2 files by default
