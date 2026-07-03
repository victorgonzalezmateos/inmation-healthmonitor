# Webstudio Compilations

| File | Task | Description |
|------|------|-------------|
| [bayer-health-monitor-overview.json](./bayer-health-monitor-overview.json) | UP-02 | Overview section: header, process state, nav tree, hierarchy table |
| [bayer-health-monitor-properties.json](./bayer-health-monitor-properties.json) | UP-03 | Properties tab: `hm-props-panel` / `fetchObjProps` |
| [bayer-health-monitor-counters.json](./bayer-health-monitor-counters.json) | UP-04 | Counters tab: `hm-counters-table` / `fetchPerformanceCountersTable` |
| [bayer-health-monitor-chart.json](./bayer-health-monitor-chart.json) | UP-05 | Chart tab: `hm-chart` / createtrend chain |
| **[bayer-health-monitor-full.json](./bayer-health-monitor-full.json)** | **All UP** | **← Paste this into Webstudio / Custom Properties** |

See **[WEBSTUDIO-INSERT.md](./WEBSTUDIO-INSERT.md)** for step-by-step testing instructions.

## Deployment identifiers (WR-01 — frozen)

| Key | Value |
|-----|-------|
| `ctx` | `bayerhm` |
| `lib` | `HealthMonitor` |
| `func` | `BayerHealthMonitorMain` |
| Dashboard name | `Bayer Health Monitor` |

All compilation JSON files use these values.
