# Architecture

| Document | Task | Status |
|----------|------|--------|
| [AR-01-webstudio-runtime-architecture.md](./AR-01-webstudio-runtime-architecture.md) | AR-01 Design Webstudio app runtime architecture | Frozen 2026-07-03 |

## Runtime at a glance

- **Delivery:** inmation Webstudio (`/apps/webstudio`, `secp=iwa`, `ssl=true`)
- **Data:** Existing Health Monitor Lua functions (no reimplementation)
- **UI:** New Bayer compilation + PMM styles (UP-01+)
- **Identifiers:** `ctx` / `lib` / `func` finalized in WR-01
