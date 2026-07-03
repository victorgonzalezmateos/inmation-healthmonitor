# Source Contracts

Frozen backend source documentation for the Bayer Health Monitor Webstudio app.

| Document | Task | Status |
|----------|------|--------|
| [DC-01-source-contracts.md](./DC-01-source-contracts.md) | DC-01 Freeze captured Health Monitor source contracts | Frozen 2026-07-03 |
| [DC-02-source-state-display-policy.md](./DC-02-source-state-display-policy.md) | DC-02 Define source-state display policy | Frozen 2026-07-03 |

## Functions covered

| Source | v1 required |
|--------|-------------|
| `dashboard_compilation` | yes |
| `ProcessState` | yes |
| `fetchNavigationTree` | yes |
| `fetchNavigationTable` | yes |
| `fetchObjProps` | yes |
| `fetchPerformanceCountersTable` | yes |
| `createtrend` / `createtrendpen` / `readhistoricaldata` | yes |
| `fetchLogTable` | **optional** (default: defer to post-parity) |

## Next

- **AR-02** — Map UI components to sources; apply this display policy in components
- **UP-01** — Bayer visual tokens (`#10384F`, `#d4f1d4`, `#f1d4d4`, etc.)
