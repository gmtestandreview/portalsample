#!/usr/bin/env python3.14
"""Run bounded early-exit behavioral cases."""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Callable
from pathlib import Path
from typing import TYPE_CHECKING, TypedDict, cast

# pyright: reportMissingImports=false
if TYPE_CHECKING:

    class AttemptSpec(TypedDict):
        kind: str
        query: str
        run_index: int
        skill_name: str
        skill_content_sha256: str
        model: str
        claude_version: str
        distractor_sha256: str

    class CachedResult:
        outcome: str
        payload: dict[str, object] | None

        def __init__(
            self,
            *,
            outcome: str,
            payload: dict[str, object] | None = None,
        ) -> None:
            self.outcome = outcome
            self.payload = payload

    class CheckpointStore:
        def __init__(self, path: str | Path) -> None: ...

    class ClaudeCliError(RuntimeError): ...

    class EvaluationSnapshot(TypedDict):
        planned_calls: int
        attempted_calls: int
        resumed_calls: int
        successful_calls: int
        error_calls: int
        skipped_calls: int

    class EvaluationControl:
        stop_reason: str | None

        def __init__(
            self,
            *,
            max_calls: int,
            planned_calls: int,
            checkpoint: CheckpointStore | None = None,
            deadline_seconds: float | None = None,
        ) -> None: ...

        def snapshot(self) -> EvaluationSnapshot: ...

        def consume_cached(
            self,
            spec: AttemptSpec,
            validator: Callable[[CachedResult], str | None],
        ) -> CachedResult | None: ...

        def reserve_call(self, spec: AttemptSpec) -> bool: ...
        def mark_skipped(self, count: int) -> None: ...
        def record_success(self, spec: AttemptSpec, result: CachedResult) -> None: ...
        def record_error(self, spec: AttemptSpec, exc: BaseException) -> None: ...

    def effective_skill_digest(skill_root: Path) -> str: ...
    def validate_model_id(value: str) -> str: ...
    def run_claude(
        skill_root: Path,
        transcript_path: Path,
        stderr_path: Path,
        *,
        prompt_text: str,
    ) -> object: ...

else:
    try:
        from scripts.eval_control import (
            AttemptSpec,
            CachedResult,
            CheckpointStore,
            ClaudeCliError,
            EvaluationControl,
            effective_skill_digest,
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
            effective_skill_digest,
            validate_model_id,
        )
        from run_red_green_eval import run_claude


class EarlyExitCase(TypedDict):
    id: str
    query: str
    should_engage: bool


class EarlyExitResult(TypedDict):
    id: str
    query: str
    should_engage: bool
    engaged: bool
    status: str
    pass_: bool


class ExecutionSummary(TypedDict):
    planned_calls: int
    attempted_calls: int
    resumed_calls: int
    successful_calls: int
    error_calls: int
    skipped_calls: int
    status: str
    stop_reason: str | None


def _validated_case(
    item: object,
    index: int,
    identifiers: set[str],
    queries: set[str],
) -> EarlyExitCase:
    if not isinstance(item, dict):
        raise ValueError(f'case {index} must be an object')

    data = cast(dict[str, object], item)
    identifier = data.get('id')
    query = data.get('query')
    expected = data.get('should_engage')

    if not isinstance(identifier, str) or not identifier.strip():
        raise ValueError(f'case {index} requires a non-empty id')
    if not isinstance(query, str) or not query.strip():
        raise ValueError(f'case {index} requires a non-empty query')
    if not isinstance(expected, bool):
        raise ValueError(f'case {identifier} requires boolean should_engage')
    if identifier in identifiers or query in queries:
        raise ValueError(f'duplicate case id or query: {identifier}')

    identifiers.add(identifier)
    queries.add(query)
    return {'id': identifier, 'query': query, 'should_engage': expected}


def _validated_cases(value: object) -> list[EarlyExitCase]:
    """Reject malformed cases before model calls or evidence creation."""
    if not isinstance(value, list) or not value:
        raise ValueError('early-exit cases must be a non-empty JSON array')

    validated: list[EarlyExitCase] = []
    identifiers: set[str] = set()
    queries: set[str] = set()
    for index, item in enumerate(cast(list[object], value)):
        validated.append(_validated_case(item, index, identifiers, queries))
    return validated


def _digest_skill(skill_root: Path) -> str:
    return effective_skill_digest(skill_root)


def _cached_case_validator(expected: bool):
    def validate(result: CachedResult) -> str | None:
        outcome = 'engaged' if expected else 'not_engaged'
        if result.outcome != outcome:
            return f'cached outcome {result.outcome!r} does not match {outcome!r}'
        if result.payload is None or not isinstance(result.payload.get('engaged'), bool):
            return 'cached early-exit payload is missing engaged'
        if result.payload['engaged'] != expected:
            return 'cached early-exit payload has the wrong expected result'
        return None

    return validate


def _snapshot_dict(control: EvaluationControl) -> EvaluationSnapshot:
    snapshot = control.snapshot()
    return {
        'planned_calls': snapshot['planned_calls'],
        'attempted_calls': snapshot['attempted_calls'],
        'resumed_calls': snapshot['resumed_calls'],
        'successful_calls': snapshot['successful_calls'],
        'error_calls': snapshot['error_calls'],
        'skipped_calls': snapshot['skipped_calls'],
    }


def _engaged_from_event(event: object) -> bool | None:
    if not isinstance(event, dict):
        return None
    data = cast(dict[str, object], event)
    if data.get('type') != 'result' or data.get('is_error') is True:
        return None
    result = data.get('result')
    if not isinstance(result, str):
        return None
    value = result.strip().lower()
    if value in {'true', 'engaged', 'yes'}:
        return True
    if value in {'false', 'not_engaged', 'not engaged', 'no'}:
        return False
    return None


