# AR-03 — HTML Health Monitor via Web API

> **Status:** Decisions locked (2026-07-20)  
> **Task:** AR-03 on `Project.canvas`  
> **WebStudio:** Frozen at `ccf7ce5` / tag `smart-sentinel-overview-kpis-wip`

## Goal

Build a **Designer.png-style** webpage for Consumer Health. UI in HTML; later wire **inmation Health Monitor** data via Web API. Auth starts as **Windows IWA** (like WebStudio).

## Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| 1 | Hosting | **Local on your PC first**; migrate later to a shared server for all Consumer Health |
| 2 | Clients | **Domain Windows + Edge/Chrome** for now (no phone/external v1) |
| 3 | Auth now | **IWA only** |
| 3b | Auth later (Q/P) | Plan for **secondary CWID** login when migrating — not in v1 spike |
| 4 | IWA spike | **Yes** — guided step-by-step after first UI draft |
| 5 | First UI milestone | **Static HTML matching Designer.png** — **no real data yet**. You will point to data sources after the draft |
| 6 | Trends | Data must come from **Health Monitor** (not invented). UI can be HTML; source = HM APIs |
| 7 | Health Score | **See recommendation below** |
| 8 | Stack | **See recommendation below** |
| 9 | Maintainers | **Your team** → keep build **simple and easy to maintain** |
| 10 | CORS | **Unknown** — spike will prove; Vite proxy if needed |
| 11 | HM via Web API | **Unknown** — spike will prove with your profile |

## Recommendations (where you asked)

### Health Score (Q7)

**Suggestion:** For the **static draft**, use Designer numbers as placeholders (e.g. 78/100).

When wiring real data later:

- Compute **Good%** = rows with `WorstState === "Good"` / total rows from `fetchNavigationTable`
- Show as **N/100** and label it clearly (e.g. footer “Good share” or keep “Good” when ≥70%)
- Do **not** invent a separate scoring engine — only aggregate source states

That stays audit-friendly and still matches the Designer look.

### Stack (Q8)

**Suggestion: Vite + plain HTML / CSS / JS** (no React for v1).

| Option | Pros | Cons |
|--------|------|------|
| **Vite + vanilla HTML/CSS/JS** ★ | Simple for your team; fast local serve; easy to read; charts via Chart.js/Plotly CDN | Less structure if app grows huge |
| React/Vite (existing skeleton) | Strong for large apps | Heavier for OT team maintenance |
| Single static `.html` file | Simplest | Harder as pages grow |

We use **Vite** only as a local server (and optional proxy to `:8002` for IWA/CORS). Pages stay normal HTML/CSS/JS folders.

## Delivery sequence

```text
1. Static Designer draft (HTML)     ← NEXT — no data
2. IWA spike (authorize + token)    ← guided with you
3. One HM call (fetchNavigationTable) ← prove Web API access
4. Wire Overview KPIs to real data  ← you confirm field mapping
5. More Designer sections           ← step by step
6. Trends from HM chart APIs        ← after Overview
7. Later: host migrate + CWID auth  ← Q/P
```

## Technical sketch (after static draft)

```
Browser (Edge/Chrome, domain user)
  → GET  /api/security/windows/authorize  (credentials: include)
  → POST /api/v2/execfunction
       lib  = syslib.app-webstudio-healthmonitor
       func = fetchNavigationTable | fetchNavigationTree | …
  → Host byus00876m1.bayer.cnb:8002
```

Local Vite `server.proxy` may forward `/api` → `https://byus00876m1.bayer.cnb:8002` so the browser sees same-origin calls (helps IWA/CORS).

## Out of scope for first draft

- Real inmation data  
- IWA / CWID  
- React  
- Production hosting  
- Phone / external users  

## Success criteria

| Milestone | Done when |
|-----------|-----------|
| Static draft | Page looks like Designer.png (shell + Overview layout) on localhost |
| IWA spike | Token returned from authorize endpoint in your browser |
| Data spike | `fetchNavigationTable` JSON visible in page/console |
| KPI wire-up | Cards show live counts you agree match HM |

## References

- Designer: `C:\Users\GOAKJ\Downloads\Designer.png`
- Web API auth: https://docs.inmation.com/api/1.110/webapi/authentication.html  
- Exec function: https://docs.inmation.com/api/1.110/webapi/execfunction.html  
- Frozen WebStudio: tag `smart-sentinel-overview-kpis-wip`
