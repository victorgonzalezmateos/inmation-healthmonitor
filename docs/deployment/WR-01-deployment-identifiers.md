# WR-01 — Deployment Identifiers

> **Status:** Frozen (2026-07-03)  
> **Task:** WR-01 on `Project.canvas`

Final Webstudio deployment identifiers for the Bayer Health Monitor custom app.

---

## 1. Identifiers (frozen)

| Identifier | Value | Notes |
|------------|-------|-------|
| **ctx** | `bayerhm` | Webstudio context namespace |
| **lib** | `HealthMonitor` | Reuse default HM Lua library (fetch* functions) |
| **func** | `BayerHealthMonitorMain` | Screen entry function |
| **dashboard name** | `Bayer Health Monitor` | `CustomPropertyName` entry + URL `name` param |
| **compilation file** | `bayer-health-monitor-full.json` | Merged publish artifact |

---

## 2. Host object (Custom Properties)

| Environment | Object path | Notes |
|-------------|-------------|-------|
| **Default (dev)** | `/System/Core/_Global Core Logic/Development/Auto Dashboard` | Same pattern as PMM / Vibe dashboards |
| **Production** | Confirm with inmation admin before publish | Update `WR-01-HOST-OBJECT` env only — no code change |

Property paths:
```
{host}.CustomOptions.CustomProperties.CustomPropertyName   → includes "Bayer Health Monitor"
{host}.CustomOptions.CustomProperties.CustomPropertyValue  → compilation JSON
```

---

## 3. Launch URL

### Template

```
https://{host}:{port}/apps/webstudio
  ?hostname={host}
  &port={port}
  &secp=iwa
  &ssl=true
  &ctx=bayerhm
  &lib=HealthMonitor
  &func=BayerHealthMonitorMain
```

### Alternative (name-based launch on host object)

```
https://{host}:{port}/apps/webstudio
  ?hostname={host}
  &port={port}
  &secp=iwa
  &ssl=true
  &obj={url-encoded-host-object-path}
  &name=Bayer%20Health%20Monitor
```

| Parameter | Required | Value |
|-----------|----------|-------|
| `secp` | yes | `iwa` |
| `ssl` | yes | `true` |
| `ctx` | yes* | `bayerhm` |
| `lib` | yes* | `HealthMonitor` |
| `func` | yes* | `BayerHealthMonitorMain` |
| `obj` + `name` | alt | Host object + dashboard name |

\* Use `ctx`/`lib`/`func` **or** `obj`/`name` per site convention — align with default Health Monitor launch pattern on target host.

### Example (placeholder host)

```
https://byus00876m1.bayer.cnb:8002/apps/webstudio?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&ctx=bayerhm&lib=HealthMonitor&func=BayerHealthMonitorMain
```

---

## 4. Library reuse decision

| Option | Chosen | Rationale |
|--------|--------|-----------|
| New Lua lib reimplementing fetch* | **No** | Audit risk; duplicates monitoring logic |
| Reuse `HealthMonitor` lib | **Yes** | Same backend functions as default HM (DC-01, AR-01) |
| Thin wrapper lib | No for v1 | Bayer styling is compilation-only |

All `compilations/*.json` use `lib: HealthMonitor`, `ctx: bayerhm`.

---

## 5. Publish checklist

1. Merge sections into [`bayer-health-monitor-full.json`](../../compilations/bayer-health-monitor-full.json)
2. Read `CustomPropertyName` / `CustomPropertyValue` from host object
3. Upsert `Bayer Health Monitor` at matching index
4. Write both tables back
5. Open launch URL on domain-joined Windows client (IWA)
6. Run [VA-01 parity checklist](../validation/VA-01-parity-checklist.md)

---

## 6. References

- [AR-01](../architecture/AR-01-webstudio-runtime-architecture.md)
- [compilations/README.md](../../compilations/README.md)
- Default Health Monitor + PMM URL examples (`secp=iwa`, `ssl=true`)
