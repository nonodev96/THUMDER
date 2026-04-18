import { DOCUMENT } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, NgZone, type OnDestroy, type OnInit } from "@angular/core";
import { type NavigationExtras, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { type THUMDER_FileItem, FileSystemItem, FileSystemService } from "@core/services/file-system/file-system.service";

@Component({
  selector: "view-file-manager",
  templateUrl: "./file-manager.view.html",
  styleUrls: ["./file-manager.view.scss"],
  standalone: false,
})
export class FileManagerView implements OnInit, OnDestroy {
  public show: boolean = false;
  public showUID: boolean = false;
  public currentPath: string = "";
  public selectedItems: THUMDER_FileItem[] = [];
  public displayedColumns = ["icon", "name", "dateModified", "actions"];

  // Drag & Drop state
  public draggingItem: THUMDER_FileItem | null = null;
  public dragOverFolderKey: string | null = null;
  public isExternalDragOver = false;
  private isDraggingInternal = false;

  private updateUISubscription: Subscription = new Subscription();

  constructor(
    @Inject(DOCUMENT)
    private _document: Document,
    public fileSystemService: FileSystemService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    this.updateUISubscription = this.fileSystemService.getUpdateUIObservable().subscribe(() => {
      // Items update reactively via fileSystemService.items
    });
  }

  get currentItems(): THUMDER_FileItem[] {
    return this.fileSystemService.items.filter((item) => item.path === this.currentPath);
  }

  get pathSegments(): string[] {
    return this.currentPath ? this.currentPath.split("/") : [];
  }

  get filesSelected(): string[] {
    return this.selectedItems.map((v) => v.name);
  }

  public trackByKey(_index: number, item: THUMDER_FileItem): string {
    return item.key;
  }

  ngOnInit(): void {
    this.fileSystemService.init().then(() => {
      this.show = true;
    });
  }

  ngOnDestroy(): void {
    this.show = false;
    this.updateUISubscription.unsubscribe();
  }

  public async updateUI(): Promise<void> {
    return Promise.resolve();
  }

  public async generateDefaultFiles(): Promise<void> {
    try {
      const code = await this.fileSystemService.fileSystemStorageService.generateDefaultFiles(true);
      if (code === 0) {
        console.log("[FileManager] Default files generated successfully");
        alert("Default files generated successfully.");
      } else {
        console.log("[FileManager] Default files already existed, skipped.");
        alert("Default files already existed — skipped.");
      }
    } catch (error) {
      console.error("[FileManager] Error generating default files:", error);
      alert(`Error generating default files: ${error}`);
    }
    return Promise.resolve();
  }

  public isSelected(item: THUMDER_FileItem): boolean {
    return this.selectedItems.some((s) => s.key === item.key);
  }

  public onRowClick(item: THUMDER_FileItem): void {
    const idx = this.selectedItems.findIndex((s) => s.key === item.key);
    if (idx > -1) {
      this.selectedItems.splice(idx, 1);
    } else {
      this.selectedItems = [item];
    }
  }

  public onItemDoubleClick(item: THUMDER_FileItem): void {
    if (item.isDirectory) {
      this.currentPath = this.currentPath ? `${this.currentPath}/${item.name}` : item.name;
      this.selectedItems = [];
    } else {
      this.openItem(item);
    }
  }

  public navigateTo(index: number): void {
    if (index < 0) {
      this.currentPath = "";
    } else {
      this.currentPath = this.pathSegments.slice(0, index + 1).join("/");
    }
    this.selectedItems = [];
  }

  public openItem(item: THUMDER_FileItem): void {
    const index = this.fileSystemService.items.findIndex((value) => item.key === value.key);
    if (index > -1) {
      const interfaceFileItem = this.fileSystemService.items[index];
      const extras: NavigationExtras = { state: { interfaceFileItem } };
      this.router.navigateByUrl("/auth/editor", extras).then(() => {});
    }
  }

  public async createNewFile(extension: string): Promise<void> {
    const dir = new FileSystemItem(this.currentPath, true, this.pathSegments);
    await this.fileSystemService.createFile(dir, extension);
  }

  public async createNewDirectory(): Promise<void> {
    const name = prompt("Directory name:");
    if (!name) return;
    const parent = new FileSystemItem(this.currentPath, true, this.pathSegments);
    await this.fileSystemService.createDirectory(parent, name);
  }

  public async renameItem(item: THUMDER_FileItem): Promise<void> {
    const newName = prompt("New name:", item.name);
    if (!newName || newName === item.name) return;
    await this.fileSystemService.renameItem(item, newName);
  }

  public async renameSelected(): Promise<void> {
    if (this.selectedItems.length !== 1) return;
    await this.renameItem(this.selectedItems[0]);
  }

  public async deleteItem(item: THUMDER_FileItem): Promise<void> {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await this.fileSystemService.deleteItem(item);
    this.selectedItems = this.selectedItems.filter((s) => s.key !== item.key);
  }

  public async deleteSelected(): Promise<void> {
    for (const item of [...this.selectedItems]) {
      await this.deleteItem(item);
    }
  }

  // ── Drag & Drop (internal) ──────────────────────────────────────────────────

  public onDragStart(event: DragEvent, item: THUMDER_FileItem): void {
    this.isDraggingInternal = true;
    event.dataTransfer!.effectAllowed = "move";
    event.dataTransfer!.setData("text/plain", item.key);
    // Delay draggingItem assignment so the drag ghost is captured BEFORE any re-render
    requestAnimationFrame(() => {
      this.draggingItem = item;
      this.cdr.detectChanges();
    });
  }

  public onDragOver(event: DragEvent, item: THUMDER_FileItem): void {
    // Called outside Angular zone (registered in ngAfterViewInit)
    if (!this.isDraggingInternal) return;
    if (!item.isDirectory) return;
    if (this.draggingItem?.key === item.key) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
    if (this.dragOverFolderKey !== item.key) {
      this.dragOverFolderKey = item.key;
      this.cdr.detectChanges();
    }
  }

  public onDragLeave(_event: DragEvent, item: THUMDER_FileItem): void {
    if (this.dragOverFolderKey === item.key) {
      this.dragOverFolderKey = null;
      this.cdr.detectChanges();
    }
  }

  public async onDrop(event: DragEvent, targetFolder: THUMDER_FileItem): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverFolderKey = null;
    if (!this.draggingItem || !targetFolder.isDirectory) return;
    if (this.draggingItem.key === targetFolder.key) return;
    await this.fileSystemService.moveItem(this.draggingItem, targetFolder);
    this.selectedItems = [];
    this.draggingItem = null;
    this.isDraggingInternal = false;
    this.cdr.detectChanges();
  }

  public onDragEnd(): void {
    this.draggingItem = null;
    this.dragOverFolderKey = null;
    this.isDraggingInternal = false;
    this.cdr.detectChanges();
  }

  // ── Drag & Drop (external files from OS) ───────────────────────────────────

  public onContainerDragOver(event: DragEvent): void {
    if (this.isDraggingInternal) return;
    if (event.dataTransfer?.types.includes("Files")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      this.isExternalDragOver = true;
    }
  }

  public onContainerDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target.contains(event.relatedTarget as Node)) {
      this.isExternalDragOver = false;
    }
  }

  public async onContainerDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isExternalDragOver = false;
    if (this.isDraggingInternal) return;
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      await this.fileSystemService.importFile(files[i], this.currentPath);
    }
  }

  public height(): number {
    return window.innerHeight / 1.25;
  }
}
