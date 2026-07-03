# VA-02 — Audit-Friendly Behavior Validation

> **Status:** Frozen (2026-07-03)  
> **Task:** VA-02 on `Project.canvas`  
> **Depends on:** [VA-01](./VA-01-parity-checklist.md)

Confirms the custom Bayer Health Monitor is **audit-friendly**: no invented health logic, no state transformation, no custom auth, all data traceable to default Health Monitor sources.

---

## 1. Audit principles (pass/fail criteria)

| # | Principle | Pass condition |
|---|-----------|----------------|
| A-01 | No client-side health calculation | UI never computes Good/Bad/WorstState from other fields |
| A-02 | No state transformation | Displayed state text === source string (DC-02) |
| A-03 | No invented monitoring logic | No new Lua fetch* implementations in custom lib |
| A-04 | No custom login | Only `secp=iwa`; no login form or token UI |
| A-05 | Source traceability | Every data field maps to DC-01 function + field |
| A-06 | No synthetic data | Empty/error states don't fabricate rows |

---

## 2. Static code audit (repository review)

Reviewed: `compilations/`, `docs/`, `src/` (2026-07-03).

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| ST-01 | Compilations bind only to `HealthMonitor` lib | All `dataSource.lib` = `HealthMonitor` | **PASS** |
| ST-02 | No custom Lua in repo | No `.lua` files; no new fetch* impl | **PASS** |
| ST-03 | `collapseWhen` uses source `WorstState` only | `bayer-health-monitor-overview.json` | **PASS** |
| ST-04 | `emphasizeWhen` reads source columns only | Same file — no derived fields | **PASS** |
| ST-05 | State styles keyed by exact value | `stateCellStyles` map Good/Bad/… | **PASS** |
| ST-06 | Chart chain uses HM functions only | createtrend → createtrendpen → readhistoricaldata | **PASS** |
| ST-07 | No `secp=token` in deployment docs | [WR-01](../deployment/WR-01-deployment-identifiers.md) | **PASS** |
| ST-08 | React `src/` not used for production data | AR-01: Webstudio is delivery runtime | **PASS** |
| ST-09 | `respectAccessField` on props panel | `bayer-health-monitor-properties.json` | **PASS** |
| ST-10 | No `fetchLogTable` in v1 compilations | Deferred per DC-01 / PPE-01 | **PASS** |

---

## 3. Data lineage matrix

Every displayed datum must trace to a DC-01 source:

| UI element | Widget | Source function | Source field(s) | Doc |
|------------|--------|-----------------|-----------------|-----|
| Process banner | `hm-process-state` | `ProcessState` | `ProcessState` | DC-01 §2 |
| Nav tree | `hm-nav-tree` | `fetchNavigationTree` | ObjectName, Path, Type, Image | DC-01 §3 |
| Overview table | `hm-overview-table` | `fetchNavigationTable` | CommState, ObjectState, WorstState, State | DC-01 §4 |
| Properties | `hm-props-panel` | `fetchObjProps` | all property fields | DC-01 §5 |
| Counters | `hm-counters-table` | `fetchPerformanceCountersTable` | Value, Unit, penName, … | DC-01 §6 |
| Chart | `hm-chart` | `readhistoricaldata` | T, V, Q arrays | DC-01 §7 |

**No orphan UI fields** — verified against [AR-02](../architecture/AR-02-data-wiring-and-components.md).

---

## 4. Forbidden patterns — audit checklist

Manual review during deployment / code review:

| # | Forbidden pattern | Where to look | Pass |
|---|-------------------|---------------|------|
| F-01 | `if (commState && objectState) worstState = …` | Widget scripts, Lua | ☐ |
| F-02 | State label map `{ Bad: "Unhealthy" }` | Compilations, i18n | ☐ |
| F-03 | Custom `/api/` proxy in browser | `src/`, compilation | ☐ |
| F-04 | Login form widget | Full compilation | ☐ |
| F-05 | `grant_type=password` / OAuth UI | URL, compilation | ☐ |
| F-06 | Hardcoded Good/Bad rows | Table data, mock JSON | ☐ |
| F-07 | Client aggregation of counters | Table transforms | ☐ |
| F-08 | Extra pens not from selected row | Chart config | ☐ |
| F-09 | New Lua lib reimplementing fetch* | inmation publish | ☐ |
| F-10 | `secp` other than `iwa` in operator URL | WR-01, bookmarks | ☐ |

---

## 5. Runtime verification (on inmation host)

Execute after publish. Use browser dev tools + side-by-side with default HM.

| # | Test | Method | Expected | Pass |
|---|------|--------|----------|------|
| R-01 | Network calls on Overview load | DevTools → Network | execfunction to HM lib only; no custom REST auth | ☐ |
| R-02 | No login redirect | Open custom URL cold | IWA SSO; no password form | ☐ |
| R-03 | State text in DOM | Inspect table cell | Inner text === default HM for same path | ☐ |
| R-04 | Compound State in props | Copy State field | Character-identical to default HM | ☐ |
| R-05 | Chart pen count | After Submit to Chart | Same pen count as default HM | ☐ |
| R-06 | Empty selection | No object selected | Empty message; no fake rows | ☐ |
| R-07 | Bad datasource counters | Select bad DS path | Health rows only; matches default HM | ☐ |

---

## 6. Documentation cross-check

| Document | Audit rule enforced |
|----------|---------------------|
| [DC-01](../source-contracts/DC-01-source-contracts.md) | Source fidelity, no invented logic |
| [DC-02](../source-contracts/DC-02-source-state-display-policy.md) | Display-only formatting |
| [AR-01](../architecture/AR-01-webstudio-runtime-architecture.md) | IWA only, reuse HM lib |
| [AR-02](../architecture/AR-02-data-wiring-and-components.md) | One widget → one source |
| [VA-01](./VA-01-parity-checklist.md) | Runtime parity |

---

## 7. Sign-off

| Result | Criteria |
|--------|----------|
| **PASS** | ST-* all PASS; F-* and R-* reviewed with no failures |
| **FAIL** | Any invented logic, transformed state, or custom auth found |

| Role | Name | Date |
|------|------|------|
| Auditor | | |
| Technical reviewer | | |

---

## 8. Findings log

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| — | — | None at freeze date | — |

---

## 9. References

- Project canvas VA-02 task text
- [VA-01](./VA-01-parity-checklist.md) — data parity (companion)
