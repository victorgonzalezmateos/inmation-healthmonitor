# inmation-healthmonitor

Custom **Bayer Health Monitor** for inmation Webstudio — built for UI parity with the default Health Monitor, using PMM Bayer visual styling, with no client-side health calculation or custom login.

## Overview

This project delivers a Webstudio app that reads existing Health Monitor backend sources (`fetchNavigationTree`, `fetchNavigationTable`, `fetchObjProps`, `fetchPerformanceCountersTable`, chart calls, etc.) and presents them in a Bayer-branded operator UI. All displayed states trace back to source contracts — nothing is invented on the client.

**Task planning and progress** are managed on an Obsidian Canvas board via [Kanvas](https://github.com/victorgonzalezmateos/inmation-healthmonitor) (`Project.canvas`).

## Quick Start

### Prerequisites

- Node.js v16+
- Python 3 (for `canvas-tool.py`)
- [Obsidian](https://obsidian.md/) (for the Kanvas task board)
- Kanvas install at `..\Kanvas` (relative to this project on this machine)

### App development

```powershell
npm install
npm run dev
```

### Kanvas / Obsidian workflow

1. Open this folder as an Obsidian vault.
2. Enable **Canvas Watcher** under Settings → Community plugins.
3. Open `Project.canvas` to view and manage tasks.
4. Approve tasks in Obsidian (Purple → Red), then ask the Cursor agent to start work.

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) for the full workflow.

## Project Structure

```
├── Project.canvas          # Kanvas task board (14 tasks, 6 groups)
├── canvas-tool.py          # Kanvas CLI — agents use this for board changes
├── AGENTS.md               # Agent session protocol
├── RULES.md                # Full Kanvas workflow rules
├── focus.md                # Project goals and milestones
├── docs/
│   ├── GETTING_STARTED.md  # Obsidian + Kanvas guide for humans
│   └── PROJECT_PLAN.md     # Task plan summary
├── .cursor/
│   ├── SESSION_LOG.md      # Multi-day session history for agents
│   └── rules/              # Cursor rules for session resume
├── src/                    # React + Vite app (scaffold)
└── package.json
```

## Documentation

| File | Purpose |
|------|---------|
| [focus.md](./focus.md) | Goals, phase, milestones |
| [docs/PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | All 14 tasks and dependency order |
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | How to use Kanvas in Obsidian |
| [AGENTS.md](./AGENTS.md) | Agent CLI commands and protocol |
| [RULES.md](./RULES.md) | Color codes, permissions, Canvas Watcher |
| [.cursor/SESSION_LOG.md](./.cursor/SESSION_LOG.md) | Session history for multi-day work |

## Kanvas CLI (common commands)

Run from the project folder:

```powershell
python canvas-tool.py "Project.canvas" status
python canvas-tool.py "Project.canvas" ready
python canvas-tool.py "Project.canvas" show DC-01
python canvas-tool.py "Project.canvas" start DC-01
python canvas-tool.py "Project.canvas" finish DC-01
```

**Important:** Agents must never edit `Project.canvas` directly — always use `canvas-tool.py`.

## Current Phase

Planning complete on `Project.canvas`. Next step: approve **DC-01** in Obsidian (Purple → Red), then begin Discovery Contracts work.

## Repository

https://github.com/victorgonzalezmateos/inmation-healthmonitor
