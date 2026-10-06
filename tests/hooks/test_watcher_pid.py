#!/usr/bin/env python3
"""Verify maintained and distributed watcher probes without killing targets.

Run: python tests/hooks/test_watcher_pid.py
"""

import ast
import gc
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Literal

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_WATCHER = ROOT / "scripts" / "watcher.py"
TEMPLATE_WATCHER = ROOT / "templates" / "watcher.py"
PROCESS_UTILS = ROOT / "scripts" / "process_utils.py"
WATCHERS = [SCRIPTS_WATCHER, TEMPLATE_WATCHER]
HELPERS = [PROCESS_UTILS, TEMPLATE_WATCHER]
ChildMode = Literal["live", "released", "exited"]


def _os_kill_probe_sites(source: str) -> list[tuple[str, int]]:
    """Find module and nested probes, attributing each to its actual scope."""
    sites: list[tuple[str, int]] = []

    def visit(node: ast.AST, owner: str) -> None:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for child in ast.iter_child_nodes(node):
                visit(child, node.name if child in node.body else owner)
            return
        elif isinstance(node, ast.ClassDef):
            for child in ast.iter_child_nodes(node):
                visit(child, f"class {node.name}" if child in node.body else owner)
            return
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "kill"
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "os"
            and len(node.args) == 2
            and isinstance(node.args[1], ast.Constant)
            and node.args[1].value == 0
        ):
            sites.append((owner, node.lineno))
        for child in ast.iter_child_nodes(node):
            visit(child, owner)

    visit(ast.parse(source), "<module>")
    return sites


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("os.kill(pid, 0)", [("<module>", 1)]),
        ("def outer():\n    def inner():\n        os.kill(pid, 0)", [("inner", 3)]),
        ("class Outer:\n    os.kill(pid, 0)", [("class Outer", 2)]),
        ("def pid_is_running(pid=os.kill(123, 0)):\n    pass", [("<module>", 1)]),
        ("@decorate(os.kill(pid, 0))\ndef pid_is_running(pid):\n    pass", [("<module>", 1)]),
        ("def ordinary():\n    os.kill(pid, 15)", []),
    ],
)
def test_probe_scan_identifies_actual_scope(source: str, expected: list[tuple[str, int]]) -> None:
    assert _os_kill_probe_sites(source) == expected


@pytest.mark.parametrize("path", [*WATCHERS, PROCESS_UTILS])
def test_no_unguarded_os_kill_probe(path: Path) -> None:
    """Real subprocess checks below supplement this name-based static guard."""
    stray = [
        (owner, line)
        for owner, line in _os_kill_probe_sites(path.read_text(encoding="utf-8"))
        if owner != "pid_is_running"
    ]
    assert not stray, f"{path}: unguarded probes {stray}"


@pytest.mark.parametrize("path", WATCHERS)
def test_both_watchers_define_a_liveness_helper(path: Path) -> None:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    definitions = [node.name for node in tree.body if isinstance(node, ast.FunctionDef)]
    imports = [
        name.name
        for node in tree.body
        if isinstance(node, ast.ImportFrom) and node.module == "process_utils"
        for name in node.names
    ]
    assert "pid_is_running" in definitions or "pid_is_running" in imports


@pytest.mark.parametrize("path", WATCHERS)
def test_watchers_use_the_helper_in_is_already_running(path: Path) -> None:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    functions = [
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "is_already_running"
    ]
    assert len(functions) == 1, f"{path}: missing or duplicate liveness entry point"
    assert any(
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "pid_is_running"
        for node in ast.walk(functions[0])
    ), f"{path}: liveness entry point does not call the helper"


@pytest.mark.parametrize("helper", HELPERS, ids=["maintained", "template"])
def test_pid_is_running_reports_own_pid(helper: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="watcher-own-pid-") as directory:
        _run_helper_check(helper, "own", Path(directory))


# Load both real helpers in separate interpreters, avoiding watcher-loop and
# import-path side effects in the test runner. The parent test owns every child,
# so a probe crash or timeout cannot bypass child cleanup.
_HELPER_CHECK = """
import importlib.util
import os
import sys

spec = importlib.util.spec_from_file_location('candidate', sys.argv[1])
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
mode = sys.argv[2]
if mode == 'own':
    assert module.pid_is_running(os.getpid()) is True, 'own process reported dead'
else:
    pid = int(sys.argv[3])
    if mode == 'live':
        assert module.pid_is_running(pid) is True, 'live process reported dead'
        assert module.pid_is_running(pid) is True, 'second probe reported dead'
    else:
        assert module.pid_is_running(pid) is False, mode + ' process reported running'
print('PID_PROBE_COMPLETED')
"""


def _run_helper_check(helper: Path, mode: str, cwd: Path, pid: int | None = None) -> None:
    result = subprocess.run(
        [sys.executable, "-c", _HELPER_CHECK, str(helper), mode, str(pid)],
        capture_output=True,
        text=True,
        timeout=20,
        cwd=cwd,
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "PID_PROBE_COMPLETED", "probe exited before completing"


@pytest.mark.parametrize("helper", HELPERS, ids=["maintained", "template"])
@pytest.mark.parametrize("mode", ["live", "released", "exited"])
def test_each_real_helper_preserves_process_liveness(helper: Path, mode: ChildMode) -> None:
    with tempfile.TemporaryDirectory(prefix="watcher-child-") as directory:
        cwd = Path(directory)
        child: subprocess.Popen[bytes] | None = subprocess.Popen(
            [sys.executable, "-c", "import time; time.sleep(30)" if mode == "live" else "pass"],
            cwd=cwd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            pid = child.pid
            if mode != "live":
                child.wait(timeout=10)
                if mode == "released":
                    child = None
                    gc.collect()
            _run_helper_check(helper, mode, cwd, pid)
            if mode == "live":
                assert child is not None
                assert child.poll() is None, "liveness probe terminated the child"
        finally:
            if child is not None:
                if child.poll() is None:
                    child.kill()
                child.wait(timeout=5)


@pytest.mark.parametrize("mode", ["own", "live", "released", "exited"])
def test_helper_early_exit_is_rejected(mode: Literal["own", "live", "released", "exited"]) -> None:
    with tempfile.TemporaryDirectory(prefix="watcher-early-exit-") as directory:
        helper = Path(directory) / "early_exit.py"
        helper.write_text("def pid_is_running(pid):\n    raise SystemExit(0)\n", encoding="utf-8")
        with pytest.raises(AssertionError, match="probe exited before completing"):
            if mode == "own":
                test_pid_is_running_reports_own_pid(helper)
            else:
                test_each_real_helper_preserves_process_liveness(helper, mode)


def main() -> int:
    return pytest.main([str(Path(__file__).resolve()), "-q"])


if __name__ == "__main__":
    raise SystemExit(main())
