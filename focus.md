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

## Current Phase — Static Designer HTML draft

**Plan:** [`docs/architecture/AR-03-html-webapi-plan.md`](docs/architecture/AR-03-html-webapi-plan.md)

| Choice | Value |
|--------|--------|
| Hosting now | Local PC; migrate later for all Consumer Health |
| Clients | Domain Windows + Edge/Chrome |
| Auth now | IWA only |
| Auth later | Secondary CWID (Q/P) |
| First build | **Static HTML = Designer.png** (placeholder data) |
| Stack | **Vite + plain HTML/CSS/JS** (simple for your team) |
| Health Score (later) | Good% from `WorstState` counts |
| Trends | Health Monitor APIs |
| After draft | Guided IWA spike + one `execfunction` |

## Sequence

1. Static Designer draft (no data) ← **next**
2. IWA spike (step-by-step with you)
3. One HM `fetchNavigationTable` call
4. Wire Overview KPIs
5. More Designer sections
6. Trends from HM
7. Shared host + CWID later

## Notes

- Session: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Designer: `C:\Users\GOAKJ\Downloads\Designer.png`
- Host: `byus00876m1.bayer.cnb:8002`
