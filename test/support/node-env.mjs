// Lets the ArcGIS Maps SDK for JavaScript run Arcade in Node.js.
//
// The SDK is built for browsers. Two small shims are enough for Arcade:
// 1. fetch() for file:// URLs, so the geometry engine can load its WebAssembly.
// 2. A minimal document, because the in-thread worker fallback uses a
//    DocumentFragment only as an event dispatcher.

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import esriConfig from "@arcgis/core/config.js";

const require = createRequire(import.meta.url);
const coreDir = dirname(require.resolve("@arcgis/core/package.json"));
esriConfig.assetsPath = pathToFileURL(join(coreDir, "assets") + "/").href;

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("file:")) {
    const body = await readFile(fileURLToPath(url));
    const type = url.endsWith(".wasm") ? "application/wasm" : "application/octet-stream";
    return new Response(body, { headers: { "Content-Type": type } });
  }
  return nativeFetch(input, init);
};

if (!globalThis.document) {
  globalThis.document = { createDocumentFragment: () => new EventTarget() };
}
