# Project Focus — inmation-healthmonitor

## Project Goal

Build a **custom Bayer Health Monitor** as an inmation **Webstudio app** that achieves **parity** with the default Health Monitor UI while applying the **PMM Bayer visual system**. The app must use existing backend sources only — no client-side health calculation, no state transformation, and no custom login (`secp=iwa`, `ssl=true`).

## Key Features (v1 — delivered)

- [x] Overview hierarchy — unhealthy sites/cores/connectors/datasources emphasized
- [x] Selected-object property panel (`fetchObjProps`)
- [x] Performance counters detail (`fetchPerformanceCountersTable`)
- [x] Chart drill-down parity (Submit to Chart behavior)
- [x] PMM Bayer visual system (dark blue nav, Bayer green accents, light theme)
- [x] Default-vs-custom parity validation checklist
- [x] Audit-friendly behavior validation
- [ ] Optional: logs integration (`fetchLogTable`) — **deferred v2** (PPE-01)
- [ ] Optional: Bayer operational widgets — **planned v2** (PPE-02)

## Tech Stack

- **Runtime:** inmation Webstudio (`ctx=bayerhm`, `lib=HealthMonitor`, `func=BayerHealthMonitorMain`)
- **Host object:** `/System/Core/_Global Core Logic/Development/Smart Sentinel AI/Bayer Health Monitor`
- **Compilation:** [`compilations/bayer-health-monitor-full.json`](compilations/bayer-health-monitor-full.json)
- **Workflow:** Kanvas + Obsidian Canvas (`Project.canvas`) + `canvas-tool.py`
- **Repo:** [victorgonzalezmateos/inmation-healthmonitor](https://github.com/victorgonzalezmateos/inmation-healthmonitor)

## Current Phase

**v1 plan complete — all 14 canvas tasks delivered.**  
Mark PPE-01 / PPE-02 **Green** in Obsidian to close the board. Next: live test on inmation host + VA-01 walkthrough.

## Milestones

1. ~~Discovery Contracts (DC-01, DC-02)~~ ✓
2. ~~Architecture (AR-01, AR-02)~~ ✓
3. ~~UI Parity (UP-01 → UP-05)~~ ✓
4. ~~Webstudio Runtime (WR-01)~~ ✓
5. ~~Validation (VA-01, VA-02)~~ ✓
6. ~~Post-parity plans (PPE-01, PPE-02)~~ ✓
7. **Live publish & parity test** ← current

## Notes for Future Sessions

- Session history: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Webstudio insert: [`compilations/WEBSTUDIO-INSERT.md`](compilations/WEBSTUDIO-INSERT.md)
- Post-parity v2: [`docs/post-parity/`](docs/post-parity/)
