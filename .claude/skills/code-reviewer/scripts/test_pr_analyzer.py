from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('pr-analyzer.py')
SPEC = importlib.util.spec_from_file_location('pr_analyzer', MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
pr_analyzer = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = pr_analyzer
SPEC.loader.exec_module(pr_analyzer)


def test_parse_diff_counts_source_lines_that_begin_with_double_signs() -> None:
    diff = '''\
diff --git a/example.txt b/example.txt
index 1111111..2222222 100644
--- a/example.txt
+++ b/example.txt
@@ -1,2 +1,2 @@
-++alpha
---beta
+++gamma
+--delta
'''

    files = pr_analyzer.parse_diff(diff)

    assert len(files) == 1
    assert files[0].additions == 2
    assert files[0].deletions == 2


def test_parse_diff_decodes_git_quoted_utf8_path() -> None:
    diff = r'''diff --git "a/caf\303\251.py" "b/caf\303\251.py"
index 1111111..2222222 100644
--- "a/caf\303\251.py"
+++ "b/caf\303\251.py"
@@ -1 +1 @@
-print("old")
+print("new")
'''

    files = pr_analyzer.parse_diff(diff)

    assert len(files) == 1
    assert files[0].filename == 'café.py'
    assert files[0].language == 'Python'


def test_parse_diff_preserves_paths_with_spaces() -> None:
    diff = '''\
diff --git a/src/file name.py b/src/file name.py
index 1111111..2222222 100644
--- a/src/file name.py
+++ b/src/file name.py
@@ -1 +1 @@
-old = 1
+new = 2
'''

    files = pr_analyzer.parse_diff(diff)

    assert files[0].filename == 'src/file name.py'


def test_test_deletions_are_reported_as_risk() -> None:
    files = [
        pr_analyzer.FileStats('src/app.py', additions=100, deletions=0, language='Python'),
        pr_analyzer.FileStats(
            'tests/test_app.py', additions=0, deletions=100, is_test=True, language='Python'
        ),
    ]

    risks = pr_analyzer.identify_risk_factors(files)

    assert any('TEST_DELETIONS' in risk for risk in risks)
    assert any('NO_TEST_CHANGES' in risk for risk in risks)


def test_zero_line_change_does_not_get_non_test_penalty() -> None:
    files = [pr_analyzer.FileStats('src/app.py', language='Python')]

    assert pr_analyzer.calculate_complexity(files) == 0.05


def test_modern_configuration_files_are_detected() -> None:
    filenames = (
        'pnpm-lock.yaml',
        'yarn.lock',
        'uv.lock',
        'requirements.txt',
        'src/App.csproj',
        'Directory.Packages.props',
        '.editorconfig',
        'global.json',
        'appsettings.Production.json',
    )

    for filename in filenames:
        assert pr_analyzer.is_config_file(filename)


def test_modern_languages_are_detected() -> None:
    language_cases = (
        ('vite.config.mjs', 'JavaScript'),
        ('src/config.cts', 'TypeScript'),
        ('build.ps1', 'PowerShell'),
        ('infra/main.tf', 'Terraform'),
        ('Api/Widget.razor', 'Razor'),
        ('src/Domain.fs', 'F#'),
    )

    for filename, language in language_cases:
        assert pr_analyzer.detect_language(filename) == language


def test_security_detection_does_not_flag_authors_document() -> None:
    files = [pr_analyzer.FileStats('docs/authors.md', additions=20, language='Markdown')]

    risks = pr_analyzer.identify_risk_factors(files)

    assert not any('Security-sensitive' in risk for risk in risks)


def test_security_detection_flags_auth_module() -> None:
    files = [pr_analyzer.FileStats('src/auth/token.py', additions=20, language='Python')]

    risks = pr_analyzer.identify_risk_factors(files)

    assert any('Security-sensitive' in risk for risk in risks)


def test_cli_help_exposes_one_merged_interface() -> None:
    result = subprocess.run(
        [sys.executable, str(MODULE_PATH), '--help'],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    for option in ('--diff-file', '--stats', '--json', '--output', '--verbose'):
        assert option in result.stdout


def test_cli_json_stdout_is_machine_readable_without_banner_noise() -> None:
    diff = '''\
diff --git a/src/app.py b/src/app.py
index 1111111..2222222 100644
--- a/src/app.py
+++ b/src/app.py
@@ -1 +1 @@
-old = 1
+new = 2
'''
    result = subprocess.run(
        [sys.executable, str(MODULE_PATH), '--json'],
        input=diff,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload['total_files'] == 1
    assert payload['files'][0]['filename'] == 'src/app.py'


def test_cli_output_writes_selected_format_without_changing_stdout_contract(tmp_path: Path) -> None:
    diff_file = tmp_path / 'change.diff'
    output_file = tmp_path / 'analysis.json'
    diff_file.write_text(
        '''\
diff --git a/src/app.py b/src/app.py
index 1111111..2222222 100644
--- a/src/app.py
+++ b/src/app.py
@@ -1 +1 @@
-old = 1
+new = 2
''',
        encoding='utf-8',
    )

    result = subprocess.run(
        [
            sys.executable,
            str(MODULE_PATH),
            '--diff-file',
            str(diff_file),
            '--json',
            '--output',
            str(output_file),
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert result.stdout == ''
    payload = json.loads(output_file.read_text(encoding='utf-8'))
    assert payload['total_files'] == 1


def test_parse_diff_counts_hunk_lines_that_exactly_resemble_patch_headers() -> None:
    diff = '''\
diff --git a/example.txt b/example.txt
index 1111111..2222222 100644
--- a/example.txt
+++ b/example.txt
@@ -1,2 +1,2 @@
--- old-looking-header
-plain old
+++ new-looking-header
+plain new
'''

    files = pr_analyzer.parse_diff(diff)

    assert len(files) == 1
    assert files[0].additions == 2
    assert files[0].deletions == 2
