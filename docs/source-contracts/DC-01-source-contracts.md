# DC-01 — Frozen Health Monitor Source Contracts

> **Status:** Frozen (2026-07-03)  
> **Task:** DC-01 on `Project.canvas`  
> **Rule:** Preserve raw source field names and state values. No client-side transformation or health calculation.

This document captures the **confirmed backend sources** used by the default inmation Health Monitor Webstudio app. The custom Bayer Health Monitor must consume these same sources — display and organize only.

---

## Contract principles

1. **Source fidelity** — Field names and state strings are shown exactly as returned by the backend Lua/data functions.
2. **No invented logic** — The UI must not compute health, roll up states, or remap enums unless DC-02 explicitly allows display-only formatting (still using source strings).
3. **Webstudio runtime** — Data flows through Webstudio widget `dataSource` bindings to Lua script library functions (via `/api/v2/execfunction` or equivalent Webstudio runtime).
4. **Auth** — Use existing Health Monitor / PMM URL pattern: `/apps/webstudio` with `secp=iwa`, `ssl=true`. No custom login screen.

---

## 1. `dashboard_compilation`

The root Webstudio compilation JSON for the Health Monitor screen.

| Aspect | Contract |
|--------|----------|
| **Role** | Defines screen layout, widget tree, tabs, and `dataSource` bindings to Lua functions |
| **Storage** | Published via Custom Properties on the target object (`CustomPropertyName` / `CustomPropertyValue` tables) |
| **Custom app** | Bayer Health Monitor will have its **own** compilation (new ctx/lib/func — WR-01), but must bind to the **same Lua data functions** listed below |
| **Preserve** | Widget `id`, `dataSource` function names, and binding keys as observed in default Health Monitor |

**Widgets expected to bind to frozen sources:**

| UI surface | Typical binding target |
|------------|------------------------|
| Overview / hierarchy | `fetchNavigationTable`, `fetchNavigationTree` |
| Object properties panel | `fetchObjProps` |
| Performance counters table | `fetchPerformanceCountersTable` |
| Logs panel (optional v1) | `fetchLogTable` |
| Chart drill-down | `createtrend`, `createtrendpen`, `readhistoricaldata` |
| Monitor availability | `ProcessState` (tag or function — see §2) |

---

## 2. `ProcessState`

Monitor process availability — whether the Health Monitor backend is running and serving data.

| Field | Type | Usage |
|-------|------|-------|
| `ProcessState` | string / enum | Display as-is. Indicates monitor process health. Used for top-level “is monitoring available?” indicators. |

**Display rule:** Show the raw `ProcessState` value. Do not derive Good/Bad from it in the client.

---

## 3. `fetchNavigationTree`

Topology and icons for the navigation hierarchy (sites, cores, connectors, datasources).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ObjectName` | string | yes | Node label |
| `Path` | string | yes | Absolute inmation object path |
| `Type` | string | yes | Object type / role |
| `Image` | string | optional | Icon reference for tree rendering |
| `children` | array | optional | Nested nodes (if returned as tree) |
| `id` | string | optional | Object identifier when provided |

**UI usage (UP-02):** Combine with `fetchNavigationTable` states for Overview — tree supplies structure and icons; table supplies health state per row.

---

## 4. `fetchNavigationTable`

Flat or hierarchical table of monitored objects with **health states** — primary source for “what is unhealthy right now?”

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ObjectName` | string | yes | Row label |
| `Path` | string | yes | Object path |
| `Type` | string | yes | Object type |
| `CommState` | string | yes | Communication state — see §8 |
| `ObjectState` | string | yes | Object state — see §8 |
| `WorstState` | string | yes | Rolled-up worst state — see §8 |
| `State` | string | conditional | Compound state string when present (e.g. `COMM_GOOD\|STATE_GOOD\|OBJ_ENABLED`) |
| `Image` | string | optional | Row icon |

**UI usage (UP-02):** Primary Overview data source. Collapse healthy branches visually; emphasize rows where `WorstState`, `CommState`, or `ObjectState` is not Good.

**Critical:** State columns are **source values**, not UI-computed.

---

## 5. `fetchObjProps`

Selected-object property panel — details for the currently selected hierarchy node.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ObjectName` | string | yes | |
| `Type` | string | yes | |
| `ObjectID` | string | yes | |
| `ObjectIDExtended` | string | optional | |
| `Path` | string | yes | |
| `ConfigVersion` | string | optional | |
| `ClassVersion` | string | optional | |
| `Created` | string/datetime | optional | As returned by source |
| `Modified` | string/datetime | optional | As returned by source |
| `State` | string | yes | Compound state text — preserve exactly (e.g. `COMM_ERROR\|STATE_ERROR\|OBJ_ENABLED`) |
| `Image` | string | optional | |
| `access` | string/object | optional | Backend access field — respect for visibility |

**UI usage (UP-03):** Property panel parity with default Health Monitor. **Never parse or shorten** compound `State` strings.

---

## 6. `fetchPerformanceCountersTable`

Performance counters and health-calculation rows for the selected object.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ObjectName` | string | yes | Counter or object name |
| `type` | string | yes | Row type discriminator |
| `group` | string | optional | Counter grouping |
| `Value` | number/string | yes | Counter value — display as returned |
| `Unit` | string | optional | Engineering unit |
| `penName` | string | optional | Chart pen identifier for Submit to Chart |
| `path` | string | optional | Tag/path backing the counter |
| `cList` | object | optional | Nested counter list |
| `cList.exists` | boolean | optional | Whether child counter list is present |

