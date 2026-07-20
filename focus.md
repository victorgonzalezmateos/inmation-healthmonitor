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

## Current Phase — IWA live + HM tree (2026-07-20 EOD #2)

**Plan:** [`docs/architecture/AR-03-html-webapi-plan.md`](docs/architecture/AR-03-html-webapi-plan.md)

| Choice | Value |
|--------|--------|
| Hosting now | Local PC; migrate later for all Consumer Health |
| Clients | Domain Windows + Edge/Chrome |
| Auth now | **IWA works** (`AD-BAYER-CNB\GOAKJ`) |
| Auth later | Secondary CWID (Q/P) |
| Stack | **Vite + plain HTML/CSS/JS** in `web/` |
| Live HM | **Tree OK**; counters/props still polishing |
| **Next session** | Finish counters live → `fetchNavigationTable` Overview |

## Sequence

1. ~~Static Designer draft~~ ✓
2. ~~IWA spike + `fetchNavigationTree`~~ ✓ (2026-07-20)
3. Finish live props/counters on Health Monitor
4. Wire Overview KPIs from `fetchNavigationTable`
5. Wire Trends / Drill-down / Config as needed
6. Shared host + CWID later

## HTML app (local)

```powershell
cd web
npm install
npm run dev
```

Opens http://localhost:5173 (or 5174) — title **Smart Sentinel**.

### Health Monitor — Connect

1. Open **Health Monitor**
2. Click **Connect** (IWA → live tree)
3. Click a node for props/counters
4. **Use mock** to fall back; **Paste token** if IWA blocked

### Key live files

| File | Role |
|------|------|
| `web/src/api/inmation.js` | IWA + execfunction |
| `web/src/api/hm-live.js` | HM response mapping |
| `web/src/health-monitor.js` | Live/mock UI |

## Notes

- Session: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Designer: `C:\Users\GOAKJ\Downloads\Designer.png`
- Host: `byus00876m1.bayer.cnb:8002`
