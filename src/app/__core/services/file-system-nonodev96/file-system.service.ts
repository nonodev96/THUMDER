import { Injectable } from '@angular/core';
import { FileSystemStorageService } from './file-system-storage.service';
import FileSystemItem from 'devextreme/file_management/file_system_item';
import UploadInfo from 'devextreme/file_management/upload_info';
import { Utils } from '../../../Utils';
import { InterfaceFileItem } from "../../../types";
import firebase from "firebase/app";
import Timestamp = firebase.firestore.Timestamp;

export class FileItem extends FileSystemItem {

  constructor(path: string, isDirectory: boolean, pathKeys: Array<string>) {
    super(path, isDirectory, pathKeys);
  }
}

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {

  // disk: Map<string, FileItem[]>;
  public items: FileItem[] = [];
  public ITEMS: InterfaceFileItem[] = [];
  private readonly UID: string;

  constructor(private fileSystemStorageService: FileSystemStorageService) {
    const userData = JSON.parse(localStorage.getItem('user'));
    this.UID = userData.uid;
  }

  public async initialize(): Promise<boolean> {
    await this.fileSystemStorageService.initialize();
    this.fileSystemStorageService.getInterfaceFileItems().subscribe((items) => {
      this.ITEMS = items;
      this.items = Utils.MAP_InterfaceFileItemArray_TO_FileItemArray(this.ITEMS);
    });
    return Promise.resolve(true);
  }

  public async getItems(path: FileSystemItem): Promise<Array<FileItem>> {
    const results = this.ITEMS.filter(value => Utils.arrayIsEqual(value.pathKeys, path.pathKeys));
    const fileItems = results.map((value) => {
      const item: FileItem = new FileItem('', false, []);
      item.key = value.key;
      item.dataItem = value.dataItem;
      item.pathKeys = value.pathKeys;
      item.path = value.path;
      item.name = value.name;
      item.isDirectory = value.isDirectory;
      item.hasSubDirectories = value.hasSubDirectories;
      item.size = value.size;
      item.thumbnail = value.thumbnail;
      return item;
    });
    return Promise.resolve(fileItems);
  }

  public async createDirectory(parentDirectory: FileSystemItem, name: string): Promise<FileItem> {
    const {path, pathKeys} = parentDirectory;
    const newDirectory = new FileSystemItem(path, true, pathKeys);
    newDirectory.name = name;
    newDirectory.key = Utils.uuidv4();

    // const elementsInDirectory = this.items.filter(value => Utils.arrayIsEqual(value.pathKeys, newDirectory.pathKeys));
    // const canCreate = elementsInDirectory.some(value => value.name === newDirectory.name);
    const canCreateFolder = true;
    if (canCreateFolder) {
      this.items.push(newDirectory);
      //const response = await this.tasksService.createNewFolder(path, newDirectory.name)
    }
    // resolve (canCreateFolder);
    return Promise.resolve(newDirectory);
  }

  public async createFile(item: FileSystemItem, extension: string): Promise<boolean> {
    try {
      const {path, pathKeys} = item;
      const newItem = new FileSystemItem(path, false, pathKeys);
      newItem.key = Utils.uuidv4();
      newItem.name = 'New file - ' + newItem.key + extension;
      const index = this.items.push(newItem);
      // return true if can insert
      if (index > -1) {
        const newFileItem: InterfaceFileItem = {
          key: newItem.key,
          path: newItem.path,
          pathKeys: newItem.pathKeys,
          name: newItem.name,
          isDirectory: false,
          hasSubDirectories: false,
          size: newItem.size,
          dateModified: Timestamp.fromDate(new Date()),
          thumbnail: newItem.thumbnail,
          dataItem: newItem.dataItem,

          e1_uid: this.UID,
          f_id: "",
          description: "",
          content: "",
        };
        await this.fileSystemStorageService.addFileItem(newFileItem);
        // const response = await this.tasksService.createNewFile(path, newItem.name)
      }
      return Promise.resolve(index > -1);
    } catch (e) {
      console.error(e);
      return Promise.reject(e);
    }
  }

  public async updateCategory(directory: FileSystemItem, selectedItems: FileSystemItem[], newCategory: any, viewArea: 'navPane' | 'itemView'): Promise<boolean> {
    let items;
    if (viewArea === 'navPane') {
      items = [directory];
    } else {
      items = selectedItems;
    }
    for (const item of items) {
      const index2 = this.ITEMS.findIndex(value => value.key === item.key);
      if (item.dataItem) {
        item.dataItem.category = newCategory;
        this.ITEMS[index2].dataItem.category = newCategory;
        const {$key} = this.ITEMS[index2];
        await this.fileSystemStorageService.editFileItem(this.ITEMS[index2], $key);
      }
    }

    return Promise.resolve(items.length > 0);
  }

  public async editFileItem(updateFileItem: InterfaceFileItem, $key: string): Promise<void> {
    const index1 = this.items.findIndex(value => value.key === updateFileItem.key);
    if (index1 > -1) {
      this.items[index1] = Utils.MAP_InterfaceFileItem_TO_FileItem(updateFileItem);
    }
    const index2 = this.ITEMS.findIndex(value => value.key === updateFileItem.key);
    if (index2 > -1) {
      this.ITEMS[index2] = updateFileItem;
    }
    const result_void = await this.fileSystemStorageService.editFileItem(updateFileItem, $key);
    return Promise.resolve(result_void);
  }

  public async renameItem(item: FileSystemItem, newName: string): Promise<FileItem> {
    const index1 = this.items.findIndex(value => value.key === item.key);
    this.items[index1].name = newName;
    this.items[index1].dateModified = new Date();

    const index2 = this.ITEMS.findIndex(value => value.key === item.key);
    this.ITEMS[index2].name = newName;
    this.ITEMS[index2].dateModified = Timestamp.fromDate(new Date());

    const {$key} = this.ITEMS[index2];
    await this.fileSystemStorageService.editFileItem(this.ITEMS[index2], $key);
    return Promise.resolve(item);
  }

  public async deleteItem(item: FileSystemItem): Promise<FileItem> {
    const index1 = this.items.findIndex(value => value.key === item.key);
    if (index1 > -1) {
      if (item.isDirectory) {
        const listElementsToDelete = this.items.filter(value => Utils.isSubset(value.pathKeys, item.pathKeys));
        for (const fileItemToDelete of listElementsToDelete) {
          const indexToDelete = this.items.findIndex(value => value.key === fileItemToDelete.key);
          this.items.splice(indexToDelete, 1);
        }
      }
      this.items.splice(index1, 1);

      const index2 = this.ITEMS.findIndex(value => value.key === item.key);
      if (item.isDirectory) {
        const listElementsToDelete = this.ITEMS.filter(value => Utils.isSubset(value.pathKeys, item.pathKeys));
        for (const fileItemToDelete of listElementsToDelete) {
          const indexToDelete2 = this.ITEMS.findIndex(value => value.key === fileItemToDelete.key);
          const {$key} = this.ITEMS[indexToDelete2];
          await this.fileSystemStorageService.deleteFileItem($key);
          this.ITEMS.splice(indexToDelete2, 1);
        }
      }
      this.ITEMS.splice(index2, 1);
    }
    return Promise.resolve(item);
  }

  public moveItem(item: FileSystemItem, destinationDirectory: FileSystemItem): PromiseLike<FileItem> | any {
    console.log('TODO', item, destinationDirectory);
  }

  public uploadFileChunk(fileData: File, uploadInfo: UploadInfo, destinationDirectory: FileSystemItem): PromiseLike<FileItem> | any {
    console.log('TODO', fileData, uploadInfo, destinationDirectory);
  }

  public downloadItem(items: Array<FileSystemItem>): void {
    console.log('TODO', items);
  }

}
