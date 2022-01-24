import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../../../environments/_environment";
import { NPM_VERSION } from "../../../CONSTANTS";
import { Globals } from "../../../__core/services/globals/globals.service";
import { StorageService } from "../../../__core/storage/storage.service";

@Component({
  selector:    "app-footer",
  templateUrl: "./footer.component.html"
})
export class FooterComponent implements OnInit {
  date: number = new Date().getFullYear();
  version: string = NPM_VERSION;
  environment: string = AppConfig.environment;
  lang: string = "";

  constructor(private storageService: StorageService,
              public globals: Globals) {
  }

  ngOnInit(): void {
    this.lang = this.storageService.getItem("lang");
    this.storageService.watchStorage().subscribe((update_key) => {
      if (update_key === "lang") {
        this.lang = this.storageService.getItem("lang");
      }
    });
  }
}
