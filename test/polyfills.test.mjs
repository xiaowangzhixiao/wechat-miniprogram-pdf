import assert from "node:assert/strict";
import test from "node:test";
import { MiniDOMMatrix, MiniPath2D, MiniTextDecoder, MiniTextEncoder, replayPath } from "../src/polyfills.mjs";

test("MiniTextDecoder supports the encodings used by PDF.js", () => {
  assert.equal(new MiniTextDecoder().decode(Uint8Array.from([0xef, 0xbb, 0xbf, 0xe4, 0xb8, 0xad, 0xf0, 0x9f, 0x98, 0x80])), "中😀");
  assert.equal(new MiniTextDecoder("utf-16be", { fatal: true }).decode(Uint8Array.from([0xfe, 0xff, 0x4e, 0x2d])), "中");
  assert.equal(new MiniTextDecoder("utf-16le", { fatal: true }).decode(Uint8Array.from([0xff, 0xfe, 0x2d, 0x4e])), "中");
  assert.throws(() => new MiniTextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from([0xff])), TypeError);
  assert.throws(() => new MiniTextDecoder("utf-16be", { fatal: true }).decode(Uint8Array.from([0xd8, 0x00])), TypeError);
});

test("MiniTextDecoder preserves an incomplete UTF-8 sequence while streaming", () => {
  const decoder = new MiniTextDecoder();
  assert.equal(decoder.decode(Uint8Array.from([0xe4, 0xb8]), { stream: true }), "");
  assert.equal(decoder.decode(Uint8Array.from([0xad])), "中");
});

test("MiniTextEncoder encodes UTF-8 and respects encodeInto capacity", () => {
  const encoder = new MiniTextEncoder();
  assert.deepEqual([...encoder.encode("A中😀")], [0x41, 0xe4, 0xb8, 0xad, 0xf0, 0x9f, 0x98, 0x80]);
  const destination = new Uint8Array(4);
  assert.deepEqual(encoder.encodeInto("中A", destination), { read: 2, written: 4 });
  assert.deepEqual([...destination], [0xe4, 0xb8, 0xad, 0x41]);
});

test("MiniDOMMatrix composes and inverts 2D transforms", () => {
  const matrix = new MiniDOMMatrix().translateSelf(10, 20).scaleSelf(2, 3);
  assert.deepEqual(matrix.transformPoint({ x: 4, y: 5 }), { x: 18, y: 35, z: 0, w: 1 });
  const original = matrix.inverse().transformPoint({ x: 18, y: 35 });
  assert.ok(Math.abs(original.x - 4) < 1e-9);
  assert.ok(Math.abs(original.y - 5) < 1e-9);
});

test("MiniPath2D records and replays commands", () => {
  const path = new MiniPath2D();
  path.moveTo(1, 2);
  path.lineTo(3, 4);
  path.closePath();
  const calls = [];
  const context = new Proxy({}, {
    get(_target, name) { return (...args) => calls.push([name, ...args]); }
  });
  replayPath(context, path);
  assert.deepEqual(calls, [["moveTo", 1, 2], ["lineTo", 3, 4], ["closePath"]]);
});
