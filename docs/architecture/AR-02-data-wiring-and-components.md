# AR-02 — Data Wiring and Component Boundaries

> **Status:** Frozen (2026-07-03)  
> **Task:** AR-02 on `Project.canvas`  
> **Depends on:** [DC-01](../source-contracts/DC-01-source-contracts.md), [DC-02](../source-contracts/DC-02-source-state-display-policy.md), [AR-01](./AR-01-webstudio-runtime-architecture.md)

Maps each **UI component** to exactly one **backend source** (or chained chart calls). No duplicated monitoring logic.

---

## 1. Wiring principles

| # | Rule |
|---|------|
| 1 | One widget → one primary Lua `dataSource` function (unless chart chain below) |
| 2 | Widgets **never** call WebAPI directly — only via Webstudio `execfunction` → Lua |
| 3 | Widgets **never** merge or recompute health from multiple sources |
| 4 | Selection `Path` is the only cross-widget input (plus chart pen metadata from counter row) |
| 5 | Display formatting follows [DC-02](../source-contracts/DC-02-source-state-display-policy.md) only |
| 6 | `access` from `fetchObjProps` gates visibility — no bypass |

---

## 2. Component catalog

| Widget ID | Component | Primary source | Refresh | Task |
|-----------|-----------|----------------|---------|------|
| `hm-header` | App header + title | — (static) | — | UP-01 |
| `hm-process-state` | Process state strip | `ProcessState` | 30s | UP-02 |
| `hm-nav-tree` | Left navigation tree | `fetchNavigationTree` | 30s | UP-02 |
| `hm-overview-table` | Overview hierarchy table | `fetchNavigationTable` | 30s | UP-02 |
| `hm-detail-tabs` | Tab container | — (UI chrome) | — | UP-01 |
| `hm-props-panel` | Properties table/form | `fetchObjProps` | on select | UP-03 |
| `hm-counters-table` | Performance counters grid | `fetchPerformanceCountersTable` | on select | UP-04 |
| `hm-chart` | Trend chart shell | `createtrend` → `createtrendpen` → `readhistoricaldata` | on submit | UP-05 |
| `hm-logs-table` | Logs panel | `fetchLogTable` | on select | PPE-01 (optional) |

---

## 3. Per-component wiring

### 3.1 `hm-process-state` — Monitor availability

| Aspect | Specification |
|--------|---------------|
| **Source** | `ProcessState` |
| **Trigger** | Poll every 30s; also on screen load |
| **Input context** | `{}` (global) |
| **Output fields used** | `ProcessState` (raw string) |
| **Display** | DC-02 §2 — verbatim in header strip |
| **Forbidden** | Inferring down from empty overview table |

```json
{
  "id": "hm-process-state",
  "type": "text",
  "dataSource": {
    "library": "{{lib}}",
    "function": "ProcessState"
  },
  "refreshInterval": 30
}
```

---

### 3.2 `hm-nav-tree` — Topology and icons

| Aspect | Specification |
|--------|---------------|
| **Source** | `fetchNavigationTree` |
| **Trigger** | Poll 30s; refresh on overview filter change (if added PPE-02) |
| **Input context** | `{ "rootPath": "/System/Core" }` — confirm root in WR-01 |
| **Output fields** | `ObjectName`, `Path`, `Type`, `Image`, `children` |
| **User action** | Click node → set `selection.path` = node `Path` |
| **Forbidden** | Coloring nodes by client-derived health; use table for state |

**Boundary:** Tree owns **structure + icons only**. Health colors come from `hm-overview-table` or linked row highlight by matching `Path`.

---

### 3.3 `hm-overview-table` — Hierarchy health (primary)

| Aspect | Specification |
|--------|---------------|
| **Source** | `fetchNavigationTable` |
| **Trigger** | Poll 30s |
| **Input context** | `{ "rootPath": "/System/Core" }` |
| **Output fields** | `ObjectName`, `Path`, `Type`, `CommState`, `ObjectState`, `WorstState`, `State`, `Image` |
| **Display** | DC-02 §3 — per-column exact text + color |
| **Collapse rule** | DC-02 §3.3 — `WorstState === "Good"` subtrees collapsible |
| **User action** | Row click → `selection.path` = row `Path` → refresh props + counters |

```json
{
  "id": "hm-overview-table",
  "type": "table",
  "dataSource": {
    "library": "{{lib}}",
    "function": "fetchNavigationTable"
  },
  "columns": ["ObjectName", "Type", "CommState", "ObjectState", "WorstState", "State"],
  "refreshInterval": 30,
  "actions": {
    "onRowSelect": [
      { "id": "hm-props-panel", "type": "refresh" },
      { "id": "hm-counters-table", "type": "refresh" }
    ]
  }
}
```

**Forbidden:** Client-side `WorstState` calculation from `CommState` + `ObjectState`.

---

### 3.4 `hm-props-panel` — Selected object properties

| Aspect | Specification |
|--------|---------------|
| **Source** | `fetchObjProps` |
| **Trigger** | On `selection.path` change only (no poll) |
| **Input context** | `{ "path": "{{selection.path}}" }` |
| **Output fields** | `ObjectName`, `Type`, `ObjectID`, `ObjectIDExtended`, `Path`, `ConfigVersion`, `ClassVersion`, `Created`, `Modified`, `State`, `Image`, `access` |
| **Display** | DC-02 §4 — full compound `State` string |
| **Access** | If `access` denies read, show error from source — hide panel content |

**Boundary:** Props panel **only** displays `fetchObjProps`. No fields from navigation table mixed in.

---

