#!/usr/bin/env python3
"""
Guards the watcher's process-liveness check.

On Windows `os.kill(pid, sig)` has no signal-0 semantics: any signal value
opens the target process and calls TerminateProcess. So the POSIX idiom
`os.kill(pid, 0)` — "does this process exist?" — actually KILLS the process it
is probing, then reports it as alive because no exception was raised.

`scripts/watcher.py` was fixed to use `pid_is_running()`. The copy in
`templates/` was not, and templates/ ships to downstream projects. These tests
exist so the two cannot drift apart again.

Run:  python tests/hooks/test_watcher_pid.py
"""
import ast
import gc
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_WATCHER = ROOT / "scripts" / "watcher.py"
TEMPLATE_WATCHER = ROOT / "templates" / "watcher.py"
PROCESS_UTILS = ROOT / "scripts" / "process_utils.py"

# `os.kill(pid, 0)` is not banned outright — it is the CORRECT liveness probe on
# POSIX, and pid_is_running() uses it in its POSIX branch. What must never happen
# is the probe appearing outside that one guarded helper, where no os.name check
# protects it. So locate every such call and assert which function it sits in.
_ALLOWED_PROBE_HOST = "pid_is_running"

failures = []


def _os_kill_probe_sites(source: str):
    """Return [(enclosing function, lineno)] for every os.kill(x, 0) call."""
    sites = []
    for func in ast.walk(ast.parse(source)):
        if not isinstance(func, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for node in ast.walk(func):
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
                sites.append((func.name, node.lineno))
    return sites


def check(label: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  [pass] {label}")
        return
    print(f"  [FAIL] {label}{(' — ' + detail) if detail else ''}")
    failures.append(label)


def test_no_unguarded_os_kill_probe() -> None:
    """os.kill(pid, 0) may appear only inside pid_is_running()'s POSIX branch."""
    for path in (SCRIPTS_WATCHER, TEMPLATE_WATCHER, PROCESS_UTILS):
        source = path.read_text(encoding="utf-8")
        stray = [
            (fn, line)
            for fn, line in _os_kill_probe_sites(source)
            if fn != _ALLOWED_PROBE_HOST
        ]
        check(
            f"{path.relative_to(ROOT).as_posix()}: no unguarded os.kill(pid, 0) probe",
            not stray,
            "; ".join(f"in {fn}() at line {line}" for fn, line in stray),
        )


def test_both_watchers_define_a_liveness_helper() -> None:
    """Each watcher must reach pid_is_running — imported or inlined."""
    for path in (SCRIPTS_WATCHER, TEMPLATE_WATCHER):
        source = path.read_text(encoding="utf-8")
        has_helper = (
            "from process_utils import pid_is_running" in source
            or "def pid_is_running" in source
        )
        check(
            f"{path.relative_to(ROOT).as_posix()}: reaches pid_is_running",
            has_helper,
            "neither imports nor defines it",
        )


def test_watchers_use_the_helper_in_is_already_running() -> None:
    """The helper must actually be called by the liveness check."""
    for path in (SCRIPTS_WATCHER, TEMPLATE_WATCHER):
        source = path.read_text(encoding="utf-8")
        body = source.split("def is_already_running", 1)
        check(
            f"{path.relative_to(ROOT).as_posix()}: is_already_running() calls pid_is_running()",
            len(body) == 2 and "pid_is_running(" in body[1].split("\ndef ", 1)[0],
            "helper defined but not called",
        )


def test_pid_is_running_is_correct_for_live_and_dead_pids() -> None:
    """Behavioural check of the real helper, on this platform."""
    sys.path.insert(0, str(PROCESS_UTILS.parent))
    from process_utils import pid_is_running  # noqa: E402

    check("pid_is_running(own pid) is True", pid_is_running(os.getpid()) is True)

    # A process that has certainly exited. On Windows a process object survives
    # while any handle to it is open, and Popen holds one — so the handle must
    # be released before probing, or the exited pid still reports as alive.
    proc = subprocess.Popen([sys.executable, "-c", "pass"])
    dead_pid = proc.pid
    proc.wait(timeout=15)
    del proc
    gc.collect()

    check(
        f"pid_is_running(exited pid {dead_pid}) is False",
        pid_is_running(dead_pid) is False,
        "a reaped pid was reported alive",
    )


def test_probing_does_not_kill_the_target() -> None:
    """The regression itself: probing a live process must leave it running."""
    sys.path.insert(0, str(PROCESS_UTILS.parent))
    from process_utils import pid_is_running  # noqa: E402

    # A child that sleeps long enough to be probed twice.
    child = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    try:
        first = pid_is_running(child.pid)
        second = pid_is_running(child.pid)
        still_alive = child.poll() is None
        check("probing a live process reports it alive", first and second)
        check(
            "probing a live process does NOT terminate it",
            still_alive,
            "the probe killed the target — this is the Windows os.kill bug",
        )
    finally:
        child.kill()
        child.wait(timeout=10)


def main() -> None:
    print(f"platform: {os.name} ({sys.platform})\n")
    test_no_unguarded_os_kill_probe()
    test_both_watchers_define_a_liveness_helper()
    test_watchers_use_the_helper_in_is_already_running()
    test_pid_is_running_is_correct_for_live_and_dead_pids()
    test_probing_does_not_kill_the_target()

    print()
    if failures:
        print(f"{len(failures)} FAILING:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("watcher pid handling holds")


if __name__ == "__main__":
    main()
