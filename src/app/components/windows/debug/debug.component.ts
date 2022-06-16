import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MachineService } from "../../../__core/machine/machine.service";
import { Subscription } from "rxjs";
import { Globals } from "../../../__core/services/globals/globals.service";

@Component({
  selector:    "THUMDER-windows-debug",
  templateUrl: "./debug.component.html",
  styleUrls:   [ "./debug.component.scss" ]
})
export class DebugComponent implements OnInit, OnDestroy {

  private loggerSubscription: Subscription = new Subscription();
  public private_logger: string[] = [];

  constructor(public router: Router,
              public globals: Globals,
              private machine: MachineService) {
    this.loggerSubscription = this.machine.getLoggerObservable().subscribe((log) => {
      this.private_logger.push(log);
      if (this.private_logger.length >= 100) this.private_logger.pop();
      window.jQuery("#card-debug>.card-body").animate({
        scrollTop: window.jQuery("#card-debug>.card-body")[0].scrollHeight
      }, 10);
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.loggerSubscription.unsubscribe();
  }

}
