"""YAML frontmatter parsing for SKILL.md files."""

import re
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import cast

import strictyaml

from .errors import ParseError, ValidationError
from .models import SkillProperties

# Opening and closing delimiters must each be a whole line of exactly ``---``.
_FRONTMATTER_RE = re.compile(
    r"\A---\r?\n(?P<frontmatter>.*?)^---(?:\r?\n|\Z)(?P<body>.*)",
    re.DOTALL | re.MULTILINE,
)

# XML 1.0 text must also be UTF-8 encodable. Reject escaped YAML values that
# decode to controls, surrogate code points, or the two forbidden BMP values.
_FORBIDDEN_UNICODE_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\ud800-\udfff\ufffe\uffff]")
_RAW_YAML_CONTROL_RE = re.compile(r"[\x7f-\x84\x86-\x9f]")


def ensure_safe_unicode(value: object) -> None:
    """Reject text that cannot safely be used as UTF-8 XML prompt content."""
    pending: list[object] = [value]
    while pending:
        item = pending.pop()
        if isinstance(item, str) and _FORBIDDEN_UNICODE_RE.search(item):
            raise ParseError("Invalid YAML: forbidden Unicode character in skill text")
        if isinstance(item, dict):
            mapping = cast(Mapping[object, object], item)
            pending.extend(mapping.keys())
            pending.extend(mapping.values())
        elif isinstance(item, list):
            pending.extend(cast(Sequence[object], item))


def find_skill_md(skill_dir: Path) -> Path | None:
    """Find the exact-cased SKILL.md file in a skill directory.

    Args:
        skill_dir: Path to the skill directory

    Returns:
        Path to SKILL.md, or None if the exact-cased file is not found
    """
    skill_dir = Path(skill_dir)
    try:
        if not skill_dir.is_dir():
            return None

        for child in skill_dir.iterdir():
            if child.is_file() and child.name == "SKILL.md":
                return child
    except OSError as e:
        raise ParseError(f"Cannot inspect skill directory {skill_dir}: {e}") from e
    return None


def read_skill_text(skill_md: Path) -> str:
    """Read SKILL.md as UTF-8, reporting I/O and decoding failures as ParseError."""
    try:
        return skill_md.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as e:
        raise ParseError(f"Cannot read {skill_md} as UTF-8: {e}") from e


def parse_frontmatter(content: str) -> tuple[dict[str, object], str]:
    """Parse YAML frontmatter from SKILL.md content.

    Args:
        content: Raw content of SKILL.md file

    Returns:
        Tuple of (metadata dict, markdown body)

    Raises:
        ParseError: If frontmatter is missing or invalid
    """
    first_line = next(iter(content.splitlines()), "")
    if first_line != "---":
        raise ParseError("SKILL.md must start with YAML frontmatter (---)")

    match = _FRONTMATTER_RE.match(content)
    if match is None:
        raise ParseError("SKILL.md frontmatter not properly closed with ---")

    frontmatter_str = match.group("frontmatter")
    body = match.group("body").strip()

    # Strictyaml's raw ReaderError branch can itself raise AttributeError for
    # these characters. Reject them before entering the third-party parser.
    ensure_safe_unicode(frontmatter_str)
    if _RAW_YAML_CONTROL_RE.search(frontmatter_str):
        raise ParseError("Invalid YAML: forbidden raw control character in frontmatter")

    try:
        parsed_data: object = strictyaml.load(frontmatter_str).data
    except strictyaml.YAMLError as e:
        raise ParseError(f"Invalid YAML in frontmatter: {e}") from e
    except (ValueError, OverflowError) as e:
        # The YAML scanner's chr() may reject an out-of-range \U escape before
        # it creates a YAMLError. Python 3.11 can raise OverflowError here.
        raise ParseError("Invalid YAML value in frontmatter") from e
    except RecursionError as e:
        raise ParseError("Invalid YAML: frontmatter nesting is too deep") from e

    if not isinstance(parsed_data, dict):
        raise ParseError("SKILL.md frontmatter must be a YAML mapping")

    parsed_mapping = cast(Mapping[object, object], parsed_data)
    ensure_safe_unicode(parsed_mapping)
    metadata: dict[str, object] = {}
    for key, value in parsed_mapping.items():
        if not isinstance(key, str):
            raise ParseError("SKILL.md frontmatter keys must be strings")
        metadata[key] = value
    return metadata, body


def _optional_string(metadata: Mapping[str, object], field: str) -> str | None:
    """Narrow an optional scalar while distinguishing absence from invalid data."""
    if field not in metadata:
        return None
    value = metadata[field]
    if not isinstance(value, str):
        raise ValidationError(f"Field '{field}' must be a string")
    return value


def _string_metadata(value: object) -> dict[str, str]:
    """Validate client-specific metadata before constructing the typed model."""
    if not isinstance(value, dict):
        raise ValidationError("Field 'metadata' must be a mapping")
    result: dict[str, str] = {}
    for key, item in cast(Mapping[object, object], value).items():
        if not isinstance(key, str) or not isinstance(item, str):
            raise ValidationError("Field 'metadata' keys and values must be strings")
        result[key] = item
    return result


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

    license_value = _optional_string(metadata, "license")
    compatibility = _optional_string(metadata, "compatibility")
    allowed_tools = _optional_string(metadata, "allowed-tools")
    extra_metadata = _string_metadata(metadata.get("metadata", {}))

    return SkillProperties(
        name=name.strip(),
        description=description.strip(),
        license=license_value,
        compatibility=compatibility,
        allowed_tools=allowed_tools,
        metadata=extra_metadata,
    )
