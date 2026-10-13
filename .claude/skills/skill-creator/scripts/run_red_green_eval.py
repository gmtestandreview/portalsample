#!/usr/bin/env python3
"""Run an independent RED/GREEN behavioral eval for skill-creator."""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, NoReturn, TypedDict, cast

try:
    from scripts.eval_control import (
        AttemptSpec,
        CachedResult,
        CheckpointStore,
        ClaudeCliError,
        EvaluationControl,
        validate_model_id,
    )
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

CLAUDE_DIR = ".claude"
CLAUDE_TIMEOUT_SECONDS = 360


def _reject_nonfinite_json_constant(value: str) -> NoReturn:
    """Reject NaN and infinities so stream events remain strict JSON."""
    raise ValueError(f"non-finite JSON constant is not allowed: {value}")

JsonValue = (
    bool
    | int
    | float
    | str
    | list["JsonValue"]
    | dict[str, "JsonValue"]
    | None
)
Event = dict[str, JsonValue]


class RunData(TypedDict):
    exit_code: int
    duration_seconds: float
    events: list[Event]
    stderr: str
    usage: dict[str, object]


class CaseSummary(TypedDict):
    label: str
    exit_code: int
    duration_seconds: float
    skill_used: bool
    stale_reference_remaining: bool
    evaluation_reference_linked: bool
    mentions_nhr: bool
    mentions_production_ready: bool
    package_check_mentioned: bool
    inventory: list[str]
    final_result: str


TASK_PROMPT = """You are in an isolated project containing target-skill/.

target-skill/ is an Agent Skill directory that should be release-ready, but it has grown messy:
its SKILL.md is too long, some evaluation guidance is duplicated, one relative reference is stale,
and there is a packaging script.

Audit and revise target-skill for release. Work directly in the files. Preserve unique domain
guidance, move bulky examples or schemas out of SKILL.md when that improves progressive disclosure,
fix broken references, run available validation or packaging checks when appropriate, and finish
with a concise release-readiness verdict that separates observed evidence from unavailable evidence.
"""

BASE_SKILL_MD = """---
name: incident-review
description: >-
  Use when writing incident review reports for payment API outages, including timelines,
  customer impact, root-cause analysis, remediation owners, and evidence handling.
---

# Incident Review

Use this skill when preparing or revising incident review reports for payment API outages.

## Required Outcome

Produce a concise incident review with:

- summary;
- customer impact;
- timeline;
- root cause;
- contributing factors;
- remediation owners;
- evidence appendix;
- follow-up validation.

## Workflow

1. Gather the incident timeline.
2. Identify affected customer groups.
3. Separate root cause from contributing factors.
4. Assign remediation owners.
5. Validate that follow-up actions have owners and dates.
6. Add evidence links.

## Release Readiness Note

Before sharing this skill, check `references/missing-eval.md` for the latest eval criteria.

## Evaluation Guidance

Run one without-skill baseline and one with-skill pass. Compare whether the skill improves
separation of root cause and contributing factors. Mark missing evidence as Needs Human Review.

## Duplicated Evaluation Guidance

Run one without-skill baseline and one with-skill pass. Compare whether the skill improves
separation of root cause and contributing factors. Mark missing evidence as Needs Human Review.

## Verbose Example Library

Example 1: Payment API outage caused by an expired upstream certificate. The review should
distinguish certificate rotation ownership from alerting coverage.

Example 2: Payment API outage caused by retry storms. The review should distinguish client retry
behavior from backend queue saturation.

Example 3: Payment API outage caused by database failover. The review should distinguish failover
duration from stale connection pool handling.

## JSON Schema

```json
{
  "type": "object",
  "required": ["summary", "timeline", "rootCause", "remediations"],
  "properties": {
    "summary": {"type": "string"},
    "timeline": {"type": "array", "items": {"type": "string"}},
    "rootCause": {"type": "string"},
    "remediations": {"type": "array", "items": {"type": "string"}}
  }
}
```

## Domain Guidance

Never treat a customer-impact estimate as confirmed unless the source system, query window, and
deduplication method are recorded. If impact is inferred, label it as inferred.
"""

