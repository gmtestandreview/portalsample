#!/usr/bin/env python3
"""
Consistency checker for A Team.

Truth sources:
  Skill count  - number of SKILL.md files in skills/*/
  Agent count  - number of .md files in .claude/agents/
  Version      - latest ## [x.y.z] entry in CHANGELOG.md
  Pack roster  - packs.json (names, repos, versions, skill/agent counts)

Run: python scripts/check_consistency.py
Exit 0 = all checks passed. Exit 1 = at least one mismatch.

Cross-repo drift (packs.json vs the live builder-* GitHub repos) is
checked separately by scripts/check_packs_remote.py in the packs-sync
workflow — this script stays offline.
"""

import io
import json
import re
import sys
from pathlib import Path
from typing import TypedDict, cast

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

REPO_ROOT = Path(__file__).parent.parent

NUMBER_WORDS = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
}

README = "README.md"
CLAUDE = "CLAUDE.md"
INDEX = "docs/index.html"
OVERVIEW = "docs/overview.md"
CLAUDE_PLUGIN = ".claude-plugin/plugin.json"
MARKETPLACE = ".claude-plugin/marketplace.json"
CODEX_PLUGIN = ".codex-plugin/plugin.json"
CURSOR_PLUGIN = ".cursor-plugin/plugin.json"
COPILOT_PLUGIN = ".copilot-plugin/plugin.json"
CITATION = "CITATION.cff"

ENFORCED_WORKFLOW_SKILLS = r"(\d+) enforced workflow skills"
SPECIALIST_AGENTS = r"(\d+) specialist agents"
PRECONFIGURED_SPECIALISTS = r"(\d+) pre-configured specialists"
TEAM_VERSION = r"# A Team[^\n]*v(\d+\.\d+\.\d+)"
PLUGIN_VERSION = r'"version":\s*"(\d+\.\d+\.\d+)"'

Check = tuple[str, str, str]


class Pack(TypedDict):
    name: str
    repo: str
    version: str
    skills: int
    agents: int
    pages: str


class PacksData(TypedDict):
    packs: list[Pack]


class MarketplaceEntry(TypedDict):
    name: str
    version: str
    repository: str
    description: str


class MarketplaceData(TypedDict):
    description: str
    plugins: list[MarketplaceEntry]


def count_skills() -> int:
    return len(list(REPO_ROOT.glob("skills/*/SKILL.md")))


def count_agents() -> int:
    return len(list(REPO_ROOT.glob(".claude/agents/*.md")))


