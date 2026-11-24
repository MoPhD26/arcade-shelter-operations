import { test } from "node:test";
import assert from "node:assert/strict";
import { feature, runExpression } from "./support/arcade.mjs";
import { EVACUATION_ZONES } from "./fixtures/data.mjs";

const constraint = (attrs) =>
  runExpression("attribute-rules/constraint_occupancy_within_capacity.arcade", { vars: { $feature: feature(attrs) } });

test("constraint allows valid edits", async () => {
  assert.equal(await constraint({ CAPACITY: 100, OCCUPANCY: 100 }), true);
  assert.equal(await constraint({ CAPACITY: 100, OCCUPANCY: 0 }), true);
  assert.equal(await constraint({ CAPACITY: 100 }), true);
});

test("constraint blocks impossible numbers with a clear message", async () => {
  assert.deepEqual(await constraint({ CAPACITY: 100, OCCUPANCY: 101 }),
    { errorMessage: "Occupancy (101) cannot exceed capacity (100)." });
  assert.deepEqual(await constraint({ CAPACITY: 100, OCCUPANCY: -1 }), { errorMessage: "Occupancy cannot be negative." });
  assert.deepEqual(await constraint({ CAPACITY: 0, OCCUPANCY: 0 }), { errorMessage: "Capacity must be greater than zero." });
});

const timestamp = (feat, original, editType) =>
  runExpression("attribute-rules/calc_occupancy_timestamp.arcade", {
    vars: { $feature: feature(feat), $originalFeature: feature(original), $editcontext: { editType } },
  });

test("timestamp updates when occupancy changes", async () => {
  const before = Date.now();
  const stamp = await timestamp({ OCCUPANCY: 50 }, { OCCUPANCY: 40 }, "UPDATE");
  assert.ok(stamp instanceof Date && stamp.getTime() >= before - 1000);
});

test("timestamp is kept when other fields change", async () => {
  const old = new Date("2026-06-01T12:00:00Z");
  const stamp = await timestamp({ OCCUPANCY: 40, OCC_UPDATED: old }, { OCCUPANCY: 40 }, "UPDATE");
  // The test feature stores dates as epoch milliseconds, so the kept value is a number here.
  assert.equal(stamp, old.getTime());
});

test("timestamp on insert only when occupancy is reported", async () => {
  assert.ok((await timestamp({ OCCUPANCY: 5 }, {}, "INSERT")) instanceof Date);
  assert.equal(await timestamp({}, {}, "INSERT"), null);
});

const zone = (lonLat) =>
  runExpression("attribute-rules/calc_evacuation_zone.arcade", {
    vars: { $feature: feature({}, lonLat) },
    sources: { EvacuationZones: EVACUATION_ZONES },
  });

test("evacuation zone is assigned from the polygon the shelter sits in", async () => {
  assert.equal(await zone([-97.715, 30.27]), "EZ-EAST-1");
  assert.equal(await zone([-97.75, 30.27]), null);
});

const fullCheck = (attrs) =>
  runExpression("attribute-rules/validation_full_status.arcade", { vars: { $feature: feature(attrs) } });

test("validation flags shelters marked Full that are not full", async () => {
  assert.equal(await fullCheck({ STATUS: "Full", CAPACITY: 100, OCCUPANCY: 95 }), true);
  assert.equal(await fullCheck({ STATUS: "Full", CAPACITY: 100, OCCUPANCY: 40 }), false);
  assert.equal(await fullCheck({ STATUS: "full", CAPACITY: 100 }), false);
  assert.equal(await fullCheck({ STATUS: "Open", CAPACITY: 100, OCCUPANCY: 10 }), true);
});
