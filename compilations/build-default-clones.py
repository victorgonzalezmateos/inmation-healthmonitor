#!/usr/bin/env python3
"""Build clone compilations from captured default HM for Custom Properties testing."""

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT = ROOT / "docs" / "discovery" / "default-hm-compilation.json"
OUT_DIR = ROOT / "compilations"


def walk_find(node, target_id: str, key: str = "id"):
    if isinstance(node, dict):
        if node.get(key) == target_id:
            return node
        for value in node.values():
            found = walk_find(value, target_id, key)
            if found is not None:
                return found
    elif isinstance(node, list):
        for item in node:
            found = walk_find(item, target_id, key)
            if found is not None:
                return found
    return None


def main() -> None:
    default = json.loads(DEFAULT.read_text(encoding="utf-8"))

    # 1) Full default HM — exact clone for Custom Properties
    full = deepcopy(default)
    full["name"] = "Default HM Clone (Custom Properties)"
    full["description"] = "Exact captured default HM — paste to verify data loads via obj+name"
    full_out = OUT_DIR / "default-hm-via-custom-props.json"
    full_out.write_text(json.dumps(full, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {full_out} ({full_out.stat().st_size} bytes)")

    # 2) Tree tab only — exact widgets from default tab-tree compilation
    tab_tree = walk_find(default, "tab-tree")
    if tab_tree and "compilation" in tab_tree:
        comp = deepcopy(tab_tree["compilation"])
        tree_only = {
            "version": "1",
            "name": "Default HM Tree Tab Clone",
            "description": "Exact tab-tree compilation from default HM",
            "options": comp.get("options", {}),
            "actions": comp.get("actions", {}),
            "widgets": comp.get("widgets", []),
        }
        tree_out = OUT_DIR / "default-hm-tree-tab-clone.json"
        tree_out.write_text(json.dumps(tree_only, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote {tree_out} ({tree_out.stat().st_size} bytes)")

    # 3) Single tree widget only — minimal exact clone
    tree_widget = walk_find(default, "tree-navigation")
    if tree_widget:
        minimal = {
            "version": "1",
            "name": "Default HM Tree Widget Only",
            "options": {
                "stacking": "none",
                "numberOfColumns": 24,
                "numberOfRows": {"type": "count", "value": 32},
                "padding": {"x": 0, "y": 0},
                "spacing": {"x": 0, "y": 0},
            },
            "widgets": [deepcopy(tree_widget)],
        }
        min_out = OUT_DIR / "default-hm-tree-only-clone.json"
        min_out.write_text(json.dumps(minimal, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote {min_out} ({min_out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
