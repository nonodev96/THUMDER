import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { DEFAULT_DATA_STATISTICS } from "@app/CONSTANTS";
import type { TypeDataStatistics } from "@app/Types";
import { Utils } from "@app/Utils";
import { MachineService } from "@core/machine/machine.service";
import { SocketProviderConnectService } from "@core/services/socket/socket-provider-connect.service";
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";

@Component({
  selector: "view-statistics",
  templateUrl: "./statistics.view.html",
  styleUrls: [],
  standalone: false,
})
export class StatisticsView implements OnInit, OnDestroy {
  private machine = inject(MachineService);

  public data: TypeDataStatistics = Utils.clone<TypeDataStatistics>(DEFAULT_DATA_STATISTICS);
  private dataStatisticsSubscription: Subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.dataStatisticsSubscription = this.machine.getDataStatisticsObservable().subscribe((_data) => {
      this.data = _data;
    });
  }

  ngOnDestroy(): void {
    this.dataStatisticsSubscription.unsubscribe();
  }
}
