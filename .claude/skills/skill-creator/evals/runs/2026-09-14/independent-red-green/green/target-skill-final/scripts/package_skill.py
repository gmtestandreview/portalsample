#!/usr/bin/env python3
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
skill_md = root / "SKILL.md"
text = skill_md.read_text(encoding="utf-8")
missing = []
for ref in re.findall(r"`(references/[^`]+)`", text):
    if not (root / ref).exists():
        missing.append(ref)
if missing:
    print("Missing references: " + ", ".join(missing))
    sys.exit(1)
print("Package check passed")
