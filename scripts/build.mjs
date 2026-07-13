import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/index.mjs"],
  outfile: "dist/index.cjs",
  bundle: true,
  minify: true,
  format: "cjs",
  platform: "browser",
  target: ["es2020"],
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": '"production"'
  }
});
