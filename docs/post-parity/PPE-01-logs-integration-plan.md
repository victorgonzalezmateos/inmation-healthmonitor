# PPE-01 — Optional Logs Integration Plan

> **Status:** Frozen (2026-07-03)  
> **Task:** PPE-01 on `Project.canvas`  
> **Decision:** **Defer to v2** (not in v1 Bayer Health Monitor)

---

## 1. Decision

| Option | Choice | Rationale |
|--------|--------|-----------|
| Include `fetchLogTable` in v1 | **No** | DC-01 marked logs optional; parity scope (UP-01–05, VA-01/02) complete without logs |
| Defer to v2 | **Yes** | Reduces v1 risk; logs are supplementary to health monitoring |
| Revisit trigger | Operator request or VA-01 gap on log viewing | |

---

## 2. Scope when implemented (v2)

| Item | Specification |
|------|---------------|
| Source | `fetchLogTable` only — no new log logic |
| UI | New tab **Logs** in `hm-detail-tabs` |
| Widget | `hm-logs-table` (planned in AR-02) |
| Trigger | On `selectedPath` change |
| Health logic | **Unchanged** — logs display only |

---

## 3. Capture requirements (before v2 build)

Record samples from **default Health Monitor** for same paths used in VA-01:

| Scenario | Path | Capture |
|----------|------|---------|
| Healthy object | _______________ | `fetchLogTable` JSON export |
| Bad datasource | _______________ | `fetchLogTable` JSON export |

### Expected fields (from DC-01)

| Field | Notes |
|-------|-------|
| `timestamp` | As returned |
| `message` | Log text |
| `severity` / `level` | If present |
| `source` | Optional |
| `ObjectName` | Optional |

Store captures in `docs/post-parity/samples/` (gitignored if sensitive) when available.

---

## 4. v2 compilation sketch

Add to `hm-detail-tabs.tabs[]`:

```json
{
  "id": "tab-logs",
  "title": "Logs",
  "compilation": {
    "widgets": [{
      "id": "hm-logs-table",
      "type": "table",
      "dataSource": {
        "lib": "HealthMonitor",
        "func": "fetchLogTable",
        "ctx": "bayerhm"
      },
      "dataKeys": ["selectedPath"]
    }]
  }
}
```

Merge into `bayer-health-monitor-full.json` on v2 publish.

---

## 5. Audit rules (unchanged)

- No client-side log severity inference
- No health state derived from logs
- Same VA-02 forbidden patterns apply

---

## 6. References

- [DC-01 §9](../source-contracts/DC-01-source-contracts.md) — fetchLogTable optional
- [AR-02 §3.7](../architecture/AR-02-data-wiring-and-components.md) — hm-logs-table deferred
