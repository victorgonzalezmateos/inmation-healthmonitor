# UP-02 — Overview Hierarchy Implementation

> **Status:** Implemented (2026-07-03)  
> **Task:** UP-02 on `Project.canvas`  
> **Compilation:** [`../../compilations/bayer-health-monitor-overview.json`](../../compilations/bayer-health-monitor-overview.json)

Answers: **which site / core / connector / datasource is unhealthy right now?**

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| `hm-header`, `hm-process-state`, `hm-nav-tree`, `hm-overview-table` | Properties, counters, chart (UP-03–05) |
| `fetchNavigationTable` as state source | Client-side health calculation |
| `fetchNavigationTree` for topology/icons | `fetchLogTable` |
| Collapse healthy / emphasize unhealthy (DC-02) | Custom login |

---

## 2. Layout

```
┌────────────────────────────────────────────────────────────────┐
│ hm-header — Bayer Health Monitor                    [#10384f]  │
│ hm-process-state — ProcessState: <raw>              [right]    │
├─────────────────┬──────────────────────────────────────────────┤
│ hm-nav-tree     │ hm-overview-table                            │
│ 28 cols         │ 66 cols                                      │
│ fetchNavTree    │ fetchNavigationTable                         │
│ structure+icons │ CommState, ObjectState, WorstState, State    │
└─────────────────┴──────────────────────────────────────────────┘
```

Grid: 96 columns × 64 rows (Webstudio standard from PMM references).

---

## 3. Data sources

| Widget | Function | Refresh | Context |
|--------|----------|---------|---------|
| `hm-process-state` | `ProcessState` | 30s | `{}` |
| `hm-nav-tree` | `fetchNavigationTree` | 30s | `{ "rootPath": "/System/Core" }` |
| `hm-overview-table` | `fetchNavigationTable` | 30s | `{ "rootPath": "/System/Core" }` |

`lib` / `ctx` placeholders: `HealthMonitor` / `bayerhm` — finalize in WR-01.

---

## 4. Tree + table coordination

| Behavior | Rule |
|----------|------|
| Tree shows structure | `ObjectName`, `Path`, `Type`, `Image` from `fetchNavigationTree` |
| Table shows health | State columns from `fetchNavigationTable` only |
| Node click | Sets `selectedPath` → refreshes table + downstream panels (AR-02) |
| Row click | Sets `selectedPath` → highlights tree node by matching `Path` |
| Tree health color | **No** — highlight selected path only (`#89d329` indicator) |
| Row emphasis | DC-02 colors on state columns; bold row when `WorstState !== "Good"` |

**Join key:** `Path` (exact string match between tree node and table row).

---

## 5. Collapse healthy branches (DC-02 §3.3)

Algorithm applied to `fetchNavigationTable` rows (hierarchical order preserved from source):

1. Group rows by parent path prefix (infer from `Path` segments under `/System/Core/...`).
2. For each branch, if **all descendant rows** have `WorstState === "Good"`, collapse branch by default.
3. Branches with any row where `WorstState !== "Good"` OR `CommState === "Bad"` OR `ObjectState === "Bad"` → **expanded**.
4. Operator can manually expand collapsed healthy branches (UI toggle).

**Forbidden:** Recomputing `WorstState` from other columns.

Compilation flag: `"collapseHealthyBranches": true`, `"collapseWhen": { "field": "WorstState", "value": "Good" }`.

---

## 6. Emphasize unhealthy

| Condition | Visual |
|-----------|--------|
| `WorstState` not `Good` | Row font-weight 600; state cell DC-02 colors |
| `CommState` or `ObjectState` is `Bad` | Same emphasis even if `WorstState` present |
| All `Good` in subtree | Collapsed + de-emphasized (muted text optional) |

Optional filter (PPE-02): “Show non-Good only” — hides `Good` rows without changing values.

---

## 7. State column rendering

Per [DC-02](../source-contracts/DC-02-source-state-display-policy.md) and [design-tokens.json](./design-tokens.json):

- Cell text = exact source value
- Background from `stateCellStyles` map by exact key
- `State` column: monospace, wrap, full compound string

---

## 8. Parity validation (VA-01 hooks)

Compare default Health Monitor Overview side-by-side:

- [ ] Same objects visible at each hierarchy level
- [ ] Same `CommState` / `ObjectState` / `WorstState` / `State` text per path
- [ ] Unhealthy objects equally visible when custom UI uses collapse defaults
- [ ] Selection on same path loads same props/counters in default vs custom

---

## 9. Deployment

1. Merge `compilations/bayer-health-monitor-overview.json` into full `dashboard_compilation` (WR-01).
2. Publish to Custom Properties on host object.
3. Open via `/apps/webstudio?secp=iwa&ssl=true&ctx=…&lib=…&func=…`
4. Validate against live inmation host; capture JSON snapshots for AR-02 appendix.

---

## 10. References

- [AR-02](../architecture/AR-02-data-wiring-and-components.md) — widget wiring
- [UP-01](./UP-01-pmm-bayer-visual-system.md) — visual tokens
- [DC-01](../source-contracts/DC-01-source-contracts.md) — `fetchNavigationTable` fields
- [DC-02](../source-contracts/DC-02-source-state-display-policy.md) — collapse rules
