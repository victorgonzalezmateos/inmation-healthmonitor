# Project Plan — Health Monitor Webstudio Parity

Source of truth: **`Project.canvas`** (managed via Kanvas). This document is a readable summary.

## Goal

Deliver a custom Bayer Health Monitor Webstudio app with full parity to the default Health Monitor, PMM Bayer styling, and audit-friendly behavior (no invented health logic, no custom login).

## Dependency flow

```
DC-01 ─┬─→ DC-02 ────────────────┐
       ├─→ AR-01 ─→ AR-02 ───────┼─→ UP-01 ─→ UP-02 ─→ UP-03 ─→ UP-04 ─→ UP-05 ─→ VA-01 ─→ VA-02 ─┬─→ PPE-01
       │         AR-01 ─→ WR-01 ─┘                                                                  └─→ PPE-02
```

**Start here:** DC-01 (no upstream dependencies).

---

## Discovery Contracts

| ID | Title | Description |
|----|-------|-------------|
| **DC-01** | Freeze captured Health Monitor source contracts | Document contracts from `dashboard_compilation`, `fetchNavigationTree`, `fetchNavigationTable`, `fetchObjProps`, `fetchPerformanceCountersTable`, chart calls. Mark `fetchLogTable` optional for v1. Preserve raw field names and state values. |
| **DC-02** | Define source-state display policy | How UI displays source states without transforming them: `ProcessState`, `CommState`/`ObjectState`/`WorstState` (Good/Empty/Disabled/Bad/Neutral), compound `State` values (e.g. `COMM_GOOD\|STATE_GOOD\|OBJ_ENABLED`). |

## Architecture

| ID | Title | Description |
|----|-------|-------------|
| **AR-01** | Design Webstudio app runtime architecture | Custom Health Monitor as Webstudio app: `/apps/webstudio`, `secp=iwa`, `ssl=true`, custom ctx/lib/func. No custom login. Respect backend access fields. |
| **AR-02** | Design data wiring and component boundaries | Map UI surfaces to backend sources. No duplicated monitoring logic. |

## UI Parity

| ID | Title | Description |
|----|-------|-------------|
| **UP-01** | Design PMM Bayer visual system | Light theme, `#10384F` nav, Bayer green active indicator, compact tables, rounded panels. Reference PMM compilation models. |
| **UP-02** | Implement Overview hierarchy parity | Unhealthy site/core/connector/datasource emphasis via `fetchNavigationTable` + tree topology. Collapse healthy branches. |
| **UP-03** | Implement selected-object property panel | `fetchObjProps`: ObjectName, Type, ObjectID, Path, State, etc. Preserve compound State text. |
| **UP-04** | Implement performance counters detail | `fetchPerformanceCountersTable` — healthy (many counters) and bad (health rows only) cases. |
| **UP-05** | Implement chart drill-down parity | Submit to Chart: pens, one-day range, aggregate, T/V/Q intervals. |

## Webstudio Runtime

| ID | Title | Description |
|----|-------|-------------|
| **WR-01** | Define deployment identifiers | Final ctx, library name, screen function for Bayer Health Monitor URL. |

## Validation

| ID | Title | Description |
|----|-------|-------------|
| **VA-01** | Create default-vs-custom parity checklist | Same hierarchy, unhealthy objects, states, properties, counters, chart behavior. |
| **VA-02** | Validate audit-friendly behavior | No client health calc, no state transformation, no custom login, all states trace to sources. |

## Post Parity Enhancements (after VA-02)

| ID | Title | Description |
|----|-------|-------------|
| **PPE-01** | Plan optional logs integration | `fetchLogTable` in v1 or later. |
| **PPE-02** | Plan Bayer operational widgets | Unhealthy-first summary, filters, collapsed counts — organize only, never calculate health. |

---

## Current status (2026-07-03)

- All 14 tasks: **Purple** (proposed)
- Ready: **0** (approve tasks in Obsidian to unlock)
- Next action: Approve **DC-01** → Red, then agent starts work
