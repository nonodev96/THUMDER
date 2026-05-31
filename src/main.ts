import { enableProdMode } from "@angular/core";
import { platformBrowser } from "@angular/platform-browser";
import * as PIXI from "pixi.js";

import { AppModule } from "./app/app.module";
import { AppConfig } from "./environments/_environment";

if (AppConfig.production) {
  enableProdMode();
}

// PIXI global settings (must run before any PIXI usage)
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
PIXI.Container.defaultSortableChildren = true;

platformBrowser()
  .bootstrapModule(AppModule, {
    preserveWhitespaces: false,
  })
  .catch((err) => console.error(err));
