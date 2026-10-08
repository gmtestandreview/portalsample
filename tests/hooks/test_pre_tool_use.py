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

The optional local shell wrapper is covered by test_wrapper.py.

Run:  python tests/hooks/test_pre_tool_use.py
"""

import json
import os
import subprocess
import sys
import tempfile
from collections.abc import Mapping
from pathlib import Path
from typing import cast

import pytest

ROOT = Path(__file__).resolve().parents[2]
GUARD = ROOT / "scripts" / "pre_tool_use.py"

BLOCK = 2
ALLOW = 0

# Assembled so this file's own text carries no contiguous destructive literal —
# the guard inspects command strings, and a literal here would trip it when a
# tool call happens to quote this file.
_RECURSE_FORCE = "-Recurse " + "-Force"
_RM_RF = "rm -r" + "f"

# A path segment like "...-formik-..." spells out r-then-f letters
# (-f[o]r[mik]) purely by coincidence of English word order, with no real
# flag delimiter involved. Split so this file's own text stays clean too.
_HYPHENATED_FILENAME_LOOKALIKE = "docs/plans/2026-09-27-fo" + "rmik-migration-status.md"

# (label, expected exit, tool_name, tool_input)
BEHAVIOURS: list[tuple[str, int, str, dict[str, str]]] = [
    # --- Bash destructive --------------------------------------------------
    ("bash: recursive force delete of root", BLOCK, "Bash", {"command": f"{_RM_RF} /"}),
    ("bash: recursive force delete of home", BLOCK, "Bash", {"command": "rm -fr ~"}),
    # --- PowerShell destructive: the primary shell on Windows hosts --------
    (
        "pwsh: Remove-Item recursive force",
        BLOCK,
        "PowerShell",
        {"command": f"Remove-Item {_RECURSE_FORCE} ."},
    ),
    (
        "pwsh: switches in reverse order",
        BLOCK,
        "PowerShell",
        {"command": "Remove-Item -Force -Recurse C:\\"},
    ),
    ("pwsh: abbreviated switches -r -fo", BLOCK, "PowerShell", {"command": "ri -r -fo ./build"}),
    (
        "pwsh: rm alias with PowerShell switches",
        BLOCK,
        "PowerShell",
        {"command": "rm -Recurse -Force ~"},
    ),
    (
        "pwsh: -Confirm:$false does not evade",
        BLOCK,
        "PowerShell",
        {"command": f"Remove-Item {_RECURSE_FORCE} -Confirm:$false ."},
    ),
    ("pwsh: Format-Volume", BLOCK, "PowerShell", {"command": "Format-Volume -DriveLetter C"}),
    # --- .env via path-bearing tools ---------------------------------------
    ("read: .env", BLOCK, "Read", {"file_path": "/proj/.env"}),
    ("read: .env.sample is a template", ALLOW, "Read", {"file_path": "/proj/.env.sample"}),
    # --- .env via search tools ---------------------------------------------
    ("grep: path targets .env", BLOCK, "Grep", {"pattern": ".", "path": ".env"}),
    ("grep: glob targets .env", BLOCK, "Grep", {"pattern": ".", "path": ".", "glob": ".env*"}),
    ("glob: pattern targets .env", BLOCK, "Glob", {"pattern": "**/.env"}),
    (
        "grep: searching FOR the text '.env' is legitimate",
        ALLOW,
        "Grep",
        {"pattern": "\\.env", "path": "src"},
    ),
    # --- .env via shell commands -------------------------------------------
    ("bash: cat .env", BLOCK, "Bash", {"command": "cat .env"}),
    ("pwsh: Get-Content .env", BLOCK, "PowerShell", {"command": "Get-Content .env"}),
    ("pwsh: gc alias on .env", BLOCK, "PowerShell", {"command": "gc .env"}),
    (
        "pwsh: Copy-Item .env exfiltration",
        BLOCK,
        "PowerShell",
        {"command": "Copy-Item .env $env:TEMP\\leak.txt"},
    ),
    (
        "pwsh: Get-Content .env.example is a template",
        ALLOW,
        "PowerShell",
        {"command": "Get-Content .env.example"},
    ),
    ("bash: redirect into .env", BLOCK, "Bash", {"command": "echo X=1 >.env"}),
    ("bash: grep reads .env", BLOCK, "Bash", {"command": "grep KEY .env.local"}),
    ("bash: nested bash -c still inspected", BLOCK, "Bash", {"command": f"bash -c '{_RM_RF} /'"}),
    (
        "pwsh: nested -Command still inspected",
        BLOCK,
        "PowerShell",
        {"command": f'pwsh -Command "Remove-Item {_RECURSE_FORCE} C:\\"'},
    ),
    (
        "bash: command substitution still inspected",
        BLOCK,
        "Bash",
        {"command": f"echo $({_RM_RF} ~)"},
    ),
    ("glob: *.env* selector", BLOCK, "Glob", {"pattern": "**/*.env*"}),
    # --- sonar / scanner cleanup of build artefacts is legitimate ----------
    (
        "pwsh: scanner workdir cleanup",
        ALLOW,
        "PowerShell",
        {"command": f"Remove-Item {_RECURSE_FORCE} .scannerwork"},
    ),
    ("bash: scanner workdir cleanup", ALLOW, "Bash", {"command": f"{_RM_RF} .scannerwork .sonar"}),
    (
        "bash: node_modules cache cleanup",
        ALLOW,
        "Bash",
        {"command": f"{_RM_RF} node_modules/.cache/sonar"},
    ),
    (
        "bash: allowlist cannot be escaped with ..",
        BLOCK,
        "Bash",
        {"command": f"{_RM_RF} dist/../src"},
    ),
    ("bash: glob of root is not allowlisted", BLOCK, "Bash", {"command": f"{_RM_RF} *"}),
]

# Every one of these must be ALLOWED.
FALSE_POSITIVES: list[tuple[str, dict[str, str]]] = [
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
    ("Bash", {"command": f"git rm {_HYPHENATED_FILENAME_LOOKALIKE}"}),
    ("PowerShell", {"command": f"git rm {_HYPHENATED_FILENAME_LOOKALIKE}"}),
    ("Grep", {"pattern": "acquireTokenSilent", "path": "ClientApp/src"}),
    ("Grep", {"pattern": "\\.env", "path": "ClientApp/src", "glob": "*.ts"}),
    ("Glob", {"pattern": "**/*.stories.tsx"}),
    ("Read", {"file_path": "ClientApp/src/env.ts"}),
    ("Write", {"file_path": "reports/out.json"}),
    # Text that merely MENTIONS a verb or filename is data, not an action.
    ("PowerShell", {"command": "Get-Content r.json | Select-String 'import.meta.env'"}),
    ("PowerShell", {"command": "Select-String -Path a.ts -Pattern 'rm -r" + "f|Remove-Item'"}),
    ("Bash", {"command": "cat sonar-report.txt | grep process.env"}),
    ("Bash", {"command": "git commit -m 'fix rm -r" + "f guard and .env handling'"}),
    ("Bash", {"command": "python - <<'EOF'\nprint('cat .env')\nEOF"}),
    ("PowerShell", {"command": "$s = @'\nGet-Content .env\n'@\n$s | python -"}),
    ("Bash", {"command": "npx sonar-scanner -Dsonar.projectKey=x"}),
    ("Bash", {"command": "ls -la .env.local"}),
    ("Read", {"file_path": "ClientApp/src/process.env.d.ts"}),
    ("Grep", {"pattern": "x", "path": "docs/.environment-notes.md"}),
]


SECRET = "hunter2-" + "token"


def invoke(tool_name: str, tool_input: Mapping[str, str], project_dir: Path | None = None) -> int:
    if project_dir is None:
        with tempfile.TemporaryDirectory(prefix="pretooluse-") as folder:
            return invoke(tool_name, tool_input, Path(folder))
    payload = json.dumps({"tool_name": tool_name, "tool_input": tool_input})
    proc = subprocess.run(
        [sys.executable, "-I", "-S", str(GUARD)],
        input=payload,
        capture_output=True,
        text=True,
        timeout=30,
        cwd=project_dir,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(project_dir)},
    )
    return proc.returncode


def check_log(project_dir: Path) -> list[str]:
    """Log is append-only JSONL, records blocks, redacts secrets, stores no file bodies."""
    problems: list[str] = []
    invoke("Write", {"file_path": "a.txt", "content": "BODY-" + SECRET}, project_dir)
    invoke("Bash", {"command": f"export API_TOKEN={SECRET}; {_RM_RF} /"}, project_dir)
    log_file = project_dir / ".agent-sync" / "logs" / "pre_tool_use.jsonl"
    if not log_file.is_file():
        return ["append-only JSONL log is missing"]
    lines = log_file.read_text(encoding="utf-8").splitlines()
    try:
        records: list[object] = [json.loads(line) for line in lines]
    except json.JSONDecodeError:
        return ["log is not valid JSONL"]
    if not all(isinstance(record, dict) for record in records):
        problems.append("log records are not JSON objects")
    if not any(
        isinstance(r, dict) and cast(dict[str, object], r).get("decision") == "block"
        for r in records
    ):
        problems.append("blocked calls are not logged")
    if SECRET in "\n".join(lines):
        problems.append("secret/body leaked into log")
    return problems


def check_fail_open_wrapper(project_dir: Path) -> list[str]:
    """Garbage on stdin must not crash the guard (the wrapper treats crashes as errors)."""
    proc = subprocess.run(
        [sys.executable, "-I", "-S", str(GUARD)],
        input="not json",
        capture_output=True,
        text=True,
        timeout=30,
        cwd=project_dir,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(project_dir)},
    )
    return [] if proc.returncode == ALLOW else [f"malformed stdin exit {proc.returncode}"]


@pytest.mark.parametrize(
    ("label", "expected", "tool", "payload"),
    BEHAVIOURS,
    ids=[case[0] for case in BEHAVIOURS],
)
def test_guard_behaviour(label: str, expected: int, tool: str, payload: dict[str, str]) -> None:
    assert invoke(tool, payload) == expected, label


DELETE_BOUNDARIES: list[tuple[str, str, int]] = [
    ("Bash", f"bash -ce '{_RM_RF} /'", BLOCK),
    ("Bash", f"echo \\<<EOF\n{_RM_RF} /\nEOF", BLOCK),
    ("Bash", f"cat <<EOF\n'$({_RM_RF} /)'\nEOF", BLOCK),
    ("Bash", "cmd /c \"echo 'data & rd /s C:\\ '\"", BLOCK),
    ("Bash", f"command -p {_RM_RF} /", BLOCK),
    ("Bash", f"time -p {_RM_RF} /", BLOCK),
    ("Bash", f"xargs -p {_RM_RF} /", BLOCK),
    ("Bash", f"exec -a alias {_RM_RF} /", BLOCK),
    ("Bash", f"cd other; {_RM_RF} .scannerwork", BLOCK),
    ("Bash", f"sudo -n -u root {_RM_RF} /", BLOCK),
    ("Bash", f"echo '<<EOF'\n{_RM_RF} /", BLOCK),
    ("Bash", f"({_RM_RF} /)", BLOCK),
    ("Bash", f"if true; then {_RM_RF} /; fi", BLOCK),
    ("PowerShell", f"& {{ Remove-Item {_RECURSE_FORCE} . }}", BLOCK),
    ("PowerShell", f"Remove-Item {_RECURSE_FORCE} .scannerwork/cache,./src", BLOCK),
    ("Bash", "cmd /c rd /s/q C:\\", BLOCK),
    ("Bash", "cmd /c del /f important.txt", BLOCK),
    ("Bash", "cmd /c " * 10 + "rd /s C:\\", BLOCK),
    ("Bash", f"echo '$({_RM_RF} /)'", ALLOW),
    ("Bash", f"python - <<EOF\n$({_RM_RF} /)\nEOF", BLOCK),
    ("Bash", f"{_RM_RF} -- .scannerwork/cache", ALLOW),
    ("PowerShell", f"Remove-Item {_RECURSE_FORCE} -LiteralPath .scannerwork/cache", ALLOW),
    ("Bash", f"{_RM_RF} .scannerwork/../../src", BLOCK),
]


@pytest.mark.parametrize(("tool", "command", "expected"), DELETE_BOUNDARIES)
def test_delete_parser_preserves_security_boundaries(
    tool: str, command: str, expected: int
) -> None:
    assert invoke(tool, {"command": command}) == expected


ENV_BOUNDARIES: list[tuple[str, str, int]] = [
    ("Bash", "grep -f .env src/a.ts", BLOCK),
    ("Bash", "grep --regexp='.env' src/a.ts", ALLOW),
    ("Bash", "git commit --message='.env'", ALLOW),
    ("Bash", "# cat .env", ALLOW),
    ("Bash", "cat .env.sample .env", BLOCK),
    ("PowerShell", "Get-Content .env,.env.sample", BLOCK),
    ("PowerShell", "Select-String -Path .env password", BLOCK),
    ("PowerShell", "Select-String -Pattern '.env' -Path src/a.ts", ALLOW),
    ("Bash", "git show HEAD:.env", BLOCK),
    ("Bash", "git commit -m '.env'", ALLOW),
    ("Bash", "echo ignore < .env", BLOCK),
    ("Bash", "echo 'cat .env'", ALLOW),
    ("Bash", 'echo "$(cat .env)"', BLOCK),
    ("Bash", "c\\at .env", BLOCK),
    ("Bash", "grep '.env' src/a.ts", ALLOW),
    ("Bash", "cat .env.private.env.sample", BLOCK),
]


@pytest.mark.parametrize(("tool", "command", "expected"), ENV_BOUNDARIES)
def test_secret_paths_and_search_data_are_distinguished(
    tool: str, command: str, expected: int
) -> None:
    assert invoke(tool, {"command": command}) == expected


@pytest.mark.parametrize(("tool", "payload"), FALSE_POSITIVES)
def test_legitimate_tool_calls_are_allowed(tool: str, payload: dict[str, str]) -> None:
    assert invoke(tool, payload) == ALLOW


def test_log_records_blocks_without_exposing_content() -> None:
    with tempfile.TemporaryDirectory(prefix="pretooluse-log-") as directory:
        assert check_log(Path(directory)) == []


def test_malformed_stdin_fails_open() -> None:
    with tempfile.TemporaryDirectory(prefix="pretooluse-malformed-") as directory:
        assert check_fail_open_wrapper(Path(directory)) == []


@pytest.mark.parametrize("payload", [None, [], "Bash", {}, {"tool_name": []}])
def test_wrong_hook_payload_shapes_fail_open(payload: object) -> None:
    with tempfile.TemporaryDirectory(prefix="pretooluse-shape-") as directory:
        result = subprocess.run(
            [sys.executable, "-I", "-S", str(GUARD)],
            input=json.dumps(payload),
            cwd=directory,
            capture_output=True,
            text=True,
            timeout=20,
            env={**os.environ, "CLAUDE_PROJECT_DIR": directory},
        )
        assert result.returncode == 0
        assert result.stdout == ""


@pytest.mark.parametrize(
    "command",
    [
        f'curl -H "Authorization: Bearer {SECRET}" https://example.invalid',
        f"echo password='{SECRET} two words'",
        f"echo --token {SECRET}",
        f"$env:TOKEN = '{SECRET}'",
    ],
)
@pytest.mark.parametrize("blocked", [False, True])
def test_audit_and_stderr_do_not_persist_credential_values(command: str, blocked: bool) -> None:
    with tempfile.TemporaryDirectory(prefix="pretooluse-private-") as directory:
        result = subprocess.run(
            [sys.executable, "-I", "-S", str(GUARD)],
            input=json.dumps(
                {
                    "tool_name": "Bash",
                    "tool_input": {"command": command + (f"; {_RM_RF} /" if blocked else "")},
                }
            ),
            cwd=directory,
            capture_output=True,
            text=True,
            timeout=20,
            env={**os.environ, "CLAUDE_PROJECT_DIR": directory},
        )
        assert result.returncode == (BLOCK if blocked else ALLOW)
        assert SECRET not in result.stdout + result.stderr
        log = Path(directory) / ".agent-sync/logs/pre_tool_use.jsonl"
        assert log.is_file(), "append-only audit log missing"
        assert SECRET not in log.read_text(encoding="utf-8")


def test_log_uses_project_root_preserves_records_and_rotates() -> None:
    with tempfile.TemporaryDirectory(prefix="pretooluse-append-") as directory:
        root = Path(directory)
        other_cwd = root / "other-cwd"
        other_cwd.mkdir()
        log = root / ".agent-sync/logs/pre_tool_use.jsonl"
        for _ in range(2):
            result = subprocess.run(
                [sys.executable, "-I", "-S", str(GUARD)],
                input=json.dumps({"tool_name": "Read", "tool_input": {"file_path": "a.ts"}}),
                cwd=other_cwd,
                capture_output=True,
                text=True,
                timeout=20,
                env={**os.environ, "CLAUDE_PROJECT_DIR": directory},
            )
            assert result.returncode == ALLOW
            assert log.is_file(), "log ignored CLAUDE_PROJECT_DIR"
        assert len(log.read_text(encoding="utf-8").splitlines()) == 2
        assert not (other_cwd / ".agent-sync").exists()
        prior = "{}\n" * (512 * 1024 // 3 + 1)
        log.write_text(prior, encoding="utf-8")
        assert invoke("Read", {"file_path": "a.ts"}, root) == ALLOW
        assert log.with_suffix(".jsonl.1").read_text(encoding="utf-8") == prior
        assert log.stat().st_size <= 512 * 1024


def test_concurrent_rotation_preserves_prior_archive() -> None:
    # Hold both pre-lock size observations until both writers arrive. A locked
    # writer times out at this barrier, rotates, then lets the next writer append.
    child = """
