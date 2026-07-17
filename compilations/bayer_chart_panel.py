"""Right-panel views: Performance Counters | Chart (HM-style icons)."""
from __future__ import annotations

import copy

CHART_ID = "bayer-chart"
COUNTERS_ID = "bayer-counters-table"
SELECTED_ID = "bayer-selected-table"
HIDE_LAYOUT = {"x": 0, "y": 0, "w": 0, "h": 0, "static": True}

# Defaults; build-bayer-full-tabs overrides via set_right_slot() for app menu offset.
RIGHT_X = 30
PANEL_H = 54
RIGHT_W = 96 - RIGHT_X
SHOW_LAYOUT = {"x": RIGHT_X, "y": 0, "w": RIGHT_W, "h": PANEL_H, "static": True}


def set_right_slot(x: int, w: int, h: int) -> None:
    """Shift counters/chart slot when a persistent left menu is present."""
    global RIGHT_X, RIGHT_W, PANEL_H, SHOW_LAYOUT
    RIGHT_X = x
    RIGHT_W = w
    PANEL_H = h
    SHOW_LAYOUT = {"x": RIGHT_X, "y": 0, "w": RIGHT_W, "h": PANEL_H, "static": True}

# Same SVG icons as default Health Monitor tab indicators.
ICON_COUNTERS = {
    "light": {
        "base64": (
            "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNTEyIDI1NmMwIDE0MS40LTExNC42IDI1Ni0yNTYgMjU2UzAgMzk3LjQgMCAyNTZTMTE0LjYgMCAyNTYgMFM1MTIgMTE0LjYgNTEyIDI1NnpNMjg4IDk2YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNMjU2IDQxNmMzNS4zIDAgNjQtMjguNyA2NC02NGMwLTE3LjQtNi45LTMzLjEtMTguMS00NC42TDM2NiAxNjEuN2M1LjMtMTIuMS0uMi0yNi4zLTEyLjMtMzEuNnMtMjYuMyAuMi0zMS42IDEyLjNMMjU3LjkgMjg4Yy0uNiAwLTEuMyAwLTEuOSAwYy0zNS4zIDAtNjQgMjguNy02NCA2NHMyOC43IDY0IDY0IDY0ek0xNzYgMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNOTYgMjg4YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJ6bTM1Mi0zMmMwLTE3LjctMTQuMy0zMi0zMi0zMnMtMzIgMTQuMy0zMiAzMnMxNC4zIDMyIDMyIDMyczMyLTE0LjMgMzItMzJ6Ii8+PC9zdmc+"
        ),
        "mimeType": "image/svg+xml",
    },
    "dark": {
        "base64": (
            "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNTEyIDI1NmMwIDE0MS40LTExNC42IDI1Ni0yNTYgMjU2UzAgMzk3LjQgMCAyNTZTMTE0LjYgMCAyNTYgMFM1MTIgMTE0LjYgNTEyIDI1NnpNMjg4IDk2YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNMjU2IDQxNmMzNS4zIDAgNjQtMjguNyA2NC02NGMwLTE3LjQtNi45LTMzLjEtMTguMS00NC42TDM2NiAxNjEuN2M1LjMtMTIuMS0uMi0yNi4zLTEyLjMtMzEuNnMtMjYuMyAuMi0zMS42IDEyLjNMMjU3LjkgMjg4Yy0uNiAwLTEuMyAwLTEuOSAwYy0zNS4zIDAtNjQgMjguNy02NCA2NHMyOC43IDY0IDY0IDY0ek0xNzYgMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNOTYgMjg4YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJ6bTM1Mi0zMmMwLTE3LjctMTQuMy0zMi0zMi0zMnMtMzIgMTQuMy0zMiAzMnMxNC4zIDMyIDMyIDMyczMyLTE0LjMgMzItMzJ6Ii8+PC9zdmc+"
        ),
        "mimeType": "image/svg+xml",
    },
}

