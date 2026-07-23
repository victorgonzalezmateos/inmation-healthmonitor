# Smart Sentinel — HTML Designer draft

Static Overview UI matching `Downloads/Designer.png`. **No live inmation data yet.**

## Run locally

```powershell
cd web
npm install
npm run dev
```

Or from repo root:

```powershell
npm run web:install
npm run web
```

Opens http://localhost:5173

## Layout

- Left menu (Dashboard, Health Monitor, Health Overview, Trends, Diagnostics, …)
- Overview: KPI row, donuts, tables, charts (mock data in `src/mock-data.js`)

## Next

1. You review the look vs Designer.png  
2. Guided IWA spike against `:8002`  
3. Wire real Health Monitor APIs  

See `docs/architecture/AR-03-html-webapi-plan.md`.
