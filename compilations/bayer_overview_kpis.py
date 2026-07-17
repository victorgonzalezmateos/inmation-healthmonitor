"""Overview KPI row — Designer card style (6 widgets).

Layout per card (flat widgets, no nesting — root modify works):
  title | (icon + value) | footer

Health Score uses a semi-circle Plotly pie (Good/Warning/Bad + transparent half).
Counts from fetchNavigationTable WorstState / Path only.
"""
from __future__ import annotations

# Keep in sync with bayer_app_shell (avoid circular import).
LEFT_X = 14
PANEL_H = 54

HM_LIB = "syslib.app-webstudio-healthmonitor"
HIDE_LAYOUT = {"x": 0, "y": 0, "w": 0, "h": 0, "static": True}

TITLE_ID = "bayer-page-overview-title"
SUB_ID = "bayer-page-overview-sub"
KPI_SOURCE_ID = "bayer-kpi-source"

# Health Score pieces
KPI_HEALTH_TITLE = "bayer-kpi-health-title"
KPI_HEALTH_CHART = "bayer-kpi-health"
KPI_HEALTH_FOOTER = "bayer-kpi-health-footer"

# Stat cards: {id}-title / {id}-icon / {id}-value / {id}-footer
KPI_TOTAL = "bayer-kpi-total"
KPI_PROBLEMS = "bayer-kpi-problems"
KPI_WARNINGS = "bayer-kpi-warnings"
KPI_INFO = "bayer-kpi-info"
KPI_SITES = "bayer-kpi-sites"

TITLE_H = 3
SUB_H = 2
KPI_Y = TITLE_H + SUB_H
KPI_H = 18
CONTENT_PAD = 1
CARD_GAP = 1
INNER_COLS = 12  # logical split inside each card via fractions of card_w

CARD_BG = {
    "backgroundColor": "#ffffff",
    "border": "1px solid #e5e7eb",
    "borderRadius": "12px",
    "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
    "height": "100%",
}

FONT = "Inter, 'Segoe UI', sans-serif"

# Icons (SVG base64)
ICON_SERVER = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+"
    "PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjE0IiByeD0iNCIgZmlsbD0iIzI1NjNlYiIvPjxy"
    "ZWN0IHg9IjgiIHk9IjI1IiB3aWR0aD0iNDgiIGhlaWdodD0iMTQiIHJ4PSI0IiBmaWxsPSIjMjU2M2ViIi8+PHJl"
    "Y3QgeD0iOCIgeT0iNDIiIHdpZHRoPSI0OCIgaGVpZ2h0PSIxNCIgcng9IjQiIGZpbGw9IiMyNTYzZWIiLz48Y2ly"
    "Y2xlIGN4PSI0NiIgY3k9IjE1IiByPSIzIiBmaWxsPSIjZmZmZmZmIi8+PGNpcmNsZSBjeD0iNDYiIGN5PSIzMiIg"
    "cj0iMyIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjQ2IiBjeT0iNDkiIHI9IjMiIGZpbGw9IiNmZmZmZmYi"
    "Lz48L3N2Zz4="
)
ICON_WARN_RED = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+"
    "PHBhdGggZmlsbD0iI2VmNDQ0NCIgZD0iTTMyIDZMNjAgNTRINEwzMiA2eiIvPjxyZWN0IHg9IjI5IiB5PSIyNCIg"
    "d2lkdGg9IjYiIGhlaWdodD0iMTYiIHJ4PSIyIiBmaWxsPSIjZmZmZmZmIi8+PGNpcmNsZSBjeD0iMzIiIGN5PSI0"
    "NiIgcj0iMy41IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+"
)
ICON_WARN_YELLOW = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+"
    "PHBhdGggZmlsbD0iI2VhYjMwOCIgZD0iTTMyIDZMNjAgNTRINEwzMiA2eiIvPjxyZWN0IHg9IjI5IiB5PSIyNCIg"
    "d2lkdGg9IjYiIGhlaWdodD0iMTYiIHJ4PSIyIiBmaWxsPSIjZmZmZmZmIi8+PGNpcmNsZSBjeD0iMzIiIGN5PSI0"
    "NiIgcj0iMy41IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+"
)
ICON_INFO = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+"
    "PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMzYjgyZjYiLz48Y2lyY2xlIGN4PSIzMiIgY3k9"
    "IjE4IiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMjgiIHk9IjI4IiB3aWR0aD0iOCIgaGVpZ2h0PSIy"
    "MiIgcng9IjMiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4="
)
ICON_GLOBE = (
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+"
    "PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdjM2FlZCIgc3Ryb2tl"
    "LXdpZHRoPSI0Ii8+PGVsbGlwc2UgY3g9IjMyIiBjeT0iMzIiIHJ4PSIxMiIgcnk9IjI2IiBmaWxsPSJub25lIiBz"
    "dHJva2U9IiM3YzNhZWQiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik02IDMyaDUyTTEwIDIwaDQ0TTEwIDQ0"
    "aDQ0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3YzNhZWQiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg=="
)

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


