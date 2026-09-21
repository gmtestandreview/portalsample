#!/usr/bin/env python3
"""Behavioral probe for a skill's early-exit instruction.

``run_eval`` only measures whether a skill *triggers*, and its isolated skill
body is a stub, so it cannot show what the model does once a skill has loaded
on an off-topic request. This probe copies the real skill into an isolated
Claude project, tells the model to use it for a request, and checks whether the
model then engages the skill's workflow (reads its references/agents or runs its
scripts) or exits early.

A control case that should engage the workflow keeps a "no engagement" result
from passing when the probe is simply blind.

Usage:
    python -m scripts.run_early_exit_eval --skill-path . \
        --cases evals/early-exit-cases.json --runs-per-query 3
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import TYPE_CHECKING, cast

if TYPE_CHECKING:
    from scripts import run_eval
else:
    try:
        from scripts import run_eval
    except ModuleNotFoundError as exc:
        if exc.name != "scripts":
            raise
        import run_eval

# Development artifacts that are not part of the skill a user would install.
IGNORED_NAMES = (
    ".remember",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    "__pycache__",
    "node_modules",
    "evals",
    "Regression tests",
)
# Tool-input fragments that show the skill's workflow resources were used.
WORKFLOW_MARKERS = (
    "references/",
    "references\\",
    "agents/",
    "agents\\",
    "scripts/",
    "scripts\\",
    "scripts.",
)
SKILL_LOAD_TOOL = "Skill"
ENGAGEMENT_THRESHOLD = 0.5
DEFAULT_RUNS_PER_QUERY = 3
DEFAULT_TIMEOUT_SECONDS = 120
STDERR_PREVIEW_CHARS = 300


def parse_stream(text: str) -> list[dict[str, object]]:
    """Parse stream-json output, skipping blank, malformed, and non-object lines."""
    events: list[dict[str, object]] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        try:
            event = json.loads(stripped)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            events.append(cast(dict[str, object], event))
    return events


def _tool_uses(event: Mapping[str, object]) -> list[Mapping[str, object]]:
    if event.get("type") != "assistant":
        return []
    message = event.get("message")
    if not isinstance(message, dict):
        return []
    content = cast(Mapping[str, object], message).get("content")
    if not isinstance(content, list):
        return []
    return [
        cast(Mapping[str, object], item)
        for item in content
        if isinstance(item, dict) and item.get("type") == "tool_use"
    ]


def _tool_input_text(tool_use: Mapping[str, object]) -> str:
    tool_input = tool_use.get("input")
    if not isinstance(tool_input, dict):
        return ""
    return " ".join(str(value) for value in cast(Mapping[str, object], tool_input).values())


def engaged_workflow(events: Sequence[Mapping[str, object]]) -> bool:
    """Return whether any tool call touched the skill's references, agents, or scripts."""
    for event in events:
        for tool_use in _tool_uses(event):
            if tool_use.get("name") == SKILL_LOAD_TOOL:
                continue
            text = _tool_input_text(tool_use)
            if any(marker in text for marker in WORKFLOW_MARKERS):
                return True
    return False


def copy_skill(skill_path: Path, project_root: Path) -> Path:
    """Copy the whole skill (minus development artifacts) into an isolated project."""
    destination = project_root / ".claude" / "skills" / skill_path.name
    shutil.copytree(skill_path, destination, ignore=shutil.ignore_patterns(*IGNORED_NAMES))
    return destination


def case_passes(
    *,
    expect_engaged: bool,
    engaged: int,
    completed: int,
    threshold: float = ENGAGEMENT_THRESHOLD,
) -> bool:
    """Judge one case: early-exit cases stay below the threshold, controls reach it."""
    if completed == 0:
        return False
    rate = engaged / completed
    return rate >= threshold if expect_engaged else rate < threshold


