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

## Current Phase — HTML live HM + Overview KPIs (2026-07-21 EOD)

**Plan:** [`docs/architecture/AR-03-html-webapi-plan.md`](docs/architecture/AR-03-html-webapi-plan.md)

| Choice | Value |
|--------|--------|
| Hosting now | Local PC; migrate later for all Consumer Health |
| Clients | Domain Windows + Edge/Chrome |
| Auth now | **IWA works** (`AD-BAYER-CNB\GOAKJ`) |
| Auth later | Secondary CWID (Q/P) |
| Stack | **Vite + plain HTML/CSS/JS** in `web/` |
| Live HM | Tree + **List View** + counters/chart + **Overview KPIs** from `fetchNavigationTable` |
| **Next session** | Sites Impacted / type charts live; Trends / Drill-down as needed |

## Sequence

1. ~~Static Designer draft~~ ✓
2. ~~IWA spike + `fetchNavigationTree`~~ ✓ (2026-07-20)
3. ~~Live props/counters + chart/values on Health Monitor~~ ✓ (2026-07-21)
4. ~~Overview KPIs from `fetchNavigationTable`~~ ✓ (2026-07-21)
5. Wire Trends / Drill-down / Config as needed
6. Shared host + CWID later

## HTML app (local)

```powershell
cd web
npm install
npm run dev
```

Opens http://localhost:5173 (or 5174) — title **Smart Sentinel**.

### Health Monitor

- Auto IWA on load; topbar shows CONNECTED / DISCONNECTED
- Navigation: **tree ↔ list** toggle; list columns Name / Type / Object
- List row colors: Bad=red, Warning/Empty/COMM_EMPTY=yellow, Disabled=grey text
- Counters: multi-select → Submit → chart (pen toggle) / values table / period modal

### Key live files

| File | Role |
|------|------|
| `web/src/api/inmation.js` | IWA + execfunction |
| `web/src/api/hm-live.js` | HM mapping + health classify/summarize |
| `web/src/session.js` | IWA + topbar |
| `web/src/health-monitor.js` | HM page |
| `web/src/main.js` | Overview KPIs |

## Notes

- Session: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Designer: `C:\Users\GOAKJ\Downloads\Designer.png`
- Host: `byus00876m1.bayer.cnb:8002`
