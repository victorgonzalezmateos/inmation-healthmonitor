# Session Log — inmation-healthmonitor

> **For AI agents:** Read this file at the start of every session before asking the user to re-explain setup. Append new entries at the bottom. Update the "Current State" section when milestones change.

---

## Current State (last updated: 2026-07-22 EOD #2 — classification + Reports)

| Item | Value |
|------|-------|
| **Project folder** | `C:\Users\GOAKJ\Documents\Cursor Project\inmation-healthmonitor` |
| **Kanvas install** | `C:\Users\GOAKJ\Documents\Cursor Project\Kanvas` |
| **GitHub repo** | https://github.com/victorgonzalezmateos/inmation-healthmonitor |
| **Git branch** | `master` |
| **Host** | `byus00876m1.bayer.cnb:8002` |
| **Phase** | **HTML Smart Sentinel live: HM + Overview + Reports + Issues certs** |


### WebStudio freeze (do not lose)
| Item | Value |
|------|-------|
| Commit | `ccf7ce5` |
| Tag | `smart-sentinel-overview-kpis-wip` |
| Chart tag | `smart-sentinel-chart-submit-ok` |
| Status | Saved; optional later for Trends parity |

### HTML app — save point (2026-07-22 EOD #2)
| Item | Value |
|------|-------|
| App | `web/` Vite + plain HTML/CSS/JS |
| Run | `cd web && npm install && npm run dev` → http://localhost:5173 (or next free port) |
| Title | Smart Sentinel |
| Auth | **IWA auto-connect** on load; topbar CONNECTED/DISCONNECTED |
| Live data | Tree, List View, props, counters, chart/values, Overview KPIs, Reports XML, Issues certs |

**Pages:** Overview (live KPIs + site filter) · Health Monitor · Issues & Alerts (Problems / Warnings / Disabled / **Certificates**) · Trends · Drill-down · Configuration · **Reports** (HM Report HTML from `app-reportviewer`)

**Reports (live):**
- API: `POST …/inmation.app-reportviewer/reports|reportdata` with body `{ objspec, reportname?, omitreportdesign: true }` + `?ctx=`
- Design prefer `"Report"`; render ADO.NET XML as Smart Sentinel HTML (no Stimulsoft)
- Site filter + **State filter default Not Good** (hides Good); sortable tables
- Certificates table = expired or &lt;30d (red / yellow / yellow→red &lt;15d)
- “All N are Good.” messages use Good greens (`#dcfce7` / `#166534`)
- Dynamic `import("./reports.js")` so Reports errors do not blank app CSS
- Use Case Report **removed** (not wanted)

**Issues Certificates:** same report XML source via `hm-certificates.js`; panel on Issues & Alerts page

**Health classification (`classifyNavHealth` in `hm-live.js`) — from `State` flags only:**
| Priority | Class | Flags | UI |
|----------|-------|-------|-----|
| 1 | Problem (`bad`) | `COMM_ERROR`, `STATE_ERROR` | red |
| 2 | Warning | `COMM_WARNING`, `STATE_WARNING`, `STATE_UNCONFIRMED`, `OBJ_CLASS_MISMATCH` | yellow |
| 3 | Disabled | `(COMM_NEUTRAL\|STATE_NEUTRAL)` without `OBJ_ENABLED`, or HM Object/Worst = Disabled | grey |
| 4 | Unknown | `STATE_EMPTY` (relays) | grey |
| 5 | Good | all other (incl. `COMM_EMPTY` alone; `OBJ_DYNAMIC` / `OBJ_ENABLED` ignored) | default |

**Overview KPIs:** Health Score · Total · Sites · Good · Problems · Warnings · Unknown · Disabled

**Data sources (split):**
| UI | Source | Display / class |
|----|--------|-----------------|
| HM Navigation list | `fetchNavigationTable` | Object=`ObjectState`, Comm.=`CommState`; row color by `WorstState` |
| Overview KPIs + Site Summary | `State` bitmask/flags (ModUserState) | Problem > Warning > Disabled > Unknown > Good |

