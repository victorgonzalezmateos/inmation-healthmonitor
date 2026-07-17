local base = "/System/Core/_Global Core Logic/Development"

syslib.mass({
	{
		class = syslib.model.classes.GenFolder,
		operation = syslib.model.codes.MassOp.UPSERT,
		path = base .. "/Smart Sentinel AI",
		["ObjectName"] = "Smart Sentinel AI",
		["ScriptLibrary.LuaModuleMandatoryExecution"] = {
			false,
		},
		["ScriptLibrary.AdvancedLuaScript"] = {
			[=[
function dashboard_compilation(arg, req, hlp)
  -- Dashboard JSON is in CustomOptions.CustomProperties (name=Bayer Health Monitor).
  -- Launch: obj=Smart Sentinel AI&name=Bayer%20Health%20Monitor
  return nil
end

]=],
		},
		["ScriptLibrary.LuaModuleName"] = {
			"bayer.healthmonitor",
		},
		["CustomOptions.CustomProperties.CustomPropertyName"] = {
			"Bayer Health Monitor",
		},
		["CustomOptions.CustomProperties.CustomPropertyValue"] = {
			[=[
{
  "version": "1",
  "name": "Smart Sentinel",
  "description": "Smart Sentinel HM: nav + properties + counters/table/chart (bayer-counters-table/bayer-selected-table/bayer-chart)",
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
      "value": 56
    },
    "padding": {
      "x": 0,
      "y": 0
    },
    "spacing": {
      "x": 0,
      "y": 0
    },
    "stacking": "none",
    "theme": "light"
  },
  "rootOnly": {
    "appBar": {
      "center": {
        "defaultTools": {
          "hidden": false
        },
        "toolsOrder": []
      },
      "left": {
        "defaultTools": {
          "hidden": true
        },
        "toolsOrder": [
          "logoBayer",
          "pageName",
          "spacer"
        ]
      },
      "right": {
        "toolsOrder": [
          "restricted",
          "spacer"
        ]
      },
      "style": {
        "background": "-webkit-linear-gradient(-18deg, #FFFFFF 50%, #7C84C2 50%,  #34B4E4 83%, #60C5EB 100%)",
        "border": "1px solid #EDEDED",
        "borderTop": "0px solid transparent",
        "height": "48px"
      },
      "tools": {
        "logoBayer": {
          "icon": {
            "icon": {
              "base64": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMDAiCiAgIGhlaWdodD0iMTAwMCIKICAgdmlld0JveD0iMCAwIDYzMy4zMzMzMyA2MzMuMzMzMzMiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzExIgogICBzb2RpcG9kaTpkb2NuYW1lPSJMb2dvX0JheWVyLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45Mi4zICgyNDA1NTQ2LCAyMDE4LTAzLTExKSI+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhMTciPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxkZWZzCiAgICAgaWQ9ImRlZnMxNSIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjEzNjYiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iNzA1IgogICAgIGlkPSJuYW1lZHZpZXcxMyIKICAgICBzaG93Z3JpZD0iZmFsc2UiCiAgICAgaW5rc2NhcGU6em9vbT0iMC4zNTM1NTMzOSIKICAgICBpbmtzY2FwZTpjeD0iNjQzLjA4OTY4IgogICAgIGlua3NjYXBlOmN5PSI0NTcuODEyOTciCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9InN2ZzExIgogICAgIGlua3NjYXBlOm1lYXN1cmUtc3RhcnQ9IjAsMCIKICAgICBpbmtzY2FwZTptZWFzdXJlLWVuZD0iMCwwIiAvPgogIDxzdHlsZQogICAgIHR5cGU9InRleHQvY3NzIgogICAgIGlkPSJzdHlsZTIiPgoJLnN0MHtmaWxsOiMxMDM4NEY7fQoJLnN0MXtmaWxsOiM4OUQzMjk7fQoJLnN0MntmaWxsOiMwMEJDRkY7fQo8L3N0eWxlPgogIDxnCiAgICAgaWQ9Imc0MyI+CiAgICA8ZwogICAgICAgaWQ9Imc5NzUiPgogICAgICA8cGF0aAogICAgICAgICBzdHlsZT0iZmlsbDojODlkMzI5O3N0cm9rZS13aWR0aDo4LjMzMzMzMzAyIgogICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgICBpZD0icGF0aDYiCiAgICAgICAgIGQ9Ik0gNjMyLjUsMjk2LjY2NjY3IEMgNjIyLjUsMTMxLjY2NjY3IDQ4NSwwIDMxNi42NjY2NywwIDE0OC4zMzMzMywwIDEwLjgzMzMzMywxMzEuNjY2NjcgMC44MzMzMzMyOSwyOTYuNjY2NjcgYyAwLDYuNjY2NjYgMC44MzMzMzMzMSwxMy4zMzMzMyAxLjY2NjY2NjcxLDIwIEMgOS4xNjY2NjY2LDM3MS42NjY2NyAzMCw0MjIuNSA2MS42NjY2NjYsNDY1IDExOS4xNjY2Nyw1NDMuMzMzMzMgMjExLjY2NjY3LDU5NC4xNjY2NiAzMTYuNjY2NjcsNTk0LjE2NjY2IDE3MCw1OTQuMTY2NjYgNTAsNDgwIDQwLDMzNi42NjY2NyBjIC0wLjgzMzMzNCwtNi42NjY2NyAtMC44MzMzMzQsLTEzLjMzMzM0IC0wLjgzMzMzNCwtMjAgMCwtNi42NjY2NyAwLC0xMy4zMzMzNCAwLjgzMzMzNCwtMjAgQyA1MCwxNTMuMzMzMzMgMTcwLDM5LjE2NjY2NyAzMTYuNjY2NjcsMzkuMTY2NjY3IGMgMTA0Ljk5OTk5LDAgMTk3LjQ5OTk5LDUwLjgzMzMzMyAyNTQuOTk5OTksMTI5LjE2NjY2MyAzMS42NjY2Nyw0Mi41IDUyLjUsOTMuMzMzMzQgNTkuMTY2NjcsMTQ4LjMzMzM0IDAuODMzMzMsNi42NjY2NiAxLjY2NjY3LDEzLjMzMzMzIDEuNjY2NjcsMTkuMTY2NjYgMCwtNi42NjY2NiAwLjgzMzMzLC0xMy4zMzMzMyAwLjgzMzMzLC0yMCAwLC01LjgzMzMzIDAsLTEyLjUgLTAuODMzMzMsLTE5LjE2NjY2IgogICAgICAgICBjbGFzcz0ic3QxIiAvPgogICAgICA8cGF0aAogICAgICAgICBzdHlsZT0iZmlsbDojMDBiY2ZmO3N0cm9rZS13aWR0aDo4LjMzMzMzMzAyIgogICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgICBpZD0icGF0aDgiCiAgICAgICAgIGQ9Ik0gMC44MzMzMzMyOSwzMzYuNjY2NjcgQyAxMC44MzMzMzMsNTAxLjY2NjY2IDE0OC4zMzMzMyw2MzMuMzMzMzMgMzE2LjY2NjY3LDYzMy4zMzMzMyA0ODUsNjMzLjMzMzMzIDYyMi41LDUwMS42NjY2NiA2MzIuNSwzMzYuNjY2NjcgYyAwLC02LjY2NjY3IC0wLjgzMzM0LC0xMy4zMzMzNCAtMS42NjY2NywtMjAgLTYuNjY2NjcsLTU1IC0yNy41LC0xMDUuODMzMzQgLTU5LjE2NjY3LC0xNDguMzMzMzQgLTU3LjUsLTc4LjMzMzMzIC0xNTAsLTEyOS4xNjY2NjMgLTI1NC45OTk5OSwtMTI5LjE2NjY2MyAxNDYuNjY2NjYsMCAyNjYuNjY2NjYsMTE0LjE2NjY2MyAyNzYuNjY2NjYsMjU3LjUwMDAwMyAwLjgzMzMzLDYuNjY2NjYgMC44MzMzMywxMy4zMzMzMyAwLjgzMzMzLDIwIDAsNi42NjY2NiAwLDEzLjMzMzMzIC0wLjgzMzMzLDIwIC0xMCwxNDQuMTY2NjYgLTEzMCwyNTcuNDk5OTkgLTI3Ni42NjY2NiwyNTcuNDk5OTkgLTEwNSwwIC0xOTcuNSwtNTAuODMzMzMgLTI1NS4wMDAwMDQsLTEyOS4xNjY2NiBDIDMwLDQyMi41IDkuMTY2NjY2NiwzNzEuNjY2NjcgMi41LDMxNi42NjY2NyAxLjY2NjY2NjYsMzEwIDAuODMzMzMzMjksMzAzLjMzMzMzIDAuODMzMzMzMjksMjk3LjUgYyAwLDYuNjY2NjcgLTAuODMzMzMzMzMsMTMuMzMzMzMgLTAuODMzMzMzMzMsMjAgMCw1LjgzMzMzIDAsMTIuNSAwLjgzMzMzMzMzLDE5LjE2NjY3IgogICAgICAgICBjbGFzcz0ic3QyIiAvPgogICAgPC9nPgogICAgPGcKICAgICAgIGlkPSJnMjgiPgogICAgICA8cGF0aAogICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgICBzdHlsZT0iZmlsbDojMTAzODRmO3N0cm9rZS13aWR0aDoxMy4xNTc4OTQxMyIKICAgICAgICAgZD0iTSA0MzguMTU4Miw5Ni4wNTI3MzQgViAyMzQuMjEwOTQgaCA5Ni4wNTI3NCBjIDIzLjY4NDIxLDAgNDIuMTA1NDcsLTE4LjQyMTI2IDQyLjEwNTQ3LC00Mi4xMDU0NyAwLC0xMS44NDIxMSAtNS4yNjM0NywtMjIuMzY4OTQgLTEzLjE1ODIxLC0zMC4yNjM2NyA1LjI2MzE2LC02LjU3ODk1IDkuMjA5NjEsLTE1Ljc4OTQ4IDEwLjUyNTM5LC0yNSAwLC0yMi4zNjg0MiAtMTguNDIwNjMsLTQwLjc4OTA2NiAtNDAuNzg5MDYsLTQwLjc4OTA2NiB6IE0gNDY5LjczNjMzLDEyNSBoIDU3Ljg5NDUzIGMgNi41Nzg5NCwwIDExLjg0Mzc1LDUuMjYyODUgMTEuODQzNzUsMTEuODQxOCAwLDYuNTc4OTQgLTUuMjY0ODEsMTEuODQxNzkgLTExLjg0Mzc1LDExLjg0MTc5IGggLTU3Ljg5NDUzIHogbSAwLDUyLjYzMDg2IGggNTkuMjEwOTQgYyA3Ljg5NDczLDAgMTMuMTU4Miw1LjI2MzQ3IDEzLjE1ODIsMTMuMTU4MiAwLDcuODk0NzQgLTUuMjYzNDcsMTMuMTU4MjEgLTEzLjE1ODIsMTMuMTU4MjEgaCAtNTkuMjEwOTQgeiIKICAgICAgICAgdHJhbnNmb3JtPSJzY2FsZSgwLjYzMzMzMzMzKSIKICAgICAgICAgaWQ9InBhdGg4NTgiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIHN0eWxlPSJmaWxsOiMxMDM4NGY7c3Ryb2tlLXdpZHRoOjEzLjE1Nzg5NDEzIgogICAgICAgICBkPSJtIDQ4NC4yMTA5NCwyNjAuNTI1MzkgLTY4LjQyMTg4LDEzOC4xNTgyIGggMzUuNTI3MzUgTCA0NjEuODQxOCwzNzUgaCA3Ny42MzI4MSBMIDU1MCwzOTguNjgzNTkgaCAzNS41MjUzOSBMIDUxNS43ODkwNiwyNjAuNTI1MzkgWiBNIDUwMCwyOTYuMDUyNzMgbCAyMy42ODM1OSw1MCBoIC00Ny4zNjcxOCB6IgogICAgICAgICB0cmFuc2Zvcm09InNjYWxlKDAuNjMzMzMzMzMpIgogICAgICAgICBpZD0icGF0aDg1MiIgLz4KICAgICAgPHBhdGgKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgc3R5bGU9ImZpbGw6IzEwMzg0ZjtzdHJva2Utd2lkdGg6OC4zMzMzMzMwMiIKICAgICAgICAgZD0ibSAzNDYuNjY2NjcsMjcxLjY2NjY3IGggMjUgTCAzMjcuNSwzMjguMzMzMzMgdiAzMC44MzMzNCBIIDMwNi42NjY2NyBWIDMyOC4zMzMzMyBMIDI2Mi41LDI3MS42NjY2NyBoIDI1IGwgMzAsNDAgeiIKICAgICAgICAgaWQ9InBhdGg4NDgiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIHN0eWxlPSJmaWxsOiMxMDM4NGY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOjEzLjE1Nzg5NDEzIgogICAgICAgICBkPSJtIDc3My42ODM1OSw0MjguOTQ3MjcgdiAxMzguMTU4MiBoIDMyLjg5NDUzIHYgLTUyLjYzMDg2IGggMjUgbCAzOS40NzQ2MSw1Mi42MzA4NiBoIDM5LjQ3MjY2IEwgODY5LjczNjMzLDUxMy4xNTgyIEMgODg2Ljg0MTU5LDUwNy44OTUwNSA5MDAsNDkyLjEwNTk4IDkwMCw0NzIuMzY5MTQgYyAwLC0yMy42ODQyMSAtMTguNDIxMjYsLTQzLjQyMTg3IC00Mi4xMDU0NywtNDMuNDIxODcgeiBtIDM0LjIxMDk0LDI4Ljk0NzI2IGggNDcuMzY5MTQgYyA2LjU3ODk1LDAgMTMuMTU4MjEsNi41NzkyNyAxMy4xNTgyMSwxMy4xNTgyIDAsNi41Nzg5NiAtNS4yNjM0NywxMy4xNTgyMSAtMTMuMTU4MjEsMTMuMTU4MjEgaCAtNDcuMzY5MTQgeiIKICAgICAgICAgaWQ9InBhdGg4NDQiCiAgICAgICAgIHRyYW5zZm9ybT0ic2NhbGUoMC42MzMzMzMzMykiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIHN0eWxlPSJmaWxsOiMxMDM4NGY7c3Ryb2tlLXdpZHRoOjguMzMzMzMzMDIiCiAgICAgICAgIGQ9Im0gNjQuMTY2NjY2LDI3MS42NjY0NyB2IDg3LjUwMDIgaCA2MC44MzM0MDQgYyAxNSwwIDI2LjY2NjgsLTExLjY2NjggMjYuNjY2OCwtMjYuNjY2OCAwLC03LjUwMDAxIC0zLjMzMzUzLC0xNC4xNjcgLTguMzMzNTQsLTE5LjE2NyAzLjMzMzM0LC00LjE2NjY2IDUuODMyNzYsLTEwIDYuNjY2MDksLTE1LjgzMzMzIDAsLTE0LjE2NjY2IC0xMS42NjY0LC0yNS44MzMwNyAtMjUuODMzMDgsLTI1LjgzMzA3IHogbSAxOS45OTk0ODIsMTguMzMzMjYgaCAzNi42NjY1NDIgYyA0LjE2NjY2LDAgNy41MDEwNCwzLjMzMzE0IDcuNTAxMDQsNy40OTk4MSAwLDQuMTY2NjYgLTMuMzM0MzgsNy40OTk4IC03LjUwMTA0LDcuNDk5OCBIIDg0LjE2NjE0OCBaIG0gMCwzMy4zMzI4OCBoIDM3LjUwMDI2MiBjIDUsMCA4LjMzMzUzLDMuMzMzNTMgOC4zMzM1Myw4LjMzMzUzIDAsNSAtMy4zMzM1Myw4LjMzMzUzIC04LjMzMzUzLDguMzMzNTMgSCA4NC4xNjYxNDggWiIKICAgICAgICAgaWQ9InBhdGg4NTgtMCIgLz4KICAgICAgPHBhdGgKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgc3R5bGU9ImZpbGw6IzEwMzg0ZjtzdHJva2Utd2lkdGg6OC4zMzMzMzMwMiIKICAgICAgICAgZD0ibSAyMDcuNTAwNzksMjcxLjY2NjYxIC00My4zMzM4Niw4Ny41MDAxOSBoIDIyLjUwMDY1IGwgNi42NjYwOCwtMTQuOTk5NiBoIDQ5LjE2NzQ1IGwgNi42NjYwOCwxNC45OTk2IGggMjIuNDk5NDIgbCAtNDQuMTY2MzUsLTg3LjUwMDE5IHogbSA5Ljk5OTczLDIyLjUwMDY1IDE0Ljk5OTYxLDMxLjY2NjY2IGggLTI5Ljk5OTIxIHoiCiAgICAgICAgIGlkPSJwYXRoODUyLTgiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIHN0eWxlPSJmaWxsOiMxMDM4NGY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOjguMjU1MDkyNjIiCiAgICAgICAgIGQ9Im0gNDYyLjUwMDAxLDI3MS42NjY2NyB2IDE4LjgwODQ2IGggLTU4LjMzMzM1IHYgMTQuNzE5NjYgaCA1Ni42NjY2NyB2IDE4LjgwODQ1IGggLTU2LjY2NjY3IHYgMTYuMzU1MTcgaCA1OC4zMzMzNSB2IDE4LjgwODQ2IGggLTc5LjE2NjY4IHYgLTg3LjUwMDIgeiIKICAgICAgICAgaWQ9InBhdGg4MzAtNyIgLz4KICAgICAgPHBhdGgKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgc3R5bGU9ImZpbGw6IzEwMzg0ZjtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6OC4zMzMzMzMwMiIKICAgICAgICAgZD0ibSAyNzYuNjY2NDcsNDg2LjY2NzE5IHYgODcuNTAwMTkgaCAyMC44MzMyIFYgNTQwLjgzNDUgaCAxNS44MzMzNCBsIDI1LjAwMDU4LDMzLjMzMjg4IGggMjQuOTk5MzYgbCAtMjUuODMzMDgsLTM0LjE2NjYgYyAxMC44MzMzNCwtMy4zMzMzMyAxOS4xNjcsLTEzLjMzMzA4IDE5LjE2NywtMjUuODMzMDcgMCwtMTUgLTExLjY2NjgsLTI3LjUwMDUyIC0yNi42NjY4LC0yNy41MDA1MiB6IG0gMjEuNjY2OTMsMTguMzMzMjYgaCAzMC4wMDA0NiBjIDQuMTY2NjYsMCA4LjMzMzUzLDQuMTY2ODcgOC4zMzM1Myw4LjMzMzUzIDAsNC4xNjY2NyAtMy4zMzM1Myw4LjMzMzUzIC04LjMzMzUzLDguMzMzNTMgSCAyOTguMzMzNCBaIgogICAgICAgICBpZD0icGF0aDg0NC03IiAvPgogICAgICA8cGF0aAogICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgICBzdHlsZT0iZmlsbDojMTAzODRmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDo4LjI1NTA5MjYyIgogICAgICAgICBkPSJtIDM1Ni42NjY2OCwzNzguMTM4NTUgdiAxOC44MDg0NiBoIC01OC4zMzMzNSB2IDE0LjcxOTY2IEggMzU1IHYgMTguODA4NDUgaCAtNTYuNjY2NjcgdiAxNi4zNTUxNyBoIDU4LjMzMzM1IHYgMTguODA4NDYgSCAyNzcuNSB2IC04Ny41MDAyIHoiCiAgICAgICAgIGlkPSJwYXRoODMwLTctNiIgLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=",
              "mimeType": "image/svg+xml"
            },
            "style": {
              "height": "33px",
              "width": "33px"
            }
          },
          "style": {
            "opacity": 1
          },
          "type": "label"
        },
        "pageName": {
          "style": {
            "color": "#16364e",
            "fontSize": "16px",
            "fontWeight": "bold",
            "height": "48px",
            "opacity": 1
          },
          "title": "Smart Sentinel",
          "type": "label"
        },
        "restricted": {
          "style": {
            "color": "white",
            "fontSize": "12px",
            "fontWeight": "normal"
          },
          "title": "RESTRICTED",
          "type": "label"
        },
        "spacer": {
          "style": {
            "height": "48px",
            "opacity": 1
          },
          "type": "spacer"
        }
      }
    }
  },
  "info": {
    "title": "Smart Sentinel"
  },
  "widgets": [
    {
      "id": "bayer-btn-navigation",
      "type": "button",
      "captionBar": false,
      "label": "Navigation",
      "layout": {
        "x": 0,
        "y": 0,
        "w": 14,
        "h": 4,
        "static": true
      },
      "options": {
        "style": {
          "backgroundColor": "#10384f",
          "color": "#ffffff",
          "fontSize": "12px",
          "fontWeight": "600",
          "border": "1px solid #10384f",
          "borderRadius": "8px 0 0 0",
          "height": "100%"
        }
      },
      "actions": {
        "onClick": [
          {
            "type": "modify",
            "id": "bayer-overview-table",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-tree",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 4
              },
              {
                "name": "model.layout.w",
                "value": 28
              },
              {
                "name": "model.layout.h",
                "value": 34
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-props-panel",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 38
              },
              {
                "name": "model.layout.w",
                "value": 28
              },
              {
                "name": "model.layout.h",
                "value": 16
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-btn-navigation",
            "set": [
              {
                "name": "model.options.style",
                "value": {
                  "backgroundColor": "#10384f",
                  "color": "#ffffff",
                  "fontSize": "12px",
                  "fontWeight": "600",
                  "border": "1px solid #10384f",
                  "borderRadius": "8px 0 0 0",
                  "height": "100%"
                }
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-btn-overview",
            "set": [
              {
                "name": "model.options.style",
                "value": {
                  "backgroundColor": "#f1f5f9",
                  "color": "#64748b",
                  "fontSize": "12px",
                  "fontWeight": "600",
                  "border": "1px solid #ededed",
                  "borderRadius": "0 8px 0 0",
                  "height": "100%"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "bayer-btn-overview",
      "type": "button",
      "captionBar": false,
      "label": "Overview",
      "layout": {
        "x": 14,
        "y": 0,
        "w": 14,
        "h": 4,
        "static": true
      },
      "options": {
        "style": {
          "backgroundColor": "#f1f5f9",
          "color": "#64748b",
          "fontSize": "12px",
          "fontWeight": "600",
          "border": "1px solid #ededed",
          "borderRadius": "0 8px 0 0",
          "height": "100%"
        }
      },
      "actions": {
        "onClick": [
          {
            "type": "modify",
            "id": "bayer-tree",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-overview-table",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 4
              },
              {
                "name": "model.layout.w",
                "value": 28
              },
              {
                "name": "model.layout.h",
                "value": 50
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-props-panel",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-btn-navigation",
            "set": [
              {
                "name": "model.options.style",
                "value": {
                  "backgroundColor": "#f1f5f9",
                  "color": "#64748b",
                  "fontSize": "12px",
                  "fontWeight": "600",
                  "border": "1px solid #ededed",
                  "borderRadius": "8px 0 0 0",
                  "height": "100%"
                }
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-btn-overview",
            "set": [
              {
                "name": "model.options.style",
                "value": {
                  "backgroundColor": "#10384f",
                  "color": "#ffffff",
                  "fontSize": "12px",
                  "fontWeight": "600",
                  "border": "1px solid #10384f",
                  "borderRadius": "0 8px 0 0",
                  "height": "100%"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "bayer-selected-table",
      "type": "table",
      "name": "Selected Counters",
      "captionBar": false,
      "schema": [
        {
          "name": "ObjectName",
          "title": "Name"
        },
        {
          "name": "type",
          "title": "Type"
        },
        {
          "name": "Value",
          "title": "Value"
        },
        {
          "name": "Unit",
          "title": "Unit"
        },
        {
          "name": "penName",
          "title": "penName"
        },
        {
          "name": "path",
          "title": "path"
        }
      ],
      "data": [],
      "options": {
        "multi": false,
        "editable": false,
        "style": {
          "fontSize": "12px",
          "fontFamily": "Inter, 'Segoe UI', sans-serif",
          "backgroundColor": "#ffffff",
          "border": "1px solid #ededed",
          "borderRadius": "8px",
          "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
          "headerBackground": "#f8fafc",
          "headerColor": "#10384f",
          "headerFontWeight": "600"
        }
      },
      "layout": {
        "x": 0,
        "y": 0,
        "w": 0,
        "h": 0,
        "static": true
      }
    },
    {
      "id": "bayer-chart",
      "type": "chart",
      "name": "Chart",
      "captionBar": true,
      "label": "Chart",
      "toolbars": {
        "top": {
          "tools": {
            "view-counters": {
              "type": "button",
              "title": "",
              "icon": {
                "light": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNTEyIDI1NmMwIDE0MS40LTExNC42IDI1Ni0yNTYgMjU2UzAgMzk3LjQgMCAyNTZTMTE0LjYgMCAyNTYgMFM1MTIgMTE0LjYgNTEyIDI1NnpNMjg4IDk2YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNMjU2IDQxNmMzNS4zIDAgNjQtMjguNyA2NC02NGMwLTE3LjQtNi45LTMzLjEtMTguMS00NC42TDM2NiAxNjEuN2M1LjMtMTIuMS0uMi0yNi4zLTEyLjMtMzEuNnMtMjYuMyAuMi0zMS42IDEyLjNMMjU3LjkgMjg4Yy0uNiAwLTEuMyAwLTEuOSAwYy0zNS4zIDAtNjQgMjguNy02NCA2NHMyOC43IDY0IDY0IDY0ek0xNzYgMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNOTYgMjg4YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJ6bTM1Mi0zMmMwLTE3LjctMTQuMy0zMi0zMi0zMnMtMzIgMTQuMy0zMiAzMnMxNC4zIDMyIDMyIDMyczMyLTE0LjMgMzItMzJ6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                },
                "dark": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNTEyIDI1NmMwIDE0MS40LTExNC42IDI1Ni0yNTYgMjU2UzAgMzk3LjQgMCAyNTZTMTE0LjYgMCAyNTYgMFM1MTIgMTE0LjYgNTEyIDI1NnpNMjg4IDk2YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNMjU2IDQxNmMzNS4zIDAgNjQtMjguNyA2NC02NGMwLTE3LjQtNi45LTMzLjEtMTguMS00NC42TDM2NiAxNjEuN2M1LjMtMTIuMS0uMi0yNi4zLTEyLjMtMzEuNnMtMjYuMyAuMi0zMS42IDEyLjNMMjU3LjkgMjg4Yy0uNiAwLTEuMyAwLTEuOSAwYy0zNS4zIDAtNjQgMjguNy02NCA2NHMyOC43IDY0IDY0IDY0ek0xNzYgMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNOTYgMjg4YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJ6bTM1Mi0zMmMwLTE3LjctMTQuMy0zMi0zMi0zMnMtMzIgMTQuMy0zMiAzMnMxNC4zIDMyIDMyIDMyczMyLTE0LjMgMzItMzJ6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                }
              },
              "style": {
                "backgroundColor": "#f1f5f9",
                "border": "1px solid #ededed",
                "borderRadius": "4px",
                "padding": "6px 10px",
                "minWidth": "36px"
              },
              "actions": {
                "onClick": [
                  {
                    "type": "modify",
                    "id": "bayer-selected-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-chart",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-counters-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 30
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 66
                      },
                      {
                        "name": "model.layout.h",
                        "value": 54
                      }
                    ]
                  }
                ]
              }
            },
            "view-chart": {
              "type": "button",
              "title": "",
              "icon": {
                "light": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                },
                "dark": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                }
              },
              "style": {
                "backgroundColor": "#10384f",
                "border": "1px solid #10384f",
                "borderRadius": "4px",
                "padding": "6px 10px",
                "minWidth": "36px"
              },
              "actions": {
                "onClick": [
                  {
                    "type": "modify",
                    "id": "bayer-counters-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-selected-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-chart",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 30
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 66
                      },
                      {
                        "name": "model.layout.h",
                        "value": 54
                      }
                    ]
                  }
                ]
              }
            }
          },
          "leftOrTop": {
            "toolsOrder": [
              "view-counters",
              "view-chart"
            ]
          }
        }
      },
      "tagSearchTable": {
        "captionBar": {
          "showModelEditorButton": false
        },
        "schema": [
          {
            "name": "ObjectName",
            "sort": "asc",
            "title": "Object Name"
          },
          {
            "name": "ObjectDescription",
            "title": "Description"
          },
          {
            "name": "path",
            "title": "Path"
          }
        ]
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
            "grid": false,
            "id": 1,
            "intervals_no": 100,
            "locked": false,
            "name": "X",
            "position": {
              "alignment": "bottom",
              "end": 100,
              "orientation": "bottom",
              "start": 0,
              "value": 1
            },
            "start_time": "*-1d",
            "themes": {
              "dark": {
                "color": "white"
              },
              "light": {
                "color": "black"
              }
            }
          }
        ],
        "y_axis": [
          {
            "grid": true,
            "id": 1,
            "locked": false,
            "name": "Y",
            "position": {
              "alignment": "left",
              "end": 100,
              "orientation": "left",
              "start": 0,
              "value": 1
            },
            "range": {
              "max": {
                "mode": "auto",
                "value": 0
              },
              "min": {
                "mode": "auto",
                "value": 0
              }
            },
            "themes": {
              "dark": {
                "color": "white"
              },
              "light": {
                "color": "black"
              }
            }
          }
        ]
      },
      "options": {
        "refreshInterval": 0,
        "bottomPanel": true,
        "leftPanel": false,
        "play": "none",
        "rightPanel": true,
        "style": {
          "backgroundColor": "#ffffff",
          "border": "1px solid #ededed",
          "borderRadius": "8px",
          "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)"
        }
      },
      "layout": {
        "x": 0,
        "y": 0,
        "w": 0,
        "h": 0,
        "static": true
      }
    },
    {
      "id": "bayer-counters-table",
      "type": "table",
      "name": "Performance Counters",
      "captionBar": true,
      "label": "Performance Counters",
      "layout": {
        "x": 30,
        "y": 0,
        "w": 66,
        "h": 54,
        "static": true
      },
      "schema": [
        {
          "name": "ObjectName",
          "title": "Name"
        },
        {
          "name": "type",
          "title": "Type"
        },
        {
          "name": "Value",
          "title": "Value"
        },
        {
          "name": "Unit",
          "title": "Unit"
        },
        {
          "name": "penName",
          "title": "penName"
        },
        {
          "name": "path",
          "title": "path"
        }
      ],
      "options": {
        "pagination": true,
        "pageSize": 50,
        "showHoverHighLight": true,
        "alternateRowColoring": true,
        "style": {
          "fontSize": "12px",
          "fontFamily": "Inter, 'Segoe UI', sans-serif",
          "backgroundColor": "#ffffff",
          "border": "1px solid #ededed",
          "borderRadius": "8px",
          "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
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
        },
        "multi": true,
        "editable": false,
        "emptyMessage": "Select an object in Navigation or Overview."
      },
      "toolbars": {
        "top": {
          "tools": {
            "view-counters": {
              "type": "button",
              "title": "",
              "icon": {
                "light": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNTEyIDI1NmMwIDE0MS40LTExNC42IDI1Ni0yNTYgMjU2UzAgMzk3LjQgMCAyNTZTMTE0LjYgMCAyNTYgMFM1MTIgMTE0LjYgNTEyIDI1NnpNMjg4IDk2YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNMjU2IDQxNmMzNS4zIDAgNjQtMjguNyA2NC02NGMwLTE3LjQtNi45LTMzLjEtMTguMS00NC42TDM2NiAxNjEuN2M1LjMtMTIuMS0uMi0yNi4zLTEyLjMtMzEuNnMtMjYuMyAuMi0zMS42IDEyLjNMMjU3LjkgMjg4Yy0uNiAwLTEuMyAwLTEuOSAwYy0zNS4zIDAtNjQgMjguNy02NCA2NHMyOC43IDY0IDY0IDY0ek0xNzYgMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNOTYgMjg4YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJ6bTM1Mi0zMmMwLTE3LjctMTQuMy0zMi0zMi0zMnMtMzIgMTQuMy0zMiAzMnMxNC4zIDMyIDMyIDMyczMyLTE0LjMgMzItMzJ6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                },
                "dark": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNTEyIDI1NmMwIDE0MS40LTExNC42IDI1Ni0yNTYgMjU2UzAgMzk3LjQgMCAyNTZTMTE0LjYgMCAyNTYgMFM1MTIgMTE0LjYgNTEyIDI1NnpNMjg4IDk2YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNMjU2IDQxNmMzNS4zIDAgNjQtMjguNyA2NC02NGMwLTE3LjQtNi45LTMzLjEtMTguMS00NC42TDM2NiAxNjEuN2M1LjMtMTIuMS0uMi0yNi4zLTEyLjMtMzEuNnMtMjYuMyAuMi0zMS42IDEyLjNMMjU3LjkgMjg4Yy0uNiAwLTEuMyAwLTEuOSAwYy0zNS4zIDAtNjQgMjguNy02NCA2NHMyOC43IDY0IDY0IDY0ek0xNzYgMTQ0YzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMnpNOTYgMjg4YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyczE0LjMgMzIgMzIgMzJ6bTM1Mi0zMmMwLTE3LjctMTQuMy0zMi0zMi0zMnMtMzIgMTQuMy0zMiAzMnMxNC4zIDMyIDMyIDMyczMyLTE0LjMgMzItMzJ6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                }
              },
              "style": {
                "backgroundColor": "#10384f",
                "border": "1px solid #10384f",
                "borderRadius": "4px",
                "padding": "6px 10px",
                "minWidth": "36px"
              },
              "actions": {
                "onClick": [
                  {
                    "type": "modify",
                    "id": "bayer-selected-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-chart",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-counters-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 30
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 66
                      },
                      {
                        "name": "model.layout.h",
                        "value": 54
                      }
                    ]
                  }
                ]
              }
            },
            "view-chart": {
              "type": "button",
              "title": "",
              "icon": {
                "light": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                },
                "dark": {
                  "base64": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMi4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNjQgNjRjMC0xNy43LTE0LjMtMzItMzItMzJTMCA0Ni4zIDAgNjRWNDAwYzAgNDQuMiAzNS44IDgwIDgwIDgwSDQ4MGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkg4MGMtOC44IDAtMTYtNy4yLTE2LTE2VjY0em00MDYuNiA4Ni42YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDMyMCAyMTAuN2wtNTcuNC01Ny40Yy0xMi41LTEyLjUtMzIuOC0xMi41LTQ1LjMgMGwtMTEyIDExMmMtMTIuNSAxMi41LTEyLjUgMzIuOCAwIDQ1LjNzMzIuOCAxMi41IDQ1LjMgMEwyNDAgMjIxLjNsNTcuNCA1Ny40YzEyLjUgMTIuNSAzMi44IDEyLjUgNDUuMyAwbDEyOC0xMjh6Ii8+PC9zdmc+",
                  "mimeType": "image/svg+xml"
                }
              },
              "style": {
                "backgroundColor": "#f1f5f9",
                "border": "1px solid #ededed",
                "borderRadius": "4px",
                "padding": "6px 10px",
                "minWidth": "36px"
              },
              "actions": {
                "onClick": [
                  {
                    "type": "modify",
                    "id": "bayer-counters-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-selected-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-chart",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 30
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 66
                      },
                      {
                        "name": "model.layout.h",
                        "value": 54
                      }
                    ]
                  }
                ]
              }
            }
          },
          "leftOrTop": {
            "toolsOrder": [
              "view-counters",
              "view-chart"
            ]
          }
        },
        "bottom": {
          "tools": {
            "submit-chart": {
              "type": "button",
              "title": "Submit",
              "style": {
                "backgroundColor": "#10384f",
                "color": "#ffffff",
                "fontSize": "12px",
                "fontWeight": "600",
                "border": "1px solid #10384f",
                "borderRadius": "4px"
              },
              "actions": {
                "onClick": [
                  {
                    "type": "collect",
                    "from": "self",
                    "message": {
                      "topic": "selectedRows"
                    }
                  },
                  {
                    "type": "modify",
                    "id": "bayer-selected-table",
                    "set": [
                      {
                        "name": "model.data",
                        "value": "$payload"
                      }
                    ]
                  },
                  {
                    "type": "transform",
                    "completeMsgObject": false,
                    "aggregate": [
                      {
                        "$project": {
                          "name": "$penName",
                          "path": "$path",
                          "trend_type": "HT_AREA"
                        }
                      }
                    ]
                  },
                  {
                    "type": "transform",
                    "completeMsgObject": true,
                    "aggregateOne": [
                      {
                        "$project": {
                          "pens": "$payload"
                        }
                      }
                    ]
                  },
                  {
                    "type": "send",
                    "to": "bayer-chart",
                    "message": {
                      "topic": "addPens"
                    }
                  },
                  {
                    "type": "modify",
                    "id": "bayer-counters-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-selected-table",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 0
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 0
                      },
                      {
                        "name": "model.layout.h",
                        "value": 0
                      }
                    ]
                  },
                  {
                    "type": "modify",
                    "id": "bayer-chart",
                    "set": [
                      {
                        "name": "model.layout.x",
                        "value": 30
                      },
                      {
                        "name": "model.layout.y",
                        "value": 0
                      },
                      {
                        "name": "model.layout.w",
                        "value": 66
                      },
                      {
                        "name": "model.layout.h",
                        "value": 54
                      }
                    ]
                  }
                ]
              }
            }
          },
          "rightOrBottom": {
            "toolsOrder": [
              "submit-chart"
            ]
          }
        }
      }
    },
    {
      "id": "bayer-props-panel",
      "type": "tabs",
      "name": "Object Properties",
      "captionBar": false,
      "tabs": [
        {
          "id": "tab-object-props",
          "name": "Object Properties",
          "indicator": {
            "title": ""
          },
          "compilation": {
            "version": "1",
            "options": {
              "stacking": "none",
              "numberOfColumns": 28,
              "numberOfRows": {
                "type": "count",
                "value": 16
              },
              "padding": {
                "x": 0,
                "y": 0
              },
              "spacing": {
                "x": 0,
                "y": 0
              },
              "margin": {
                "x": 0,
                "y": 0
              },
              "background": {
                "style": {
                  "backgroundColor": "#2d3748"
                }
              }
            },
            "actions": {
              "modifyPropertyPanelDefault": [
                {
                  "type": "modify",
                  "id": "objprop-image",
                  "set": [
                    {
                      "name": "model.url",
                      "value": "$payload.Image"
                    }
                  ]
                },
                {
                  "type": "modify",
                  "id": "objprop-name-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.ObjectName"
                    }
                  ]
                }
              ],
              "modifyPropertyPanelDetails": [
                {
                  "type": "modify",
                  "id": "objprop-type-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.Type"
                    }
                  ]
                },
                {
                  "type": "modify",
                  "id": "objprop-objectid-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.ObjectIDExtended"
                    }
                  ]
                },
                {
                  "type": "modify",
                  "id": "objprop-path-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.Path"
                    }
                  ]
                },
                {
                  "type": "modify",
                  "id": "objprop-configversion-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.ConfigVersion"
                    }
                  ]
                },
                {
                  "type": "modify",
                  "id": "objprop-classversion-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.ClassVersion"
                    }
                  ]
                },
                {
                  "type": "send",
                  "to": "objprop-created-value-date"
                },
                {
                  "type": "modify",
                  "id": "objprop-created-value-user",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.Created.user"
                    }
                  ]
                },
                {
                  "type": "send",
                  "to": "objprop-modified-value-date"
                },
                {
                  "type": "modify",
                  "id": "objprop-modified-value-user",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.Modified.user"
                    }
                  ]
                },
                {
                  "type": "modify",
                  "id": "objprop-state-value",
                  "set": [
                    {
                      "name": "model.text",
                      "value": "$payload.State"
                    }
                  ]
                }
              ]
            },
            "widgets": [
              {
                "id": "bayer-props-background",
                "type": "text",
                "captionBar": false,
                "text": "",
                "layout": {
                  "x": 0,
                  "y": 0,
                  "w": 28,
                  "h": 16,
                  "static": true
                },
                "options": {
                  "style": {
                    "backgroundColor": "#2d3748",
                    "border": "none",
                    "borderTop": "1px solid #1a202c",
                    "borderRadius": "0 0 8px 8px"
                  }
                }
              },
              {
                "id": "worker-property-panel",
                "type": "text",
                "name": "Worker - Property Panel",
                "captionBar": false,
                "actions": {
                  "didUpdate": [
                    {
                      "type": "switch",
                      "checkAll": false,
                      "case": [
                        {
                          "match": {
                            "access": true
                          },
                          "action": [
                            {
                              "type": "action",
                              "name": "modifyPropertyPanelDefault"
                            },
                            {
                              "type": "action",
                              "name": "modifyPropertyPanelDetails"
                            }
                          ]
                        },
                        {
                          "match": {
                            "access": false
                          },
                          "action": [
                            {
                              "type": "notify",
                              "title": "Access denied",
                              "text": "Could not retrieve Object properties.",
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
                      ]
                    }
                  ]
                },
                "layout": {
                  "x": 0,
                  "y": 0,
                  "w": 0,
                  "h": 0,
                  "static": true
                }
              },
              {
                "id": "objprop-image",
                "type": "image",
                "name": "Object Properties - Image",
                "captionBar": false,
                "mimeType": "image/svg+xml",
                "options": {
                  "size": "32px 32px",
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "backgroundColor": "transparent"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 0,
                  "w": 5,
                  "h": 4,
                  "static": true
                }
              },
              {
                "id": "objprop-name-key",
                "type": "text",
                "name": "Object Property - Name key",
                "text": "Name",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 5,
                  "y": 0,
                  "w": 5,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-name-value",
                "type": "text",
                "name": "Object Property - Name value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 10,
                  "y": 0,
                  "w": 18,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-type-key",
                "type": "text",
                "name": "Object Property - Type key",
                "text": "Type",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 5,
                  "y": 2,
                  "w": 5,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-type-value",
                "type": "text",
                "name": "Object Property - Type value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 10,
                  "y": 2,
                  "w": 18,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-objectid-key",
                "type": "text",
                "name": "Object Property - Object ID key",
                "text": "Object ID",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 4,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-objectid-value",
                "type": "text",
                "name": "Object Property - Object ID value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 7,
                  "y": 4,
                  "w": 21,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-path-key",
                "type": "text",
                "name": "Object Property - Path key",
                "text": "Path",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 6,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-path-value",
                "type": "text",
                "name": "Object Property - Path value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 7,
                  "y": 6,
                  "w": 21,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-configversion-key",
                "type": "text",
                "name": "Object Property - Config Version key",
                "text": "Config Version",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 8,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-configversion-value",
                "type": "text",
                "name": "Object Property - Config Version value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 7,
                  "y": 8,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-classversion-key",
                "type": "text",
                "name": "Object Property - Class Version key",
                "text": "Class Version",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 14,
                  "y": 8,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-classversion-value",
                "type": "text",
                "name": "Object Property - Class Version value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 21,
                  "y": 8,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-created-key",
                "type": "text",
                "name": "Object Property - Created key",
                "text": "Created",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 10,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-created-value-date",
                "type": "text",
                "name": "Object Property - Created value date",
                "text": "N/A",
                "captionBar": false,
                "actions": {
                  "willRefresh": [
                    {
                      "type": "transform",
                      "completeMsgObject": true,
                      "aggregateOne": [
                        {
                          "$project": {
                            "payload": "$payload.Created.date"
                          }
                        }
                      ]
                    },
                    {
                      "type": "gettime"
                    },
                    {
                      "type": "gettime",
                      "format": "YYYY-MM-DD HH:mm:ss"
                    }
                  ]
                },
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 7,
                  "y": 10,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-created-value-user",
                "type": "text",
                "name": "Object Property - Created value user",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 14,
                  "y": 10,
                  "w": 14,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-modified-key",
                "type": "text",
                "name": "Object Property - Modified key",
                "text": "Modified",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 12,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-modified-value-date",
                "type": "text",
                "name": "Object Property - Modified value date1",
                "text": "N/A",
                "captionBar": false,
                "actions": {
                  "willRefresh": [
                    {
                      "type": "transform",
                      "completeMsgObject": true,
                      "aggregateOne": [
                        {
                          "$project": {
                            "payload": "$payload.Modified.date"
                          }
                        }
                      ]
                    },
                    {
                      "type": "gettime"
                    },
                    {
                      "type": "gettime",
                      "format": "YYYY-MM-DD HH:mm:ss"
                    }
                  ]
                },
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 7,
                  "y": 12,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-modified-value-user",
                "type": "text",
                "name": "Object Property - Modified value user",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 14,
                  "y": 12,
                  "w": 14,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-state-key",
                "type": "text",
                "name": "Object Property - State key",
                "text": "State",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "fontSize": "12px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "600",
                    "fontFamily": "Inter, 'Segoe UI', sans-serif",
                    "color": "#cbd5e1",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 0,
                  "y": 14,
                  "w": 7,
                  "h": 2,
                  "static": true
                }
              },
              {
                "id": "objprop-state-value",
                "type": "text",
                "name": "Object Property - State value",
                "text": "N/A",
                "captionBar": false,
                "options": {
                  "style": {
                    "outline": "none",
                    "boxShadow": "none",
                    "margin": "0",
                    "border": "none",
                    "color": "#ffffff",
                    "fontSize": "11px",
                    "lineHeight": "1.35",
                    "textAlign": "left",
                    "fontWeight": "500",
                    "fontFamily": "Consolas, monospace",
                    "backgroundColor": "transparent",
                    "padding": "1px 4px"
                  }
                },
                "layout": {
                  "x": 7,
                  "y": 14,
                  "w": 21,
                  "h": 2,
                  "static": true
                }
              }
            ]
          }
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
            "overflow": "hidden"
          }
        }
      },
      "layout": {
        "x": 0,
        "y": 38,
        "w": 28,
        "h": 16,
        "static": true
      }
    },
    {
      "id": "bayer-overview-table",
      "type": "table",
      "name": "Overview",
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
            "type": "transform",
            "aggregateOne": [
              {
                "$project": {
                  "ObjectName": "$ObjectName",
                  "ObjectID": "$ObjectID",
                  "Path": "$Path",
                  "Image": "$Image"
                }
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-counters-table",
            "set": [
              {
                "name": "model.dataSource",
                "value": {
                  "type": "function",
                  "lib": "syslib.app-webstudio-healthmonitor",
                  "func": "fetchPerformanceCountersTable",
                  "farg": {
                    "ObjectID": "$payload.ObjectID"
                  },
                  "catch": {
                    "type": "break",
                    "action": [
                      {
                        "type": "notify",
                        "title": "Error",
                        "text": "Could not load performance counters for selected object.",
                        "duration": 8000
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-selected-table",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-chart",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-counters-table",
            "set": [
              {
                "name": "model.layout.x",
                "value": 30
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 66
              },
              {
                "name": "model.layout.h",
                "value": 54
              }
            ]
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
                "backgroundColor": "#f20d0d",
                "color": "#ffffff"
              },
              "dark": {
                "backgroundColor": "#cc0000",
                "color": "#ffffff"
              }
            }
          },
          {
            "name": "WorstState",
            "value": "Disabled",
            "style": {
              "backgroundColor": "#e2e8f0",
              "color": "#64748b"
            }
          },
          {
            "name": "ObjectState",
            "value": "Good",
            "style": {
              "backgroundColor": "#d4f1d4",
              "color": "#10384f"
            }
          },
          {
            "name": "ObjectState",
            "value": "Bad",
            "style": {
              "backgroundColor": "#f1d4d4",
              "color": "#10384f"
            }
          },
          {
            "name": "ObjectState",
            "value": "Empty",
            "style": {
              "backgroundColor": "#f0edf0",
              "color": "#10384f"
            }
          },
          {
            "name": "ObjectState",
            "value": "Disabled",
            "style": {
              "backgroundColor": "#e2e8f0",
              "color": "#64748b"
            }
          },
          {
            "name": "ObjectState",
            "value": "Neutral",
            "style": {
              "fontStyle": "italic",
              "backgroundColor": "#ffffff",
              "color": "#10384f"
            }
          },
          {
            "name": "CommState",
            "value": "Good",
            "style": {
              "backgroundColor": "#d4f1d4",
              "color": "#10384f"
            }
          },
          {
            "name": "CommState",
            "value": "Bad",
            "style": {
              "backgroundColor": "#f1d4d4",
              "color": "#10384f"
            }
          },
          {
            "name": "CommState",
            "value": "Empty",
            "style": {
              "backgroundColor": "#f0edf0",
              "color": "#10384f"
            }
          },
          {
            "name": "CommState",
            "value": "Disabled",
            "style": {
              "backgroundColor": "#e2e8f0",
              "color": "#64748b"
            }
          },
          {
            "name": "CommState",
            "value": "Neutral",
            "style": {
              "fontStyle": "italic",
              "backgroundColor": "#ffffff",
              "color": "#10384f"
            }
          }
        ],
        "allowSorting": true,
        "alternateColumnColoring": false,
        "alternateRowColoring": true,
        "multi": false,
        "pagination": false,
        "showHoverHighLight": true,
        "style": {
          "fontSize": "12px",
          "fontFamily": "Inter, 'Segoe UI', sans-serif",
          "backgroundColor": "#ffffff",
          "border": "1px solid #ededed",
          "borderRadius": "0",
          "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
          "headerBackground": "#f8fafc",
          "headerColor": "#10384f",
          "headerFontWeight": "600",
          "borderTop": "none",
          "borderBottom": "1px solid #ededed"
        },
        "selectedRowStyle": {
          "outline": "2px solid #89d329"
        }
      },
      "layout": {
        "x": 0,
        "y": 0,
        "w": 0,
        "h": 0,
        "static": true
      }
    },
    {
      "id": "bayer-tree",
      "type": "tree",
      "name": "Navigation",
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
            "id": "bayer-counters-table"
          },
          {
            "type": "delegate",
            "action": [
              {
                "type": "refresh",
                "id": {
                  "route": [
                    "bayer-props-panel",
                    "tab-object-props",
                    "worker-property-panel"
                  ]
                }
              }
            ]
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
            "type": "delegate",
            "action": [
              {
                "type": "modify",
                "id": {
                  "route": [
                    "bayer-props-panel",
                    "tab-object-props",
                    "worker-property-panel"
                  ]
                },
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
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-counters-table",
            "set": [
              {
                "name": "model.dataSource",
                "value": {
                  "type": "function",
                  "lib": "syslib.app-webstudio-healthmonitor",
                  "func": "fetchPerformanceCountersTable",
                  "farg": {
                    "ObjectID": "$payload.ObjectID"
                  },
                  "catch": {
                    "type": "break",
                    "action": [
                      {
                        "type": "notify",
                        "title": "Error",
                        "text": "Could not load performance counters for selected object.",
                        "duration": 8000
                      }
                    ]
                  }
                }
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-selected-table",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-chart",
            "set": [
              {
                "name": "model.layout.x",
                "value": 0
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 0
              },
              {
                "name": "model.layout.h",
                "value": 0
              }
            ]
          },
          {
            "type": "modify",
            "id": "bayer-counters-table",
            "set": [
              {
                "name": "model.layout.x",
                "value": 30
              },
              {
                "name": "model.layout.y",
                "value": 0
              },
              {
                "name": "model.layout.w",
                "value": 66
              },
              {
                "name": "model.layout.h",
                "value": 54
              }
            ]
          }
        ]
      },
      "options": {
        "showToolbar": false,
        "showRefreshButton": true,
        "style": {
          "backgroundColor": "#f8fafc",
          "border": "1px solid #ededed",
          "borderRight": "1px solid #ededed",
          "borderRadius": "0",
          "fontSize": "12px",
          "fontFamily": "Inter, 'Segoe UI', sans-serif",
          "color": "#10384f",
          "boxShadow": "0 1px 3px rgba(16, 56, 79, 0.08)",
          "borderTop": "none",
          "borderBottom": "1px solid #ededed"
        },
        "selection": {
          "indicatorColor": "#89d329",
          "indicatorWidth": "3px"
        }
      },
      "layout": {
        "x": 0,
        "y": 4,
        "w": 28,
        "h": 34,
        "static": true
      }
    }
  ]
}
]=],
		},
	}
})
