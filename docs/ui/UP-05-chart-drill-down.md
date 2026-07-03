# UP-05 — Chart Drill-Down Parity

> **Status:** Implemented (2026-07-03)  
> **Task:** UP-05 on `Project.canvas`  
> **Compilation:** [`../../compilations/bayer-health-monitor-chart.json`](../../compilations/bayer-health-monitor-chart.json)

Replicates default Health Monitor **Submit to Chart** using `createtrend` → `createtrendpen` → `readhistoricaldata`.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| `hm-chart` widget + metadata strip | Custom aggregation logic |
| 3-step Lua chain (DC-01 §7) | Multiple unrelated pens |
| 1-day default range | Logs tab |
| T / V / Q intervals | Client-side history fetch |

---

## 2. User flow

```
Performance Counters tab
  → select counter row (penName, path, Unit, …)
  → click Submit to Chart
Chart tab
  → hm-chart runs dataSourceChain
  → displays historical series
```

Triggered by `hm-submit-chart-btn` `onClick` → `{ "id": "hm-chart", "type": "refresh" }` (UP-04).

---

## 3. Data source chain

### Step 1 — `createtrend`

| Input | From `selectedCounterRow` |
|-------|---------------------------|
| `path` | counter `path` |
| `penName` | counter `penName` |
| `ObjectName` | counter `ObjectName` |

**Output:** `trendId` — chart shell id for step 2.

### Step 2 — `createtrendpen`

| Input | Source |
|-------|--------|
| `trendId` | step 1 |
| `penName` | selected row |
| `path` | selected row |

**Output:** `pens[]` — pen list with metadata for step 3.

### Step 3 — `readhistoricaldata`

| Parameter | Value | Notes |
|-----------|-------|-------|
| `pens` | from step 2 | Must match selected counter |
| `timeRange` | `1d` | DC-01 default — do not change |
| `aggregate` | `default` | Same as default HM |
| `intervals` | `T`, `V`, `Q` | Time, Value, Quality arrays |

**Output:** Series for chart widget — `t[]`, `v[]`, `q[]` per pen.

---

## 4. Chart widget (`hm-chart`)

| Feature | Spec |
|---------|------|
| Type | Webstudio `chart` |
| Pens | From step 2 only — **no invented pens** |
| Legend | Shows `penName`, `path`, `Unit` from row metadata |
| Quality | `Q` interval displayed as quality bands when present |
| Colors | `#00bcff` primary, `#89d329` / `#10384f` alternates (UP-01) |
| Empty | Message until Submit to Chart |

### Metadata strip (`hm-chart-meta`)

Read-only footer: pen name, path, range, intervals — for operator audit (VA-02).

---

## 5. Parity parameters (frozen)

| Parameter | Default HM | Custom HM |
|-----------|------------|-----------|
| Time range | 1 day | 1 day |
| Aggregate | default | default |
| Intervals | T, V, Q | T, V, Q |
| Pen source | selected counter row | same row fields |
| History API | `readhistoricaldata` | same function |

**Forbidden:** Adding pens not from selected row; changing time window without default HM parity.

---

## 6. Error handling

| Condition | Behavior |
|-----------|----------|
| No `selectedCounterRow` | Empty chart + message |
| Row missing `penName`/`path` | Disable Submit (UP-04); chart not loaded |
| `readhistoricaldata` empty | Show “No historical data” — no synthetic points |
| Lua error | Display runtime error text |

---

## 7. Merge into `hm-detail-tabs`

```
hm-detail-tabs
  ├── Properties (UP-03)
  ├── Performance Counters (UP-04)
  └── Chart (UP-05)  ← this tab
```

Full dashboard: merge overview + properties tabs + counters tab + chart tab → publish (WR-01).

---

## 8. Parity checklist (VA-01)

- [ ] Same pen appears in default vs custom chart for same counter selection
- [ ] Same 1-day window
- [ ] Same V/Q/T point counts (or same empty result)
- [ ] Pen label matches `penName` from source row
- [ ] No extra pens in custom chart

---

## 9. References

- [DC-01 §7](../source-contracts/DC-01-source-contracts.md)
- [AR-02 §3.6](../architecture/AR-02-data-wiring-and-components.md)
- [UP-04](./UP-04-performance-counters.md) — Submit to Chart trigger
- [UP-01](./UP-01-pmm-bayer-visual-system.md) — chart colors
