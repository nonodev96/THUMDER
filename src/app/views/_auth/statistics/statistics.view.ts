import { Component, OnInit } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { TypeDataStatistics } from "../../../types";
import { MachineService } from "../../../__core/machine/machine.service";
import { DEFAULT_DATA_STATISTICS } from "../../../CONSTAST";
import { Utils } from "../../../Utils";

@Component({
  selector: 'view-statistics',
  templateUrl: './statistics.view.html',
  styleUrls: []
})
export class StatisticsView implements OnInit {

  _data: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);

  constructor(private translate: TranslateService,
              private machine: MachineService) {

  }

  ngOnInit(): void {
    this.machine.getDataStatisticsObservable().subscribe((data) => {
      this._data = data;
    })
  }

}
