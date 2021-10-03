export namespace Utils {
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

  export function MapToArray(map: Map<any, any>): { key: any; value: any }[] {
    return Array.from(map, ([key, value]) => ({
      key,
      value
    }));
  }
}
