import * as PIXI from 'pixi.js';
import { Graphics, InteractionData } from 'pixi.js';

/**
 * @author: Luis Angel Garcia
 */
const DEFAULT_LINE_STYLE = {
  width: 1,
  color: 0xffffff,
  alpha: 1,
  alignment: 0.5,
  native: true,
};

type paramLineConfig = {
  width: number,
  color: number,
  alpha: number,
  alignment: number,
  native: boolean
}

/**
 * @description Utility class that draws a grid on the screen.
 * @extends Graphics
 */
export class PixiJSGrid extends PIXI.Graphics {
  _correctedWidth: number;

  _cellSize: number;

  _useCorrectedWidth;

  _drawBoundaries;

  _gridWidth;

  /**
   *
   * @param {number} width number. Required.
   *
   * The target sidelength of the grid. It is best for `width` to be a perfect square (i.e., 2, 4, 9, 16, 25, etc.). If
   * not and the parameter `useCorrectedWidth` is set to **false**, then the grid will use a corrected width,
   * which is the smallest perfect square greater than `width`.
   *
   * @param {number} cellSize number, null. Optional, default: square root of corrected width
   *
   * The size of each cell in the grid.
   * If the value is **null**, the grid will use the default value.
   *
   *
   *  default:
   *  **{
   *    width: 1,
   *    color: 0xffffff,
   *    alpha: 1,
   *    alignment: 0.5,
   *    native: true
   *  }**
   *
   * Configuration for the line style on the object. See documentation on `PIXI.Graphics` for more on the `LineStyle` class.
   *
   * @param lineConfig
   * @param {boolean} useCorrectedWidth boolean. Optional. default: **true**
   * If **true**, the grid will use the smallest perfect square greater than `width`.
   * Otherwise, the grid will use the exact value given by `width`.
   *
   * @param {boolean} drawBoundaries boolean. Optional. default: **true**
   * If **true**, the grid will draw its boundaries.
   * Otherwise, the grid will not draw its boundaries. Mouse pointer detection is not affected.
   */
  constructor(width: number, cellSize = 10, lineConfig: paramLineConfig = DEFAULT_LINE_STYLE, useCorrectedWidth = true, drawBoundaries = true) {
    super();

    this._cellSize = 10;

    this._gridWidth = width;
    this._useCorrectedWidth = useCorrectedWidth;
    this._correctedWidth = 10;
    this._correctWidth();

    this._drawBoundaries = drawBoundaries;

    this.cellSize = cellSize;

    const lConfig = { ...DEFAULT_LINE_STYLE, ...(lineConfig || {}) };

    this.lineStyle(lConfig.width, lConfig.color, lConfig.alpha, lConfig.alignment, lConfig.native);

    // handle mouse move
    this.interactive = true;
    this.on('mousemove', (evt) => {
      const mouseCoords = evt.data.global;
      // check if the mouse is within the bounds of this grid. If not, do nothing.
      if (
        mouseCoords.x >= this.bounds.x1
        && mouseCoords.x <= this.bounds.x2
        && mouseCoords.y >= this.bounds.y1
        && mouseCoords.y <= this.bounds.y2
      ) {
        const gridCoords = this.getCellCoordinates(
          mouseCoords.x,
          mouseCoords.y,
        );
        this.onMousemove(evt, gridCoords);
      }
    });
  }

  /**
   * @param {number} cellSize number. Optional. default: the square root of the grid's side length
   */
  set cellSize(cellSize) {
    this._cellSize = cellSize || Math.sqrt(<number>this._correctedWidth);
  }

  get cellSize() {
    return this._cellSize;
  }

  /**
   * The amount of equally spaced lines along the grid's side.
   */
  get amtLines() {
    return Math.floor(this.gridWidth / this.cellSize);
  }

  /**
   * The requested width of the grid given by the `width` constructor parameter.
   */
  get originalWidth() {
    return this._gridWidth;
  }

  /**
   * The corrected width of the grid, which is the smallest square root number larger than
   * the corrected width.
   */
  get correctedWidth() {
    return this._correctedWidth;
  }

  get useCorrectedWidth() {
    return this._useCorrectedWidth;
  }

  /**
   * The coordinates for each corner of the grid.
   * @returns {{ x1: number, y1: number, x2: number, y2: number}}
   * The leftmost (**x1**), topmost (**y1**), rightmost (**x2**), and bottommost (**y2**) coordinates.
   */
  get bounds(): { x1: number, y1: number, x2: number, y2: number } {
    return {
      x1: this.x,
      y1: this.y,
      x2: this.x + this._correctedWidth,
      y2: this.y + this._correctedWidth,
    };
  }

  set drawBoundaries(drawBoundaries) {
    this._drawBoundaries = drawBoundaries;
  }

  get drawBoundaries() {
    return this._drawBoundaries;
  }

  /**
   * The actual width of the grid.
   * When the `cellSize` is not the default, the width of the grid will be the
   * width given in the `width` constructor. Otherwise, it is the corrected width.
   */
  get gridWidth() {
    if (!this.useCorrectedWidth) {
      return this._gridWidth;
    }
    return Math.abs(this.cellSize - Math.sqrt(this._correctedWidth)) <= 1e-6 ? this._correctedWidth : this._gridWidth;
  }

  /**
   * Draws the grid to the containing PIXI stage
   */
  draw(): PIXI.Graphics {
    this.clearGrid(true);
    for (let i = this._drawBoundaries ? 0 : 1; i <= this.amtLines - (this._drawBoundaries ? 0 : 1); i += 1) {
      const startCoords = i * this._cellSize;

      // draw the column
      this.moveTo(startCoords, 0);
      this.lineTo(startCoords, this._correctedWidth);

      // draw the row
      this.moveTo(0, startCoords);
      this.lineTo(this._correctedWidth, startCoords);
    }
    this.endFill();

    return this;
  }

  /**
   * Clears the grid from the containing PIXI stage.
   *
   * @param {boolean} retainLineStyle Optional, default: **true**
   *
   * When **true**, the configuration for the line style object is preserved.
   * Otherwise, the object's line style will revert to the defaults specified by the `PIXI.Graphics` object.
   */
  clearGrid(retainLineStyle = true): PixiJSGrid {
    const {
      width,
      alignment,
      color,
      alpha,
      native,
    } = this.line;
    this.clear();

    if (!retainLineStyle) {
      throw new Error('Retain Line Style');
    }
    this.lineStyle(width, color, alpha, alignment, native);

    return this;
  }

  /**
   * Transforms global coordinates to grid coordinates.
   * @param {number} x
   * The global X coordinate.
   *
   * @param {number} y
   * The global Y coordinate.
   */
  getCellCoordinates(x: number, y: number) {
    return {
      x: Math.floor((x - this.bounds.x1) / this.cellSize),
      y: Math.floor((y - this.bounds.y1) / this.cellSize),
    };
  }

  /**
   * Callback fired after detecting a mousemove event.
   *
   * @param {InteractionData} evt
   * The `PIXI.InteractionData` captured by the event.
   *
   * @param {{x: number, y: number}} gridCoords
   * The grid-level coordinates captured by the event.
   */
  onMousemove(evt: PIXI.InteractionData, gridCoords: { x: number, y: number }): void {

  }

  /**
   * Calculates the corrected width. If the `useCorrectedWidth` constructor parameter is set to **false**,
   * then it simply keeps the given value for `width` as the corrected width.
   */
  _correctWidth() {
    if (!this._useCorrectedWidth) {
      this._correctedWidth = this._gridWidth;
    }

    this._correctedWidth = Math.ceil(Math.sqrt(this._gridWidth)) ** 2;
  }
}
