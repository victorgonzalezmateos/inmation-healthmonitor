# DC-02 — Source-State Display Policy

> **Status:** Frozen (2026-07-03)  
> **Task:** DC-02 on `Project.canvas`  
> **Depends on:** [DC-01-source-contracts.md](./DC-01-source-contracts.md)  
> **Rule:** Display source states faithfully. Visual styling is allowed; semantic transformation is not.

This document defines **how the Bayer Health Monitor UI presents state values** from backend sources without changing their meaning, recalculating health, or inventing labels.

---

## 1. Core policy

| Allowed | Forbidden |
|---------|-----------|
| Show the **exact source string** in labels, cells, and tooltips | Mapping `Bad` → `Unhealthy` or any synonym swap |
| Apply **color/icon** by exact string match on source value | Computing worst-of columns client-side |
| **Collapse/hide** healthy branches using source `WorstState === "Good"` | Deriving `WorstState` from `CommState` + `ObjectState` |
| **Emphasize** rows where source state ≠ `Good` | Treating missing field as `Bad` |
| Monospace or wrapped text for long compound `State` strings | Parsing compound `State` to change displayed meaning |
| Show `ProcessState` verbatim in status banner | Inferring monitor down from empty tables alone |

**Audit principle:** An operator comparing default Health Monitor vs custom UI must see the **same state text** in the same contexts. Visual treatment may differ (Bayer theme); semantics may not.

---

## 2. `ProcessState` display

Used for top-level monitor availability (banner, header chip, or status strip).

| Source value (examples) | Display |
|-------------------------|---------|
| Any string returned by backend | Show **full raw value** as primary text |
| Empty / null / missing | Show `—` or `Empty` with neutral styling — **do not** assume Bad |

**Layout:**
- Persistent strip below app header (Bayer `#10384F` bar) or dedicated status pill
- Text: `ProcessState: <raw value>`
- No icon unless value is a known enum from DC-01 capture — still show text alongside icon

**Styling (exact match only):**

| `ProcessState` value | Suggested treatment |
|----------------------|---------------------|
| Values containing `Good` or `Running` (if observed in capture) | Neutral/green accent — text unchanged |
| Values containing `Bad`, `Error`, `Stopped` (if observed) | Warning accent — text unchanged |
| All other values | Neutral — text unchanged |

> If live capture reveals different `ProcessState` strings, add rows here — never replace the displayed string.

---

## 3. `CommState` / `ObjectState` / `WorstState` display

From `fetchNavigationTable` (Overview) and any table showing these columns.

### 3.1 Text rule

Always render the **source column value** as the cell text:

```
Good | Bad | Empty | Disabled | Neutral
```

Case-sensitive match to DC-01 vocabulary. No title-casing, no localization.

### 3.2 Visual treatment (Bayer theme)

Apply style by **exact string equality** on the column being rendered:

| Source value | Text shown | Background / indicator | PMM Bayer notes |
|--------------|------------|------------------------|-----------------|
| `Good` | `Good` | Light green tint (`#d4f1d4` or Bayer green accent dot) | Healthy — de-emphasize in hierarchy |
| `Bad` | `Bad` | Light red tint (`#f1d4d4`) | Unhealthy — emphasize row/branch |
| `Empty` | `Empty` | Light gray (`#f0edf0`) | No data |
| `Disabled` | `Disabled` | Muted gray, optional strikethrough on row | Not active |
| `Neutral` | `Neutral` | Neutral white/gray | Unknown / neutral |

**Column-specific:** When multiple columns appear (`CommState`, `ObjectState`, `WorstState`), each cell uses its **own** source value for both text and color. Do not show only `WorstState` while hiding others in detail views.

### 3.3 Overview hierarchy behavior (UP-02)

| Rule | Implementation |
|------|----------------|
| Collapse healthy branches | Branch collapsible when **every visible row** in subtree has `WorstState === "Good"` |
| Emphasize unhealthy | Expand branches containing any row where `WorstState !== "Good"` OR `CommState === "Bad"` OR `ObjectState === "Bad"` |
| Sort within level | Optional: sort by `WorstState` severity order `Bad` → `Empty` → `Disabled` → `Neutral` → `Good` — **display text still source value** |
| Filter | Allowed: “show non-Good only” filter — hides `Good` rows, does not change their values |