**Two observed shapes (both must be supported):**

1. **Healthy object** — Many counter rows with `cList` expansions.
2. **Bad datasource** — Only health-calculation rows (minimal row set).

**UI usage (UP-04):** Table parity with default Health Monitor. Row selection feeds chart drill-down (UP-05).

---

## 7. Chart calls — `createtrend`, `createtrendpen`, `readhistoricaldata`

Submit to Chart behavior from selected counter rows.

| Function | Role |
|----------|------|
| `createtrend` | Create chart shell / trend container for selected counter |
| `createtrendpen` | Add pen to chart using `penName`, `path`, and pen metadata from counter row |
| `readhistoricaldata` | Load historical V/Q/T series for chart display |

**Chart parameters (preserve defaults from default Health Monitor):**

| Parameter | Typical value | Notes |
|-----------|---------------|-------|
| Time range | 1 day | Default window |
| Aggregate | as per default | Do not invent aggregation |
| Intervals | T / V / Q | Time, Value, Quality arrays |
| Pen metadata | from `penName`, `path` | Must match selected counter row |

**UI usage (UP-05):** Replicate Submit to Chart — same pens, same interval semantics, same data source as default Health Monitor.

**WebAPI reference:** `POST /api/v2/readhistoricaldata` (see inmation Web API docs).

---

## 8. State value vocabulary (frozen strings)

Display policy detail is expanded in **DC-02**. For DC-01, these are the **raw source values** that must pass through unchanged:

### `CommState` / `ObjectState` / `WorstState`

| Value | Meaning (source-side) |
|-------|----------------------|
| `Good` | Healthy |
| `Empty` | No data / empty |
| `Disabled` | Disabled |
| `Bad` | Unhealthy |
| `Neutral` | Neutral / unknown |

### Compound `State` (on objects)

Pipe-delimited segments, e.g.:

```
COMM_GOOD|STATE_GOOD|OBJ_ENABLED
COMM_ERROR|STATE_ERROR|OBJ_ENABLED
```

**Rule:** Render the full string. Do not split and re-label unless DC-02 defines display-only formatting that still shows the source text.

---

## 9. `fetchLogTable` — OPTIONAL for v1

| Aspect | Decision |
|--------|----------|
| **v1 scope** | **Excluded by default** unless product owner requires logs in first release |
| **Role** | Log entries for selected object (healthy and bad examples exist in default HM) |
| **If deferred** | Track under PPE-01; no logs tab in v1 |
| **If included** | Add logs tab/detail panel using same source — no change to health logic |

**When included, expected fields (from default HM observation):**

| Field | Type | Notes |
|-------|------|-------|
| `timestamp` | datetime | Log event time |
| `message` | string | Log text |
| `severity` / `level` | string | As returned by source |
| `source` | string | optional |
| `ObjectName` | string | optional |

> **Action for PPE-01:** Capture live `fetchLogTable` response samples (healthy + bad datasource) before implementing.

---

## 10. Source → UI mapping index

| UI surface | Primary source(s) | Task |
|------------|-------------------|------|
| Monitor availability | `ProcessState` | AR-02 |
| Navigation tree / icons | `fetchNavigationTree` | UP-02 |
| Overview health table | `fetchNavigationTable` | UP-02 |
| Property panel | `fetchObjProps` | UP-03 |
| Counters table | `fetchPerformanceCountersTable` | UP-04 |
| Chart drill-down | `createtrend`, `createtrendpen`, `readhistoricaldata` | UP-05 |
| Logs (optional) | `fetchLogTable` | PPE-01 |

---

## 11. Validation hooks (for VA-01 / VA-02)

When comparing default vs custom UI:

- [ ] Same hierarchy paths and `ObjectName` values
- [ ] Same `CommState` / `ObjectState` / `WorstState` / compound `State` strings
- [ ] Same property fields from `fetchObjProps`
- [ ] Same counter rows and `cList` structure from `fetchPerformanceCountersTable`
- [ ] Same chart pens and historical data from chart calls
- [ ] No client-side health calculation
- [ ] No custom login — `secp=iwa`, `ssl=true`

---

## 12. Open items (not blocking DC-01 freeze)

| Item | Owner | Notes |
|------|-------|-------|
| Live response snapshots per function | AR-02 / UP phase | Attach JSON samples when connected to target inmation host |
| Final ctx/lib/func identifiers | WR-01 | Deployment URL parameters |
| DC-02 display policy | DC-02 | Done → [DC-02-source-state-display-policy.md](./DC-02-source-state-display-policy.md) |

---

## References

- [PROJECT_PLAN.md](../PROJECT_PLAN.md) — task breakdown
- [focus.md](../../focus.md) — project goals
- Default Health Monitor Webstudio app (source of captured contracts)
- inmation Web API: `/api/v2/execfunction`, `/api/v2/readhistoricaldata`
