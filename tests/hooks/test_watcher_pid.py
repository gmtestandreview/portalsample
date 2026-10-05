#!/usr/bin/env python3
"""Verify maintained and distributed watcher probes without killing targets.

Run: python tests/hooks/test_watcher_pid.py
"""

import ast
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_WATCHER = ROOT / "scripts" / "watcher.py"
TEMPLATE_WATCHER = ROOT / "templates" / "watcher.py"
PROCESS_UTILS = ROOT / "scripts" / "process_utils.py"
WATCHERS = [SCRIPTS_WATCHER, TEMPLATE_WATCHER]
HELPERS = [PROCESS_UTILS, TEMPLATE_WATCHER]


def _os_kill_probe_sites(source: str) -> list[tuple[str, int]]:
    """Find module and nested probes, attributing each to its actual scope."""
    sites: list[tuple[str, int]] = []

    def visit(node: ast.AST, owner: str) -> None:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            owner = node.name
        elif isinstance(node, ast.ClassDef):
            owner = f"class {node.name}"
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


def test_pid_is_running_reports_own_pid() -> None:
    result = subprocess.run(
        [sys.executable, "-c", _HELPER_CHECK, str(PROCESS_UTILS), "own"],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "OWN_PID_PROBE_COMPLETED", "probe exited before completing"


# Load both real helpers in separate interpreters, avoiding watcher-loop and
# import-path side effects in the test runner. Every child is reaped in finally.
_HELPER_CHECK = """
import gc
import importlib.util
import os
import subprocess
import sys

spec = importlib.util.spec_from_file_location('candidate', sys.argv[1])
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
mode = sys.argv[2]
if mode == 'own':
    assert module.pid_is_running(os.getpid()) is True, 'own process reported dead'
    print('OWN_PID_PROBE_COMPLETED')
    sys.exit(0)
child = subprocess.Popen([sys.executable, '-c',
    'import time; time.sleep(30)' if mode == 'live' else 'pass'])
try:
    if mode != 'live':
        child.wait(timeout=10)
        if mode == 'exited':
            assert module.pid_is_running(child.pid) is False, 'exited process reported running'
    else:
        assert module.pid_is_running(child.pid) is True, 'live process reported dead'
        assert module.pid_is_running(child.pid) is True, 'second probe reported dead'
        assert child.poll() is None, 'liveness probe terminated the child'
finally:
    if child.poll() is None:
        child.kill()
    child.wait(timeout=5)
if mode == 'released':
    dead_pid = child.pid
    del child
    gc.collect()
    assert module.pid_is_running(dead_pid) is False, 'released process reported running'
"""


@pytest.mark.parametrize("helper", HELPERS, ids=["maintained", "template"])
@pytest.mark.parametrize("mode", ["live", "released", "exited"])
def test_each_real_helper_preserves_process_liveness(helper: Path, mode: str) -> None:
    result = subprocess.run(
        [sys.executable, "-c", _HELPER_CHECK, str(helper), mode],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert result.returncode == 0, result.stderr


def main() -> int:
    return pytest.main([str(Path(__file__).resolve()), "-q"])


if __name__ == "__main__":
    raise SystemExit(main())