**Overview classification (inmation docs 1.110):**
| Class | Flags |
|-------|--------|
| Problem | `COMM_ERROR`, `STATE_ERROR` |
| Warning | `COMM_WARNING`, `STATE_WARNING`, `STATE_UNCONFIRMED`, `OBJ_CLASS_MISMATCH` |
| Disabled | neutral **and** no `OBJ_ENABLED` (or HM Object/Worst = Disabled) |
| Unknown | `STATE_EMPTY` |
| Good | else (`COMM_EMPTY` alone OK) |

**Next session (do not re-ask setup):**
1. Read this Current State + latest Session History
2. Optional: Trends polish; share `hm-certificates` helpers with Reports to DRY
3. Commit/push done for 2026-07-22 EOD #2 — only push if user asks again

### HTML phase — locked (2026-07-20)
- Plan: `docs/architecture/AR-03-html-webapi-plan.md`
- Stack: Vite + plain HTML/CSS/JS
- Auth later (Q/P): secondary CWID
- Hosting later: shared server for Consumer Health

### Key live API files
| File | Role |
|------|------|
| `web/src/api/inmation.js` | IWA authorize + execfunction (`?ctx=`) + reportviewer helpers |
| `web/src/api/hm-live.js` | Tree/props/counters/nav table + `classifyNavHealth` / `summarizeNavHealth` |
| `web/src/api/hm-certificates.js` | Fetch/parse HM Report certificates for Issues (+ shared rules) |
| `web/src/session.js` | App-wide IWA + topbar connection state |
| `web/src/health-monitor.js` | HM page: tree/list, pens, chart period, values table |
| `web/src/main.js` | Overview KPIs + Issues (incl. Certificates panel) |
| `web/src/reports.js` | Reports: app-reportviewer XML → Smart Sentinel HTML (dynamic import) |
| `web/src/hm-chart-paint.js` | Chart.js trend paint |
| `web/src/hm-chart-period.js` | Time period modal (`*-1h` default) |
| `web/vite.config.js` | Proxy `/api` + `/apps` → `:8002` (Bearer); IWA hits host direct |

### Board status
- Proposed (purple): VA-03, VA-04, AR-03

### Save points
| Tag / area | Meaning |
|------------|---------|
| `smart-sentinel-chart-submit-ok` | WebStudio Chart/Submit (`a5a8326`) |
| `smart-sentinel-overview-kpis-wip` | WebStudio app shell + KPI row (`ccf7ce5`) |
| `web/` HTML + IWA | Multi-page draft + live tree + list + Overview |
| **2026-07-22 EOD** | Reports live + Issues Certificates + site/sort |

---

## Key Commands (Windows / PowerShell)


Run from the project folder unless noted.

### Git — save work to GitHub
```powershell
git add .
git commit -m "Describe your change"
git push
```

### Kanvas — initialize (already run once; re-run only if needed)
```powershell
python "..\Kanvas\canvas-tool.py" init .
```

### Kanvas — daily workflow (see also `AGENTS.md`)
```powershell
python canvas-tool.py "Project.canvas" status
python canvas-tool.py "Project.canvas" ready
python canvas-tool.py "Project.canvas" start <TASK-ID>
python canvas-tool.py "Project.canvas" finish <TASK-ID>
```

### App development
```powershell
npm install
npm run dev
```

---

## Session History

### 2026-07-03 — Session 1: GitHub + Kanvas setup

**Goal:** Connect project to GitHub and set up Kanvas workflow.

**What happened:**

1. **GitHub connection**
   - `gh auth status` confirmed login as `victorgonzalezmateos`.
   - Local folder was not a git repo (only `.obsidian/` existed).
   - Remote repo `victorgonzalezmateos/inmation-healthmonitor` already existed on GitHub with full project content.
   - Initialized git, added `origin`, fetched and checked out `master`.
   - Local `.obsidian/` conflicted with remote; backed up and replaced with remote version.
   - Result: local folder synced with `origin/master` at commit `6f817aa` ("Setup React + Vite development environment").

