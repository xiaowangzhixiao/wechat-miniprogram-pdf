import assert from "node:assert/strict";
import test from "node:test";
import { MiniDOMMatrix, MiniPath2D, replayPath } from "../src/polyfills.mjs";

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
