"""Shared utilities for skill-creator scripts."""

from pathlib import Path
from typing import Protocol, cast

import yaml


class _DisposableLoader(Protocol):
    """The cleanup contract omitted by some PyYAML type stubs."""

    def dispose(self) -> None: ...


class _FrontmatterLoader(yaml.SafeLoader):
    """Retain the root node used to construct the metadata document."""

    frontmatter_node: yaml.Node | None = None

    def get_single_node(self) -> yaml.Node | None:
        self.frontmatter_node = super().get_single_node()
        return self.frontmatter_node


def _is_frontmatter_delimiter(line: str) -> bool:
    """Return whether *line* is an unindented YAML frontmatter delimiter."""
    return line == line.lstrip() and line.rstrip() == "---"


def _frontmatter_text(content: str) -> str:
    """Extract frontmatter without mistaking indented scalar data for its end."""
    lines = content.split("\n")

    if lines[0].strip() != "---":
        raise ValueError("SKILL.md missing frontmatter (no opening ---)")

    for index, line in enumerate(lines[1:], start=1):
        if _is_frontmatter_delimiter(line):
            return "\n".join(lines[1:index])

    raise ValueError("SKILL.md missing frontmatter (no closing ---)")


def _load_frontmatter(text: str) -> tuple[dict[object, object], yaml.Node | None]:
    """Construct one safe document and retain its resolved scalar styles."""
    try:
        loader = _FrontmatterLoader(text)
        try:
            loaded: object = loader.get_single_data()
            node = loader.frontmatter_node
        finally:
            # PyYAML cleanup returns None; older stubs leave it unknown.
            cast(_DisposableLoader, loader).dispose()
    except (
        yaml.YAMLError,
        ValueError,
        RecursionError,
        KeyError,
        AttributeError,
        IndexError,
    ) as exc:
        # PyYAML exception strings include source snippets. Expose only a
        # bounded diagnostic and numeric source location to callers.
        # Explicit malformed standard tags can also raise builtin errors.
        location = ""
        if isinstance(exc, yaml.MarkedYAMLError) and exc.problem_mark is not None:
            mark = exc.problem_mark
            location = f" at line {mark.line + 2}, column {mark.column + 1}"
        raise ValueError(f"Invalid YAML frontmatter{location}") from None

    # Preserve the reader's existing empty/missing-field defaults. Validation
    # of required metadata remains the responsibility of quick_validate.
    if loaded is None:
        return {}, node
    if not isinstance(loaded, dict):
        raise ValueError("SKILL.md frontmatter must be a YAML mapping")

    # Only the container is known here: arbitrary YAML keys/values remain
    # objects until the requested metadata fields pass their string checks.
    return cast(dict[object, object], loaded), node


def _description_is_block(node: yaml.Node | None) -> bool:
    """Inspect the effective description after SafeLoader flattens merges."""
    if not isinstance(node, yaml.MappingNode):
        return False

    # PyYAML MappingNode values are node pairs; its stubs leave this
    # representation incomplete. Narrow only this library-owned structure.
    entries = cast(list[tuple[yaml.Node, yaml.Node]], node.value)
    for key_node, value_node in reversed(entries):
        if key_node.value == "description":
            return isinstance(value_node, yaml.ScalarNode) and value_node.style in ("|", ">")
    return False


def parse_skill_md(skill_path: Path) -> tuple[str, str, str]:
    """Read metadata, returning (name, description, full_content).

    Missing fields default to empty strings; explicit nonstrings fail.
    Preserve YAML duplicate/merge precedence and quoted newline data,
    trimming trailing newlines only from block descriptions.
    """
    content = (skill_path / "SKILL.md").read_text(encoding="utf-8")
    frontmatter, node = _load_frontmatter(_frontmatter_text(content))
    name = frontmatter.get("name", "")
    description = frontmatter.get("description", "")
    if not isinstance(name, str) or not isinstance(description, str):
        raise ValueError("SKILL.md name and description must be strings")

    if _description_is_block(node):
        description = description.rstrip("\n")
    return name, description, content