def _icon_image(b64: str) -> dict:
    return {
        "light": {"base64": b64, "mimeType": "image/svg+xml"},
        "dark": {"base64": b64, "mimeType": "image/svg+xml"},
    }


def _content_geometry() -> tuple[int, int, list[dict]]:
    """6 equal cards across the content area."""
    content_x = LEFT_X + CONTENT_PAD
    content_w = 96 - LEFT_X - 2 * CONTENT_PAD
    n = 6
    card_w = (content_w - (n - 1) * CARD_GAP) // n
    layouts = []
    x = content_x
    for _ in range(n):
        layouts.append({"x": x, "y": KPI_Y, "w": card_w, "h": KPI_H, "static": True})
        x += card_w + CARD_GAP
    return content_x, content_w, layouts


def _card_slots(card: dict) -> dict[str, dict]:
    """Split a card rect into title / body-left / body-right / footer."""
    x, y, w, h = card["x"], card["y"], card["w"], card["h"]
    title_h = 3
    footer_h = 3
    body_y = y + title_h
    body_h = h - title_h - footer_h
    icon_w = max(3, w // 3)
    return {
        "bg": {"x": x, "y": y, "w": w, "h": h, "static": True},
        "title": {"x": x, "y": y, "w": w, "h": title_h, "static": True},
        "body_left": {"x": x, "y": body_y, "w": icon_w, "h": body_h, "static": True},
        "body_right": {
            "x": x + icon_w,
            "y": body_y,
            "w": w - icon_w,
            "h": body_h,
            "static": True,
        },
        "body_full": {"x": x, "y": body_y, "w": w, "h": body_h, "static": True},
        "footer": {
            "x": x,
            "y": y + h - footer_h,
            "w": w,
            "h": footer_h,
            "static": True,
        },
    }


def _nav_table_datasource() -> dict:
    return {
        "type": "function",
        "lib": HM_LIB,
        "func": "fetchNavigationTable",
        "catch": ERROR_NOTIFY,
    }


def _summary_transform() -> list:
    return [
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "good": {
                    "$sum": {"$cond": [{"$eq": ["$WorstState", "Good"]}, 1, 0]}
                },
                "bad": {
                    "$sum": {"$cond": [{"$eq": ["$WorstState", "Bad"]}, 1, 0]}
                },
                "warning": {
                    "$sum": {
                        "$cond": [{"$eq": ["$WorstState", "Warning"]}, 1, 0]
                    }
                },
                "empty": {
                    "$sum": {
                        "$cond": [{"$eq": ["$WorstState", "Empty"]}, 1, 0]
                    }
                },
                "disabled": {
                    "$sum": {
                        "$cond": [{"$eq": ["$WorstState", "Disabled"]}, 1, 0]
                    }
                },
                "neutral": {
                    "$sum": {
                        "$cond": [{"$eq": ["$WorstState", "Neutral"]}, 1, 0]
                    }
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "total": 1,
                "good": 1,
                "bad": 1,
                "warning": 1,
                "empty": 1,
                "disabled": 1,
                "neutral": 1,
                "info": {
                    "$add": ["$empty", "$disabled", "$neutral"]
                },
                "score": {
                    "$cond": [
                        {"$gt": ["$total", 0]},
                        {
                            "$round": [
                                {
                                    "$multiply": [
                                        {"$divide": ["$good", "$total"]},
                                        100,
                                    ]
                                },
                                0,
                            ]
                        },
                        0,
                    ]
                },
                "problemsPct": {
                    "$cond": [
                        {"$gt": ["$total", 0]},
                        {
                            "$round": [
                                {
                                    "$multiply": [
                                        {"$divide": ["$bad", "$total"]},
                                        100,
                                    ]
                                },
                                2,
                            ]
                        },
                        0,
                    ]
                },
                "warningsPct": {
                    "$cond": [
                        {"$gt": ["$total", 0]},
                        {
                            "$round": [
                                {
                                    "$multiply": [
                                        {"$divide": ["$warning", "$total"]},
                                        100,
                                    ]
                                },
                                2,
                            ]
                        },
                        0,
                    ]
                },
                "infoPct": {
                    "$cond": [
                        {"$gt": ["$total", 0]},
                        {
                            "$round": [
                                {
                                    "$multiply": [
                                        {
                                            "$divide": [
                                                {
                                                    "$add": [
                                                        "$empty",
                                                        "$disabled",
                                                        "$neutral",
                                                    ]
                                                },
                                                "$total",
                                            ]
                                        },
                                        100,
                                    ]
                                },
                                2,
                            ]
                        },
                        0,
                    ]
                },
                "statusLabel": {
                    "$cond": [
                        {
                            "$gte": [
                                {
                                    "$cond": [
                                        {"$gt": ["$total", 0]},
                                        {
                                            "$multiply": [
                                                {
                                                    "$divide": [
                                                        "$good",
                                                        "$total",
                                                    ]
                                                },
                                                100,
                                            ]
                                        },
                                        0,
                                    ]
                                },
                                70,
                            ]
                        },
                        "Good",
                        {
                            "$cond": [
                                {
                                    "$gte": [
                                        {
                                            "$cond": [
                                                {"$gt": ["$total", 0]},
                                                {
                                                    "$multiply": [
                                                        {
                                                            "$divide": [
                                                                "$good",
                                                                "$total",
                                                            ]
                                                        },
                                                        100,
                                                    ]
                                                },
                                                0,
                                            ]
                                        },
                                        40,
                                    ]
                                },
                                "Fair",
                                "Poor",
                            ]
                        },
                    ]
                },
            }
        },
    ]


