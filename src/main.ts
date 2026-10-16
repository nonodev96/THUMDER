import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "@app/app.component";
import { appConfig } from "@app/app.config";
import { AppConfig } from "./environments/_environment";

if (AppConfig.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch((error) => console.error(error));