ICON_CHART = {
    "light": {
        "base64": (
            "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+"
        ),
        "mimeType": "image/svg+xml",
    },
    "dark": {
        "base64": (
            "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+"
        ),
        "mimeType": "image/svg+xml",
    },
}

BTN_ACTIVE = {
    "backgroundColor": "#10384f",
    "border": "1px solid #10384f",
    "borderRadius": "4px",
    "padding": "6px 10px",
    "minWidth": "36px",
}
BTN_INACTIVE = {
    "backgroundColor": "#f1f5f9",
    "border": "1px solid #ededed",
    "borderRadius": "4px",
    "padding": "6px 10px",
    "minWidth": "36px",
}
SUBMIT_BTN_STYLE = {
    "backgroundColor": "#10384f",
    "color": "#ffffff",
    "fontSize": "12px",
    "fontWeight": "600",
    "border": "1px solid #10384f",
    "borderRadius": "4px",
}

TABLE_STYLE = {
    "fontSize": "12px",
    "fontFamily": "Inter, 'Segoe UI', sans-serif",
    "backgroundColor": "#ffffff",
    "border": "1px solid #ededed",
    "borderRadius": "8px",
    "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
    "headerBackground": "#f8fafc",
    "headerColor": "#10384f",
    "headerFontWeight": "600",
}

COUNTER_SCHEMA = [
    {"name": "ObjectName", "title": "Name"},
    {"name": "type", "title": "Type"},
    {"name": "Value", "title": "Value"},
    {"name": "Unit", "title": "Unit"},
    {"name": "penName", "title": "penName"},
    {"name": "path", "title": "path"},
]


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


def show_view(active: str) -> list:
    """Show counters or chart. Hide others first (avoids grid push / bottom misalignment)."""
    others = [wid for wid in (COUNTERS_ID, SELECTED_ID, CHART_ID) if wid != active]
    return [layout_modify(wid, HIDE_LAYOUT) for wid in others] + [
        layout_modify(active, SHOW_LAYOUT)
    ]


def show_counters_hide_chart() -> list:
    """Used when tree/overview select a new object — return to counters."""
    return show_view(COUNTERS_ID)


def pens_from_selected_rows() -> list:
    return [
        {
            "type": "transform",
            "completeMsgObject": False,
            "aggregate": [
                {
                    "$project": {
                        "name": "$penName",
                        "path": "$path",
                        "trend_type": "HT_AREA",
                    }
                }
            ],
        },
        {
            "type": "transform",
            "completeMsgObject": True,
            "aggregateOne": [{"$project": {"pens": "$payload"}}],
        },
        {
            "type": "send",
            "to": CHART_ID,
            "message": {"topic": "addPens"},
        },
    ]


def go_counters_actions() -> list:
    return show_view(COUNTERS_ID)


def go_chart_actions() -> list:
    return show_view(CHART_ID)


def submit_to_chart_actions() -> list:
    """Collect selection → store snapshot → add pens → open Chart."""
    return [
        {
            "type": "collect",
            "from": "self",
            "message": {"topic": "selectedRows"},
        },
        {
            "type": "modify",
            "id": SELECTED_ID,
            "set": [{"name": "model.data", "value": "$payload"}],
        },
        *pens_from_selected_rows(),
        *show_view(CHART_ID),
    ]


def icon_button(tool_id: str, icon: dict, active: bool, on_click: list) -> dict:
    return {
        "type": "button",
        "title": "",
        "icon": copy.deepcopy(icon),
        "style": BTN_ACTIVE if active else BTN_INACTIVE,
        "actions": {"onClick": on_click},
    }


def view_switcher_tools(active: str) -> dict:
    """Gauge = Performance Counters, trend line = Chart (default HM icons)."""
    return {
        "view-counters": icon_button(
            "view-counters",
            ICON_COUNTERS,
            active == "counters",
            go_counters_actions(),
        ),
        "view-chart": icon_button(
            "view-chart",
            ICON_CHART,
            active == "chart",
            go_chart_actions(),
        ),
    }


