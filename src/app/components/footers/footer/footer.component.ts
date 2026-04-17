import { Component, type OnInit } from "@angular/core";
import { AppConfig } from "../../../../environments/_environment";
import type { ElectronService } from "../../../__core/services";
import type { Globals } from "../../../__core/services/globals/globals.service";
import type { StorageService } from "../../../__core/storage/storage.service";
import { NPM_VERSION } from "../../../CONSTANTS";

@Component({
  selector: "THUMDER-footer",
  templateUrl: "./footer.component.html",
  standalone: false,
})
export class FooterComponent implements OnInit {
  public date: number = new Date().getFullYear();
  public version: string = NPM_VERSION;
  public environment: string = AppConfig.environment;
  public lang: string = "";

  constructor(
    private storageService: StorageService,
    public electronService: ElectronService,
    public globals: Globals,
  ) {}

  ngOnInit(): void {
    this.lang = this.storageService.getItem("lang");
    this.storageService.watchStorage().subscribe((update_key) => {
      if (update_key === "lang") {
        this.lang = this.storageService.getItem("lang");
      }
    });
  }

  public async notification() {
    this.electronService.send("thumder-notification");
  }
}
