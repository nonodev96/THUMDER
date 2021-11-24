import { Component, OnInit } from "@angular/core";
import { NPM_VERSION } from "../../../CONSTAST";
import { StorageService } from "../../../__core/storage/storage.service";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
})
export class FooterComponent implements OnInit {
  date = new Date().getFullYear();
  version = NPM_VERSION;
  lang;

  constructor(private storageService: StorageService) {
  }

  ngOnInit(): void {
    this.lang = this.storageService.getItem('lang');
    this.storageService.watchStorage().subscribe((update_key) => {
      this.lang = this.storageService.getItem('lang');
    });
  }
}
