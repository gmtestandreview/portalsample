"""Tests for skill data models."""

from skills_ref.models import SkillProperties


def test_to_dict_copies_metadata():
    props = SkillProperties(
        name="my-skill",
        description="A test skill",
        metadata={"author": "Test Author"},
    )

    result = props.to_dict()
    metadata = result["metadata"]
    assert isinstance(metadata, dict)

    metadata["author"] = "Changed Author"

    assert props.metadata == {"author": "Test Author"}
