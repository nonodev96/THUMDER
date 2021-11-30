import { Component, OnDestroy, OnInit } from "@angular/core";
import { NPM_VERSION } from "../../../CONSTAST";
import { StorageService } from "../../../__core/storage/storage.service";
import { MachineService } from "../../../__core/machine/machine.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
})
export class FooterComponent implements OnInit, OnDestroy {
  date: number = new Date().getFullYear();
  version: string = NPM_VERSION;
  lang: string = "";
  logger: string[] = [];
  private loggerSubscription: Subscription = new Subscription();

  constructor(private storageService: StorageService,
              private machine: MachineService) {
  }

  ngOnInit(): void {
    this.lang = this.storageService.getItem('lang');
    this.storageService.watchStorage().subscribe((update_key) => {
      this.lang = this.storageService.getItem('lang');
    });
    this.loggerSubscription = this.machine.getLoggerObservable().subscribe((log) => {
      this.logger.push(log);
      if (this.logger.length >= 10) this.logger.pop();
    });
  }

  ngOnDestroy(): void {
    this.loggerSubscription.unsubscribe();
  }
}
