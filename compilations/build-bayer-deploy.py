#!/usr/bin/env python3
"""Deploy the Bayer dashboard (HM layout + working data wiring).

Runs build-bayer-full-tabs.py: left Navigation|Overview tabs, right counters
at root level (direct modify — data loads on click).

Usage:
  python build-bayer-deploy.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> None:
    subprocess.run([sys.executable, str(ROOT / "build-bayer-full-tabs.py")], check=True)


if __name__ == "__main__":
    main()
