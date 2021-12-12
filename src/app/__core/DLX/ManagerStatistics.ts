import { DEFAULT_DATA_STATISTICS } from "../../CONSTAST";
import { InterfaceDataStatistics } from "./interfaces";
import { TypeDataStatistics } from "../../types";
import { Utils } from "../../Utils";

export class ManagerStatistics implements InterfaceDataStatistics {
  private _data: TypeDataStatistics;

  constructor() {
    this._data = DEFAULT_DATA_STATISTICS;
  }

  public getData(): TypeDataStatistics {
    return this._data;
  }

  public processResponse(response: Partial<TypeDataStatistics>) {
    for (const responseElement of Object.keys(response)) {
      this._data[responseElement] = response[responseElement];
    }
  }

  public reset() {
    this._data = Utils.clone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
  }
}
