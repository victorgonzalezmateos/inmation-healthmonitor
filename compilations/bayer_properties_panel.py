"""Object properties panel — nested compilation (worker + actions + objprops in one slot)."""
from __future__ import annotations

import copy
import json
from pathlib import Path

HM_LIB = "syslib.app-webstudio-healthmonitor"
WORKER_ID = "worker-property-panel"
PROPS_PANEL_ID = "bayer-props-panel"
TAB_PROPS_ID = "tab-object-props"
CLONE_PATH = Path(__file__).resolve().parent / "default-hm-tree-tab-clone.json"
CLONE_PROPS_BASE_Y = 24
LEFT_W = 28
# HM tab-tree uses 8 property lines (y=24..31). Double row height for readability.
ROW_Y_SCALE = 2
PROPS_LINE_COUNT = 8
PROPS_CONTENT_ROWS = PROPS_LINE_COUNT * ROW_Y_SCALE
HIDE_LAYOUT = {"x": 0, "y": 0, "w": 0, "h": 0, "static": True}
PANEL_BG = "#2d3748"
ICON_COL_W = 5
LABEL_COL_W = 5
VALUE_COL_X = ICON_COL_W + LABEL_COL_W
VALUE_COL_W = LEFT_W - VALUE_COL_X

_FLAT_TEXT = {
    "outline": "none",
    "boxShadow": "none",
    "margin": "0",
    "border": "none",
}

KEY_STYLE = {
    **_FLAT_TEXT,
    "fontSize": "12px",
    "lineHeight": "1.35",
    "textAlign": "left",
    "fontWeight": "600",
    "fontFamily": "Inter, 'Segoe UI', sans-serif",
    "color": "#cbd5e1",
    "backgroundColor": "transparent",
    "padding": "1px 4px",
}
VALUE_STYLE = {
    **_FLAT_TEXT,
    "color": "#ffffff",
    "fontSize": "12px",
    "lineHeight": "1.35",
    "textAlign": "left",
    "fontWeight": "500",
    "fontFamily": "Inter, 'Segoe UI', sans-serif",
    "backgroundColor": "transparent",
    "padding": "1px 4px",
}
STATE_VALUE_STYLE = {
    **VALUE_STYLE,
    "fontFamily": "Consolas, monospace",
    "fontSize": "11px",
}

ERROR_NOTIFY = {
    "type": "break",
    "action": [
        {
            "type": "notify",
            "title": "Error",
            "text": "See browser console for more details!",
            "duration": 12000,
            "transition": "slide",
            "styleByTheme": {
                "light": {"backgroundColor": "#f20d0d"},
                "dark": {"backgroundColor": "#cc0000"},
            },
        }
    ],
}


def worker_route() -> dict:
    """Route from root tree into nested properties compilation worker."""
    return {"route": [PROPS_PANEL_ID, TAB_PROPS_ID, WORKER_ID]}


def scale_layout_local(layout: dict, clone_cols: int = 24) -> dict:
    """Scale x for our column width; scale y/h to match HM row spacing."""
    scale = LEFT_W / clone_cols
    local_y = layout["y"] - CLONE_PROPS_BASE_Y
    x = max(0, round(layout["x"] * scale))
    w = max(1, round(layout["w"] * scale))
    if x + w > LEFT_W:
        w = LEFT_W - x
    return {
        "x": x,
        "y": max(0, local_y * ROW_Y_SCALE),
        "w": w,
        "h": max(1, layout["h"] * ROW_Y_SCALE),
        "static": True,
    }


def header_layouts() -> dict[str, dict]:
    """Icon + Name/Type header — matches default HM placement beside icon."""
    return {
        "objprop-image": {"x": 0, "y": 0, "w": ICON_COL_W, "h": 4},
        "objprop-name-key": {"x": ICON_COL_W, "y": 0, "w": LABEL_COL_W, "h": 2},
        "objprop-name-value": {"x": VALUE_COL_X, "y": 0, "w": VALUE_COL_W, "h": 2},
        "objprop-type-key": {"x": ICON_COL_W, "y": 2, "w": LABEL_COL_W, "h": 2},
        "objprop-type-value": {"x": VALUE_COL_X, "y": 2, "w": VALUE_COL_W, "h": 2},
    }


def apply_property_layout(widget: dict) -> None:
    header = header_layouts()
    wid = widget["id"]
    if wid in header:
        widget["layout"] = {**header[wid], "static": True}
    else:
        widget["layout"] = scale_layout_local(widget["layout"])


def style_property_widget(widget: dict) -> None:
    wid = widget["id"]
    opts = widget.setdefault("options", {})
    if wid.endswith("-key"):
        opts["style"] = dict(KEY_STYLE)
        opts.pop("styleByTheme", None)
    elif wid.endswith("-value") or wid.endswith("-value-user") or wid.endswith("-value-date"):
        style = dict(STATE_VALUE_STYLE if wid == "objprop-state-value" else VALUE_STYLE)
        opts["style"] = style
    elif wid == "objprop-image":
        opts["size"] = "32px 32px"
        opts["style"] = {**_FLAT_TEXT, "backgroundColor": "transparent"}
    opts.pop("styleByTheme", None)