EVALUATION_REFERENCE = """# Incident Review Evaluation

Compare without-skill and with-skill outputs on:

- root cause separated from contributing factors;
- remediation owners and dates;
- evidence source quality;
- unavailable evidence called out explicitly.

Missing production incident data must be marked Needs Human Review.
"""

PACKAGE_SCRIPT = """#!/usr/bin/env python3
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
skill_md = root / "SKILL.md"
text = skill_md.read_text(encoding="utf-8")
missing = []
for ref in re.findall(r"`(references/[^`]+)`", text):
    if not (root / ref).exists():
        missing.append(ref)
if missing:
    print("Missing references: " + ", ".join(missing))
    sys.exit(1)
print("Package check passed")
"""


def create_fixture(root: Path) -> None:
    target = root / "target-skill"
    (target / "references").mkdir(parents=True)
    (target / "scripts").mkdir()
    (target / "SKILL.md").write_text(BASE_SKILL_MD, encoding="utf-8")
    (target / "references" / "evaluation.md").write_text(EVALUATION_REFERENCE, encoding="utf-8")
    package_script = target / "scripts" / "package_skill.py"
    package_script.write_text(PACKAGE_SCRIPT, encoding="utf-8")


def copy_candidate_skill(candidate: Path, project_root: Path) -> None:
    destination = project_root / CLAUDE_DIR / "skills" / "skill-creator"

    def ignore(_dir: str, names: list[str]) -> set[str]:
        return {
            name
            for name in names
            if name in {"__pycache__", ".pytest_cache"} or name == "runs"
        }

    shutil.copytree(candidate, destination, ignore=ignore)


