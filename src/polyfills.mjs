const radians = degrees => degrees * Math.PI / 180;

if (typeof ArrayBuffer.prototype.transferToFixedLength !== "function") {
  ArrayBuffer.prototype.transferToFixedLength = function transferToFixedLength(newLength = this.byteLength) {
    const output = new ArrayBuffer(newLength);
    new Uint8Array(output).set(new Uint8Array(this, 0, Math.min(this.byteLength, newLength)));
    return output;
  };
}
if (typeof ArrayBuffer.prototype.transfer !== "function") {
  ArrayBuffer.prototype.transfer = ArrayBuffer.prototype.transferToFixedLength;
}

if (typeof Map.prototype.getOrInsertComputed !== "function") {
  Map.prototype.getOrInsertComputed = function getOrInsertComputed(key, callback) {
    if (this.has(key)) return this.get(key);
    const value = callback(key);
    this.set(key, value);
    return value;
  };
}
if (typeof WeakMap.prototype.getOrInsertComputed !== "function") {
  WeakMap.prototype.getOrInsertComputed = function getOrInsertComputed(key, callback) {
    if (this.has(key)) return this.get(key);
    const value = callback(key);
    this.set(key, value);
    return value;
  };
}

export class MiniDOMMatrix {
  constructor(value) {
    const source = Array.isArray(value) ? value : value && typeof value === "object"
      ? [value.a, value.b, value.c, value.d, value.e, value.f]
      : null;
    [this.a, this.b, this.c, this.d, this.e, this.f] = source && source.length >= 6
      ? source.map((item, index) => Number.isFinite(Number(item)) ? Number(item) : [1, 0, 0, 1, 0, 0][index])
      : [1, 0, 0, 1, 0, 0];
    this.is2D = true;
  }

  get m11() { return this.a; } set m11(value) { this.a = value; }
  get m12() { return this.b; } set m12(value) { this.b = value; }
  get m21() { return this.c; } set m21(value) { this.c = value; }
  get m22() { return this.d; } set m22(value) { this.d = value; }
  get m41() { return this.e; } set m41(value) { this.e = value; }
  get m42() { return this.f; } set m42(value) { this.f = value; }

  multiply(other) { return new MiniDOMMatrix(this).multiplySelf(other); }
  multiplySelf(other) {
    const m = other instanceof MiniDOMMatrix ? other : new MiniDOMMatrix(other);
    const { a, b, c, d, e, f } = this;
    this.a = a * m.a + c * m.b;
    this.b = b * m.a + d * m.b;
    this.c = a * m.c + c * m.d;
    this.d = b * m.c + d * m.d;
    this.e = a * m.e + c * m.f + e;
    this.f = b * m.e + d * m.f + f;
    return this;
  }
  preMultiplySelf(other) {
    const result = new MiniDOMMatrix(other).multiply(this);
    Object.assign(this, result);
    return this;
  }
  translate(tx = 0, ty = 0) { return this.multiply(new MiniDOMMatrix([1, 0, 0, 1, tx, ty])); }
  translateSelf(tx = 0, ty = 0) { return this.multiplySelf([1, 0, 0, 1, tx, ty]); }
  scale(scaleX = 1, scaleY = scaleX, _scaleZ = 1, originX = 0, originY = 0) {
    return new MiniDOMMatrix(this).scaleSelf(scaleX, scaleY, 1, originX, originY);
  }
  scaleSelf(scaleX = 1, scaleY = scaleX, _scaleZ = 1, originX = 0, originY = 0) {
    return this.translateSelf(originX, originY).multiplySelf([scaleX, 0, 0, scaleY, 0, 0]).translateSelf(-originX, -originY);
  }
  rotate(angle = 0) { return new MiniDOMMatrix(this).rotateSelf(angle); }
  rotateSelf(angle = 0) {
    const cos = Math.cos(radians(angle));
    const sin = Math.sin(radians(angle));
    return this.multiplySelf([cos, sin, -sin, cos, 0, 0]);
  }
  inverse() { return new MiniDOMMatrix(this).invertSelf(); }
  invertSelf() {
    const determinant = this.a * this.d - this.b * this.c;
    if (!determinant) {
      this.a = this.b = this.c = this.d = this.e = this.f = NaN;
      return this;
    }
    const { a, b, c, d, e, f } = this;
    this.a = d / determinant;
    this.b = -b / determinant;
    this.c = -c / determinant;
    this.d = a / determinant;
    this.e = (c * f - d * e) / determinant;
    this.f = (b * e - a * f) / determinant;
    return this;
  }
  transformPoint(point = {}) {
    const x = Number(point.x || 0);
    const y = Number(point.y || 0);
    return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f, z: Number(point.z || 0), w: 1 };
  }
  toFloat32Array() { return new Float32Array([this.a, this.b, this.c, this.d, this.e, this.f]); }
  toFloat64Array() { return new Float64Array([this.a, this.b, this.c, this.d, this.e, this.f]); }
}