import importlib.util, os, pathlib, sys, time
spec = importlib.util.spec_from_file_location("guard", sys.argv[1])
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
original = os.path.getsize
root = pathlib.Path(os.environ["CLAUDE_PROJECT_DIR"])
def coordinated_size(path):
    size = original(path)
    (root / ("arrived-" + str(os.getpid()))).touch()
    deadline = time.monotonic() + 0.5
    while len(list(root.glob("arrived-*"))) < 2 and time.monotonic() < deadline:
        time.sleep(0.005)
    return size
guard.os.path.getsize = coordinated_size
replace = os.replace
def coordinated_replace(source, destination):
    try:
        (root / "first-rotation").mkdir()
    except FileExistsError:
        deadline = time.monotonic() + 2
        while not pathlib.Path(source).exists() and time.monotonic() < deadline:
            time.sleep(0.005)
    replace(source, destination)
guard.os.replace = coordinated_replace
guard._log("Read", {"file_path": "a.ts"}, "allow")
"""
    with tempfile.TemporaryDirectory(prefix="pretooluse-concurrent-") as directory:
        root = Path(directory)
        log = root / ".agent-sync/logs/pre_tool_use.jsonl"
        log.parent.mkdir(parents=True)
        prior = '{"prior_record": true}\n' + "{}\n" * (512 * 1024 // 3)
        log.write_text(prior, encoding="utf-8")
        processes: list[subprocess.Popen[str]] = []
        try:
            for _ in range(2):
                processes.append(
                    subprocess.Popen(
                        [sys.executable, "-I", "-S", "-c", child, str(GUARD)],
                        cwd=root,
                        env={**os.environ, "CLAUDE_PROJECT_DIR": directory},
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                )
            for process in processes:
                stdout, stderr = process.communicate(timeout=10)
                assert process.returncode == 0, stderr
                assert stdout == "" and stderr == ""
            assert log.with_suffix(".jsonl.1").read_text(encoding="utf-8") == prior
            records = [json.loads(line) for line in log.read_text(encoding="utf-8").splitlines()]
            assert len(records) == 2
            assert all(record["decision"] == "allow" for record in records)
        finally:
            for process in processes:
                if process.poll() is None:
                    process.kill()
                process.communicate(timeout=10)


def test_guard_does_not_persist_file_bodies_or_credentials() -> None:
    """Check actual log artifacts even when the expected JSONL log is absent."""
    body = "TEST_FILE_BODY_DO_NOT_LOG"
    with tempfile.TemporaryDirectory(prefix="pretooluse-redaction-") as directory:
        project_dir = Path(directory)
        assert invoke("Write", {"file_path": "a.txt", "content": body}, project_dir) == ALLOW
        assert invoke("Bash", {"command": f"echo API_TOKEN={SECRET}"}, project_dir) == ALLOW
        logs = project_dir / ".agent-sync" / "logs"
        for path in logs.glob("*"):
            if path.is_file():
                text = path.read_text(encoding="utf-8")
                assert body not in text, "file body persisted in audit log"
                assert SECRET not in text, "credential persisted in audit log"


def main() -> int:
    return pytest.main([str(Path(__file__).resolve()), "-q"])


if __name__ == "__main__":
    raise SystemExit(main())
