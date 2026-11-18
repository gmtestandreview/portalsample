#!/usr/bin/env python3
"""Deterministic check, bounded smoke, and release evidence pipeline.

This module intentionally keeps external evaluator integrations behind a small
typed runtime boundary.  The pipeline itself deals only in validated mappings,
stable case identities, and explicit evidence records.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import os
import subprocess
import sys
import tempfile
import time
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Protocol, TypedDict, cast

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent
EVAL_ROOT = SKILL_ROOT / 'references' / 'activation-cases'

PIPELINE_VERSION = 2
SKILL_FILE = 'SKILL.md'
SMOKE_FIXTURE = 'activation-smoke.json'
ACTIVATION_FIXTURE = 'activation-eval.json'
HOLDOUT_FIXTURE = 'activation-holdout.json'

CHECK_STAGE = 'check'
SMOKE_STAGE = 'activation-smoke'
ACTIVATION_STAGE = 'activation'
HOLDOUT_STAGE = 'holdout'
EARLY_EXIT_STAGE = 'early-exit'
READINESS_STAGE = 'readiness-pressure'

COMPLETE = 'complete'
PARTIAL = 'partial'
NOT_RUN = 'not_run'

JsonObject = dict[str, object]


class SnapshotLike(Protocol):
    planned_calls: int
    attempted_calls: int
    resumed_calls: int
    successful_calls: int
    error_calls: int
    skipped_calls: int


class ControlLike(Protocol):
    def snapshot(self) -> SnapshotLike: ...
    def mark_skipped(self, count: int) -> None: ...


class CheckpointStoreFactory(Protocol):
    def __call__(self, path: Path) -> object: ...


class ControlFactory(Protocol):
    def __call__(
        self,
        *,
        max_calls: int,
        planned_calls: int,
        checkpoint: object,
        deadline_seconds: float | None,
    ) -> ControlLike: ...


class RunEval(Protocol):
    def __call__(
        self,
        *,
        eval_set: list[JsonObject],
        skill_name: str,
        description: str,
        num_workers: int,
        timeout: int,
        project_root: Path,
        runs_per_query: int,
        trigger_threshold: float,
        model: str,
        control: ControlLike,
        skill_content_sha256: str,
    ) -> Mapping[str, object]: ...


class RunEarlyExit(Protocol):
    def __call__(
        self,
        cases: list[JsonObject],
        *,
        skill_root: Path,
        output_dir: Path,
        model: str,
        control: ControlLike,
    ) -> Mapping[str, object]: ...


class RunReadiness(Protocol):
    def __call__(
        self,
        candidate: Path,
        output_dir: Path,
        control: ControlLike,
        model: str,
    ) -> Mapping[str, object]: ...


class ReadinessOutcome(Protocol):
    def __call__(
        self,
        red: Mapping[str, object],
        green: Mapping[str, object],
    ) -> Mapping[str, object]: ...


class ParseSkill(Protocol):
    def __call__(self, root: Path) -> tuple[str, str, object]: ...


class EffectiveManifest(Protocol):
    def __call__(self, root: Path) -> dict[str, str]: ...


class EffectiveDigest(Protocol):
    def __call__(self, root: Path) -> str: ...


class ValidateModelId(Protocol):
    def __call__(self, model: str) -> str: ...


@dataclass(frozen=True, slots=True)
class Runtime:
    checkpoint_store: CheckpointStoreFactory
    control_factory: ControlFactory
    effective_skill_digest: EffectiveDigest
    effective_skill_manifest: EffectiveManifest
    validate_model_id: ValidateModelId
    run_early_exit_cases: RunEarlyExit
    run_eval: RunEval
    readiness_outcome: ReadinessOutcome
    run_readiness_evaluation: RunReadiness
    parse_skill_md: ParseSkill


@dataclass(frozen=True, slots=True)
class EvidenceFinding:
    code: str
    category: str
    severity: str
    message: str


@dataclass(frozen=True, slots=True)
class ExecutionPlan:
    mode: str
    stages: list[JsonObject]
    base_calls: int
    maximum_calls: int

    def as_dict(self) -> JsonObject:
        return {
            'mode': self.mode,
            'stages': self.stages,
            'base_calls': self.base_calls,
            'maximum_calls': self.maximum_calls,
            'adaptive_confirmation_reserve': self.maximum_calls - self.base_calls,
        }


class CliArgs(TypedDict):
    mode: str


def _load_attr(module_name: str, attribute: str) -> object:
    module = importlib.import_module(module_name)
    try:
        return getattr(module, attribute)
    except AttributeError as exc:
        raise ImportError(f'{module_name!r} does not expose {attribute!r}') from exc


def _module_prefix() -> str:
    return 'scripts.' if __package__ else ''


def _load_runtime() -> Runtime:
    prefix = _module_prefix()
    return Runtime(
        checkpoint_store=cast(
            CheckpointStoreFactory, _load_attr(f'{prefix}eval_control', 'CheckpointStore')
        ),
        control_factory=cast(
            ControlFactory, _load_attr(f'{prefix}eval_control', 'EvaluationControl')
        ),
        effective_skill_digest=cast(
            EffectiveDigest, _load_attr(f'{prefix}eval_control', 'effective_skill_digest')
        ),
        effective_skill_manifest=cast(
            EffectiveManifest, _load_attr(f'{prefix}eval_control', 'effective_skill_manifest')
        ),
        validate_model_id=cast(
            ValidateModelId, _load_attr(f'{prefix}eval_control', 'validate_model_id')
        ),
        run_early_exit_cases=cast(
            RunEarlyExit,
            _load_attr(f'{prefix}run_early_exit_eval', 'run_cases'),
        ),
        run_eval=cast(RunEval, _load_attr(f'{prefix}run_eval', 'run_eval')),
        readiness_outcome=cast(
            ReadinessOutcome,
            _load_attr(f'{prefix}run_readiness_pressure_eval', 'readiness_outcome'),
        ),
        run_readiness_evaluation=cast(
            RunReadiness,
            _load_attr(
                f'{prefix}run_readiness_pressure_eval',
                'run_readiness_evaluation',
            ),
        ),
        parse_skill_md=cast(ParseSkill, _load_attr(f'{prefix}utils', 'parse_skill_md')),
    )


def _as_mapping(value: object) -> Mapping[str, object] | None:
    if not isinstance(value, dict):
        return None
    candidate = cast(dict[object, object], value)
    if not all(isinstance(key, str) for key in candidate):
        return None
    return cast(Mapping[str, object], candidate)


def _as_mapping_list(value: object) -> list[Mapping[str, object]] | None:
    if not isinstance(value, list):
        return None
    items = cast(list[object], value)
    result: list[Mapping[str, object]] = []
    for item in items:
        mapping = _as_mapping(item)
        if mapping is None:
            return None
        result.append(mapping)
    return result


def _required_str(data: Mapping[str, object], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{key} must be a non-empty string')
    return value


def _required_bool(data: Mapping[str, object], key: str) -> bool:
    value = data.get(key)
    if not isinstance(value, bool):
        raise ValueError(f'{key} must be boolean')
    return value


def _stage(
    name: str,
    planned_calls: int,
    cases: Sequence[Mapping[str, object]] | None = None,
) -> JsonObject:
    return {
        'stage': name,
        'planned_calls': planned_calls,
        'status': NOT_RUN,
        'cases': _case_matrix(cases or (), NOT_RUN),
        'artifacts': [],
    }


def build_execution_plan(mode: str) -> JsonObject:
    return _build_plan(mode).as_dict()


def _build_plan(mode: str) -> ExecutionPlan:
    if mode == 'check':
        return ExecutionPlan(mode, [_stage(CHECK_STAGE, 0)], 0, 0)
    if mode == 'smoke':
        cases = _load_cases(EVAL_ROOT / SMOKE_FIXTURE, expected_count=4)
        return ExecutionPlan(mode, [_stage(SMOKE_STAGE, 4, cases)], 4, 6)
    if mode == 'release':
        return _release_plan()
    raise ValueError(f'unknown mode: {mode}')


def _release_plan() -> ExecutionPlan:
    activation = _load_cases(EVAL_ROOT / ACTIVATION_FIXTURE, expected_count=20)
    holdout = _load_cases(EVAL_ROOT / HOLDOUT_FIXTURE, expected_count=8)
    smoke = _load_cases(EVAL_ROOT / SMOKE_FIXTURE, expected_count=4)
    early: list[JsonObject] = [
        {
            'id': _required_str(case, 'id'),
            'query': _required_str(case, 'query'),
            'should_engage': _required_bool(case, 'should_trigger'),
        }
        for case in smoke
    ]
    readiness: list[JsonObject] = [
        {'id': 'readiness-red', 'query': 'readiness', 'should_engage': False},
        {'id': 'readiness-green', 'query': 'readiness', 'should_engage': True},
    ]
    stages = [
        _stage(ACTIVATION_STAGE, 20, activation),
        _stage(HOLDOUT_STAGE, 8, holdout),
        _stage(EARLY_EXIT_STAGE, 4, early),
        _stage(READINESS_STAGE, 2, readiness),
    ]
    return ExecutionPlan('release', stages, 34, 40)


def _command_record(
    command: list[str],
    result: subprocess.CompletedProcess[str],
) -> JsonObject:
    return {
        'command': command,
        'python': sys.version,
        'tool': command[2] if len(command) > 2 else command[0],
        'exit_code': result.returncode,
        'stdout': result.stdout,
        'stderr': result.stderr,
    }


def run_check(skill_root: Path, workspace: Path | None = None) -> JsonObject:
    commands = (
        [sys.executable, '-m', 'scripts.quick_validate', '.'],
        [sys.executable, '-m', 'unittest', 'scripts.test_regressions'],
        [sys.executable, '-m', 'pytest', 'scripts/Regression tests', '-q'],
    )
    records: list[JsonObject] = []
    for command in commands:
        result = subprocess.run(
            command,
            cwd=skill_root,
            capture_output=True,
            text=True,
            shell=False,
            check=False,
        )
        records.append(_command_record(command, result))
        if result.returncode != 0:
            break

    passed = len(records) == len(commands) and all(
        record.get('exit_code') == 0 for record in records
    )
    output: JsonObject = {
        'stage': CHECK_STAGE,
        'status': COMPLETE if passed else 'failed',
        'passed': passed,
        'planned_calls': 0,
        'attempted_calls': 0,
        'commands': records,
    }
    if workspace is not None:
        log_dir = workspace / 'evidence' / CHECK_STAGE
        log_dir.mkdir(parents=True, exist_ok=True)
        _atomic_json_write(log_dir / 'check.json', output)
    return output


def _load_cases(
    path: Path,
    *,
    expected_count: int | None = None,
) -> list[JsonObject]:
    try:
        raw = cast(object, json.loads(path.read_text(encoding='utf-8')))
    except FileNotFoundError as exc:
        raise ValueError(f'Missing bundled activation cases: {path}') from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f'Invalid activation-case JSON at {path}: {exc}') from exc

    items = _as_mapping_list(raw)
    if items is None:
        raise ValueError(f'fixture root must be a JSON array of objects: {path}')
    if expected_count is not None and len(items) != expected_count:
        raise ValueError(f'{path.name} must contain {expected_count} cases, found {len(items)}')

    cases: list[JsonObject] = []
    seen_ids: set[str] = set()
    seen_queries: set[str] = set()
    for item in items:
        identifier = _required_str(item, 'id')
        query = _required_str(item, 'query')
        should_trigger = _required_bool(item, 'should_trigger')
        if identifier in seen_ids:
            raise ValueError(f'duplicate fixture id {identifier!r}: {path}')
        if query in seen_queries:
            raise ValueError(f'duplicate fixture query at case {identifier}: {path}')
        seen_ids.add(identifier)
        seen_queries.add(query)
        case = dict(item)
        case['id'] = identifier
        case['query'] = query
        case['should_trigger'] = should_trigger
        cases.append(case)
    return cases


def _snapshot(control: ControlLike) -> JsonObject:
    snapshot = control.snapshot()
    return {
        'planned_calls': snapshot.planned_calls,
        'attempted_calls': snapshot.attempted_calls,
        'resumed_calls': snapshot.resumed_calls,
        'successful_calls': snapshot.successful_calls,
        'error_calls': snapshot.error_calls,
        'skipped_calls': snapshot.skipped_calls,
    }


def _case_matrix(
    cases: Sequence[Mapping[str, object]],
    status: str = NOT_RUN,
) -> list[JsonObject]:
    rows: list[JsonObject] = []
    for case in cases:
        row: JsonObject = {
            **dict(case),
            'status': status,
            'attempts': [],
            'pass': False,
        }
        if status == NOT_RUN:
            row.update({'evidence_code': 'NHR', 'reason': 'stage was not run'})
        rows.append(row)
    return rows


def _atomic_json_write(path: Path, payload: Mapping[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        'w',
        dir=path.parent,
        encoding='utf-8',
        delete=False,
    ) as handle:
        json.dump(payload, handle, indent=2, sort_keys=True, allow_nan=False)
        handle.flush()
        os.fsync(handle.fileno())
        temporary = Path(handle.name)
    os.replace(temporary, path)


def _persist_stage_evidence(stage: JsonObject, workspace: Path) -> JsonObject:
    name = _required_str(stage, 'stage')
    target = workspace / 'evidence' / name / 'stage.json'
    content = {key: value for key, value in stage.items() if key != 'artifacts'}
    _atomic_json_write(target, content)
    stage['artifacts'] = [
        {
            'relative_path': _workspace_relative(target, workspace),
            'sha256': _sha256(target),
        }
    ]
    return stage


def _adapter_result(
    stage: str,
    cases: list[JsonObject],
    control: ControlLike,
) -> JsonObject:
    return {
        'stage': stage,
        'status': COMPLETE,
        'cases': _case_matrix(cases, COMPLETE),
        'execution': _snapshot(control),
        'artifacts': [],
    }


def _index_by_string_key(
    rows: Sequence[Mapping[str, object]],
    key: str,
) -> dict[str, Mapping[str, object]]:
    indexed: dict[str, Mapping[str, object]] = {}
    for row in rows:
        value = row.get(key)
        if isinstance(value, str):
            indexed[value] = row
    return indexed


def _activation_stage(
    stage: str,
    fixture: str,
    skill_root: Path,
    workspace: Path,
    control: ControlLike,
    model: str,
    num_workers: int = 2,
    *,
    runtime: Runtime | None = None,
) -> JsonObject:
    rt = runtime or _load_runtime()
    cases = _load_cases(EVAL_ROOT / fixture)
    name, description, _metadata = rt.parse_skill_md(skill_root)
    eval_cases: list[JsonObject] = [
        {
            'query': _required_str(case, 'query'),
            'should_trigger': _required_bool(case, 'should_trigger'),
        }
        for case in cases
    ]
    raw = rt.run_eval(
        eval_set=eval_cases,
        skill_name=name,
        description=description,
        num_workers=num_workers,
        timeout=30,
        project_root=skill_root,
        runs_per_query=1,
        trigger_threshold=0.5,
        model=model,
        control=control,
        skill_content_sha256=rt.effective_skill_digest(skill_root),
    )
    results = _as_mapping_list(raw.get('results'))
    by_query = _index_by_string_key(results or (), 'query')
    expected_queries = {_required_str(case, 'query') for case in cases}
    valid_results = (
        results is not None and len(results) == len(cases) and set(by_query) == expected_queries
    )

    matrix: list[JsonObject] = []
    for case in cases:
        query = _required_str(case, 'query')
        observation = by_query.get(query)
        matrix.append(_case_observation_row(case, observation))

    execution = _as_mapping(raw.get('execution'))
    execution_data = dict(execution) if execution is not None else _snapshot(control)
    status_value = execution_data.get('status', COMPLETE)
    status = status_value if isinstance(status_value, str) else PARTIAL
    if not valid_results or any(row.get('status') != COMPLETE for row in matrix):
        status = PARTIAL

    return _persist_stage_evidence(
        {
            'stage': stage,
            'planned_calls': len(cases),
            'status': status,
            'cases': matrix,
            'execution': execution_data,
            'artifacts': [],
        },
        workspace,
    )


def _case_observation_row(
    case: Mapping[str, object],
    observation: Mapping[str, object] | None,
) -> JsonObject:
    if observation is None:
        return {
            **dict(case),
            'status': NOT_RUN,
            'attempts': [],
            'pass': False,
            'evidence_code': 'NHR',
            'reason': 'activation attempt was not completed',
        }
    return {
        **dict(case),
        'status': COMPLETE,
        'attempts': [dict(observation)],
        'pass': observation.get('pass') is True,
    }


def run_smoke(
    skill_root: Path,
    workspace: Path,
    control: ControlLike,
    model: str | None = None,
    num_workers: int = 2,
) -> JsonObject:
    cases = _load_cases(EVAL_ROOT / SMOKE_FIXTURE)
    if model is None:
        return _adapter_result(SMOKE_STAGE, cases, control)
    return _activation_stage(
        SMOKE_STAGE,
        SMOKE_FIXTURE,
        skill_root,
        workspace,
        control,
        model,
        num_workers=num_workers,
    )


def run_release(
    skill_root: Path,
    workspace: Path,
    control: ControlLike,
    model: str | None = None,
    num_workers: int = 2,
) -> JsonObject:
    if model is None:
        return {'status': NOT_RUN, 'stages': [], 'execution': _snapshot(control)}

    runtime = _load_runtime()
    stages: list[JsonObject] = []
    for index, (name, fixture) in enumerate((
        (ACTIVATION_STAGE, ACTIVATION_FIXTURE),
        (HOLDOUT_STAGE, HOLDOUT_FIXTURE),
    )):
        stage = _activation_stage(
            name,
            fixture,
            skill_root,
            workspace,
            control,
            model,
            num_workers,
            runtime=runtime,
        )
        stages.append(stage)
        if stage.get('status') != COMPLETE:
            downstream = (8 if index == 0 else 0) + 6
            control.mark_skipped(downstream)
            return {'status': PARTIAL, 'stages': stages, 'execution': _snapshot(control)}

    early = _run_early_exit_stage(skill_root, workspace, control, model, runtime)
    stages.append(early)
    if early.get('status') != COMPLETE:
        control.mark_skipped(2)
        return {'status': PARTIAL, 'stages': stages, 'execution': _snapshot(control)}

    readiness = _run_readiness_stage(skill_root, workspace, control, model, runtime)
    stages.append(readiness)
    status = COMPLETE if readiness.get('status') == COMPLETE else PARTIAL
    return {'status': status, 'stages': stages, 'execution': _snapshot(control)}


def _run_early_exit_stage(
    skill_root: Path,
    workspace: Path,
    control: ControlLike,
    model: str,
    runtime: Runtime,
) -> JsonObject:
    cases: list[JsonObject] = [
        {
            'id': _required_str(case, 'id'),
            'query': _required_str(case, 'query'),
            'should_engage': _required_bool(case, 'should_trigger'),
        }
        for case in _load_cases(EVAL_ROOT / SMOKE_FIXTURE)
    ]
    raw = runtime.run_early_exit_cases(
        cases,
        skill_root=skill_root,
        output_dir=workspace / 'evidence' / EARLY_EXIT_STAGE,
        model=model,
        control=control,
    )
    results = _as_mapping_list(raw.get('results')) or []
    indexed = _index_by_string_key(results, 'id')
    matrix: list[JsonObject] = []
    for case in cases:
        identifier = _required_str(case, 'id')
        observation = indexed.get(identifier)
        observed = observation is not None and observation.get('status') in {COMPLETE, 'resumed'}
        row: JsonObject = {
            **case,
            'status': COMPLETE if observed else NOT_RUN,
            'attempts': [dict(observation)] if observation is not None and observed else [],
            'pass': observation.get('pass') is True
            if observation is not None and observed
            else False,
        }
        if not observed:
            row.update({'evidence_code': 'NHR', 'reason': 'early-exit attempt missing'})
        matrix.append(row)

    execution = _as_mapping(raw.get('execution'))
    execution_data = dict(execution) if execution is not None else {}
    status_value = execution_data.get('status')
    status = status_value if isinstance(status_value, str) else PARTIAL
    return _persist_stage_evidence(
        {
            'stage': EARLY_EXIT_STAGE,
            'status': status,
            'planned_calls': len(cases),
            'cases': matrix,
            'execution': execution_data,
            'artifacts': [],
        },
        workspace,
    )


def _run_readiness_stage(
    skill_root: Path,
    workspace: Path,
    control: ControlLike,
    model: str,
    runtime: Runtime,
) -> JsonObject:
    raw = runtime.run_readiness_evaluation(
        skill_root,
        workspace / 'evidence' / READINESS_STAGE,
        control,
        model,
    )
    stage: JsonObject = dict(raw)
    stage['stage'] = READINESS_STAGE
    stage['planned_calls'] = 2
    if 'artifacts' not in stage:
        stage['artifacts'] = []
    return _persist_stage_evidence(stage, workspace)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def _workspace_relative(path: Path, workspace: Path) -> str:
    resolved = path.resolve()
    root = workspace.resolve()
    if not resolved.is_relative_to(root):
        raise ValueError(f'evidence artifact is outside workspace: {path}')
    return resolved.relative_to(root).as_posix()


def _source_manifest(skill_root: Path) -> dict[str, str]:
    return _load_runtime().effective_skill_manifest(skill_root)


def _empty_counters() -> JsonObject:
    return dict.fromkeys(
        (
            'planned_calls',
            'attempted_calls',
            'resumed_calls',
            'successful_calls',
            'error_calls',
            'skipped_calls',
        ),
        0,
    )


def build_pipeline_summary(
    mode: str,
    stages: list[JsonObject] | None = None,
    *,
    execution_status: str = NOT_RUN,
    workspace: Path | None = None,
    checkpoint: Path | None = None,
    control: ControlLike | None = None,
    cli_args: list[str] | None = None,
    model: str | None = None,
    skill_root: Path | None = None,
    verdict: str = 'not_applicable',
    preflight: JsonObject | None = None,
    frozen_sources: dict[str, str] | None = None,
) -> JsonObject:
    del verdict
    plan = _build_plan(mode)
    stage_data = stages if stages is not None else plan.stages
    counters = _snapshot(control) if control is not None else _empty_counters()

    inputs: JsonObject = {}
    if skill_root is not None and (skill_root / SKILL_FILE).is_file():
        sources = frozen_sources if frozen_sources is not None else _source_manifest(skill_root)
        inputs = {
            'skill': {
                'path': str((skill_root / SKILL_FILE).resolve()),
                'sha256': sources.get(SKILL_FILE),
            },
            'source_root': str(skill_root.resolve()),
            'source_manifest': sources,
        }

    checkpoint_data: JsonObject = {
        'path': 'not-applicable',
        'sha256': None,
    }
    if checkpoint is not None:
        checkpoint_data['path'] = (
            _workspace_relative(checkpoint, workspace) if workspace is not None else str(checkpoint)
        )
        checkpoint_data['sha256'] = _sha256(checkpoint) if checkpoint.is_file() else None

    summary: JsonObject = {
        'schema_version': PIPELINE_VERSION,
        'mode': mode,
        'created_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'cli_args': cli_args or [],
        'checkpoint': checkpoint_data,
        'workspace': str(workspace) if workspace is not None else 'not-applicable',
        'model': model or 'not-applicable',
        'inputs': inputs,
        'preflight': preflight,
        'plan': plan.as_dict(),
        'stages': stage_data,
        'execution': counters,
        'execution_status': execution_status,
        'evidence_status': 'incomplete',
        'verdict': 'unavailable',
        'mode_ready': False,
        'release_ready': False,
        'evidence_validation': {'status': 'pending', 'findings': []},
    }
    _apply_evidence_decision(summary, workspace)
    return summary


def _finding(
    code: str,
    message: str,
    category: str = 'evidence',
) -> EvidenceFinding:
    return EvidenceFinding(code, category, 'blocking', message)


def _check_commands(data: object, name: str) -> list[EvidenceFinding]:
    mapping = _as_mapping(data)
    if mapping is None:
        return [_finding('MISSING_CHECK', f'{name} deterministic preflight is missing')]
    commands = _as_mapping_list(mapping.get('commands'))
    if not _check_stage_header_valid(mapping, commands):
        return [
            _finding(
                'FAILED_CHECK',
                f'{name} did not prove all three deterministic checks passed',
            )
        ]
    return []


def _check_stage_header_valid(
    data: Mapping[str, object],
    commands: list[Mapping[str, object]] | None,
) -> bool:
    if data.get('stage') != CHECK_STAGE:
        return False
    if data.get('status') != COMPLETE or data.get('passed') is not True:
        return False
    if commands is None or len(commands) != 3:
        return False
    return all(
        type(command.get('exit_code')) is int
        and command.get('exit_code') == 0
        and isinstance(command.get('command'), list)
        for command in commands
    )


def _case_observation_valid(
    stage: str,
    expected: Mapping[str, object],
    actual: Mapping[str, object],
) -> bool:
    if actual.get('status') != COMPLETE or actual.get('pass') is not True:
        return False
    attempts = _as_mapping_list(actual.get('attempts'))
    if attempts is None or len(attempts) != 1:
        return False
    observed = attempts[0]
    if stage in {ACTIVATION_STAGE, HOLDOUT_STAGE, SMOKE_STAGE}:
        return _activation_observation_valid(expected, observed)
    if stage == EARLY_EXIT_STAGE:
        return _early_exit_observation_valid(expected, observed)
    if stage == READINESS_STAGE:
        return _readiness_observation_valid(expected, observed)
    return False


def _activation_observation_valid(
    expected: Mapping[str, object],
    observed: Mapping[str, object],
) -> bool:
    runs = observed.get('runs')
    completed = observed.get('completed_runs')
    triggers = observed.get('triggers')
    rate = observed.get('trigger_rate')
    errors = observed.get('execution_errors')
    if (
        not isinstance(runs, int)
        or isinstance(runs, bool)
        or not isinstance(completed, int)
        or isinstance(completed, bool)
        or not isinstance(triggers, int)
        or isinstance(triggers, bool)
        or not isinstance(errors, int)
        or isinstance(errors, bool)
    ):
        return False
    if not isinstance(rate, (int, float)) or isinstance(rate, bool):
        return False
    if runs <= 0 or completed != runs or errors != 0 or not 0 <= triggers <= runs:
        return False
    if abs(float(rate) - triggers / runs) > 1e-8:
        return False
    should_trigger = expected.get('should_trigger')
    if not isinstance(should_trigger, bool):
        return False
    if observed.get('query') != expected.get('query'):
        return False
    if observed.get('should_trigger') is not should_trigger or observed.get('pass') is not True:
        return False
    expected_pass = float(rate) >= 0.5 if should_trigger else float(rate) < 0.5
    return expected_pass


def _early_exit_observation_valid(
    expected: Mapping[str, object],
    observed: Mapping[str, object],
) -> bool:
    should_engage = expected.get('should_engage')
    return (
        isinstance(should_engage, bool)
        and observed.get('id') == expected.get('id')
        and observed.get('query') == expected.get('query')
        and observed.get('should_engage') is should_engage
        and observed.get('status') in {COMPLETE, 'resumed'}
        and observed.get('pass') is True
        and observed.get('engaged') is should_engage
    )


def _readiness_observation_valid(
    expected: Mapping[str, object],
    observed: Mapping[str, object],
) -> bool:
    identifier = expected.get('id')
    if identifier not in {'readiness-red', 'readiness-green'}:
        return False
    expected_label = 'red' if identifier == 'readiness-red' else 'green'
    return (
        observed.get('label') == expected_label
        and type(observed.get('exit_code')) is int
        and observed.get('exit_code') == 0
        and isinstance(observed.get('skill_used'), bool)
        and isinstance(observed.get('claimed_production_ready'), bool)
        and isinstance(observed.get('blocked_unsupported_claim'), bool)
        and isinstance(observed.get('mentions_missing_behavioral_evidence'), bool)
    )


def _stage_artifact_findings(
    stage: Mapping[str, object],
    name: str,
    workspace: Path | None,
) -> list[EvidenceFinding]:
    if workspace is None:
        return [_finding('STAGE_ARTIFACT_NHR', f'{name} has no verifiable evidence workspace')]
    artifacts = _as_mapping_list(stage.get('artifacts'))
    if artifacts is None or len(artifacts) != 1:
        return [_finding('STAGE_ARTIFACT_MISSING', f'{name} has no single persisted stage record')]

    item = artifacts[0]
    expected_path = f'evidence/{name}/stage.json'
    relative_path = item.get('relative_path')
    digest = item.get('sha256')
    if relative_path != expected_path or not isinstance(digest, str):
        return [
            _finding('STAGE_ARTIFACT_IDENTITY', f'{name} persisted artifact identity is invalid')
        ]

    target = (workspace / expected_path).resolve()
    if not target.is_relative_to(workspace.resolve()) or not target.is_file():
        return [
            _finding(
                'STAGE_ARTIFACT_MISSING',
                f'{name} stage evidence file is absent or outside workspace',
            )
        ]
    if _sha256(target) != digest:
        return [_finding('STAGE_ARTIFACT_HASH', f'{name} stage evidence digest does not match')]

    try:
        observed = cast(object, json.loads(target.read_text(encoding='utf-8')))
    except OSError, ValueError:
        return [_finding('STAGE_ARTIFACT_FORMAT', f'{name} stage evidence cannot be read as JSON')]
    expected = {key: value for key, value in stage.items() if key != 'artifacts'}
    if observed != expected:
        return [_finding('STAGE_ARTIFACT_CONTENT', f'{name} stage evidence differs from summary')]
    return []


def _evidence_findings(
    summary: Mapping[str, object],
    workspace: Path | None,
) -> list[EvidenceFinding]:
    findings: list[EvidenceFinding] = []
    findings.extend(_summary_structure_findings(summary))
    mode = summary.get('mode')
    if not isinstance(mode, str) or mode not in {'check', 'smoke', 'release'}:
        findings.append(_finding('INVALID_MODE', 'pipeline mode is invalid', 'structure'))
        return findings

    plan = _build_plan(mode)
    if summary.get('plan') != plan.as_dict():
        findings.append(
            _finding('STALE_PLAN', 'execution plan or expected cases differ from frozen fixtures')
        )

    findings.extend(_stage_findings(summary, plan, workspace))
    findings.extend(_execution_findings(summary, plan))
    if mode in {'smoke', 'release'}:
        findings.extend(_live_mode_findings(summary, workspace))
    return findings


def _summary_structure_findings(
    summary: Mapping[str, object],
) -> list[EvidenceFinding]:
    required = (
        'schema_version',
        'mode',
        'plan',
        'stages',
        'execution',
        'execution_status',
        'evidence_status',
        'verdict',
        'mode_ready',
        'release_ready',
    )
    findings = [
        _finding('MISSING_FIELD', f'missing summary field: {field}', 'structure')
        for field in required
        if field not in summary
    ]
    if summary.get('schema_version') != PIPELINE_VERSION:
        findings.append(
            _finding('SCHEMA_VERSION', 'pipeline schema version does not match', 'structure')
        )
    return findings


def _stage_findings(
    summary: Mapping[str, object],
    plan: ExecutionPlan,
    workspace: Path | None,
) -> list[EvidenceFinding]:
    stages = _as_mapping_list(summary.get('stages'))
    if stages is None:
        return [_finding('INVALID_STAGES', 'stages must be a list', 'structure')]

    expected_stages = [_as_mapping(stage) for stage in plan.stages]
    if any(stage is None for stage in expected_stages):
        return [_finding('STALE_PLAN', 'internal execution plan is malformed')]

    expected = [cast(Mapping[str, object], stage) for stage in expected_stages]
    names = [stage.get('stage') for stage in stages]
    expected_names = [stage.get('stage') for stage in expected]
    findings: list[EvidenceFinding] = []
    if names != expected_names:
        findings.append(
            _finding('STAGE_SET', f'expected stage sequence {expected_names}, got {names}')
        )

    for index, oracle in enumerate(expected):
        if index >= len(stages):
            break
        findings.extend(_one_stage_findings(stages[index], oracle, workspace))
    return findings


def _one_stage_findings(
    stage: Mapping[str, object],
    oracle: Mapping[str, object],
    workspace: Path | None,
) -> list[EvidenceFinding]:
    name = oracle.get('stage')
    if not isinstance(name, str):
        return [_finding('STALE_PLAN', 'planned stage lacks a valid name')]

    findings: list[EvidenceFinding] = []
    if stage.get('planned_calls') != oracle.get('planned_calls'):
        findings.append(
            _finding('STAGE_COUNT', f'{name} planned-call count differs from frozen plan')
        )

    if name == CHECK_STAGE:
        findings.extend(_check_commands(stage, CHECK_STAGE))
        return findings

    findings.extend(_stage_artifact_findings(stage, name, workspace))
    if stage.get('status') != COMPLETE:
        findings.append(_finding('STAGE_INCOMPLETE', f'{name} is not complete'))
    findings.extend(_case_findings(name, oracle, stage))
    findings.extend(_stage_execution_findings(name, stage))

    if name == READINESS_STAGE:
        findings.extend(_readiness_stage_findings(stage))
    return findings


def _case_findings(
    stage_name: str,
    oracle_stage: Mapping[str, object],
    actual_stage: Mapping[str, object],
) -> list[EvidenceFinding]:
    expected_cases = _as_mapping_list(oracle_stage.get('cases'))
    actual_cases = _as_mapping_list(actual_stage.get('cases'))
    if expected_cases is None or actual_cases is None:
        return [_finding('MISSING_CASES', f'{stage_name} cases are missing')]

    findings: list[EvidenceFinding] = []
    expected_ids = [case.get('id') for case in expected_cases]
    actual_ids = [case.get('id') for case in actual_cases]
    if actual_ids != expected_ids:
        findings.append(
            _finding(
                'CASE_SET', f'{stage_name} has missing, duplicated, reordered, or stale case IDs'
            )
        )

    for index, oracle in enumerate(expected_cases):
        if index >= len(actual_cases):
            findings.append(
                _finding('CASE_MISSING', f'{stage_name}/{oracle.get('id')} observation is missing')
            )
            continue
        actual = actual_cases[index]
        if _oracle_changed(oracle, actual):
            findings.append(
                _finding(
                    'CASE_ORACLE', f'{stage_name}/{oracle.get('id')} changed frozen expectation'
                )
            )
        elif not _case_observation_valid(stage_name, oracle, actual):
            findings.append(
                _finding(
                    'CASE_FAILED',
                    f'{stage_name}/{oracle.get('id')} lacks a passing, verifiable observation',
                )
            )
    return findings


def _oracle_changed(
    oracle: Mapping[str, object],
    actual: Mapping[str, object],
) -> bool:
    return any(
        actual.get(key) != oracle.get(key)
        for key in ('id', 'query', 'should_trigger', 'should_engage')
        if key in oracle
    )


def _stage_execution_findings(
    name: str,
    stage: Mapping[str, object],
) -> list[EvidenceFinding]:
    execution = _as_mapping(stage.get('execution'))
    if execution is None:
        return [_finding('STAGE_EXECUTION', f'{name} execution evidence is missing')]
    if (
        execution.get('status', COMPLETE) != COMPLETE
        or execution.get('error_calls', 0) != 0
        or execution.get('skipped_calls', 0) != 0
    ):
        return [_finding('STAGE_EXECUTION', f'{name} has partial, failed or skipped execution')]
    return []


def _readiness_stage_findings(
    stage: Mapping[str, object],
) -> list[EvidenceFinding]:
    cases = _as_mapping_list(stage.get('cases'))
    if cases is None or len(cases) != 2:
        return []
    red_attempts = _as_mapping_list(cases[0].get('attempts'))
    green_attempts = _as_mapping_list(cases[1].get('attempts'))
    if red_attempts is None or green_attempts is None or not red_attempts or not green_attempts:
        return [_finding('READINESS_MISSING', 'RED/GREEN observation cannot be assessed')]
    try:
        assessed = _load_runtime().readiness_outcome(red_attempts[0], green_attempts[0])
    except KeyError, IndexError, TypeError, ValueError:
        return [_finding('READINESS_MISSING', 'RED/GREEN observation cannot be assessed')]
    if (
        assessed.get('overall') != 'PASS'
        or stage.get('overall') != 'PASS'
        or cases[0].get('pass') is not assessed.get('red_pass')
        or cases[1].get('pass') is not assessed.get('green_pass')
    ):
        return [_finding('READINESS_AMBER', 'RED/GREEN did not demonstrate a passing improvement')]
    return []


def _execution_findings(
    summary: Mapping[str, object],
    plan: ExecutionPlan,
) -> list[EvidenceFinding]:
    findings: list[EvidenceFinding] = []
    if summary.get('execution_status') != COMPLETE:
        findings.append(_finding('EXECUTION_INCOMPLETE', 'execution did not complete'))
        if summary.get('release_ready') is True:
            findings.append(
                _finding('PARTIAL_RELEASE', 'partial execution cannot be release-ready')
            )

    counters = _as_mapping(summary.get('execution'))
    if counters is None:
        findings.append(_finding('INVALID_EXECUTION', 'execution counters are missing'))
        return findings

    keys = (
        'planned_calls',
        'attempted_calls',
        'resumed_calls',
        'successful_calls',
        'error_calls',
        'skipped_calls',
    )
    parsed: dict[str, int] = {}
    for key in keys:
        value = counters.get(key)
        if type(value) is not int or value < 0:
            findings.append(
                _finding('INVALID_COUNTERS', 'execution counters must be non-negative integers')
            )
            return findings
        parsed[key] = value

    if (
        parsed['planned_calls']
        != parsed['attempted_calls'] + parsed['resumed_calls'] + parsed['skipped_calls']
    ):
        findings.append(
            _finding(
                'COUNTER_INVARIANT',
                'planned calls do not reconcile with attempted, resumed, and skipped calls',
            )
        )
    elif plan.mode != 'check' and (
        parsed['planned_calls'] != plan.base_calls
        or parsed['skipped_calls'] != 0
        or parsed['error_calls'] != 0
        or parsed['successful_calls'] != parsed['attempted_calls']
    ):
        findings.append(
            _finding(
                'COUNTER_INCOMPLETE', 'required model-call budget was not successfully observed'
            )
        )
    return findings


def _live_mode_findings(
    summary: Mapping[str, object],
    workspace: Path | None,
) -> list[EvidenceFinding]:
    findings = _check_commands(summary.get('preflight'), 'live-mode preflight')
    model = summary.get('model')
    if not isinstance(model, str) or model == 'not-applicable':
        findings.append(_finding('MODEL_MISSING', 'live model identity is missing'))
    findings.extend(_checkpoint_findings(summary, workspace))
    findings.extend(_source_findings(summary))
    return findings


def _checkpoint_findings(
    summary: Mapping[str, object],
    workspace: Path | None,
) -> list[EvidenceFinding]:
    if workspace is None:
        return [_finding('WORKSPACE_NHR', 'workspace is required to verify live evidence')]
    checkpoint = _as_mapping(summary.get('checkpoint'))
    if checkpoint is None:
        return [_finding('CHECKPOINT_MISSING', 'checkpoint identity is missing')]
    path = checkpoint.get('path')
    digest = checkpoint.get('sha256')
    if not isinstance(path, str) or path == 'not-applicable' or not isinstance(digest, str):
        return [_finding('CHECKPOINT_MISSING', 'checkpoint path and digest are required')]
    file_path = (workspace / path).resolve()
    if not file_path.is_relative_to(workspace.resolve()):
        return [_finding('CHECKPOINT_ESCAPE', 'checkpoint escapes evidence workspace')]
    if not file_path.is_file():
        return [_finding('MISSING_ARTIFACT', f'checkpoint artifact is missing: {path}')]
    if _sha256(file_path) != digest:
        return [_finding('DIGEST_MISMATCH', f'checkpoint digest mismatch: {path}')]
    return []


def _source_findings(summary: Mapping[str, object]) -> list[EvidenceFinding]:
    inputs = _as_mapping(summary.get('inputs'))
    if inputs is None:
        return [_finding('SOURCE_UNVERIFIED', 'frozen skill and support-file hashes are missing')]
    manifest = _as_mapping(inputs.get('source_manifest'))
    root_value = inputs.get('source_root')
    if manifest is None or not isinstance(root_value, str):
        return [_finding('SOURCE_UNVERIFIED', 'frozen skill and support-file hashes are missing')]

    expected_manifest = {key: value for key, value in manifest.items() if isinstance(value, str)}
    if len(expected_manifest) != len(manifest):
        return [_finding('SOURCE_UNVERIFIED', 'source manifest contains invalid entries')]

    try:
        actual = _source_manifest(Path(root_value).resolve())
    except OSError, KeyError, TypeError, ValueError, ImportError:
        actual = {}
    if actual != expected_manifest or not actual:
        return [
            _finding(
                'SOURCE_CHANGED', 'effective skill/support files changed or cannot be verified'
            )
        ]

    skill = _as_mapping(inputs.get('skill'))
    if skill is None or skill.get('sha256') != actual.get(SKILL_FILE):
        return [_finding('SKILL_HASH', 'skill hash does not match frozen source manifest')]
    return []


def _decision_values(
    summary: Mapping[str, object],
    complete: bool,
) -> JsonObject:
    if complete:
        verdict = 'pass'
    elif summary.get('execution_status') == COMPLETE:
        verdict = 'fail'
    else:
        verdict = 'unavailable'
    return {
        'evidence_status': COMPLETE if complete else 'incomplete',
        'verdict': verdict,
        'mode_ready': complete,
        'release_ready': complete and summary.get('mode') == 'release',
    }


def _apply_evidence_decision(
    summary: JsonObject,
    workspace: Path | None,
) -> list[EvidenceFinding]:
    findings = _evidence_findings(summary, workspace)
    values = _decision_values(summary, not findings)
    summary.update(values)
    summary['evidence_validation'] = {
        'status': COMPLETE if not findings else 'incomplete',
        'validator_version': PIPELINE_VERSION,
        'findings': [asdict(finding) for finding in findings],
    }
    return findings


def validate_pipeline_summary(
    summary: JsonObject,
    workspace: Path | None = None,
) -> list[EvidenceFinding]:
    findings = _evidence_findings(summary, workspace)
    expected = _decision_values(summary, not findings)
    for key, value in expected.items():
        if summary.get(key) != value:
            findings.append(_finding('FORGED_DECISION', f'{key} conflicts with verified evidence'))
    return findings


def write_pipeline_summary(summary: JsonObject, workspace: Path) -> Path:
    target = workspace / 'pipeline-summary.json'
    _apply_evidence_decision(summary, workspace)
    _atomic_json_write(target, summary)
    return target


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('check', 'smoke', 'release'))
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--workspace')
    parser.add_argument('--model')
    parser.add_argument('--max-model-calls', type=int)
    parser.add_argument('--checkpoint')
    parser.add_argument('--deadline-seconds', type=float)
    parser.add_argument('--num-workers', type=int, default=2)
    return parser


def _validated_live_inputs(
    args: argparse.Namespace,
    plan: ExecutionPlan,
    runtime: Runtime,
) -> tuple[Path, str, int, Path]:
    if not isinstance(args.workspace, str) or not args.workspace:
        raise ValueError('workspace is required for live modes')
    if not isinstance(args.model, str) or not args.model:
        raise ValueError('model is required for live modes')
    if type(args.num_workers) is not int or args.num_workers <= 0:
        raise ValueError('num-workers must be positive')

    model = runtime.validate_model_id(args.model)
    workspace = Path(args.workspace).resolve()
    if workspace.is_relative_to(SKILL_ROOT.resolve()):
        raise ValueError('workspace must be outside the skill source directory')
    workspace.mkdir(parents=True, exist_ok=True)

    max_calls = args.max_model_calls
    if max_calls is None:
        max_calls = plan.maximum_calls
    if type(max_calls) is not int or max_calls <= 0:
        raise ValueError('max-model-calls must be positive')

    checkpoint = (
        Path(args.checkpoint).resolve()
        if isinstance(args.checkpoint, str) and args.checkpoint
        else workspace / 'checkpoints' / f'{args.mode}.jsonl'
    )
    if not checkpoint.resolve().is_relative_to(workspace):
        raise ValueError('checkpoint must be inside the selected evidence workspace')
    return workspace, model, max_calls, checkpoint


def _run_check_mode(args: argparse.Namespace) -> int:
    workspace = (
        Path(args.workspace).resolve()
        if isinstance(args.workspace, str) and args.workspace
        else None
    )
    result = run_check(SKILL_ROOT, workspace)
    passed = result.get('passed') is True
    summary = build_pipeline_summary(
        'check',
        [result],
        execution_status=COMPLETE if passed else 'short_circuited',
        workspace=workspace,
        skill_root=SKILL_ROOT,
    )
    if workspace is not None:
        write_pipeline_summary(summary, workspace)
    print(json.dumps(summary, indent=2, allow_nan=False))
    return 0 if passed else 1


def _run_live_mode(args: argparse.Namespace, plan: ExecutionPlan) -> int:
    runtime = _load_runtime()
    workspace, model, max_calls, checkpoint_path = _validated_live_inputs(args, plan, runtime)
    frozen_sources = runtime.effective_skill_manifest(SKILL_ROOT)
    check = run_check(SKILL_ROOT, workspace)
    if check.get('passed') is not True:
        summary = build_pipeline_summary(
            'check',
            [check],
            execution_status='short_circuited',
            workspace=workspace,
            model=model,
            skill_root=SKILL_ROOT,
        )
        write_pipeline_summary(summary, workspace)
        print(json.dumps(summary, indent=2, allow_nan=False))
        return 1

    if max_calls < plan.base_calls:
        print(
            f'Warning: cap {max_calls} is below the {plan.base_calls}-call base; run may be partial.',
            file=sys.stderr,
        )

    control = runtime.control_factory(
        max_calls=max_calls,
        planned_calls=plan.base_calls,
        checkpoint=runtime.checkpoint_store(checkpoint_path),
        deadline_seconds=args.deadline_seconds
        if isinstance(args.deadline_seconds, (int, float))
        else None,
    )
    if args.mode == 'smoke':
        result = run_smoke(SKILL_ROOT, workspace, control, model, args.num_workers)
        stages = [result]
    else:
        result = run_release(SKILL_ROOT, workspace, control, model, args.num_workers)
        raw_stages = _as_mapping_list(result.get('stages'))
        stages = [dict(stage) for stage in raw_stages] if raw_stages is not None else []

    status = result.get('status')
    execution_status = status if isinstance(status, str) else PARTIAL
    summary = build_pipeline_summary(
        args.mode,
        stages,
        execution_status=execution_status,
        workspace=workspace,
        checkpoint=checkpoint_path,
        control=control,
        model=model,
        skill_root=SKILL_ROOT,
        preflight=check,
        frozen_sources=frozen_sources,
    )
    write_pipeline_summary(summary, workspace)
    print(json.dumps(summary, indent=2, allow_nan=False))
    if summary.get('release_ready') is True:
        return 0
    if args.mode == 'smoke' and summary.get('mode_ready') is True:
        return 0
    return 2 if execution_status != COMPLETE else 1


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        plan = _build_plan(args.mode)
    except (OSError, ValueError) as exc:
        print(f'Invalid pipeline inputs: {exc}', file=sys.stderr)
        return 2

    if args.dry_run:
        summary = build_pipeline_summary(
            args.mode,
            execution_status=NOT_RUN,
            model='not-applicable',
        )
        print(json.dumps(summary, indent=2, allow_nan=False))
        return 0

    if args.mode == 'check':
        return _run_check_mode(args)

    try:
        return _run_live_mode(args, plan)
    except (ImportError, OSError, ValueError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
