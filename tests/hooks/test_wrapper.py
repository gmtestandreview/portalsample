#!/usr/bin/env python3
"""
Behaviour of the PreToolUse shell wrapper in .claude/settings.json.

The wrapper must run scripts/pre_tool_use.py from the project working directory, pass its
exit code through (0 allow, 2 block), warn when the guard is missing, and
block when the guard crashes, matching the configured security policy.

Needs `sh` and a Python interpreter on PATH (Git Bash on Windows).
Run:  python tests/hooks/test_wrapper.py
"""

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import TypedDict

import pytest

ROOT = Path(__file__).resolve().parents[2]
SETTINGS = ROOT / ".claude" / "settings.json"
GUARD = ROOT / "scripts" / "pre_tool_use.py"


class ToolCall(TypedDict):
    tool_name: str
    tool_input: dict[str, str]


READ_OK: ToolCall = {"tool_name": "Read", "tool_input": {"file_path": "a.ts"}}
# Assembled so this file's own text carries no contiguous secret filename.
READ_SECRET: ToolCall = {"tool_name": "Read", "tool_input": {"file_path": "/p/" + "." + "env"}}


def wrapper_command() -> str:
    if not SETTINGS.is_file():
        pytest.skip("local .claude/settings.json is not available")
    command: object = json.loads(SETTINGS.read_text(encoding="utf-8"))["hooks"]["PreToolUse"][0][
        "hooks"
    ][0]["command"]
    assert isinstance(command, str), "wrapper command must be a string"
    assert command, "wrapper command must be nonempty"
    return command


def project(folder: Path, guard_source: str | None) -> None:
    if guard_source is not None:
        (folder / "scripts").mkdir()
        (folder / "scripts" / "pre_tool_use.py").write_text(guard_source, encoding="utf-8")


def run(folder: Path, payload: ToolCall) -> tuple[int, str]:
    shell = shutil.which("sh")
    if shell is None:
        pytest.skip("wrapper integration requires sh on PATH (for example Git Bash)")
    proc = subprocess.run(
        [shell, "-c", wrapper_command()],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        timeout=30,
        cwd=folder,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(folder)},
    )
    return proc.returncode, proc.stderr


# (label, guard source or None for a missing guard, payload, expected exit, stderr must contain)
CASES: list[tuple[str, str | None, ToolCall, int, str]] = [
    ("guard crash blocks", "import sys\nsys.exit(1)\n", READ_OK, 2, "failed to execute"),
    ("missing guard fails open", None, READ_OK, 0, "inactive"),
    ("guard exit code 2 passes through", "import sys\nsys.exit(2)\n", READ_OK, 2, ""),
]


def assert_case(source: str | None, payload: ToolCall, want_code: int, want_text: str) -> None:
    with tempfile.TemporaryDirectory(prefix="wrapper-") as directory:
        folder = Path(directory)
        project(folder, source)
        code, stderr = run(folder, payload)
        assert code == want_code, stderr
        assert want_text in stderr


@pytest.mark.parametrize(
    ("label", "source", "payload", "want_code", "want_text"),
    CASES,
    ids=[case[0] for case in CASES],
)
def test_wrapper_exit_contract(
    label: str, source: str | None, payload: ToolCall, want_code: int, want_text: str
) -> None:
    assert_case(source, payload, want_code, want_text)


@pytest.mark.parametrize(
    ("payload", "want_code", "want_text"),
    [(READ_OK, 0, ""), (READ_SECRET, 2, "")],
)
def test_wrapper_runs_real_guard(payload: ToolCall, want_code: int, want_text: str) -> None:
    assert_case(GUARD.read_text(encoding="utf-8"), payload, want_code, want_text)


def main() -> int:
    return pytest.main([str(Path(__file__).resolve()), "-q"])


if __name__ == "__main__":
    raise SystemExit(main())
