"""Focused behavior tests for the secret-scanner hook."""

import importlib.util
import io
import json
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace

import pytest
from _pytest.capture import CaptureFixture
from _pytest.monkeypatch import MonkeyPatch

ROOT = Path(__file__).resolve().parents[2]
SCANNER_PATH = ROOT / ".claude" / "hooks" / "secret-scanner.py"


def load_scanner() -> ModuleType:
    spec = importlib.util.spec_from_file_location("secret_scanner", SCANNER_PATH)
    if spec is None:
        pytest.fail("unable to create secret-scanner module spec")
    if spec.loader is None:
        pytest.fail("secret-scanner module spec has no loader")
    scanner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scanner)
    return scanner


@pytest.fixture
def scanner() -> ModuleType:
    return load_scanner()


def test_files_to_scan_resolves_explicit_git_add(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    staged_file = tmp_path / "config.txt"
    staged_file.write_text("safe", encoding="utf-8")

    def no_staged_files() -> list[str]:
        return []

    def fake_run(*args: object, **kwargs: object) -> SimpleNamespace:
        return SimpleNamespace(stdout="")

    monkeypatch.setattr(scanner, "get_staged_files", no_staged_files)
    monkeypatch.setattr(scanner.subprocess, "run", fake_run)

    command = f"git add {staged_file} && git commit -m message"

    if scanner._files_to_scan(command) != [str(staged_file)]:
        pytest.fail("explicit git-add path was not selected for scanning")


def test_main_blocks_commit_when_scan_finds_secret(
    monkeypatch: MonkeyPatch,
    scanner: ModuleType,
    capsys: CaptureFixture[str],
) -> None:
    finding: dict[str, object] = {
        "file": "settings.json",
        "line": 1,
        "description": "Generic API Key",
        "severity": "medium",
        "match": "[REDACTED]",
    }
    monkeypatch.setattr(
        sys,
        "stdin",
        io.StringIO(json.dumps({"tool_input": {"command": "git commit -m message"}})),
    )

    def files_to_scan(_command: str) -> list[str]:
        return ["settings.json"]

    def scan_file(_file_path: str) -> list[dict[str, object]]:
        return [finding]

    monkeypatch.setattr(scanner, "_files_to_scan", files_to_scan)
    monkeypatch.setattr(scanner, "scan_file", scan_file)

    with pytest.raises(SystemExit) as result:
        scanner.main()

    if result.value.code != 2:
        pytest.fail(f"expected commit block exit code 2, got {result.value.code}")
    if "COMMIT BLOCKED" not in capsys.readouterr().err:
        pytest.fail("commit block message was not written to stderr")


def test_main_allows_invalid_hook_input(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    monkeypatch.setattr(sys, "stdin", io.StringIO("not-json"))

    with pytest.raises(SystemExit) as result:
        scanner.main()

    if result.value.code != 0:
        pytest.fail(f"expected invalid input to exit with code 0, got {result.value.code}")
