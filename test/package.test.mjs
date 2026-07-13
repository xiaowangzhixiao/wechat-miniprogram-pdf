import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

test("mini-program runtime stays below a 2 MiB subpackage", async () => {
  const runtime = await stat(new URL("../dist/index.cjs", import.meta.url));
  assert.ok(runtime.size < 2 * 1024 * 1024, `runtime is ${runtime.size} bytes`);
});
