# UP-01 — PMM Bayer Visual System

> **Status:** Frozen (2026-07-03)  
> **Task:** UP-01 on `Project.canvas`  
> **References:** PMMTool-GetScreen-response-2, PMMTool-CompilationModelEditor  
> **Applies to:** Webstudio compilation widgets ([AR-02](../architecture/AR-02-data-wiring-and-components.md))

Light-theme Bayer Health Monitor UI aligned with PMM corporate dashboards.

---

## 1. Design principles

| Principle | Specification |
|-----------|---------------|
| Theme | Light — white page background |
| Brand nav | Dark Bayer blue `#10384f` for header, tabs, primary buttons |
| Active accent | Bayer green `#89d329` for active tab indicator, focus rings, success accents |
| Data fidelity | State colors from [DC-02](../source-contracts/DC-02-source-state-display-policy.md) — exact source text |
| PMM validation | **All hex colors lowercase** in compilation JSON and Lua styles |
| Density | Compact sans-serif tables; efficient operator scanning |
| Surfaces | Rounded white panels, subtle shadows, 1px `#ededed` borders |

---

## 2. Color tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `bayer-nav` | `#10384f` | App header, tab bar background, primary buttons |
| `bayer-green` | `#89d329` | Active tab underline, selected nav indicator, success accent |
| `bayer-green-dark` | `#76ba24` | Hover on green accents |
| `bayer-blue` | `#00bcff` | Links, chart accent (secondary) |
| `surface-page` | `#ffffff` | Main content background |
| `surface-muted` | `#f8fafc` | Alternate row / sidebar tint |
| `surface-panel` | `#ffffff` | Card/panel fill |
| `border-default` | `#ededed` | Panel borders, table dividers |
| `text-primary` | `#10384f` | Headings, nav text on white |
| `text-on-nav` | `#ffffff` | Header title, tab labels on dark bar |
| `text-secondary` | `#64748b` | Metadata, timestamps |
| `state-good-bg` | `#d4f1d4` | DC-02 — `Good` row/cell background |
| `state-bad-bg` | `#f1d4d4` | DC-02 — `Bad` row/cell background |
| `state-empty-bg` | `#f0edf0` | DC-02 — `Empty` / neutral fill |
| `state-disabled-bg` | `#e2e8f0` | DC-02 — `Disabled` |

Machine-readable copy: [`design-tokens.json`](./design-tokens.json)

---

## 3. Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| App title | Inter, Segoe UI, sans-serif | 18px | 700 | `#ffffff` on nav |
| Section heading | Inter, sans-serif | 14px | 600 | `#10384f` |
| Table header | Inter, sans-serif | 12px | 600 | `#10384f` |
| Table body | Inter, sans-serif | 12px | 400 | `#10384f` |
| Property labels | Inter, sans-serif | 12px | 500 | `#64748b` |
| Property values | Inter, sans-serif | 12px | 400 | `#10384f` |
| Monospace state | Consolas, monospace | 11px | 400 | `#10384f` | compound `State` strings |

**Line height:** 1.4 tables, 1.5 property panel.

---

## 4. Spacing and shape

| Token | Value |
|-------|-------|
| `radius-sm` | 4px — buttons, inputs |
| `radius-md` | 8px — panels, cards |
| `radius-lg` | 12px — main content containers |
| `shadow-panel` | `0 1px 3px rgba(16, 56, 79, 0.08)` |
| `shadow-elevated` | `0 4px 12px rgba(16, 56, 79, 0.12)` |
| `padding-panel` | 16px |
| `padding-compact` | 8px |
| `grid-gap` | 8px |

---

## 5. Component styles (AR-02 widget IDs)

### 5.1 `hm-header` + `hm-process-state`

```
┌─────────────────────────────────────────────────────────────┐
│ [#10384f background, shadow-panel]                          │
│  Bayer Health Monitor          ProcessState: <raw value>    │
│  [white title 18px bold]       [white/gray 12px right]      │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Header `backgroundColor` | `#10384f` |
| Header height | 48–56px |
| Title color | `#ffffff` |
| Process state text | `#ffffff` or `#e2e8f0` — DC-02 accent only, text verbatim |

### 5.2 `hm-detail-tabs` (tab bar)

