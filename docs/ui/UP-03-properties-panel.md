# UP-03 — Selected-Object Property Panel

> **Status:** Implemented (2026-07-03)  
> **Task:** UP-03 on `Project.canvas`  
> **Compilation:** [`../../compilations/bayer-health-monitor-properties.json`](../../compilations/bayer-health-monitor-properties.json)

Displays `fetchObjProps` for the object selected in Overview — parity with default Health Monitor property panel.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| `hm-props-panel` inside `hm-detail-tabs` | Performance counters (UP-04) |
| All DC-01 `fetchObjProps` fields | Chart (UP-05) |
| Compound `State` verbatim (DC-02 §4) | Logs (PPE-01) |
| `access` field respected | Editing properties |

---

## 2. Trigger and context

| Event | Action |
|-------|--------|
| Row select in `hm-overview-table` | Set `selectedPath` → refresh `hm-props-panel` |
| Node select in `hm-nav-tree` | Same |
| No selection | Show empty message — **no fetch** |

**dataSource call:**

```json
{
  "lib": "HealthMonitor",
  "func": "fetchObjProps",
  "context": { "path": "{{selectedPath}}" }
}
```

Refresh: **on selection only** (no poll).

---

## 3. Field layout

Two-column read-only form (label 35% / value 65%):

| Field | Label | Display rule |
|-------|-------|--------------|
| `ObjectName` | ObjectName | As returned |
| `Type` | Type | As returned |
| `ObjectID` | ObjectID | As returned |
| `ObjectIDExtended` | ObjectIDExtended | Hide row if empty |
| `Path` | Path | Wrap, break-all |
| `ConfigVersion` | ConfigVersion | As returned |
| `ClassVersion` | ClassVersion | As returned |
| `Created` | Created | As returned (no date reformat) |
| `Modified` | Modified | As returned |
| `State` | State | **Full compound string** — monospace, wrap (DC-02) |
| `Image` | Image | As returned (icon ref or path) |
| `access` | access | Show when present; gate visibility per AR-02 |

Field order matches default Health Monitor panel for parity (VA-01).

---

## 4. `State` field (critical)

Per [DC-02 §4](../source-contracts/DC-02-source-state-display-policy.md):

1. **Primary line:** entire pipe-delimited value, e.g. `COMM_ERROR|STATE_ERROR|OBJ_ENABLED`
2. **Optional breakdown:** segments split on `|` only — each token shown raw below primary
3. **No renaming** segments to human labels
4. **Accent:** substring match on `State` for row background (error → `#f1d4d4`, good → `#d4f1d4`) — text unchanged

---

## 5. Access control

| `access` value | Behavior |
|----------------|----------|
| Permitted | Show all returned fields |
| Denied / restricted | Show source denial message — hide field values |
| Missing | Show fields (backend already filtered) |

`respectAccessField: true` in compilation options.

---

## 6. Visual design (UP-01)

| Element | Token |
|---------|-------|
| Panel background | `#ffffff` |
| Border | `1px solid #ededed` |
| Shadow | `shadow-panel` |
| Labels | `#64748b`, 12px, weight 500 |
| Values | `#10384f`, 12px |
| State value | Consolas 11px, `#f8fafc` background |
| Tab bar (parent) | `#10384f`, active `#89d329` indicator |

---

## 7. Merge with Overview compilation

Full dashboard assembly (WR-01 / publish):

1. `compilations/bayer-health-monitor-overview.json` — rows 0–59 (header + overview)
2. `compilations/bayer-health-monitor-properties.json` — place `hm-detail-tabs` at `y: 62` below overview
3. Future: UP-04 counters tab, UP-05 chart tab in same `hm-detail-tabs`

---

## 8. Parity checklist (VA-01)

- [ ] Same fields visible as default HM for same `Path`
- [ ] `State` string character-identical
- [ ] `Created` / `Modified` not reformatted
- [ ] Empty selection shows equivalent empty state
- [ ] No extra computed fields in panel

---

## 9. References

- [DC-01 §5](../source-contracts/DC-01-source-contracts.md) — field contract
- [DC-02 §4](../source-contracts/DC-02-source-state-display-policy.md) — State display
- [AR-02 §3.4](../architecture/AR-02-data-wiring-and-components.md) — wiring
- [UP-01](./UP-01-pmm-bayer-visual-system.md) — styles