2. **Kanvas init command**
   - User has Kanvas at `C:\Users\GOAKJ\Documents\Cursor Project\Kanvas`.
   - Correct command from project directory:
     ```powershell
     python "..\Kanvas\canvas-tool.py" init .
     ```
   - Init copies `canvas-tool.py`, agent docs, `RULES.md`, blank canvas template, and installs Canvas Watcher Obsidian plugin.

3. **Session continuity**
   - User requested persistent memory across multi-day sessions.
   - Created `.cursor/SESSION_LOG.md` (this file) and `.cursor/rules/resume-session.mdc`.

**User intent:** Long-running project (several days). Wants transparent resume — no re-explaining setup each session.

---

### 2026-07-03 — Session 2: Project plan + documentation + GitHub save

**Goal:** User built Kanvas plan on `Project.canvas`; save everything to GitHub with documentation before starting DC-01.

**What happened:**

1. **Plan reviewed** — 14 tasks, 6 groups, all Purple. DC-01 is entry point.
2. **Documentation added/updated:**
   - `README.md`, `focus.md`
   - `docs/GETTING_STARTED.md`, `docs/PROJECT_PLAN.md`
   - `.cursor/SESSION_LOG.md` updated
3. **Committed and pushed** to `origin/master`.

**Next step:** User approves DC-01 in Obsidian (Purple → Red), then agent starts DC-01.

---

### 2026-07-03 — Session 3: DC-01 executed

**Goal:** Start DC-01 — freeze Health Monitor source contracts.

**What happened:**
1. User approved DC-01 (Purple → Red) in Obsidian.
2. Agent started DC-01, created `docs/source-contracts/DC-01-source-contracts.md` and index.
3. Finished DC-01 (Orange → Cyan). Awaiting user Green in Obsidian.

**Deliverable:** `docs/source-contracts/DC-01-source-contracts.md`

**Next:** User marks DC-02 Green → unlocks AR-02.

---

### 2026-07-03 — Session 4: DC-02 executed

**Goal:** Define source-state display policy.

**Deliverable:** `docs/source-contracts/DC-02-source-state-display-policy.md`

**Next:** User marks DC-02 Green → unlocks AR-02.

---

### 2026-07-10 — Session: Reset after failed live test

**Goal:** Start implementation from scratch after empty Bayer dashboard on host.

**Findings:**
- Default HM URL: `lib=syslib.app-webstudio-healthmonitor&func=dashboard_compilation`
- Bayer dashboard empty (tree, table, ProcessState) — wrong lib/ctx and unvalidated widget JSON
- User hosts compilation on Script library object under Smart Sentinel AI (not Custom Properties)
- Prior `bayer-health-monitor-full.json` was speculative; nav `type: tree` not verified

**Next:** User captures default HM compilation from DevTools; rebuild minimal smoke test, then Bayer styling.

---

### 2026-07-10 — Session: Custom Properties smoke test live

**Goal:** Get smoke-test layout showing on host via correct Smart Sentinel AI configuration.

**Root cause of earlier confusion:**
- `Bayer Health Monitor` is **CustomPropertyName** on the **Smart Sentinel AI folder**, not a separate object
- User had pasted JSON into `ScriptLibrary.AdvancedLuaScript` instead of `CustomOptions.CustomProperties.CustomPropertyValue`
- `CustomPropertyValue` still held old full dashboard (tabs, wrong `HealthMonitor` lib)

**What worked:**
1. `smart-sentinel-ai-upsert-verify.lua` → green "PASTE VERIFIED" banner confirmed correct field
2. `smart-sentinel-ai-upsert-smoke-test.lua` → smoke layout live: header, tree, overview table, counters table, **no tabs**
3. Launch URL unchanged: `obj=.../Smart Sentinel AI&name=Bayer Health Monitor`
4. Module name `bayer.healthmonitor` unchanged (not used for Custom Properties entry)

**Artifacts:** `compilations/build-smart-sentinel-upsert.py`, `smart-sentinel-ai-upsert-verify.lua`, `smart-sentinel-ai-upsert-smoke-test.lua`