def changelog_version() -> str:
    text = (REPO_ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    m = re.search(r"^## \[(\d+\.\d+\.\d+)\]", text, re.MULTILINE)
    if not m:
        raise SystemExit("ERROR: no version found in CHANGELOG.md")
    return m.group(1)


def load_packs() -> list[Pack]:
    data = cast(
        PacksData,
        json.loads((REPO_ROOT / "packs.json").read_text(encoding="utf-8")),
    )
    return data["packs"]


# (relative_path, regex_with_one_capture_group, human_label)
SKILL_COUNT_CHECKS = [
    (README, r"\*\*(\d+) workflow skills\*\* that gate", "README bullet list"),
    (README, r"← (\d+) workflow skill modules", "README directory tree"),
    (README, r"## Skill Library \((\d+)\)", "README section heading"),
    (CLAUDE, r"← (\d+) workflow skill modules", "CLAUDE.md directory tree"),
    (CLAUDE, r"## Skill Library \((\d+)\)", "CLAUDE.md section heading"),
    (INDEX, r"(\d+) enforced workflows", "index.html hero paragraph"),
    (INDEX, r'hero-stat-n n-purple">(\d+)<', "index.html hero stat skill count"),
    (INDEX, ENFORCED_WORKFLOW_SKILLS, "index.html FAQ answer"),
    (INDEX, r"· (\d+) skills ·", "index.html footer"),
    (CLAUDE_PLUGIN, ENFORCED_WORKFLOW_SKILLS, "claude plugin.json description"),
    (MARKETPLACE, ENFORCED_WORKFLOW_SKILLS, "marketplace.json a-team description"),
    (CODEX_PLUGIN, ENFORCED_WORKFLOW_SKILLS, "codex plugin.json description"),
    (CURSOR_PLUGIN, ENFORCED_WORKFLOW_SKILLS, "cursor plugin.json description"),
    (COPILOT_PLUGIN, ENFORCED_WORKFLOW_SKILLS, "copilot plugin.json description"),
    (CITATION, ENFORCED_WORKFLOW_SKILLS, "CITATION.cff summary"),
    (OVERVIEW, r"SKILL LAYER — (\d+) skills", "overview.md diagram label"),
]

AGENT_COUNT_CHECKS = [
    (README, r"team of (\d+) specialists", "README intro paragraph"),
    (README, r"\*\*(\d+) specialist agents\*\*", "README bullet list"),
    (README, r"← (\d+) agent profiles", "README directory tree"),
    (README, r"## Agent Roster \((\d+)\)", "README section heading"),
    (CLAUDE, r"team of (\d+) specialists", "CLAUDE.md intro paragraph"),
    (CLAUDE, r"← (\d+) agent profiles", "CLAUDE.md directory tree"),
    (CLAUDE, r"## Agent Roster \((\d+)\)", "CLAUDE.md section heading"),
    (INDEX, r"(\d+) specialists, a lead orchestrator", "index.html hero paragraph"),
    (INDEX, r'hero-stat-n n-blue">(\d+)<', "index.html hero stat agent count"),
    (INDEX, r"(\d+) specialists — each with one clear", "index.html comparison row"),
    (INDEX, r"(\d+) specialists\. One team\.", "index.html agents heading"),
    (INDEX, r"installs (\d+) specialist AI agents", "index.html FAQ answer"),
    (INDEX, r"all (\d+) agents\?", "index.html FAQ summary"),
    (INDEX, r"· (\d+) agents ·", "index.html footer"),
    (OVERVIEW, SPECIALIST_AGENTS, "overview.md comparison label"),
    (OVERVIEW, r"SPECIALIST AGENTS — (\d+) total", "overview.md diagram label"),
    (OVERVIEW, r"## The (\d+) Agents at a Glance", "overview.md section heading"),
    (CLAUDE_PLUGIN, SPECIALIST_AGENTS, "claude plugin.json description"),
    (MARKETPLACE, SPECIALIST_AGENTS, "marketplace.json a-team description"),
    (CODEX_PLUGIN, PRECONFIGURED_SPECIALISTS, "codex plugin.json description"),
    (CURSOR_PLUGIN, PRECONFIGURED_SPECIALISTS, "cursor plugin.json description"),
    (COPILOT_PLUGIN, PRECONFIGURED_SPECIALISTS, "copilot plugin.json description"),
    (CITATION, r"provides (\d+) specialist agents", "CITATION.cff summary"),
]

VERSION_CHECKS = [
    (README, TEAM_VERSION, "README title heading"),
    ("AGENTS.md", TEAM_VERSION, "AGENTS.md title heading"),
    (CLAUDE, TEAM_VERSION, "CLAUDE.md title heading"),
    (INDEX, r'nav-logo-badge">v(\d+\.\d+\.\d+)<', "index.html nav badge"),
    (INDEX, r"A Team v(\d+\.\d+\.\d+) —", "index.html footer span"),
    (INDEX, r"MIT License · v(\d+\.\d+\.\d+) ·", "index.html footer MIT line"),
    (CODEX_PLUGIN, PLUGIN_VERSION, "codex plugin.json version field"),
    (CURSOR_PLUGIN, PLUGIN_VERSION, "cursor plugin.json version field"),
    (COPILOT_PLUGIN, PLUGIN_VERSION, "copilot plugin.json version field"),
    (CITATION, r'^version:\s*"(\d+\.\d+\.\d+)"', "CITATION.cff version field"),
]

PLATFORM_COUNT_CHECKS = [
    (INDEX, r'hero-stat-n n-cyan">(\d+)<', "index.html hero platform count"),
    (INDEX, r"· (\d+) platforms", "index.html footer platform count"),
]


def run_checks(checks: list[Check], expected: str) -> list[str]:
    errors: list[str] = []
    for filepath, pattern, desc in checks:
        path = REPO_ROOT / filepath
        if not path.exists():
            errors.append(f"MISSING  {filepath} ({desc}): file not found")
            continue
        text = path.read_text(encoding="utf-8")
        matches = list(re.finditer(pattern, text, re.MULTILINE))
        if not matches:
            errors.append(f"MISSING  {filepath} ({desc}): pattern not found in file")
            continue
        for m in matches:
            found = m.group(1)
            if found != str(expected):
                errors.append(
                    f"MISMATCH {filepath} ({desc}): found {found!r}, expected {str(expected)!r}"
                )
    return errors


def check_marketplace_entries(packs: list[Pack], market: MarketplaceData) -> tuple[list[str], int]:
    """Check the marketplace roster, versions, repositories, and counts."""
    errors: list[str] = []
    names = {pack["name"] for pack in packs}
    entries = {entry["name"]: entry for entry in market["plugins"] if entry["name"] != "a-team"}
    checks = 1
    if set(entries) != names:
        errors.append(
            f"ROSTER   marketplace.json: packs {sorted(set(entries))} != packs.json {sorted(names)}"
        )
    for pack in packs:
        entry = entries.get(pack["name"])
        if entry is None:
            continue
        counts = f"{pack['skills']} skills and {pack['agents']} agents"
        checks += 3
        if entry.get("version") != pack["version"]:
            errors.append(
                f"MISMATCH marketplace.json ({pack['name']} version): "
                f"found {entry.get('version')!r}, expected {pack['version']!r}"
            )
        if entry.get("repository") != pack["repo"]:
            errors.append(
                f"MISMATCH marketplace.json ({pack['name']} repository): "
                f"found {entry.get('repository')!r}, expected {pack['repo']!r}"
            )
        if counts not in entry.get("description", ""):
            errors.append(
                f"MISMATCH marketplace.json ({pack['name']} description): "
                f"expected it to contain {counts!r}"
            )
    return errors, checks


def check_marketplace_description(
    packs: list[Pack], market: MarketplaceData
) -> tuple[list[str], int]:
    """Check the registry description's pack count."""
    errors: list[str] = []
    word = NUMBER_WORDS.get(len(packs))
    checks = 1
    if word and f"{word} domain builder packs" not in market.get("description", ""):
        errors.append(
            f"MISMATCH marketplace.json (registry description): "
            f"expected {word!r} domain builder packs for {len(packs)} packs"
        )
    return errors, checks


def check_readme_packs(packs: list[Pack], readme: str) -> tuple[list[str], int]:
    """Check the README's linked domain pack roster."""
    errors: list[str] = []
    names = {pack["name"] for pack in packs}
    readme_names: set[str] = set(
        re.findall(
            r"\*\*\[(builder-[a-z-]+)\]\(https://github\.com/RBraga01/",
            readme,
        )
    )
    checks = 1
    if readme_names != names:
        errors.append(
            f"ROSTER   README.md domain packs: {sorted(readme_names)} != packs.json {sorted(names)}"
        )
    return errors, checks


def check_index_packs(packs: list[Pack], index: str) -> tuple[list[str], int]:
    """Check the index page's ecosystem cards."""
    errors: list[str] = []
    names = {pack["name"] for pack in packs}
    card_names: set[str] = set(re.findall(r'class="ack-name">(builder-[a-z-]+)<', index))
    checks = 1
    if card_names != names:
        errors.append(
            f"ROSTER   docs/index.html ecosystem cards: {sorted(card_names)} != "
            f"packs.json {sorted(names)}"
        )
    for pack in packs:
        counts = f"{pack['skills']} skills and {pack['agents']} agents"
        checks += 2
        if pack["pages"] not in index:
            errors.append(
                f"MISSING  docs/index.html ({pack['name']} card): "
                f"pages link {pack['pages']} not found"
            )
        if counts not in index:
            errors.append(
                f"MISMATCH docs/index.html ({pack['name']} card): "
                f"expected {counts!r} somewhere on the page"
            )
    return errors, checks


def check_packs() -> tuple[list[str], int]:
    """Enforce packs.json against README.md, docs/index.html, and marketplace.json.

    Returns (errors, number_of_checks_performed).
    """
    packs = load_packs()
    readme = (REPO_ROOT / README).read_text(encoding="utf-8")
    index = (REPO_ROOT / INDEX).read_text(encoding="utf-8")
    market = cast(
        MarketplaceData,
        json.loads((REPO_ROOT / MARKETPLACE).read_text(encoding="utf-8")),
    )

    errors: list[str] = []
    checks = 0
    for check_errors, check_count in (
        check_marketplace_entries(packs, market),
        check_marketplace_description(packs, market),
        check_readme_packs(packs, readme),
        check_index_packs(packs, index),
    ):
        errors.extend(check_errors)
        checks += check_count
    return errors, checks


def main() -> int:
    actual_skills = count_skills()
    actual_agents = count_agents()
    actual_version = changelog_version()
    packs = load_packs()

    print(
        f"Truth: {actual_agents} agents  |  {actual_skills} skills  |  "
        f"v{actual_version}  |  {len(packs)} packs"
    )
    print()

    skill_errors = run_checks(SKILL_COUNT_CHECKS, str(actual_skills))
    agent_errors = run_checks(AGENT_COUNT_CHECKS, str(actual_agents))
    version_errors = run_checks(VERSION_CHECKS, actual_version)
    platform_errors = run_checks(PLATFORM_COUNT_CHECKS, "5")
    pack_errors, pack_checks = check_packs()

    all_errors = skill_errors + agent_errors + version_errors + platform_errors + pack_errors

    if all_errors:
        print(f"Found {len(all_errors)} consistency error(s):\n")
        for e in all_errors:
            print(f"  {e}")
        print()
        print("Fix the mismatches above and re-run.")
        return 1

    total = (
        len(SKILL_COUNT_CHECKS)
        + len(AGENT_COUNT_CHECKS)
        + len(VERSION_CHECKS)
        + len(PLATFORM_COUNT_CHECKS)
        + pack_checks
    )
    print(f"All {total} checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
