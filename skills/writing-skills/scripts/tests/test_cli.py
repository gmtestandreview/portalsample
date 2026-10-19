"""Tests for skills-ref CLI."""

import json
from pathlib import Path

import pytest
from click.testing import CliRunner

from skills_ref.cli import main


def _write_skill(
    path: Path,
    name: str = "my-skill",
    description: str = "A test skill",
) -> None:
    path.mkdir(parents=True, exist_ok=True)
    (path / "SKILL.md").write_text(
        f"---\nname: {name}\ndescription: {description}\n---\nBody\n",
        encoding="utf-8",
    )


def test_validate_directory_success(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["validate", str(skill_dir)])
    if result.exit_code != 0:
        pytest.fail(f"Expected exit code 0, got {result.exit_code}: {result.output!r}")
    if "Valid skill:" not in result.output:
        pytest.fail(f"Expected 'Valid skill:' in output, got: {result.output!r}")


def test_validate_direct_skill_file_success(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["validate", str(skill_dir / "SKILL.md")])
    if result.exit_code != 0:
        pytest.fail(f"Expected exit code 0, got {result.exit_code}: {result.output!r}")
    if "Valid skill:" not in result.output:
        pytest.fail(f"Expected 'Valid skill:' in output, got: {result.output!r}")


def test_validate_lowercase_skill_file_is_not_treated_as_skill_file(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    lower = skill_dir / "skill.md"
    lower.write_text(
        "---\nname: my-skill\ndescription: A test skill\n---\nBody\n",
        encoding="utf-8",
    )
    result = CliRunner().invoke(main, ["validate", str(lower)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")


def test_validate_invalid_skill_returns_exit_one(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        "---\nname: INVALID\ndescription: A test skill\n---\nBody\n",
        encoding="utf-8",
    )
    result = CliRunner().invoke(main, ["validate", str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if "Validation failed" not in result.output:
        pytest.fail(f"Expected 'Validation failed' in output, got: {result.output!r}")


def test_read_properties_outputs_json(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["read-properties", str(skill_dir)])
    if result.exit_code != 0:
        pytest.fail(f"Expected exit code 0, got {result.exit_code}: {result.output!r}")
    payload = json.loads(result.output)
    if payload["name"] != "my-skill":
        pytest.fail(f"Expected name 'my-skill', got {payload['name']!r}")
    if payload["description"] != "A test skill":
        pytest.fail(f"Expected description 'A test skill', got {payload['description']!r}")


def test_read_properties_error_path(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    result = CliRunner().invoke(main, ["read-properties", str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if "SKILL.md not found" not in result.output:
        pytest.fail(f"Expected 'SKILL.md not found' in output, got: {result.output!r}")


def test_to_prompt_outputs_xml(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["to-prompt", str(skill_dir)])
    if result.exit_code != 0:
        pytest.fail(f"Expected exit code 0, got {result.exit_code}: {result.output!r}")
    if "<available_skills>" not in result.output:
        pytest.fail(f"Expected '<available_skills>' in output, got: {result.output!r}")
    if "<name>\nmy-skill\n</name>" not in result.output:
        pytest.fail(f"Expected '<name>\\nmy-skill\\n</name>' in output, got: {result.output!r}")


def test_to_prompt_error_path(tmp_path: Path) -> None:
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    result = CliRunner().invoke(main, ["to-prompt", str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if "SKILL.md not found" not in result.output:
        pytest.fail(f"Expected 'SKILL.md not found' in output, got: {result.output!r}")


@pytest.mark.parametrize("command", ["validate", "read-properties", "to-prompt"])
def test_raw_control_error_is_reported_without_traceback(tmp_path: Path, command: str):
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir, description="bad\x01text")
    result = CliRunner().invoke(main, [command, str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if not isinstance(result.exception, SystemExit):
        pytest.fail(f"Expected a SystemExit exception, got {type(result.exception).__name__}")
    if "Invalid YAML" not in result.output:
        pytest.fail(f"Expected 'Invalid YAML' in output, got: {result.output!r}")


def test_read_properties_reports_malformed_optional_metadata(tmp_path: Path):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        "---\nname: my-skill\ndescription: Test\nmetadata: invalid\n---\nBody",
        encoding="utf-8",
    )
    result = CliRunner().invoke(main, ["read-properties", str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if not isinstance(result.exception, SystemExit):
        pytest.fail(f"Expected a SystemExit exception, got {type(result.exception).__name__}")
    if "Error:" not in result.output:
        pytest.fail(f"Expected 'Error:' in output, got: {result.output!r}")
    if "metadata" not in result.output:
        pytest.fail(f"Expected 'metadata' in output, got: {result.output!r}")


@pytest.mark.parametrize("command", ["validate", "read-properties", "to-prompt"])
@pytest.mark.parametrize("escape", [r"\U00110000", r"\UFFFFFFFF"])
def test_out_of_range_unicode_error_is_a_controlled_cli_error(
    tmp_path: Path, command: str, escape: str
):
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir, description=f'"{escape}"')
    result = CliRunner().invoke(main, [command, str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if not isinstance(result.exception, SystemExit):
        pytest.fail(f"Expected a SystemExit exception, got {type(result.exception).__name__}")
    if "Invalid YAML" not in result.output:
        pytest.fail(f"Expected 'Invalid YAML' in output, got: {result.output!r}")


@pytest.mark.parametrize("command", ["validate", "read-properties", "to-prompt"])
def test_deep_yaml_is_reported_as_a_controlled_cli_error(tmp_path: Path, command: str) -> None:
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    depth = 300
    nested = "".join("  " * (level + 1) + "key:\n" for level in range(depth))
    (skill_dir / "SKILL.md").write_text(
        "---\nname: my-skill\ndescription: Test\nmetadata:\n"
        + nested
        + "  " * (depth + 1)
        + "leaf: value\n---\nBody",
        encoding="utf-8",
    )
    result = CliRunner().invoke(main, [command, str(skill_dir)])
    if result.exit_code != 1:
        pytest.fail(f"Expected exit code 1, got {result.exit_code}: {result.output!r}")
    if not isinstance(result.exception, SystemExit):
        pytest.fail(f"Expected a SystemExit exception, got {type(result.exception).__name__}")
    if "Invalid YAML" not in result.stderr:
        pytest.fail(f"Expected 'Invalid YAML' in stderr, got: {result.stderr!r}")
    if result.stdout != "":
        pytest.fail(f"Expected no stdout, got: {result.stdout!r}")
