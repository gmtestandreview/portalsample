#!/usr/bin/env python3
"""Validate the checked-in A Team roster and Codex project installation.

Run: python scripts/roster.py
Exit 0 = the active roster and project skill installation are consistent.
Exit 1 = one or more roster or installation checks failed.
"""

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast
from urllib.parse import urlparse

import tomllib

REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
TEAM_FILE = Path(".agent-sync") / "TEAM.md"
ACTIVE_AGENTS = "Active Agents"
ACTIVE_SKILLS = "Active Skills"
ACTIVE_SECTION = re.compile(
    rf"^## ({re.escape(ACTIVE_AGENTS)}|{re.escape(ACTIVE_SKILLS)}) \((\d+)\)$"
)
MARKDOWN_HEADING = re.compile(r"^#{1,6}(?:\s|$)")


@dataclass(frozen=True)
class RosterSection:
    declared_count: int
    names: tuple[str, ...]


def _parse_active_heading(stripped: str) -> tuple[str, int] | None:
    heading = ACTIVE_SECTION.fullmatch(stripped)
    if heading is None:
        return None
    section_name = heading.group(1)
    declared_count = heading.group(2)
    if section_name is None or declared_count is None:
        return None
    return section_name, int(declared_count)


def _start_section(
    sections: dict[str, tuple[int, list[str]]],
    errors: list[str],
    section_name: str,
    declared_count: int,
) -> str | None:
    if section_name in sections:
        errors.append(f"DUPLICATE .agent-sync/TEAM.md section: {section_name}")
        return None
    sections[section_name] = (declared_count, [])
    return section_name


def _parse_table_name(stripped: str) -> str | None:
    if not stripped.startswith("|"):
        return None
    cells = [cell.strip() for cell in stripped.strip("|").split("|")]
    if len(cells) < 2:
        return None
    name = cells[0].strip("`").strip()
    if not name or name in {"Agent", "Skill"} or re.fullmatch(r"-+", name):
        return None
    return name


def _parse_team_file(team_file: Path) -> tuple[dict[str, RosterSection], list[str]]:
    sections: dict[str, tuple[int, list[str]]] = {}
    errors: list[str] = []
    current: str | None = None

    for line in team_file.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        heading = _parse_active_heading(stripped)
        if heading is not None:
            section_name, declared_count = heading
            current = _start_section(sections, errors, section_name, declared_count)
            continue
        if MARKDOWN_HEADING.match(stripped):
            current = None
            continue
        if current is None:
            continue
        name = _parse_table_name(stripped)
        if name is None:
            continue
        sections[current][1].append(name)

    return (
        {
            name: RosterSection(declared_count, tuple(names))
            for name, (declared_count, names) in sections.items()
        },
        errors,
    )


def _check_section(root: Path, section_name: str, section: RosterSection | None) -> list[str]:
    if section is None:
        return [f"MISSING .agent-sync/TEAM.md section: {section_name}"]

    errors: list[str] = []
    if section.declared_count != len(section.names):
        errors.append(
            f"MISMATCH {section_name} count: heading declares "
            f"{section.declared_count}, table contains {len(section.names)}"
        )

    seen: set[str] = set()
    for name in section.names:
        if name in seen:
            errors.append(f"DUPLICATE {section_name} entry: {name}")
        seen.add(name)
        if "/" in name or "\\" in name or name in {".", ".."}:
            errors.append(f"INVALID {section_name} entry: {name}")
            continue

        if section_name == ACTIVE_AGENTS:
            expected = root / ".claude" / "agents" / f"{name}.md"
            label = "agent file"
        else:
            expected = root / "skills" / name / "SKILL.md"
            label = "skill file"
        resolved_root = root.resolve()
        resolved_expected = expected.resolve(strict=False)
        if expected.is_symlink() or resolved_root not in resolved_expected.parents:
            errors.append(f"INVALID {label} path outside repository: {expected.relative_to(root)}")
        elif not expected.is_file():
            errors.append(f"MISSING {label}: {expected.relative_to(root)}")

    return errors


