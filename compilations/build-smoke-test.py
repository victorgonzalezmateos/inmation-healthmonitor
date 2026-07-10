#!/usr/bin/env python3
"""Build smoke-test compilation + Lua from captured default HM."""

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DISCOVERY = ROOT / "docs" / "discovery" / "default-hm-compilation.json"
OUT_JSON = ROOT / "compilations" / "smoke-test-minimal.json"
OUT_LUA = ROOT / "compilations" / "smoke-test-dashboard_compilation.lua"
HM_LIB = "syslib.app-webstudio-healthmonitor"


def find_widget(node: object, widget_id: str) -> dict | None:
    if isinstance(node, dict):
        if node.get("id") == widget_id:
            return node
        for value in node.values():
            found = find_widget(value, widget_id)
            if found is not None:
                return found
    elif isinstance(node, list):
        for item in node:
            found = find_widget(item, widget_id)
            if found is not None:
                return found
    return None


def build_compilation(default: dict) -> dict:
    tree = deepcopy(find_widget(default, "tree-navigation"))
    table = deepcopy(find_widget(default, "table-navigation"))
    if tree is None or table is None:
        raise SystemExit("Could not extract tree-navigation or table-navigation from default HM")

    tree["id"] = "bayer-tree"
    tree["name"] = "Navigation Tree"
    tree["layout"] = {"x": 0, "y": 8, "w": 30, "h": 52, "static": True}
    tree["options"] = {
        "showToolbar": False,
        "showRefreshButton": True,
        "style": {
            "backgroundColor": "#f8fafc",
            "border": "1px solid #ededed",
            "borderRadius": "8px",
            "fontSize": "12px",
            "color": "#10384f",
        },
    }
    # Drop default expanded node ids (host-specific)
    tree.pop("state", None)
    # Simplify click: load performance counters for selected node
    tree["actions"]["onClick"] = [
        {
            "type": "transform",
            "aggregateOne": [
                {
                    "$project": {
                        "ObjectName": "$n",
                        "ObjectID": "$i",
                        "Path": "$path",
                        "Image": "$image",
                    }
                }
            ],
        },
        {
            "type": "modify",
            "id": "bayer-counters-table",
            "set": [
                {
                    "name": "model.dataSource",
                    "value": {
                        "type": "function",
                        "lib": HM_LIB,
                        "func": "fetchPerformanceCountersTable",
                        "farg": {"ObjectID": "$payload.ObjectID"},
                        "catch": {
                            "type": "break",
                            "action": [
                                {
                                    "type": "notify",
                                    "title": "Error",
                                    "text": "Could not load performance counters for selected object.",
                                    "duration": 8000,
                                }
                            ],
                        },
                    },
                }
            ],
        },
    ]
    tree["actions"]["didUpdate"] = [
        {"type": "refresh", "id": "bayer-counters-table"}
    ]

    table["id"] = "bayer-overview-table"
    table["name"] = "Overview Table"
    table["layout"] = {"x": 32, "y": 8, "w": 64, "h": 52, "static": True}
    table["options"]["style"] = {
        "fontSize": "12px",
        "backgroundColor": "#ffffff",
        "border": "1px solid #ededed",
        "borderRadius": "8px",
    }
    table["actions"] = {}

    counters = {
        "id": "bayer-counters-table",
        "type": "table",
        "name": "Performance Counters",
        "captionBar": True,
        "label": "Performance Counters (select a tree node)",
        "layout": {"x": 0, "y": 62, "w": 96, "h": 40, "static": True},
        "schema": [
            {"name": "ObjectName", "title": "Name"},
            {"name": "type", "title": "Type"},
            {"name": "Value", "title": "Value"},
            {"name": "Unit", "title": "Unit"},
            {"name": "penName", "title": "penName"},
            {"name": "path", "title": "path"},
        ],
        "options": {
            "pagination": True,
            "pageSize": 50,
            "showHoverHighLight": True,
            "alternateRowColoring": True,
            "style": {
                "fontSize": "12px",
                "backgroundColor": "#ffffff",
                "border": "1px solid #ededed",
                "borderRadius": "8px",
            },
        },
    }

    header = {
        "id": "bayer-header",
        "type": "text",
        "captionBar": False,
        "text": "Bayer Health Monitor — Smoke Test",
        "layout": {"x": 0, "y": 0, "w": 96, "h": 6, "static": True},
        "options": {
            "style": {
                "backgroundColor": "#10384f",
                "color": "#ffffff",
                "fontSize": "18px",
                "fontWeight": "bold",
                "textAlign": "left",
                "padding": "12px 16px",
                "borderRadius": "8px 8px 0 0",
            }
        },
    }

    process_state = {
        "id": "bayer-process-state",
        "type": "text",
        "captionBar": False,
        "text": "",
        "layout": {"x": 0, "y": 6, "w": 96, "h": 2, "static": True},
        "dataSource": {
            "type": "subscribe",
            "path": "/System/Core/_Global Core Logic/System Monitoring/Health Monitor.HMDiagnostics.ProcessState",
        },
        "options": {
            "style": {
                "backgroundColor": "#10384f",
                "color": "#e2e8f0",
                "fontSize": "12px",
                "textAlign": "right",
                "padding": "4px 16px 8px",
            }
        },
    }

    return {
        "version": "1",
        "name": "Bayer Health Monitor Smoke Test",
        "description": "Phase 1 smoke test — tree + overview table + counters on click (from captured default HM)",
        "options": {
            "background": {"style": {"backgroundColor": "#ffffff"}},
            "margin": {"x": 0, "y": 0},
            "numberOfColumns": 96,
            "numberOfRows": {"type": "count", "value": 104},
            "padding": {"x": 8, "y": 8},
            "spacing": {"x": 8, "y": 8},
            "stacking": "none",
            "theme": "light",
        },
        "widgets": [header, process_state, tree, table, counters],
    }


def write_lua(compilation: dict, lua_path: Path) -> None:
    json_text = json.dumps(compilation, ensure_ascii=False, indent=2)
    open_delim = "[=["
    close_delim = "]=]"
    for level in range(1, 8):
        candidate_open = "[" + "=" * level + "["
        candidate_close = "]" + "=" * level + "]"
        if candidate_open not in json_text and candidate_close not in json_text:
            open_delim = candidate_open
            close_delim = candidate_close
            break

    lua = f"""-- Bayer Health Monitor - Phase 1 smoke test
-- Paste into Script Library:
--   /System/Core/_Global Core Logic/Development/Smart Sentinel AI/Bayer Health Monitor
--
-- Launch:
--   https://byus00876m1.bayer.cnb:8002/apps/webstudio/?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&lib=Bayer%20Health%20Monitor&func=dashboard_compilation

local json = require("cjson")

local COMPILATION_JSON = {open_delim}
{json_text}
{close_delim}

function dashboard_compilation(arg, req, hlp)
  return json.decode(COMPILATION_JSON)
end
"""
    lua_path.write_text(lua, encoding="utf-8")


def main() -> None:
    default = json.loads(DISCOVERY.read_text(encoding="utf-8"))
    compilation = build_compilation(default)
    OUT_JSON.write_text(json.dumps(compilation, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_lua(compilation, OUT_LUA)
    print(f"Wrote {OUT_JSON}")
    print(f"Wrote {OUT_LUA}")


if __name__ == "__main__":
    main()
