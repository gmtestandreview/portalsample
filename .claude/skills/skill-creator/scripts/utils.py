"""Shared utilities for skill-creator scripts."""

from pathlib import Path

_BLOCK_SCALAR_MARKERS = frozenset({">", "|", ">-", "|-"})


def _is_frontmatter_delimiter(line: str) -> bool:
    """Return whether *line* is an unindented YAML frontmatter delimiter."""
    return line == line.lstrip() and line.rstrip() == "---"


def _strip_block_indentation(lines: list[str]) -> list[str]:
    """Remove the common YAML block-scalar indentation from non-blank lines."""
    non_blank = [line for line in lines if line.strip()]
    if not non_blank:
        return [""] * len(lines)

    indentation = min(len(line) - len(line.lstrip(" \t")) for line in non_blank)
    return [line[indentation:] if line.strip() else "" for line in lines]


def _fold_block_scalar(lines: list[str]) -> str:
    """Fold a basic YAML ``>`` scalar while preserving paragraph breaks."""
    if not lines:
        return ""

    parts: list[str] = []
    previous_blank = False
    for line in lines:
        if not line:
            if parts and not previous_blank:
                parts.append("\n")
            previous_blank = True
            continue

        if parts and not previous_blank and not parts[-1].endswith("\n"):
            parts.append(" ")
        parts.append(line)
        previous_blank = False

    return "".join(parts).rstrip("\n")


def _parse_block_scalar(
    frontmatter_lines: list[str],
    start_index: int,
    marker: str,
) -> tuple[str, int]:
    """Parse a supported YAML block scalar and return its value and next index."""
    continuation_lines: list[str] = []
    index = start_index

    while index < len(frontmatter_lines):
        line = frontmatter_lines[index]
        if line and not line[0].isspace():
            break
        continuation_lines.append(line)
        index += 1

    normalized = _strip_block_indentation(continuation_lines)
    value = "\n".join(normalized) if marker.startswith("|") else _fold_block_scalar(normalized)

    # ``parse_skill_md`` historically returned descriptions without the
    # block scalar's final YAML line break. Keep that compatibility while
    # preserving meaningful internal newlines.
    return value.rstrip("\n"), index


def parse_skill_md(skill_path: Path) -> tuple[str, str, str]:
    """Parse a SKILL.md file, returning (name, description, full_content)."""
    content = (skill_path / "SKILL.md").read_text(encoding="utf-8")
    lines = content.split("\n")

    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md missing frontmatter (no opening ---)")

    end_idx: int | None = None
    for index, line in enumerate(lines[1:], start=1):
        if _is_frontmatter_delimiter(line):
            end_idx = index
            break

    if end_idx is None:
        raise ValueError("SKILL.md missing frontmatter (no closing ---)")

    name = ""
    description = ""
    frontmatter_lines = lines[1:end_idx]
    index = 0
    while index < len(frontmatter_lines):
        line = frontmatter_lines[index]
        if line.startswith("name:"):
            name = line[len("name:") :].strip().strip('"').strip("'")
        elif line.startswith("description:"):
            value = line[len("description:") :].strip()
            if value in _BLOCK_SCALAR_MARKERS:
                description, index = _parse_block_scalar(
                    frontmatter_lines,
                    index + 1,
                    value,
                )
                continue
            description = value.strip('"').strip("'")
        index += 1

    return name, description, content
