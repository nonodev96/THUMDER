import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { TypeDataStatistics } from "../../../Types";
import { MachineService } from "../../../__core/machine/machine.service";
import { DEFAULT_DATA_STATISTICS } from "../../../CONSTANTS";
import { Utils } from "../../../Utils";
import { Subscription } from "rxjs";
import { SocketProviderConnectService } from "../../../__core/services/socket/socket-provider-connect.service";

import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector:    "view-statistics",
  templateUrl: "./statistics.view.html",
  styleUrls:   []
})
export class StatisticsView implements OnInit, AfterViewInit, OnDestroy {

  public _data: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);
  private dataStatisticsSubscription: Subscription = new Subscription();

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: Label[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
  ];

  constructor(private translate: TranslateService,
              private socketProviderConnectService: SocketProviderConnectService,
              private machine: MachineService) {

  }

  ngOnInit(): void {
    this.dataStatisticsSubscription = this.machine.getDataStatisticsObservable().subscribe((data) => {
      this._data = data;
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.dataStatisticsSubscription.unsubscribe();
  }

}
