import { Injectable } from "@angular/core";
import { Observable, Subject, Subscription } from "rxjs";
import FileSystemItem from "devextreme/file_management/file_system_item";
import UploadInfo from "devextreme/file_management/upload_info";
import { FileSystemStorageService } from "./file-system-storage.service";
import { InterfaceFileItem } from "../../../Types";
import { Utils } from "../../../Utils";

export class THUMDER_FileItem extends FileSystemItem implements InterfaceFileItem {
  $key: string;
  content: string;
  description: string;
  e1_uid: string;
  f_id: string;

  constructor(path: string, isDirectory: boolean, pathKeys: Array<string>) {
    super(path, isDirectory, pathKeys);
    this.$key = "";
    this.content = "";
    this.description = "";
    this.e1_uid = "";
    this.f_id = "";
  }
}

@Injectable({
  providedIn: "root"
})
export class FileSystemService {

  public items: THUMDER_FileItem[] = [];
  private updateUI$: Subject<void> = new Subject<void>();
  private subscription: Subscription = new Subscription();

  constructor(public fileSystemStorageService: FileSystemStorageService) {
  }

  public async init(): Promise<void> {
    await this.setList_FileItems(await this.fileSystemStorageService.getFiles());

    this.subscription = this.fileSystemStorageService.getAllFilesFromFirestoreAsObservable().subscribe(async (items) => {
      this.items = [];
      await this.setList_FileItems(items);
    });

    return Promise.resolve();
  }

  public getUpdateUIObservable(): Observable<void> {
    return this.updateUI$.asObservable();
  }

  public async getItems(path: FileSystemItem): Promise<Array<THUMDER_FileItem>> {
    await this.updateLocalItems();
    const results = this.items.filter(value => value.path === path.path);
    const fileItems = results.map((fileItem) => {
      const item: THUMDER_FileItem = new THUMDER_FileItem(fileItem.path, fileItem.isDirectory, fileItem.pathKeys);
      return Object.assign({}, item, fileItem);
    });
    return Promise.resolve(fileItems);
  }

  public async createDirectory(parentDirectory: FileSystemItem, name: string): Promise<THUMDER_FileItem> {
    const { path, pathKeys } = parentDirectory;
    const newDirectory = new THUMDER_FileItem(path, true, pathKeys);
    newDirectory.name = name;
    newDirectory.key = Utils.uuidv4();
    this.items.push(newDirectory);
    this.updateUI$.next();
    return Promise.resolve(newDirectory);
  }

  public async createFile(item: FileSystemItem, extension: string): Promise<boolean> {
    try {
      const { path, pathKeys } = item;
      const newItem = new THUMDER_FileItem(path, false, pathKeys);
      newItem.key = Utils.uuidv4();
      newItem.name = "New file - " + newItem.key + extension;
      await this.fileSystemStorageService.createFileItem(newItem);
      this.updateUI$.next();
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  public async updateCategory(directory: FileSystemItem, selectedItems: FileSystemItem[], newCategory: any, viewArea: "navPane" | "itemView"): Promise<boolean> {
    const items = (viewArea === "navPane") ? [directory] : selectedItems;
    for (const item of items) {
      const index = this.items.findIndex(value => value.key === item.key);
      if (item.dataItem) {
        item.dataItem.category = newCategory;
        this.items[index].dataItem.category = newCategory;
        const { $key } = this.items[index];
        await this.fileSystemStorageService.updateFileItem($key, this.items[index]);
      }
    }
    this.updateUI$.next();
    return Promise.resolve(items.length > 0);
  }

  public async editFileItem(updateFileItem: THUMDER_FileItem, $key: string): Promise<void> {
    const index = this.items.findIndex(value => value.key === updateFileItem.key);
    if (index > -1) {
      this.items[index] = FileSystemService.transform_InterfaceFileItem_to_THUMDER_FileItem(updateFileItem);

      this.items[index].dateModified = new Date();
      await this.fileSystemStorageService.updateFileItem($key, this.items[index]);
      this.updateUI$.next();
    }
    return Promise.resolve();
  }

  public async renameItem(item: FileSystemItem, newName: string): Promise<THUMDER_FileItem> {
    const index = this.items.findIndex(value => value.key === item.key);
    this.items[index].name = newName;
    this.items[index].dateModified = new Date();
    const { $key } = this.items[index];
    await this.fileSystemStorageService.updateFileItem($key, this.items[index]);
    this.updateUI$.next();
    return Promise.resolve(this.items[index]);
  }

  public async deleteItem(item: FileSystemItem): Promise<void> {
    const indexToDelete = this.items.findIndex(value => value.key === item.key);
    if (indexToDelete > -1) {
      const element = this.items.find(value => value.key === item.key);
      // Actualizamos this.items
      await this.fileSystemStorageService.deleteFileItem(element.$key);
      this.updateUI$.next();
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }

  // TODO
  public moveItem(item: FileSystemItem, destinationDirectory: FileSystemItem): Promise<THUMDER_FileItem | any> {
    console.debug("TODO", item, destinationDirectory);
    return Promise.resolve()
  }

  // TODO
  public async uploadFileChunk(fileData: File, uploadInfo: UploadInfo, destinationDirectory: FileSystemItem): Promise<THUMDER_FileItem | any> {
    console.debug("TODO", fileData, uploadInfo, destinationDirectory);
    return Promise.resolve()
  }

  // TODO
  public async downloadItem(items: Array<FileSystemItem>): Promise<void> {
    console.debug("TODO", items);
    return Promise.resolve()
  }

  private async setList_FileItems(items: THUMDER_FileItem[]): Promise<void> {
    // console.log({items: items})
    for (const item of items) {
      const { pathKeys, path, isDirectory }: THUMDER_FileItem = item;
      const thumderFileItem = new THUMDER_FileItem(path, isDirectory, pathKeys);
      const newItem = Object.assign({}, thumderFileItem, { ...item });
      // newItem.$key = $key;
      const index = this.items.findIndex(value => value.key === newItem.key);
      if (index > -1) {
        this.items[index] = newItem;
      } else
        this.items.push(newItem);
    }
    // console.log({this_items: this.items})
    this.updateUI$.next();
    return Promise.resolve();
  }

  private async updateLocalItems(): Promise<void> {
    await this.setList_FileItems(await this.fileSystemStorageService.getFiles());
    return Promise.resolve();
  }

  private static transform_InterfaceFileItem_to_THUMDER_FileItem(interfaceFileItem: InterfaceFileItem): THUMDER_FileItem {
    const file = new THUMDER_FileItem(
      interfaceFileItem.path,
      interfaceFileItem.isDirectory,
      interfaceFileItem.pathKeys
    );

    file.$key = interfaceFileItem.$key;
    file.f_id = interfaceFileItem.f_id;
    file.e1_uid = interfaceFileItem.e1_uid;
    file.key = interfaceFileItem.key;

    file.name = interfaceFileItem.name;
    file.content = interfaceFileItem.content;
    file.description = interfaceFileItem.description;
    file.dateModified = interfaceFileItem.dateModified;
    file.size = interfaceFileItem.size;
    file.isDirectory = interfaceFileItem.isDirectory;
    file.hasSubDirectories = interfaceFileItem.hasSubDirectories;
    file.thumbnail = interfaceFileItem.thumbnail;
    file.dataItem = interfaceFileItem.dataItem;
    return file;
  }
}
