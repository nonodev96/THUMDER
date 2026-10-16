import { DEFAULT_DATA_STATISTICS } from "@app/CONSTANTS";
import type { TypeDataStatistics } from "@app/Types";
import { Utils } from "@app/Utils";
import type { InterfaceDataStatistics } from "@core/DLX/interfaces";

export class ManagerStatistics implements InterfaceDataStatistics {
  public _data: TypeDataStatistics;

  constructor() {
    // A copy: processResponse changes the data, and the defaults are shared by everyone
    this._data = Utils.clone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
  }

  public processResponse(response: Partial<TypeDataStatistics>): void {
    this._data = { ...this._data, ...response };
  }

  public getData(): TypeDataStatistics {
    return this._data;
  }

  public reset() {
    this._data = Utils.clone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
  }
}
