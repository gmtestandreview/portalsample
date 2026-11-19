"""Focused behavior tests for the secret-scanner hook."""

import importlib.util
import io
import json
import subprocess
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


FAKE_GIT = 'C:/tools/git.exe'


@pytest.fixture
def scanner() -> ModuleType:
    return load_scanner()


@pytest.fixture
def resolved_git(monkeypatch: MonkeyPatch, scanner: ModuleType) -> str:
    def which(_name: str) -> str:
        return FAKE_GIT

    monkeypatch.setattr(scanner.shutil, 'which', which)
    return FAKE_GIT


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
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
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
    if calls != [[resolved_git, 'diff', '--name-only']]:
        pytest.fail(f'unexpected git invocation: {calls}')


def test_auto_staged_files_skips_git_when_commit_has_no_all_flag(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    def fail_run(*args: object, **kwargs: object) -> SimpleNamespace:
        pytest.fail('git must not run without a commit -a flag')

    monkeypatch.setattr(scanner.subprocess, 'run', fail_run)

    if scanner._auto_staged_files('git commit -m message') != []:
        pytest.fail('expected no files when commit has no -a flag')


def test_auto_staged_files_fails_open_when_git_run_raises_oserror(
    monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
) -> None:
    def missing_git(*args: object, **kwargs: object) -> SimpleNamespace:
        raise FileNotFoundError('git')

    monkeypatch.setattr(scanner.subprocess, 'run', missing_git)

    if scanner._auto_staged_files('git commit -am message') != []:
        pytest.fail('expected [] (fail open) when git cannot be executed')


def test_all_added_files_strips_porcelain_prefix_and_keeps_existing(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
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
    if calls != [[resolved_git, 'status', '--porcelain']]:
        pytest.fail(f'unexpected git invocation: {calls}')


def test_all_added_files_fails_open_when_git_run_raises_oserror(
    monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
) -> None:
    def missing_git(*args: object, **kwargs: object) -> SimpleNamespace:
        raise FileNotFoundError('git')

    monkeypatch.setattr(scanner.subprocess, 'run', missing_git)

    if scanner._all_added_files() != []:
        pytest.fail('expected [] (fail open) when git cannot be executed')


def test_main_fails_open_when_git_is_missing(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    """D-01: with git missing, main() exits 0 (fail open) instead of crashing."""
    monkeypatch.setattr(
        sys,
        'stdin',
        io.StringIO(json.dumps({'tool_input': {'command': 'git add . && git commit -m message'}})),
    )

    def no_staged_files() -> list[str]:
        return []

    def no_git(_name: str) -> None:
        return None

    def fail_run(*args: object, **kwargs: object) -> SimpleNamespace:
        pytest.fail('subprocess.run must not be called when git is not found')

    monkeypatch.setattr(scanner, 'get_staged_files', no_staged_files)
    monkeypatch.setattr(scanner.shutil, 'which', no_git)
    monkeypatch.setattr(scanner.subprocess, 'run', fail_run)

    with pytest.raises(SystemExit) as result:
        scanner.main()

    if result.value.code != 0:
        pytest.fail(f'expected fail-open exit code 0, got {result.value.code}')


def test_helpers_return_empty_when_git_not_found(
    monkeypatch: MonkeyPatch, scanner: ModuleType
) -> None:
    def no_git(_name: str) -> None:
        return None

    def fail_run(*args: object, **kwargs: object) -> SimpleNamespace:
        pytest.fail('subprocess.run must not be called when git is not found')

    monkeypatch.setattr(scanner.shutil, 'which', no_git)
    monkeypatch.setattr(scanner.subprocess, 'run', fail_run)

    if scanner._auto_staged_files('git commit -am message') != []:
        pytest.fail('_auto_staged_files must return [] when git is missing')
    if scanner._all_added_files() != []:
        pytest.fail('_all_added_files must return [] when git is missing')


def test_git_calls_use_explicit_check_false_and_timeout(
    monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
) -> None:
    seen: list[dict[str, object]] = []

    def fake_run(*args: object, **kwargs: object) -> SimpleNamespace:
        seen.append(dict(kwargs))
        return SimpleNamespace(stdout='')

    monkeypatch.setattr(scanner.subprocess, 'run', fake_run)

    scanner._auto_staged_files('git commit -am message')
    scanner._all_added_files()

    if len(seen) != 2:
        pytest.fail(f'expected two git invocations, got {len(seen)}')
    for kwargs in seen:
        if kwargs.get('check') is not False:
            pytest.fail(f'check=False missing: {kwargs}')
        if kwargs.get('timeout') != 10:
            pytest.fail(f'timeout=10 missing: {kwargs}')
        if kwargs.get('capture_output') is not True or kwargs.get('text') is not True:
            pytest.fail(f'capture_output/text missing: {kwargs}')


def test_helpers_return_empty_on_git_timeout(
    monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
) -> None:
    def slow_git(*args: object, **kwargs: object) -> SimpleNamespace:
        raise subprocess.TimeoutExpired(cmd='git', timeout=10)

    monkeypatch.setattr(scanner.subprocess, 'run', slow_git)

    if scanner._auto_staged_files('git commit -am message') != []:
        pytest.fail('_auto_staged_files must return [] on timeout')
    if scanner._all_added_files() != []:
        pytest.fail('_all_added_files must return [] on timeout')


def test_nonzero_git_exit_still_parses_stdout(
    tmp_path: Path, monkeypatch: MonkeyPatch, scanner: ModuleType, resolved_git: str
) -> None:
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'present.txt').write_text('x', encoding='utf-8')

    def failing_run(*args: object, **kwargs: object) -> SimpleNamespace:
        return SimpleNamespace(stdout='present.txt\n', returncode=1)

    monkeypatch.setattr(scanner.subprocess, 'run', failing_run)

    result = scanner._auto_staged_files('git commit -am message')

    if result != ['present.txt']:
        pytest.fail(f'non-zero exit must not change stdout parsing, got {result}')


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
