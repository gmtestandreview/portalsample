#!/usr/bin/env python3
"""Validate an Agent Skill directory against the supplied core specification."""

from __future__ import annotations

import argparse
import re
from collections.abc import Mapping
from pathlib import Path
from typing import NoReturn, cast

import yaml

ALLOWED_PROPERTIES = frozenset(
    {
        "name",
        "description",
        "license",
        "compatibility",
        "metadata",
        "allowed-tools",
    }
)
FRONTMATTER_PATTERN = re.compile(r"^---\r?\n(.*?)\r?\n---(?:\r?\n|$)", re.DOTALL)
# Skill names become directory names; these are device names on Windows, where
# creating or resolving them misbehaves, so they are rejected on every platform.
WINDOWS_RESERVED_NAMES = frozenset(
    {"con", "prn", "aux", "nul"}
    | {f"{device}{digit}" for device in ("com", "lpt") for digit in "123456789"}
)


class SkillValidationError(ValueError):
    """Raised internally when an Agent Skill fails validation."""


def _invalid(message: str) -> NoReturn:
    raise SkillValidationError(message)


def is_valid_skill_name(name: str) -> bool:
    """Return whether a skill name satisfies the core naming contract."""
    if not 1 <= len(name) <= 64:
        return False
    if name.startswith("-") or name.endswith("-") or "--" in name:
        return False
    if name in WINDOWS_RESERVED_NAMES:
        return False
    return all(
        char == "-" or (char.isalnum() and (not char.isalpha() or char == char.lower()))
        for char in name
    )


def _load_frontmatter(skill_md: Path) -> dict[object, object]:
    try:
        content = skill_md.read_text(encoding="utf-8")
    except OSError as exc:
        _invalid(f"Cannot read SKILL.md: {exc}")

    match = FRONTMATTER_PATTERN.match(content)
    if match is None:
        _invalid("SKILL.md must begin with YAML frontmatter delimited by ---")

    try:
        loaded: object = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        _invalid(f"Invalid YAML frontmatter: {exc}")

    if not isinstance(loaded, dict):
        _invalid("Frontmatter must be a YAML mapping")
    return cast(dict[object, object], loaded)


def _validate_keys(frontmatter: Mapping[object, object]) -> None:
    unexpected = set(frontmatter) - ALLOWED_PROPERTIES
    if unexpected:
        _invalid(
            "Unexpected frontmatter key(s): "
            + ", ".join(sorted(map(str, unexpected)))
            + ". Allowed: "
            + ", ".join(sorted(ALLOWED_PROPERTIES))
        )


def _required_string(frontmatter: Mapping[object, object], field: str) -> str:
    if field not in frontmatter:
        _invalid(f"Missing required frontmatter field: {field}")

    value = frontmatter[field]
    if not isinstance(value, str) or not value.strip():
        _invalid(f"{field} must be a non-empty string")
    return value


def _validate_optional_string(
    frontmatter: Mapping[object, object],
    field: str,
    *,
    max_length: int | None = None,
) -> None:
    if field not in frontmatter:
        return

    value = frontmatter[field]
    if not isinstance(value, str) or not value.strip():
        _invalid(f"{field} must be a non-empty string when provided")
    if max_length is not None and len(value) > max_length:
        _invalid(f"{field} is too long ({len(value)} > {max_length} characters)")


def _validate_metadata(frontmatter: Mapping[object, object]) -> None:
    if "metadata" not in frontmatter:
        return

    metadata = frontmatter["metadata"]
    if not isinstance(metadata, dict):
        _invalid("metadata must be a mapping")

    typed_metadata = cast(dict[object, object], metadata)
    if not all(
        isinstance(key, str) and isinstance(value, str) for key, value in typed_metadata.items()
    ):
        _invalid("metadata keys and values must be strings")


def _validate_allowed_tools(frontmatter: Mapping[object, object]) -> None:
    if "allowed-tools" not in frontmatter:
        return

    allowed_tools = frontmatter["allowed-tools"]
    if isinstance(allowed_tools, str):
        if not allowed_tools.strip():
            _invalid("allowed-tools must be non-empty when provided")
        return

    if isinstance(allowed_tools, list):
        tools = cast(list[object], allowed_tools)
        if tools and all(isinstance(tool, str) and bool(tool.strip()) for tool in tools):
            return
        _invalid("allowed-tools list entries must be non-empty strings")

    _invalid("allowed-tools must be a string or list of strings")


def _validate_frontmatter(frontmatter: Mapping[object, object], skill_path: Path) -> None:
    _validate_keys(frontmatter)

    name = _required_string(frontmatter, "name").strip()
    if name in WINDOWS_RESERVED_NAMES:
        _invalid(f"name '{name}' is a reserved Windows device name")
    if not is_valid_skill_name(name):
        _invalid(
            "name must be 1-64 Unicode lowercase alphanumeric/hyphen characters, "
            "with no leading, trailing, or consecutive hyphens"
        )
    if skill_path.name != name:
        _invalid(f"name '{name}' must match parent directory '{skill_path.name}'")

    description = _required_string(frontmatter, "description")
    if len(description) > 1024:
        _invalid(f"description is too long ({len(description)} > 1024 characters)")

    _validate_optional_string(frontmatter, "compatibility", max_length=500)
    _validate_metadata(frontmatter)
    _validate_optional_string(frontmatter, "license")
    _validate_allowed_tools(frontmatter)


def validate_skill(skill_path: str | Path) -> tuple[bool, str]:
    """Validate SKILL.md frontmatter and the name/directory contract."""
    resolved_skill_path = Path(skill_path).resolve()
    skill_md = resolved_skill_path / "SKILL.md"
    if not skill_md.is_file():
        return False, "SKILL.md not found"

    try:
        frontmatter = _load_frontmatter(skill_md)
        _validate_frontmatter(frontmatter, resolved_skill_path)
    except SkillValidationError as exc:
        return False, str(exc)

    return True, "Skill is valid"


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate an Agent Skill directory")
    parser.add_argument("skill_directory", type=Path)
    args = parser.parse_args()

    valid, message = validate_skill(args.skill_directory)
    print(message)
    raise SystemExit(0 if valid else 1)


if __name__ == "__main__":
    main()
