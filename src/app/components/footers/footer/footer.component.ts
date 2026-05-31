import { Component, inject, type OnInit } from "@angular/core";
import { NPM_VERSION } from "@app/CONSTANTS";
import { ElectronService } from "@core/services";
import { Globals } from "@core/services/globals/globals.service";
import { StorageService } from "@core/storage/storage.service";
import { AppConfig } from "../../../../environments/_environment";

@Component({
  selector: "THUMDER-footer",
  templateUrl: "./footer.component.html",
  standalone: false,
})
export class FooterComponent implements OnInit {
  private storageService = inject(StorageService);
  electronService = inject(ElectronService);
  globals = inject(Globals);

  public date: number = new Date().getFullYear();
  public version: string = NPM_VERSION;
  public environment: string = AppConfig.environment;
  public lang: string = "";

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

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