def top_view_toolbar(active: str) -> dict:
    return {
        "tools": view_switcher_tools(active),
        "leftOrTop": {"toolsOrder": ["view-counters", "view-chart"]},
    }


def counters_submit_toolbars() -> dict:
    return {
        "top": top_view_toolbar("counters"),
        "bottom": {
            "tools": {
                "submit-chart": {
                    "type": "button",
                    "title": "Submit",
                    "style": SUBMIT_BTN_STYLE,
                    "actions": {"onClick": submit_to_chart_actions()},
                }
            },
            "rightOrBottom": {"toolsOrder": ["submit-chart"]},
        },
    }


def selected_table_widget(visible: bool = False) -> dict:
    """Hidden snapshot store for selected rows (not shown in the view switcher)."""
    return {
        "id": SELECTED_ID,
        "type": "table",
        "name": "Selected Counters",
        "captionBar": False,
        "schema": copy.deepcopy(COUNTER_SCHEMA),
        "data": [],
        "options": {
            "multi": False,
            "editable": False,
            "style": dict(TABLE_STYLE),
        },
        "layout": dict(SHOW_LAYOUT if visible else HIDE_LAYOUT),
    }


def chart_widget(visible: bool = False) -> dict:
    layout = dict(SHOW_LAYOUT if visible else HIDE_LAYOUT)
    return {
        "id": CHART_ID,
        "type": "chart",
        "name": "Chart",
        "captionBar": True,
        "label": "Chart",
        "toolbars": {"top": top_view_toolbar("chart")},
        "tagSearchTable": {
            "captionBar": {"showModelEditorButton": False},
            "schema": [
                {"name": "ObjectName", "sort": "asc", "title": "Object Name"},
                {"name": "ObjectDescription", "title": "Description"},
                {"name": "path", "title": "Path"},
            ],
        },
        "chart": {
            "EndTime": "*",
            "StartTime": "*-1d",
            "class": "Trend",
            "name": "Trend Chart",
            "pens": [],
            "x_axis": [
                {
                    "end_time": "*",
                    "grid": False,
                    "id": 1,
                    "intervals_no": 100,
                    "locked": False,
                    "name": "X",
                    "position": {
                        "alignment": "bottom",
                        "end": 100,
                        "orientation": "bottom",
                        "start": 0,
                        "value": 1,
                    },
                    "start_time": "*-1d",
                    "themes": {
                        "dark": {"color": "white"},
                        "light": {"color": "black"},
                    },
                }
            ],
            "y_axis": [
                {
                    "grid": True,
                    "id": 1,
                    "locked": False,
                    "name": "Y",
                    "position": {
                        "alignment": "left",
                        "end": 100,
                        "orientation": "left",
                        "start": 0,
                        "value": 1,
                    },
                    "range": {
                        "max": {"mode": "auto", "value": 0},
                        "min": {"mode": "auto", "value": 0},
                    },
                    "themes": {
                        "dark": {"color": "white"},
                        "light": {"color": "black"},
                    },
                }
            ],
        },
        "options": {
            "refreshInterval": 0,
            "bottomPanel": True,
            "leftPanel": False,
            "play": "none",
            "rightPanel": True,
            "style": {
                "backgroundColor": "#ffffff",
                "border": "1px solid #ededed",
                "borderRadius": "8px",
                "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
            },
        },
        "layout": layout,
    }


def augment_counters_for_chart(widget: dict) -> dict:
    """Enable multi-select, icon view switcher, and Submit on counters table."""
    w = copy.deepcopy(widget)
    opts = w.setdefault("options", {})
    opts["multi"] = True
    opts["editable"] = False
    w["toolbars"] = counters_submit_toolbars()
    return w
