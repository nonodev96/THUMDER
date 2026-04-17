import { Component, type OnDestroy, type OnInit } from "@angular/core";
import type { Router } from "@angular/router";
import { Subscription } from "rxjs";
import type { MachineService } from "../../../__core/machine/machine.service";
import type { Globals } from "../../../__core/services/globals/globals.service";

@Component({
  selector: "THUMDER-windows-debug",
  templateUrl: "./debug.component.html",
  styleUrls: ["./debug.component.scss"],
  standalone: false,
})
export class DebugComponent implements OnInit, OnDestroy {
  private loggerSubscription: Subscription = new Subscription();
  public private_logger: string[] = [];

  constructor(
    public router: Router,
    public globals: Globals,
    private machine: MachineService,
  ) {
    this.loggerSubscription = this.machine.getLoggerObservable().subscribe((log) => {
      this.private_logger.push(log);
      if (this.private_logger.length >= 100) this.private_logger.pop();
      window.jQuery("#card-debug>.card-body").animate(
        {
          scrollTop: window.jQuery("#card-debug>.card-body")[0].scrollHeight,
        },
        10,
      );
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.loggerSubscription.unsubscribe();
  }
}
