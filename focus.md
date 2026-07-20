# Project Focus — inmation-healthmonitor

## Project Goal

Build a **Designer.png-style** Global Health Monitor webpage for Consumer Health. UI in HTML; data from **inmation Health Monitor** via Web API. Auth: **Windows IWA** now; **CWID** later for Q/P.

## Phase freeze — WebStudio (2026-07-20)

| Item | Value |
|------|-------|
| Commit | `ccf7ce5` |
| Tag | `smart-sentinel-overview-kpis-wip` |
| Chart tag | `smart-sentinel-chart-submit-ok` |

WebStudio is frozen (not discarded). Trends data still comes from Health Monitor APIs when we wire HTML.

## Current Phase — HTML static draft approved (save point 2026-07-20)

**Plan:** [`docs/architecture/AR-03-html-webapi-plan.md`](docs/architecture/AR-03-html-webapi-plan.md)

| Choice | Value |
|--------|--------|
| Hosting now | Local PC; migrate later for all Consumer Health |
| Clients | Domain Windows + Edge/Chrome |
| Auth now | IWA only |
| Auth later | Secondary CWID (Q/P) |
| Stack | **Vite + plain HTML/CSS/JS** in `web/` |
| Health Score (later) | Good% from `WorstState` counts |
| Trends | Health Monitor APIs (mock UI ready) |
| **Next session** | Guided **IWA spike** + one `execfunction` |

## Sequence

1. ~~Static Designer draft (no data)~~ ✓ `web/` — user liked it (2026-07-20 EOD)
2. **IWA spike** (step-by-step) ← next
3. One HM `fetchNavigationTable` call
4. Wire Overview KPIs to live data
5. Wire Health Monitor / Trends / Drill-down / Config
6. Shared host + CWID later

## HTML app (local)

```powershell
cd web
npm install
npm run dev
```

Opens http://localhost:5173 — title **Smart Sentinel**.

### Pages built (static / mock)

| Nav | Status |
|-----|--------|
| Overview | Designer KPI row + charts/tables |
| Health Monitor | Tree + props + counters + Submit |
| Issues & Alerts | Split: Issues (top) / Warnings (bottom) |
| Trends | Tree + multi-pen chart; ranges **1d / 7d / 1m / 2m** |
| Drill-down | Filters → hierarchy table → detail + Open in Trends |
| Configuration | EAM Critical Objects + add/delete alert emails |
| Reports | Placeholder |

### Key `web/` files

| File | Role |
|------|------|
| `web/index.html` | Shell + all page panels |
| `web/src/main.js` | Nav + Overview charts |
| `web/src/styles.css` | PMM header gradient + layouts |
| `web/src/health-monitor.js` | HM page |
| `web/src/trends.js` | Trends page |
| `web/src/drill-down.js` | Drill-down page |
| `web/src/configuration.js` | Config / EAM emails |
| `web/src/*-mock-data.js` | Mock datasets |
| `web/public/bayer-logo.svg` | Bayer logo |

## Notes

- Session: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Designer: `C:\Users\GOAKJ\Downloads\Designer.png`
- Host: `byus00876m1.bayer.cnb:8002`
- Header: white left / blue-cyan right (`linear-gradient(108deg, …)` — WebKit angle fix)
