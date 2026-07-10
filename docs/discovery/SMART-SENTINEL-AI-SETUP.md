# Smart Sentinel AI — your configuration (2026-07-10)

From screenshot `Smart Sentinel AI configuration.png`:

| Item | Value |
|------|-------|
| Object | **Smart Sentinel AI** (Type: **Folder**) |
| Path | `/System/Core/_Global Core Logic/Development/Smart Sentinel AI` |
| Script library | On the **folder itself** — Script Library `[1]` |
| Module name | `bayer.healthmonitor` |
| Entry function | `dashboard_compilation` (in folder's Lua script body) |

## Why `lib=bayer.healthmonitor` failed alone

The library lives on the **Smart Sentinel AI folder**, not in global `syslib.*` scope.

Web API / Webstudio must receive **`ctx`** = that folder path when resolving `lib`:

```
ctx=/System/Core/_Global Core Logic/Development/Smart Sentinel AI
lib=bayer.healthmonitor
func=dashboard_compilation
```

Without `ctx`, inmation returns **Library not found**.

With `ctx`, library resolves but Folder script library may hit internal error:

```json
{"msg":" @:986: attempt to index a boolean value (local 'execFuncLib')"}
```

**Workaround:** use **Custom Properties** on the same folder for dashboard entry (no `lib`/`func`/`ctx`).

## Launch URLs

### A — Script library + ctx (may fail on Folder type)

```
...&lib=bayer.healthmonitor&func=dashboard_compilation&ctx=%2FSystem%2FCore%2F_Global%20Core%20Logic%2FDevelopment%2FSmart%20Sentinel%20AI
```

### B — Custom Properties on Smart Sentinel AI folder (recommended)

1. Open folder **Smart Sentinel AI** in DataStudio
2. **Custom Options → Custom Properties**
3. Row 0: Name = `Bayer Health Monitor`, Value = paste `compilations/diagnostic-hello.json`
4. Save
5. Open:

```
https://byus00876m1.bayer.cnb:8002/apps/webstudio/?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&obj=%2FSystem%2FCore%2F_Global%20Core%20Logic%2FDevelopment%2FSmart%20Sentinel%20AI&name=Bayer%20Health%20Monitor
```

## Widget data sources (inside compilation JSON)

Still use default HM library for data functions:

```
lib: syslib.app-webstudio-healthmonitor
func: fetchNavigationTree | fetchNavigationTable | ...
```

No `ctx` needed on those when using system HM lib (same as default Health Monitor).