def _sites_transform() -> list:
    return [
        {
            "$project": {
                "site": {"$arrayElemAt": [{"$split": ["$Path", "/"]}, 1]},
                "WorstState": 1,
            }
        },
        {"$match": {"site": {"$nin": [None, ""]}}},
        {
            "$group": {
                "_id": "$site",
                "worstBad": {
                    "$max": {
                        "$cond": [
                            {
                                "$in": [
                                    "$WorstState",
                                    ["Bad", "Warning", "Empty"],
                                ]
                            },
                            1,
                            0,
                        ]
                    }
                },
            }
        },
        {
            "$group": {
                "_id": None,
                "sitesTotal": {"$sum": 1},
                "sitesImpacted": {"$sum": "$worstBad"},
            }
        },
        {"$project": {"_id": 0, "sitesTotal": 1, "sitesImpacted": 1}},
    ]


def _modify_text(widget_id: str, field: str) -> dict:
    return {
        "type": "modify",
        "id": widget_id,
        "set": [{"name": "model.text", "value": f"$payload.{field}"}],
    }


def _kpi_source_did_update() -> list:
    return [
        {"type": "collect", "from": "self"},
        {
            "type": "transform",
            "completeMsgObject": False,
            "aggregate": _summary_transform(),
        },
        {
            "type": "transform",
            "completeMsgObject": False,
            "aggregateOne": [
                {
                    "$project": {
                        "totalValue": {"$toString": "$total"},
                        "problemsValue": {"$toString": "$bad"},
                        "warningsValue": {"$toString": "$warning"},
                        "infoValue": {"$toString": "$info"},
                        "problemsFooter": {
                            "$concat": [
                                {"$toString": "$problemsPct"},
                                "% of components",
                            ]
                        },
                        "warningsFooter": {
                            "$concat": [
                                {"$toString": "$warningsPct"},
                                "% of components",
                            ]
                        },
                        "infoFooter": {
                            "$concat": [
                                {"$toString": "$infoPct"},
                                "% of components",
                            ]
                        },
                        "healthFooter": "$statusLabel",
                        "score": "$score",
                        "good": "$good",
                        "warning": "$warning",
                        "bad": "$bad",
                    }
                }
            ],
        },
        _modify_text(f"{KPI_TOTAL}-value", "totalValue"),
        _modify_text(f"{KPI_PROBLEMS}-value", "problemsValue"),
        _modify_text(f"{KPI_WARNINGS}-value", "warningsValue"),
        _modify_text(f"{KPI_INFO}-value", "infoValue"),
        _modify_text(f"{KPI_PROBLEMS}-footer", "problemsFooter"),
        _modify_text(f"{KPI_WARNINGS}-footer", "warningsFooter"),
        _modify_text(f"{KPI_INFO}-footer", "infoFooter"),
        _modify_text(KPI_HEALTH_FOOTER, "healthFooter"),
        {"type": "collect", "from": KPI_SOURCE_ID},
        {
            "type": "transform",
            "completeMsgObject": False,
            "aggregate": _sites_transform(),
        },
        {
            "type": "transform",
            "completeMsgObject": False,
            "aggregateOne": [
                {
                    "$project": {
                        "sitesValue": {"$toString": "$sitesImpacted"},
                        "sitesFooter": {
                            "$concat": [
                                "of ",
                                {"$toString": "$sitesTotal"},
                                " sites",
                            ]
                        },
                    }
                }
            ],
        },
        _modify_text(f"{KPI_SITES}-value", "sitesValue"),
        _modify_text(f"{KPI_SITES}-footer", "sitesFooter"),
        {"type": "refresh", "id": KPI_HEALTH_CHART},
    ]


