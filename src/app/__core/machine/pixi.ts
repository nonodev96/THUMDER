// PixiJS with the settings of THUMDER: its canvases import Pixi from here, so Pixi is loaded with their views (REN-02)
// and the settings apply before any of them is drawn
import * as PIXI from "pixi.js";
// Without new Function: the Content Security Policy does not allow eval (SEG-03)
import "@pixi/unsafe-eval";

PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
PIXI.Container.defaultSortableChildren = true;

export { PIXI };
