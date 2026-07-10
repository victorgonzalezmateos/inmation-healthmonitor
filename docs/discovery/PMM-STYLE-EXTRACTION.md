# PMM style extraction

How to pull header and color tokens from the live **Process Metrics Mirror** dashboard.

## Source file

Capture from PMM Webstudio DevTools (same method as default HM):

- Save response as `PMMTool-GetScreen-response-2.txt`
- Place in `docs/discovery/` (or keep in Downloads — script checks both)

## Extract appBar + tokens

```powershell
python compilations/extract-pmm-appbar.py
```

**Outputs:**

| File | Contents |
|------|----------|
| `docs/discovery/pmm-appbar-reference.json` | Raw PMM `rootOnly.appBar` |
| `docs/discovery/bayer-hm-appbar.json` | Customized for Bayer Health Monitor |
| `docs/discovery/pmm-style-tokens.json` | Gradient, colors, typography summary |

## Key finding — PMM header is not a text widget

PMM uses Webstudio **`rootOnly.appBar`**:

```json
"rootOnly": {
  "appBar": {
    "style": {
      "background": "-webkit-linear-gradient(-18deg, #FFFFFF 50%, #7C84C2 50%, #34B4E4 83%, #60C5EB 100%)",
      "height": "48px"
    },
    "left": { "toolsOrder": ["logoBayer", "pageName", "spacer"] },
    "tools": { "logoBayer": { ... }, "pageName": { "title": "..." } }
  }
}
```

A flat `#10384f` text widget cannot reproduce the diagonal white-to-blue gradient or Bayer logo row.

## Rebuild skinned compilation + upsert

```powershell
python compilations/build-bayer-skinned-compilation.py
```

Then run `compilations/smart-sentinel-ai-upsert-skinned.lua` in the inmation console.

## PMM tokens used

| Token | Value | Usage |
|-------|-------|-------|
| App bar gradient | `-webkit-linear-gradient(-18deg, #FFFFFF 50%, #7C84C2 50%, #34B4E4 83%, #60C5EB 100%)` | Header bar |
| Title on white | `#16364e` | Page name next to logo |
| Nav / tree toolbar | `#10384f` | Side panel toolbars |
| Bayer green | `#89d329` / `#76ba24` | Selection, buttons |
| Tab bar | `#51596d` | PMM inner tabs (for Option B) |
