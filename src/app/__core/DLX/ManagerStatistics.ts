import { DEFAULT_DATA_STATISTICS } from "@app/CONSTANTS";
import type { TypeDataStatistics } from "@app/Types";
import { Utils } from "@app/Utils";
import type { InterfaceDataStatistics } from "@core/DLX/interfaces";

export class ManagerStatistics implements InterfaceDataStatistics {
  public _data: TypeDataStatistics;

  constructor() {
    this._data = DEFAULT_DATA_STATISTICS;
  }

  public processResponse(response: Partial<TypeDataStatistics>): void {
    for (const responseElement of Object.keys(response)) {
      (this._data as any)[responseElement] = (response as any)[responseElement];
    }
  }

  public getData(): TypeDataStatistics {
    return this._data;
  }

  public reset() {
    this._data = Utils.clone(DEFAULT_DATA_STATISTICS) as TypeDataStatistics;
  }
}
