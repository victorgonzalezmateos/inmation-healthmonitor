#!/usr/bin/env python3
"""Merge PMM appBar into Bayer-skinned compilation and generate upsert.

Usage:
  python build-bayer-skinned-compilation.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DISCOVERY = ROOT.parent / "docs" / "discovery"
SKINNED = ROOT / "bayer-skinned-smoke.json"
APPBAR = DISCOVERY / "bayer-hm-appbar.json"


def load_widgets_template() -> dict:
    """Base compilation body (widgets + options) without duplicate header widgets."""
    data = json.loads(SKINNED.read_text(encoding="utf-8")) if SKINNED.is_file() else {}
    widgets = [w for w in data.get("widgets", []) if w.get("id") != "bayer-header"]

    for w in widgets:
        if w.get("id") == "bayer-process-state":
            w["layout"] = {"x": 0, "y": 0, "w": 96, "h": 2, "static": True}
            w["options"]["style"] = {
                "backgroundColor": "transparent",
                "color": "#64748b",
                "fontSize": "11px",
                "fontFamily": "Inter, 'Segoe UI', sans-serif",
                "textAlign": "right",
                "padding": "2px 16px 4px",
            }
        elif w.get("id") == "bayer-tree":
            w["layout"]["y"] = 2
            w["layout"]["h"] = 54
        elif w.get("id") == "bayer-overview-table":
            w["layout"]["y"] = 2
            w["layout"]["h"] = 54
        elif w.get("id") == "bayer-counters-table":
            w["layout"]["y"] = 58
            w["layout"]["h"] = 44

    return {
        "version": "1",
        "name": "Bayer Health Monitor",
        "description": "Phase 2 — Bayer PMM skin (appBar from PMM GetScreen capture)",
        "options": data.get(
            "options",
            {
                "background": {"style": {"backgroundColor": "#ffffff"}},
                "margin": {"x": 0, "y": 0},
                "numberOfColumns": 96,
                "numberOfRows": {"type": "count", "value": 102},
                "padding": {"x": 8, "y": 8},
                "spacing": {"x": 8, "y": 8},
                "stacking": "none",
                "theme": "light",
            },
        ),
        "rootOnly": {"appBar": json.loads(APPBAR.read_text(encoding="utf-8"))},
        "info": {"title": "Bayer Health Monitor"},
        "widgets": widgets,
    }


def main() -> None:
    if not APPBAR.is_file():
        print("Run extract-pmm-appbar.py first", file=sys.stderr)
        sys.exit(1)

    compilation = load_widgets_template()
    compilation["options"]["numberOfRows"] = {"type": "count", "value": 102}

    SKINNED.write_text(json.dumps(compilation, indent=2), encoding="utf-8")
    print(f"Wrote {SKINNED}")

    subprocess.run(
        [
            sys.executable,
            str(ROOT / "build-smart-sentinel-upsert.py"),
            "bayer-skinned-smoke.json",
            "smart-sentinel-ai-upsert-skinned.lua",
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
