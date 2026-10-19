"""Exercise the Windows GitHub MCP launcher without real credentials or Docker.

Run: python -m pytest tests/hooks/test_github_mcp_server.py -q
"""

import json
import os
import shutil
import subprocess  # nosec B404: tests intentionally exercise process lifecycle
import sys
import time
from collections.abc import Sequence
from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(os.name != "nt", reason="Windows batch launcher")
ROOT = Path(__file__).resolve().parents[2]
LAUNCHER = ROOT / "scripts" / "github-mcp-server.cmd"
TOKEN_KEYS = (
    "GITHUB_PERSONAL_ACCESS_TOKEN",
    "GH_PERSONAL_ACCESS_TOKEN",
    "GITHUB_PAT_TOKEN",
)
Launcher = tuple[list[str], dict[str, str], Path, Path]
TASKKILL = Path(os.environ.get("SYSTEMROOT", r"C:\Windows")) / "System32" / "taskkill.exe"

AUTH = """const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
assert.deepEqual(process.argv.slice(2), ['token']);
if (process.env.LAUNCHER_TEST_AUTH_FAIL) process.exit(1);
fs.writeSync(1, 'dummy-cli-credential\\n');
const state = process.env.LAUNCHER_TEST_STATE;
fs.closeSync(fs.openSync(path.join(state, 'auth-ready'), 'w'));
if (process.env.LAUNCHER_TEST_HOLD === 'gh') {
    while (!fs.existsSync(path.join(state, 'release'))) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
}
"""

TOOL = """import json, os, pathlib, sys, time
state = pathlib.Path(os.environ["LAUNCHER_TEST_STATE"])
(state / "docker.json").write_text(json.dumps({
    "args": sys.argv[1:],
    "credential": os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN"),
}))
(state / "docker-ready").touch()
if os.environ.get("LAUNCHER_TEST_HOLD") == "docker":
    while not (state / "release").exists():
        time.sleep(0.02)
sys.exit(int(os.environ.get("LAUNCHER_TEST_DOCKER_EXIT", "0")))
"""


def fixture_value(label: str) -> str:
    """Return a deterministic, non-secret value for credential test cases."""
    return f"dummy-{label}"


@pytest.fixture
def launcher(tmp_path: Path) -> Launcher:
    tools = tmp_path / "fake tools"
    tools.mkdir()
    temp = tmp_path / "credential temp"
    temp.mkdir()
    helper = tools / "tool.py"
    helper.write_text(TOOL, encoding="utf-8")
    # Use a native executable: a .cmd double would transfer batch control and
    # would not model the real gh.exe returning to its caller.
    node = shutil.which("node")
    if node is None:
        pytest.fail("Repository Node runtime is required")
    try:
        os.link(node, tools / "gh.exe")
    except OSError:
        shutil.copy2(node, tools / "gh.exe")
    (tmp_path / "auth").write_text(AUTH, encoding="utf-8")
    (tools / "docker.cmd").write_text(
        f'@echo off\n"{sys.executable}" "{helper}" %*\nexit /b %errorlevel%\n',
        encoding="utf-8",
    )
    environment = {key: value for key, value in os.environ.items() if key.upper() not in TOKEN_KEYS}
    environment.update(
        PATH=str(tools) + os.pathsep + environment["PATH"],
        TEMP=str(temp),
        TMP=str(temp),
        LAUNCHER_TEST_STATE=str(tmp_path),
    )
    command = [os.environ.get("COMSPEC", "cmd.exe"), "/d", "/c", str(LAUNCHER)]
    return command, environment, tmp_path, temp


def validated_command(command: Sequence[str]) -> list[str]:
    """Return the fixture-owned launcher command after validating its shape."""
    if not command or any(not isinstance(argument, str) or not argument for argument in command):
        pytest.fail("Launcher command must be a non-empty sequence of strings")

    arguments = list(command)
    if len(arguments) != 4 or arguments[1:3] != ["/d", "/c"]:
        pytest.fail("Launcher command must use cmd.exe with /d /c")
    if Path(arguments[3]).resolve() != LAUNCHER.resolve():
        pytest.fail("Launcher command must target the repository launcher")
    if Path(arguments[0]).name.casefold() != "cmd.exe":
        pytest.fail("Launcher command must use cmd.exe as its executable")
    return arguments


def wait_for_marker(marker: Path, process: subprocess.Popen[bytes]) -> None:
    deadline = time.monotonic() + 10
    while not marker.exists():
        if process.poll() is not None:
            raise AssertionError("Launcher exited before reaching the controlled boundary")
        if time.monotonic() >= deadline:
            raise AssertionError("Launcher did not reach the controlled boundary")
        time.sleep(0.02)


