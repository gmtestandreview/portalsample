"""Tests for package-level public API exports and integration contracts."""

from pathlib import Path

import pytest

from skills_ref import read_properties, to_prompt, validate
from skills_ref.errors import ParseError


def test_package_exports_documented_api():
    assert callable(validate)
    assert callable(read_properties)
    assert callable(to_prompt)


def test_public_api_integration_for_valid_skill(tmp_path: Path):
    skill = tmp_path / "my-skill"
    skill.mkdir()
    (skill / "SKILL.md").write_text(
        "---\nname: my-skill\ndescription: Use for a specific example\n---\n# Instructions\n",
        encoding="utf-8",
    )

    assert validate(skill) == []
    properties = read_properties(skill)
    assert properties.name == "my-skill"
    assert properties.description == "Use for a specific example"
    prompt = to_prompt([skill])
    assert "<name>\nmy-skill\n</name>" in prompt
    assert "<description>\nUse for a specific example\n</description>" in prompt
    assert str(skill / "SKILL.md") in prompt


def test_public_api_rejects_missing_skill(tmp_path: Path):
    absent = tmp_path / "missing-skill"
    assert validate(absent) == [f"Path does not exist: {absent}"]
    with pytest.raises(ParseError, match="SKILL.md not found"):
        read_properties(absent)
    with pytest.raises(ParseError, match="SKILL.md not found"):
        to_prompt([absent])
