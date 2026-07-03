# Project Focus — inmation-healthmonitor

## Project Goal

Build a **custom Bayer Health Monitor** as an inmation **Webstudio app** that achieves **parity** with the default Health Monitor UI while applying the **PMM Bayer visual system**. The app must use existing backend sources only — no client-side health calculation, no state transformation, and no custom login (`secp=iwa`, `ssl=true`).

## Key Features (planned)

- [ ] Overview hierarchy — unhealthy sites/cores/connectors/datasources emphasized
- [ ] Selected-object property panel (`fetchObjProps`)
- [ ] Performance counters detail (`fetchPerformanceCountersTable`)
- [ ] Chart drill-down parity (Submit to Chart behavior)
- [ ] PMM Bayer visual system (dark blue nav, Bayer green accents, light theme)
- [ ] Default-vs-custom parity validation checklist
- [ ] Optional: logs integration (`fetchLogTable`) — post-v1
- [ ] Optional: Bayer operational widgets — post-parity

## Tech Stack

- **Runtime:** inmation Webstudio (`/apps/webstudio`, custom ctx/lib/func — TBD in WR-01)
- **Frontend:** React + Vite (scaffold in place)
- **Data:** Existing Health Monitor sources (no duplicated monitoring logic)
- **Workflow:** Kanvas + Obsidian Canvas (`Project.canvas`) + `canvas-tool.py`
- **Repo:** [victorgonzalezmateos/inmation-healthmonitor](https://github.com/victorgonzalezmateos/inmation-healthmonitor)

## Current Phase

**Discovery Contracts — DC-01 complete (awaiting review).**  
Source contracts frozen in `docs/source-contracts/DC-01-source-contracts.md`. Next: approve DC-01 Green in Obsidian, then DC-02 and AR-01 unlock.

## Task Groups (see `docs/PROJECT_PLAN.md`)

1. Discovery Contracts (DC-01, DC-02)
2. Architecture (AR-01, AR-02)
3. UI Parity (UP-01 → UP-05)
4. Webstudio Runtime (WR-01)
5. Validation (VA-01, VA-02)
6. Post Parity Enhancements (PPE-01, PPE-02)

## Important Milestones

1. ~~Connect local project to GitHub~~ ✓ (2026-07-03)
2. ~~Initialize Kanvas workflow~~ ✓ (2026-07-03)
3. ~~Define project plan on `Project.canvas`~~ ✓ (2026-07-03)
4. ~~DC-01 Freeze source contracts~~ ✓ (2026-07-03) — **mark Green in Obsidian to unlock DC-02**
5. Implement health monitor features (UI Parity phase)
6. Deploy / integrate with inmation Webstudio

## Notes for Future Sessions

- Session history: [`.cursor/SESSION_LOG.md`](.cursor/SESSION_LOG.md)
- Human workflow: [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)
- Agent workflow: [`AGENTS.md`](AGENTS.md)
- Kanvas init (if needed): `python "..\Kanvas\canvas-tool.py" init .`
- App dev: `npm install` then `npm run dev`
