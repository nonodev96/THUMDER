import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { NavigationExtras, Router } from "@angular/router";
import { THUMDER_FileItem, FileSystemService } from "../../../__core/services/file-system/file-system.service";
import { DxFileManagerComponent } from "devextreme-angular";
import CustomFileSystemProvider from "devextreme/file_management/custom_provider";
import FileSystemItem from "devextreme/file_management/file_system_item";
import FileManager from "devextreme/ui/file_manager";
import { Subscription } from "rxjs";

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

export type TypeEventSelectedFileOpened = {
  file?: THUMDER_FileItem
};

export type TypeOnContextMenuItemClick = {
  component: FileManager,
  element: HTMLElement,
  event: Event,
  fileSystemItem: FileSystemItem,
  itemData: any,
  itemElement: HTMLElement,
  itemIndex: number,
  model: any,
  viewArea: "navPane" | "itemView",
};

export type TypeOnContentReady = {
  component: FileManager,
  element: HTMLElement,
  model: any
};

@Component({
  selector:    "view-file-manager",
  templateUrl: "./file-manager.view.html",
  styleUrls:   []
})
export class FileManagerView implements OnInit, OnDestroy {
  get filesSelected() {
    return this._filesSelected.map(v => v.name);
  }

  @ViewChild(DxFileManagerComponent, { static: false }) fileManager: DxFileManagerComponent;

  public customFileProvider: CustomFileSystemProvider;
  public newFileMenuOptions: FileMenuOptions = {
    items:       [{
      text:  "Create new file",
      icon:  "plus",
      items: [{ text: "WinDLX Document", options: { extension: ".s" } }]
    }],
    onItemClick: this.onContextMenuItemClick.bind(this)
  };
  public changeCategoryMenuOptions: FileMenuOptions = {
    items:       [ /*{ text: 'Category', icon: 'tags', items: [] }*/],
    onItemClick: this.onContextMenuItemClick.bind(this)
  };
  public show: boolean = false;
  public showUID: boolean = false;
  private _filesSelected: any[] = [];
  private updateUISubscription: Subscription = new Subscription();

  constructor(@Inject(DOCUMENT) private document: Document,
              public fileSystemService: FileSystemService,
              private router: Router) {
    this.updateUISubscription = this.fileSystemService.getUpdateUIObservable().subscribe(async () => {
      await this.updateUI();
    });
  }

  ngOnInit(): void {
    this.fileSystemService.init().then(() => {
      this.customFileProvider = new CustomFileSystemProvider({
        getItems:        async (parentDirectory) => {
          return await this.fileSystemService.getItems(parentDirectory);
        },
        createDirectory: async (parentDirectory, name) => {
          return await this.fileSystemService.createDirectory(parentDirectory, name);
        },
        renameItem:      async (item: FileSystemItem, name: string) => {
          return await this.fileSystemService.renameItem(item, name);
        },
        deleteItem:      async (item: FileSystemItem) => {
          return await this.fileSystemService.deleteItem(item);
        },
        moveItem:        async (item, destinationDirectory) => {
          return await this.fileSystemService.moveItem(item, destinationDirectory);
        },
        uploadFileChunk: async (fileData, uploadInfo, destinationDirectory) => {
          return await this.fileSystemService.uploadFileChunk(fileData, uploadInfo, destinationDirectory);
        },
        downloadItems:   async (items) => {
          return await this.fileSystemService.downloadItem(items);
        }
      });
    });
    this.show = true;
  }

  ngOnDestroy(): void {
    this.show = false;
    this.fileManager = null;
    this.customFileProvider = null;
    this.newFileMenuOptions = null;
    this.changeCategoryMenuOptions = null;
    this.updateUISubscription.unsubscribe();
  }

  public async updateUI(): Promise<void> {
    await this.fileManager.instance.refresh();
    return Promise.resolve();
  }

  public async generateDefaultFiles(): Promise<void> {
    const code = await this.fileSystemService.fileSystemStorageService.generateDefaultFiles();
    await this.updateUI();
    if (code === 0) {
      console.debug("Se han generado los ficheros por defecto");
    }
    if (code === 1) {
      console.debug("No se han generado los ficheros por defecto");
    }
    return Promise.resolve();
  }

  public onSelectedFileOpened($event: TypeEventSelectedFileOpened): void {
    const index = this.fileSystemService.items.findIndex(value => $event.file.key === value.key);
    if (index > -1) {
      const interfaceFileItem = this.fileSystemService.items[index];
      const extras: NavigationExtras = {
        state: {
          "interfaceFileItem": interfaceFileItem
        }
      };
      this.router.navigateByUrl("/auth/editor", extras).then(() => {
      });
    }
  }

  public onContentReady($event: TypeOnContentReady): void {
    console.log($event);
  }

  public async onContextMenuItemClick($event: TypeOnContextMenuItemClick): Promise<void> {
    const { itemData, viewArea, fileSystemItem } = $event;
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
      await this.fileManager.instance.refresh();
    }

    return Promise.resolve();
  }

  public onSelectionChanged(_$event: any) {
    this._filesSelected = this.fileManager.instance.getSelectedItems();
  }

  public height(): number | string {
    return window.innerHeight / 1.25;
  }

  public log(): void {
    console.log(this.fileSystemService.items);
  }

  public debug(): void {
    this.fileSystemService.fileSystemStorageService.collectionFileItems().valueChanges().subscribe((i) => {
      console.log(i);
    });
  }

  public async tests() {
    await this.fileSystemService.fileSystemStorageService.getAllFilesFromFirestoreAsObservable();
  }
}
