# Webstudio Compilations

| File | Task | Description |
|------|------|-------------|
| [bayer-health-monitor-overview.json](./bayer-health-monitor-overview.json) | UP-02 | Overview section: header, process state, nav tree, hierarchy table |
| [bayer-health-monitor-properties.json](./bayer-health-monitor-properties.json) | UP-03 | Properties tab: `hm-props-panel` / `fetchObjProps` |
| [bayer-health-monitor-counters.json](./bayer-health-monitor-counters.json) | UP-04 | Counters tab: `hm-counters-table` / `fetchPerformanceCountersTable` |
| [bayer-health-monitor-chart.json](./bayer-health-monitor-chart.json) | UP-05 | Chart tab: `hm-chart` / createtrend chain |

**Publish artifact:** merge section files → `bayer-health-monitor-full.json` (see WR-01).

## Deployment identifiers (WR-01 — frozen)

| Key | Value |
|-----|-------|
| `ctx` | `bayerhm` |
| `lib` | `HealthMonitor` |
| `func` | `BayerHealthMonitorMain` |
| Dashboard name | `Bayer Health Monitor` |

All compilation JSON files use these values.
