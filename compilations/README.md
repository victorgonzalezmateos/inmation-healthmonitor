# Webstudio Compilations — Smart Sentinel

## Deploy (current workflow)

| Step | Command / file |
|------|----------------|
| **1. Build** | `python compilations/build-bayer-deploy.py` |
| **2. Upsert on host** | Run `compilations/smart-sentinel-ai-upsert-full.lua` in **DataStudio console** (`syslib.mass`) |
| **3. Refresh** | Hard-refresh Webstudio (Ctrl+F5) |

| Key | Value |
|-----|-------|
| Folder | `/System/Core/_Global Core Logic/Development/Smart Sentinel AI` |
| CustomPropertyName | `Bayer Health Monitor` |
| Launch | `obj=.../Smart Sentinel AI&name=Bayer%20Health%20Monitor` |
| Data lib | `syslib.app-webstudio-healthmonitor` (no `ctx`) |

## Main artifacts

| File | Purpose |
|------|---------|
| **`bayer-skinned-full.json`** | Generated compilation (do not edit by hand) |
| **`smart-sentinel-ai-upsert-full.lua`** | Console upsert script (deploy target) |
| `bayer-skinned-smoke.json` | Flat working base (tree + overview + counters) |
| `build-bayer-full-tabs.py` | Layout: Navigation \| Overview tabs, properties, right counters |
| `bayer_properties_panel.py` | Nested HM properties panel (worker + objprop widgets) |
| `default-hm-tree-tab-clone.json` | Reference from captured default HM |
| `smoke-test-minimal.json` | Phase 1 smoke test (proven data wiring) |

## Legacy / reference

| File | Notes |
|------|-------|
| `bayer-health-monitor-full.json` | Pre-capture speculative JSON — do not deploy |
| `smart-sentinel-ai-upsert-smoke-test.lua` | Early smoke-test upsert |
| `smart-sentinel-ai-upsert-verify.lua` | CustomPropertyValue path verification |

See [`docs/discovery/default-hm-compilation.json`](../docs/discovery/default-hm-compilation.json) for ground truth.