**Next:** Confirm `fetchNavigationTree` / `fetchNavigationTable` return data; then Bayer styling and full parity widgets.

---

### 2026-07-10 — Session: Smoke test data validated

**Confirmed on host (screenshot):**
- Navigation tree populated (Server Model, I/O Model, expandable nodes)
- Overview table: Name / Type / Object / Comm. — 867 rows, Good states visible
- Tree click → Performance Counters table fills (e.g. LA-ARG-PLA-P0-RELAY-001: lag, CPU, disk, memory, etc.)
- Webstudio CONNECTED

**Phase 1 complete.** Next: Bayer PMM styling, then Properties + Chart tabs from default HM capture.

---

### 2026-07-10 — Session: Smart Sentinel full layout (end of day)

**Goal:** HM-style left column (Navigation \| Overview, properties, counters right) with Bayer skin; fix layout and properties panel.

**Validated on host by user:**
- Overview tab: full left table + counters right
- Navigation tab: tree, properties populate on click, counters right
- Properties panel readable (16-row height, 2× row scale), Name/Type beside icon, no white grid lines

**What we built:**

| Artifact | Role |
|----------|------|
| `build-bayer-full-tabs.py` | Layout builder |
| `bayer_properties_panel.py` | Nested properties compilation + delegate worker wiring |
| `bayer-skinned-full.json` | Generated compilation |
| `smart-sentinel-ai-upsert-full.lua` | DataStudio deploy script |
| `default-hm-tree-tab-clone.json` | HM tab-tree properties reference |

**Layout constants:** `LEFT_W=28`, `PANEL_H=54`, `PROPS_CONTENT_ROWS=16`, `PROPS_H` from panel module, tree `NAV_H = 54-4-PROPS_H`.

**Resume next week:**
1. Read `.cursor/SESSION_LOG.md` + `focus.md`
2. `python compilations/build-bayer-deploy.py` before any layout change
3. Next features: Chart tab, VA-01 parity checklist
4. User pushed to GitHub — commits `d28dcfc` + `a3d0280` on `origin/master`

**User sign-off:** Layout and properties "look amazing" — work paused for the week.

---


### 2026-07-17 — Chart/Submit validated; start VA-01 live parity

**Saved:** commit `a5a8326` + tag `smart-sentinel-chart-submit-ok` (Submit → Chart, icon switcher, hide-first layout). User sign-off: looks amazing.

**Also:** refreshed `docs/validation/VA-01-parity-checklist.md` with Smart Sentinel Custom Properties URLs; ProcessState marked N/A.

**Next:** Live side-by-side VA-01 parity run (board VA-01 was checklist authoring only — already green). Propose VA-03 if needed for live run.

---

### 2026-07-17 — EOD: App shell + Designer Overview KPIs

**Goal:** Move toward Designer.png — persistent left menu; Overview page KPI row.

**Built (not yet confirmed live by user at EOD):**
- Persistent dark left menu: **Overview** (house) \| **Trends** (chart icon) — menu never hides
- Trends page = existing HM UI (Navigation/Overview tabs, tree, props, counters/chart)
- Overview page: 6 Designer-style KPI cards (Health Score semi-circle, Total Components, Problems, Warnings, Info, Sites Impacted)
- Data from `fetchNavigationTable` WorstState/Path aggregates only

**Key new files:**
- `compilations/bayer_app_shell.py`
- `compilations/bayer_overview_kpis.py`

**Reference images:** `Downloads/Designer.png`; style mockup saved in Cursor assets

**Resume next session:**
1. Read `.cursor/SESSION_LOG.md` Current State + this entry
2. `python compilations/build-bayer-deploy.py` → deploy Lua → hard-refresh
3. Validate Overview menu + KPI style vs Designer; polish if needed
4. Then continue Designer (more Overview widgets) or VA-03 parity

**User sign-off:** Stopping for the day — save everything for next session.

---

### 2026-07-20 — Pivot: freeze WebStudio; plan HTML + Web API

