"""Exercise the Windows GitHub MCP launcher without real credentials or Docker.

Run: python -m pytest tests/hooks/test_github_mcp_server.py -q
"""

import json
import os
import shutil
import subprocess
import sys
import time
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


@pytest.fixture
def launcher(tmp_path: Path):
    tools = tmp_path / "fake tools"
    tools.mkdir()
    temp = tmp_path / "credential temp"
    temp.mkdir()
    helper = tools / "tool.py"
    helper.write_text(TOOL, encoding="utf-8")
    # Use a native executable: a .cmd double would transfer batch control and
    # would not model the real gh.exe returning to its caller.
    node = shutil.which("node")
    assert node is not None, "Repository Node runtime is required"
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


def wait_for_marker(marker: Path, process: subprocess.Popen) -> None:
    deadline = time.monotonic() + 10
    while not marker.exists():
        if process.poll() is not None:
            raise AssertionError("Launcher exited before reaching the controlled boundary")
        if time.monotonic() >= deadline:
            raise AssertionError("Launcher did not reach the controlled boundary")
        time.sleep(0.02)


def stop_tree(process: subprocess.Popen) -> None:
    if process.poll() is None:
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            capture_output=True,
            timeout=10,
        )
    process.communicate(timeout=10)


@pytest.mark.parametrize("boundary", ["gh", "docker"])
def test_authentication_never_spools_a_credential_to_disk(launcher, boundary: str) -> None:
    command, environment, state, temp = launcher
    environment["LAUNCHER_TEST_HOLD"] = boundary
    process = subprocess.Popen(
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
        assert list(temp.iterdir()) == [], "Credential acquisition wrote to disk"
    finally:
        stop_tree(process)
    assert list(temp.iterdir()) == [], "Interrupted launcher left a credential file"


@pytest.mark.parametrize("boundary", ["gh", "docker"])
def test_ctrl_c_leaves_no_credential_file(launcher, boundary: str) -> None:
    command, environment, state, temp = launcher
    environment["LAUNCHER_TEST_HOLD"] = boundary
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = subprocess.SW_HIDE
    process = subprocess.Popen(
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
        sent = subprocess.run(
            [sys.executable, "-c", sender, str(process.pid)],
            capture_output=True,
            timeout=10,
        )
        assert sent.returncode == 0, sent.stderr.decode()
        process.communicate(input=b"Y\r\n", timeout=10)
        assert list(temp.iterdir()) == [], "Ctrl+C left a credential file"
    finally:
        stop_tree(process)


@pytest.mark.parametrize(
    ("credentials", "expected"),
    [
        ({}, "dummy-cli-credential"),
        (
            {
                "GITHUB_PERSONAL_ACCESS_TOKEN": "dummy-primary",
                "GH_PERSONAL_ACCESS_TOKEN": "dummy-alias",
            },
            "dummy-primary",
        ),
        (
            {"GH_PERSONAL_ACCESS_TOKEN": "dummy-alias", "GITHUB_PAT_TOKEN": "dummy-legacy"},
            "dummy-alias",
        ),
        ({"GITHUB_PAT_TOKEN": "dummy-legacy"}, "dummy-legacy"),
    ],
)
def test_passes_resolved_credential_only_through_environment(
    launcher, credentials, expected
) -> None:
    command, environment, state, temp = launcher
    environment.update(credentials)
    result = subprocess.run(command, env=environment, cwd=state, capture_output=True, timeout=15)
    assert result.returncode == 0, result.stderr.decode()
    recorded = json.loads((state / "docker.json").read_text())
    assert recorded["credential"] == expected
    assert recorded["args"] == [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server",
    ]
    assert expected.encode() not in result.stdout + result.stderr
    assert list(temp.iterdir()) == []
    if credentials:
        assert not (state / "auth-ready").exists(), "Explicit credentials should bypass gh"


def test_failed_authentication_does_not_start_docker(launcher) -> None:
    command, environment, state, temp = launcher
    environment["LAUNCHER_TEST_AUTH_FAIL"] = "1"
    result = subprocess.run(command, env=environment, cwd=state, capture_output=True, timeout=15)
    assert result.returncode == 1
    assert not (state / "docker.json").exists()
    assert list(temp.iterdir()) == []


def test_docker_failure_is_returned_to_caller(launcher) -> None:
    command, environment, state, temp = launcher
    environment["LAUNCHER_TEST_DOCKER_EXIT"] = "23"
    result = subprocess.run(command, env=environment, cwd=state, capture_output=True, timeout=15)
    assert result.returncode == 23
    assert list(temp.iterdir()) == []