### 3.5 `hm-counters-table` — Performance counters

| Aspect | Specification |
|--------|---------------|
| **Source** | `fetchPerformanceCountersTable` |
| **Trigger** | On `selection.path` change |
| **Input context** | `{ "path": "{{selection.path}}" }` |
| **Output fields** | `ObjectName`, `type`, `group`, `Value`, `Unit`, `penName`, `path`, `cList`, `cList.exists` |
| **Shapes** | Healthy (many rows + `cList`) vs bad datasource (health rows only) — DC-01 §6 |
| **User action** | Row select + “Submit to Chart” → pass row to chart chain |

**Boundary:** Counters table does **not** fetch history. Chart is separate widget chain.

---

### 3.6 `hm-chart` — Chart drill-down chain

Three-step chain on **Submit to Chart** (same as default HM):

```
User selects counter row
    → createtrend(context: { path, penName, ... })
    → createtrendpen(context: { trendId, penName, path, ... })
    → readhistoricaldata(context: { pens, startTime, endTime, aggregate, intervals })
```

| Step | Function | Input from | Parameters (frozen) |
|------|----------|------------|---------------------|
| 1 | `createtrend` | Selected counter row | `path`, shell metadata |
| 2 | `createtrendpen` | Row + trend id | `penName`, `path` |
| 3 | `readhistoricaldata` | Pen list | 1-day range, aggregate, T/V/Q intervals — DC-01 §7 |

**Boundary:** Chart widget **only** displays `readhistoricaldata` result. Pen list must match selected counter row — no extra pens invented.

---

### 3.7 `hm-logs-table` — Optional (v1 deferred)

| Aspect | Specification |
|--------|---------------|
| **Source** | `fetchLogTable` |
| **Status** | **Not wired in v1** unless PPE-01 promotes to scope |
| **Trigger** | On `selection.path` change |
| **Input context** | `{ "path": "{{selection.path}}" }` |

---

## 4. Shared selection state

| Key | Set by | Read by |
|-----|--------|---------|
| `selection.path` | `hm-nav-tree`, `hm-overview-table` | `hm-props-panel`, `hm-counters-table`, `hm-logs-table` |
| `selection.objectName` | optional mirror from click row | header subtitle only — not for data fetch |
| `chart.selectedRow` | `hm-counters-table` | `hm-chart` chain |
| `chart.pens` | `createtrendpen` output | `readhistoricaldata` input |

Implementation: Webstudio form hidden fields, widget context payload, or `onRowSelect` refresh actions (AR-01 §4.4).

---

## 5. Data flow diagram

```
ProcessState ──────────────────────────────► hm-process-state

fetchNavigationTree ───────────────────────► hm-nav-tree
        │ row/path click
        └──────────────────┐
                           ▼
fetchNavigationTable ─────► hm-overview-table
        │ row/path click
        ├──────────────────► selection.path
        │                        │
        │                        ├──► fetchObjProps ──────► hm-props-panel
        │                        │
        │                        └──► fetchPerformanceCountersTable ─► hm-counters-table
        │                                      │ Submit to Chart
        │                                      ▼
        │                               createtrend
        │                                      ▼
        │                               createtrendpen
        │                                      ▼
        └──────────────────────────── readhistoricaldata ─► hm-chart
```

**No cross-links** outside this diagram.

---

## 6. What lives where (boundaries)

| Concern | Layer | Must NOT appear in |
|---------|-------|-------------------|
| Health state values | `fetchNavigationTable` | Props panel, counters, chart |
| Object metadata | `fetchObjProps` | Overview table columns (except shared `Path`/`ObjectName` for join) |
| Counter values | `fetchPerformanceCountersTable` | Overview state columns |
| Historical V/Q/T | `readhistoricaldata` | Overview or props |
| Monitor running? | `ProcessState` | Per-object rows |
| Bayer colors | Widget styles (UP-01) | Lua layer |
| Collapse healthy branches | Overview widget logic (DC-02) | Lua layer |

**Join rule:** UI may **match rows by `Path`** across tree and table for highlight/collapse. Matching is not merging data.

---

## 7. Error and empty states

| Condition | Widget behavior |
|-----------|-----------------|
| `selection.path` empty | Props + counters show “Select an object” — no fetch |
| Lua returns error | Show error message from runtime — no placeholder rows |
| Empty table array | Show empty state — do not fabricate `Bad` |
| `fetchPerformanceCountersTable` minimal rows | Show health rows only (bad datasource case) |
| `access` denied | Respect `fetchObjProps.access` — hide or show denial |

---

## 8. Library placeholder

Until WR-01 finalizes identifiers:

```
lib = HealthMonitor        # reuse default HM library if deployment allows
# OR
lib = HealthMonitorBayer   # thin wrapper delegating to HM functions
```

All `dataSource.library` values use the same `{{lib}}` from deployment config.

---

## 9. Implementation checklist (UP phase)

- [ ] Each widget ID in §2 exists in compilation with single primary source
- [ ] `onRowSelect` refreshes props + counters only (not chart until submit)
- [ ] Chart chain uses counter row `penName` + `path` verbatim
- [ ] No widget calls `/api/v2/read` directly from browser
- [ ] DC-02 color map applied in table column renderers only
- [ ] `fetchLogTable` tab absent unless PPE-01 approved

---

## 10. References

- [DC-01](../source-contracts/DC-01-source-contracts.md) — field contracts
- [DC-02](../source-contracts/DC-02-source-state-display-policy.md) — display rules
- [AR-01](./AR-01-webstudio-runtime-architecture.md) — runtime layers
- Default Health Monitor — parity reference for wiring
