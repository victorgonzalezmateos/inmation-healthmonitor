# Project Focus — inmation-healthmonitor

## Project Goal

Build a **custom Bayer Health Monitor** as an inmation **Webstudio app** with parity to the default Health Monitor UI and PMM Bayer styling. No client-side health calculation, no custom login (`secp=iwa`, `ssl=true`). Direction: Designer.png (Global Health Monitor) shell + Overview dashboard.

## Reset (2026-07-10)

**Previous v1 deliverables (docs + JSON) did not work on the live host.** They were authored without a captured copy of the real default Health Monitor compilation.

### What we know works on your host

| Item | Value |
|------|-------|
| Default HM URL | `lib=syslib.app-webstudio-healthmonitor` `func=dashboard_compilation` |
| Host | `byus00876m1.bayer.cnb:8002` |
| Your script library | Folder **Smart Sentinel AI** — module `bayer.healthmonitor` |
| Script library path | `/System/Core/_Global Core Logic/Development/Smart Sentinel AI` |

### What was wrong before

- Wrong data `lib` (`HealthMonitor` instead of `syslib.app-webstudio-healthmonitor`)
- Wrong entry pattern (`ctx=bayerhm`, `BayerHealthMonitorMain` — not on host)
- Nav tree widget type (`tree`) never validated against real Webstudio
- Script library on **Smart Sentinel AI folder** (not a child object) — needs `ctx` in launch URL

### New approach — evidence first, then minimal build

1. ~~**Capture** default HM compilation~~ ✓
2. ~~**Smoke test**~~ ✓
3. ~~**Bayer skin**~~ ✓
4. ~~**Smart Sentinel Trends layout**~~ ✓ (nav/overview/props/counters/chart)
5. ~~**Chart / Submit**~~ ✓ (2026-07-17)
6. ~~**App shell**~~ ✓ built (persistent Overview \| Trends menu)
7. ~~**Overview KPI row (Designer style)**~~ ✓ built (deploy + polish next)
8. **Next:** Host validate KPIs → more Designer Overview widgets → VA-03 parity

## Current Phase

**End of 2026-07-17.** App shell + Designer Overview KPI row are in repo/deploy artifacts. **Next session:** deploy, validate live look vs Designer mockup, then continue Overview dashboard or VA-03.

## Deployment (confirmed working)

| Item | Value |
|------|-------|
| Folder | `/System/Core/_Global Core Logic/Development/Smart Sentinel AI` |
| CustomPropertyName | `Bayer Health Monitor` |
| App title | `Smart Sentinel` |
| Build | `python compilations/build-bayer-deploy.py` |
| Deploy | `compilations/smart-sentinel-ai-upsert-full.lua` in DataStudio console |
| Module name | `bayer.healthmonitor` (unchanged; Custom Properties path does not use it) |

## Layout

- **App menu (persistent):** Overview (house) \| Trends (chart)
- **Overview page:** Designer KPI row — Health Score, Total Components, Problems, Warnings, Info, Sites Impacted
- **Trends page:** Navigation \| Overview tabs, tree/properties, counters/chart + Submit

**Naming:** App-menu **Overview** ≠ Trends in-page **Overview** tab (hierarchy table).

## Files to use now

| File | Purpose |
|------|---------|
| `compilations/bayer_app_shell.py` | Persistent left menu + page switch |
| `compilations/bayer_overview_kpis.py` | Designer KPI cards + data transforms |
| `compilations/build-bayer-full-tabs.py` | Assembles shell + Trends HM UI |
| `compilations/bayer_chart_panel.py` | Counters/Chart Submit |
| `compilations/bayer_properties_panel.py` | Nested properties panel |
| `compilations/build-bayer-deploy.py` | **Run to rebuild** JSON + upsert Lua |
| `compilations/bayer-skinned-full.json` | Generated compilation |
| `compilations/smart-sentinel-ai-upsert-full.lua` | **Deploy to host** |
| `docs/discovery/default-hm-compilation.json` | Captured default HM |
| `docs/validation/VA-01-parity-checklist.md` | Live parity checklist |

## Host paths

- Script library path: `/System/Core/_Global Core Logic/Development/Smart Sentinel AI`
- Setup notes: [`docs/discovery/SMART-SENTINEL-AI-SETUP.md`](docs/discovery/SMART-SENTINEL-AI-SETUP.md)
- Designer reference: `C:\Users\GOAKJ\Downloads\Designer.png`

## Notes

- Session history: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Save tag target: `smart-sentinel-overview-kpis-wip`
