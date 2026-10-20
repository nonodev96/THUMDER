import { DatePipe, DecimalPipe } from "@angular/common";
import { ChangeDetectorRef, Component, type ElementRef, inject, type OnDestroy, type OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { type NavigationExtras, Router } from "@angular/router";

import { AuthService } from "@core/auth/auth.service";
import { ExerciseService } from "@core/exercises/exercise.service";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { type BuiltinData, copyFolderOf, isBuiltin, isBuiltinPath } from "@core/services/file-system/builtin-files";
import { nameError } from "@core/services/file-system/file-names";
import {
  FileSystemItem,
  FileSystemService,
  IMPORT_EXTENSIONS,
  InvalidNameError,
  ReadOnlyError,
  type THUMDER_FileItem,
} from "@core/services/file-system/file-system.service";
import { FileSystemStorageService } from "@core/services/file-system/file-system-storage.service";
import { ToastService } from "@core/services/toast/toast.service";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { DropdownDirective } from "@shared/directives/bootstrap/dropdown.directive";
import { ModalDismissDirective, ModalService } from "@shared/directives/bootstrap/modal.directive";
import { download } from "@shared/utils/download";
import { Subscription } from "rxjs";

const NAME_MODAL = "fileManagerNameModal";
const DELETE_MODAL = "fileManagerDeleteModal";

/**
 * The file manager: the DLX programs of the person, in folders. They are kept in the browser and, with an account,
 * synchronised (FileSystemStorageService). Files can be imported (.s, .txt and .zip, with the button or dropping them
 * on the list) and downloaded (a .s, or a .zip with the folders). The folders of THUMDER (the examples and the guided
 * exercises) are always there, read only: their programs can be opened, downloaded and copied.
 */
@Component({
  selector: "view-file-manager",
  templateUrl: "./file-manager.view.html",
  styleUrls: ["./file-manager.view.scss"],
  imports: [DatePipe, DecimalPipe, FormsModule, TranslatePipe, DropdownDirective, ModalDismissDirective],
})
export class FileManagerView implements OnInit, OnDestroy {
  fileSystemService = inject(FileSystemService);
  storage = inject(FileSystemStorageService);
  authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private modals = inject(ModalService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  private exercises = inject(ExerciseService);
  private machine = inject(MachineService);

  @ViewChild("importInput") private importInput?: ElementRef<HTMLInputElement>;

  public show = false;
  public currentPath = "";
  public selectedItems: THUMDER_FileItem[] = [];
  public readonly accept = IMPORT_EXTENSIONS.join(",");

  /** The modal of the names: a new folder, or a rename of `renaming` */
  public nameValue = "";
  public nameMode: "folder" | "rename" = "folder";
  private renaming: THUMDER_FileItem | null = null;
  public toDelete: THUMDER_FileItem[] = [];

  // Drag & Drop state
  public draggingItem: THUMDER_FileItem | null = null;
  public dragOverFolderKey: string | null = null;
  public isExternalDragOver = false;
  private isDraggingInternal = false;

  private updateUISubscription = new Subscription();

  constructor() {
    this.updateUISubscription = this.fileSystemService.getUpdateUIObservable().subscribe(() => {
      // The selection keeps the items that are still there, with their new data
      this.selectedItems = this.selectedItems.flatMap((selected) =>
        this.fileSystemService.items.filter((item) => item.key === selected.key),
      );
      this.cdr.markForCheck();
    });
  }

  /** The folders of THUMDER first, then the folders and then the files, by name */
  get currentItems(): THUMDER_FileItem[] {
    return this.fileSystemService.items
      .filter((item) => item.path === this.currentPath)
      .sort(
        (a, b) =>
          Number(isBuiltin(b)) - Number(isBuiltin(a)) || Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name),
      );
  }

  /** Whether an item is of THUMDER (read only) */
  public isBuiltin(item: THUMDER_FileItem): boolean {
    return isBuiltin(item);
  }

  /** The folder shown is of THUMDER: nothing can be created in it */
  get readOnlyHere(): boolean {
    return isBuiltinPath(this.currentPath);
  }

  /** Where the copies of the programs of the folder shown go */
  get copyFolder(): string {
    return copyFolderOf(this.currentPath);
  }

  /** Something of THUMDER is selected: the selection cannot be renamed nor deleted */
  get builtinSelected(): boolean {
    return this.selectedItems.some((item) => isBuiltin(item));
  }

  get pathSegments(): string[] {
    return this.currentPath ? this.currentPath.split("/") : [];
  }

  ngOnInit(): void {
    this.fileSystemService
      .init()
      .catch((error) => logger.error(error))
      .finally(() => {
        this.show = true;
      });
  }

  ngOnDestroy(): void {
    this.updateUISubscription.unsubscribe();
  }

  private message(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(`FILE_MANAGER.${key}`, params);
  }

  private fail(error: unknown): void {
    logger.error(error);
    const text =
      error instanceof InvalidNameError
        ? this.message(`NAME_${error.reason}`)
        : error instanceof ReadOnlyError
          ? this.message("READ_ONLY_ERROR")
          : String(error);
    this.toast.error(text, this.message("ERROR"));
  }

  // ── Selection and navigation ─────────────────────────────────────────────────────────────────────────────────

  public isSelected(item: THUMDER_FileItem): boolean {
    return this.selectedItems.some((s) => s.key === item.key);
  }

  /** A click selects the row; with Ctrl (or ⌘) it adds it to the selection or takes it out */
  public onRowClick(item: THUMDER_FileItem, event?: MouseEvent | KeyboardEvent): void {
    if (event?.ctrlKey || event?.metaKey) {
      this.selectedItems = this.isSelected(item) ? this.selectedItems.filter((s) => s.key !== item.key) : [...this.selectedItems, item];
    } else {
      this.selectedItems = [item];
    }
  }

  /** The keys of a row: Enter opens it, F2 renames it and Delete deletes the selection */
  public onRowKeydown(event: KeyboardEvent, item: THUMDER_FileItem): void {
    if (event.key === "Enter") this.onItemDoubleClick(item);
    else if (event.key === " ") this.onRowClick(item, event);
    else if (event.key === "F2") void this.askRename(item, event.currentTarget as HTMLElement);
    else if (event.key === "Delete")
      this.askDelete(this.isSelected(item) ? this.selectedItems : [item], event.currentTarget as HTMLElement);
    else return;
    event.preventDefault();
  }

  public onItemDoubleClick(item: THUMDER_FileItem): void {
    if (item.isDirectory) {
      this.currentPath = FileSystemService.join(this.currentPath, item.name);
      this.selectedItems = [];
    } else {
      this.openItem(item);
    }
  }

  public navigateTo(index: number): void {
    this.currentPath = index < 0 ? "" : this.pathSegments.slice(0, index + 1).join("/");
    this.selectedItems = [];
  }

  public async openItem(item: THUMDER_FileItem): Promise<void> {
    let interfaceFileItem = this.fileSystemService.items.find((value) => item.key === value.key);
    if (interfaceFileItem === undefined) return;
    // A program of the guided exercises: the exercise starts, with its statement and its configuration
    const exerciseId = isBuiltin(interfaceFileItem) ? (interfaceFileItem.dataItem as BuiltinData | null)?.exercise : undefined;
    if (exerciseId !== undefined) {
      try {
        const exercise = (await this.storage.fetchExercises()).find((value) => value.id === exerciseId);
        if (exercise !== undefined) {
          const english = (this.translate.getCurrentLang() ?? this.translate.getFallbackLang()) === "en";
          interfaceFileItem = await this.exercises.startGuided(exercise, english ? exercise.statement.en : exercise.statement.es);
          await this.machine.resetMachineStatus();
        }
      } catch (error) {
        this.fail(error);
        return;
      }
    }
    const extras: NavigationExtras = { state: { interfaceFileItem } };
    await this.router.navigateByUrl("/auth/editor", extras);
  }

  // ── New files and folders, rename and delete ─────────────────────────────────────────────────────────────────

  private get currentFolder(): FileSystemItem {
    return new FileSystemItem(this.currentPath, true, this.pathSegments);
  }

  public async createNewFile(extension: string): Promise<void> {
    try {
      const file = await this.fileSystemService.createFile(this.currentFolder, extension, this.message("NEW_FILE_NAME"));
      this.selectedItems = this.fileSystemService.items.filter((item) => item.key === file.key);
    } catch (error) {
      this.fail(error);
    }
  }

  public askNewFolder(opener: EventTarget | null): void {
    this.nameMode = "folder";
    this.renaming = null;
    this.nameValue = "";
    this.modals.open(NAME_MODAL, opener as HTMLElement | null);
  }

  public askRename(item: THUMDER_FileItem, opener: EventTarget | null): void {
    if (isBuiltin(item)) return;
    this.nameMode = "rename";
    this.renaming = item;
    this.nameValue = item.name;
    this.modals.open(NAME_MODAL, opener as HTMLElement | null);
  }

  /** What is wrong with the name being written, or null */
  get nameProblem(): string | null {
    const error = nameError(this.nameValue, this.fileSystemService.namesIn(this.currentPath, this.renaming?.key));
    // Writing the same name again is not a problem: nothing changes
    if (error === null || (this.renaming && this.nameValue.trim() === this.renaming.name)) return null;
    return this.message(`NAME_${error}`);
  }

  public async confirmName(): Promise<void> {
    if (this.nameProblem !== null) return;
    try {
      if (this.renaming) {
        if (this.nameValue.trim() !== this.renaming.name) await this.fileSystemService.renameItem(this.renaming, this.nameValue);
      } else {
        await this.fileSystemService.createDirectory(this.currentFolder, this.nameValue);
      }
      this.modals.close(NAME_MODAL);
    } catch (error) {
      this.fail(error);
    }
  }

  public askDelete(items: THUMDER_FileItem[], opener: EventTarget | null): void {
    if (items.length === 0 || items.some((item) => isBuiltin(item))) return;
    this.toDelete = [...items];
    this.modals.open(DELETE_MODAL, opener as HTMLElement | null);
  }

  public async confirmDelete(): Promise<void> {
    this.modals.close(DELETE_MODAL);
    try {
      for (const item of this.toDelete) await this.fileSystemService.deleteItem(item);
    } catch (error) {
      this.fail(error);
    }
    this.selectedItems = [];
    this.toDelete = [];
  }

  /** Copies a program or a folder of THUMDER to the files of the person, and shows where it went */
  public async copyToMine(item: THUMDER_FileItem): Promise<void> {
    try {
      const folder = await this.fileSystemService.copyToMine(item);
      this.toast.success(this.message("COPIED", { path: folder }), this.message("COPY_TO_MINE"));
    } catch (error) {
      this.fail(error);
    }
  }

  // ── Import and export ────────────────────────────────────────────────────────────────────────────────────────

  public chooseFiles(): void {
    this.importInput?.nativeElement.click();
  }

  public async onImportInput(input: HTMLInputElement): Promise<void> {
    await this.importFiles([...(input.files ?? [])]);
    // The same file can be chosen again
    input.value = "";
  }

  private async importFiles(files: File[]): Promise<void> {
    if (files.length === 0) return;
    try {
      const count = await this.fileSystemService.importFiles(files, this.currentPath);
      if (count === 0) this.toast.warning(this.message("IMPORT_NOTHING"), this.message("IMPORT"));
      else this.toast.success(this.message("IMPORT_DONE", { count }), this.message("IMPORT"));
    } catch (error) {
      this.fail(error);
    }
  }

  /** Downloads the items (one file as it is, several or a folder in a .zip; with none, everything) */
  public download(items: THUMDER_FileItem[]): void {
    const { name, blob } = this.fileSystemService.exportItems(items);
    download(name, blob);
  }

  // ── Drag & Drop (internal) ─────────────────────────────────────────────────────────────────────────────────────

  public onDragStart(event: DragEvent, item: THUMDER_FileItem): void {
    // What is of THUMDER does not move
    if (isBuiltin(item)) {
      event.preventDefault();
      return;
    }
    this.isDraggingInternal = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.key);
    }
    // The ghost of the drag is taken before the row changes
    requestAnimationFrame(() => {
      this.draggingItem = item;
      this.cdr.detectChanges();
    });
  }

  /** Whether the item being dragged can go into a folder (a folder cannot go inside itself) */
  private canDropInto(folder: FileSystemItem): boolean {
    if (!this.isDraggingInternal || !this.draggingItem || !folder.isDirectory || this.draggingItem.key === folder.key) return false;
    const target = FileSystemService.join(folder.path, folder.name);
    if (isBuiltinPath(target)) return false;
    const dragged = FileSystemService.join(this.draggingItem.path, this.draggingItem.name);
    return !(this.draggingItem.isDirectory && FileSystemService.isInside(target, dragged)) && this.draggingItem.path !== target;
  }

  public onDragOver(event: DragEvent, item: FileSystemItem): void {
    if (!this.canDropInto(item)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    this.dragOverFolderKey = item.key;
  }

  public onDragLeave(item: FileSystemItem): void {
    if (this.dragOverFolderKey === item.key) this.dragOverFolderKey = null;
  }

  public async onDrop(event: DragEvent, targetFolder: FileSystemItem): Promise<void> {
    if (!this.canDropInto(targetFolder) || !this.draggingItem) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      await this.fileSystemService.moveItem(this.draggingItem, targetFolder);
      this.selectedItems = [];
    } catch (error) {
      this.fail(error);
    } finally {
      this.onDragEnd();
    }
  }

  /** The folder of a part of the path (-1 is the root), to drop an item in a folder above */
  public segmentFolder(index: number): FileSystemItem {
    const folder = new FileSystemItem(index < 0 ? "" : this.pathSegments.slice(0, index).join("/"), true, []);
    folder.name = index < 0 ? "" : this.pathSegments[index];
    folder.key = `segment-${index}`;
    return folder;
  }

  public onDragEnd(): void {
    this.draggingItem = null;
    this.dragOverFolderKey = null;
    this.isDraggingInternal = false;
    this.cdr.detectChanges();
  }

  // ── Drag & Drop (files of the computer) ────────────────────────────────────────────────────────────────────────

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
    if (!target.contains(event.relatedTarget as Node)) this.isExternalDragOver = false;
  }

  public async onContainerDrop(event: DragEvent): Promise<void> {
    if (this.isDraggingInternal) return;
    event.preventDefault();
    this.isExternalDragOver = false;
    await this.importFiles([...(event.dataTransfer?.files ?? [])]);
  }
}
