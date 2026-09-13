#!/usr/bin/env python3
"""Validate an Agent Skill directory against the supplied core specification."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import yaml

ALLOWED_PROPERTIES = {
    "name",
    "description",
    "license",
    "compatibility",
    "metadata",
    "allowed-tools",
}


def is_valid_skill_name(name: str) -> bool:
    if not 1 <= len(name) <= 64:
        return False
    if name.startswith("-") or name.endswith("-") or "--" in name:
        return False
    for char in name:
        if char == "-":
            continue
        if not char.isalnum():
            return False
        if char.isalpha() and char != char.lower():
            return False
    return True


def validate_skill(skill_path: str | Path) -> tuple[bool, str]:
    """Validate SKILL.md frontmatter and the name/directory contract."""
    skill_path = Path(skill_path).resolve()
    skill_md = skill_path / "SKILL.md"
    if not skill_md.is_file():
        return False, "SKILL.md not found"

    try:
        content = skill_md.read_text(encoding="utf-8")
    except OSError as exc:
        return False, f"Cannot read SKILL.md: {exc}"

    match = re.match(r"^---\r?\n(.*?)\r?\n---(?:\r?\n|$)", content, re.DOTALL)
    if not match:
        return False, "SKILL.md must begin with YAML frontmatter delimited by ---"

    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        return False, f"Invalid YAML frontmatter: {exc}"
    if not isinstance(frontmatter, dict):
        return False, "Frontmatter must be a YAML mapping"

    unexpected = set(frontmatter) - ALLOWED_PROPERTIES
    if unexpected:
        return False, (
            "Unexpected frontmatter key(s): "
            + ", ".join(sorted(map(str, unexpected)))
            + ". Allowed: "
            + ", ".join(sorted(ALLOWED_PROPERTIES))
        )

    for required in ("name", "description"):
        if required not in frontmatter:
            return False, f"Missing required frontmatter field: {required}"

    name = frontmatter["name"]
    if not isinstance(name, str) or not name.strip():
        return False, "name must be a non-empty string"
    name = name.strip()
    if not is_valid_skill_name(name):
        return False, (
            "name must be 1-64 Unicode lowercase alphanumeric/hyphen characters, "
            "with no leading, trailing, or consecutive hyphens"
        )
    if skill_path.name != name:
        return False, f"name '{name}' must match parent directory '{skill_path.name}'"

    description = frontmatter["description"]
    if not isinstance(description, str) or not description.strip():
        return False, "description must be a non-empty string"
    if len(description) > 1024:
        return False, f"description is too long ({len(description)} > 1024 characters)"

    if "compatibility" in frontmatter:
        compatibility = frontmatter["compatibility"]
        if not isinstance(compatibility, str) or not compatibility.strip():
            return False, "compatibility must be a non-empty string when provided"
        if len(compatibility) > 500:
            return (
                False,
                f"compatibility is too long ({len(compatibility)} > 500 characters)",
            )

    if "metadata" in frontmatter:
        metadata = frontmatter["metadata"]
        if not isinstance(metadata, dict):
            return False, "metadata must be a mapping"
        for key, value in metadata.items():
            if not isinstance(key, str) or not isinstance(value, str):
                return False, "metadata keys and values must be strings"

    if "license" in frontmatter:
        license_value = frontmatter["license"]
        if not isinstance(license_value, str) or not license_value.strip():
            return False, "license must be a non-empty string when provided"

    if "allowed-tools" in frontmatter:
        allowed_tools = frontmatter["allowed-tools"]
        if isinstance(allowed_tools, str):
            if not allowed_tools.strip():
                return False, "allowed-tools must be non-empty when provided"
        elif isinstance(allowed_tools, list):
            if not allowed_tools or not all(
                isinstance(tool, str) and tool.strip() for tool in allowed_tools
            ):
                return (
                    False,
                    "allowed-tools list entries must be non-empty strings",
                )
        else:
            return False, "allowed-tools must be a string or list of strings"

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