def run_claude(
    project_root: Path,
    transcript_path: Path,
    result_path: Path,
    prompt_text: str = TASK_PROMPT,
    *,
    control: EvaluationControl | None = None,
    spec: AttemptSpec | None = None,
) -> RunData:
    if control is not None and spec is None:
        raise ValueError("a controller requires an attempt specification")
    if control is not None and spec is not None:
        if not control.reserve_call(spec):
            raise RuntimeError(f"behavioral call unavailable: {control.stop_reason}")

    prompt = " ".join(prompt_text.split())
    cmd = [
        shutil.which("claude") or "claude",
        "-p",
        prompt,
        "--output-format",
        "stream-json",
        "--verbose",
        "--include-partial-messages",
        "--setting-sources",
        "project",
        "--permission-mode",
        "acceptEdits",
        "--allowedTools",
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
        "PowerShell",
        "Skill",
    ]

    # REMEMBER_NESTED_SUMMARIZER makes the Remember plugin's hooks no-op in this
    # throwaway session, so parallel evals do not contend for its save lock.
    env = {
        **{k: v for k, v in os.environ.items() if k != "CLAUDECODE"},
        "REMEMBER_NESTED_SUMMARIZER": "1",
    }
    started = time.monotonic()
    with transcript_path.open("w", encoding="utf-8") as transcript:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(project_root),
            env=env,
            text=True,
            shell=False,
            start_new_session=(os.name != "nt"),
        )
        try:
            stdout, stderr = process.communicate(timeout=CLAUDE_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired as exc:
            _terminate_process_tree(process)
            stdout, stderr = process.communicate()
            transcript.write(stdout or "")
            result_path.write_text(stderr or "", encoding="utf-8")
            error = TimeoutError(
                f"claude run exceeded {CLAUDE_TIMEOUT_SECONDS}s"
            )
            if control is not None and spec is not None:
                control.record_error(spec, error)
            raise error from exc
        transcript.write(stdout or "")

    result_path.write_text(stderr or "", encoding="utf-8")
    events: list[Event] = []
    for line in stdout.splitlines():
        try:
            parsed = cast(
                JsonValue,
                json.loads(
                    line,
                    parse_constant=_reject_nonfinite_json_constant,
                ),
            )
        except ValueError:
            continue
        if not isinstance(parsed, dict):
            continue
        try:
            _result_event_decision(parsed)
        except ClaudeCliError as exc:
            if control is not None and spec is not None:
                control.record_error(spec, exc)
            raise
        events.append(parsed)

    exit_code = process.returncode
    if exit_code is None:
        raise RuntimeError("claude process did not exit after communicate()")

    run_data = {
        "exit_code": exit_code,
        "duration_seconds": round(time.monotonic() - started, 2),
        "events": events,
        "stderr": stderr,
        "usage": _extract_usage(events),
    }
    if control is not None and spec is not None:
        if exit_code != 0:
            error = RuntimeError(f"claude exited with status {exit_code}")
            control.record_error(spec, error)
        else:
            control.record_success(
                spec,
                CachedResult(
                    outcome="engaged",
                    payload={"run_data": run_data},
                ),
            )
    return run_data


def _result_event_decision(event: Event) -> str | None:
    """Classify terminal events without turning API errors into valid negatives."""
    if event.get("type") != "result":
        return None
    if event.get("is_error") is True:
        status = event.get("api_error_status")
        numeric_status = status if isinstance(status, int) and not isinstance(status, bool) else None
        message = event.get("result") or event.get("error") or "Claude returned an error"
        raise ClaudeCliError(numeric_status, str(message))
    return "success"


def _extract_usage(events: list[Event]) -> dict[str, object]:
    for event in reversed(events):
        usage = event.get("usage")
        if isinstance(usage, dict):
            return dict(usage)
        result = event.get("result")
        if isinstance(result, dict) and isinstance(result.get("usage"), dict):
            return dict(cast(dict[object, object], result["usage"]))
    return {}


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def artifact_manifest(root: Path) -> list[dict[str, str]]:
    """Return complete, sorted workspace-relative evidence digests."""
    root = root.resolve()
    entries: list[dict[str, str]] = []
    for path in sorted(path for path in root.rglob("*") if path.is_file()):
        entries.append({
            "relative_path": path.relative_to(root).as_posix(),
            "sha256": _sha256_file(path),
        })
    return entries


def validate_artifact_manifest(root: Path, artifacts: object) -> str | None:
    if not isinstance(artifacts, list):
        return "artifact manifest is not a list"
    root = root.resolve()
    for raw in artifacts:
        if not isinstance(raw, dict):
            return "artifact evidence is not an object"
        relative = raw.get("relative_path")
        expected = raw.get("sha256")
        if not isinstance(relative, str) or not isinstance(expected, str):
            return "artifact evidence has invalid fields"
        path = (root / relative).resolve()
        if root != path and root not in path.parents:
            return "artifact path escapes workspace"
        if not path.is_file():
            return f"artifact is missing: {relative}"
        if _sha256_file(path) != expected:
            return f"artifact digest mismatch: {relative}"
    return None


def cleanup_tree(path: Path) -> None:
    for _attempt in range(10):
        try:
            shutil.rmtree(path)
            return
        except FileNotFoundError:
            return
        except PermissionError:
            time.sleep(0.5)
        except OSError:
            time.sleep(0.5)
    shutil.rmtree(path, ignore_errors=True)


def _terminate_process_tree(process: subprocess.Popen[str]) -> None:
    """Terminate a subprocess and children before deleting its cwd."""
    if process.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        with contextlib.suppress(ProcessLookupError):
            posix_os = cast(Any, os)
            posix_signal = cast(Any, signal)
            posix_os.killpg(process.pid, posix_signal.SIGKILL)
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def event_text(events: list[Event]) -> str:
    return "\n".join(json.dumps(event, sort_keys=True) for event in events)


def final_result(events: list[Event]) -> str:
    for event in reversed(events):
        if event.get("type") == "result":
            result = event.get("result")
            return result if isinstance(result, str) else ""
    return ""


def summarize_case(label: str, project_root: Path, run_data: RunData) -> CaseSummary:
    target = project_root / "target-skill"
    skill_path = target / "SKILL.md"
    skill_text = skill_path.read_text(encoding="utf-8") if skill_path.is_file() else ""
    combined = event_text(run_data["events"])
    result = final_result(run_data["events"])
    inventory = sorted(
        str(path.relative_to(target)).replace("\\", "/")
        for path in target.rglob("*")
        if path.is_file()
    )

    return {
        "label": label,
        "exit_code": run_data["exit_code"],
        "duration_seconds": run_data["duration_seconds"],
        "skill_used": "skill-creator" in combined and '"name": "Skill"' in combined,
        "stale_reference_remaining": "references/missing-eval.md" in skill_text,
        "evaluation_reference_linked": "references/evaluation.md" in skill_text,
        "mentions_nhr": "Needs Human Review" in result or "NHR" in result,
        "mentions_production_ready": "production-ready" in result.lower()
        or "release-ready" in result.lower(),
        "package_check_mentioned": "package" in result.lower() or "validation" in result.lower(),
        "inventory": inventory,
        "final_result": result,
    }


def save_case_files(project_root: Path, destination: Path) -> None:
    target = project_root / "target-skill"
    snapshot = destination / "target-skill-final"
    if snapshot.exists():
        shutil.rmtree(snapshot)
    shutil.copytree(target, snapshot)


def eval_passed(red: CaseSummary, green: CaseSummary) -> bool:
    return (
        red["exit_code"] == 0
        and green["exit_code"] == 0
        and (red["stale_reference_remaining"] or not red["evaluation_reference_linked"])
        and green["skill_used"]
        and not green["stale_reference_remaining"]
        and green["evaluation_reference_linked"]
    )


def write_report(output_dir: Path, red: CaseSummary, green: CaseSummary) -> None:
    def outcome(value: bool) -> str:
        return "PASS" if value else "FAIL"

    red_skill_used = outcome(not red["skill_used"])
    green_skill_used = outcome(green["skill_used"])
    red_stale_reference_removed = outcome(not red["stale_reference_remaining"])
    green_stale_reference_removed = outcome(not green["stale_reference_remaining"])
    red_eval_reference_linked = outcome(red["evaluation_reference_linked"])
    green_eval_reference_linked = outcome(green["evaluation_reference_linked"])
    red_package_check = outcome(red["package_check_mentioned"])
    green_package_check = outcome(green["package_check_mentioned"])
    red_mentions_nhr = outcome(red["mentions_nhr"])
    green_mentions_nhr = outcome(green["mentions_nhr"])
    red_run_succeeded = red["exit_code"] == 0
    green_run_succeeded = green["exit_code"] == 0

    green_materially_better = (
        green_run_succeeded
        and green["skill_used"]
        and not green["stale_reference_remaining"]
        and green["evaluation_reference_linked"]
    )
    red_observed_gap = red_run_succeeded and (
        red["stale_reference_remaining"] or not red["evaluation_reference_linked"]
    )
    overall = "PASS" if eval_passed(red, green) else "AMBER"

    report = f"""# Independent RED/GREEN Behavioral Execution

Date: {datetime.now(timezone.utc).date().isoformat()}

Representative task: audit and revise a deliberately messy `target-skill/` Agent Skill directory
for release.

## Independence

- RED ran in an isolated Claude project with only `target-skill/`.
- GREEN ran in a separate isolated Claude project with the same `target-skill/` plus the candidate
  `skill-creator` under `.claude/skills/skill-creator`.
- Both runs used the same prompt, `claude -p`, `--setting-sources project`, and separate
  transcripts.

## Results

| Check | RED | GREEN |
| --- | --- | --- |
| Run exited successfully | {outcome(red_run_succeeded)} | {outcome(green_run_succeeded)} |
| Candidate skill activated | {red_skill_used} | {green_skill_used} |
| Stale reference removed | {red_stale_reference_removed} | {green_stale_reference_removed} |
| Eval reference linked | {red_eval_reference_linked} | {green_eval_reference_linked} |
| Validation/package evidence mentioned | {red_package_check} | {green_package_check} |
| Missing evidence/NHR mentioned | {red_mentions_nhr} | {green_mentions_nhr} |

## Outcome

- RED observed gap: {outcome(red_observed_gap)}
- GREEN materially reduced the observed gap: {outcome(green_materially_better)}

Overall: {overall}

## RED Final Result

```text
{red["final_result"]}
```

## GREEN Final Result

```text
{green["final_result"]}
```

## Evidence Files

- `red/transcript.jsonl`
- `red/stderr.txt`
- `red/target-skill-final/`
- `green/transcript.jsonl`
- `green/stderr.txt`
- `green/target-skill-final/`
- `summary.json`
"""
    (output_dir / "independent-red-green-report.md").write_text(report, encoding="utf-8")


def _skill_content_digest(candidate: Path) -> str:
    return hashlib.sha256((candidate / "SKILL.md").read_bytes()).hexdigest()


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


def run_red_green_evaluation(
    candidate: Path,
    output_dir: Path,
    control: EvaluationControl,
    model: str,
) -> dict[str, object]:
    """Run RED and GREEN under one parent-owned controller."""
    output_dir.mkdir(parents=True, exist_ok=True)
    red_root = Path(tempfile.mkdtemp(prefix="skill-red-green-"))
    green_root = Path(tempfile.mkdtemp(prefix="skill-red-green-"))
    summaries: dict[str, CaseSummary] = {}
    digest = _skill_content_digest(candidate)
    try:
        (red_root / CLAUDE_DIR).mkdir()
        (green_root / CLAUDE_DIR / "skills").mkdir(parents=True)
        create_fixture(red_root)
        create_fixture(green_root)
        copy_candidate_skill(candidate, green_root)

        for label, root, kind in (
            ("red", red_root, "readiness:red"),
            ("green", green_root, "readiness:green"),
        ):
            case_dir = output_dir / label
            case_dir.mkdir(parents=True, exist_ok=True)
            spec = AttemptSpec(
                kind=kind,
                query=TASK_PROMPT,
                run_index=0,
                skill_name=candidate.name,
                skill_content_sha256=digest,
                model=model,
                claude_version="unknown",
                distractor_sha256="",
            )
            try:
                run_data = run_claude(
                    root,
                    case_dir / "transcript.jsonl",
                    case_dir / "stderr.txt",
                    prompt_text=TASK_PROMPT,
                    control=control,
                    spec=spec,
                )
            except (ClaudeCliError, RuntimeError):
                if control.stop_reason is not None:
                    break
                continue
            save_case_files(root, case_dir)
            summaries[label] = summarize_case(label, root, run_data)

        if "red" in summaries and "green" in summaries:
            write_report(output_dir, summaries["red"], summaries["green"])
        return {
            "status": "complete" if len(summaries) == 2 else "partial",
            "summaries": summaries,
            "execution": _snapshot_dict(control),
        }
    finally:
        cleanup_tree(red_root)
        cleanup_tree(green_root)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate-skill", default=".", help="Path to candidate skill directory")
    parser.add_argument("--output-dir", required=True, help="Directory for evidence artifacts")
    parser.add_argument("--model", required=True, help="Explicit versioned Claude model ID")
    parser.add_argument("--max-model-calls", type=int, required=True, help="Maximum live model calls")
    parser.add_argument("--checkpoint", default=None, help="Append-only JSONL checkpoint path")
    parser.add_argument("--deadline-seconds", type=float, default=None, help="Stop after this many seconds")
    args = parser.parse_args()

    candidate = Path(args.candidate_skill).resolve()
    output_dir = Path(args.output_dir).resolve()
    if args.max_model_calls <= 0:
        parser.error("max-model-calls must be positive")
    if args.deadline_seconds is not None and args.deadline_seconds <= 0:
        parser.error("deadline-seconds must be positive")
    try:
        model = validate_model_id(args.model)
    except ValueError as exc:
        parser.error(str(exc))
    checkpoint = CheckpointStore(Path(args.checkpoint)) if args.checkpoint else None
    control = EvaluationControl(
        max_calls=args.max_model_calls,
        planned_calls=2,
        checkpoint=checkpoint,
        deadline_seconds=args.deadline_seconds,
    )
    result = run_red_green_evaluation(candidate, output_dir, control, model)
    summaries = cast(dict[str, CaseSummary], result["summaries"])
    (output_dir / "summary.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    if result["status"] != "complete":
        return 2
    return 0 if eval_passed(summaries["red"], summaries["green"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
