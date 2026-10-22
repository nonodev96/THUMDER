import { Injectable, inject } from "@angular/core";
import type { InterfaceFileItem } from "@app/Types";
import { defaultConfig, type ThumderConfig, validateConfig } from "@core/config/config";
import { ConfigService } from "@core/config/config.service";
import { exerciseKey } from "@core/services/file-system/builtin-files";
import { FileSystemItem, FileSystemService } from "@core/services/file-system/file-system.service";
import { StorageService } from "@core/storage/storage.service";
import type { Exercise } from "./exercises";
import type { Lockable, SharedExercise } from "./share";

/**
 * What an exercise locks in a file: the options and their values (storage: "exercise_locks", by the key of the file).
 * Locking the architecture locks the parameters of SuperDLX too (`superdlx`, missing in the locks made before it)
 */
export type ExerciseLock = {
  locked: Lockable[];
  values: Pick<ThumderConfig, Exclude<Lockable, "architecture">> & Partial<Pick<ThumderConfig, "architecture" | "superdlx">>;
  statement: string;
};

/** The values an exercise locks, from a configuration */
function lockValues(config: ThumderConfig): ExerciseLock["values"] {
  return {
    architecture: config.architecture,
    superdlx: structuredClone(config.superdlx),
    forwarding: config.forwarding,
    floatingPoint: config.floatingPoint,
    memorySize: config.memorySize,
  };
}

/** The folder of the shared exercises in the file manager */
export const SHARED_FOLDER = "compartidos";

/** How a guided exercise goes: its file and the answers written (storage: "exercise_progress", by exercise) */
export type ExerciseProgress = { fileKey: string; answers: Record<string, string>; checked: boolean };

/** The exercises shared by link (EDU-07) and the options they lock */
@Injectable({ providedIn: "root" })
export class ExerciseService {
  private storage = inject(StorageService);
  private config = inject(ConfigService);
  private fileSystem = inject(FileSystemService);

  private get locks(): Record<string, ExerciseLock> {
    return (this.storage.getItem("exercise_locks") as Record<string, ExerciseLock> | null) ?? {};
  }

  public lockOf(fileKey: string): ExerciseLock | null {
    return this.locks[fileKey] ?? null;
  }

  /** The lock of the file open in the editor */
  public currentLock(): ExerciseLock | null {
    const file = this.storage.getItem("interfaceFileItem") as InterfaceFileItem | null;
    return file?.key ? this.lockOf(file.key) : null;
  }

  /** The configuration for a file: the one saved, with the values its exercise locks */
  public configFor(fileKey: string | undefined, config: ThumderConfig = this.config.value()): ThumderConfig {
    const lock = fileKey ? this.lockOf(fileKey) : null;
    if (lock === null) return config;
    const locked: Partial<ThumderConfig> = Object.fromEntries(
      lock.locked.filter((key) => lock.values[key] !== undefined).map((key) => [key, lock.values[key]]),
    );
    if (lock.locked.includes("architecture") && lock.values.superdlx) locked.superdlx = lock.values.superdlx;
    return { ...config, ...locked };
  }

  public progress(): Record<string, ExerciseProgress> {
    return (this.storage.getItem("exercise_progress") as Record<string, ExerciseProgress> | null) ?? {};
  }

  public saveProgress(id: string, progress: ExerciseProgress): void {
    this.storage.setItem("exercise_progress", { ...this.progress(), [id]: progress });
  }

  /** A folder of the root, created if it is not there */
  private async folder(name: string): Promise<FileSystemItem> {
    if (!this.fileSystem.items.some((item) => item.isDirectory && item.path === "" && item.name === name)) {
      await this.fileSystem.createDirectory(new FileSystemItem("", true, []), name);
    }
    return new FileSystemItem(name, true, [name]);
  }

  /**
   * Starts (or goes on with) a guided exercise (EDU-04): its program of the folder "ejercicios" of THUMDER (or the copy
   * of it the person changed), its configuration saved and locked for its file, and its statement in the editor.
   * Returns the file, to open it in the editor
   */
  public async startGuided(exercise: Exercise, statement: string): Promise<InterfaceFileItem> {
    await this.fileSystem.init();
    const saved = this.progress()[exercise.id];
    let file: InterfaceFileItem | undefined = saved ? await this.fileSystem.find(saved.fileKey) : undefined;
    if (file === undefined) {
      file = await this.fileSystem.find(exerciseKey(exercise.id));
      if (file === undefined) throw new Error(`The program of the exercise ${exercise.id} could not be read`);
      this.saveProgress(exercise.id, { fileKey: file.key, answers: {}, checked: false });
    }
    const config = validateConfig({ ...defaultConfig(), ...exercise.config });
    // Its questions are about one architecture (DLX if it does not say): it is always locked
    const locked: Lockable[] = [
      "architecture",
      ...(Object.keys(exercise.config) as Lockable[]).filter((key) => ["forwarding", "floatingPoint", "memorySize"].includes(key)),
    ];
    const values = lockValues(config);
    // With SuperDLX, its machine too: the one of the exercise, or the one of WinSuperDLX
    this.config.update({
      ...Object.fromEntries(locked.map((key) => [key, values[key]])),
      ...(config.architecture === "superdlx" ? { superdlx: config.superdlx } : {}),
    });
    this.storage.setItem("exercise_locks", { ...this.locks, [file.key]: { locked, values, statement } });
    this.storage.setItem("interfaceFileItem", file);
    return file;
  }

  /**
   * A file of an exercise saved with another key (a program of THUMDER that was changed and went as a copy to the
   * files of the person, or a file created again): the exercise, its lock and its progress go on in it
   */
  public adopt(fromKey: string, toKey: string): void {
    const lock = this.locks[fromKey];
    if (lock) this.storage.setItem("exercise_locks", { ...this.locks, [toKey]: lock });
    const progress = this.progress();
    const moved = Object.entries(progress).filter(([, value]) => value.fileKey === fromKey);
    if (moved.length > 0) {
      this.storage.setItem("exercise_progress", {
        ...progress,
        ...Object.fromEntries(moved.map(([id, value]) => [id, { ...value, fileKey: toKey }])),
      });
    }
  }

  /**
   * Opens a shared exercise: its program goes to the folder "compartidos" (with a free name), its configuration is
   * saved and what it locks is kept for its file. Returns the file, to open it in the editor
   */
  public async open(exercise: SharedExercise): Promise<InterfaceFileItem> {
    await this.fileSystem.init();
    const folder = await this.folder(SHARED_FOLDER);
    const created = await this.fileSystem.createFile(folder, ".s", exercise.name.replace(/\.s$/i, ""));
    const file = await this.fileSystem.editFileItem({ ...created, content: exercise.content, description: exercise.statement });
    const machine = {
      architecture: exercise.architecture,
      superdlx: exercise.superdlx,
      forwarding: exercise.forwarding,
      floatingPoint: exercise.floatingPoint,
      memorySize: exercise.memorySize,
    };
    this.config.update(machine);
    if (exercise.locked.length > 0 || exercise.statement) {
      const values = lockValues({ ...this.config.value(), ...machine });
      this.storage.setItem("exercise_locks", {
        ...this.locks,
        [file.key]: { locked: exercise.locked, values, statement: exercise.statement },
      });
    }
    this.storage.setItem("interfaceFileItem", file);
    return file;
  }
}
