import { test } from "node:test";
import assert from "node:assert/strict";
import { runExpression } from "./support/arcade.mjs";
import { SHELTERS_TABLE } from "./fixtures/data.mjs";

test("county summary excludes closed shelters and computes percent full", async () => {
  const rows = await runExpression("dashboards/county_summary_data_expression.arcade", {
    sources: { portal: SHELTERS_TABLE },
  });
  const byCounty = Object.fromEntries(rows.map((r) => [r.COUNTY, r]));
  assert.deepEqual(Object.keys(byCounty), ["Hays", "Travis", "Williamson"]);
  assert.equal(byCounty.Travis.SHELTERS, 2);
  assert.equal(byCounty.Travis.CAPACITY, 300);
  assert.equal(byCounty.Travis.OCCUPANCY, 248);
  assert.equal(byCounty.Travis.BEDS_OPEN, 52);
  assert.equal(byCounty.Travis.PCT_FULL, 82.7);
  assert.equal(byCounty.Hays.PCT_FULL, 0);
});

const indicator = (sumCap, sumOcc) =>
  runExpression("dashboards/beds_indicator_formatting.arcade", {
    vars: { $datapoint: { sum_CAPACITY: sumCap, sum_OCCUPANCY: sumOcc } },
  });

test("indicator shows percent in use with a threshold color", async () => {
  const out = await indicator(2000, 1900);
  assert.equal(out.middleText, "95%");
  assert.equal(out.middleTextColor, "#B03A2E");
  assert.equal(out.bottomText, "100 beds open of 2,000");
  assert.equal(out.noValue, false);
  assert.equal((await indicator(100, 10)).middleTextColor, "#1E8449");
});

test("indicator shows no value instead of dividing by zero", async () => {
  assert.deepEqual(await indicator(0, 0), { noValue: true });
});
