# Project Focus — inmation-healthmonitor

## Project Goal

Build a **Global Health Monitor–style** UI (see `Downloads/Designer.png`) that shows **inmation Health Monitor source data**, with **Windows IWA** (no custom login), matching users against inmation profiles like WebStudio.

## Phase freeze — WebStudio (2026-07-20)

WebStudio Smart Sentinel work is **saved and frozen** (not discarded):

| Item | Value |
|------|-------|
| Last commit | `ccf7ce5` |
| Tag | `smart-sentinel-overview-kpis-wip` |
| Earlier tag | `smart-sentinel-chart-submit-ok` |

WebStudio remains a useful Trends/parity prototype. **New primary delivery = HTML/SPA + inmation Web API.**

## Current Phase — HTML + Web API (planning)

**Why:** Designer-level layout (KPI cards, charts, tables, shell) is hard to finish in WebStudio alone. HTML/CSS/JS (or React/Vue) can match Designer.png; data still comes from inmation.

### Feasibility (confirmed from inmation docs)

| Need | Mechanism |
|------|-----------|
| Login like WebStudio | `GET /api/security/windows/authorize` with `credentials: "include"` (browser IWA) → Bearer token |
| Health data | `POST /api/v2/execfunction` → `lib=syslib.app-webstudio-healthmonitor`, `func=fetchNavigationTable` / Tree / ObjProps / Counters / chart APIs |
| Same user rights | Web API maps Windows user → inmation Profile (same as WebStudio) |
| Host | Same Web API host: `byus00876m1.bayer.cnb:8002` |

**Constraint:** Page must be served from a context that allows IWA to that host (same site / trusted intranet / CORS + credentials). Cross-origin static hosting may need a reverse proxy or hosting under the Web API / IIS path.

## Deployment (WebStudio — freeze)

| Item | Value |
|------|-------|
| Folder | `/System/Core/_Global Core Logic/Development/Smart Sentinel AI` |
| CustomPropertyName | `Bayer Health Monitor` |
| Build | `python compilations/build-bayer-deploy.py` |
| Deploy | `compilations/smart-sentinel-ai-upsert-full.lua` |

## Notes

- Session history: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Designer reference: `C:\Users\GOAKJ\Downloads\Designer.png`
- Next: answer planning questions → spike IWA + one `execfunction` from HTML → build Overview page