def _collect_output(process: subprocess.Popen[bytes], timeout: int) -> tuple[str, str]:
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        run_eval._terminate_process_tree(process)
        stdout, stderr = process.communicate()
    return stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")


def run_probe_once(
    query: str,
    skill_path: Path,
    timeout: int,
    model: str | None = None,
) -> bool:
    """Run one forced-use probe and return whether the skill workflow was engaged."""
    project_root = Path(tempfile.mkdtemp(prefix="skill-early-exit-"))
    try:
        copy_skill(skill_path, project_root)
        prompt = f"Use the {skill_path.name} skill to handle this request.\n\n{query}"
        process = run_eval._launch_claude(
            prompt,
            model,
            project_root,
            executable=run_eval._require_claude_cli(),
        )
        stdout, stderr = _collect_output(process, timeout)
        events = parse_stream(stdout)
        if not events:
            raise RuntimeError(f"claude produced no events: {stderr[:STDERR_PREVIEW_CHARS]!r}")
        return engaged_workflow(events)
    finally:
        run_eval._remove_temp_tree(project_root)


def _validate_cases(raw: object) -> list[tuple[str, bool]]:
    if not isinstance(raw, list) or not raw:
        raise ValueError("cases file must contain a non-empty JSON list")
    cases: list[tuple[str, bool]] = []
    for index, item in enumerate(raw):
        query = item.get("query") if isinstance(item, dict) else None
        expect = item.get("expect_engaged") if isinstance(item, dict) else None
        if not isinstance(query, str) or not query.strip() or not isinstance(expect, bool):
            raise ValueError(f"case {index} needs a non-empty 'query' and boolean 'expect_engaged'")
        cases.append((query, expect))
    return cases


def _run_case(
    query: str,
    expect_engaged: bool,
    skill_path: Path,
    runs: int,
    timeout: int,
    model: str | None,
) -> dict[str, object]:
    outcomes: list[bool] = []
    errors: list[str] = []
    for _ in range(runs):
        try:
            outcomes.append(run_probe_once(query, skill_path, timeout, model))
        except (OSError, RuntimeError, subprocess.SubprocessError, ValueError) as exc:
            errors.append(str(exc))
    engaged = sum(outcomes)
    return {
        "query": query,
        "expect_engaged": expect_engaged,
        "engaged": engaged,
        "completed_runs": len(outcomes),
        "execution_errors": len(errors),
        "error_messages": errors,
        "pass": not errors
        and case_passes(expect_engaged=expect_engaged, engaged=engaged, completed=len(outcomes)),
    }


def run_cases(
    raw_cases: object,
    skill_path: Path,
    runs: int = DEFAULT_RUNS_PER_QUERY,
    timeout: int = DEFAULT_TIMEOUT_SECONDS,
    model: str | None = None,
) -> dict[str, object]:
    """Run every case serially (rate-limit friendly) and summarize."""
    cases = _validate_cases(raw_cases)
    results = [
        _run_case(query, expect, skill_path, runs, timeout, model) for query, expect in cases
    ]
    passed = sum(1 for result in results if result["pass"] is True)
    return {
        "skill": skill_path.name,
        "results": results,
        "summary": {"total": len(results), "passed": passed, "failed": len(results) - passed},
    }


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Probe a skill's early-exit behavior")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--cases", required=True, help="JSON list of {query, expect_engaged}")
    parser.add_argument("--runs-per-query", type=int, default=DEFAULT_RUNS_PER_QUERY)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--model", default=None)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    skill_path = Path(cast(str, args.skill_path)).resolve()
    if not (skill_path / "SKILL.md").is_file():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        return 1
    try:
        raw_cases = json.loads(Path(cast(str, args.cases)).read_text(encoding="utf-8"))
        output = run_cases(
            raw_cases,
            skill_path,
            runs=cast(int, args.runs_per_query),
            timeout=cast(int, args.timeout),
            model=cast(str | None, args.model),
        )
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(output, indent=2, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
