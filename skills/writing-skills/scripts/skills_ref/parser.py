"""YAML frontmatter parsing for SKILL.md files."""

import re
from pathlib import Path
from typing import Any

import strictyaml

from .errors import ParseError, ValidationError
from .models import SkillProperties

# Opening and closing delimiters must each be a whole line of exactly ``---``.
_FRONTMATTER_RE = re.compile(
    r"\A---[ \t]*\r?\n(?P<frontmatter>.*?)^---[ \t]*(?:\r?\n|\Z)(?P<body>.*)",
    re.DOTALL | re.MULTILINE,
)


def find_skill_md(skill_dir: Path) -> Path | None:
    """Find the exact-cased SKILL.md file in a skill directory.

    Args:
        skill_dir: Path to the skill directory

    Returns:
        Path to SKILL.md, or None if the exact-cased file is not found
    """
    skill_dir = Path(skill_dir)
    if not skill_dir.is_dir():
        return None

    for child in skill_dir.iterdir():
        if child.is_file() and child.name == "SKILL.md":
            return child
    return None


def read_skill_text(skill_md: Path) -> str:
    """Read SKILL.md as UTF-8, reporting I/O and decoding failures as ParseError."""
    try:
        return skill_md.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as e:
        raise ParseError(f"Cannot read {skill_md} as UTF-8: {e}") from e


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """Parse YAML frontmatter from SKILL.md content.

    Args:
        content: Raw content of SKILL.md file

    Returns:
        Tuple of (metadata dict, markdown body)

    Raises:
        ParseError: If frontmatter is missing or invalid
    """
    first_line = next(iter(content.splitlines()), "")
    if first_line.rstrip() != "---":
        raise ParseError("SKILL.md must start with YAML frontmatter (---)")

    match = _FRONTMATTER_RE.match(content)
    if match is None:
        raise ParseError("SKILL.md frontmatter not properly closed with ---")

    frontmatter_str = match.group("frontmatter")
    body = match.group("body").strip()

    try:
        parsed = strictyaml.load(frontmatter_str)
        metadata = parsed.data
    except strictyaml.YAMLError as e:
        raise ParseError(f"Invalid YAML in frontmatter: {e}") from e

    if not isinstance(metadata, dict):
        raise ParseError("SKILL.md frontmatter must be a YAML mapping")

    return metadata, body


def read_properties(skill_dir: Path) -> SkillProperties:
    """Read skill properties from SKILL.md frontmatter.

    This function parses the frontmatter and returns properties.
    It does NOT perform full validation. Use validate() for that.

    Args:
        skill_dir: Path to the skill directory

    Returns:
        SkillProperties with parsed metadata

    Raises:
        ParseError: If SKILL.md is missing or has invalid YAML
        ValidationError: If required fields (name, description) are missing
    """
    skill_dir = Path(skill_dir)
    skill_md = find_skill_md(skill_dir)

    if skill_md is None:
        raise ParseError(f"SKILL.md not found in {skill_dir}")

    metadata, _ = parse_frontmatter(read_skill_text(skill_md))

    if "name" not in metadata:
        raise ValidationError("Missing required field in frontmatter: name")
    if "description" not in metadata:
        raise ValidationError("Missing required field in frontmatter: description")

    name = metadata["name"]
    description = metadata["description"]

    if not isinstance(name, str) or not name.strip():
        raise ValidationError("Field 'name' must be a non-empty string")
    if not isinstance(description, str) or not description.strip():
        raise ValidationError("Field 'description' must be a non-empty string")

    return SkillProperties(
        name=name.strip(),
        description=description.strip(),
        license=metadata.get("license"),
        compatibility=metadata.get("compatibility"),
        allowed_tools=metadata.get("allowed-tools"),
        metadata=metadata.get("metadata", {}),
    )
