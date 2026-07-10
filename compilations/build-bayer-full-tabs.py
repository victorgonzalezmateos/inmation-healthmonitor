#!/usr/bin/env python3
"""Build Smart Sentinel HM layout: nav toggle, properties, right counters.

Usage:
  python build-bayer-full-tabs.py
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path

from bayer_properties_panel import (
    LEFT_W as PROPS_LEFT_W,
    PROPS_CONTENT_ROWS,
    augment_tree_actions,
    hide_props_actions,
    property_panel_build,
    show_props_actions,
)

ROOT = Path(__file__).resolve().parent
SKINNED = ROOT / "bayer-skinned-smoke.json"
OUT = ROOT / "bayer-skinned-full.json"
NAV_BTN = "bayer-btn-navigation"
OVERVIEW_BTN = "bayer-btn-overview"
TREE_ID = "bayer-tree"
OVERVIEW_ID = "bayer-overview-table"
COUNTERS_ID = "bayer-counters-table"
APP_TITLE = "Smart Sentinel"

LEFT_W = 28
RIGHT_X = 30
PANEL_H = 54
TAB_BTN_H = 4
PROPS_H = PROPS_CONTENT_ROWS
NAV_H = PANEL_H - TAB_BTN_H - PROPS_H
CONTENT_Y = TAB_BTN_H
PROPS_Y = CONTENT_Y + NAV_H
BTN_W = LEFT_W // 2

TREE_SHOW = {"x": 0, "y": CONTENT_Y, "w": LEFT_W, "h": NAV_H, "static": True}
OVERVIEW_SHOW = {"x": 0, "y": CONTENT_Y, "w": LEFT_W, "h": NAV_H + PROPS_H, "static": True}
HIDE_LAYOUT = {"x": 0, "y": 0, "w": 0, "h": 0, "static": True}

BTN_ACTIVE = {
    "backgroundColor": "#10384f",
    "color": "#ffffff",
    "fontSize": "12px",
    "fontWeight": "600",
    "border": "1px solid #10384f",
    "borderRadius": "8px 0 0 0",
    "height": "100%",
}
BTN_ACTIVE_RIGHT = {**BTN_ACTIVE, "borderRadius": "0 8px 0 0"}
BTN_INACTIVE = {
    "backgroundColor": "#f1f5f9",
    "color": "#64748b",
    "fontSize": "12px",
    "fontWeight": "600",
    "border": "1px solid #ededed",
    "borderRadius": "8px 0 0 0",
    "height": "100%",
}
BTN_INACTIVE_RIGHT = {**BTN_INACTIVE, "borderRadius": "0 8px 0 0"}

# Built at module load for tab button onClick actions.
_PROPS_WIDGETS, PROPS_TOGGLE_IDS, PROPS_SHOW_LAYOUTS = property_panel_build(
    PROPS_Y, PROPS_H, visible=True
)


def layout_modify(panel_id: str, layout: dict) -> dict:
    return {
        "type": "modify",
        "id": panel_id,
        "set": [
            {"name": "model.layout.x", "value": layout["x"]},
            {"name": "model.layout.y", "value": layout["y"]},
            {"name": "model.layout.w", "value": layout["w"]},
            {"name": "model.layout.h", "value": layout["h"]},
        ],
    }


def activate_navigation() -> list:
    return [
        layout_modify(OVERVIEW_ID, HIDE_LAYOUT),
        layout_modify(TREE_ID, TREE_SHOW),
        *show_props_actions(PROPS_SHOW_LAYOUTS, PROPS_TOGGLE_IDS),
        {"type": "modify", "id": NAV_BTN, "set": [{"name": "model.options.style", "value": BTN_ACTIVE}]},
        {"type": "modify", "id": OVERVIEW_BTN, "set": [{"name": "model.options.style", "value": BTN_INACTIVE_RIGHT}]},
    ]


def activate_overview() -> list:
    return [
        layout_modify(TREE_ID, HIDE_LAYOUT),
        layout_modify(OVERVIEW_ID, OVERVIEW_SHOW),
        *hide_props_actions(PROPS_TOGGLE_IDS),
        {"type": "modify", "id": NAV_BTN, "set": [{"name": "model.options.style", "value": BTN_INACTIVE}]},
        {"type": "modify", "id": OVERVIEW_BTN, "set": [{"name": "model.options.style", "value": BTN_ACTIVE_RIGHT}]},
    ]


def nav_button(btn_id: str, label: str, x: int, active: bool, activate_actions: list) -> dict:
    style = (BTN_ACTIVE if x == 0 else BTN_ACTIVE_RIGHT) if active else (BTN_INACTIVE if x == 0 else BTN_INACTIVE_RIGHT)
    return {
        "id": btn_id,
        "type": "button",
        "captionBar": False,
        "label": label,
        "layout": {"x": x, "y": 0, "w": BTN_W, "h": TAB_BTN_H, "static": True},
        "options": {"style": style},
        "actions": {"onClick": activate_actions},
    }


def panel_options(src: dict) -> dict:
    opts = copy.deepcopy(src.get("options", {}))
    style = dict(opts.get("style", {}))
    style["borderRadius"] = "0"
    style["borderTop"] = "none"
    style["borderBottom"] = "1px solid #ededed"
    opts["style"] = style
    return opts


def overview_widget(src: dict, visible: bool) -> dict:
    """Overview loads counters only — no properties panel (default HM behaviour)."""
    w = copy.deepcopy(src)
    w["name"] = "Overview"
    w["captionBar"] = False
    w["layout"] = dict(OVERVIEW_SHOW if visible else HIDE_LAYOUT)
    w["options"] = panel_options(w)
    return w


def tree_widget(src: dict, visible: bool) -> dict:
    w = augment_tree_actions(copy.deepcopy(src))
    w["captionBar"] = False
    w["layout"] = dict(TREE_SHOW if visible else HIDE_LAYOUT)
    w["options"] = panel_options(w)
    return w


def counters_widget(src: dict) -> dict:
    w = copy.deepcopy(src)
    w["name"] = "Performance Counters"
    w["label"] = "Performance Counters"
    w["layout"] = {"x": RIGHT_X, "y": 0, "w": 96 - RIGHT_X, "h": PANEL_H, "static": True}
    w.setdefault("options", {})["emptyMessage"] = "Select an object in Navigation or Overview."
    return w


def apply_app_title(compilation: dict) -> None:
    compilation["name"] = APP_TITLE
    compilation.setdefault("info", {})["title"] = APP_TITLE
    page_name = compilation.get("rootOnly", {}).get("appBar", {}).get("tools", {}).get("pageName")
    if isinstance(page_name, dict):
        page_name["title"] = APP_TITLE


def build() -> dict:
    assert LEFT_W == PROPS_LEFT_W
    base = json.loads(SKINNED.read_text(encoding="utf-8"))
    by_id = {w["id"]: w for w in base["widgets"]}

    for required in (TREE_ID, OVERVIEW_ID, COUNTERS_ID):
        if required not in by_id:
            raise KeyError(f"Missing widget {required} in {SKINNED.name}")

    widgets = [
        nav_button(NAV_BTN, "Navigation", 0, True, activate_navigation()),
        nav_button(OVERVIEW_BTN, "Overview", BTN_W, False, activate_overview()),
        counters_widget(by_id[COUNTERS_ID]),
        *_PROPS_WIDGETS,
        overview_widget(by_id[OVERVIEW_ID], visible=False),
        tree_widget(by_id[TREE_ID], visible=True),
    ]

    out = copy.deepcopy(base)
    apply_app_title(out)
    out["description"] = "Smart Sentinel HM: nav + HM properties + right counters"
    out["options"]["numberOfRows"] = {"type": "count", "value": PANEL_H + 2}
    out["options"]["padding"] = {"x": 0, "y": 0}
    out["options"]["margin"] = {"x": 0, "y": 0}
    out["options"]["spacing"] = {"x": 0, "y": 0}
    out["widgets"] = widgets
    return out


def main() -> None:
    if not SKINNED.is_file():
        print(f"Missing {SKINNED}", file=sys.stderr)
        sys.exit(1)
    OUT.write_text(json.dumps(build(), indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "build-smart-sentinel-upsert.py"),
            "bayer-skinned-full.json",
            "smart-sentinel-ai-upsert-full.lua",
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