def _health_plotly_transform() -> list:
    """Semi-circle rainbow: Good / Warning / Bad + transparent lower half."""
    return [
        *_summary_transform(),
        {
            "$project": {
                "data": [
                    {
                        "type": "pie",
                        "hole": 0.72,
                        "rotation": 180,
                        "direction": "clockwise",
                        "sort": False,
                        "textinfo": "none",
                        "hoverinfo": "label+percent+value",
                        "showlegend": False,
                        "labels": ["Good", "Warning", "Bad", "_half"],
                        "values": [
                            "$good",
                            "$warning",
                            "$bad",
                            {
                                "$add": [
                                    "$good",
                                    "$warning",
                                    "$bad",
                                ]
                            },
                        ],
                        "marker": {
                            "colors": [
                                "#89d329",
                                "#eab308",
                                "#ef4444",
                                "rgba(0,0,0,0)",
                            ],
                            "line": {"width": 0},
                        },
                    }
                ],
                "plotlyOptions": {
                    "layout": {
                        "margin": {"l": 4, "r": 4, "t": 4, "b": 0},
                        "showlegend": False,
                        "annotations": [
                            {
                                "text": {"$toString": "$score"},
                                "x": 0.5,
                                "y": 0.42,
                                "xref": "paper",
                                "yref": "paper",
                                "showarrow": False,
                                "font": {
                                    "size": 28,
                                    "color": "#0f172a",
                                    "family": FONT,
                                },
                            },
                            {
                                "text": "/100",
                                "x": 0.5,
                                "y": 0.22,
                                "xref": "paper",
                                "yref": "paper",
                                "showarrow": False,
                                "font": {
                                    "size": 12,
                                    "color": "#94a3b8",
                                    "family": FONT,
                                },
                            },
                        ],
                        "paper_bgcolor": "rgba(0,0,0,0)",
                        "plot_bgcolor": "rgba(0,0,0,0)",
                    },
                    "config": {
                        "displayModeBar": False,
                        "responsive": True,
                    },
                },
            }
        },
    ]


