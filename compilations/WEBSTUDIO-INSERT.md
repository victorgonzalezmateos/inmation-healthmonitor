# How to Insert into Webstudio for Testing

## File to use

**[`bayer-health-monitor-full.json`](./bayer-health-monitor-full.json)** — complete merged dashboard (Overview + Properties + Counters + Chart).

Dashboard name for Custom Properties: **`Bayer Health Monitor`**

---

## Option A — Custom Properties (recommended)

1. Open inmation and navigate to the host object, e.g.  
   `/System/Core/_Global Core Logic/Development/Auto Dashboard`
2. Open **Custom Options → Custom Properties**
3. In **CustomPropertyName** table: add or find `Bayer Health Monitor`
4. In **CustomPropertyValue** at the **same index**: paste the **entire** contents of `bayer-health-monitor-full.json` (one JSON string)
5. Save the object
6. Open Webstudio with the **name** URL:

```
https://{host}:{port}/apps/webstudio?hostname={host}&port={port}&secp=iwa&ssl=true&obj={encoded-host-path}&name=Bayer%20Health%20Monitor
```

Example host object path (URL-encoded):

```
obj=%2FSystem%2FCore%2F_Global%20Core%20Logic%2FDevelopment%2FAuto%20Dashboard
```

---

## Option B — ctx / lib / func URL

If your site uses direct function launch (and `BayerHealthMonitorMain` entry exists):

```
https://{host}:{port}/apps/webstudio?hostname={host}&port={port}&secp=iwa&ssl=true&ctx=bayerhm&lib=HealthMonitor&func=BayerHealthMonitorMain
```

> **Note:** Option B requires the Lua entry `BayerHealthMonitorMain` to load this compilation. Option A only needs the JSON in Custom Properties.

---

## Before testing — checklist

| Requirement | Status |
|-------------|--------|
| `HealthMonitor` Lua library exists on host | Required — provides `fetchNavigationTable`, etc. |
| Logged in via IWA (domain Windows) | Required |
| `ctx=bayerhm` registered if using Option B | May need inmation config |
| Compilation JSON uses lowercase hex | Yes — PMM validation |

---

## If widgets show empty or errors

1. **Wrong lib name** — confirm default Health Monitor library name on your host (may not be `HealthMonitor`)
2. **Wrong ctx** — try default HM `ctx` from existing Health Monitor URL
3. **Schema mismatch** — Webstudio version may expect slightly different widget JSON; compare with a working PMM compilation from your host
4. **Function names** — `fetchNavigationTree`, `fetchObjProps`, etc. must match your HM Lua API exactly

Copy the `lib`, `ctx`, and `func` from your **working default Health Monitor URL** into the JSON `dataSource` blocks if needed.

---

## Quick copy path (local)

```
C:\Users\GOAKJ\Documents\Cursor Project\inmation-healthmonitor\compilations\bayer-health-monitor-full.json
```

GitHub (after push):

https://github.com/victorgonzalezmateos/inmation-healthmonitor/blob/master/compilations/bayer-health-monitor-full.json
