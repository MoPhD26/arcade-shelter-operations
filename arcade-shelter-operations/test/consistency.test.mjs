// The same occupancy thresholds appear in the map style, the popup, and the
// dashboard. These tests fail if someone changes one and forgets the others.
import { test } from "node:test";
import assert from "node:assert/strict";
import { feature, runExpression } from "./support/arcade.mjs";

const COLORS = { Available: "#1E8449", Filling: "#CA6F1E", "At capacity": "#B03A2E" };

for (const occupancy of [0, 30, 59, 60, 75, 89, 90, 100]) {
  test(`style, popup, and dashboard agree at ${occupancy}% occupancy`, async () => {
    const attrs = { NAME: "A", STATUS: "Open", CAPACITY: 100, OCCUPANCY: occupancy };
    const category = await runExpression("visualization/shelter_status_category.arcade", { vars: { $feature: feature(attrs) } });
    const popup = await runExpression("popups/shelter_summary.arcade", { vars: { $feature: feature(attrs) } });
    const indicator = await runExpression("dashboards/beds_indicator_formatting.arcade", {
      vars: { $datapoint: { sum_CAPACITY: 100, sum_OCCUPANCY: occupancy } },
    });
    assert.ok(popup.text.includes(`color:${COLORS[category]}`), `popup color for ${category}`);
    assert.equal(indicator.middleTextColor, COLORS[category]);
  });
}
