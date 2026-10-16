// jsdom has no canvas. PixiJS (the pipeline and the cycle clock diagram) only needs a 2D context that accepts the
// drawing calls to build its objects, so the tests get one that does nothing
const store: Record<PropertyKey, unknown> = {};

const context2d = new Proxy(store, {
  get(target, property) {
    if (property in target) return target[property];
    switch (property) {
      case "measureText":
        return (text: string) => ({
          width: text.length * 8,
          actualBoundingBoxAscent: 8,
          actualBoundingBoxDescent: 2,
          fontBoundingBoxAscent: 8,
          fontBoundingBoxDescent: 2,
        });
      case "getImageData":
        return (_x: number, _y: number, width: number, height: number) => ({
          data: new Uint8ClampedArray(Math.max(1, width * height * 4)),
        });
      case "createLinearGradient":
      case "createRadialGradient":
      case "createPattern":
        return () => ({ addColorStop: () => undefined });
      default:
        return () => undefined;
    }
  },
  set(target, property, value) {
    target[property] = value;
    return true;
  },
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value(type: string) {
    return type === "2d" ? context2d : null;
  },
});
