# VA-01 — Default vs Custom Parity Checklist

> **Status:** Frozen (2026-07-03)  
> **Task:** VA-01 on `Project.canvas`  
> **Compare:** Default Health Monitor URL vs Bayer custom URL ([WR-01](../deployment/WR-01-deployment-identifiers.md))

Side-by-side validation that the custom Bayer Health Monitor shows the **same data** as the default Health Monitor. Visual styling may differ (Bayer PMM); **semantics must not**.

---

## 1. Test setup

| Item | Default HM | Custom Bayer HM |
|------|------------|-----------------|
| URL | _(site default HM URL)_ | `…/apps/webstudio?secp=iwa&ssl=true&ctx=bayerhm&lib=HealthMonitor&func=BayerHealthMonitorMain` |
| Auth | IWA (domain Windows) | IWA — same user session |
| Browser | Same machine, same user | Same |
| Date / time | Record test timestamp | Same session |

**Tester:** _______________  
**Host:** _______________  
**Date:** _______________

---

## 2. Overview — hierarchy

Open both UIs without selecting an object. Compare Overview / navigation.

| # | Check | Default HM | Custom HM | Pass |
|---|-------|------------|-----------|------|
| H-01 | Same root paths visible under `/System/Core` | | | ☐ |
| H-02 | Same `ObjectName` per path | | | ☐ |
| H-03 | Same site / core / connector / datasource nodes | | | ☐ |
| H-04 | Same row count in hierarchy table (before collapse) | | | ☐ |
| H-05 | Unhealthy objects list matches (same paths) | | | ☐ |
| H-06 | Healthy branch collapse shows same objects when expanded | | | ☐ |

**Notes:** Custom UI may collapse `WorstState === "Good"` branches by default (DC-02) — expand before comparing H-04.

---

## 3. State values

For each **unhealthy** and **sample healthy** object, compare state columns.

| # | Check | Path tested | Default | Custom | Pass |
|---|-------|-------------|---------|--------|------|
| S-01 | `CommState` exact match | | | | ☐ |
| S-02 | `ObjectState` exact match | | | | ☐ |
| S-03 | `WorstState` exact match | | | | ☐ |
| S-04 | Compound `State` exact match | | | | ☐ |
| S-05 | `Good` shown as `Good` (not relabeled) | | | | ☐ |
| S-06 | `Bad` shown as `Bad` | | | | ☐ |
| S-07 | `Empty` shown as `Empty` | | | | ☐ |
| S-08 | `Disabled` shown as `Disabled` | | | | ☐ |
| S-09 | `Neutral` shown as `Neutral` | | | | ☐ |

**Allowed:** Different background colors (UP-01). **Not allowed:** Different text values.

---

## 4. Object properties (`fetchObjProps`)

Select the **same object** in both UIs. Record path: _______________

| # | Field | Default | Custom | Pass |
|---|-------|---------|--------|------|
| P-01 | ObjectName | | | ☐ |
| P-02 | Type | | | ☐ |
| P-03 | ObjectID | | | ☐ |
| P-04 | ObjectIDExtended | | | ☐ |
| P-05 | Path | | | ☐ |
| P-06 | ConfigVersion | | | ☐ |
| P-07 | ClassVersion | | | ☐ |
| P-08 | Created | | | ☐ |
| P-09 | Modified | | | ☐ |
| P-10 | State (full compound string) | | | ☐ |
| P-11 | Image | | | ☐ |
| P-12 | access | | | ☐ |

---

## 5. Performance counters (`fetchPerformanceCountersTable`)

Same selected object as §4.

### 5.1 Healthy object (many counters)

| # | Check | Pass |
|---|-------|------|
| C-01 | Same row count | ☐ |
| C-02 | Each row `ObjectName` matches | ☐ |
| C-03 | Each row `type` matches | ☐ |
| C-04 | Each row `Value` matches | ☐ |
| C-05 | Each row `Unit` matches | ☐ |
| C-06 | Each row `penName` matches | ☐ |
| C-07 | Each row `path` matches | ☐ |
| C-08 | `cList.exists` matches per row | ☐ |
| C-09 | Expanded `cList` children match | ☐ |

### 5.2 Bad datasource (health rows only)

Test path: _______________

| # | Check | Pass |
|---|-------|------|
| C-10 | Same minimal row set (no extra custom rows) | ☐ |
| C-11 | Health calculation rows match default | ☐ |
| C-12 | No synthetic counters in custom UI | ☐ |

---

## 6. Chart — Submit to Chart

Select the **same counter row** in both UIs. Record `penName`: _______________

| # | Check | Default | Custom | Pass |
|---|-------|---------|--------|------|
| CH-01 | Same pen name in chart legend | | | ☐ |
| CH-02 | Same pen path | | | ☐ |
| CH-03 | Time range = 1 day | | | ☐ |
| CH-04 | Same point count (or same empty) | | | ☐ |
| CH-05 | V values match at sample timestamps | | | ☐ |
| CH-06 | Q values match at sample timestamps | | | ☐ |
| CH-07 | No extra pens in custom chart | | | ☐ |

---

## 7. Process state

| # | Check | Default | Custom | Pass |
|---|-------|---------|--------|------|
| PS-01 | `ProcessState` raw text matches | | | ☐ |

---

## 8. Sign-off

| Result | Criteria |
|--------|----------|
| **PASS** | All critical checks pass (H-*, S-* for unhealthy paths, P-*, C-*, CH-*) |
| **CONDITIONAL** | Minor visual-only differences documented |
| **FAIL** | Any state text, property, counter, or chart data mismatch |

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Reviewer | | | |

---

## 9. Failure log

| Check ID | Path / context | Default value | Custom value | Action |
|----------|----------------|---------------|--------------|--------|
| | | | | |

---

## 10. References

- [DC-01](../source-contracts/DC-01-source-contracts.md) — source contracts
- [DC-02](../source-contracts/DC-02-source-state-display-policy.md) — display rules
- [WR-01](../deployment/WR-01-deployment-identifiers.md) — custom URL
- UP-02 through UP-05 implementation docs