**Decision:** Designer.png-level UI is not practical in WebStudio alone. Keep WebStudio work frozen (`ccf7ce5`, tag `smart-sentinel-overview-kpis-wip`). New phase = **HTML page + inmation Web API**, same Health Monitor data, IWA auth.

**Feasibility (docs):**
- Auth: `GET /api/security/windows/authorize` + `credentials: "include"` → Bearer token
- Data: `POST /api/v2/execfunction` → `syslib.app-webstudio-healthmonitor` (`fetchNavigationTable`, etc.)
- Profile mapping: Windows user → inmation Profile (same as WebStudio)

**Next:** Answer hosting/stack/scope questions → spike IWA + one fetch from HTML → build Overview like Designer.png

---

### 2026-07-20 — AR-03 decisions locked

**Answers captured** → plan in `docs/architecture/AR-03-html-webapi-plan.md`.

**Recommendations accepted into plan:**
- Stack: Vite + plain HTML/CSS/JS (team maintainability)
- Health Score later: Good% from WorstState (not a new engine)
- First deliverable: static Designer.png HTML (fake data); then guided IWA + HM spike

**Next:** Build static Designer draft when user says go.

---

### 2026-07-20 — Static Designer HTML draft

**Built:** `web/` — Vite + plain HTML/CSS/JS matching Designer.png Overview (mock data only).

**Run:** `cd web && npm install && npm run dev` → http://localhost:5173

**Includes:** sidebar menu, header, 6 KPIs, donuts, critical issues, site summary + sparklines, issues over time, top types, recent alerts.

**Next:** User visual review → guided IWA spike.

---

### 2026-07-20 — EOD: HTML multi-page draft liked; save for next session

**User:** Liked the work; pause and save everything for next session.

**Built in `web/` (static mock):**
- PMM-style header (Bayer logo, Smart Sentinel, User Guide, Dev/RESTRICTED/CONNECTED) — white left / blue right gradient
- Browser tab title: **Smart Sentinel**
- **Overview** — Designer KPIs + charts/tables
- **Health Monitor** — tree, object properties, performance counters, Submit
- **Issues & Alerts** — horizontal split: Issues (top) / Warnings (bottom)
- **Trends** — tree select + multi-pen trend; ranges **1d / 7d / 1m / 2m**
- **Drill-down** — Site/Type/Severity filters → hierarchy table → detail + Open in Trends
- **Configuration** — EAM Critical Objects table; add/delete alert emails (in-memory)
- Reports still placeholder

**Key new/updated files:**
- `web/src/trends.js`, `drill-down.js`, `configuration.js`
- `web/src/drill-mock-data.js`, `config-mock-data.js`
- `web/src/health-monitor.js`, `hm-mock-data.js`, `charts.js`, `styles.css`, `index.html`
- `focus.md` updated for resume

**Run:** `cd web && npm run dev` → http://localhost:5173

**Board:** Proposed still VA-03, VA-04, AR-03 (purple). HTML work progressed; propose follow-up tasks next session if needed.

**Resume next session:**
1. Read `.cursor/SESSION_LOG.md` Current State + this entry + `focus.md`
2. Do **not** re-ask paths / GitHub / Kanvas
3. Start **guided IWA spike** + one HM `execfunction` (`fetchNavigationTable`)
4. Then wire live data into Overview (then other pages)

**User sign-off:** Stopping — draft looks great; save for next session.

---

### 2026-07-20 — EOD #2: IWA spike success + live HM tree

**Proven live against host `byus00876m1.bayer.cnb:8002`:**
- IWA: `GET /api/security/windows/authorize` → token OK
- User: `AD-BAYER-CNB\GOAKJ`
- `fetchNavigationTree` via `execfunction` → **live Navigation tree** in Health Monitor (Connect)

**Built:**
- `web/src/api/inmation.js` — authorize (direct host), Bearer exec via Vite `/api` proxy, session token
- `web/src/api/hm-live.js` — tree/props/counters mapping; `ObjectID` coerced to number
- Health Monitor Connect bar: LIVE / MOCK, Connect, Paste token, Use mock
- Props vs counters load independently (counters failure no longer blocks props)

