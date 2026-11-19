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
SCANNER_PATH = ROOT / '.claude' / 'hooks' / 'secret-scanner.py'


def load_scanner() -> ModuleType:
    spec = importlib.util.spec_from_file_location('secret_scanner', SCANNER_PATH)
    if spec is None:
        pytest.fail('unable to create secret-scanner module spec')
    if spec.loader is None:
        pytest.fail('secret-scanner module spec has no loader')
    scanner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scanner)
    return scanner


@pytest.fixture
def scanner() -> ModuleType:
    return load_scanner()


def test_files_to_scan_resolves_explicit_git_add(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    staged_file = tmp_path / 'config.txt'
    staged_file.write_text('safe', encoding='utf-8')

    def no_staged_files() -> list[str]:
        return []

    def fake_run(*args: object, **kwargs: object) -> SimpleNamespace:
        return SimpleNamespace(stdout='')

    monkeypatch.setattr(scanner, 'get_staged_files', no_staged_files)
    monkeypatch.setattr(scanner.subprocess, 'run', fake_run)

    command = f'git add {staged_file} && git commit -m message'

    if scanner._files_to_scan(command) != [str(staged_file)]:
        pytest.fail('explicit git-add path was not selected for scanning')


def test_main_blocks_commit_when_scan_finds_secret(
    monkeypatch: MonkeyPatch,
    scanner: ModuleType,
    capsys: CaptureFixture[str],
) -> None:
    finding: dict[str, object] = {
        'file': 'settings.json',
        'line': 1,
        'description': 'Generic API Key',
        'severity': 'medium',
        'match': '[REDACTED]',
    }
    monkeypatch.setattr(
        sys,
        'stdin',
        io.StringIO(json.dumps({'tool_input': {'command': 'git commit -m message'}})),
    )

    def files_to_scan(_command: str) -> list[str]:
        return ['settings.json']

    def scan_file(_file_path: str) -> list[dict[str, object]]:
        return [finding]

    monkeypatch.setattr(scanner, '_files_to_scan', files_to_scan)
    monkeypatch.setattr(scanner, 'scan_file', scan_file)

    with pytest.raises(SystemExit) as result:
        scanner.main()

    if result.value.code != 2:
        pytest.fail(f'expected commit block exit code 2, got {result.value.code}')
    if 'COMMIT BLOCKED' not in capsys.readouterr().err:
        pytest.fail('commit block message was not written to stderr')


def test_main_allows_invalid_hook_input(monkeypatch: MonkeyPatch, scanner: ModuleType) -> None:
    monkeypatch.setattr(sys, 'stdin', io.StringIO('not-json'))

    with pytest.raises(SystemExit) as result:
        scanner.main()

    if result.value.code != 0:
        pytest.fail(f'expected invalid input to exit with code 0, got {result.value.code}')


def test_auto_staged_files_returns_only_existing_files(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'present.txt').write_text('x', encoding='utf-8')
    calls: list[object] = []

    def fake_run(*args: object, **kwargs: object) -> SimpleNamespace:
        calls.append(args[0])
        return SimpleNamespace(stdout='present.txt\nmissing.txt\n')

    monkeypatch.setattr(scanner.subprocess, 'run', fake_run)

    result = scanner._auto_staged_files('git commit -am message')

    if result != ['present.txt']:
        pytest.fail(f'expected only existing files, got {result}')
    if calls != [['git', 'diff', '--name-only']]:
        pytest.fail(f'unexpected git invocation: {calls}')


def test_auto_staged_files_skips_git_when_commit_has_no_all_flag(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    def fail_run(*args: object, **kwargs: object) -> SimpleNamespace:
        pytest.fail('git must not run without a commit -a flag')

    monkeypatch.setattr(scanner.subprocess, 'run', fail_run)

    if scanner._auto_staged_files('git commit -m message') != []:
        pytest.fail('expected no files when commit has no -a flag')


def test_auto_staged_files_propagates_file_not_found(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    def missing_git(*args: object, **kwargs: object) -> SimpleNamespace:
        raise FileNotFoundError('git')

    monkeypatch.setattr(scanner.subprocess, 'run', missing_git)

    with pytest.raises(FileNotFoundError):
        scanner._auto_staged_files('git commit -am message')


def test_all_added_files_strips_porcelain_prefix_and_keeps_existing(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'a.txt').write_text('x', encoding='utf-8')
    (tmp_path / 'b.txt').write_text('x', encoding='utf-8')
    calls: list[object] = []

    def fake_run(*args: object, **kwargs: object) -> SimpleNamespace:
        calls.append(args[0])
        return SimpleNamespace(stdout='?? b.txt\n M a.txt\n D gone.txt\n')

    monkeypatch.setattr(scanner.subprocess, 'run', fake_run)

    result = scanner._all_added_files()

    if result != ['b.txt', 'a.txt']:
        pytest.fail(f'expected prefix-stripped existing files, got {result}')
    if calls != [['git', 'status', '--porcelain']]:
        pytest.fail(f'unexpected git invocation: {calls}')


def test_all_added_files_propagates_file_not_found(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    def missing_git(*args: object, **kwargs: object) -> SimpleNamespace:
        raise FileNotFoundError('git')

    monkeypatch.setattr(scanner.subprocess, 'run', missing_git)

    with pytest.raises(FileNotFoundError):
        scanner._all_added_files()


def test_main_currently_crashes_when_git_is_missing(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    """Characterisation: no caller catches FileNotFoundError today.

    main() lets it escape as an uncaught exception rather than exiting 0 (fail
    open) or 2 (block); it is not a SystemExit.
    """
    monkeypatch.setattr(
        sys,
        'stdin',
        io.StringIO(json.dumps({'tool_input': {'command': 'git add . && git commit -m message'}})),
    )

    def no_staged_files() -> list[str]:
        return []

    def missing_git(*args: object, **kwargs: object) -> SimpleNamespace:
        raise FileNotFoundError('git')

    monkeypatch.setattr(scanner, 'get_staged_files', no_staged_files)
    monkeypatch.setattr(scanner.subprocess, 'run', missing_git)

    with pytest.raises(FileNotFoundError):
        scanner.main()


def test_all_added_files_loses_first_line_leading_space_quirk(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    """Characterisation of a current quirk: stdout.strip() eats the first line's
    leading status space, so the 3-char prefix strip cuts one char too many."""
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'a.txt').write_text('x', encoding='utf-8')

    def fake_run(*args: object, **kwargs: object) -> SimpleNamespace:
        return SimpleNamespace(stdout=' M a.txt\n')

    monkeypatch.setattr(scanner.subprocess, 'run', fake_run)

    if scanner._all_added_files() != []:
        pytest.fail('first-line leading-space quirk no longer reproduces')
