# UP-04 — Performance Counters Detail

> **Status:** Implemented (2026-07-03)  
> **Task:** UP-04 on `Project.canvas`  
> **Compilation:** [`../../compilations/bayer-health-monitor-counters.json`](../../compilations/bayer-health-monitor-counters.json)

Displays `fetchPerformanceCountersTable` for the selected object — parity with default Health Monitor counters grid.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| `hm-counters-table` | Chart rendering (UP-05) |
| Healthy object — many counters + `cList` | Logs |
| Bad datasource — health rows only | Client-side counter calculation |
| Submit to Chart button (enables UP-05) | Property fields (UP-03) |

---

## 2. Trigger and context

| Event | Action |
|-------|--------|
| `selectedPath` set from Overview | Refresh `hm-counters-table` |
| No selection | Empty message — no fetch |

```json
{
  "lib": "HealthMonitor",
  "func": "fetchPerformanceCountersTable",
  "context": { "path": "{{selectedPath}}" }
}
```

Refresh: **on selection only**.

---

## 3. Table columns (DC-01 §6)

| Column | Field | Display |
|--------|-------|---------|
| ObjectName | `ObjectName` | Left align |
| type | `type` | Raw discriminator |
| group | `group` | As returned |
| Value | `Value` | Right align, tabular nums — **no conversion** |
| Unit | `Unit` | `#64748b` suffix style |
| penName | `penName` | For chart chain (UP-05) |
| path | `path` | Wrap, break-all |
| cList.exists | `cList.exists` | Boolean as returned |

---

## 4. Two source shapes

### 4.1 Healthy object

- Many counter rows returned
- Rows with `cList.exists === true` expand to show nested `cList` children
- Expansion is **display-only** — values from source, not aggregated in UI

### 4.2 Bad datasource

- Minimal row set — health-calculation rows only
- Show `minimalRowsMessage` banner — **do not** invent placeholder counters
- Same columns; empty optional fields shown as `—`

---

## 5. `cList` nested expansion

| Rule | Implementation |
|------|----------------|
| Expand when | `cList.exists` is true |
| Child rows | Rendered from source `cList` array |
| Fields | Same column mapping as parent rows |
| Forbidden | Summing child values into parent row |

Compilation: `"expandNested": { "field": "cList", "when": { "cList.exists": true } }`.

---

## 6. Row selection → Submit to Chart

| Step | Behavior |
|------|----------|
| User selects counter row | Store `selectedCounterRow` (full row object) |
| Submit button | Enabled when row has `penName` and/or `path` |
| Click Submit | Triggers `hm-chart` refresh (UP-05 chain) |

Preserves `penName`, `path`, `Value`, `Unit` for `createtrend` / `createtrendpen`.

---

## 7. Visual design (UP-01)

| Element | Token |
|---------|-------|
| Panel | White, `#ededed` border, `shadow-panel`, `radius-md` |
| Header row | `#f8fafc` |
| Body | 12px `#10384f` |
| Selected row | `2px solid #89d329` outline |
| Submit button | `#10384f` bg, white text, `radius-sm` |

---

## 8. Merge into `hm-detail-tabs`

Add `tab-counters` from `bayer-health-monitor-counters.json` to `hm-detail-tabs.tabs[]` alongside `tab-properties`:

```
hm-detail-tabs
  ├── Properties (UP-03)
  ├── Performance Counters (UP-04)  ← this tab
  └── Chart (UP-05, future)
```

---

## 9. Parity checklist (VA-01)

- [ ] Same counter rows as default HM for same `Path`
- [ ] Same `Value` / `Unit` / `penName` / `path` per row
- [ ] Bad datasource shows same minimal health rows only
- [ ] `cList` structure matches default expansion
- [ ] No synthetic counter rows

---

## 10. References

- [DC-01 §6](../source-contracts/DC-01-source-contracts.md)
- [AR-02 §3.5](../architecture/AR-02-data-wiring-and-components.md)
- [UP-01](./UP-01-pmm-bayer-visual-system.md)
- [UP-05](../PROJECT_PLAN.md) — chart chain (next task)
