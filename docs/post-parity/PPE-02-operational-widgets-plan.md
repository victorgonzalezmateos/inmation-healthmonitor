# PPE-02 — Bayer Operational Widgets Plan

> **Status:** Frozen (2026-07-03)  
> **Task:** PPE-02 on `Project.canvas`  
> **Phase:** Post-parity enhancements (v2+) — **plan only**, not in current compilation

Optional operator widgets that **organize and filter** source data. Must **not** calculate health (VA-02 / DC-02).

---

## 1. Principles

| Allowed | Forbidden |
|---------|-----------|
| Filter/sort by source `WorstState`, `CommState`, etc. | Compute worst-of from multiple columns |
| Count rows where source state === `Good` | Invent health scores |
| Collapse/expand by source values | Custom login or auth widgets |
| Quick navigation to existing tabs | Duplicate fetch* in new Lua |

---

## 2. Proposed widgets (v2 backlog)

| ID | Widget | Source | Behavior |
|----|--------|--------|----------|
| W-01 | **Unhealthy-first summary** | `fetchNavigationTable` | Banner: count paths where `WorstState !== "Good"` — count from source rows only |
| W-02 | **Site / core filter** | `fetchNavigationTable` | Dropdown filter on path segment; hides rows (no value change) |
| W-03 | **Collapsed healthy branch counts** | `fetchNavigationTable` | Show “N healthy” per collapsed branch — N = row count with `WorstState === "Good"` |
| W-04 | **Quick links strip** | selection state | Buttons: jump to Properties / Counters / Chart tabs |
| W-05 | **Operator notes** | local/session only | Sticky notes per `Path` — **not** mixed into health state; optional, low priority |

---

## 3. Layout sketch (v2)

```
┌─────────────────────────────────────────────────────────┐
│ hm-header + ProcessState                                │
├─────────────────────────────────────────────────────────┤
│ W-01 Unhealthy summary: 3 non-Good (from table)         │
│ W-02 [Site ▼] [Core ▼]  W-04 [Props][Counters][Chart]  │
├──────────────┬──────────────────────────────────────────┤
│ hm-nav-tree  │ hm-overview-table (+ W-03 collapse counts)│
├──────────────┴──────────────────────────────────────────┤
│ hm-detail-tabs (Properties | Counters | Chart | Logs?)  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Implementation order (recommended)

1. **W-04** Quick links — lowest risk, no new data sources  
2. **W-02** Site/core filter — filter only  
3. **W-01** Unhealthy summary — simple aggregate count on loaded table  
4. **W-03** Collapsed healthy counts — extends UP-02 collapse UX  
5. **W-05** Operator notes — only if operators request  

---

## 5. Data wiring (all widgets)

| Widget | New Lua? | Source |
|--------|----------|--------|
| W-01 | No | Client count on `fetchNavigationTable` response |
| W-02 | No | Filter in-memory table rows |
| W-03 | No | Count on collapsed subtree rows |
| W-04 | No | Tab switch actions only |
| W-05 | No | Browser localStorage keyed by `Path` |

---

## 6. VA-02 compliance

Each widget must pass [VA-02](../validation/VA-02-audit-friendly-behavior.md) review:

- [ ] No F-01 health calculation patterns  
- [ ] Displayed counts trace to visible source rows  
- [ ] Filters hide rows without mutating state text  

---

## 7. References

- [UP-02](../ui/UP-02-overview-hierarchy.md) — collapse behavior baseline
- [DC-02](../source-contracts/DC-02-source-state-display-policy.md) — display-only rules
- [PPE-01](./PPE-01-logs-integration-plan.md) — logs tab (v2)
