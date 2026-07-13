import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import test from "node:test";

test("mini-program runtime stays below a 2 MiB subpackage", async () => {
  const runtime = await stat(new URL("../dist/index.cjs", import.meta.url));
  assert.ok(runtime.size < 2 * 1024 * 1024, `runtime is ${runtime.size} bytes`);
});

test("bundle installs text encoding fallbacks before PDF.js initializes", () => {
  const script = `
    globalThis.TextDecoder = undefined;
    globalThis.TextEncoder = undefined;
    require(${JSON.stringify(new URL("../dist/index.cjs", import.meta.url).pathname)});
    const decoded = new globalThis.TextDecoder().decode(Uint8Array.from([0xe4, 0xb8, 0xad]));
    const encoded = Array.from(new globalThis.TextEncoder().encode("中"));
    if (decoded !== "中" || encoded.join(",") !== "228,184,173") process.exit(1);
  `;
  execFileSync(process.execPath, ["-e", script], { stdio: "pipe" });
});
