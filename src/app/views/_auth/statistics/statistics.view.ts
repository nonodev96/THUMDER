import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { TypeDataStatistics } from "../../../types";
import { MachineService } from "../../../__core/machine/machine.service";
import { DEFAULT_DATA_STATISTICS } from "../../../CONSTAST";
import { Utils } from "../../../Utils";
import { Subscription } from "rxjs";

@Component({
  selector: 'view-statistics',
  templateUrl: './statistics.view.html',
  styleUrls: []
})
export class StatisticsView implements OnInit, OnDestroy {

  public _data: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);
  private dataStatisticsSubscription: Subscription = new Subscription();

  constructor(private translate: TranslateService,
              private machine: MachineService) {

  }

  ngOnInit(): void {
    this.dataStatisticsSubscription = this.machine.getDataStatisticsObservable().subscribe((data) => {
      this._data = data;
    });
  }

  ngOnDestroy(): void {
    this.dataStatisticsSubscription.unsubscribe();
  }

}