def _has_valid_tokensave_config(config: dict[str, Any]) -> bool:
    servers_value = config.get("mcp_servers")
    if not isinstance(servers_value, dict):
        return False
    servers = cast(dict[str, Any], servers_value)
    tokensave_value: object = servers.get("tokensave")
    if not isinstance(tokensave_value, dict):
        return False
    tokensave = cast(dict[str, Any], tokensave_value)

    command = tokensave.get("command")
    if isinstance(command, str) and command.strip():
        return True

    url = tokensave.get("url")
    if not isinstance(url, str):
        return False
    parsed = urlparse(url.strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _source_file_error(root: Path, path: Path, label: str) -> str | None:
    resolved_root = root.resolve()
    if path.is_symlink() or resolved_root not in path.resolve(strict=False).parents:
        return f"INVALID {label} path outside repository"
    if not path.is_file():
        return f"MISSING {label}"
    return None


def _load_team_sections(root: Path) -> tuple[dict[str, RosterSection], list[str], bool]:
    team_file = root / TEAM_FILE
    source_error = _source_file_error(root, team_file, str(TEAM_FILE))
    if source_error is not None:
        return {}, [source_error], False

    try:
        sections, errors = _parse_team_file(team_file)
        return sections, errors, True
    except (OSError, UnicodeError) as error:
        return {}, [f"UNREADABLE {TEAM_FILE}: {error}"], False


def _check_codex_config(root: Path) -> list[str]:
    config_file = root / ".codex" / "config.toml"
    source_error = _source_file_error(root, config_file, ".codex/config.toml")
    if source_error is not None:
        return [source_error]

    try:
        config: dict[str, Any] = tomllib.loads(config_file.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, tomllib.TOMLDecodeError) as error:
        return [f"UNREADABLE .codex/config.toml: {error}"]
    if not _has_valid_tokensave_config(config):
        return ["MISSING .codex/config.toml section: mcp_servers.tokensave"]
    return []


def check_roster(root: Path = REPOSITORY_ROOT) -> tuple[list[str], int, int]:
    """Return roster errors and the parsed active agent and skill counts."""
    sections, errors, loaded = _load_team_sections(root)
    if not loaded:
        return errors, 0, 0

    agents = sections.get(ACTIVE_AGENTS)
    skills = sections.get(ACTIVE_SKILLS)

    errors.extend(_check_section(root, ACTIVE_AGENTS, agents))
    errors.extend(_check_section(root, ACTIVE_SKILLS, skills))
    errors.extend(_check_codex_config(root))

    return (
        errors,
        len(agents.names) if agents else 0,
        len(skills.names) if skills else 0,
    )


def _verify(root: Path) -> int:
    errors, agent_count, skill_count = check_roster(root)
    if errors:
        for error in errors:
            print(f"ROSTER ERROR: {error}")
        return 1

    print(
        f"ROSTER OK: {agent_count} active agents, {skill_count} active skills; "
        "Codex project files installed"
    )
    return 0


def _check_named(root: Path, kind: str, name: str) -> int:
    errors, _, _ = check_roster(root)
    if errors:
        for error in errors:
            print(f"ROSTER ERROR: {error}")
        return 1

    sections, _ = _parse_team_file(root / TEAM_FILE)
    section_name = ACTIVE_AGENTS if kind == "Agent" else ACTIVE_SKILLS
    if name not in sections[section_name].names:
        print(f"ROSTER ERROR: inactive {kind.lower()}: {name}")
        return 1
    print(f"ROSTER OK: active {kind.lower()} installed: {name}")
    return 0


def main(root: Path | None = None, argv: list[str] | None = None) -> int:
    if root is not None and argv is None:
        return _verify(root)

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPOSITORY_ROOT)
    subparsers = parser.add_subparsers(dest="command")
    subparsers.add_parser("verify", help="validate the complete active roster")
    check = subparsers.add_parser("check", help="check one active agent or skill")
    check.add_argument("kind", choices=("Agent", "Skill"))
    check.add_argument("name")
    args = parser.parse_args(argv)
    project_root = root or args.root
    if args.command == "check":
        return _check_named(project_root, args.kind, args.name)
    return _verify(project_root)


if __name__ == "__main__":
    raise SystemExit(main(argv=None))
