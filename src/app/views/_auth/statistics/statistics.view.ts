import { Component, type OnDestroy, type OnInit } from "@angular/core";
import type { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import type { MachineService } from "../../../__core/machine/machine.service";
import type { SocketProviderConnectService } from "../../../__core/services/socket/socket-provider-connect.service";
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
    private translate: TranslateService,
    private socketProviderConnectService: SocketProviderConnectService,
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
