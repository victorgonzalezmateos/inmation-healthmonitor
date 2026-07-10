#!/usr/bin/env python3
"""Generate inmation console upsert for Smart Sentinel AI folder.

Usage:
  python build-smart-sentinel-upsert.py verify-paste.json
  python build-smart-sentinel-upsert.py smoke-test-minimal.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BASE = "/System/Core/_Global Core Logic/Development"
FOLDER_PATH = f"{BASE}/Smart Sentinel AI"
PROPERTY_NAME = "Bayer Health Monitor"

# Minimal Lua — dashboard loads via Custom Properties URL, not lib/func.
LUA_SCRIPT = """function dashboard_compilation(arg, req, hlp)
  -- Dashboard JSON is in CustomOptions.CustomProperties (name=%s).
  -- Launch: obj=Smart Sentinel AI&name=Bayer%%20Health%%20Monitor
  return nil
end
""" % (
    PROPERTY_NAME,
)


def lua_long_string(s: str) -> str:
    """Wrap content in [=[ ... ]=] for Lua upsert (no ]=] inside)."""
    if "]=]" in s:
        raise ValueError("Content contains ]=]; cannot use long-string delimiter")
    return f"[=[\n{s}\n]=]"


def build(compilation_path: Path) -> str:
    compilation_json = compilation_path.read_text(encoding="utf-8")
    json.loads(compilation_json)  # validate

    lines = [
        f'local base = "{BASE}"',
        "",
        "syslib.mass({",
        "\t{",
        "\t\tclass = syslib.model.classes.GenFolder,",
        "\t\toperation = syslib.model.codes.MassOp.UPSERT,",
        f'\t\tpath = base .. "/Smart Sentinel AI",',
        '\t\t["ObjectName"] = "Smart Sentinel AI",',
        '\t\t["ScriptLibrary.LuaModuleMandatoryExecution"] = {',
        "\t\t\tfalse,",
        "\t\t},",
        f'\t\t["ScriptLibrary.AdvancedLuaScript"] = {{\n\t\t\t{lua_long_string(LUA_SCRIPT)},\n\t\t}},',
        '\t\t["ScriptLibrary.LuaModuleName"] = {',
        '\t\t\t"bayer.healthmonitor",',
        "\t\t},",
        f'\t\t["CustomOptions.CustomProperties.CustomPropertyName"] = {{\n\t\t\t"{PROPERTY_NAME}",\n\t\t}},',
        f'\t\t["CustomOptions.CustomProperties.CustomPropertyValue"] = {{\n\t\t\t{lua_long_string(compilation_json)},\n\t\t}},',
        "\t}",
        "})",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    root = Path(__file__).resolve().parent
    name = sys.argv[1] if len(sys.argv) > 1 else "smoke-test-minimal.json"
    src = root / name
    if not src.is_file():
        print(f"File not found: {src}", file=sys.stderr)
        sys.exit(1)
    out_name = sys.argv[2] if len(sys.argv) > 2 else "smart-sentinel-ai-upsert.lua"
    out = root / out_name
    out.write_text(build(src), encoding="utf-8")
    print(f"Wrote {out} from {src.name}")
    print(f"CustomPropertyName: {PROPERTY_NAME}")
    print(f"Folder path: {FOLDER_PATH}")


if __name__ == "__main__":
    main()