def _text(
    wid: str,
    text: str,
    layout: dict,
    visible: bool,
    style: dict,
    *,
    caption: bool = False,
    label: str = "",
) -> dict:
    w: dict = {
        "id": wid,
        "type": "text",
        "captionBar": caption,
        "text": text,
        "layout": dict(layout if visible else HIDE_LAYOUT),
        "options": {"style": style},
    }
    if caption and label:
        w["label"] = label
    return w


def _image(wid: str, b64: str, layout: dict, visible: bool) -> dict:
    return {
        "id": wid,
        "type": "image",
        "captionBar": False,
        "image": _icon_image(b64),
        "layout": dict(layout if visible else HIDE_LAYOUT),
        "options": {
            "fit": "contain",
            "style": {
                "backgroundColor": "transparent",
                "padding": "8px",
                "height": "100%",
            },
        },
    }


def _card_chrome(wid: str, layout: dict, visible: bool) -> dict:
    return _text(
        wid,
        "",
        layout,
        visible,
        {**CARD_BG, "pointerEvents": "none"},
    )


def _title_style() -> dict:
    return {
        "backgroundColor": "transparent",
        "color": "#334155",
        "fontSize": "12px",
        "fontWeight": "600",
        "fontFamily": FONT,
        "padding": "10px 12px 0",
        "textAlign": "left",
    }


def _value_style(color: str, align: str = "left") -> dict:
    return {
        "backgroundColor": "transparent",
        "color": color,
        "fontSize": "32px",
        "fontWeight": "700",
        "fontFamily": FONT,
        "padding": "4px 8px",
        "textAlign": align,
        "display": "flex",
        "alignItems": "center",
        "height": "100%",
    }


def _footer_style(color: str) -> dict:
    return {
        "backgroundColor": "transparent",
        "color": color,
        "fontSize": "11px",
        "fontWeight": "500",
        "fontFamily": FONT,
        "padding": "0 12px 10px",
        "textAlign": "center",
    }


def health_card_widgets(card: dict, visible: bool) -> list[dict]:
    slots = _card_slots(card)
    # Chart uses most of body; footer for Good/Fair/Poor
    chart_layout = {
        "x": card["x"],
        "y": card["y"] + 3,
        "w": card["w"],
        "h": card["h"] - 6,
        "static": True,
    }
    return [
        _card_chrome(f"{KPI_HEALTH_CHART}-bg", slots["bg"], visible),
        _text(
            KPI_HEALTH_TITLE,
            "Health Score",
            slots["title"],
            visible,
            {**_title_style(), "textAlign": "center"},
        ),
        {
            "id": KPI_HEALTH_CHART,
            "type": "plotly",
            "name": "Health Score",
            "captionBar": False,
            "data": [],
            "plotlyOptions": {
                "layout": {
                    "margin": {"l": 4, "r": 4, "t": 4, "b": 0},
                    "paper_bgcolor": "rgba(0,0,0,0)",
                    "plot_bgcolor": "rgba(0,0,0,0)",
                },
                "config": {"displayModeBar": False, "responsive": True},
            },
            "dataSource": {
                **_nav_table_datasource(),
                "transform": _health_plotly_transform(),
            },
            "options": {
                "style": {
                    "backgroundColor": "transparent",
                    "border": "none",
                    "height": "100%",
                }
            },
            "layout": dict(chart_layout if visible else HIDE_LAYOUT),
        },
        _text(
            KPI_HEALTH_FOOTER,
            "—",
            slots["footer"],
            visible,
            _footer_style("#16a34a"),
        ),
    ]


