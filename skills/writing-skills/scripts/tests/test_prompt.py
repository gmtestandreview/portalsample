"""Tests for prompt module."""

import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

from skills_ref.errors import ParseError, SkillError
from skills_ref.prompt import to_prompt


def _required_text(element: ET.Element, path: str) -> str:
    text = element.findtext(path)
    assert text is not None, f"Missing XML text at {path}"
    return text.strip()


def test_empty_list():
    result = to_prompt([])
    assert result == "<available_skills>\n</available_skills>"


def test_single_skill(tmp_path: Path):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text("""---
name: my-skill
description: A test skill
---
Body
""")
    result = to_prompt([skill_dir])
    assert "<available_skills>" in result
    assert "</available_skills>" in result
    assert "<name>\nmy-skill\n</name>" in result
    assert "<description>\nA test skill\n</description>" in result
    assert "<location>" in result
    assert "SKILL.md" in result


def test_multiple_skills(tmp_path: Path):
    skill_a = tmp_path / "skill-a"
    skill_a.mkdir()
    (skill_a / "SKILL.md").write_text("""---
name: skill-a
description: First skill
---
Body
""")

    skill_b = tmp_path / "skill-b"
    skill_b.mkdir()
    (skill_b / "SKILL.md").write_text("""---
name: skill-b
description: Second skill
---
Body
""")

    result = to_prompt([skill_a, skill_b])
    assert result.count("<skill>") == 2
    assert result.count("</skill>") == 2
    assert "skill-a" in result
    assert "skill-b" in result


def test_special_characters_escaped(tmp_path: Path):
    """XML special characters in description are escaped."""
    skill_dir = tmp_path / "special-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text("""---
name: special-skill
description: Use <foo> & <bar> tags
---
Body
""")
    result = to_prompt([skill_dir])
    assert "&lt;foo&gt;" in result
    assert "&amp;" in result
    assert "&lt;bar&gt;" in result
    assert "<foo>" not in result
    assert "<bar>" not in result


def test_name_special_characters_escaped(tmp_path: Path):
    skill_dir = tmp_path / "special-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text("""---
name: rock&roll
description: A test skill
---
Body
""")
    result = to_prompt([skill_dir])
    assert "rock&amp;roll" in result
    assert "rock&roll" not in result


def test_location_special_characters_escaped(tmp_path: Path):
    skill_dir = tmp_path / "skill&docs" / "my-skill"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text("""---
name: my-skill
description: A test skill
---
Body
""")
    result = to_prompt([skill_dir])
    assert "skill&amp;docs" in result
    assert "skill&docs" not in result


def test_missing_skill_file_raises_parse_error(tmp_path: Path):
    skill_dir = tmp_path / "missing-skill"
    skill_dir.mkdir()
    with pytest.raises(ParseError, match="SKILL.md not found"):
        to_prompt([skill_dir])


def test_prompt_roundtrips_xml_values_and_locations(tmp_path: Path):
    skill_dir = tmp_path / "skill&docs" / "my-skill"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text(
        "---\nname: my-skill\ndescription: Use <foo> & more\n---\nBody",
        encoding="utf-8",
    )
    root = ET.fromstring(to_prompt([skill_dir]))
    assert root.tag == "available_skills"
    skills = root.findall("skill")
    assert len(skills) == 1
    assert _required_text(skills[0], "name") == "my-skill"
    assert _required_text(skills[0], "description") == "Use <foo> & more"
    assert _required_text(skills[0], "location") == str(skill_dir.resolve() / "SKILL.md")


@pytest.mark.parametrize("escape", [r"\x01", r"\uD800", r"\uFFFE"])
def test_prompt_rejects_xml_forbidden_unicode(tmp_path: Path, escape: str):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        f'---\nname: my-skill\ndescription: "{escape}"\n---\nBody',
        encoding="utf-8",
    )
    with pytest.raises(SkillError):
        to_prompt([skill_dir])


@pytest.mark.parametrize(
    "escaped,expected",
    [(r"one\rtwo", "one\rtwo"), (r"one\r\ntwo", "one\r\ntwo"), (r"one\ntwo", "one\ntwo")],
)
def test_prompt_preserves_yaml_line_endings_as_xml_text(
    tmp_path: Path, escaped: str, expected: str
):
    skill_dir = tmp_path / "my-skill"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        f'---\nname: my-skill\ndescription: "{escaped}"\n---\nBody',
        encoding="utf-8",
    )
    root = ET.fromstring(to_prompt([skill_dir]))
    assert _required_text(root, "skill/description") == expected
