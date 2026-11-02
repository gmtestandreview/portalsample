#!/usr/bin/env python3
"""
Behaviour of the PreToolUse shell wrapper in .claude/settings.json.

The wrapper resolves scripts/pre_tool_use.py from CLAUDE_PROJECT_DIR, passes
exit codes through (0 allow, 2 block), blocks when the guard crashes or no Python
is available, and warns/allows only when the guard file itself is absent.

Needs Node.js and a Python interpreter on PATH.
Run:  python tests/hooks/test_wrapper.py
"""

import json
import os
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import TypedDict

import pytest

ROOT = Path(__file__).resolve().parents[2]
SETTINGS = ROOT / ".claude" / "settings.json"
GUARD = ROOT / "scripts" / "pre_tool_use.py"
WRAPPER = ROOT / "scripts" / "pre_tool_use_wrapper.mjs"
LAUNCHER = ROOT / "scripts" / "python314.mjs"


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


def test_wrapper_command_is_directly_invocable_without_posix_shell() -> None:
    argv = wrapper_argv()
    assert argv[:2] == ["node", "-e"]
    assert "pre_tool_use_wrapper.mjs" in argv[2]


def wrapper_argv() -> list[str]:
    return shlex.split(wrapper_command())


def project(folder: Path, guard_source: str | None) -> None:
    (folder / "scripts").mkdir()
    shutil.copyfile(WRAPPER, folder / "scripts" / WRAPPER.name)
    shutil.copyfile(LAUNCHER, folder / "scripts" / LAUNCHER.name)
    if guard_source is not None:
        (folder / "scripts" / "pre_tool_use.py").write_text(guard_source, encoding="utf-8")


def run(folder: Path, payload: ToolCall, *, cwd: Path | None = None) -> tuple[int, str]:
    proc = subprocess.run(
        wrapper_argv(),
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        timeout=30,
        cwd=folder if cwd is None else cwd,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(folder)},
    )
    return proc.returncode, proc.stderr


# (label, guard source or None for a missing guard, payload, expected exit, stderr must contain)
CASES: list[tuple[str, str | None, ToolCall, int, str]] = [
    ("guard crash fails closed", "import sys\nsys.exit(1)\n", READ_OK, 2, "BLOCKED"),
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
    [(READ_OK, 0, ""), (READ_SECRET, 2, "secret-file-access")],
)
def test_wrapper_runs_real_guard(payload: ToolCall, want_code: int, want_text: str) -> None:
    assert_case(GUARD.read_text(encoding="utf-8"), payload, want_code, want_text)


def test_wrapper_resolves_project_path_and_uses_isolated_python() -> None:
    with tempfile.TemporaryDirectory(prefix="wrapper-project-") as directory:
        folder = Path(directory)
        root = folder / "project with spaces"
        root.mkdir()
        unrelated = folder / "other-cwd"
        unrelated.mkdir()
        project(root, "import sys\nassert sys.flags.isolated and sys.flags.no_site\nsys.exit(2)\n")
        code, _ = run(root, READ_OK, cwd=unrelated)
        assert code == 2, "guard was skipped or Python isolation flags were absent"


@pytest.mark.parametrize(
    "source",
    [
        None,
        "this is invalid JavaScript",
        "module.exports.findPython314 = () => { throw new Error('private probe detail'); };",
    ],
)
def test_broken_python314_helper_blocks_without_exposing_details(source: str | None) -> None:
    with tempfile.TemporaryDirectory(prefix="wrapper-broken-helper-") as directory:
        folder = Path(directory)
        project(folder, "pass\n")
        helper = folder / "scripts" / LAUNCHER.name
        if source is None:
            helper.unlink()
        else:
            helper.write_text(source, encoding="utf-8")
        code, stderr = run(folder, READ_OK)
        assert code == 2
        assert "BLOCKED" in stderr
        assert "private probe detail" not in stderr


def test_missing_guard_still_allows_when_python314_helper_is_absent() -> None:
    with tempfile.TemporaryDirectory(prefix="wrapper-missing-both-") as directory:
        folder = Path(directory)
        project(folder, None)
        (folder / "scripts" / LAUNCHER.name).unlink()
        code, stderr = run(folder, READ_OK)
        assert code == 0
        assert "inactive" in stderr


def test_lock_descriptor_uses_sys_platform_guard() -> None:
    """Regression: mypy only narrows platform-conditional imports via sys.platform."""
    source = GUARD.read_text(encoding="utf-8")
    assert "sys.platform" in source, "_lock_descriptor must use sys.platform for mypy"
    assert 'os.name == "nt"' not in source, "os.name guard is invisible to mypy"


def test_lock_descriptor_acquires_and_releases() -> None:
    """The locking function works on the current platform."""
    with tempfile.TemporaryDirectory(prefix="lock-") as directory:
        lock_path = os.path.join(directory, "test.lock")
        fd = os.open(lock_path, os.O_CREAT | os.O_RDWR)
        try:
            if sys.platform == "win32":
                import msvcrt

                os.lseek(fd, 0, os.SEEK_SET)
                msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
                msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)


def main() -> int:
    return pytest.main([str(Path(__file__).resolve()), "-q"])


if __name__ == "__main__":
    raise SystemExit(main())
