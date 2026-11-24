// Test harness: compile and run the .arcade files in this repo with the
// official Arcade engine from the ArcGIS Maps SDK for JavaScript.

import "./node-env.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createArcadeExecutor, createArcadeProfile } from "@arcgis/core/arcade.js";
import Graphic from "@arcgis/core/Graphic.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import Point from "@arcgis/core/geometry/Point.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const WGS84 = new SpatialReference({ wkid: 4326 });

// Each expression declares its profile in its header ("// Profile: ...").
// Profiles the SDK knows come from Esri's own definitions, so an expression
// that uses a variable its profile does not provide fails to compile.
// Attribute rules and Dashboards are not in the JavaScript SDK, so they are
// declared here from the Esri documentation.
const SDK_PROFILES = {
  "Visualization": "visualization",
  "Labeling": "labeling",
  "Popup": "popup",
  "Popup element": "popup-element",
  "Form calculation": "form-calculation",
  "Form constraint": "form-constraint",
  "Field calculation": "field-calculation",
};

const CUSTOM_PROFILES = {
  "Attribute rule": {
    variables: [
      { name: "$feature", type: "feature" },
      { name: "$originalFeature", type: "feature" },
      { name: "$datastore", type: "featureSetCollection" },
      { name: "$editcontext", type: "dictionary", properties: [{ name: "editType", type: "text" }] },
    ],
  },
  "Dashboard data expression": { variables: [] },
  "Dashboard advanced formatting": {
    variables: [
      {
        name: "$datapoint",
        type: "dictionary",
        properties: [
          { name: "sum_CAPACITY", type: "number" },
          { name: "sum_OCCUPANCY", type: "number" },
        ],
      },
    ],
  },
};

/** Read the "Profile:" line from an expression header. */
export function profileName(src) {
  const match = src.match(/^\/\/ Profile: (.+)$/m);
  if (!match) throw new Error("Expression header has no Profile line");
  return match[1].replace(/\s*\(.*\)\s*$/, "").trim();
}

export function profileFor(src) {
  const name = profileName(src);
  if (SDK_PROFILES[name]) return createArcadeProfile(SDK_PROFILES[name]);
  if (CUSTOM_PROFILES[name]) return CUSTOM_PROFILES[name];
  throw new Error(`Unknown profile "${name}"`);
}

export const KNOWN_PROFILES = [...Object.keys(SDK_PROFILES), ...Object.keys(CUSTOM_PROFILES)];

export function readExpression(relPath) {
  return readFileSync(join(ROOT, "expressions", relPath), "utf8");
}

// Replace every call to fnName(...) whose text matches `test` with `replacement`.
// Parentheses are matched properly, so nested calls like Portal(...) are handled.
function replaceCalls(src, fnName, test, replacement) {
  let out = "";
  let i = 0;
  while (true) {
    const start = src.indexOf(fnName + "(", i);
    if (start === -1) return out + src.slice(i);
    let depth = 0;
    let end = start + fnName.length;
    for (; end < src.length; end++) {
      if (src[end] === "(") depth++;
      else if (src[end] === ")" && --depth === 0) break;
    }
    const call = src.slice(start, end + 1);
    out += src.slice(i, start) + (test(call) ? replacement : call);
    i = end + 1;
  }
}

/**
 * Swap live data sources for in-memory fixtures.
 * sources: { "Incidents": featureSetJson, "portal": featureSetJson, ... }
 * Keys match a layer name in FeatureSetByName, or "portal" for FeatureSetByPortalItem.
 */
export function injectData(src, sources = {}) {
  for (const [name, fs] of Object.entries(sources)) {
    const literal = `FeatureSet(${JSON.stringify(fs)})`;
    if (name === "portal") {
      src = replaceCalls(src, "FeatureSetByPortalItem", () => true, literal);
    } else {
      src = replaceCalls(src, "FeatureSetByName", (c) => c.includes(`"${name}"`), literal);
    }
  }
  return src;
}

const cache = new Map();

/**
 * Run an expression file with the official Arcade engine.
 * vars:    profile variables, for example { $feature: feature({...}) }
 * sources: fixture data that replaces FeatureSetByName or FeatureSetByPortalItem
 * Results come back as plain JavaScript. A FeatureSet result comes back as an
 * array of rows (attribute objects) so tests can check it directly.
 */
export async function runExpression(relPath, { vars = {}, sources = {} } = {}) {
  const original = readExpression(relPath);
  const src = wrapFeatureSetResult(injectData(original, sources));
  if (!cache.has(src)) cache.set(src, await createArcadeExecutor(src, profileFor(original)));
  const result = await cache.get(src).executeAsync(vars, { spatialReference: WGS84 });
  if (Array.isArray(result) && result.every((r) => r && r.attributes)) {
    return result.map((r) => plain(r.attributes));
  }
  return plain(result);
}

// Arcade dictionaries come back as null-prototype objects. Copy them into
// ordinary objects so assert.deepEqual compares them normally.
function plain(value) {
  if (value == null || typeof value !== "object" || value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(plain);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
}

/** Compile without running. Throws on syntax errors or unknown variables. */
export async function compileExpression(relPath) {
  const src = readExpression(relPath);
  return createArcadeExecutor(src, profileFor(src));
}

// Wrap the script in a function so a FeatureSet result can be turned into rows.
function wrapFeatureSetResult(src) {
  return `function __expression() {\n${src}\n}\n` +
    `var __result = __expression()\n` +
    `if (TypeOf(__result) == "FeatureSet") {\n` +
    `  var __rows = []\n  for (var __f in __result) { Push(__rows, __f) }\n  return __rows\n}\n` +
    `return __result`;
}

// The shelter layer schema. A real layer always returns every field, with
// null for empty values, so test features do the same.
export const SHELTER_FIELDS = [
  "NAME", "STATUS", "SHELTER_TYPE", "COUNTY", "CAPACITY", "OCCUPANCY",
  "PCT_FULL", "LAST_INSPECTED", "OCC_UPDATED", "CLOSURE_REASON", "ZONE_ID",
];

/**
 * Build a $feature with the full shelter schema. Coordinates are WGS84
 * longitude and latitude. Dates are stored as epoch milliseconds, the way
 * feature services return them in JSON.
 */
export function feature(attributes = {}, lonLat = null) {
  const attrs = Object.fromEntries(SHELTER_FIELDS.map((f) => [f, null]));
  for (const [k, v] of Object.entries(attributes)) {
    attrs[k] = v instanceof Date ? v.getTime() : v;
  }
  const geometry = lonLat
    ? new Point({ x: lonLat[0], y: lonLat[1], spatialReference: WGS84 })
    : null;
  return new Graphic({ attributes: attrs, geometry });
}

/** Build FeatureSet JSON for injectData. */
export function featureSetJson({ fields, geometryType = "", features }) {
  return {
    fields: fields.map(([name, type]) => ({ name, type: `esriFieldType${type}` })),
    geometryType,
    spatialReference: { wkid: 4326 },
    features,
  };
}
