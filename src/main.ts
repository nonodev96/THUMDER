import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as PIXI from 'pixi.js';

import { AppModule } from './app/app.module';
import { AppConfig } from './environments/_environment';

if (AppConfig.production) {
  enableProdMode();
}

// PIXI global settings (must run before any PIXI usage)
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.SORTABLE_CHILDREN = true;

platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    preserveWhitespaces: false
  })
  .catch(err => console.error(err));
