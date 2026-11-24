import { test } from "node:test";
import assert from "node:assert/strict";
import { feature, runExpression } from "./support/arcade.mjs";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const run = (file, attrs) => runExpression(file, { vars: { $feature: feature(attrs) } });

test("percent full is rounded and capped at 100", async () => {
  assert.equal(await run("forms/percent_full.arcade", { CAPACITY: 300, OCCUPANCY: 100 }), 33);
  assert.equal(await run("forms/percent_full.arcade", { CAPACITY: 100, OCCUPANCY: 130 }), 100);
});

test("percent full is null rather than wrong when inputs are missing", async () => {
  assert.equal(await run("forms/percent_full.arcade", { CAPACITY: 0, OCCUPANCY: 5 }), null);
  assert.equal(await run("forms/percent_full.arcade", { CAPACITY: 100 }), null);
  assert.equal(await run("forms/percent_full.arcade", { CAPACITY: 100, OCCUPANCY: -3 }), null);
});

test("closure reason only appears for closed shelters", async () => {
  assert.equal(await run("forms/closure_reason_visible.arcade", { STATUS: "Closed" }), true);
  assert.equal(await run("forms/closure_reason_visible.arcade", { STATUS: " closed" }), true);
  assert.equal(await run("forms/closure_reason_visible.arcade", { STATUS: "Open" }), false);
  assert.equal(await run("forms/closure_reason_visible.arcade", {}), false);
});

test("inspection status covers every case", async () => {
  const f = "forms/inspection_due.arcade";
  assert.equal(await run(f, {}), "Never inspected");
  assert.equal(await run(f, { LAST_INSPECTED: daysAgo(30) }), "Current");
  assert.equal(await run(f, { LAST_INSPECTED: daysAgo(400) }), "Overdue");
  assert.match(await run(f, { LAST_INSPECTED: daysAgo(350) }), /^Due in 1[56] days$/);
});

test("inspection status accepts dates stored as epoch numbers", async () => {
  assert.equal(await run("forms/inspection_due.arcade", { LAST_INSPECTED: daysAgo(400).getTime() }), "Overdue");
});

test("status normalization fixes case and spacing but never guesses", async () => {
  const f = "field-calculation/normalize_status.arcade";
  assert.equal(await run(f, { STATUS: "  full " }), "Full");
  assert.equal(await run(f, { STATUS: "STANDBY" }), "Standby");
  assert.equal(await run(f, { STATUS: "Open" }), "Open");
  assert.equal(await run(f, { STATUS: "Opened" }), "Opened");
  assert.equal(await run(f, { STATUS: "   " }), null);
  assert.equal(await run(f, {}), null);
});
