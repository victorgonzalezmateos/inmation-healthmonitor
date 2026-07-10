#!/usr/bin/env python3
"""Build bayer-health-monitor-dashboard_compilation.lua from bayer-health-monitor-full.json."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JSON_PATH = ROOT / "bayer-health-monitor-full.json"
LUA_PATH = ROOT / "bayer-health-monitor-dashboard_compilation.lua"
HM_LIB = "syslib.app-webstudio-healthmonitor"


def fix_node(node: object) -> None:
    if isinstance(node, dict):
        if node.get("lib") == "HealthMonitor":
            node["lib"] = HM_LIB
        if node.get("ctx") == "bayerhm":
            del node["ctx"]
        for value in node.values():
            fix_node(value)
    elif isinstance(node, list):
        for item in node:
            fix_node(item)


def main() -> None:
    compilation = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    fix_node(compilation)

    deployment = compilation.get("deployment")
    if isinstance(deployment, dict):
        deployment["lib"] = HM_LIB
        deployment["func"] = "dashboard_compilation"
        deployment.pop("ctx", None)

    json_text = json.dumps(compilation, ensure_ascii=False, indent=2)

    open_delim = "[["
    close_delim = "]]"
    for level in range(1, 8):
        candidate_open = "[" + "=" * level + "["
        candidate_close = "]" + "=" * level + "]"
        if candidate_open not in json_text and candidate_close not in json_text:
            open_delim = candidate_open
            close_delim = candidate_close
            break

    lua = f"""-- Bayer Health Monitor - Webstudio entry script
-- Paste this entire file into the Script Library body:
--   /System/Core/_Global Core Logic/Development/Smart Sentinel AI/Bayer Health Monitor
--
-- Launch URL (set lib= to your LuaModuleName if different):
--   https://byus00876m1.bayer.cnb:8002/apps/webstudio/?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&lib=Bayer%20Health%20Monitor&func=dashboard_compilation
--
-- Widget data sources call: {HM_LIB} (default HM library)

local json = require("cjson")

local COMPILATION_JSON = {open_delim}
{json_text}
{close_delim}

function dashboard_compilation(arg, req, hlp)
  return json.decode(COMPILATION_JSON)
end
"""

    LUA_PATH.write_text(lua, encoding="utf-8")
    print(f"Wrote {LUA_PATH} ({LUA_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
