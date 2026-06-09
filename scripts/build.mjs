import { existsSync } from "node:fs";
import { resolve } from "node:path";
import "./vite-net-use-shim.cjs";

const localEsbuild = resolve(".local-bin/esbuild.exe");

if (existsSync(localEsbuild)) {
  process.env.ESBUILD_BINARY_PATH = localEsbuild;
}

process.argv = [process.argv[0], "astro", "build"];
await import("../node_modules/astro/astro.js");