**Open issue (resume next):**
- `fetchPerformanceCountersTable` returned 400 for Core: `Cannot find inmation object with ID: 281474977300480`
- Numeric ObjectID coerce + Path retry added; **re-test after refresh** next session
- Then wire Overview from `fetchNavigationTable`

**Run:** `cd web && npm run dev` → localhost:5173 or 5174

**User sign-off:** Save + push for today.

<!-- Append new sessions below this line -->

### 2026-07-21 — Object Properties polish + IWA auto-connect

**UX fixes:**
1. Removed `fetchObjProps` / mock label next to “Object Properties”
2. Auto IWA on app load (`ensureIwaSession` in `main.js`); Health Monitor auto-loads live tree on first open (no manual Connect each refresh)
3. Topbar **CONNECTED** (green) / **DISCONNECTED** (gray) reflects real IWA session; Sign out clears session

**Files:** `web/src/session.js`, `web/src/health-monitor.js`, `web/src/main.js`, `web/index.html`, `web/src/styles.css`

### 2026-07-21 — Counters select / sort / Submit → chart

**UX:**
- Multi-select counters (row click + checkbox + select-all)
- Sortable columns: Name, Type, Group, Value, Unit, Description (HM schema)
- Submit → `POST /api/v2/readhistoricaldata` (1d) → Chart.js in same panel
- Gauge / trend icons toggle table ↔ chart freely

**Files:** `web/public/icons/hm-*.svg`, `web/src/hm-counter-chart.js`, `web/src/api/hm-live.js`, `web/src/health-monitor.js`, `web/index.html`, `web/src/styles.css`

**Resume next:** Overview from `fetchNavigationTable`.

---

### 2026-07-21 — Chart pen toggle + Navigation list view

**Chart:** With 2+ pens after Submit, click pens in the legend to show/hide series (Bayer navy accents). Selection retained when live history replaces the estimate.

**Navigation:** Tree ↔ list toggle (HM-style Name / Type table). List from `fetchNavigationTable` (mock offline). Row colors from source states only:
- **Bad** → burgundy `--bayer-bad` (`#6b1c2a`)
- **Empty / Disabled / Neutral** → mustard `--bayer-warning` (`#c4a035`)

**Files:** `web/src/health-monitor.js`, `web/src/api/hm-live.js`, `web/src/hm-mock-data.js`, `web/src/hm-chart-paint.js`, `web/index.html`, `web/src/styles.css`

**Resume next:** Overview KPIs from same nav table.

---

### 2026-07-21 — Overview KPIs from navigation table

**Overview live KPIs** (same source/classification as HM List View):
- Total Components = `fetchNavigationTable` row count
- Problems by Component = bad (red) count
- Warnings by Component = warning (yellow) count
- Health Score = doughnut (Good / Problems / Warnings / Disabled) + % healthy in center

**Files:** `web/src/main.js`, `web/src/charts.js`, `web/src/api/hm-live.js`, `web/index.html`, `web/src/styles.css`

---

### 2026-07-21 EOD — Save + push (list polish + Overview)

**Shipped today (HTML `web/`):**
1. Chart: multi-pen select/deselect in legend
2. Navigation List View: Name / Type / Object; sort arrows; horizontal scroll; full-height when list active (props hidden)
3. List health colors (Overview palette): Bad=red, Warning/Empty/COMM_EMPTY=yellow, Disabled=grey text only; Disabled before Warning
4. Removed HM LIVE/Connect bar (IWA via topbar only)
5. Overview KPIs live from `fetchNavigationTable`: Total, Problems, Warnings, Disabled + Health Score doughnut (% Good)
6. Object Properties header matches Navigation color
7. List click loads performance counters (synthetic node from nav row when not in tree)

**Classification** — see Current State table (`classifyNavHealth`).

**Resume next:** Sites Impacted live; optional Components-by-type from nav table; Trends/Drill-down.

**User sign-off:** Save + document + push.

---

### 2026-07-22 — Overview filter bar

