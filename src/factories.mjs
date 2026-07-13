import { adaptCanvasContext } from "./context-adapter.mjs";

function platform() {
  if (typeof wx === "undefined") throw new Error("wechat-miniprogram-pdf must run in a WeChat Mini Program");
  return wx;
}

export class MiniProgramCanvasFactory {
  create(width, height) {
    const canvas = platform().createOffscreenCanvas({ type: "2d", width, height });
    canvas.width = width;
    canvas.height = height;
    return { canvas, context: adaptCanvasContext(canvas.getContext("2d"), canvas) };
  }
  reset(target, width, height) {
    target.canvas.width = width;
    target.canvas.height = height;
  }
  destroy(target) {
    target.canvas.width = 0;
    target.canvas.height = 0;
    target.canvas = null;
    target.context = null;
  }
}

export class MiniProgramFilterFactory {
  addFilter() { return "none"; }
  addHCMFilter() { return "none"; }
  addAlphaFilter() { return "none"; }
  addLuminosityFilter() { return "none"; }
  addKnockoutFilter() { return "none"; }
  addHighlightHCMFilter() { return "none"; }
  addSelectionHCMFilter() { return "none"; }
  addSelectionFilter() { return "none"; }
  createSelectionStyle() { return null; }
  destroy() {}
}

export class MiniProgramBinaryDataFactory {
  async fetch() { throw new Error("External PDF resources are disabled; provide a self-contained PDF"); }
}