export class MiniPath2D {
  constructor(source) {
    this.commands = [];
    if (source instanceof MiniPath2D) this.commands = source.commands.map(command => ({ ...command, args: [...command.args] }));
    else if (typeof source === "string" && source) throw new Error("SVG Path2D strings are not supported in WeChat Mini Programs");
  }
  addPath(path, transform) { this.commands.push({ name: "addPath", args: [path, transform ? new MiniDOMMatrix(transform) : null] }); }
  closePath() { this.commands.push({ name: "closePath", args: [] }); }
  moveTo(...args) { this.commands.push({ name: "moveTo", args }); }
  lineTo(...args) { this.commands.push({ name: "lineTo", args }); }
  bezierCurveTo(...args) { this.commands.push({ name: "bezierCurveTo", args }); }
  quadraticCurveTo(...args) { this.commands.push({ name: "quadraticCurveTo", args }); }
  arc(...args) { this.commands.push({ name: "arc", args }); }
  arcTo(...args) { this.commands.push({ name: "arcTo", args }); }
  ellipse(...args) { this.commands.push({ name: "ellipse", args }); }
  rect(...args) { this.commands.push({ name: "rect", args }); }
  roundRect(...args) { this.commands.push({ name: "roundRect", args }); }
}

export function replayPath(context, path) {
  for (const command of path.commands) {
    if (command.name === "addPath") {
      const [child, matrix] = command.args;
      context.save();
      if (matrix) context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
      replayPath(context, child);
      context.restore();
    } else {
      context[command.name](...command.args);
    }
  }
}

