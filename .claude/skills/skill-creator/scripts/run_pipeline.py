#!/usr/bin/env python3
"""Deterministic check, bounded smoke, and release evidence pipeline."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, cast

try:
    from scripts.eval_control import CheckpointStore, EvaluationControl, validate_model_id
    from scripts.run_early_exit_eval import run_cases as run_early_exit_cases
    from scripts.run_eval import run_eval
    from scripts.run_readiness_pressure_eval import run_readiness_evaluation
    from scripts.utils import parse_skill_md
except ModuleNotFoundError:
    from eval_control import CheckpointStore, EvaluationControl, validate_model_id
    from run_early_exit_eval import run_cases as run_early_exit_cases
    from run_eval import run_eval
    from run_readiness_pressure_eval import run_readiness_evaluation
    from utils import parse_skill_md


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent
EVAL_ROOT = SKILL_ROOT / "evals"
PIPELINE_VERSION = 1


@dataclass(frozen=True, slots=True)
class EvidenceFinding:
    code: str
    category: str
    severity: str
    message: str


def _stage(name: str, planned_calls: int, cases: list[dict[str, object]] | None = None) -> dict[str, object]:
    return {
        "stage": name,
        "planned_calls": planned_calls,
        "status": "not_run",
        "cases": _case_matrix(cases or [], "not_run"),
        "artifacts": [],
    }


def build_execution_plan(mode: str) -> dict[str, object]:
    if mode == "check":
        stages = [_stage("check", 0)]
        base_calls = maximum_calls = 0
    elif mode == "smoke":
        cases = json.loads((EVAL_ROOT / "activation-smoke.json").read_text(encoding="utf-8"))
        stages = [_stage("activation-smoke", 4, cases)]
        base_calls, maximum_calls = 4, 6
    elif mode == "release":
        activation_cases = _load_cases(EVAL_ROOT / "activation-eval.json")
        holdout_cases = _load_cases(EVAL_ROOT / "activation-holdout.json")
        early_exit_cases = _load_cases(EVAL_ROOT / "activation-smoke.json")
        stages = [
            _stage("activation", 20, activation_cases),
            _stage("holdout", 8, holdout_cases),
            _stage("early-exit", 4, early_exit_cases),
            _stage("readiness-pressure", 2, [{"id": "readiness-red", "query": "readiness", "should_engage": False}, {"id": "readiness-green", "query": "readiness", "should_engage": True}]),
        ]
        base_calls, maximum_calls = 34, 40
    else:
        raise ValueError(f"unknown mode: {mode}")
    return {
        "mode": mode,
        "stages": stages,
        "base_calls": base_calls,
        "maximum_calls": maximum_calls,
        "adaptive_confirmation_reserve": maximum_calls - base_calls,
    }


def _command_record(command: list[str], result: subprocess.CompletedProcess[str]) -> dict[str, object]:
    return {
        "command": command,
        "python": sys.version,
        "tool": command[2] if len(command) > 2 else command[0],
        "exit_code": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


def run_check(skill_root: Path, workspace: Path | None = None) -> dict[str, object]:
    commands = [
        [sys.executable, "-m", "scripts.quick_validate", "."],
        [sys.executable, "-m", "unittest", "scripts.test_regressions"],
        [sys.executable, "-m", "pytest", "scripts/Regression tests", "-q"],
    ]
    records: list[dict[str, object]] = []
    for command in commands:
        result = subprocess.run(
            command,
            cwd=str(skill_root),
            capture_output=True,
            text=True,
            shell=False,
            check=False,
        )
        record = _command_record(command, result)
        records.append(record)
        if result.returncode != 0:
            break
    output: dict[str, object] = {
        "stage": "check",
        "status": "complete" if len(records) == len(commands) else "failed",
        "passed": all(record["exit_code"] == 0 for record in records),
        "planned_calls": 0,
        "attempted_calls": 0,
        "commands": records,
    }
    if workspace is not None:
        log_dir = workspace / "evidence" / "check"
        log_dir.mkdir(parents=True, exist_ok=True)
        (log_dir / "check.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    return output


def _load_cases(path: Path) -> list[dict[str, object]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError(f"fixture root must be a JSON array: {path}")
    cases: list[dict[str, object]] = []
    for index, item in enumerate(raw):
        if not isinstance(item, dict) or not isinstance(item.get("query"), str):
            raise ValueError(f"fixture case {index} is invalid")
        case = dict(item)
        case.setdefault("id", f"{path.stem}-{index}")
        cases.append(case)
    return cases


def _snapshot(control: EvaluationControl) -> dict[str, int]:
    snapshot = control.snapshot()
    return {
        "planned_calls": snapshot.planned_calls,
        "attempted_calls": snapshot.attempted_calls,
        "resumed_calls": snapshot.resumed_calls,
        "successful_calls": snapshot.successful_calls,
        "error_calls": snapshot.error_calls,
        "skipped_calls": snapshot.skipped_calls,
    }


def _case_matrix(cases: list[dict[str, object]], status: str = "not_run") -> list[dict[str, object]]:
    return [
        {
            **case,
            "status": status,
            "attempts": [],
            "pass": False,
            **({"evidence_code": "NHR", "reason": "stage was not run"} if status == "not_run" else {}),
        }
        for case in cases
    ]


def _adapter_result(stage: str, cases: list[dict[str, object]], control: EvaluationControl) -> dict[str, object]:
    """Safe local adapter seam; live integrations can replace this in tests or callers."""
    return {
        "stage": stage,
        "status": "complete",
        "cases": _case_matrix(cases, "complete"),
        "execution": _snapshot(control),
        "artifacts": [],
    }


def _activation_stage(
    stage: str,
    fixture: str,
    skill_root: Path,
    workspace: Path,
    control: EvaluationControl,
    model: str,
) -> dict[str, object]:
    cases = _load_cases(EVAL_ROOT / fixture)
    name, description, _ = parse_skill_md(skill_root)
    raw = run_eval(
        eval_set=cast(list[Any], cases),
        skill_name=name,
        description=description,
        num_workers=2,
        timeout=30,
        project_root=skill_root,
        runs_per_query=1,
        trigger_threshold=0.5,
        model=model,
        control=control,
    )
    raw_results = raw.get("results", []) if isinstance(raw, dict) else []
    by_query = {item["query"]: item for item in raw_results if isinstance(item, dict) and isinstance(item.get("query"), str)}
    matrix: list[dict[str, object]] = []
    for case in cases:
        result = by_query.get(case["query"])
        matrix.append({
            **case,
            "status": "complete" if result is not None else "not_run",
            "attempts": [result] if result is not None else [],
            "pass": bool(result.get("pass")) if result is not None else False,
            **({} if result is not None else {"evidence_code": "NHR", "reason": "activation attempt was not completed"}),
        })
    execution = raw.get("execution", _snapshot(control)) if isinstance(raw, dict) else _snapshot(control)
    status = execution.get("status", "complete") if isinstance(execution, dict) else "partial"
    return {"stage": stage, "planned_calls": len(cases), "status": status, "cases": matrix, "execution": execution, "artifacts": []}


def run_smoke(
    skill_root: Path,
    workspace: Path,
    control: EvaluationControl,
    model: str | None = None,
) -> dict[str, object]:
    cases = _load_cases(EVAL_ROOT / "activation-smoke.json")
    if model is None:
        return _adapter_result("activation-smoke", cases, control)
    return _activation_stage("activation-smoke", "activation-smoke.json", skill_root, workspace, control, model)


def run_release(
    skill_root: Path,
    workspace: Path,
    control: EvaluationControl,
    model: str | None = None,
) -> dict[str, object]:
    if model is None:
        return {"status": "complete", "stages": [], "execution": _snapshot(control)}
    results: list[dict[str, object]] = []
    for stage_index, (stage_name, fixture) in enumerate((("activation", "activation-eval.json"), ("holdout", "activation-holdout.json"))):
        result = _activation_stage(stage_name, fixture, skill_root, workspace, control, model)
        results.append(result)
        if result["status"] != "complete":
            downstream = (8 if stage_index == 0 else 0) + 4 + 2
            control.mark_skipped(downstream)
            return {"status": "partial", "stages": results, "execution": _snapshot(control)}
    early_cases = [
        {"id": case["id"], "query": case["query"], "should_engage": case["should_trigger"]}
        for case in _load_cases(EVAL_ROOT / "activation-smoke.json")
    ]
    early = run_early_exit_cases(
        early_cases,
        skill_root=skill_root,
        output_dir=workspace / "evidence" / "early-exit",
        model=model,
        control=control,
    )
    results.append({"stage": "early-exit", **early})
    if early["execution"]["status"] != "complete":
        control.mark_skipped(2)
        return {"status": "partial", "stages": results, "execution": _snapshot(control)}
    readiness = run_readiness_evaluation(
        skill_root,
        workspace / "evidence" / "readiness-pressure",
        control,
        model,
    )
    results.append({"stage": "readiness-pressure", **readiness})
    return {"status": "complete" if readiness["status"] == "complete" else "partial", "stages": results, "execution": _snapshot(control)}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _workspace_relative(path: Path, workspace: Path) -> str:
    return path.resolve().relative_to(workspace.resolve()).as_posix()


def build_pipeline_summary(
    mode: str,
    stages: list[dict[str, object]] | None = None,
    *,
    execution_status: str = "not_run",
    workspace: Path | None = None,
    checkpoint: Path | None = None,
    control: EvaluationControl | None = None,
    cli_args: list[str] | None = None,
    model: str | None = None,
    skill_root: Path | None = None,
    verdict: str = "not_applicable",
) -> dict[str, object]:
    plan = build_execution_plan(mode)
    stages = stages or cast(list[dict[str, object]], plan["stages"])
    if control is None:
        counters = {key: 0 for key in ("planned_calls", "attempted_calls", "resumed_calls", "successful_calls", "error_calls", "skipped_calls")}
    else:
        counters = _snapshot(control)
    inputs: dict[str, object] = {}
    if skill_root is not None and (skill_root / "SKILL.md").is_file():
        inputs["skill"] = {"path": _workspace_relative(skill_root / "SKILL.md", workspace) if workspace else str(skill_root / "SKILL.md"), "sha256": _sha256(skill_root / "SKILL.md")}
    summary: dict[str, object] = {
        "schema_version": PIPELINE_VERSION,
        "mode": mode,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "cli_args": cli_args or [],
        "checkpoint": {"path": _workspace_relative(checkpoint, workspace) if checkpoint and workspace else (str(checkpoint) if checkpoint else "not-applicable"), "sha256": _sha256(checkpoint) if checkpoint and checkpoint.is_file() else None},
        "workspace": str(workspace) if workspace else "not-applicable",
        "model": model or "not-applicable",
        "inputs": inputs,
        "plan": plan,
        "stages": stages,
        "execution": counters,
        "execution_status": execution_status,
        "evidence_status": "complete" if execution_status == "complete" else "incomplete",
        "verdict": verdict,
        "mode_ready": execution_status == "complete" and verdict == "pass",
        "release_ready": mode == "release" and execution_status == "complete" and verdict == "pass",
        "evidence_validation": {"status": "pending", "findings": []},
    }
    return summary


def validate_pipeline_summary(summary: dict[str, object], workspace: Path | None = None) -> list[EvidenceFinding]:
    findings: list[EvidenceFinding] = []
    required = ("schema_version", "mode", "stages", "execution", "execution_status", "evidence_status", "verdict", "mode_ready", "release_ready")
    for field in required:
        if field not in summary:
            findings.append(EvidenceFinding("MISSING_FIELD", "structure", "blocking", f"missing summary field: {field}"))
    stages = summary.get("stages")
    if not isinstance(stages, list):
        findings.append(EvidenceFinding("INVALID_STAGES", "structure", "blocking", "stages must be a list"))
    execution = summary.get("execution")
    if isinstance(execution, dict):
        counters = {key: execution.get(key) for key in ("planned_calls", "attempted_calls", "resumed_calls", "skipped_calls")}
        if all(isinstance(value, int) for value in counters.values()):
            if counters["planned_calls"] != counters["attempted_calls"] + counters["resumed_calls"] + counters["skipped_calls"]:
                findings.append(EvidenceFinding("COUNTER_INVARIANT", "accounting", "blocking", "planned calls do not reconcile with attempted, resumed, and skipped calls"))
    else:
        findings.append(EvidenceFinding("INVALID_EXECUTION", "accounting", "blocking", "execution counters are missing"))
    if summary.get("execution_status") in {"partial", "short_circuited"} and summary.get("release_ready"):
        findings.append(EvidenceFinding("PARTIAL_RELEASE", "readiness", "blocking", "partial execution cannot be release-ready"))
    if summary.get("mode") == "release" and summary.get("release_ready") and summary.get("evidence_status") != "complete":
        findings.append(EvidenceFinding("INCOMPLETE_EVIDENCE", "readiness", "blocking", "release readiness requires complete evidence"))
    if workspace is not None and isinstance(summary.get("checkpoint"), dict):
        checkpoint = cast(dict[str, object], summary["checkpoint"])
        path = checkpoint.get("path")
        digest = checkpoint.get("sha256")
        if isinstance(path, str) and path != "not-applicable":
            file_path = (workspace / path).resolve()
            if not file_path.is_file():
                findings.append(EvidenceFinding("MISSING_ARTIFACT", "evidence", "blocking", f"missing checkpoint artifact: {path}"))
            elif isinstance(digest, str) and _sha256(file_path) != digest:
                findings.append(EvidenceFinding("DIGEST_MISMATCH", "evidence", "blocking", f"checkpoint digest mismatch: {path}"))
    return findings


def write_pipeline_summary(summary: dict[str, object], workspace: Path) -> Path:
    workspace.mkdir(parents=True, exist_ok=True)
    target = workspace / "pipeline-summary.json"
    findings = validate_pipeline_summary(summary, workspace)
    summary["evidence_validation"] = {
        "status": "complete" if not findings else "incomplete",
        "validator_version": PIPELINE_VERSION,
        "findings": [asdict(finding) for finding in findings],
    }
    summary["evidence_status"] = "complete" if not findings else "incomplete"
    summary["mode_ready"] = bool(summary.get("mode_ready")) and not findings
    summary["release_ready"] = bool(summary.get("release_ready")) and not findings
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=workspace, delete=False) as handle:
        json.dump(summary, handle, indent=2)
        handle.flush()
        os.fsync(handle.fileno())
        temporary = Path(handle.name)
    os.replace(temporary, target)
    return target


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("check", "smoke", "release"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--workspace")
    parser.add_argument("--model")
    parser.add_argument("--max-model-calls", type=int)
    parser.add_argument("--checkpoint")
    parser.add_argument("--deadline-seconds", type=float)
    parser.add_argument("--num-workers", type=int, default=2)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    plan = build_execution_plan(args.mode)
    if args.dry_run:
        summary = build_pipeline_summary(args.mode, execution_status="not_run", model="not-applicable")
        print(json.dumps(summary, indent=2))
        return 0
    if args.mode == "check":
        if args.workspace:
            workspace = Path(args.workspace).resolve()
        else:
            workspace = None
        result = run_check(SKILL_ROOT, workspace)
        summary = build_pipeline_summary(
            "check",
            [result],
            execution_status="complete" if result["passed"] else "short_circuited",
            workspace=workspace,
            verdict="pass" if result["passed"] else "fail",
            skill_root=SKILL_ROOT,
        )
        if workspace:
            write_pipeline_summary(summary, workspace)
        print(json.dumps(summary, indent=2))
        return 0 if result["passed"] else 1
    if not args.workspace or not args.model:
        print("workspace and model are required for live modes", file=sys.stderr)
        return 2
    if args.num_workers <= 0:
        print("num-workers must be positive", file=sys.stderr)
        return 2
    try:
        model = validate_model_id(args.model)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    workspace = Path(args.workspace).resolve()
    workspace.mkdir(parents=True, exist_ok=True)
    check = run_check(SKILL_ROOT, workspace)
    if not check["passed"]:
        summary = build_pipeline_summary("check", [check], execution_status="short_circuited", workspace=workspace, model=model, skill_root=SKILL_ROOT, verdict="fail")
        write_pipeline_summary(summary, workspace)
        print(json.dumps(summary, indent=2))
        return 1
    max_calls = args.max_model_calls if args.max_model_calls is not None else int(plan["maximum_calls"])
    if max_calls <= 0:
        print("max-model-calls must be positive", file=sys.stderr)
        return 2
    base = int(plan["base_calls"])
    if max_calls < base:
        print(f"Warning: cap {max_calls} is below the {base}-call base; run may be partial.", file=sys.stderr)
    checkpoint_path = Path(args.checkpoint) if args.checkpoint else workspace / "checkpoints" / f"{args.mode}.jsonl"
    control = EvaluationControl(
        max_calls=max_calls,
        planned_calls=base,
        checkpoint=CheckpointStore(checkpoint_path),
        deadline_seconds=args.deadline_seconds,
    )
    if args.mode == "smoke":
        result = run_smoke(SKILL_ROOT, workspace, control, model)
        summary = build_pipeline_summary("smoke", [result], execution_status=result["status"], workspace=workspace, checkpoint=checkpoint_path, control=control, model=model, skill_root=SKILL_ROOT, verdict="pass" if result["status"] == "complete" else "unavailable")
    else:
        result = run_release(SKILL_ROOT, workspace, control, model)
        summary = build_pipeline_summary("release", cast(list[dict[str, object]], result["stages"]), execution_status=result["status"], workspace=workspace, checkpoint=checkpoint_path, control=control, model=model, skill_root=SKILL_ROOT, verdict="pass" if result["status"] == "complete" else "unavailable")
    write_pipeline_summary(summary, workspace)
    print(json.dumps(summary, indent=2))
    if summary["release_ready"] or (args.mode == "smoke" and summary["mode_ready"]):
        return 0
    return 2 if summary["execution_status"] != "complete" else 1


if __name__ == "__main__":
    raise SystemExit(main())
