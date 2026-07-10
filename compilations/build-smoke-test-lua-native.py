#!/usr/bin/env python3
"""Emit smoke-test Lua that returns a native Lua table (no cjson)."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JSON_PATH = ROOT / "smoke-test-minimal.json"
OUT_LUA = ROOT / "smoke-test-dashboard_compilation.lua"


def lua_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def to_lua(value, indent: int = 0) -> str:
    pad = "  " * indent
    if value is None:
        return "nil"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return lua_str(value)
    if isinstance(value, list):
        if not value:
            return "{}"
        lines = ["{"]
        for item in value:
            lines.append(f"{pad}  {to_lua(item, indent + 1)},")
        lines.append(f"{pad}}}")
        return "\n".join(lines)
    if isinstance(value, dict):
        if not value:
            return "{}"
        lines = ["{"]
        for key, item in value.items():
            lines.append(f"{pad}  {key} = {to_lua(item, indent + 1)},")
        lines.append(f"{pad}}}")
        return "\n".join(lines)
    raise TypeError(type(value))


def main() -> None:
    compilation = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    body = to_lua(compilation, indent=1)
    lua = f"""-- Bayer Health Monitor - Phase 1 smoke test (native Lua table, no cjson)
-- Paste into Script Library:
--   /System/Core/_Global Core Logic/Development/Smart Sentinel AI/Bayer Health Monitor
--
-- IMPORTANT: lib= in the URL must match ScriptLibrary.LuaModuleName on this object.
--
-- Launch:
--   https://byus00876m1.bayer.cnb:8002/apps/webstudio/?hostname=byus00876m1.bayer.cnb&port=8002&secp=iwa&ssl=true&lib=Bayer%20Health%20Monitor&func=dashboard_compilation

function dashboard_compilation(arg, req, hlp)
  return {body}
end
"""
    OUT_LUA.write_text(lua, encoding="utf-8")
    print(f"Wrote {OUT_LUA} ({OUT_LUA.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
