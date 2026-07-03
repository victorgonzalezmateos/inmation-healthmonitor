# AR-01 — Webstudio App Runtime Architecture

> **Status:** Frozen (2026-07-03)  
> **Task:** AR-01 on `Project.canvas`  
> **Depends on:** [DC-01](../source-contracts/DC-01-source-contracts.md)  
> **Related:** WR-01 (final ctx/lib/func identifiers), AR-02 (data wiring)

## 1. Architecture summary

The Bayer Health Monitor is a **custom inmation Webstudio application** — not a standalone SPA with custom auth. It reuses the **default Health Monitor Lua data layer** (`fetchNavigationTree`, `fetchNavigationTable`, etc.) inside a **new Webstudio compilation** with Bayer PMM styling.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser — /apps/webstudio?secp=iwa&ssl=true&…                  │
│  IWA auth (no custom login UI)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Webstudio runtime                                              │
│  • Loads dashboard_compilation (Custom Properties on host obj)  │
│  • Renders widgets (tabs, tables, forms, charts)                │
│  • Calls Lua via execfunction: ctx / lib / func                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Lua script library (Health Monitor functions)                  │
│  fetchNavigationTable, fetchObjProps, createtrend, …            │
│  (existing backend — not reimplemented)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  inmation object model + monitoring logic (server-side)         │
└─────────────────────────────────────────────────────────────────┘
```

**Out of scope for v1:** Custom OAuth/login page, client-side health engine, duplicate monitoring calculations.

**Note on `src/` (React + Vite):** Repo scaffold is for optional local prototyping only. **Production delivery is Webstudio** per project plan. Do not fork auth or data paths into a parallel React app for v1.

---

## 2. Launch URL and authentication

### 2.1 URL pattern (aligned with default Health Monitor and PMM)

```
https://{host}:{port}/apps/webstudio
  ?hostname={host}
  &port={port}
  &secp=iwa
  &ssl=true
  &ctx={context}
  &lib={library}
  &func={screen_function}
  [&obj={host_object_path}]
  [&name={dashboard_name}]
