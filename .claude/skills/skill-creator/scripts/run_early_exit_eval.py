#!/usr/bin/env python3
"""Run bounded early-exit behavioral cases."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import TypedDict, cast

try:
    from scripts.eval_control import (
        AttemptSpec,
        CachedResult,
        CheckpointStore,
        ClaudeCliError,
        EvaluationControl,
        validate_model_id,
    )
    from scripts.run_red_green_eval import run_claude
except ModuleNotFoundError:
    if str(Path(__file__).resolve().parent) not in sys.path:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
    from eval_control import (
        AttemptSpec,
        CachedResult,
        CheckpointStore,
        ClaudeCliError,
        EvaluationControl,
        validate_model_id,
    )
    from run_red_green_eval import run_claude


class EarlyExitCase(TypedDict):
    id: str
    query: str
    should_engage: bool


def _digest_skill(skill_root: Path) -> str:
    return hashlib.sha256((skill_root / "SKILL.md").read_bytes()).hexdigest()


def _cached_case_validator(expected: bool):
    def validate(result: CachedResult) -> str | None:
        outcome = "engaged" if expected else "not_engaged"
        if result.outcome != outcome:
            return f"cached outcome {result.outcome!r} does not match {outcome!r}"
        if result.payload is None or not isinstance(result.payload.get("engaged"), bool):
            return "cached early-exit payload is missing engaged"
        if result.payload["engaged"] != expected:
            return "cached early-exit payload has the wrong expected result"
        return None

    return validate


def _snapshot_dict(control: EvaluationControl) -> dict[str, object]:
    snapshot = control.snapshot()
    return {
        "planned_calls": snapshot.planned_calls,
        "attempted_calls": snapshot.attempted_calls,
        "resumed_calls": snapshot.resumed_calls,
        "successful_calls": snapshot.successful_calls,
        "error_calls": snapshot.error_calls,
        "skipped_calls": snapshot.skipped_calls,
    }


def _engaged_from_run_data(raw: object) -> bool:
    if isinstance(raw, dict):
        value = raw.get("engaged")
        if isinstance(value, bool):
            return value
        events = raw.get("events")
        if isinstance(events, list):
            for event in reversed(events):
                if isinstance(event, dict):
                    result = event.get("result")
                    if isinstance(result, str):
                        return result.strip().lower() in {"true", "engaged", "yes"}
    return False


def run_cases(
    cases: list[EarlyExitCase],
    *,
    skill_root: Path,
    output_dir: Path,
    model: str,
    control: EvaluationControl,
) -> dict[str, object]:
    """Evaluate cases in order, reusing only validated boolean checkpoint outcomes."""
    output_dir.mkdir(parents=True, exist_ok=True)
    content_digest = _digest_skill(skill_root)
    results: list[dict[str, object]] = []
    for index, case in enumerate(cases):
        spec = AttemptSpec(
            kind="early-exit",
            query=case["query"],
            run_index=index,
            skill_name=skill_root.name,
            skill_content_sha256=content_digest,
            model=model,
            claude_version="unknown",
            distractor_sha256="",
        )
        cached = control.consume_cached(spec, _cached_case_validator(case["should_engage"]))
        if cached is not None and cached.payload is not None:
            engaged = cast(bool, cached.payload["engaged"])
            results.append({**case, "engaged": engaged, "status": "resumed"})
            continue
        if not control.reserve_call(spec):
            control.mark_skipped(len(cases) - index)
            break
        try:
            run_data = run_claude(
                skill_root,
                output_dir / f"{index:03d}-transcript.jsonl",
                output_dir / f"{index:03d}-stderr.txt",
                prompt_text=case["query"],
            )
            engaged = _engaged_from_run_data(run_data)
            control.record_success(
                spec,
                CachedResult(
                    outcome="engaged" if engaged else "not_engaged",
                    payload={"engaged": engaged},
                ),
            )
        except ClaudeCliError as exc:
            control.record_error(spec, exc)
            results.append({**case, "status": "error", "error": str(exc)})
            if control.stop_reason == "rate_limited":
                control.mark_skipped(len(cases) - index - 1)
                break
            continue
        except BaseException as exc:
            control.record_error(spec, exc)
            results.append({**case, "status": "error", "error": str(exc)})
            continue
        results.append({
            **case,
            "engaged": engaged,
            "status": "complete",
            "pass": engaged == case["should_engage"],
        })

    return {
        "results": results,
        "execution": {
            **_snapshot_dict(control),
            "status": "complete" if len(results) == len(cases) else "partial",
            "stop_reason": control.stop_reason,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", required=True)
    parser.add_argument("--skill-root", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--max-model-calls", type=int, required=True)
    parser.add_argument("--checkpoint")
    parser.add_argument("--deadline-seconds", type=float)
    args = parser.parse_args()
    if args.max_model_calls <= 0:
        parser.error("max-model-calls must be positive")
    model = validate_model_id(args.model)
    cases = json.loads(Path(args.cases).read_text(encoding="utf-8"))
    if not isinstance(cases, list):
        parser.error("cases must be a JSON array")
    checkpoint = CheckpointStore(Path(args.checkpoint)) if args.checkpoint else None
    control = EvaluationControl(
        max_calls=args.max_model_calls,
        planned_calls=len(cases),
        checkpoint=checkpoint,
        deadline_seconds=args.deadline_seconds,
    )
    result = run_cases(
        cast(list[EarlyExitCase], cases),
        skill_root=Path(args.skill_root),
        output_dir=Path(args.output_dir),
        model=model,
        control=control,
    )
    print(json.dumps(result, indent=2))
    return 0 if result["execution"]["status"] == "complete" else 2


if __name__ == "__main__":
    raise SystemExit(main())
