import { Injectable, signal } from "@angular/core";

/**
 * What the rest of THUMDER needs to know about the editor: whether it has changes that are not saved. The simulator
 * loads the saved version of the file, so the navbar warns when the program is loaded with changes pending
 */
@Injectable({ providedIn: "root" })
export class EditorStateService {
  public readonly unsaved = signal(false);
}
