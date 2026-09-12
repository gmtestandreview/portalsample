"""Tests for skills-ref CLI."""

import json

from click.testing import CliRunner

from skills_ref.cli import main


def _write_skill(path, name="my-skill", description="A test skill"):
    path.mkdir(parents=True, exist_ok=True)
    (path / "SKILL.md").write_text(
        f"---\nname: {name}\ndescription: {description}\n---\nBody\n"
    )


def test_validate_directory_success(tmp_path):
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["validate", str(skill_dir)])
    assert result.exit_code == 0
    assert "Valid skill:" in result.output


def test_validate_direct_skill_file_success(tmp_path):
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["validate", str(skill_dir / "SKILL.md")])
    assert result.exit_code == 0
    assert "Valid skill:" in result.output


def test_validate_lowercase_skill_file_is_not_treated_as_skill_file(tmp_path):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    lower = skill_dir / "skill.md"
    lower.write_text("---\nname: my-skill\ndescription: A test skill\n---\nBody\n")
    result = CliRunner().invoke(main, ["validate", str(lower)])
    assert result.exit_code == 1


def test_validate_invalid_skill_returns_exit_one(tmp_path):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text("---\nname: INVALID\ndescription: A test skill\n---\nBody\n")
    result = CliRunner().invoke(main, ["validate", str(skill_dir)])
    assert result.exit_code == 1
    assert "Validation failed" in result.output


def test_read_properties_outputs_json(tmp_path):
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["read-properties", str(skill_dir)])
    assert result.exit_code == 0
    payload = json.loads(result.output)
    assert payload["name"] == "my-skill"
    assert payload["description"] == "A test skill"


def test_read_properties_error_path(tmp_path):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    result = CliRunner().invoke(main, ["read-properties", str(skill_dir)])
    assert result.exit_code == 1
    assert "SKILL.md not found" in result.output


def test_to_prompt_outputs_xml(tmp_path):
    skill_dir = tmp_path / "my-skill"
    _write_skill(skill_dir)
    result = CliRunner().invoke(main, ["to-prompt", str(skill_dir)])
    assert result.exit_code == 0
    assert "<available_skills>" in result.output
    assert "<name>\nmy-skill\n</name>" in result.output


def test_to_prompt_error_path(tmp_path):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    result = CliRunner().invoke(main, ["to-prompt", str(skill_dir)])
    assert result.exit_code == 1
    assert "SKILL.md not found" in result.output
