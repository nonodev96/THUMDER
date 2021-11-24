import { TypeBreakpoints } from "../../../components/monaco-editor/monaco-editor.component";

export class BreakpointManager {
  // Line numbers are 1-indexed
  private breakpoints: TypeBreakpoints = {};

  public toggleBreakpoint(lineNumber: number): void {
    if (lineNumber in this.breakpoints) {
      delete this.breakpoints[lineNumber];
    } else {
      this.breakpoints[lineNumber] = true;
    }
    console.log('enabled', lineNumber, this.breakpoints[lineNumber]);
  }

  public getBreakpoint(lineNumber: number): boolean | null {
    if (lineNumber in this.breakpoints) {
      return this.breakpoints[lineNumber];
    } else {
      return null;
    }
  }

  public updateManager(breakpoints: TypeBreakpoints): void {
    this.breakpoints = {};
    for (const [line, enabled] of Object.entries(breakpoints)) {
      this.breakpoints[line] = enabled;
    }
  }

  public getAllBreakpoints(): TypeBreakpoints {
    return this.breakpoints;
  }

  public getAllLinesOfBreakpoints(): number[] {
    return Object.keys(this.breakpoints).map(k => parseInt(k));
  }

  public isBreakpoint(line: number): boolean {
    return this.breakpoints[line] ?? false;
  }

  public clear(): void {
    this.breakpoints = {};
  }

}
