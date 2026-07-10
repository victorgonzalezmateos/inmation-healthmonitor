#!/usr/bin/env python3
"""Fix bayer-health-monitor-full.json data sources for live host → custom-props paste file."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "bayer-health-monitor-full.json"
OUT = ROOT / "bayer-health-monitor-custom-props.json"
HM_LIB = "syslib.app-webstudio-healthmonitor"
PROCESS_STATE_PATH = (
    "/System/Core/_Global Core Logic/System Monitoring/Health Monitor.HMDiagnostics.ProcessState"
)


def fix_node(node: object) -> None:
    if isinstance(node, dict):
        if node.get("lib") == "HealthMonitor":
            node["lib"] = HM_LIB
        if node.get("ctx") == "bayerhm":
            del node["ctx"]
        if node.get("id") == "hm-process-state" and node.get("type") == "text":
            node["text"] = ""
            node["dataSource"] = {"type": "subscribe", "path": PROCESS_STATE_PATH}
        for value in node.values():
            fix_node(value)
    elif isinstance(node, list):
        for item in node:
            fix_node(item)


def main() -> None:
    compilation = json.loads(SRC.read_text(encoding="utf-8"))
    compilation.pop("deployment", None)
    compilation["description"] = (
        "Bayer Health Monitor — paste into CustomPropertyValue on Smart Sentinel AI folder"
    )
    fix_node(compilation)
    OUT.write_text(json.dumps(compilation, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