**Severity order is for sort/filter only** — not a computed health score.

---

## 4. Compound `State` display (`fetchObjProps`, `fetchNavigationTable`)

Examples:

```
COMM_GOOD|STATE_GOOD|OBJ_ENABLED
COMM_ERROR|STATE_ERROR|OBJ_ENABLED
```

### 4.1 Primary display (required)

| Context | Rule |
|---------|------|
| Property panel `State` row | Full string, single line or wrapped — **entire pipe-delimited value visible** |
| Table `State` column | Same — no truncation without expand affordance |
| Copy | User can select/copy full source string |

### 4.2 Secondary display (optional, display-only)

May show a **read-only segment breakdown** below the primary text, each segment labeled with its raw token:

```
COMM_ERROR | STATE_ERROR | OBJ_ENABLED
```

Rules for breakdown:
- Split **only** on `|` character
- Each segment shown **exactly** as in source (no renaming `COMM_ERROR` → “Communication Error”)
- Breakdown is supplementary — primary line always shows full unsplit string
- If breakdown is omitted (minimal UI), primary full string is sufficient

### 4.3 Visual accent for compound state

Optional row-level accent using **substring match** (does not change text):

| If source `State` contains | Row accent |
|----------------------------|------------|
| `COMM_ERROR` or `STATE_ERROR` | Red tint (same as `Bad`) |
| `OBJ_DISABLED` | Muted/disabled styling |
| `COMM_GOOD` and `STATE_GOOD` | Green tint (same as `Good`) |

Match is **contains** on raw string — if both error and good segments appear, prefer error accent (more visible) but text remains full source string.

---

## 5. Performance counters table (`fetchPerformanceCountersTable`)

State display policy applies to health-calculation rows when they include state-like fields.

| Field | Display rule |
|-------|--------------|
| `Value` | As returned (number or string) — no unit conversion |
| `Unit` | Append when present: `42 %` — unit from source only |
| `type` | Show raw `type` column |
| Row without counters (bad datasource) | Show health rows only — no placeholder “Bad” invented |

Counter rows are **not** health states unless the source row includes a state field. Do not color counter `Value` by threshold unless default Health Monitor does (defer to UP-04 parity).

---

## 6. Icons and `Image` field

| Source | Use |
|--------|-----|
| `Image` from tree/table/props | Use backend icon reference when provided |
| State-based icons | Optional badge overlay — must not replace state text |
| Missing `Image` | Generic node icon by `Type` — **do not** infer health from icon alone |

---

## 7. Accessibility and density

| Guideline | Policy |
|-----------|--------|
| Color-only meaning | Always pair color with **source text** visible |
| Tooltips | May repeat full source string; no paraphrase |
| Compact tables | Wrap or horizontal scroll for long `State` — never ellipsis-only without expand |
| Font | Compact sans-serif per PMM Bayer (UP-01) |

---

## 8. Comparison with default Health Monitor (VA-01)

For each state column, parity check:

1. **Text equality** — custom UI string === default UI string for same object/path
2. **Presence** — same columns visible in same views
3. **No extra labels** — custom UI must not add “computed status” badges without source field

---

## 9. Implementation checklist (AR-02 / UP phase)

- [ ] State color map uses exact string keys from §3.2
- [ ] Compound `State` renders full pipe string in property panel
- [ ] Overview collapse uses `WorstState === "Good"` only
- [ ] No function maps `CommState`/`ObjectState` → synthetic `WorstState`
- [ ] `ProcessState` banner shows raw value
- [ ] Sort/filter presets documented if added (PPE-02 widgets)

---

## 10. References

- [DC-01-source-contracts.md](./DC-01-source-contracts.md) — frozen field names and vocabulary
- [PROJECT_PLAN.md](../PROJECT_PLAN.md) — UP-01 (Bayer visuals), UP-02 (Overview), UP-03 (properties)
- Default Health Monitor — reference for parity validation