```

| Parameter | Value | Notes |
|-----------|-------|-------|
| `secp` | `iwa` | Integrated Windows Authentication — **required** |
| `ssl` | `true` | HTTPS |
| `ctx` | TBD (WR-01) | Webstudio context namespace |
| `lib` | TBD (WR-01) | Lua script library name |
| `func` | TBD (WR-01) | Entry screen function |
| `obj` | host object path | Object holding Custom Properties (if using `name` launch) |
| `name` | dashboard title | Lowercase param `name` — case-sensitive dashboard name in CustomPropertyName |

**Forbidden:** Custom login screen, `secp=token` in operator-facing URL unless explicitly required for non-Windows kiosks (out of v1 scope).

### 2.2 Authentication flow

1. User opens Webstudio URL in browser on domain-joined Windows session.
2. IWA negotiates AD credentials — no password form in custom UI.
3. Webstudio runtime inherits WebAPI identity.
4. Lua functions execute with user's inmation permissions.

### 2.3 Access control

- Respect `access` field from `fetchObjProps` and backend visibility.
- Widgets must not show objects/paths the user cannot read.
- On permission failure: show source error or empty state — **do not** substitute synthetic data.

---

## 3. Dashboard storage (compilation)

### 3.1 Custom Properties model

Published dashboard JSON lives on a host object (typically Auto Dashboard or Bayer-specific host — confirm in WR-01):

| Property | Path suffix | Content |
|----------|-------------|---------|
| `CustomPropertyName` | `…CustomOptions.CustomProperties.CustomPropertyName` | Table of dashboard names |
| `CustomPropertyValue` | `…CustomOptions.CustomProperties.CustomPropertyValue` | Table of compilation JSON strings (same index as name) |

**Publish flow:** Read → normalize to arrays → upsert by dashboard name → write both tables (never overwrite sibling dashboards).

### 3.2 Compilation structure

Bayer Health Monitor compilation (`dashboard_compilation`) contains:

| Section | Purpose |
|---------|---------|
| `version` | Webstudio compilation schema version |
| `options` | Grid rows/columns, theme hooks |
| `widgets[]` | Layout: header, tabs, tables, property panel, chart area |
| `styles` | PMM Bayer tokens (UP-01) — lowercase hex |
| `dataSource` per widget | Binding to Lua `lib`/`func` |

**Reuse strategy:** New compilation JSON + Bayer styles. **Same Lua function names** as default Health Monitor for data widgets (DC-01).

---

## 4. Runtime layers

### 4.1 Layer 1 — Webstudio shell

- Tab bar: Overview | Properties | Counters | Chart (logs tab deferred per DC-01)
- Header: app title + `ProcessState` strip (DC-02)
- `refreshInterval` on polling widgets (e.g. 10–30s for Overview table)

### 4.2 Layer 2 — Lua script library

| Approach | Decision |
|----------|----------|
| Reimplement fetch* in new lib | **No** — use existing Health Monitor library |
| Thin Bayer wrapper lib | **Optional** — only for layout-specific helpers that delegate to fetch* |
| Entry `func` | Returns root compilation or routes to screen builder |

**WR-01** will assign concrete `ctx`, `lib`, `func`. Until then use placeholders:

```
ctx=bayerhm
lib=HealthMonitorBayer   # or reuse default HM lib if deployment allows
func=mainScreen
```

### 4.3 Layer 3 — Widget bindings

Each widget `dataSource` references:

```json
{
  "type": "function",
  "library": "<lib>",
  "function": "fetchNavigationTable",
  "context": { "selectedPath": "{{selection.path}}" }
}
```

Context passed via Webstudio `execfunction` — normalize `arg` / `req` / `hlp` in Lua entry points (syslib pattern).

### 4.4 Layer 4 — Selection state

| State | Holder | Consumers |
|-------|--------|-----------|
| Selected object `Path` | Webstudio shared context / form hidden field | `fetchObjProps`, `fetchPerformanceCountersTable`, chart calls |
| Active tab | Webstudio tabs widget | Panel visibility |
| Chart pens | Chart widget state | `createtrendpen`, `readhistoricaldata` |

No client-side store outside Webstudio runtime for v1.

---

## 5. Screen layout (logical)

```
┌──────────────────────────────────────────────────────────────┐
│ Header  [#10384F]  Bayer Health Monitor   ProcessState: …    │
├──────────────┬───────────────────────────────────────────────┤
│ Nav tree     │  Overview table (fetchNavigationTable)      │
│ (fetchNav    │  + DC-02 state colors                       │
│  Tree)       │                                             │
│              ├─────────────────────────────────────────────┤
│              │  Detail tabs:                               │
│              │  • Properties (fetchObjProps)               │
│              │  • Counters (fetchPerformanceCountersTable)   │
│              │  • Chart (createtrend / readhistoricaldata)   │
└──────────────┴───────────────────────────────────────────────┘
```

Exact widget grid defined in UP-01/UP-02 implementations; this is the logical boundary map for AR-02.

---

## 6. Deployment topology

| Artifact | Location | Owner |
|----------|----------|-------|
| Compilation JSON | CustomPropertyValue on host object | WR-01 / publish pipeline |
| Lua library | inmation script library object | Reuse or extend HM lib |
| Styles | Embedded in compilation + PMM catalog refs | UP-01 |
| Icons/images | `Image` fields from sources | No local override |

**Environments:** Same URL pattern per host; only `hostname`/`port`/`obj` change.

---

## 7. Non-functional requirements

| Requirement | Approach |
|-------------|----------|
| Auditability | All state text from sources (DC-02); no client health calc |
| Parity | VA-01 checklist against default HM URL side-by-side |
| Performance | Poll Overview on interval; load props/counters on selection change |
| Errors | Surface Lua/WebAPI errors in widget — no fake “Good” rows |
| TLS | `ssl=true`; follow corporate cert policy |

---

## 8. Open items → WR-01 / AR-02

| Item | Task |
|------|------|
| Final `ctx`, `lib`, `func` | WR-01 |
| Host object path for Custom Properties | WR-01 |
| Dashboard name in CustomPropertyName | WR-01 |
| Per-widget dataSource mapping | AR-02 | Done → [AR-02-data-wiring-and-components.md](./AR-02-data-wiring-and-components.md) |
| PMM style catalog attachment | UP-01 |

---

## 9. References

- [DC-01 Source contracts](../source-contracts/DC-01-source-contracts.md)
- [DC-02 Display policy](../source-contracts/DC-02-source-state-display-policy.md)
- inmation Webstudio: Custom Properties, `/apps/webstudio`, `execfunction`
- Default Health Monitor + PMM URL examples (same `secp=iwa`, `ssl=true`)
