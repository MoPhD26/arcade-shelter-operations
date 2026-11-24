import { test } from "node:test";
import assert from "node:assert/strict";
import { feature, runExpression } from "./support/arcade.mjs";
import { INCIDENTS, SHELTER_LONLAT } from "./fixtures/data.mjs";

test("summary popup is a text element with color coded occupancy", async () => {
  const el = await runExpression("popups/shelter_summary.arcade", {
    vars: { $feature: feature({ NAME: "Eastside Rec Center", STATUS: "Open", SHELTER_TYPE: "Pet Friendly", CAPACITY: 200, OCCUPANCY: 190 }) },
  });
  assert.equal(el.type, "text");
  assert.match(el.text, /<b>Eastside Rec Center<\/b>/);
  assert.match(el.text, /Pet Friendly shelter/);
  assert.match(el.text, /color:#B03A2E"><b>95% full/);
  assert.match(el.text, /10 of 200 beds open/);
});

test("summary popup copes with missing occupancy", async () => {
  const el = await runExpression("popups/shelter_summary.arcade", { vars: { $feature: feature({ NAME: "A" }) } });
  assert.match(el.text, /Occupancy not reported/);
  assert.match(el.text, /General shelter. Status: <b>Unknown<\/b>/);
});

test("capacity chart is a media element with occupied and open beds", async () => {
  const el = await runExpression("popups/capacity_chart.arcade", {
    vars: { $feature: feature({ CAPACITY: 1200, OCCUPANCY: 300 }) },
  });
  assert.equal(el.type, "media");
  assert.deepEqual(el.attributes, { Occupied: 300, Open: 900 });
  assert.equal(el.mediaInfos[0].type, "piechart");
  assert.equal(el.mediaInfos[0].title, "1,200 beds total");
});

test("capacity chart never shows negative open beds", async () => {
  const el = await runExpression("popups/capacity_chart.arcade", { vars: { $feature: feature({ CAPACITY: 100, OCCUPANCY: 130 }) } });
  assert.deepEqual(el.attributes, { Occupied: 100, Open: 0 });
});

test("capacity chart falls back to a note without data", async () => {
  const el = await runExpression("popups/capacity_chart.arcade", { vars: { $feature: feature({ CAPACITY: 0 }) } });
  assert.equal(el.type, "text");
});

test("nearby incidents counts only those within 2 km, grouped by category", async () => {
  const out = await runExpression("popups/nearby_incidents.arcade", {
    vars: { $feature: feature({}, SHELTER_LONLAT) },
    sources: { Incidents: INCIDENTS },
  });
  assert.equal(out, "3 active incidents within 2 km\n  Flooding: 2\n  Road Closure: 1");
});

test("nearby incidents reports none when the area is clear", async () => {
  const out = await runExpression("popups/nearby_incidents.arcade", {
    vars: { $feature: feature({}, [-98.5, 29.4]) },
    sources: { Incidents: INCIDENTS },
  });
  assert.equal(out, "No active incidents within 2 km");
});
