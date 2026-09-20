"""Data models for Agent Skills."""

from dataclasses import dataclass, field

SkillPropertyValue = str | dict[str, str]


def _empty_metadata() -> dict[str, str]:
    return {}


@dataclass
class SkillProperties:
    """Properties parsed from a skill's SKILL.md frontmatter.

    Attributes:
        name: Skill name in kebab-case (required)
        description: What the skill does and when the model should use it (required)
        license: License for the skill (optional)
        compatibility: Compatibility information for the skill (optional)
        allowed_tools: Tool patterns the skill requires (optional, experimental)
        metadata: Key-value pairs for client-specific properties (defaults to
            empty dict; omitted from to_dict() output when empty)
    """

    name: str
    description: str
    license: str | None = None
    compatibility: str | None = None
    allowed_tools: str | None = None
    metadata: dict[str, str] = field(default_factory=_empty_metadata)

    def to_dict(self) -> dict[str, SkillPropertyValue]:
        """Convert to dictionary, excluding None values."""
        result: dict[str, SkillPropertyValue] = {
            "name": self.name,
            "description": self.description,
        }
        if self.license is not None:
            result["license"] = self.license
        if self.compatibility is not None:
            result["compatibility"] = self.compatibility
        if self.allowed_tools is not None:
            result["allowed-tools"] = self.allowed_tools
        if self.metadata:
            result["metadata"] = dict(self.metadata)
        return result