def stop_tree(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is None:
        subprocess.run(  # nosec B603: fixed absolute Windows utility and arguments
            [str(TASKKILL), "/PID", str(process.pid), "/T", "/F"],
            capture_output=True,
            timeout=10,
        )
    process.communicate(timeout=10)


@pytest.mark.parametrize("boundary", ["gh", "docker"])
def test_authentication_never_spools_a_credential_to_disk(
    launcher: Launcher, boundary: str
) -> None:
    command, environment, state, temp = launcher
    command = validated_command(command)
    environment["LAUNCHER_TEST_HOLD"] = boundary
    process = subprocess.Popen(  # nosec B603: command is fixture-owned and validated
        command,
        env=environment,
        cwd=state,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )
    try:
        marker = "auth-ready" if boundary == "gh" else "docker-ready"
        wait_for_marker(state / marker, process)
        if list(temp.iterdir()):
            pytest.fail("Credential acquisition wrote to disk")
    finally:
        stop_tree(process)
    if list(temp.iterdir()):
        pytest.fail("Interrupted launcher left a credential file")


@pytest.mark.parametrize("boundary", ["gh", "docker"])
def test_ctrl_c_leaves_no_credential_file(launcher: Launcher, boundary: str) -> None:
    command, environment, state, temp = launcher
    command = validated_command(command)
    environment["LAUNCHER_TEST_HOLD"] = boundary
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = subprocess.SW_HIDE
    process = subprocess.Popen(  # nosec B603: command is fixture-owned and validated
        command,
        env=environment,
        cwd=state,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_CONSOLE,
        startupinfo=startup,
    )
    sender = """import ctypes, sys, time
kernel = ctypes.WinDLL('kernel32', use_last_error=True)
kernel.FreeConsole()
if not kernel.AttachConsole(int(sys.argv[1])):
    raise ctypes.WinError(ctypes.get_last_error())
kernel.SetConsoleCtrlHandler(None, True)
if not kernel.GenerateConsoleCtrlEvent(0, 0):
    raise ctypes.WinError(ctypes.get_last_error())
time.sleep(0.2)
kernel.FreeConsole()
"""
    try:
        marker = "auth-ready" if boundary == "gh" else "docker-ready"
        wait_for_marker(state / marker, process)
        sent = subprocess.run(  # nosec B603: fixed interpreter and inline test script
            [sys.executable, "-c", sender, str(process.pid)],
            capture_output=True,
            timeout=10,
        )
        if sent.returncode != 0:
            pytest.fail(sent.stderr.decode())
        process.communicate(input=b"Y\r\n", timeout=10)
        if list(temp.iterdir()):
            pytest.fail("Ctrl+C left a credential file")
    finally:
        stop_tree(process)


@pytest.mark.parametrize(
    ("credentials", "expected"),
    [
        ({}, "dummy-cli-credential"),
        (
            {
                "GITHUB_PERSONAL_ACCESS_TOKEN": fixture_value("primary"),
                "GH_PERSONAL_ACCESS_TOKEN": fixture_value("alias"),
            },
            fixture_value("primary"),
        ),
        (
            {
                "GH_PERSONAL_ACCESS_TOKEN": fixture_value("alias"),
                "GITHUB_PAT_TOKEN": fixture_value("legacy"),
            },
            fixture_value("alias"),
        ),
        ({"GITHUB_PAT_TOKEN": fixture_value("legacy")}, fixture_value("legacy")),
    ],
)
def test_passes_resolved_credential_only_through_environment(
    launcher: Launcher, credentials: dict[str, str], expected: str
) -> None:
    command, environment, state, temp = launcher
    command = validated_command(command)
    environment.update(credentials)
    result = subprocess.run(  # nosec B603: command is fixture-owned and validated
        command, env=environment, cwd=state, capture_output=True, timeout=15
    )
    if result.returncode != 0:
        pytest.fail(result.stderr.decode())
    recorded = json.loads((state / "docker.json").read_text())
    if recorded["credential"] != expected:
        pytest.fail("Launcher did not pass the expected credential")
    expected_args = [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server",
    ]
    if recorded["args"] != expected_args:
        pytest.fail("Launcher passed unexpected Docker arguments")
    if expected.encode() in result.stdout + result.stderr:
        pytest.fail("Expected secret value was leaked to subprocess output")
    if list(temp.iterdir()):
        pytest.fail("Credential handling left a temporary file")
    if credentials and (state / "auth-ready").exists():
        pytest.fail("Explicit credentials should bypass gh")


def test_failed_authentication_does_not_start_docker(launcher: Launcher) -> None:
    command, environment, state, temp = launcher
    command = validated_command(command)
    environment["LAUNCHER_TEST_AUTH_FAIL"] = "1"
    result = subprocess.run(  # nosec B603: command is fixture-owned and validated
        command, env=environment, cwd=state, capture_output=True, timeout=15
    )
    if result.returncode != 1:
        pytest.fail(f"Expected authentication failure exit code 1, got {result.returncode}")
    if (state / "docker.json").exists():
        pytest.fail("Docker started after authentication failed")
    if list(temp.iterdir()):
        pytest.fail("Failed authentication left a temporary credential file")


def test_docker_failure_is_returned_to_caller(launcher: Launcher) -> None:
    command, environment, state, temp = launcher
    command = validated_command(command)
    environment["LAUNCHER_TEST_DOCKER_EXIT"] = "23"
    result = subprocess.run(  # nosec B603: command is fixture-owned and validated
        command, env=environment, cwd=state, capture_output=True, timeout=15
    )
    if result.returncode != 23:
        pytest.fail(f"Expected Docker exit code 23, got {result.returncode}")
    if list(temp.iterdir()):
        pytest.fail("Docker failure left a temporary credential file")
