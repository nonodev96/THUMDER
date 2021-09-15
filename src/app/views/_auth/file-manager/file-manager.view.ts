import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { DOCUMENT } from "@angular/common";
import { NavigationExtras, Router } from "@angular/router";
import { TasksService } from "../../../__core/services/tasks/tasks.service";
import { FileSystemService } from "../../../__core/services/file-system-nonodev96/file-system.service";
import { DxFileManagerComponent } from 'devextreme-angular';
import CustomFileSystemProvider from "devextreme/file_management/custom_provider";
import FileSystemItem from "devextreme/file_management/file_system_item";

export type FileItem = {
  name?: string,
  size?: number,
  dateModified?: string,
  thumbnail?: string,
  isDirectory?: boolean,
  hasSubDirectories?: boolean,
  items?: FileItem[]
}

export type FileMenuOptions = {
  items: {
    text: string,
    icon: string,
    items: {
      text: string,
      options: {
        extension: string
      }
    }[],
  }[]
  onItemClick: () => void
};

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.view.html',
  styleUrls: ['./file-manager.view.scss']
})
export class FileManagerView implements OnInit {
  @ViewChild(DxFileManagerComponent, {static: false})
  fileManager: DxFileManagerComponent;


  fileItems: FileSystemItem[] = [];
  newFileMenuOptions: FileMenuOptions;
  changeCategoryMenuOptions: FileMenuOptions;
  customFileProvider: CustomFileSystemProvider;

  constructor(@Inject(DOCUMENT)
              private document: Document,
              private router: Router,
              private tasksService: TasksService,
              private fileSystemService: FileSystemService) {
    this.newFileMenuOptions = {
      items: [
        {
          text: 'Create new file',
          icon: 'plus',
          items: [
            {
              text: 'WinDLX Document',
              options: {
                extension: '.s',
              }
            }
          ]
        }
      ],
      onItemClick: this.onContextMenuItemClick.bind(this)
    };
    this.changeCategoryMenuOptions = {
      items: [
        {
          text: 'Category',
          icon: 'tags',
          items: []
        }
      ],
      onItemClick: this.onContextMenuItemClick.bind(this)
    };
  }

  ngOnInit(): void {
    this.document.body.classList.add('login-page');

    this.fileSystemService.initialize().then((canInit) => {
      if (canInit) {
        this.customFileProvider = new CustomFileSystemProvider({
          getItems: (parentDirectory) => {
            return this.fileSystemService.getItems(parentDirectory);
          },
          createDirectory: (parentDirectory, name) => {
            return this.fileSystemService.createDirectory(parentDirectory, name);
          },
          renameItem: (item: FileSystemItem, name: string) => {
            return this.fileSystemService.renameItem(item, name);
          },
          deleteItem: (item: FileSystemItem) => {
            return this.fileSystemService.deleteItem(item);
          },
          moveItem: (item, destinationDirectory) => {
            return this.fileSystemService.moveItem(item, destinationDirectory);
          },
          uploadFileChunk: (fileData, uploadInfo, destinationDirectory) => {
            return this.fileSystemService.uploadFileChunk(fileData, uploadInfo, destinationDirectory);
          },
          downloadItems: (items) => {
            return this.fileSystemService.downloadItem(items);
          }
        });
      }
    });
  }

  onSelectedFileOpened($event: { file?: string }) {
    let extras: NavigationExtras = {
      state: {
        'file': $event.file
      }
    }
    this.router.navigateByUrl('/auth/ide', extras).then(r => {
      console.log(r)
    });
  }

  onContentReady($event) {
    console.log($event);
  }

  async onContextMenuItemClick($event) {
    const {itemData, viewArea, fileSystemItem} = $event
    let updated = false;
    const extension = itemData.options ? itemData.options.extension : undefined;
    const category = itemData.options ? itemData.options.category : undefined;

    const directory = fileSystemItem || this.fileManager.instance.getCurrentDirectory();
    if (extension) {
      updated = await this.fileSystemService.createFile(directory, extension);
    } else if (category !== undefined) {
      const selectedItems = this.fileManager.instance.getSelectedItems();
      updated = await this.fileSystemService.updateCategory(directory, selectedItems, category, viewArea);
    }
    if (updated) {
      this.fileManager.instance.refresh().then(() => {
      });
    }
  }

  height(): number | Function | string {
    return window.innerHeight / 1.25;
  }

  log() {
    console.log(this.fileItems)
  }

  debug() {
    this.tasksService.debug()
  }
}