**Wired Overview filters** (`web/index.html`, `web/src/main.js`, `web/src/api/hm-live.js`):
1. **Time range** — Last 24 hours / Last 7 days / Last month → Issues Over Time window (hourly vs daily samples in `localStorage`)
2. **Site** — Dynamic options from detected known sites + All; filters all Overview widgets
3. **Auto refresh · 5 min** — when checked, refetch nav table every 5 min while Overview is visible

**Also:** HM Navigation tree always starts collapsed; Time Period modal uses Object Properties palette.

**Issues & Alerts live:** three panels (Problems / Warnings / Disabled) from `fetchNavigationTable` via `listIssuesAndAlerts` — Time, Severity, Site, Component, Type, Message, Status, Duration (onset tracked in `localStorage` because nav table has no start timestamp). Pagination 15/page + sortable headers.

**Drill-down live:** `navRowsToDrillObjects` from nav table; Site/Type/Severity filters dynamic; sortable headers; 15/page; related issues from same live classification.

**Reports tab:** embeds host Report Viewer for the same two Report Items as default HM (Health Monitor Report + Use Case Report). Data is generated on the Core Report Item, not in the browser/cloud SPA.

**Resume next:** Trends live as needed; commit/push when asked.

---

### 2026-07-22 — Reports via `inmation.app-reportviewer`

**API (confirmed from Network on host Report Viewer):**
1. `POST …/execfunction/inmation.app-reportviewer/reports?ctx=<Report Item path>` → designs (`Header` default, `Report`)
2. `POST …/reportdata?ctx=<same>` body `{ name: "Report" }` → Stimulsoft `design` + ADO.NET DataSet XML in `data`

**Smart Sentinel:** custom HTML from XML (doughnuts + inventory tables + certificates). No Stimulsoft. Prefer design `"Report"`. Paths: Health Monitor Report + Use Case Report under System Monitoring.

**Files:** `web/src/api/inmation.js` (`ctx` + reportviewer helpers), `web/src/reports.js`, `web/index.html`, `web/src/styles.css`, `main.js` → `initReportsPage()`.

**Resume next:** Live smoke-test Reports; Use Case schema if needed; commit when asked.

---

### 2026-07-22 — Revert Reports (page unbroken)

**Cause:** `reports.js` imported `ensureConnected` from `session.js`, but only `ensureIwaSession` exists. Vite failed to load `main.js` → CSS never applied (unstyled nav / huge icons).

**Reverted:** deleted `web/src/reports.js`; removed Reports panel + wiring from `index.html` / `main.js`; removed reportviewer helpers + `?ctx=` from `inmation.js`; removed Reports CSS. Reports nav falls back to `page-other` placeholder.

**Resume next:** Confirm styled app loads; re-do Reports only when asked.

---

### 2026-07-22 — Reports re-implemented (safe)

**Fixes vs broken attempt:**
- `ensureIwaSession` (not `ensureConnected`)
- `renderHealthDoughnut(canvas, …)` + `Chart.getChart` destroy
- **Dynamic** `import("./reports.js")` from nav — Reports errors cannot blank the whole app CSS
- Prefer design `"Report"`; XML HTML render (no Stimulsoft); `?ctx=` on reportviewer

**Verified:** `node --check` + `vite build` OK (separate `reports-*.js` chunk).

**Resume next:** Live smoke-test Reports on host; commit when asked.

---

### 2026-07-22 — Fix reportviewer `objspec` / Open HM link

**Root cause:** WebStudio body is `{ objspec: path, reportname }` — not empty/`{ name }` with only `?ctx=`. Missing `objspec` → `Argument 'objspec' must be a string or a number.`

**Open in Health Monitor:** use absolute `WEBAPI_HOST/apps/webstudio?...` (relative localhost URL failed to load properly).

**Resume next:** Reload Reports tab and confirm XML HTML render.

---

### 2026-07-22 — Use Case Report hang / schema

**Issue:** Use Case stuck on `Loading "Report"…` while HM Report worked.