def _engaged_from_run_data(raw: object) -> bool | None:
    """Do not infer a negative outcome from empty/error/missing Claude output."""
    if not isinstance(raw, dict):
        return None
    data = cast(dict[str, object], raw)
    if data.get('exit_code') != 0:
        return None
    engaged = data.get('engaged')
    if isinstance(engaged, bool):
        return engaged
    events = data.get('events')
    if not isinstance(events, list):
        return None
    event_list = cast(list[object], events)
    for event in reversed(event_list):
        outcome = _engaged_from_event(event)
        if outcome is not None:
            return outcome
    return None


def _attempt_spec(
    *,
    case: EarlyExitCase,
    index: int,
    skill_root: Path,
    content_digest: str,
    model: str,
) -> AttemptSpec:
    return AttemptSpec(
        kind='early-exit',
        query=case['query'],
        run_index=index,
        skill_name=skill_root.name,
        skill_content_sha256=content_digest,
        model=model,
        claude_version='unknown',
        distractor_sha256='',
    )


def _resume_cached_case(
    *,
    case: EarlyExitCase,
    control: EvaluationControl,
    spec: AttemptSpec,
    results: list[dict[str, object]],
) -> bool:
    cached = control.consume_cached(spec, _cached_case_validator(case['should_engage']))
    if cached is None or cached.payload is None:
        return False
    engaged = cast(bool, cached.payload['engaged'])
    results.append({**case, 'engaged': engaged, 'status': 'resumed', 'pass': True})
    return True


def _run_case(
    *,
    spec: AttemptSpec,
    case: EarlyExitCase,
    skill_root: Path,
    output_dir: Path,
    index: int,
    control: EvaluationControl,
) -> tuple[bool | None, str | None, str | None]:
    try:
        run_data = run_claude(
            skill_root,
            output_dir / f'{index:03d}-transcript.jsonl',
            output_dir / f'{index:03d}-stderr.txt',
            prompt_text=case['query'],
        )
        engaged = _engaged_from_run_data(run_data)
        if engaged is None:
            raise ValueError('early-exit probe returned no explicit, successful engagement result')
        control.record_success(
            spec,
            CachedResult(
                outcome='engaged' if engaged else 'not_engaged',
                payload={'engaged': engaged},
            ),
        )
        return engaged, None, None
    except ClaudeCliError as exc:
        control.record_error(spec, exc)
        error = str(exc)
        if control.stop_reason == 'rate_limited':
            return None, 'rate_limited', error
        return None, 'error', error
    except (TypeError, ValueError) as exc:
        control.record_error(spec, exc)
        return None, 'error', str(exc)


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
        spec = _attempt_spec(
            case=case,
            index=index,
            skill_root=skill_root,
            content_digest=content_digest,
            model=model,
        )
        if _resume_cached_case(case=case, control=control, spec=spec, results=results):
            continue
        if not control.reserve_call(spec):
            control.mark_skipped(len(cases) - index)
            break
        engaged, error_kind, error_message = _run_case(
            spec=spec,
            case=case,
            skill_root=skill_root,
            output_dir=output_dir,
            index=index,
            control=control,
        )
        if error_kind is not None:
            results.append({**case, 'status': 'error', 'error': error_message})
            if error_kind == 'rate_limited':
                control.mark_skipped(len(cases) - index - 1)
                break
            continue
        results.append({
            **case,
            'engaged': engaged,
            'status': 'complete',
            'pass': engaged == case['should_engage'],
        })

    execution: ExecutionSummary = {
        **_snapshot_dict(control),
        'status': 'complete' if len(results) == len(cases) else 'partial',
        'stop_reason': control.stop_reason,
    }
    return {
        'results': results,
        'execution': execution,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--cases',
        required=True,
        help='Path to a JSON file containing cases, or a JSON string',
    )
    parser.add_argument('--skill-root', required=True)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--max-model-calls', type=int, required=True)
    parser.add_argument('--checkpoint')
    parser.add_argument('--deadline-seconds', type=float)
    args = parser.parse_args()
    if args.max_model_calls <= 0:
        parser.error('max-model-calls must be positive')
    model = str(validate_model_id(args.model))
    try:
        cases_arg = args.cases
        try:
            cases_text = Path(cases_arg).read_text(encoding='utf-8')
        except OSError:
            cases_text = cases_arg
        cases = _validated_cases(json.loads(cases_text))
    except (OSError, ValueError) as exc:
        parser.error(f'invalid early-exit case set: {exc}')
    checkpoint = CheckpointStore(Path(args.checkpoint)) if args.checkpoint else None
    control = EvaluationControl(
        max_calls=args.max_model_calls,
        planned_calls=len(cases),
        checkpoint=checkpoint,
        deadline_seconds=args.deadline_seconds,
    )
    result = run_cases(
        cases,
        skill_root=Path(args.skill_root),
        output_dir=Path(args.output_dir),
        model=model,
        control=control,
    )
    print(json.dumps(result, indent=2))
    execution_raw = result.get('execution')
    if isinstance(execution_raw, dict):
        execution: dict[str, object] | None = cast(dict[str, object], execution_raw)
    else:
        execution = None
    status_raw = execution.get('status') if execution is not None else None
    status = status_raw if isinstance(status_raw, str) else 'partial'
    if status != 'complete':
        return 2
    results = cast(list[dict[str, object]], result.get('results'))
    return 0 if all(case.get('pass') is True for case in results) else 1


if __name__ == '__main__':
    raise SystemExit(main())
