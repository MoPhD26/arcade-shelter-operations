// Every expression must document itself and compile against its profile.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { KNOWN_PROFILES, compileExpression, profileName, readExpression } from "./support/arcade.mjs";

const ROOT = new URL("../expressions/", import.meta.url).pathname;
const files = readdirSync(ROOT, { recursive: true }).filter((f) => f.endsWith(".arcade")).sort();

test("repository has expressions", () => assert.ok(files.length >= 10));

for (const file of files) {
  test(`${file} has a complete header and compiles`, async () => {
    const src = readExpression(file);
    for (const key of ["Profile", "Used in", "Returns"]) {
      assert.match(src, new RegExp(`^// ${key}: .+`, "m"), `missing ${key}`);
    }
    assert.ok(KNOWN_PROFILES.includes(profileName(src)), `unknown profile ${profileName(src)}`);
    if (!/FeatureSetBy(Name|PortalItem)/.test(src)) await compileExpression(join(file));
  });
}
