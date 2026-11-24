// Synthetic fixture data. All names and locations are fictional.
import { featureSetJson } from "../support/arcade.mjs";

// A shelter in downtown Austin, used as the popup feature.
export const SHELTER_LONLAT = [-97.7431, 30.2672];

// Incidents at known distances from the shelter.
// 0.01 degrees of latitude is about 1.1 km.
export const INCIDENTS = featureSetJson({
  fields: [["OBJECTID", "OID"], ["CATEGORY", "String"]],
  geometryType: "esriGeometryPoint",
  features: [
    { attributes: { OBJECTID: 1, CATEGORY: "FLOODING" }, geometry: { x: -97.7431, y: 30.2700 } },     // ~0.3 km
    { attributes: { OBJECTID: 2, CATEGORY: "FLOODING" }, geometry: { x: -97.7431, y: 30.2780 } },     // ~1.2 km
    { attributes: { OBJECTID: 3, CATEGORY: "ROAD CLOSURE" }, geometry: { x: -97.7300, y: 30.2672 } }, // ~1.3 km
    { attributes: { OBJECTID: 4, CATEGORY: "WATER RESCUE" }, geometry: { x: -97.7431, y: 30.3000 } }, // ~3.6 km
    { attributes: { OBJECTID: 5, CATEGORY: "FLOODING" }, geometry: { x: -97.6500, y: 30.2672 } },     // ~9 km
  ],
});

// One evacuation zone covering the east half of the test area.
export const EVACUATION_ZONES = featureSetJson({
  fields: [["OBJECTID", "OID"], ["ZONE_ID", "String"]],
  geometryType: "esriGeometryPolygon",
  features: [{
    attributes: { OBJECTID: 1, ZONE_ID: "EZ-EAST-1" },
    geometry: { rings: [[[-97.73, 30.25], [-97.70, 30.25], [-97.70, 30.29], [-97.73, 30.29], [-97.73, 30.25]]] },
  }],
});

export const SHELTERS_TABLE = featureSetJson({
  fields: [["OBJECTID", "OID"], ["COUNTY", "String"], ["STATUS", "String"], ["CAPACITY", "Integer"], ["OCCUPANCY", "Integer"]],
  features: [
    { attributes: { OBJECTID: 1, COUNTY: "Travis", STATUS: "Open", CAPACITY: 200, OCCUPANCY: 150 } },
    { attributes: { OBJECTID: 2, COUNTY: "Travis", STATUS: "Full", CAPACITY: 100, OCCUPANCY: 98 } },
    { attributes: { OBJECTID: 3, COUNTY: "Travis", STATUS: "Closed", CAPACITY: 500, OCCUPANCY: 0 } },
    { attributes: { OBJECTID: 4, COUNTY: "Williamson", STATUS: "Open", CAPACITY: 300, OCCUPANCY: 60 } },
    { attributes: { OBJECTID: 5, COUNTY: "Hays", STATUS: "Standby", CAPACITY: 80, OCCUPANCY: 0 } },
  ],
});
