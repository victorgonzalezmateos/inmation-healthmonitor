-- Bayer Health Monitor - Webstudio entry script
-- Paste this entire file into the Script Library body:
--   /System/Core/_Global Core Logic/Development/Smart Sentinel AI/Bayer Health Monitor
--
-- Launch URL (set lib= to your LuaModuleName if different):
--   https://byus00876m1.bayer.cnb:8002/apps/webstudio/?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&lib=Bayer%20Health%20Monitor&func=dashboard_compilation
--
-- Widget data sources call: syslib.app-webstudio-healthmonitor (default HM library)

local json = require("cjson")

local COMPILATION_JSON = [=[
{
  "version": "1",
  "name": "Bayer Health Monitor",
  "description": "Full Bayer Health Monitor dashboard — paste into CustomPropertyValue (WR-01)",
  "deployment": {
    "lib": "syslib.app-webstudio-healthmonitor",
    "func": "dashboard_compilation",
    "dashboardName": "Bayer Health Monitor"
  },
  "options": {
    "background": {
      "style": {
        "backgroundColor": "#ffffff"
      }
    },
    "margin": {
      "x": 0,
      "y": 0
    },
    "numberOfColumns": 96,
    "numberOfRows": {
      "type": "count",
      "value": 120
    },
    "padding": {
      "x": 8,
      "y": 8
    },
    "spacing": {
      "x": 8,
      "y": 8
    },
    "stacking": "none",
    "theme": "light"
  },
  "widgets": [
    {
      "id": "hm-header",
      "type": "text",
      "captionBar": false,
      "text": "Bayer Health Monitor",
      "layout": {
        "x": 0,
        "y": 0,
        "w": 96,
        "h": 5,
        "static": true
      },
      "options": {
        "style": {
          "backgroundColor": "#10384f",
          "color": "#ffffff",
          "fontSize": "18px",
          "fontWeight": "bold",
          "textAlign": "left",
          "padding": "12px 16px",
          "borderRadius": "8px 8px 0 0"
        }
      }
    },
    {
      "id": "hm-process-state",
      "type": "text",
      "captionBar": false,
      "text": "ProcessState: —",
      "layout": {
        "x": 0,
        "y": 5,
        "w": 96,
        "h": 3,
        "static": true
      },
      "dataSource": {
        "type": "function",
        "lib": "syslib.app-webstudio-healthmonitor",
        "func": "ProcessState"
      },
      "options": {
        "refreshInterval": 30,
        "showRefreshButton": true,
        "style": {
          "backgroundColor": "#10384f",
          "color": "#e2e8f0",
          "fontSize": "12px",
          "textAlign": "right",
          "padding": "4px 16px 8px"
        }
      }
    },
    {
      "id": "hm-nav-tree",
      "type": "tree",
      "captionBar": true,
      "label": "Navigation",
      "layout": {
        "x": 0,
        "y": 8,
        "w": 28,
        "h": 52,
        "static": true
      },
      "dataSource": {
        "type": "function",
        "lib": "syslib.app-webstudio-healthmonitor",
        "func": "fetchNavigationTree"
      },
      "options": {
        "refreshInterval": 30,
        "showRefreshButton": true,
        "style": {
          "backgroundColor": "#f8fafc",
          "border": "1px solid #ededed",
          "borderRadius": "8px",
          "fontSize": "12px",
          "color": "#10384f"
        },
        "selection": {
          "indicatorColor": "#89d329",
          "indicatorWidth": "3px"
        }
      },
      "actions": {
        "onNodeSelect": [
          {
            "id": "hm-overview-table",
            "type": "refresh"
          },
          {
            "id": "hm-props-panel",
            "type": "refresh"
          },
          {
            "id": "hm-counters-table",
            "type": "refresh"
          }
        ]
      },
      "dataKeys": [
        "selectedPath"
      ]
    },
    {
      "id": "hm-overview-table",
      "type": "table",
      "captionBar": true,
      "label": "Overview — hierarchy health",
      "layout": {
        "x": 30,
        "y": 8,
        "w": 66,
        "h": 52,
        "static": true
      },
      "dataSource": {
        "type": "function",
        "lib": "syslib.app-webstudio-healthmonitor",
        "func": "fetchNavigationTable"
      },
      "columns": [
        {
          "field": "ObjectName",
          "label": "Name",
          "width": "22%"
        },
        {
          "field": "Type",
          "label": "Type",
          "width": "12%"
        },
        {
          "field": "CommState",
          "label": "CommState",
          "width": "12%",
          "stateStyle": true
        },
        {
          "field": "ObjectState",
          "label": "ObjectState",
          "width": "12%",
          "stateStyle": true
        },
        {
          "field": "WorstState",
          "label": "WorstState",
          "width": "12%",
          "stateStyle": true
        },
        {
          "field": "State",
          "label": "State",
          "width": "30%",
          "monospace": true
        }
      ],
      "options": {
        "refreshInterval": 30,
        "showRefreshButton": true,
        "compact": true,
        "collapseHealthyBranches": true,
        "collapseWhen": {
          "field": "WorstState",
          "value": "Good"
        },
        "emphasizeWhen": {
          "anyOf": [
            {
              "field": "WorstState",
              "not": "Good"
            },
            {
              "field": "CommState",
              "value": "Bad"
            },
            {
              "field": "ObjectState",
              "value": "Bad"
            }
          ]
        },
        "stateCellStyles": {
          "Good": {
            "backgroundColor": "#d4f1d4",
            "color": "#10384f"
          },
          "Bad": {
            "backgroundColor": "#f1d4d4",
            "color": "#10384f"
          },
          "Empty": {
            "backgroundColor": "#f0edf0",
            "color": "#10384f"
          },
          "Disabled": {
            "backgroundColor": "#e2e8f0",
            "color": "#64748b"
          },
          "Neutral": {
            "backgroundColor": "#ffffff",
            "color": "#10384f"
          }
        },
        "style": {
          "backgroundColor": "#ffffff",
          "border": "1px solid #ededed",
          "borderRadius": "8px",
          "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
          "fontSize": "12px"
        },
        "selectedRowStyle": {
          "outline": "2px solid #89d329"
        }
      },
      "actions": {
        "onRowSelect": [
          {
            "id": "hm-props-panel",
            "type": "refresh"
          },
          {
            "id": "hm-counters-table",
            "type": "refresh"
          }
        ]
      },
      "dataKeys": [
        "selectedPath"
      ]
    },
    {
      "id": "hm-detail-tabs",
      "type": "tabs",
      "captionBar": false,
      "layout": {
        "x": 0,
        "y": 62,
        "w": 96,
        "h": 52,
        "static": true
      },
      "options": {
        "tabBarStyle": {
          "backgroundColor": "#10384f",
          "color": "#ffffff",
          "fontSize": "13px",
          "fontWeight": "600",
          "activeIndicatorColor": "#89d329",
          "activeIndicatorHeight": "3px"
        }
      },
      "tabs": [
        {
          "id": "tab-properties",
          "title": "Properties",
          "compilation": {
            "version": "1",
            "options": {
              "numberOfColumns": 96,
              "numberOfRows": {
                "type": "count",
                "value": 44
              }
            },
            "widgets": [
              {
                "id": "hm-props-panel",
                "type": "form",
                "captionBar": true,
                "label": "Selected object",
                "layout": {
                  "x": 0,
                  "y": 0,
                  "w": 96,
                  "h": 44,
                  "static": true
                },
                "dataSource": {
                  "type": "function",
                  "lib": "syslib.app-webstudio-healthmonitor",
                  "func": "fetchObjProps"
                },
                "entries": [
                  {
                    "id": "ObjectName",
                    "label": "ObjectName",
                    "type": "readonly",
                    "field": "ObjectName"
                  },
                  {
                    "id": "Type",
                    "label": "Type",
                    "type": "readonly",
                    "field": "Type"
                  },
                  {
                    "id": "ObjectID",
                    "label": "ObjectID",
                    "type": "readonly",
                    "field": "ObjectID"
                  },
                  {
                    "id": "ObjectIDExtended",
                    "label": "ObjectIDExtended",
                    "type": "readonly",
                    "field": "ObjectIDExtended"
                  },
                  {
                    "id": "Path",
                    "label": "Path",
                    "type": "readonly",
                    "field": "Path",
                    "wrap": true
                  },
                  {
                    "id": "ConfigVersion",
                    "label": "ConfigVersion",
                    "type": "readonly",
                    "field": "ConfigVersion"
                  },
                  {
                    "id": "ClassVersion",
                    "label": "ClassVersion",
                    "type": "readonly",
                    "field": "ClassVersion"
                  },
                  {
                    "id": "Created",
                    "label": "Created",
                    "type": "readonly",
                    "field": "Created"
                  },
                  {
                    "id": "Modified",
                    "label": "Modified",
                    "type": "readonly",
                    "field": "Modified"
                  },
                  {
                    "id": "State",
                    "label": "State",
                    "type": "readonly",
                    "field": "State",
                    "wrap": true,
                    "monospace": true,
                    "showSegmentBreakdown": true
                  },
                  {
                    "id": "Image",
                    "label": "Image",
                    "type": "readonly",
                    "field": "Image"
                  },
                  {
                    "id": "access",
                    "label": "access",
                    "type": "readonly",
                    "field": "access",
                    "hiddenWhenEmpty": true
                  }
                ],
                "options": {
                  "readOnly": true,
                  "showToolbar": false,
                  "layout": "twoColumn",
                  "labelWidth": "35%",
                  "emptyMessage": "Select an object in Overview to view properties.",
                  "respectAccessField": true,
                  "style": {
                    "backgroundColor": "#ffffff",
                    "border": "1px solid #ededed",
                    "borderRadius": "8px",
                    "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
                    "padding": "16px",
                    "fontSize": "12px",
                    "labelColor": "#64748b",
                    "valueColor": "#10384f"
                  },
                  "fieldStyles": {
                    "State": {
                      "fontFamily": "Consolas, monospace",
                      "fontSize": "11px",
                      "whiteSpace": "pre-wrap",
                      "wordBreak": "break-all",
                      "backgroundColor": "#f8fafc",
                      "padding": "8px",
                      "borderRadius": "4px"
                    },
                    "Path": {
                      "fontSize": "11px",
                      "wordBreak": "break-all"
                    }
                  },
                  "stateRowAccent": {
                    "contains": {
                      "COMM_ERROR": {
                        "backgroundColor": "#f1d4d4"
                      },
                      "STATE_ERROR": {
                        "backgroundColor": "#f1d4d4"
                      },
                      "OBJ_DISABLED": {
                        "backgroundColor": "#e2e8f0"
                      },
                      "COMM_GOOD": {
                        "backgroundColor": "#d4f1d4"
                      }
                    },
                    "applyToField": "State"
                  }
                },
                "dataKeys": [
                  "selectedPath"
                ]
              }
            ]
          }
        },
        {
          "id": "tab-counters",
          "title": "Performance Counters",
          "compilation": {
            "version": "1",
            "options": {
              "numberOfColumns": 96,
              "numberOfRows": {
                "type": "count",
                "value": 44
              }
            },
            "widgets": [
              {
                "id": "hm-counters-table",
                "type": "table",
                "captionBar": true,
                "label": "Performance counters",
                "layout": {
                  "x": 0,
                  "y": 0,
                  "w": 80,
                  "h": 40,
                  "static": true
                },
                "dataSource": {
                  "type": "function",
                  "lib": "syslib.app-webstudio-healthmonitor",
                  "func": "fetchPerformanceCountersTable"
                },
                "columns": [
                  {
                    "field": "ObjectName",
                    "label": "ObjectName",
                    "width": "20%"
                  },
                  {
                    "field": "type",
                    "label": "type",
                    "width": "10%"
                  },
                  {
                    "field": "group",
                    "label": "group",
                    "width": "12%"
                  },
                  {
                    "field": "Value",
                    "label": "Value",
                    "width": "12%",
                    "align": "right"
                  },
                  {
                    "field": "Unit",
                    "label": "Unit",
                    "width": "8%"
                  },
                  {
                    "field": "penName",
                    "label": "penName",
                    "width": "14%"
                  },
                  {
                    "field": "path",
                    "label": "path",
                    "width": "18%",
                    "wrap": true
                  },
                  {
                    "field": "cList.exists",
                    "label": "cList.exists",
                    "width": "6%",
                    "align": "center"
                  }
                ],
                "options": {
                  "readOnly": true,
                  "compact": true,
                  "expandNested": {
                    "field": "cList",
                    "when": {
                      "cList.exists": true
                    }
                  },
                  "emptyMessage": "Select an object in Overview to view performance counters.",
                  "minimalRowsMessage": "Health calculation rows only (datasource unhealthy).",
                  "style": {
                    "backgroundColor": "#ffffff",
                    "border": "1px solid #ededed",
                    "borderRadius": "8px",
                    "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
                    "fontSize": "12px",
                    "headerBackground": "#f8fafc",
                    "headerColor": "#10384f",
                    "headerFontWeight": "600"
                  },
                  "valueColumnStyle": {
                    "Value": {
                      "textAlign": "right",
                      "fontVariantNumeric": "tabular-nums"
                    },
                    "Unit": {
                      "color": "#64748b"
                    }
                  },
                  "selectedRowStyle": {
                    "outline": "2px solid #89d329"
                  }
                },
                "actions": {
                  "onRowSelect": [
                    {
                      "id": "hm-submit-chart-btn",
                      "type": "enable"
                    }
                  ]
                },
                "dataKeys": [
                  "selectedPath",
                  "selectedCounterRow"
                ]
              },
              {
                "id": "hm-submit-chart-btn",
                "type": "button",
                "captionBar": false,
                "label": "Submit to Chart",
                "layout": {
                  "x": 82,
                  "y": 0,
                  "w": 14,
                  "h": 6,
                  "static": true
                },
                "options": {
                  "disabled": true,
                  "style": {
                    "backgroundColor": "#10384f",
                    "color": "#ffffff",
                    "fontSize": "13px",
                    "fontWeight": "bold",
                    "borderRadius": "4px",
                    "border": "none"
                  },
                  "hoverStyle": {
                    "backgroundColor": "#0f2d3f"
                  }
                },
                "actions": {
                  "onClick": [
                    {
                      "id": "hm-chart",
                      "type": "refresh"
                    }
                  ]
                },
                "dataKeys": [
                  "selectedCounterRow"
                ]
              }
            ]
          }
        },
        {
          "id": "tab-chart",
          "title": "Chart",
          "compilation": {
            "version": "1",
            "options": {
              "numberOfColumns": 96,
              "numberOfRows": {
                "type": "count",
                "value": 44
              }
            },
            "widgets": [
              {
                "id": "hm-chart",
                "type": "chart",
                "captionBar": true,
                "label": "Trend — Submit to Chart",
                "layout": {
                  "x": 0,
                  "y": 0,
                  "w": 96,
                  "h": 40,
                  "static": true
                },
                "dataSourceChain": [
                  {
                    "step": 1,
                    "lib": "syslib.app-webstudio-healthmonitor",
                    "func": "createtrend",
                    "inputFrom": "selectedCounterRow",
                    "contextMap": {
                      "path": "path",
                      "penName": "penName",
                      "ObjectName": "ObjectName"
                    }
                  },
                  {
                    "step": 2,
                    "lib": "syslib.app-webstudio-healthmonitor",
                    "func": "createtrendpen",
                    "inputFrom": "step1.trendId",
                    "contextMap": {
                      "penName": "selectedCounterRow.penName",
                      "path": "selectedCounterRow.path",
                      "trendId": "step1.trendId"
                    }
                  },
                  {
                    "step": 3,
                    "lib": "syslib.app-webstudio-healthmonitor",
                    "func": "readhistoricaldata",
                    "inputFrom": "step2.pens",
                    "context": {
                      "timeRange": "1d",
                      "aggregate": "default",
                      "intervals": [
                        "T",
                        "V",
                        "Q"
                      ]
                    }
                  }
                ],
                "chart": {
                  "timeRange": {
                    "default": "1d",
                    "presets": [
                      "1d"
                    ]
                  },
                  "aggregate": "default",
                  "intervals": {
                    "T": {
                      "field": "t",
                      "label": "Time"
                    },
                    "V": {
                      "field": "v",
                      "label": "Value"
                    },
                    "Q": {
                      "field": "q",
                      "label": "Quality"
                    }
                  },
                  "pensFrom": "step2.pens",
                  "penMetadata": {
                    "name": "penName",
                    "path": "path",
                    "unit": "Unit"
                  }
                },
                "options": {
                  "emptyMessage": "Select a counter row and click Submit to Chart on the Performance Counters tab.",
                  "showLegend": true,
                  "showQualityBands": true,
                  "style": {
                    "backgroundColor": "#ffffff",
                    "border": "1px solid #ededed",
                    "borderRadius": "8px",
                    "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)"
                  },
                  "penColors": [
                    "#00bcff",
                    "#89d329",
                    "#10384f"
                  ],
                  "gridColor": "#ededed",
                  "axisColor": "#64748b"
                },
                "dataKeys": [
                  "selectedCounterRow",
                  "selectedPath"
                ]
              },
              {
                "id": "hm-chart-meta",
                "type": "text",
                "captionBar": false,
                "text": "",
                "layout": {
                  "x": 0,
                  "y": 40,
                  "w": 96,
                  "h": 4,
                  "static": true
                },
                "dataSource": {
                  "type": "derived",
                  "from": "hm-chart",
                  "template": "Pen: {{penName}} | Path: {{path}} | Range: 1 day | Intervals: T/V/Q"
                },
                "options": {
                  "style": {
                    "fontSize": "11px",
                    "color": "#64748b",
                    "padding": "8px 16px",
                    "backgroundColor": "#f8fafc",
                    "borderRadius": "0 0 8px 8px"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
]=]

function dashboard_compilation(arg, req, hlp)
  return json.decode(COMPILATION_JSON)
end