if (typeof globalThis.DOMMatrix === "undefined") globalThis.DOMMatrix = MiniDOMMatrix;
if (typeof globalThis.Path2D === "undefined") globalThis.Path2D = MiniPath2D;
if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = class Blob {
    constructor(parts = [], options = {}) {
      const chunks = parts.map(part => {
        if (typeof part === "string") {
          if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(part);
          return Uint8Array.from(unescape(encodeURIComponent(part)), character => character.charCodeAt(0));
        }
        if (part instanceof ArrayBuffer) return new Uint8Array(part);
        if (ArrayBuffer.isView(part)) return new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
        if (part && part._bytes) return part._bytes;
        return new Uint8Array();
      });
      this.size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
      this.type = String(options.type || "").toLowerCase();
      this._bytes = new Uint8Array(this.size);
      let offset = 0;
      for (const chunk of chunks) {
        this._bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
    }
    async arrayBuffer() { return this._bytes.slice().buffer; }
    async bytes() { return this._bytes.slice(); }
    async text() {
      if (typeof TextDecoder !== "undefined") return new TextDecoder().decode(this._bytes);
      return decodeURIComponent(escape(String.fromCharCode(...this._bytes)));
    }
    slice(start = 0, end = this.size, type = "") { return new Blob([this._bytes.slice(start, end)], { type }); }
  };
}
if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class Response {
    constructor(body = null, options = {}) {
      this.body = body;
      this.status = Number(options.status || 200);
      this.statusText = String(options.statusText || "");
      this.ok = this.status >= 200 && this.status < 300;
    }
    async arrayBuffer() {
      if (this.body == null) return new ArrayBuffer(0);
      if (typeof this.body.arrayBuffer === "function") return this.body.arrayBuffer();
      if (this.body instanceof ArrayBuffer) return this.body.slice(0);
      if (ArrayBuffer.isView(this.body)) return this.body.buffer.slice(this.body.byteOffset, this.body.byteOffset + this.body.byteLength);
      return new Blob([this.body]).arrayBuffer();
    }
    async bytes() { return new Uint8Array(await this.arrayBuffer()); }
  };
}
if (typeof globalThis.AbortController === "undefined") {
  class MiniAbortSignal {
    constructor() {
      this.aborted = false;
      this.reason = undefined;
      this.listeners = [];
    }
    addEventListener(type, listener, options = {}) {
      if (type === "abort" && typeof listener === "function") this.listeners.push({ listener, once: Boolean(options.once) });
    }
    removeEventListener(type, listener) {
      if (type === "abort") this.listeners = this.listeners.filter(item => item.listener !== listener);
    }
    throwIfAborted() { if (this.aborted) throw this.reason || new Error("The operation was aborted"); }
    _abort(reason) {
      if (this.aborted) return;
      this.aborted = true;
      this.reason = reason || new Error("The operation was aborted");
      const event = { type: "abort", target: this };
      for (const item of [...this.listeners]) item.listener.call(this, event);
      this.listeners = this.listeners.filter(item => !item.once);
    }
  }
  globalThis.AbortSignal = MiniAbortSignal;
  globalThis.AbortController = class AbortController {
    constructor() { this.signal = new MiniAbortSignal(); }
    abort(reason) { this.signal._abort(reason); }
  };
}
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = function structuredClone(value, _options) {
    const seen = new Map();
    function clone(input) {
      if (input === null || typeof input !== "object") return input;
      if (seen.has(input)) return seen.get(input);
      if (input instanceof ArrayBuffer) return input.slice(0);
      if (ArrayBuffer.isView(input)) {
        const buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
        return input instanceof DataView ? new DataView(buffer) : new input.constructor(buffer);
      }
      if (input instanceof Date) return new Date(input.getTime());
      if (input instanceof Map) {
        const output = new Map();
        seen.set(input, output);
        for (const [key, item] of input) output.set(clone(key), clone(item));
        return output;
      }
      if (input instanceof Set) {
        const output = new Set();
        seen.set(input, output);
        for (const item of input) output.add(clone(item));
        return output;
      }
      const output = Array.isArray(input) ? [] : {};
      seen.set(input, output);
      for (const key of Object.keys(input)) output[key] = clone(input[key]);
      return output;
    }
    return clone(value);
  };
}
if (typeof globalThis.ReadableStream === "undefined") {
  globalThis.ReadableStream = class ReadableStream {
    constructor(source = {}, strategy = {}) {
      this.source = source;
      this.queue = [];
      this.pending = [];
      this.closed = false;
      this.failed = null;
      this.locked = false;
      this.pulling = false;
      this.highWaterMark = Number(strategy.highWaterMark || 1);
      const stream = this;
      this.controller = {
        enqueue(value) {
          if (stream.closed) return;
          const pending = stream.pending.shift();
          if (pending) pending.resolve({ value, done: false });
          else stream.queue.push(value);
        },
        close() {
          stream.closed = true;
          while (stream.pending.length) stream.pending.shift().resolve({ value: undefined, done: true });
        },
        error(error) {
          stream.failed = error;
          stream.closed = true;
          while (stream.pending.length) stream.pending.shift().reject(error);
        },
        get desiredSize() { return stream.highWaterMark - stream.queue.length; }
      };
      this.started = Promise.resolve(typeof source.start === "function" ? source.start(this.controller) : undefined);
    }
    getReader() {
      if (this.locked) throw new TypeError("ReadableStream is already locked");
      this.locked = true;
      const stream = this;
      return {
        read() { return stream._read(); },
        cancel(reason) { return stream.cancel(reason); },
        releaseLock() { stream.locked = false; }
      };
    }
    async _read() {
      await this.started;
      if (this.queue.length) return { value: this.queue.shift(), done: false };
      if (this.failed) throw this.failed;
      if (this.closed) return { value: undefined, done: true };
      if (!this.pulling && typeof this.source.pull === "function") {
        this.pulling = true;
        Promise.resolve(this.source.pull(this.controller)).finally(() => { this.pulling = false; });
      }
      return new Promise((resolve, reject) => this.pending.push({ resolve, reject }));
    }
    async cancel(reason) {
      this.closed = true;
      while (this.pending.length) this.pending.shift().resolve({ value: undefined, done: true });
      if (typeof this.source.cancel === "function") return this.source.cancel(reason);
    }
    [Symbol.asyncIterator]() {
      const reader = this.getReader();
      return { next: () => reader.read(), return: async () => { reader.releaseLock(); return { done: true }; } };
    }
  };
}
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class ImageData {
    constructor(dataOrWidth, widthOrHeight, height) {
      if (typeof dataOrWidth === "number") {
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height ?? this.data.length / (this.width * 4);
      }
    }
  };
}
