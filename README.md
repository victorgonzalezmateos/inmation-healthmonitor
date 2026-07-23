# inmation-healthmonitor

Custom **Bayer Health Monitor** (**Smart Sentinel**) for AspenTech inmation — PMM Bayer styling, no client-side inventing of health states, no custom login.

The active UI is a **Vite + plain HTML/CSS/JS** app under [`web/`](./web/). It talks to the inmation **Web API** on the plant host (IWA + Bearer token) and reuses the same Health Monitor libraries as the default WebStudio app (`syslib.app-webstudio-healthmonitor`, `inmation.app-reportviewer`, etc.).

**How to use the app:** see [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) (same content as the in-app **User Guide** button in the top bar).

There is also an earlier **WebStudio compilation** track (JSON under `compilations/`) aimed at UI parity with the stock Health Monitor.

**Task planning** lives on an Obsidian Canvas board via Kanvas (`Project.canvas`).

---

## Smart Sentinel web app (`web/`)

### How it works

1. **Run locally** with Vite. The dev server proxies `/api` and `/apps` to the inmation Web API host (default `byus00876m1.bayer.cnb:8002`).
2. On load, the app **auto-connects with Windows IWA** (`/api/security/windows/authorize` against the real host so the browser can send credentials). The top bar shows **CONNECTED** / **DISCONNECTED**.
3. Further calls use the **Bearer** token via `POST /api/v2/execfunction/...` (through the Vite proxy).
4. **Health / severity** always come from source fields on navigation rows (WorstState, CommState, ObjectState, …) via `classifyNavHealth` — the UI does not invent Good/Bad/Warning.
5. **Sites** are inferred from Bayer naming (`Area-Country-Site-…`) when filtering Dashboard / Reports / Health Overview.

```powershell
cd web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). You need network reachability to the Web API host and a Windows account that IWA can authorize.

Main code:

| Path | Role |
|------|------|
| `web/index.html` | Shell + all page markup |
| `web/src/main.js` | Nav, Dashboard, Health Overview |
| `web/src/health-monitor.js` | Health Monitor page |
| `web/src/drill-down.js` | Diagnostics (hierarchy + logs) |
| `web/src/user-guide.js` | In-app User Guide popup |
| `web/src/reports.js` | Reports (loaded on demand) |
| `web/src/api/inmation.js` | IWA + `execfunction` + reportviewer |
| `web/src/api/hm-live.js` | Tree / nav table / health helpers |
| `web/src/api/hm-certificates.js` | Certificates from HM Report XML |
| `web/vite.config.js` | Proxy to Web API |
| [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) | End-user guide (GitHub + in-app mirror) |

---

### Tabs (sidebar)

| Tab | What it does |
|-----|----------------|
| **Dashboard** | Fleet snapshot from the live navigation table: health score doughnut, KPI cards (total / problems / warnings / disabled / sites), components-by-site chart, issues-over-time, site summary and critical issues tables. **Site** and **time range** filters; optional auto-refresh. |
| **Health Monitor** | Operator console closest to stock HM: **tree** or **list** navigation, object properties, performance counters, multi-pen chart with time-period settings, and values table. Live `fetchNavigationTree` / `fetchNavigationTable` / props / counters / chart APIs. |
| **Health Overview** | Three live lists from nav health — **Problems** (Bad), **Warnings**, **Unknown & Disabled** — with sort and paging. Fourth panel **Connector Certificates**: expired or expiring within 30 days from the Health Monitor Report (red / yellow / yellow→red under 15 days). |
| **Trends** | Pick an object and inspect saved historical trend pens over a selectable time range (1d–…). Page marked under development. |
| **Diagnostics** | Filter by **site / type / severity**, inspect hierarchy health, open **Recent Logs (24h)**, double-click for Log Details, maximize logs panel. |
| **Reports** | Live **Health Monitor Report** via `inmation.app-reportviewer` (`reports` + `reportdata` with `objspec`). Renders ADO.NET XML as Smart Sentinel HTML (doughnuts, inventory, datasources, certificates) — **not** Stimulsoft. **Site** + **State** filters; link to open HM WebStudio on the host. |
| **Configuration** | Manage **EAM Critical Objects** (Add / Edit / Delete / Browse path / Apply to host). |

---

## Quick start (repo tooling)

### Prerequisites

- Node.js v16+
- Python 3 (for `canvas-tool.py`)
- [Obsidian](https://obsidian.md/) (Kanvas task board)
- Kanvas install at `..\Kanvas` (on this machine)

### Kanvas / Obsidian

1. Open this folder as an Obsidian vault.
2. Enable **Canvas Watcher** under Settings → Community plugins.
3. Open `Project.canvas`.
4. Approve tasks in Obsidian (Purple → Red), then ask the Cursor agent to start work.

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md).

---

## Project structure

```
├── web/                    # Smart Sentinel HTML app (primary UI)
├── Project.canvas          # Kanvas task board
├── canvas-tool.py          # Kanvas CLI (agents must use this)
├── AGENTS.md / RULES.md    # Agent / Kanvas protocol
├── focus.md                # Goals and phase
├── docs/                   # Contracts, architecture, UI, validation
├── compilations/           # WebStudio compilation JSON
├── .cursor/SESSION_LOG.md  # Multi-day session history
├── src/                    # Older React scaffold (legacy)
└── package.json            # Root tooling (Kanvas / legacy)
```

---

## Documentation

| File | Purpose |
|------|---------|
| [focus.md](./focus.md) | Goals, phase, milestones |
| [docs/PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | Task plan summary |
| [docs/source-contracts/](./docs/source-contracts/) | Frozen Health Monitor backend contracts |
| [docs/architecture/](./docs/architecture/) | Runtime / HTML Web API plan |
| [docs/ui/](./docs/ui/) | PMM Bayer visual system |
| [compilations/](./compilations/) | WebStudio compilation JSON |
| [docs/validation/](./docs/validation/) | Parity checklist |
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Kanvas in Obsidian |
| [AGENTS.md](./AGENTS.md) | Agent CLI commands |
| [RULES.md](./RULES.md) | Color codes, permissions |
| [.cursor/SESSION_LOG.md](./.cursor/SESSION_LOG.md) | Session history for multi-day work |

---

## Kanvas CLI

```powershell
python canvas-tool.py "Project.canvas" status
python canvas-tool.py "Project.canvas" ready
python canvas-tool.py "Project.canvas" show DC-01
python canvas-tool.py "Project.canvas" start DC-01
python canvas-tool.py "Project.canvas" finish DC-01
```

**Important:** never edit `Project.canvas` by hand — always use `canvas-tool.py`.

---

## Repository

https://github.com/victorgonzalezmateos/inmation-healthmonitor
