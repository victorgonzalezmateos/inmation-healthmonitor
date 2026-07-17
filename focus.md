# Project Focus — inmation-healthmonitor

## Project Goal

Build a **custom Bayer Health Monitor** as an inmation **Webstudio app** with parity to the default Health Monitor UI and PMM Bayer styling. No client-side health calculation, no custom login (`secp=iwa`, `ssl=true`).

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

1. ~~**Capture** default HM compilation from browser DevTools → `docs/discovery/`~~ ✓ (2026-07-10)
2. ~~**Smoke test** — clone default HM layout with real widgets, prove data loads~~ ✓ layout + data live (2026-07-10)
3. **Bayer skin** — apply PMM colors incrementally on working base ✓
4. **Smart Sentinel layout** — nav/overview toggle, properties panel, right counters ✓ (2026-07-10)
5. **Chart / Submit** — multi-select, HM addPens, Counters\|Chart icons ✓ (2026-07-17)
6. **Parity** — VA-01 checklist live run ← **next**

## Current Phase

**Phase 3 chart/submit validated on host.** Next: VA-01 parity checklist.

## Deployment (confirmed working)

| Item | Value |
|------|-------|
| Folder | `/System/Core/_Global Core Logic/Development/Smart Sentinel AI` |
| CustomPropertyName | `Bayer Health Monitor` |
| App title | `Smart Sentinel` |
| Build | `python compilations/build-bayer-deploy.py` |
| Deploy | `compilations/smart-sentinel-ai-upsert-full.lua` in DataStudio console |
| Module name | `bayer.healthmonitor` (unchanged; Custom Properties path does not use it) |

## Layout (validated 2026-07-10)

- **Left top:** Navigation \| Overview tab buttons
- **Left middle:** Tree (Navigation) or overview table (Overview) — layout toggle via `w/h=0`
- **Left bottom:** Object properties panel (Navigation only) — nested HM worker + objprop pattern
- **Right:** Performance Counters \| Chart (HM icons) + Submit to Chart

## Files to use now

| File | Purpose |
|------|---------|
| `compilations/bayer-skinned-smoke.json` | Flat layout baseline |
| `compilations/bayer-skinned-full.json` | **Generated** — full Smart Sentinel layout |
| `compilations/build-bayer-deploy.py` | **Run to rebuild** JSON + upsert Lua |
| `compilations/build-bayer-full-tabs.py` | Layout builder |
| `compilations/bayer_properties_panel.py` | Properties panel (nested compilation + delegate routes) |
| `compilations/bayer_chart_panel.py` | Multi-select Submit → chart (HM addPens pattern) |
| `compilations/smart-sentinel-ai-upsert-full.lua` | **Deploy to host** |
| `compilations/default-hm-tree-tab-clone.json` | HM properties reference |
| `docs/discovery/default-hm-compilation.json` | Captured default HM |

## Host paths

- Script library path: `/System/Core/_Global Core Logic/Development/Smart Sentinel AI`
- Setup notes: [`docs/discovery/SMART-SENTINEL-AI-SETUP.md`](docs/discovery/SMART-SENTINEL-AI-SETUP.md)
- Compilation (target): `compilations/` (will be rebuilt from captured reference)

## Notes

- Session history: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Old full JSON (reference only): [`compilations/bayer-health-monitor-full.json`](compilations/bayer-health-monitor-full.json)
- Lua generator (after capture): [`compilations/build-dashboard-lua.py`](compilations/build-dashboard-lua.py)
