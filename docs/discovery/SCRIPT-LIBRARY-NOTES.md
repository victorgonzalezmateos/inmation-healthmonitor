# Script library vs Custom Properties (2026-07-10)

## What failed

`lib=bayer.healthmonitor&func=dashboard_compilation` returns:

```json
{"error":[{"msg":"Library 'bayer.healthmonitor' not found."}]}
```

## Why

Default HM uses a **system** library: `syslib.app-webstudio-healthmonitor`.

Custom Lua libraries used by PMM/vibe are **not** registered by creating a Script Library object alone. They are stored as **tables on a host object**:

| Property | Path suffix |
|----------|-------------|
| `ScriptLibrary.LuaModuleName` | array of module names |
| `ScriptLibrary.AdvancedLuaScript` | array of Lua sources (same index) |

Webstudio must also receive **`ctx`** = path to that host object when calling `lib`/`func`.

The vibe Line Dashboard publishes to **Auto Dashboard** and opens via **`obj` + `name`** (Custom Properties), not `lib` + `func`.

## Recommended path for Bayer HM

**Custom Properties** on a host object (Auto Dashboard or sibling object under Smart Sentinel AI).

Launch URL pattern:

```
/apps/webstudio?...&obj=<host-path>&name=Bayer%20Health%20Monitor
```

No custom `lib` needed for the compilation entry.

Widget `dataSource` inside the JSON still calls `syslib.app-webstudio-healthmonitor` for `fetchNavigationTree`, etc.
