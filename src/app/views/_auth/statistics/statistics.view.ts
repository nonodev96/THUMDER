import { Component, OnDestroy, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { TypeDataStatistics } from "../../../Types";
import { MachineService } from "../../../__core/machine/machine.service";
import { DEFAULT_DATA_STATISTICS } from "../../../CONSTANTS";
import { Utils } from "../../../Utils";
import { Subscription } from "rxjs";
import { SocketProviderConnectService } from "../../../__core/services/socket/socket-provider-connect.service";

@Component({
  selector:    "view-statistics",
  templateUrl: "./statistics.view.html",
  styleUrls:   []
})
export class StatisticsView implements OnInit, OnDestroy {

  public data: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);
  private dataStatisticsSubscription: Subscription = new Subscription();

  constructor(private translate: TranslateService,
              private socketProviderConnectService: SocketProviderConnectService,
              private machine: MachineService) {

  }

  ngOnInit(): void {
    this.dataStatisticsSubscription = this.machine.getDataStatisticsObservable().subscribe((_data) => {
      this.data = _data;
    });
  }

  ngOnDestroy(): void {
    this.dataStatisticsSubscription.unsubscribe();
  }

}
