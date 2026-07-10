#!/usr/bin/env python3
"""Extract PMM appBar styles from GetScreen response for Bayer HM reuse.

Usage:
  python extract-pmm-appbar.py [path-to-PMMTool-GetScreen-response-2.txt]

Default input: ../docs/discovery/PMMTool-GetScreen-response-2.txt
              or ~/Downloads/PMMTool-GetScreen-response-2.txt

Outputs:
  docs/discovery/pmm-appbar-reference.json  — full appBar block from PMM
  docs/discovery/pmm-style-tokens.json      — colors, gradient, typography summary
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DISCOVERY = ROOT / "docs" / "discovery"


def find_input(path_arg: str | None) -> Path:
    if path_arg:
        p = Path(path_arg)
        if p.is_file():
            return p
        raise FileNotFoundError(p)
    candidates = [
        DISCOVERY / "PMMTool-GetScreen-response-2.txt",
        Path.home() / "Downloads" / "PMMTool-GetScreen-response-2.txt",
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError(
        "PMM GetScreen file not found. Copy PMMTool-GetScreen-response-2.txt to docs/discovery/"
    )


def extract_tokens(app_bar: dict) -> dict:
    style = app_bar.get("style", {})
    tools = app_bar.get("tools", {})
    page = tools.get("pageName", {})
    user_guide = tools.get("userGuide", {})
    ug_style = user_guide.get("icon", {}).get("style", {}) if user_guide else {}

    gradient = style.get("background", "")
    colors = set(re.findall(r"#[0-9a-fA-F]{3,8}", gradient))
    if page.get("style", {}).get("color"):
        colors.add(page["style"]["color"])
    for key in ("logoBayer", "restricted", "envName"):
        c = tools.get(key, {}).get("style", {}).get("color")
        if c and c.startswith("#"):
            colors.add(c)

    return {
        "source": "PMMTool-GetScreen-response-2",
        "appBarHeight": style.get("height", "48px"),
        "gradient": gradient,
        "gradientColors": sorted(colors, key=str.lower),
        "border": style.get("border"),
        "pageTitle": {
            "color": page.get("style", {}).get("color", "#16364e"),
            "fontSize": page.get("style", {}).get("fontSize", "16px"),
            "fontWeight": page.get("style", {}).get("fontWeight", "bold"),
        },
        "userGuideButton": {
            "background": ug_style.get("background", "#76ba24"),
            "borderRadius": ug_style.get("borderRadius", "8.5px"),
            "width": ug_style.get("width", "140px"),
            "height": ug_style.get("height", "30px"),
        },
        "navTreeToolbar": "#10384f",
        "tabBar": "#51596d",
        "bayerBrand": {
            "nav": "#10384f",
            "green": "#89d329",
            "greenDark": "#76ba24",
            "titleOnWhite": "#16364e",
        },
    }


def customize_for_health_monitor(app_bar: dict) -> dict:
    """Clone PMM appBar and retitle for Bayer Health Monitor."""
    bar = json.loads(json.dumps(app_bar))
    tools = bar.setdefault("tools", {})
    if "pageName" in tools:
        tools["pageName"]["title"] = "Bayer Health Monitor"
    # Health Monitor: no PMM user guide or Dev env label
    bar.setdefault("left", {})["toolsOrder"] = [
        "logoBayer",
        "pageName",
        "spacer",
    ]
    bar.setdefault("right", {})["toolsOrder"] = ["restricted", "spacer"]
    for key in ("userGuide", "envName"):
        tools.pop(key, None)
    return bar


def main() -> None:
    src = find_input(sys.argv[1] if len(sys.argv) > 1 else None)
    data = json.loads(src.read_text(encoding="utf-8"))
    app_bar = data.get("rootOnly", {}).get("appBar")
    if not app_bar:
        print("No rootOnly.appBar in file", file=sys.stderr)
        sys.exit(1)

    DISCOVERY.mkdir(parents=True, exist_ok=True)
    (DISCOVERY / "pmm-appbar-reference.json").write_text(
        json.dumps(app_bar, indent=2), encoding="utf-8"
    )
    tokens = extract_tokens(app_bar)
    (DISCOVERY / "pmm-style-tokens.json").write_text(
        json.dumps(tokens, indent=2), encoding="utf-8"
    )

    customized = customize_for_health_monitor(app_bar)
    (DISCOVERY / "bayer-hm-appbar.json").write_text(
        json.dumps(customized, indent=2), encoding="utf-8"
    )

    print(f"Extracted from: {src}")
    print(f"Wrote: {DISCOVERY / 'pmm-appbar-reference.json'}")
    print(f"Wrote: {DISCOVERY / 'pmm-style-tokens.json'}")
    print(f"Wrote: {DISCOVERY / 'bayer-hm-appbar.json'}")
    print(f"Gradient: {tokens['gradient']}")


if __name__ == "__main__":
    main()
