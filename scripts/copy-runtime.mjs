#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const targetIndex = args.indexOf("--target");
const target = targetIndex >= 0 ? args[targetIndex + 1] : null;
if (args[0] !== "copy" || !target) {
  console.error("Usage: wechat-miniprogram-pdf copy --target <mini-program-path>/vendor/wechat-miniprogram-pdf.js");
  process.exit(1);
}
const source = resolve(dirname(fileURLToPath(import.meta.url)), "../dist/index.cjs");
const destination = resolve(process.cwd(), target);
await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log(`Copied runtime to ${destination}`);