def _stat_card(
    base_id: str,
    title: str,
    icon_b64: str,
    value_color: str,
    footer_color: str,
    card: dict,
    visible: bool,
    *,
    icon_on_right: bool = False,
    value_placeholder: str = "—",
    footer_placeholder: str = "—",
) -> list[dict]:
    slots = _card_slots(card)
    if icon_on_right:
        # Total Components: number left, icon right
        value_layout = {
            "x": card["x"],
            "y": slots["body_left"]["y"],
            "w": card["w"] - slots["body_left"]["w"],
            "h": slots["body_left"]["h"],
            "static": True,
        }
        icon_layout = {
            "x": card["x"] + value_layout["w"],
            "y": slots["body_left"]["y"],
            "w": slots["body_left"]["w"],
            "h": slots["body_left"]["h"],
            "static": True,
        }
    else:
        icon_layout = slots["body_left"]
        value_layout = slots["body_right"]

    return [
        _card_chrome(f"{base_id}-bg", slots["bg"], visible),
        _text(
            f"{base_id}-title",
            title,
            slots["title"],
            visible,
            _title_style(),
        ),
        _image(f"{base_id}-icon", icon_b64, icon_layout, visible),
        _text(
            f"{base_id}-value",
            value_placeholder,
            value_layout,
            visible,
            _value_style(value_color),
        ),
        _text(
            f"{base_id}-footer",
            footer_placeholder,
            slots["footer"],
            visible,
            _footer_style(footer_color),
        ),
    ]


def kpi_source_widget(visible: bool) -> dict:
    return {
        "id": KPI_SOURCE_ID,
        "type": "table",
        "name": "KPI Source",
        "captionBar": False,
        "dataSource": _nav_table_datasource(),
        "schema": [
            {"name": "ObjectName", "title": "Name"},
            {"name": "Path", "title": "Path"},
            {"name": "Type", "title": "Type"},
            {"name": "WorstState", "title": "WorstState"},
        ],
        "options": {
            "multi": False,
            "editable": False,
            "showSearch": False,
            "showFilter": False,
        },
        "layout": (
            {"x": LEFT_X, "y": PANEL_H - 1, "w": 1, "h": 1, "static": True}
            if visible
            else dict(HIDE_LAYOUT)
        ),
        "actions": {"didUpdate": _kpi_source_did_update()},
    }


def overview_title_widgets(visible: bool) -> list[dict]:
    content_x = LEFT_X + CONTENT_PAD
    content_w = 96 - LEFT_X - 2 * CONTENT_PAD
    return [
        _text(
            TITLE_ID,
            "Overview",
            {
                "x": content_x,
                "y": 0,
                "w": content_w,
                "h": TITLE_H,
                "static": True,
            },
            visible,
            {
                "backgroundColor": "transparent",
                "color": "#10384f",
                "fontSize": "22px",
                "fontWeight": "700",
                "fontFamily": FONT,
                "padding": "8px 8px 0",
            },
        ),
        _text(
            SUB_ID,
            "Global view of inmation Health",
            {
                "x": content_x,
                "y": TITLE_H,
                "w": content_w,
                "h": SUB_H,
                "static": True,
            },
            visible,
            {
                "backgroundColor": "transparent",
                "color": "#64748b",
                "fontSize": "13px",
                "fontFamily": FONT,
                "padding": "0 8px",
            },
        ),
    ]


def overview_kpi_widgets(visible: bool = False) -> list[dict]:
    _, _, cards = _content_geometry()
    return [
        *overview_title_widgets(visible),
        *health_card_widgets(cards[0], visible),
        *_stat_card(
            KPI_TOTAL,
            "Total Components",
            ICON_SERVER,
            "#0f172a",
            "#64748b",
            cards[1],
            visible,
            icon_on_right=True,
            value_placeholder="—",
            footer_placeholder="All Sites",
        ),
        # Total footer is static "All Sites" — still set via didUpdate optional;
        # keep placeholder as final text (no modify needed). Fix: set footer once.
        *_stat_card(
            KPI_PROBLEMS,
            "Problems",
            ICON_WARN_RED,
            "#ef4444",
            "#ef4444",
            cards[2],
            visible,
            footer_placeholder="—% of components",
        ),
        *_stat_card(
            KPI_WARNINGS,
            "Warnings",
            ICON_WARN_YELLOW,
            "#ca8a04",
            "#ca8a04",
            cards[3],
            visible,
            footer_placeholder="—% of components",
        ),
        *_stat_card(
            KPI_INFO,
            "Info",
            ICON_INFO,
            "#3b82f6",
            "#3b82f6",
            cards[4],
            visible,
            footer_placeholder="—% of components",
        ),
        *_stat_card(
            KPI_SITES,
            "Sites Impacted",
            ICON_GLOBE,
            "#7c3aed",
            "#64748b",
            cards[5],
            visible,
            footer_placeholder="of — sites",
        ),
        kpi_source_widget(visible),
    ]


