import * as PIXI from "pixi.js";

export namespace PixiUtils {
  export function getRandomInt(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  export function getAngleTo(mx, my, px, py) {
    // var self = that;
    const distX = my - py;
    const distY = mx - px;
    return Math.atan2(distX, distY);
    // const angle = Math.atan2(distX, distY);
    // const degrees = angle * 180/ Math.PI;
  }

  export function getAngleX(length, angle) {
    return Math.cos(angle) * length;
  }

  export function getAngleY(length, angle) {
    return Math.sin(angle) * length;
  }

  export function MapToArray<K, V>(map: Map<K, V>): { key: K; value: V }[] {
    return Array.from(map, ([key, value]) => ({
      key,
      value
    }));
  }

  export function cloneObject(obj) {
    //Edge case
    if (obj == null || typeof obj !== "object") {
      return obj;
    }

    const result = {};
    const keys_ = Object.getOwnPropertyNames(obj);

    for (let i = 0; i < keys_.length; i++) {
      const key = keys_[i];
      result[key] = cloneObject(obj[key]);
    }

    Object.setPrototypeOf(result, obj.__proto__);

    return result;
  }

  export function drawArrow(start_x: number, start_y: number, to_x: number, to_y: number, color = 0xFF0000, angle = 35): PIXI.Graphics {
    const L = Math.sqrt((to_x - start_x) ** 2 + (to_y - start_y) ** 2);
    const x3 = to_x + (15 / L) * ((start_x - to_x) * Math.abs(Math.cos(angle)) + (start_y - to_y) * Math.abs(Math.sin(angle)));
    const y3 = to_y + (15 / L) * ((start_y - to_y) * Math.abs(Math.cos(angle)) - (start_x - to_x) * Math.abs(Math.sin(angle)));
    const x4 = to_x + (15 / L) * ((start_x - to_x) * Math.abs(Math.cos(angle)) - (start_y - to_y) * Math.abs(Math.sin(angle)));
    const y4 = to_y + (15 / L) * ((start_y - to_y) * Math.abs(Math.cos(angle)) + (start_x - to_x) * Math.abs(Math.sin(angle)));
    const bezierArrow = new PIXI.Graphics();
    bezierArrow.lineStyle(3, color);
    bezierArrow.moveTo(start_x, start_y);
    bezierArrow.lineTo(to_x, to_y);
    bezierArrow.moveTo(x3, y3);
    bezierArrow.lineTo(to_x, to_y);
    bezierArrow.moveTo(x4, y4);
    bezierArrow.lineTo(to_x, to_y);
    return bezierArrow;
  }

}
