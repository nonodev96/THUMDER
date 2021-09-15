import { Injectable } from '@angular/core';
import { FileSystemStorageService } from './file-system-storage.service';
import FileSystemItem from 'devextreme/file_management/file_system_item';
import UploadInfo from 'devextreme/file_management/upload_info';
import { Utils } from '../../../Utils';
import { SocketProviderConnectService } from "../socket-provider-connect.service";
import { TasksService } from "../tasks/tasks.service";

export class FileItem extends FileSystemItem {
  // items: FileItem[];

  constructor(path: string, isDirectory: boolean, pathKeys: Array<string>) {
    super(path, isDirectory, pathKeys);
    // this.items = [];
  }
}

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {

  // disk: Map<string, FileItem[]>;
  items: FileItem[] = [];

  constructor(private serviceStorage: FileSystemStorageService,
              private tasksService: TasksService) {
    const documents = new FileItem('', true, []);
    documents.name = 'Documents';
    documents.key = Utils.uuidv4();
    const pepe = new FileItem('', false, []);
    pepe.name = 'pepe.s';
    pepe.key = Utils.uuidv4();

    // this.disk = new Map<string, FileItem[]>();
    // this.disk.set('', [documents, pepe]);
    this.items = [documents];
  }

  initialize(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  getItems(path: FileSystemItem): PromiseLike<Array<FileItem>> | Array<any> {
    return new Promise(resolve => {
      const results = this.items.filter(value => Utils.arrayIsEqual(value.pathKeys, path.pathKeys));
      resolve(results);
    });
  }

  createDirectory(parentDirectory: FileSystemItem, name: string): PromiseLike<FileItem> | any {
    return new Promise(resolve => {
      const {path, pathKeys} = parentDirectory;
      const newDirectory = new FileSystemItem(path, true, pathKeys);
      newDirectory.name = name;
      newDirectory.key = Utils.uuidv4();

      // const elementsInDirectory = this.items.filter(value => Utils.arrayIsEqual(value.pathKeys, newDirectory.pathKeys));
      // const canCreate = elementsInDirectory.some(value => value.name === newDirectory.name);
      const canCreateFolder = true;
      if (canCreateFolder) {
        this.items.push(newDirectory);
      }
      // resolve (canCreateFolder);
      resolve(newDirectory);
    });
  }

  async createFile(item: FileSystemItem, extension: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const {path, pathKeys} = item;
      const newItem = new FileSystemItem(path, false, pathKeys);
      newItem.key = Utils.uuidv4();
      newItem.name = 'New file - ' + newItem.key + extension;
      const index = this.items.push(newItem);
      // return true if can insert
      if (index > -1) {
        const response = await this.tasksService.createNewFile()
      }
      resolve(index > -1);
    })
  }

  updateCategory(directory: FileSystemItem, selectedItems: FileSystemItem[], newCategory: any, viewArea: 'navPane' | 'itemView'): Promise<boolean> {
    return new Promise(resolve => {
      let items;
      if (viewArea === 'navPane') {
        items = [directory];
      } else {
        items = selectedItems;
      }
      items.forEach((item) => {
        if (item.dataItem) {
          item.dataItem.category = newCategory;
        }
      });

      resolve(items.length > 0);
    })
  }

  renameItem(item: FileSystemItem, name: string): PromiseLike<FileItem> | any {
    return new Promise(resolve => {
      const index = this.items.findIndex(value => value.key === item.key);
      this.items[index].name = name;
      resolve(item);
    });
  }

  deleteItem(item: FileSystemItem): PromiseLike<FileItem> | any {
    return new Promise(resolve => {
      const index = this.items.findIndex(value => value.key === item.key);
      if (index > -1) {
        if (item.isDirectory) {
          const listElementsToDelete = this.items.filter(value => Utils.isSubset(value.pathKeys, item.pathKeys));
          for (const fileItemToDelete of listElementsToDelete) {
            const indexToDelete = this.items.findIndex(value => value.key === fileItemToDelete.key);
            this.items.splice(indexToDelete, 1);
          }
        }
        this.items.splice(index, 1);
      }
      resolve(item);
    });
  }

  moveItem(item: FileSystemItem, destinationDirectory: FileSystemItem): PromiseLike<FileItem> | any {
    console.log('TODO', item, destinationDirectory);
  }

  uploadFileChunk(fileData: File, uploadInfo: UploadInfo, destinationDirectory: FileSystemItem): PromiseLike<FileItem> | any {
    console.log('TODO', fileData, uploadInfo, destinationDirectory);
  }

  downloadItem(items: Array<FileSystemItem>): void {
    console.log('TODO', items);
  }

  /*
  getItems(path: FileSystemItem): PromiseLike<Array<FileItem>> | Array<any> {
    return new Promise(resolve => {
      const result = this.disk.get(path.path);
      resolve(result);
    });
  }

  // DONE
  createDirectory(parentDirectory: FileSystemItem, name: string): PromiseLike<FileItem> | any {
    const {path, pathKeys} = parentDirectory;
    const newDirectory = new FileSystemItem(path, true, pathKeys);
    newDirectory.name = name;
    newDirectory.key = Utils.uuidv4();

    const canCreateFolder = !this.directoryExist(parentDirectory, newDirectory);
    if (canCreateFolder) {
      const elements = this.disk.get(parentDirectory.path) ?? [];
      elements.push(newDirectory);
      this.disk.set(parentDirectory.path, [...elements]);
    }

    return canCreateFolder;
  }

  // DONE
  createFile(directory: FileSystemItem, extension: any): boolean {
    if (!directory.isDirectory) {
      return false;
    }
    const {path, name, pathKeys} = directory;
    const newItem = new FileSystemItem(name, false, pathKeys);
    newItem.key = Utils.uuidv4();
    newItem.name = 'New file - ' + newItem.key + extension;

    const canCreateFile = !this.fileExist(directory, newItem);
    if (canCreateFile) {
      const elements = this.disk.get(path) ?? [];
      elements.push(newItem);
      this.disk.set(path, [...elements]);
    }
    return canCreateFile;
  }

  // DONE
  renameItem(currentDirectory: FileSystemItem, item: FileSystemItem, name: string): PromiseLike<FileItem> | any {
    const {path} = currentDirectory;

    const newItem = {...item} as FileSystemItem;
    newItem.name = name;

    if (item.isDirectory) {
      const canRenameFolder = !this.directoryExist(currentDirectory, newItem);
      if (canRenameFolder) {
        const elements = this.disk.get(path) ?? [];
        const indexElementToUpdate = elements.findIndex(value => value.key === item.key);
        elements[indexElementToUpdate] = newItem;
        this.disk.set(path, [...elements]);
      }
      return canRenameFolder;
    } else {
      const canRenameFile = !this.fileExist(currentDirectory, newItem);
      if (canRenameFile) {
        const elements = this.disk.get(path) ?? [];
        const indexElementToUpdate = elements.findIndex(value => value.key === item.key);
        elements[indexElementToUpdate] = newItem;
        this.disk.set(path, [...elements]);
      }
      return canRenameFile;
    }
  }

  // TODO
  updateCategory(fileSystemItem: FileSystemItem, category: any, viewArea: 'navPane' | 'itemView'): boolean {
    return false;
  }

  // DONE
  deleteItem(currentDirectory: FileSystemItem, item: FileSystemItem): PromiseLike<FileItem> | any {
    const {name} = currentDirectory;
    const path = name;

    if (item.isDirectory) {
      const canDeleteFolder = this.directoryExist(currentDirectory, item);
      if (canDeleteFolder) {
        const elements = this.disk.get(path) ?? [];
        const elementsFilter = elements.filter(value => value.key !== item.key);
        this.disk.set(path, [...elementsFilter]);
      }
      return canDeleteFolder;
    } else {
      const canDeleteFile = this.fileExist(currentDirectory, item);
      if (canDeleteFile) {
        const elements = this.disk.get(path) ?? [];
        const elementsFilter = elements.filter(value => value.key !== item.key);
        this.disk.set(path, [...elementsFilter]);
      }
      return canDeleteFile;
    }
  }

  moveItem(item: FileSystemItem, destinationDirectory: FileSystemItem): PromiseLike<FileItem> | any {
    console.log('TODO');
  }

  uploadFileChunk(fileData: File, uploadInfo: UploadInfo, destinationDirectory: FileSystemItem): PromiseLike<FileItem> | any {
    console.log('TODO');
  }

  downloadItem(items: Array<FileSystemItem>): void {
    console.log('TODO');
  }

  private directoryExist(parentDirectory: FileSystemItem, newDirectory: FileSystemItem): boolean {
    let exist = false;
    const elements = this.disk.get(parentDirectory.path) ?? [];
    for (const element of elements) {
      if (element.isDirectory && element.name === newDirectory.name) {
        exist = true;
      }
    }
    return exist;
  }

  private fileExist(parentDirectory: FileSystemItem, newDirectory: FileSystemItem): boolean {
    let exist = false;
    const elements = this.disk.get(parentDirectory.path) ?? [];
    for (const element of elements) {
      if (!element.isDirectory && element.name === newDirectory.name) {
        exist = true;
      }
    }
    return exist;
  }
  */
}
