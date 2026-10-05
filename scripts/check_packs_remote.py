#!/usr/bin/env python3
"""
Cross-repo pack drift checker for A Team.

Compares packs.json (the local truth for the builder-* domain packs)
against the LIVE state of the builder-* repositories on GitHub:

  1. Roster    - the set of public, non-archived builder-* repos must
                 equal the packs listed in packs.json
  2. Counts    - skills (skills/*/SKILL.md) and agents (.claude/agents/*.md)
                 counted from each repo's file tree must match packs.json
  3. Version   - each repo's .claude-plugin/plugin.json version must
                 match packs.json
  4. Description - if a repo's GitHub description advertises counts
                 ("N skills and M agents"), they must match packs.json

Run: python scripts/check_packs_remote.py
Uses GITHUB_TOKEN from the environment when available (recommended in CI;
unauthenticated calls work but are rate-limited).

Exit 0 = no drift. Exit 1 = drift detected (report on stdout).
"""

import base64
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, TypedDict, cast

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

REPO_ROOT = Path(__file__).parent.parent
API = "https://api.github.com"

SKILL_PATH_RE = re.compile(r"^skills/[^/]+/SKILL[.]md$")
AGENT_PATH_RE = re.compile(r"^\.claude/agents/[^/]+[.]md$")


class Pack(TypedDict):
    name: str
    skills: int
    agents: int
    version: str


class PacksFile(TypedDict):
    owner: str
    packs: list[Pack]


class Repository(TypedDict):
    name: str
    archived: bool
    private: bool
    default_branch: str
    description: str | None


class TreeEntry(TypedDict):
    path: str


class TreeResponse(TypedDict):
    tree: list[TreeEntry]


class ContentResponse(TypedDict):
    content: str


class PluginManifest(TypedDict, total=False):
    version: str


def _find_counts(description: str) -> tuple[str, str, str] | None:
    marker = " skills and "
    suffix = " agents"
    search_start = 0

    while (skills_end := description.find(marker, search_start)) != -1:
        skills_start = skills_end
        while skills_start > 0 and "0" <= description[skills_start - 1] <= "9":
            skills_start -= 1

        agents_start = skills_end + len(marker)
        agents_end = agents_start
        while agents_end < len(description) and "0" <= description[agents_end] <= "9":
            agents_end += 1

        if (
            skills_start < skills_end
            and agents_start < agents_end
            and description.startswith(suffix, agents_end)
        ):
            return (
                description[skills_start : agents_end + len(suffix)],
                description[skills_start:skills_end],
                description[agents_start:agents_end],
            )

        search_start = skills_end + len(marker)

    return None


def gh_api(path: str) -> dict[str, Any] | list[dict[str, Any]]:
    req = urllib.request.Request(f"{API}{path}")
    req.add_header("Accept", "application/vnd.github+json")
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def load_packs() -> tuple[str, list[Pack]]:
    data = cast(
        PacksFile,
        json.loads((REPO_ROOT / "packs.json").read_text(encoding="utf-8")),
    )
    return data["owner"], data["packs"]


def _live_repositories(repos: list[Repository]) -> dict[str, Repository]:
    return {
        repo["name"]: repo
        for repo in repos
        if repo["name"].startswith("builder-") and not repo["archived"] and not repo["private"]
    }


def _roster_errors(live: dict[str, Repository], expected: dict[str, Pack]) -> list[str]:
    if set(live) == set(expected):
        return []

    errors: list[str] = []
    missing = sorted(set(expected) - set(live))
    unknown = sorted(set(live) - set(expected))
    if missing:
        errors.append(f"ROSTER   packs listed in packs.json but not live on GitHub: {missing}")
    if unknown:
        errors.append(f"ROSTER   live builder-* repos missing from packs.json: {unknown}")
    return errors


def _check_file_tree(owner: str, name: str, pack: Pack, branch: str) -> list[str]:
    try:
        tree = cast(
            TreeResponse,
            gh_api(f"/repos/{owner}/{name}/git/trees/{branch}?recursive=1"),
        )
        paths = [entry["path"] for entry in tree.get("tree", [])]
    except urllib.error.URLError as e:
        return [f"ERROR    {name}: could not read file tree: {e}"]

    errors: list[str] = []
    skills = sum(1 for path in paths if SKILL_PATH_RE.match(path))
    agents = sum(1 for path in paths if AGENT_PATH_RE.match(path))
    if skills != pack["skills"]:
        errors.append(
            f"DRIFT    {name}: repo has {skills} skills, packs.json says {pack['skills']}"
        )
    if agents != pack["agents"]:
        errors.append(
            f"DRIFT    {name}: repo has {agents} agents, packs.json says {pack['agents']}"
        )
    return errors


def _check_manifest(owner: str, name: str, pack: Pack, branch: str) -> list[str]:
    try:
        blob = cast(
            ContentResponse,
            gh_api(f"/repos/{owner}/{name}/contents/.claude-plugin/plugin.json?ref={branch}"),
        )
        manifest = cast(
            PluginManifest,
            json.loads(base64.b64decode(blob["content"]).decode("utf-8")),
        )
        if manifest.get("version") != pack["version"]:
            return [
                f"DRIFT    {name}: manifest version {manifest.get('version')!r}, "
                f"packs.json says {pack['version']!r}"
            ]
    except (urllib.error.URLError, KeyError, ValueError) as e:
        return [f"ERROR    {name}: could not read .claude-plugin/plugin.json: {e}"]
    return []


def _check_description(repo: Repository, pack: Pack) -> list[str]:
    desc = repo.get("description") or ""
    match = _find_counts(desc)
    if match and (int(match[1]) != pack["skills"] or int(match[2]) != pack["agents"]):
        return [
            f"DRIFT    {repo['name']}: GitHub description says '{match[0]}', "
            f"repo truth is {pack['skills']} skills and {pack['agents']} agents"
        ]
    return []


def _check_repository(owner: str, name: str, pack: Pack, repo: Repository) -> list[str]:
    branch = repo["default_branch"]
    errors = _check_file_tree(owner, name, pack, branch)
    if any(error.startswith("ERROR") for error in errors):
        return errors
    errors.extend(_check_manifest(owner, name, pack, branch))
    errors.extend(_check_description(repo, pack))
    return errors


def main() -> int:
    owner, packs = load_packs()
    expected = {pack["name"]: pack for pack in packs}

    try:
        repos = cast(list[Repository], gh_api(f"/users/{owner}/repos?per_page=100"))
    except urllib.error.URLError as e:
        print(f"ERROR: could not reach GitHub API: {e}")
        return 1

    live = _live_repositories(repos)
    errors = _roster_errors(live, expected)

    for name in sorted(set(live) & set(expected)):
        pack = expected[name]
        repo = live[name]
        errors.extend(_check_repository(owner, name, pack, repo))

    if errors:
        print(f"Found {len(errors)} pack drift issue(s):\n")
        for e in errors:
            print(f"  {e}")
        print()
        print("Update packs.json (and the surfaces check_consistency.py enforces),")
        print("or fix the builder-* repo, so both sides agree.")
        return 1

    print(f"All {len(expected)} packs in sync with live GitHub state")
    return 0


if __name__ == "__main__":
    sys.exit(main())
