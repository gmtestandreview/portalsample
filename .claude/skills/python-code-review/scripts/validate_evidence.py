#!/usr/bin/env python3
"""Validate the structure and trace support of current skill evaluation records.

This validator cannot run agents or establish model adherence.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RECORD = ROOT / "evals/current-revision-pressure/run-record.json"
CASES = ROOT / "evals/cases.json"
SKILL = ROOT / "SKILL.md"
VALID = {"PASS", "AMBER", "FAIL", "NHR", "N/A"}


def _validate_trace_paths(cid: str, arm: str, paths: list[str], problems: list[str]) -> None:
    for name in paths:
        target = (RECORD.parent / name).resolve()
        if not target.is_relative_to(RECORD.parent.resolve()) or not target.is_file():
            problems.append(f"{cid}/{arm}: missing or escaping trace {name!r}")


def _validate_arm(cid: str, arm: str, value: dict[str, Any], problems: list[str]) -> None:
    state = value.get("status")
    if state not in VALID:
        problems.append(f"{cid}/{arm}: invalid status")
    paths: list[str] | dict[str, Any] | str | int | float | bool | None = value.get(
        "evidence_paths", []
    )
    if not isinstance(paths, list):
        problems.append(f"{cid}/{arm}: evidence_paths must be list")
        return
    if state in {"PASS", "AMBER", "FAIL"} and (not value.get("observation") or not paths):
        problems.append(f"{cid}/{arm}: graded status without observation and trace")
    if state == "N/A" and not value.get("observation"):
        problems.append(f"{cid}/{arm}: N/A needs rationale")
    _validate_trace_paths(cid, arm, paths, problems)


def _validate_case(
    cid: str, row: dict[str, Any], source: dict[str, Any], problems: list[str]
) -> None:
    for key in ("prompt", "expected", "kind", "required"):
        if row.get(key) != source.get(key):
            problems.append(f"{cid}: mismatched frozen {key}")
    for arm in ("without_skill", "with_skill"):
        _validate_arm(cid, arm, row.get(arm, {}), problems)


def _validate_cases(
    rows: list[dict[str, Any]], expected: dict[str, dict[str, Any]], problems: list[str]
) -> None:
    seen: set[str] = set()
    for row in rows:
        cid = row.get("id")
        if cid not in expected or cid in seen:
            problems.append(f"Unknown or duplicated case: {cid!r}")
            continue
        seen.add(cid)
        _validate_case(cid, row, expected[cid], problems)
    for missing in sorted(set(expected) - seen):
        problems.append(f"Missing case: {missing}")


def main() -> int:
    problems: list[str] = []
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    cases = json.loads(CASES.read_text(encoding="utf-8"))["cases"]
    digest = hashlib.sha256(SKILL.read_bytes()).hexdigest()
    if record.get("candidate_sha256") != digest:
        problems.append("SKILL.md hash differs from run record; new evaluation required")
    expected = {c["id"]: c for c in cases}
    rows = record.get("cases", [])
    _validate_cases(rows, expected, problems)
    required_unresolved = [
        row["id"]
        for row in rows
        if row.get("required") and row.get("with_skill", {}).get("status") != "PASS"
    ]
    if problems:
        print("INVALID evidence record:")
        for problem in problems:
            print(" -", problem)
        return 1
    print(f"VALID schema/trace pointers: {len(rows)} cases; SKILL hash {digest}")
    print(f"Required cases without behavioral PASS: {len(required_unresolved)}")
    print("Behavioral assessment and deployment approval: NOT established by this validator")
    return 0


if __name__ == "__main__":
    sys.exit(main())
