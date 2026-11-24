# Expression catalog

Generated from the header of each expression by `npm run catalog`. Do not edit by hand.

## Map styling

### [Shelter status category](../expressions/visualization/shelter_status_category.arcade)

Styles every shelter by how full it is, so a dispatcher can see at a glance where to send people. Bad records get their own symbol instead of hiding inside a normal category.

| | |
|---|---|
| **Profile** | Visualization |
| **Used in** | Map Viewer and ArcGIS Pro, unique values symbology |
| **Returns** | Text. One of Available, Filling, At capacity, Closed, Check data |
| **Fields** | STATUS, CAPACITY, OCCUPANCY |

## Labels

### [Shelter label](../expressions/labeling/shelter_label.arcade)

| | |
|---|---|
| **Profile** | Labeling |
| **Used in** | Map Viewer and ArcGIS Pro label classes |
| **Returns** | Text on two lines. Shelter name, then open beds or status |
| **Fields** | NAME, STATUS, CAPACITY, OCCUPANCY |

## Popups

### [Capacity chart](../expressions/popups/capacity_chart.arcade)

| | |
|---|---|
| **Profile** | Popup element (Arcade content) |
| **Used in** | Map Viewer popups |
| **Returns** | Dictionary. A media element with a pie chart of occupied and open beds |
| **Fields** | CAPACITY, OCCUPANCY |

### [Nearby incidents](../expressions/popups/nearby_incidents.arcade)

Uses a geodetic buffer so the 2 km radius is correct in Web Mercator maps.

| | |
|---|---|
| **Profile** | Popup |
| **Used in** | Map Viewer popups on the shelter layer |
| **Returns** | Text. Count of active incidents within 2 km, broken down by category |
| **Data** | Incidents layer in the same map, with a CATEGORY field |

### [Shelter summary](../expressions/popups/shelter_summary.arcade)

| | |
|---|---|
| **Profile** | Popup element (Arcade content) |
| **Used in** | Map Viewer popups and ArcGIS Field Maps |
| **Returns** | Dictionary. A rich text popup element with a color coded occupancy line |
| **Fields** | NAME, STATUS, CAPACITY, OCCUPANCY, SHELTER_TYPE |

## Field Maps and smart forms

### [Closure reason visibility](../expressions/forms/closure_reason_visible.arcade)

Only ask for a closure reason when the shelter is closed, so the form stays short.

| | |
|---|---|
| **Profile** | Form constraint |
| **Used in** | Field Maps smart forms, visibility rule for the CLOSURE_REASON field |
| **Returns** | Boolean. True shows the field |
| **Fields** | STATUS |

### [Inspection due](../expressions/forms/inspection_due.arcade)

Shelters are inspected once a year. Flags anything due in the next 30 days.

| | |
|---|---|
| **Profile** | Form calculation |
| **Used in** | Field Maps smart forms, read only INSPECTION_STATUS field |
| **Returns** | Text. Never inspected, Overdue, Due in N days, or Current |
| **Fields** | LAST_INSPECTED |

### [Percent full](../expressions/forms/percent_full.arcade)

| | |
|---|---|
| **Profile** | Form calculation |
| **Used in** | Field Maps and Map Viewer smart forms, calculated value for PCT_FULL |
| **Returns** | Number from 0 to 100, or null when inputs are missing |
| **Fields** | CAPACITY, OCCUPANCY |

## Field calculation

### [Normalize status](../expressions/field-calculation/normalize_status.arcade)

Fixes case and spacing ("  full " becomes "Full"). Unknown values are left as they are so a person can review them, instead of being guessed.

| | |
|---|---|
| **Profile** | Field calculation |
| **Used in** | ArcGIS Pro Calculate Field and Map Viewer field calculation on STATUS |
| **Returns** | Text. The standard spelling of the status, or the original value if unknown |
| **Fields** | STATUS |

## Attribute rules

### [Evacuation zone](../expressions/attribute-rules/calc_evacuation_zone.arcade)

Flags shelters that sit inside an evacuation zone, which should never be used.

| | |
|---|---|
| **Profile** | Attribute rule (calculation) |
| **Used in** | ArcGIS Pro geodatabase, field ZONE_ID, triggers on insert and when the shape changes |
| **Returns** | Text. The evacuation zone the shelter sits in, or null |
| **Data** | EvacuationZones polygon feature class in the same geodatabase, field ZONE_ID |

### [Occupancy timestamp](../expressions/attribute-rules/calc_occupancy_timestamp.arcade)

Tells the dashboard how fresh each occupancy number is. Edits to other fields, like a phone number, do not reset the clock.

| | |
|---|---|
| **Profile** | Attribute rule (calculation) |
| **Used in** | ArcGIS Pro geodatabase, field OCC_UPDATED, triggers on insert and update |
| **Returns** | Date. Now when occupancy is new or changed, otherwise the existing value |
| **Fields** | OCCUPANCY, OCC_UPDATED |

### [Occupancy within capacity](../expressions/attribute-rules/constraint_occupancy_within_capacity.arcade)

Blocks impossible numbers at the database, whatever app the edit comes from.

| | |
|---|---|
| **Profile** | Attribute rule (constraint) |
| **Used in** | ArcGIS Pro geodatabase, triggers on insert and update |
| **Returns** | True to allow the edit, or a dictionary with an errorMessage to block it |
| **Fields** | CAPACITY, OCCUPANCY |

### [Full status check](../expressions/attribute-rules/validation_full_status.arcade)

A shelter marked Full while under 90 percent occupied is probably out of date. This is a judgment call, so it is a validation rule (flag it) and not a constraint (block it).

| | |
|---|---|
| **Profile** | Attribute rule (validation) |
| **Used in** | ArcGIS Pro geodatabase, run on demand with Evaluate Rules |
| **Returns** | True when valid, false to create an error for review |
| **Fields** | STATUS, CAPACITY, OCCUPANCY |

## Dashboards

### [Beds in use indicator](../expressions/dashboards/beds_indicator_formatting.arcade)

| | |
|---|---|
| **Profile** | Dashboard advanced formatting (indicator) |
| **Used in** | ArcGIS Dashboards indicator with statistics sum_CAPACITY and sum_OCCUPANCY |
| **Returns** | Dictionary of indicator display properties |
| **Fields** | $datapoint.sum_CAPACITY, $datapoint.sum_OCCUPANCY |

### [County summary](../expressions/dashboards/county_summary_data_expression.arcade)

Closed shelters are excluded so the numbers reflect beds people can use.

| | |
|---|---|
| **Profile** | Dashboard data expression |
| **Used in** | ArcGIS Dashboards, as the data source for a table or serial chart |
| **Returns** | FeatureSet. One row per county with shelters, beds, and percent full |
| **Data** | Shelters hosted feature layer (replace the item ID below) |