**Fixes:** `omitreportdesign: true` (skip huge Stimulsoft design); abort + 180s timeout when switching; if XML isn’t HM-shaped, render generic tables from all dataset rows.

**Resume next:** Retest Use Case Report live.

---

### 2026-07-22 — Reports: drop Use Case; site filter + sortable tables

- Removed Use Case Report tab (HM Report only).
- Site filter in Reports toolbar (same known-site convention as Overview).
- All report tables: clickable column headers to sort (▲/▼); works for inventory, datasources, certificates, env, and future generic tables.

**Resume next:** Smoke-test site filter + sort on live HM Report.

---

### 2026-07-22 — Certificates panel on Issues & Alerts

- New panel under Problems / Warnings / Disabled.
- Data from HM Report (`reportdata`, XML only): expired or &lt;30 days, same red / yellow / yellow→red rules.
- Helper: `web/src/api/hm-certificates.js`.

**Resume next:** Open Issues & Alerts connected and confirm Certificates loads.

---

### 2026-07-22 EOD — save point (Reports + Issues Certificates)

**Shipped today:**
1. **Reports** — live HM Report via `inmation.app-reportviewer` (`objspec` + `reportname` + `omitreportdesign`); custom HTML (no Stimulsoft); site filter; sortable tables; cert urgency colors; Use Case tab removed; safe dynamic import.
2. **Issues & Alerts** — Certificates panel (expired / &lt;30d) from same report XML (`hm-certificates.js`).
3. Supporting live wiring in Overview / Issues / Drill-down / HM as already in working tree.

**Run:** `cd web && npm run dev` → proxy to `byus00876m1.bayer.cnb:8002`.

**Resume next:** Trends polish if needed; push only when asked.

---

### 2026-07-22 — State-flag health classification

Reworked `classifyNavHealth` to use **only** the object `State` pipe flags:

| Class | Flags |
|-------|--------|
| Problem | `COMM_ERROR`, `STATE_ERROR`, `OBJ_CLASS_MISMATCH` |
| Warning | `COMM_WARNING`, `STATE_WARNING`, `STATE_UNCONFIRMED` |
| Unknown | `STATE_EMPTY` |
| Good | else (`COMM_EMPTY` alone OK; ignore `OBJ_DYNAMIC` / `OBJ_ENABLED`) |

UI: KPI / Issues panel / doughnut / timeline label **Disabled → Unknown**. Legacy summary key `disabled` kept as alias of `unknown`.

---

### 2026-07-22 — Docs-aligned classification applied

Applied inmation states docs to Overview / Site Summary / Issues:

| Class | Flags |
|-------|--------|
| Problem | `COMM_ERROR`, `STATE_ERROR` |
| Warning | `COMM_WARNING`, `STATE_WARNING`, `STATE_UNCONFIRMED`, `OBJ_CLASS_MISMATCH` |
| Disabled | neutral **and** no `OBJ_ENABLED` (DataStudio grey), or HM Object/Worst = Disabled |
| Unknown | `STATE_EMPTY` |
| Good | else |

`OBJ_CLASS_MISMATCH` moved Problem → Warning. Rollup fallback maps Disabled/Neutral → `COMM_NEUTRAL` / `STATE_NEUTRAL`. Smoke tests OK (MQTT Problem, mismatch Warning, neutrals Disabled).

---

### 2026-07-22 — Reports: default Not Good

Reports inventory (Cores / Relays / Connectors / Datasources / …) defaults to **State = Not Good** (hides Good). Toolbar filter: Not Good | All | Bad | Warning | Disabled | Good. Rows sorted worst-first within that view. “All N are Good.” uses Good greens.

---

### 2026-07-22 EOD #2 — save + push (classification + Reports)

Saved and pushed to `origin/master`:

1. Docs-aligned Overview classification; Disabled = off objects only (`!OBJ_ENABLED` + neutral).
2. Nav vs Overview data-source split; Issues Message enrich; KPIs G/P/W/U/D.
3. Reports default **Not Good** filter + green “all Good” messages.

**Run next:** `cd web && npm run dev` → http://localhost:5173

---