def compilation_actions() -> dict:
    raw = json.loads(CLONE_PATH.read_text(encoding="utf-8"))["actions"]
    # Drop HM dynamic name width modify (35 cols) — overflows our 28-col panel.
    default = [
        step
        for step in raw["modifyPropertyPanelDefault"]
        if not (
            step.get("id") == "objprop-name-value"
            and step.get("set")
            and any(s.get("name") == "model.layout.w" for s in step["set"])
        )
    ]
    return {
        "modifyPropertyPanelDefault": default,
        "modifyPropertyPanelDetails": raw["modifyPropertyPanelDetails"],
    }


def worker_widget_local() -> dict:
    clone = json.loads(CLONE_PATH.read_text(encoding="utf-8"))
    for widget in clone["widgets"]:
        if widget["id"] == WORKER_ID:
            w = copy.deepcopy(widget)
            w["layout"] = dict(HIDE_LAYOUT)
            return w
    raise KeyError(f"{WORKER_ID} not found in {CLONE_PATH.name}")


def props_background_local(props_h: int) -> dict:
    return {
        "id": "bayer-props-background",
        "type": "text",
        "captionBar": False,
        "text": "",
        "layout": {"x": 0, "y": 0, "w": LEFT_W, "h": props_h, "static": True},
        "options": {
            "style": {
                "backgroundColor": PANEL_BG,
                "border": "none",
                "borderTop": "1px solid #1a202c",
                "borderRadius": "0 0 8px 8px",
            }
        },
    }


def inner_properties_compilation(props_h: int) -> dict:
    """Worker + objprop widgets + named actions — same scope as default HM tab-tree."""
    clone = json.loads(CLONE_PATH.read_text(encoding="utf-8"))
    widgets: list[dict] = [props_background_local(props_h), worker_widget_local()]

    for widget in clone["widgets"]:
        wid = widget["id"]
        if wid in ("tree-navigation", WORKER_ID):
            continue
        if not wid.startswith("objprop-"):
            continue
        w = copy.deepcopy(widget)
        apply_property_layout(w)
        style_property_widget(w)
        widgets.append(w)

    return {
        "version": "1",
        "options": {
            "stacking": "none",
            "numberOfColumns": LEFT_W,
            "numberOfRows": {"type": "count", "value": props_h},
            "padding": {"x": 0, "y": 0},
            "spacing": {"x": 0, "y": 0},
            "margin": {"x": 0, "y": 0},
            "background": {"style": {"backgroundColor": PANEL_BG}},
        },
        "actions": compilation_actions(),
        "widgets": widgets,
    }


def properties_panel_widget(props_y: int, props_h: int, visible: bool) -> dict:
    layout = (
        {"x": 0, "y": props_y, "w": LEFT_W, "h": props_h, "static": True}
        if visible
        else dict(HIDE_LAYOUT)
    )
    return {
        "id": PROPS_PANEL_ID,
        "type": "tabs",
        "name": "Object Properties",
        "captionBar": False,
        "tabs": [
            {
                "id": TAB_PROPS_ID,
                "name": "Object Properties",
                "indicator": {"title": ""},
                "compilation": inner_properties_compilation(props_h),
            }
        ],
        "options": {
            "tabAlignment": "top",
            "tabBar": {
                "style": {
                    "height": "0px",
                    "minHeight": "0px",
                    "padding": "0",
                    "margin": "0",
                    "border": "none",
                    "overflow": "hidden",
                }
            },
        },
        "layout": layout,
    }


def fetch_obj_props_modify() -> dict:
    return {
        "type": "delegate",
        "action": [
            {
                "type": "modify",
                "id": worker_route(),
                "set": [
                    {
                        "name": "model.dataSource",
                        "value": {
                            "type": "function",
                            "lib": HM_LIB,
                            "func": "fetchObjProps",
                            "farg": {
                                "ObjectName": "$payload.ObjectName",
                                "ObjectID": "$payload.ObjectID",
                                "Path": "$payload.Path",
                                "Image": "$payload.Image",
                            },
                            "catch": ERROR_NOTIFY,
                        },
                    }
                ],
            }
        ],
    }


def refresh_worker_action() -> dict:
    return {
        "type": "delegate",
        "action": [{"type": "refresh", "id": worker_route()}],
    }


def augment_tree_actions(widget: dict) -> dict:
    w = copy.deepcopy(widget)
    actions = w.setdefault("actions", {})
    for event in ("onClick",):
        if event not in actions:
            continue
        rebuilt: list = []
        for step in actions[event]:
            rebuilt.append(step)
            if step.get("type") == "transform":
                rebuilt.append(fetch_obj_props_modify())
        actions[event] = rebuilt
    did = actions.setdefault("didUpdate", [])
    if not any(
        s.get("type") == "delegate"
        and any(
            inner.get("type") == "refresh" and inner.get("id") == worker_route()
            for inner in s.get("action", [])
        )
        for s in did
    ):
        actions["didUpdate"] = did + [refresh_worker_action()]
    return w


def property_panel_build(
    props_y: int, props_h: int, visible: bool
) -> tuple[list[dict], list[str], dict[str, dict]]:
    show_layout = {"x": 0, "y": props_y, "w": LEFT_W, "h": props_h, "static": True}
    return [properties_panel_widget(props_y, props_h, visible)], [PROPS_PANEL_ID], {
        PROPS_PANEL_ID: show_layout
    }


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


def show_props_actions(show_layouts: dict[str, dict], toggle_ids: list[str]) -> list:
    return [layout_modify(wid, show_layouts[wid]) for wid in toggle_ids]


def hide_props_actions(toggle_ids: list[str]) -> list:
    return [layout_modify(wid, HIDE_LAYOUT) for wid in toggle_ids]
