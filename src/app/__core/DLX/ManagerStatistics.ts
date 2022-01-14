import { DEFAULT_DATA_STATISTICS } from "../../CONSTANTS";
import { InterfaceDataStatistics } from "./interfaces";
import { TypeDataStatistics } from "../../Types";
import { Utils } from "../../Utils";

export class ManagerStatistics implements InterfaceDataStatistics {
  private _data: TypeDataStatistics;

  constructor() {
    this._data = DEFAULT_DATA_STATISTICS;
  }

  public processResponse(response: Partial<TypeDataStatistics>) {
    for (const responseElement of Object.keys(response)) {
      this._data[responseElement] = response[responseElement];
    }
  }

  public getData(): TypeDataStatistics {
    return this._data;
  }

  public reset() {
    this._data = Utils.clone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
  }
}