| State | Style |
|-------|-------|
| Tab bar background | `#10384f` |
| Inactive tab | `#ffffff` at 70% opacity |
| Active tab | `#ffffff` full + **3px bottom border `#89d329`** |
| Tab font | 13px, weight 600 |

References PMM tab surfaces from CompilationModelEditor.

### 5.3 `hm-nav-tree`

| Property | Value |
|----------|-------|
| Background | `#f8fafc` |
| Border right | `1px solid #ededed` |
| Node text | 12px `#10384f` |
| Selected node | `#89d329` left border 3px + `#ffffff` background |
| Icon size | 16px from source `Image` |

### 5.4 `hm-overview-table`

| Property | Value |
|----------|-------|
| Panel | White, `radius-md`, `shadow-panel`, border `#ededed` |
| Header row | `#f8fafc` background, 12px bold |
| Row height | Compact ~32px |
| Zebra | Optional `#ffffff` / `#fafafa` |
| State cells | DC-02 exact text + `state-*-bg` by value |
| Selected row | `outline: 2px solid #89d329` |

### 5.5 `hm-props-panel`

| Property | Value |
|----------|-------|
| Layout | Two-column label/value grid or key-value table |
| Panel | White rounded card, `padding-panel` |
| `State` field | Monospace, wrap allowed, full compound string |
| Label column width | ~35% |

### 5.6 `hm-counters-table`

Same table chrome as overview. Numeric `Value` right-aligned. `Unit` in `#64748b`.

**Submit to Chart button:**

| Property | Value |
|----------|-------|
| Background | `#10384f` |
| Text | `#ffffff`, 13px bold |
| Border radius | `4px` |
| Hover | `#0f2d3f` |

### 5.7 `hm-chart`

| Property | Value |
|----------|-------|
| Panel | White, `radius-md`, `shadow-panel` |
| Chart line primary | `#00bcff` |
| Grid lines | `#ededed` |
| Background | `#ffffff` |

---

## 6. Webstudio style JSON pattern

PMM compilations embed styles in widget `options.style`. Example for a primary button:

```json
{
  "options": {
    "style": {
      "backgroundColor": "#10384f",
      "color": "#ffffff",
      "fontSize": "13px",
      "fontWeight": "bold",
      "borderRadius": "4px",
      "border": "none"
    }
  }
}
```

Example state cell (applied per cell renderer, keyed by source value):

```json
{
  "Good": { "backgroundColor": "#d4f1d4", "color": "#10384f" },
  "Bad": { "backgroundColor": "#f1d4d4", "color": "#10384f" },
  "Empty": { "backgroundColor": "#f0edf0", "color": "#10384f" },
  "Disabled": { "backgroundColor": "#e2e8f0", "color": "#64748b" },
  "Neutral": { "backgroundColor": "#ffffff", "color": "#10384f" }
}
```

---

## 7. PMM conformance checklist

- [ ] All hex values lowercase (`#10384f` not `#10384F`)
- [ ] Nav/tab surfaces use `#10384f`
- [ ] Active indicator uses `#89d329`
- [ ] Page background white; panels white with subtle shadow
- [ ] Tables compact sans-serif 12px
- [ ] State colors match DC-02 token names exactly
- [ ] No uppercase hex in compilation or Lua style exports
- [ ] Style catalog validation passes (PMM CompilationModelEditor rules)

---

## 8. What UP-02+ implements

| Task | Uses UP-01 |
|------|------------|
| UP-02 Overview | `hm-overview-table`, `hm-nav-tree` styles + DC-02 collapse |
| UP-03 Properties | `hm-props-panel` grid |
| UP-04 Counters | `hm-counters-table` + submit button |
| UP-05 Chart | `hm-chart` panel |

UP-01 is **design tokens + component style spec** — compilation JSON implementation happens in UP-02 through UP-05.

---

## 9. References

- PMMTool-GetScreen-response-2 — screen layout reference
- PMMTool-CompilationModelEditor — style catalog and validation
- [DC-02 State display](../source-contracts/DC-02-source-state-display-policy.md)
- [AR-02 Widget IDs](../architecture/AR-02-data-wiring-and-components.md)
- inmation Vibe WebStudio PMM patterns (`#10384f`, `#d4f1d4`, `#f1d4d4`)
