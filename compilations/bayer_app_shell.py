"""Persistent left app menu (Designer-style): Overview | Trends.

The menu rail always stays visible. Page content is swapped with layout w/h=0
(same hide-first pattern as Navigation/Overview and Counters/Chart).
"""
from __future__ import annotations

import copy

# Grid shell — menu never moves; page content starts at LEFT_X.
MENU_W = 14
LEFT_W = 28
GAP = 2
PANEL_H = 54
LEFT_X = MENU_W
RIGHT_X = LEFT_X + LEFT_W + GAP
RIGHT_W = 96 - RIGHT_X
MENU_ITEM_H = 4
HIDE_LAYOUT = {"x": 0, "y": 0, "w": 0, "h": 0, "static": True}

MENU_RAIL_ID = "bayer-menu-rail"
MENU_OVERVIEW_ID = "bayer-menu-overview"
MENU_TRENDS_ID = "bayer-menu-trends"
PAGE_OVERVIEW_TITLE_ID = "bayer-page-overview-title"
PAGE_OVERVIEW_SUB_ID = "bayer-page-overview-sub"
PAGE_OVERVIEW_NOTE_ID = "bayer-page-overview-note"  # legacy; replaced by KPI row

MENU_BG = "#0b2433"
MENU_ACTIVE_BG = "rgba(137, 211, 41, 0.18)"
MENU_INACTIVE_BG = "transparent"
MENU_TEXT = "#ffffff"

# White fill for dark menu rail.
_ICON_HOUSE_B64 = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgNTEyIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNNTc1LjggMjU1LjVjMCAxOC0xNSAzMi4xLTMyIDMyLjFoLTMybC43IDE2MC4yYzAgMi43LS4yIDUuNC0uNSA4LjFWNDcyYzAgMjIuMS0xNy45IDQwLTQwIDQwSDQ1NmMtMS4xIDAtMi4yIDAtMy4zLS4xYy0xLjQgLjEtMi44IC4xLTQuMiAuMUg0MTYgMzkyYy0yMi4xIDAtNDAtMTcuOS00MC00MFY0NDggMzg0YzAtMTcuNy0xNC4zLTMyLTMyLTMySDI1NmMtMTcuNyAwLTMyIDE0LjMtMzIgMzJ2NjQgMjRjMCAyMi4xLTE3LjkgNDAtNDAgNDBIMTYwIDEyOC4xYy0xLjUgMC0yLjkgMC00LjMtLjFjLTEuMSAuMS0yLjIgLjEtMy4zIC4xSDEwNGMtMjIuMSAwLTQwLTE3LjktNDAtNDBWMzYwYzAtLjkgMC0xLjkgLjEtMi44VjI4Ny42SDMyYy0xOCAwLTMyLTE0LTMyLTMyLjFjMC05IDMtMTcgMTAtMjRMMjY2LjQgOGM3LTcgMTUtOCAyMi04czE1IDIgMjEgN0w1NjQuOCAyMzEuNWM4IDcgMTIgMTUgMTEgMjR6Ii8+PC9zdmc+"
)
_ICON_CHART_B64 = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+"
)

ICON_HOUSE = {
    "light": {"base64": _ICON_HOUSE_B64, "mimeType": "image/svg+xml"},
    "dark": {"base64": _ICON_HOUSE_B64, "mimeType": "image/svg+xml"},
}
ICON_TRENDS = {
    "light": {"base64": _ICON_CHART_B64, "mimeType": "image/svg+xml"},
    "dark": {"base64": _ICON_CHART_B64, "mimeType": "image/svg+xml"},
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


def menu_button_style(active: bool) -> dict:
    return {
        "backgroundColor": MENU_ACTIVE_BG if active else MENU_INACTIVE_BG,
        "color": MENU_TEXT,
        "fontSize": "12px",
        "fontWeight": "600",
        "border": "none",
        "borderRadius": "6px",
        "height": "100%",
        "textAlign": "left",
        "padding": "0 8px",
        "justifyContent": "flex-start",
    }


def menu_rail() -> dict:
    return {
        "id": MENU_RAIL_ID,
        "type": "text",
        "captionBar": False,
        "text": "",
        "layout": {"x": 0, "y": 0, "w": MENU_W, "h": PANEL_H, "static": True},
        "options": {
            "style": {
                "backgroundColor": MENU_BG,
                "borderRadius": "0",
                "height": "100%",
            }
        },
    }


def menu_button(
    btn_id: str,
    label: str,
    icon: dict,
    y: int,
    active: bool,
    on_click: list,
) -> dict:
    return {
        "id": btn_id,
        "type": "button",
        "captionBar": False,
        "label": label,
        "icon": copy.deepcopy(icon),
        "layout": {"x": 0, "y": y, "w": MENU_W, "h": MENU_ITEM_H, "static": True},
        "options": {"style": menu_button_style(active)},
        "actions": {"onClick": on_click},
    }


def overview_page_widgets(visible: bool) -> list[dict]:
    """Overview page: title + Designer-style KPI row."""
    from bayer_overview_kpis import overview_kpi_widgets

    return overview_kpi_widgets(visible=visible)


def overview_page_show_layouts() -> dict[str, dict]:
    from bayer_overview_kpis import overview_kpi_show_layouts

    return overview_kpi_show_layouts()


def overview_page_ids() -> list[str]:
    from bayer_overview_kpis import overview_kpi_ids

    return overview_kpi_ids()


def activate_menu_styles(active: str) -> list:
    return [
        {
            "type": "modify",
            "id": MENU_OVERVIEW_ID,
            "set": [
                {
                    "name": "model.options.style",
                    "value": menu_button_style(active == "overview"),
                }
            ],
        },
        {
            "type": "modify",
            "id": MENU_TRENDS_ID,
            "set": [
                {
                    "name": "model.options.style",
                    "value": menu_button_style(active == "trends"),
                }
            ],
        },
    ]


def hide_ids(ids: list[str]) -> list:
    return [layout_modify(wid, HIDE_LAYOUT) for wid in ids]


def show_layouts(layouts: dict[str, dict]) -> list:
    return [layout_modify(wid, layouts[wid]) for wid in layouts]


def go_overview_page(hide_trends_ids: list[str]) -> list:
    """Hide Trends content first, then show Overview page. Menu stays."""
    from bayer_overview_kpis import KPI_HEALTH_CHART, KPI_SOURCE_ID

    return (
        hide_ids(hide_trends_ids)
        + show_layouts(overview_page_show_layouts())
        + activate_menu_styles("overview")
        + [
            {"type": "refresh", "id": KPI_SOURCE_ID},
            {"type": "refresh", "id": KPI_HEALTH_CHART},
        ]
    )


def go_trends_page(
    hide_overview_ids: list[str],
    show_trends_actions: list,
) -> list:
    """Hide Overview page first, then restore Trends (caller supplies show actions)."""
    return (
        hide_ids(hide_overview_ids)
        + show_trends_actions
        + activate_menu_styles("trends")
    )


def menu_widgets(
    overview_on_click: list,
    trends_on_click: list,
    active: str = "trends",
) -> list[dict]:
    return [
        menu_rail(),
        menu_button(
            MENU_OVERVIEW_ID,
            "Overview",
            ICON_HOUSE,
            1,
            active == "overview",
            overview_on_click,
        ),
        menu_button(
            MENU_TRENDS_ID,
            "Trends",
            ICON_TRENDS,
            1 + MENU_ITEM_H,
            active == "trends",
            trends_on_click,
        ),
    ]
