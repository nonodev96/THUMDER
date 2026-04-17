import { Component, type OnDestroy, type OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { MachineService } from "../../../__core/machine/machine.service";
import { SocketProviderConnectService } from "../../../__core/services/socket/socket-provider-connect.service";
import { DEFAULT_DATA_STATISTICS } from "../../../CONSTANTS";
import type { TypeDataStatistics } from "../../../Types";
import { Utils } from "../../../Utils";

@Component({
  selector: "view-statistics",
  templateUrl: "./statistics.view.html",
  styleUrls: [],
  standalone: false,
})
export class StatisticsView implements OnInit, OnDestroy {
  public data: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);
  private dataStatisticsSubscription: Subscription = new Subscription();

  constructor(
    _translate: TranslateService,
    _socketProviderConnectService: SocketProviderConnectService,
    private machine: MachineService,
  ) {}

  ngOnInit(): void {
    this.dataStatisticsSubscription = this.machine.getDataStatisticsObservable().subscribe((_data) => {
      this.data = _data;
    });
  }

  ngOnDestroy(): void {
    this.dataStatisticsSubscription.unsubscribe();
  }
}
