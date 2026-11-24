import { test } from "node:test";
import assert from "node:assert/strict";
import { feature, runExpression } from "./support/arcade.mjs";

const category = (attrs) =>
  runExpression("visualization/shelter_status_category.arcade", { vars: { $feature: feature(attrs) } });
const label = (attrs) =>
  runExpression("labeling/shelter_label.arcade", { vars: { $feature: feature(attrs) } });

test("status category follows occupancy thresholds", async () => {
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 10 }), "Available");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 59 }), "Available");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 60 }), "Filling");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 89 }), "Filling");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 90 }), "At capacity");
  assert.equal(await category({ STATUS: "Full", CAPACITY: 100, OCCUPANCY: 100 }), "At capacity");
});

test("closed wins over occupancy, whatever the spelling", async () => {
  assert.equal(await category({ STATUS: " closed ", CAPACITY: 100, OCCUPANCY: 95 }), "Closed");
});

test("bad records get their own category", async () => {
  assert.equal(await category({ STATUS: "Open", CAPACITY: null, OCCUPANCY: 5 }), "Check data");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 0, OCCUPANCY: 0 }), "Check data");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 140 }), "Check data");
  assert.equal(await category({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: -1 }), "Check data");
});

test("label shows name and open beds on two lines", async () => {
  assert.equal(await label({ NAME: "Eastside Rec Center", STATUS: "Open", CAPACITY: 1500, OCCUPANCY: 200 }),
    "Eastside Rec Center\n1,300 beds open");
});

test("label handles singular, full, closed, and missing data", async () => {
  assert.equal(await label({ NAME: "A", STATUS: "Open", CAPACITY: 10, OCCUPANCY: 9 }), "A\n1 bed open");
  assert.equal(await label({ NAME: "A", STATUS: "Full", CAPACITY: 10, OCCUPANCY: 12 }), "A\n0 beds open");
  assert.equal(await label({ NAME: " A ", STATUS: "CLOSED", CAPACITY: 10, OCCUPANCY: 0 }), "A\nClosed");
  assert.equal(await label({ NAME: "A", STATUS: "Open" }), "A");
  assert.equal(await label({ STATUS: "Open" }), "Unnamed shelter");
});
