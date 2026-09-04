#!/usr/bin/env python3
"""
Behaviour matrix for the A Team PreToolUse guard (scripts/pre_tool_use.py).

The guard is a security control, so it is tested from the outside exactly as
Claude Code invokes it: a JSON tool call on stdin, and an exit code out.
  exit 2 = blocked, exit 0 = allowed.

Two halves, and both matter:

  BEHAVIOURS      - what must be blocked, and what must be allowed.
  FALSE POSITIVES - real commands from day-to-day work that must still pass.
                    A guard that blocks ordinary work gets switched off, which
                    is its own failure mode.

Not covered here: the shell wrapper in .claude/settings.json that invokes this
script. That file is gitignored and absent in CI, so the wrapper is verified
locally instead. The wrapper's job is to run this script exactly once and pass
its exit code through unchanged.

Run:  python tests/hooks/test_pre_tool_use.py
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUARD = ROOT / "scripts" / "pre_tool_use.py"

BLOCK = 2
ALLOW = 0

# Assembled so this file's own text carries no contiguous destructive literal —
# the guard inspects command strings, and a literal here would trip it when a
# tool call happens to quote this file.
_RECURSE_FORCE = "-Recurse " + "-Force"
_RM_RF = "rm -r" + "f"

# (label, expected exit, tool_name, tool_input)
BEHAVIOURS = [
    # --- Bash destructive --------------------------------------------------
    ("bash: recursive force delete of root", BLOCK, "Bash", {"command": f"{_RM_RF} /"}),
    ("bash: recursive force delete of home", BLOCK, "Bash", {"command": "rm -fr ~"}),

    # --- PowerShell destructive: the primary shell on Windows hosts --------
    ("pwsh: Remove-Item recursive force", BLOCK, "PowerShell",
     {"command": f"Remove-Item {_RECURSE_FORCE} ."}),
    ("pwsh: switches in reverse order", BLOCK, "PowerShell",
     {"command": "Remove-Item -Force -Recurse C:\\"}),
    ("pwsh: abbreviated switches -r -fo", BLOCK, "PowerShell", {"command": "ri -r -fo ./build"}),
    ("pwsh: rm alias with PowerShell switches", BLOCK, "PowerShell",
     {"command": "rm -Recurse -Force ~"}),
    ("pwsh: -Confirm:$false does not evade", BLOCK, "PowerShell",
     {"command": f"Remove-Item {_RECURSE_FORCE} -Confirm:$false ."}),
    ("pwsh: Format-Volume", BLOCK, "PowerShell", {"command": "Format-Volume -DriveLetter C"}),

    # --- .env via path-bearing tools ---------------------------------------
    ("read: .env", BLOCK, "Read", {"file_path": "/proj/.env"}),
    ("read: .env.sample is a template", ALLOW, "Read", {"file_path": "/proj/.env.sample"}),

    # --- .env via search tools ---------------------------------------------
    ("grep: path targets .env", BLOCK, "Grep", {"pattern": ".", "path": ".env"}),
    ("grep: glob targets .env", BLOCK, "Grep", {"pattern": ".", "path": ".", "glob": ".env*"}),
    ("glob: pattern targets .env", BLOCK, "Glob", {"pattern": "**/.env"}),
    ("grep: searching FOR the text '.env' is legitimate", ALLOW, "Grep",
     {"pattern": "\\.env", "path": "src"}),

    # --- .env via shell commands -------------------------------------------
    ("bash: cat .env", BLOCK, "Bash", {"command": "cat .env"}),
    ("pwsh: Get-Content .env", BLOCK, "PowerShell", {"command": "Get-Content .env"}),
    ("pwsh: gc alias on .env", BLOCK, "PowerShell", {"command": "gc .env"}),
    ("pwsh: Copy-Item .env exfiltration", BLOCK, "PowerShell",
     {"command": "Copy-Item .env $env:TEMP\\leak.txt"}),
    ("pwsh: Get-Content .env.example is a template", ALLOW, "PowerShell",
     {"command": "Get-Content .env.example"}),
]

# Every one of these must be ALLOWED.
FALSE_POSITIVES = [
    ("Bash", {"command": "npm run test:ci:unit"}),
    ("Bash", {"command": "npm run type-check"}),
    ("Bash", {"command": "git diff origin/main...HEAD --name-only"}),
    ("Bash", {"command": "git rm -r --cached ."}),
    ("Bash", {"command": "rm -f temp.txt"}),
    ("Bash", {"command": "grep -rn 'pattern' ClientApp/src"}),
    ("Bash", {"command": "sed -i 's/foo/bar/' file.txt"}),
    ("Bash", {"command": "npx tsc --noEmit"}),
    ("PowerShell", {"command": "Get-Process node | Select-Object Id, CPU"}),
    ("PowerShell", {"command": "Get-ChildItem -Recurse -Filter *.ts"}),
    ("PowerShell", {"command": "Copy-Item report.html backup.html"}),
    ("PowerShell", {"command": "Remove-Item build.txt"}),
    ("PowerShell", {"command": "New-Item -ItemType Directory -Force reports"}),
    ("Grep", {"pattern": "acquireTokenSilent", "path": "ClientApp/src"}),
    ("Grep", {"pattern": "\\.env", "path": "ClientApp/src", "glob": "*.ts"}),
    ("Glob", {"pattern": "**/*.stories.tsx"}),
    ("Read", {"file_path": "ClientApp/src/env.ts"}),
    ("Write", {"file_path": "reports/out.json"}),
]


def invoke(tool_name: str, tool_input: dict) -> int:
    payload = json.dumps({"tool_name": tool_name, "tool_input": tool_input})
    proc = subprocess.run(
        [sys.executable, str(GUARD)],
        input=payload, capture_output=True, text=True, timeout=30,
    )
    return proc.returncode


def main() -> None:
    if not GUARD.is_file():
        print(f"guard not found: {GUARD}", file=sys.stderr)
        sys.exit(1)

    failures = []

    print("BEHAVIOURS")
    for label, expected, tool, payload in BEHAVIOURS:
        actual = invoke(tool, payload)
        ok = actual == expected
        if not ok:
            failures.append(f"{label} (expected {expected}, got {actual})")
        verb = "BLOCK" if expected == BLOCK else "ALLOW"
        print(f"  [{'pass' if ok else 'FAIL'}] expect {verb} got {actual}  {label}")

    print("\nFALSE POSITIVES (all must be allowed)")
    for tool, payload in FALSE_POSITIVES:
        actual = invoke(tool, payload)
        ok = actual == ALLOW
        shown = (
            payload.get("command")
            or payload.get("file_path")
            or payload.get("path")
            or payload.get("pattern")
        )
        if not ok:
            failures.append(f"false positive: {tool}: {shown} (got {actual})")
        print(f"  [{'pass' if ok else 'FAIL'}] exit {actual}  {tool}: {shown}")

    total = len(BEHAVIOURS) + len(FALSE_POSITIVES)
    print(f"\n{total - len(failures)}/{total} passed")

    if failures:
        print(f"\n{len(failures)} FAILING:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("guard behaviour holds")


if __name__ == "__main__":
    main()
