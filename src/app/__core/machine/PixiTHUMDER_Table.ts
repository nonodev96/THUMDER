import * as PIXI from "pixi.js";

export class Position {
  public row;
  public col;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  toString() {
    return JSON.stringify({
      row: this.row,
      col: this.col
    });
  }
}

export type PIXITableConfiguration = {
  rowSeparation: number;
  columnSeparation: number;
  cellMaxWidth: number;
  cellMaxHeight: number;
};

export const DEFAULT_PIXI_TABLE_CONFIGURATION: PIXITableConfiguration = {
  cellMaxHeight: 10,
  cellMaxWidth: 10,
  columnSeparation: 10,
  rowSeparation: 10
};

export class PixiTHUMDER_Table extends PIXI.Container {
  public table: Map<string, PIXI.Container>;
  private cellMaxWidth;
  private cellMaxHeight;
  private readonly rowSeparation;
  private readonly columnSeparation;
  private readonly isDebug = false;

  constructor(configuration: Partial<PIXITableConfiguration> = DEFAULT_PIXI_TABLE_CONFIGURATION) {
    super();
    this.table = new Map<string, PIXI.Container>();
    this.rowSeparation = configuration.rowSeparation;
    this.columnSeparation = configuration.columnSeparation;
    this.cellMaxWidth = configuration.cellMaxWidth;
    this.cellMaxHeight = configuration.cellMaxHeight;
  }

  public getAllPositions(): Position[] {
    return Array.from(this.table.keys()).map((v) => {
      return (JSON.parse(v) as Position);
    });
  }

  public getAllRows(): number[] {
    return Array.from(this.table.keys()).map((v) => {
      return (JSON.parse(v) as Position).row;
    });
  }

  public getAllColumns(): number[] {
    return Array.from(this.table.keys()).map((v) => {
      return (JSON.parse(v) as Position).col;
    });
  }

  public deleteRow(row: number): void {
    const rowToDelete = Array.from(this.table.keys()).map((v) => JSON.parse(v) as Position).filter((position) => {
      return (position).row === row;
    });
    for (const {row, col} of rowToDelete) {
      this.deleteCell(row, col);
    }
  }

  public deleteCol(col: number): void {
    const colToDelete = Array.from(this.table.keys()).map((v) => JSON.parse(v) as Position).filter((position) => {
      return (position).col === col;
    });
    for (const position of colToDelete) {
      this.deleteCell(position.row, position.col);
    }
  }

  public deleteCell(row: number, col: number): boolean {
    const key = new Position(row, col);
    if (this.existCell(row, col)) {
      const cell = this.getCell(row, col);
      this.removeChild(cell);
    }
    return this.table.delete(key.toString());
  }

  public clearCell(row: number, col: number): void {
    const key = new Position(row, col);
    this.table.set(key.toString(), new PIXI.Container());
  }

  public setCell(row: number, col: number, content: PIXI.Container): void {
    if (this.cellMaxHeight < content.height) {
      this.cellMaxHeight = content.height;
    }
    if (this.cellMaxWidth < content.width) {
      this.cellMaxWidth = content.width;
    }
    const cell = new PIXI.Container();
    cell.addChild(content);
    const key = new Position(row, col);
    this.table.set(key.toString(), cell);
  }

  public drawCell(row: number, col: number): void {
    const cell = this.getCell(row, col);
    cell.y = row * this.cellMaxHeight + ((row + 1) * this.rowSeparation);
    cell.x = col * this.cellMaxWidth + ((col + 1) * this.columnSeparation);
    this.addChild(cell);
  }

  public draw(): PIXI.Container {
    if (this.isDebug) console.warn("Keys: ", Array.from(this.table.keys()));
    const positions: Position[] = Array.from(this.table.keys()).map((v) => {
      return (JSON.parse(v) as Position);
    });
    for (const {row, col} of positions) {
      this.drawCell(row, col);
    }
    return this;
  }

  public existCell(row: number, col: number): boolean {
    const key = new Position(row, col);
    return this.table.has(key.toString());
  }

  private getCell(row: number, col: number): PIXI.Container {
    if (!this.existCell(row, col)) {
      return new PIXI.Container();
    } else {
      const key = new Position(row, col);
      return this.table.get(key.toString());
    }
  }

  public debug() {
    return {
      table: this.table
    };
  }
}