def _all_piece_ids() -> list[str]:
    ids = [
        TITLE_ID,
        SUB_ID,
        f"{KPI_HEALTH_CHART}-bg",
        KPI_HEALTH_TITLE,
        KPI_HEALTH_CHART,
        KPI_HEALTH_FOOTER,
        KPI_SOURCE_ID,
    ]
    for base in (KPI_TOTAL, KPI_PROBLEMS, KPI_WARNINGS, KPI_INFO, KPI_SITES):
        ids.extend(
            [
                f"{base}-bg",
                f"{base}-title",
                f"{base}-icon",
                f"{base}-value",
                f"{base}-footer",
            ]
        )
    return ids


def overview_kpi_show_layouts() -> dict[str, dict]:
    content_x = LEFT_X + CONTENT_PAD
    content_w = 96 - LEFT_X - 2 * CONTENT_PAD
    _, _, cards = _content_geometry()
    layouts: dict[str, dict] = {
        TITLE_ID: {
            "x": content_x,
            "y": 0,
            "w": content_w,
            "h": TITLE_H,
            "static": True,
        },
        SUB_ID: {
            "x": content_x,
            "y": TITLE_H,
            "w": content_w,
            "h": SUB_H,
            "static": True,
        },
        KPI_SOURCE_ID: {
            "x": LEFT_X,
            "y": PANEL_H - 1,
            "w": 1,
            "h": 1,
            "static": True,
        },
    }

    # Health
    hs = _card_slots(cards[0])
    layouts[f"{KPI_HEALTH_CHART}-bg"] = hs["bg"]
    layouts[KPI_HEALTH_TITLE] = hs["title"]
    layouts[KPI_HEALTH_CHART] = {
        "x": cards[0]["x"],
        "y": cards[0]["y"] + 3,
        "w": cards[0]["w"],
        "h": cards[0]["h"] - 6,
        "static": True,
    }
    layouts[KPI_HEALTH_FOOTER] = hs["footer"]

    def add_stat(base: str, card: dict, icon_on_right: bool = False) -> None:
        slots = _card_slots(card)
        layouts[f"{base}-bg"] = slots["bg"]
        layouts[f"{base}-title"] = slots["title"]
        layouts[f"{base}-footer"] = slots["footer"]
        if icon_on_right:
            value_w = card["w"] - slots["body_left"]["w"]
            layouts[f"{base}-value"] = {
                "x": card["x"],
                "y": slots["body_left"]["y"],
                "w": value_w,
                "h": slots["body_left"]["h"],
                "static": True,
            }
            layouts[f"{base}-icon"] = {
                "x": card["x"] + value_w,
                "y": slots["body_left"]["y"],
                "w": slots["body_left"]["w"],
                "h": slots["body_left"]["h"],
                "static": True,
            }
        else:
            layouts[f"{base}-icon"] = slots["body_left"]
            layouts[f"{base}-value"] = slots["body_right"]

    add_stat(KPI_TOTAL, cards[1], icon_on_right=True)
    add_stat(KPI_PROBLEMS, cards[2])
    add_stat(KPI_WARNINGS, cards[3])
    add_stat(KPI_INFO, cards[4])
    add_stat(KPI_SITES, cards[5])
    return layouts


def overview_kpi_ids() -> list[str]:
    return _all_piece_ids()
