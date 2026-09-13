"""Regression tests for writing-skills activation metadata."""

from pathlib import Path

from skills_ref import read_properties, to_prompt


def _writing_skills_dir():
    return Path(__file__).resolve().parents[2]


def test_description_covers_called_writing_skills_alias():
    props = read_properties(_writing_skills_dir())

    assert "called writing skills" in props.description.lower()


def test_prompt_exposes_called_writing_skills_alias():
    result = to_prompt([_writing_skills_dir()])

    assert "called writing skills" in result.lower()
