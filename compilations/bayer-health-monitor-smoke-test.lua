-- Bayer Health Monitor - Phase 1 smoke test
-- Paste into Script Library:
--   /System/Core/_Global Core Logic/Development/Smart Sentinel AI/Bayer Health Monitor
--
-- Launch:
--   https://byus00876m1.bayer.cnb:8002/apps/webstudio/?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&lib=Bayer%20Health%20Monitor&func=dashboard_compilation
--
-- Tree + table widgets copied from default HM (syslib.app-webstudio-healthmonitor).

local json = require("cjson")

local COMPILATION_JSON = [=[
{
  "version": "1",
  "name": "Bayer Health Monitor Smoke Test",
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
      "value": 64
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
      "text": "Bayer Health Monitor (smoke test)",
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
      "id": "tree-navigation",
      "type": "tree",
      "name": "Navigation Tree",
      "captionBar": false,
      "dataSource": {
        "type": "function",
        "lib": "syslib.app-webstudio-healthmonitor",
        "func": "fetchNavigationTree"
      },
      "actions": {
        "didUpdate": [
          {
            "type": "refresh",
            "id": "worker-property-panel"
          }
        ],
        "onClick": [
          {
            "type": "transform",
            "aggregateOne": [
              {
                "$project": {
                  "ObjectName": "$n",
                  "ObjectID": "$i",
                  "Path": "$path",
                  "Image": "$image"
                }
              }
            ]
          },
          {
            "type": "modify",
            "id": "worker-property-panel",
            "set": [
              {
                "name": "model.dataSource",
                "value": {
                  "type": "function",
                  "lib": "syslib.app-webstudio-healthmonitor",
                  "func": "fetchObjProps",
                  "farg": {
                    "ObjectName": "$payload.ObjectName",
                    "ObjectID": "$payload.ObjectID",
                    "Path": "$payload.Path",
                    "Image": "$payload.Image"
                  },
                  "catch": {
                    "type": "break",
                    "action": [
                      {
                        "type": "notify",
                        "title": "Error",
                        "text": "See browser console for more details!",
                        "duration": 12000,
                        "transition": "slide",
                        "styleByTheme": {
                          "light": {
                            "backgroundColor": "#f20d0d"
                          },
                          "dark": {
                            "backgroundColor": "#cc0000"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "action",
            "name": "sendToActiveDisplayTab"
          }
        ]
      },
      "state": {
        "expandedNodes": [
          "1",
          281474976907264,
          281474977300480,
          "2"
        ]
      },
      "options": {
        "showToolbar": false,
        "showRefreshButton": true
      },
      "layout": {
        "x": 0,
        "y": 6,
        "w": 28,
        "h": 58,
        "static": true
      }
    },
    {
      "id": "table-navigation",
      "type": "table",
      "name": "Navigation Table",
      "captionBar": false,
      "dataSource": {
        "type": "function",
        "lib": "syslib.app-webstudio-healthmonitor",
        "func": "fetchNavigationTable",
        "catch": {
          "type": "break",
          "action": [
            {
              "type": "notify",
              "title": "Error",
              "text": "See browser console for more details!",
              "duration": 12000,
              "transition": "slide",
              "styleByTheme": {
                "light": {
                  "backgroundColor": "#f20d0d"
                },
                "dark": {
                  "backgroundColor": "#cc0000"
                }
              }
            }
          ]
        }
      },
      "actions": {
        "onSelect": [
          {
            "type": "action",
            "name": "sendToActiveDisplayTab"
          }
        ]
      },
      "schema": [
        {
          "name": "ObjectName",
          "title": "Name"
        },
        {
          "name": "Type",
          "title": "Type",
          "filter": "select"
        },
        {
          "name": "ObjectState",
          "title": "Object",
          "filter": "select"
        },
        {
          "name": "CommState",
          "title": "Comm.",
          "filter": "select"
        },
        {
          "hidden": true,
          "name": "WorstState",
          "title": "WorstState"
        },
        {
          "hidden": true,
          "name": "ObjectID",
          "title": "ObjectID"
        }
      ],
      "options": {
        "rules": [
          {
            "name": "WorstState",
            "value": "Warning",
            "styleByTheme": {
              "light": {
                "backgroundColor": "#fbde02"
              },
              "dark": {
                "backgroundColor": "#ae930f"
              }
            }
          },
          {
            "name": "WorstState",
            "value": "Bad",
            "styleByTheme": {
              "light": {
                "backgroundColor": "#f20d0d"
              },
              "dark": {
                "backgroundColor": "#cc0000"
              }
            }
          },
          {
            "name": "WorstState",
            "value": "Disabled",
            "style": {
              "color": "grey"
            }
          },
          {
            "name": "ObjectState",
            "value": "Neutral",
            "style": {
              "fontStyle": "italic"
            }
          },
          {
            "name": "CommState",
            "value": "Neutral",
            "style": {
              "fontStyle": "italic"
            }
          }
        ],
        "allowSorting": true,
        "alternateColumnColoring": false,
        "alternateRowColoring": true,
        "multi": false,
        "pagination": false,
        "showHoverHighLight": true
      },
      "layout": {
        "x": 30,
        "y": 6,
        "w": 66,
        "h": 58,
        "static": true
      }
    }
  ]
}
]=]

function dashboard_compilation(arg, req, hlp)
  return json.decode(COMPILATION_JSON)
end
