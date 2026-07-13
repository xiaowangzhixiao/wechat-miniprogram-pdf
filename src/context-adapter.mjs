import { MiniDOMMatrix, MiniPath2D, replayPath } from "./polyfills.mjs";

const PATH_METHODS = new Set(["fill", "stroke", "clip", "isPointInPath", "isPointInStroke"]);

export function adaptCanvasContext(context, canvas) {
  if (!context) throw new Error("A WeChat 2D canvas context is required");
  if (context.__wechatPdfAdapted) return context;

  let currentTransform = new MiniDOMMatrix();
  const transformStack = [];
  const overrides = {
    canvas,
    __wechatPdfAdapted: true,
    save() { transformStack.push(new MiniDOMMatrix(currentTransform)); return context.save(); },
    restore() { currentTransform = transformStack.pop() || new MiniDOMMatrix(); return context.restore(); },
    translate(x, y) { currentTransform.translateSelf(x, y); return context.translate(x, y); },
    scale(x, y) { currentTransform.scaleSelf(x, y); return context.scale(x, y); },
    rotate(angle) { currentTransform.rotateSelf(angle * 180 / Math.PI); return context.rotate(angle); },
    transform(a, b, c, d, e, f) { currentTransform.multiplySelf([a, b, c, d, e, f]); return context.transform(a, b, c, d, e, f); },
    setTransform(...args) {
      const matrix = args.length === 1 ? new MiniDOMMatrix(args[0]) : new MiniDOMMatrix(args);
      currentTransform = matrix;
      return context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    },
    resetTransform() {
      currentTransform = new MiniDOMMatrix();
      return typeof context.resetTransform === "function" ? context.resetTransform() : context.setTransform(1, 0, 0, 1, 0, 0);
    },
    getTransform() {
      if (typeof context.getTransform === "function") {
        const native = context.getTransform();
        if (native) return new MiniDOMMatrix(native);
      }
      return new MiniDOMMatrix(currentTransform);
    }
  };

  return new Proxy(context, {
    get(target, property) {
      if (property in overrides) return overrides[property];
      const value = target[property];
      if (typeof value !== "function") return value;
      if (PATH_METHODS.has(property)) {
        return (...args) => {
          const pathIndex = args.findIndex(arg => arg instanceof MiniPath2D || arg && Array.isArray(arg.commands));
          if (pathIndex >= 0) {
            const path = args[pathIndex];
            target.beginPath();
            replayPath(target, path);
            args.splice(pathIndex, 1);
          }
          return value.apply(target, args);
        };
      }
      return value.bind(target);
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
}
