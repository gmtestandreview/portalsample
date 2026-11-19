from __future__ import annotations

import copy
import importlib
import json
import subprocess
import sys
import tempfile
import unittest
from collections.abc import Callable
from pathlib import Path
from typing import Literal, Protocol, TypedDict, cast
from unittest.mock import Mock, patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

AttemptRecord = TypedDict(
    'AttemptRecord',
    {
        'query': str,
        'should_trigger': bool,
        'runs': int,
        'completed_runs': int,
        'triggers': int,
        'trigger_rate': float,
        'execution_errors': int,
        'pass': bool,
        'id': str,
        'should_engage': bool,
        'status': str,
        'engaged': bool,
        'label': str,
        'exit_code': int,
        'skill_used': bool,
        'claimed_production_ready': bool,
        'blocked_unsupported_claim': bool,
        'mentions_missing_behavioral_evidence': bool,
    },
    total=False,
)


class _CaseRequired(TypedDict):
    id: str
    query: str
    status: str
    attempts: list[AttemptRecord]


class CaseRecord(_CaseRequired, total=False):
    should_trigger: bool
    should_engage: bool
    evidence_code: str
    reason: str


class StageExecution(TypedDict, total=False):
    status: str
    error_calls: int
    skipped_calls: int


class ArtifactRecord(TypedDict):
    sha256: str
    relative_path: str


class _StageRequired(TypedDict):
    stage: str
    planned_calls: int
    status: str
    cases: list[CaseRecord]
    artifacts: list[ArtifactRecord]


class StageRecord(_StageRequired, total=False):
    execution: StageExecution
    overall: str


class ExecutionPlan(TypedDict):
    mode: str
    stages: list[StageRecord]
    base_calls: int
    maximum_calls: int
    adaptive_confirmation_reserve: int


class ActivationCase(TypedDict):
    id: str
    query: str
    should_trigger: bool


class ExecutionCounters(TypedDict):
    planned_calls: int
    attempted_calls: int
    resumed_calls: int
    successful_calls: int
    error_calls: int
    skipped_calls: int


class SourceInputs(TypedDict, total=False):
    source_manifest: dict[str, str]


class CheckpointRecord(TypedDict):
    path: str
    sha256: str | None


class CheckCommand(TypedDict):
    command: list[str]
    exit_code: int


class CheckResult(TypedDict):
    stage: str
    status: str
    passed: bool
    commands: list[CheckCommand]


class EvidenceValidation(TypedDict):
    status: str


class PipelineSummary(TypedDict):
    stages: list[StageRecord]
    execution: ExecutionCounters
    execution_status: str
    release_ready: bool
    mode_ready: bool
    verdict: str
    evidence_status: str
    evidence_validation: EvidenceValidation
    inputs: SourceInputs
    checkpoint: CheckpointRecord
    preflight: CheckResult | None


class EvidenceFindingLike(Protocol):
    code: str


def _require_preflight(summary: PipelineSummary) -> CheckResult:
    preflight = summary['preflight']
    if preflight is None:
        raise AssertionError('expected preflight evidence')
    return preflight


def _require_case_flag(case: CaseRecord, key: Literal['should_trigger', 'should_engage']) -> bool:
    """Require a stage-specific field without assuming every stage has it."""
    if key == 'should_trigger':
        if 'should_trigger' not in case:
            raise KeyError(key)
        return case['should_trigger']
    if 'should_engage' not in case:
        raise KeyError(key)
    return case['should_engage']


def _set_case_pass(case: CaseRecord, passed: bool) -> None:
    # The JSON key is a Python keyword, so it cannot be a class field.
    cast(dict[str, object], case)['pass'] = passed


def _require_source_manifest(summary: PipelineSummary) -> dict[str, str]:
    """Only a populated frozen-source summary supplies this optional field."""
    inputs = summary['inputs']
    if 'source_manifest' not in inputs:
        raise KeyError('source_manifest')
    return inputs['source_manifest']


_run_pipeline = importlib.import_module('run_pipeline')
load_runtime_attr = cast(Callable[[str, str], object], _run_pipeline._load_attr)
EVAL_ROOT = cast(Path, _run_pipeline.EVAL_ROOT)
build_execution_plan = cast(
    Callable[[str], ExecutionPlan],
    _run_pipeline.build_execution_plan,
)
main = cast(Callable[[list[str]], int], _run_pipeline.main)
load_cases = cast(
    Callable[..., list[ActivationCase]],
    _run_pipeline._load_cases,
)
run_check = cast(Callable[..., CheckResult], _run_pipeline.run_check)
build_pipeline_summary = cast(
    Callable[..., PipelineSummary],
    _run_pipeline.build_pipeline_summary,
)
validate_pipeline_summary = cast(
    Callable[..., list[EvidenceFindingLike]],
    _run_pipeline.validate_pipeline_summary,
)
persist_stage_evidence = cast(
    Callable[[StageRecord, Path], object],
    _run_pipeline._persist_stage_evidence,
)
write_pipeline_summary = cast(
    Callable[[PipelineSummary, Path], Path],
    _run_pipeline.write_pipeline_summary,
)
activation_stage = cast(
    Callable[..., StageRecord],
    _run_pipeline._activation_stage,
)
runtime_factory = cast(Callable[..., object], _run_pipeline.Runtime)


class PipelineTests(unittest.TestCase):
    def test_execution_plans_have_smoke_and_release_budgets(self) -> None:
        smoke = build_execution_plan('smoke')
        release = build_execution_plan('release')
        self.assertEqual(smoke['base_calls'], 4)
        self.assertEqual(release['base_calls'], 34)
        self.assertEqual(release['maximum_calls'], 40)
        self.assertEqual([stage['planned_calls'] for stage in release['stages']], [20, 8, 4, 2])

    def test_dry_run_needs_no_workspace_or_model(self) -> None:
        self.assertEqual(main(['smoke', '--dry-run']), 0)

    def test_bundled_activation_corpus_has_expected_counts_and_polarity(self) -> None:
        expected = {
            'activation-smoke.json': 4,
            'activation-eval.json': 20,
            'activation-holdout.json': 8,
        }
        for filename, count in expected.items():
            with self.subTest(filename=filename):
                cases = load_cases(EVAL_ROOT / filename, expected_count=count)
                self.assertEqual(len(cases), count)
                self.assertTrue(any(case['should_trigger'] for case in cases))
                self.assertTrue(any(not case['should_trigger'] for case in cases))

    def test_missing_or_incomplete_activation_corpus_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'activation-smoke.json'
            with self.assertRaisesRegex(ValueError, 'Missing bundled'):
                load_cases(path, expected_count=4)
            path.write_text(
                '[{"id":"one","query":"skill","should_trigger":true}]', encoding='utf-8'
            )
            with self.assertRaisesRegex(ValueError, 'must contain 4'):
                load_cases(path, expected_count=4)

    def test_invalid_case_types_and_duplicates_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'cases.json'
            invalid_cases: list[tuple[list[dict[str, object]], str]] = [
                ([{'id': 'x', 'query': 'create skill', 'should_trigger': 'yes'}], 'boolean'),
                (
                    [
                        {'id': 'x', 'query': 'create skill', 'should_trigger': True},
                        {'id': 'x', 'query': 'other skill', 'should_trigger': False},
                    ],
                    'duplicate',
                ),
            ]
            for cases, message in invalid_cases:
                with self.subTest(message=message):
                    path.write_text(json.dumps(cases), encoding='utf-8')
                    with self.assertRaisesRegex(ValueError, message):
                        load_cases(path)

    def test_missing_corpus_dry_run_has_explicit_error_exit(self) -> None:
        with patch.object(_run_pipeline, 'EVAL_ROOT', Path('/nonexistent/skill-activation-cases')):
            self.assertEqual(main(['smoke', '--dry-run']), 2)

    def test_check_stops_after_first_failed_gate(self) -> None:
        failed = subprocess.CompletedProcess(['python'], 1, 'out', 'err')
        with patch.object(subprocess, 'run', return_value=failed) as run:
            result = run_check(Path('.'))
        self.assertFalse(result['passed'])
        run.assert_called_once()

    def test_runtime_loader_rejects_names_outside_the_allowlist(self) -> None:
        with patch.object(importlib, 'import_module') as import_module:
            with self.assertRaises(ImportError):
                load_runtime_attr('json', 'loads')
        import_module.assert_not_called()

    def test_summary_validator_finds_counter_and_partial_readiness_errors(self) -> None:
        summary = build_pipeline_summary(
            'release',
            execution_status='partial',
            verdict='pass',
        )
        summary['execution']['planned_calls'] = 34
        summary['execution']['attempted_calls'] = 1
        summary['release_ready'] = True
        findings = validate_pipeline_summary(summary)
        codes = {finding.code for finding in findings}
        self.assertIn('COUNTER_INVARIANT', codes)
        self.assertIn('PARTIAL_RELEASE', codes)

    def _all_green_release(self, workspace: Path) -> PipelineSummary:
        """Synthetic validator oracle only: never publish this as executed host evidence."""
        plan = build_execution_plan('release')
        stages = copy.deepcopy(plan['stages'])
        for stage in stages:
            stage['status'] = 'complete'
            stage['execution'] = {'status': 'complete', 'error_calls': 0, 'skipped_calls': 0}
            for case in stage['cases']:
                case['status'] = 'complete'
                _set_case_pass(case, True)
                case.pop('evidence_code', None)
                case.pop('reason', None)
                if stage['stage'] in ('activation', 'holdout'):
                    expected = _require_case_flag(case, 'should_trigger')
                    case['attempts'] = [
                        {
                            'query': case['query'],
                            'should_trigger': expected,
                            'runs': 1,
                            'completed_runs': 1,
                            'triggers': int(expected),
                            'trigger_rate': float(expected),
                            'execution_errors': 0,
                            'pass': True,
                        }
                    ]
                elif stage['stage'] == 'early-exit':
                    case['attempts'] = [
                        {
                            'id': case['id'],
                            'query': case['query'],
                            'should_engage': _require_case_flag(case, 'should_engage'),
                            'status': 'complete',
                            'pass': True,
                            'engaged': _require_case_flag(case, 'should_engage'),
                        }
                    ]
                else:
                    red = case['id'] == 'readiness-red'
                    case['attempts'] = [
                        {
                            'label': 'red' if red else 'green',
                            'exit_code': 0,
                            'skill_used': not red,
                            'claimed_production_ready': red,
                            'blocked_unsupported_claim': not red,
                            'mentions_missing_behavioral_evidence': not red,
                        }
                    ]
            if stage['stage'] == 'readiness-pressure':
                stage['overall'] = 'PASS'
            persist_stage_evidence(stage, workspace)
        (workspace / 'checkpoints').mkdir(exist_ok=True)
        checkpoint = workspace / 'checkpoints' / 'release.jsonl'
        checkpoint.write_text('{"synthetic":true}\n', encoding='utf-8')
        check: CheckResult = {
            'stage': 'check',
            'status': 'complete',
            'passed': True,
            'commands': [
                {'command': ['python', '-m', command], 'exit_code': 0}
                for command in ('scripts.quick_validate', 'unittest', 'pytest')
            ],
        }
        summary = build_pipeline_summary(
            'release',
            stages,
            execution_status='complete',
            workspace=workspace,
            checkpoint=checkpoint,
            skill_root=SCRIPTS_DIR.parent,
            model='claude-sonnet-4-5-20250929',
            preflight=check,
        )
        summary['execution'] = {
            'planned_calls': 34,
            'attempted_calls': 34,
            'resumed_calls': 0,
            'successful_calls': 34,
            'error_calls': 0,
            'skipped_calls': 0,
        }
        return summary

    def test_zero_passing_cases_never_becomes_release_ready(self) -> None:
        summary = build_pipeline_summary('release', execution_status='complete', verdict='pass')
        self.assertFalse(summary['release_ready'])
        self.assertNotEqual(summary['verdict'], 'pass')
        self.assertTrue(validate_pipeline_summary(summary))

    def test_frozen_all_green_synthetic_control_passes_evidence_validator(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            summary = self._all_green_release(workspace)
            output = write_pipeline_summary(summary, workspace)
            saved = cast(PipelineSummary, json.loads(output.read_text(encoding='utf-8')))
            self.assertEqual(saved['evidence_validation']['status'], 'complete')
            self.assertEqual(saved['verdict'], 'pass')
            self.assertTrue(saved['release_ready'])
            self.assertEqual(validate_pipeline_summary(saved, workspace), [])

    def test_adversarial_release_mutations_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            clean = self._all_green_release(workspace)
            changes: dict[str, Callable[[PipelineSummary], object]] = {
                'all_cases_failed': lambda x: [
                    _set_case_pass(case, False)
                    for stage in x['stages']
                    for case in stage['cases']
                ],
                'one_case_failed': lambda x: _set_case_pass(x['stages'][0]['cases'][0], False),
                'missing_stage': lambda x: x['stages'].pop(),
                'missing_case': lambda x: x['stages'][0]['cases'].pop(),
                'duplicate_case': lambda x: x['stages'][0]['cases'].append(
                    copy.deepcopy(x['stages'][0]['cases'][0])
                ),
                'stale_case_id': lambda x: x['stages'][0]['cases'][0].update({
                    'id': 'retired-case'
                }),
                'changed_frozen_oracle': lambda x: x['stages'][0]['cases'][0].update({
                    'should_trigger': False
                }),
                'negative_triggered': lambda x: x['stages'][0]['cases'][-1]['attempts'][0].update({
                    'triggers': 1
                }),
                'unobserved_activation': lambda x: x['stages'][0]['cases'][0].update({
                    'attempts': []
                }),
                'early_exit_mismatch': lambda x: x['stages'][2]['cases'][0]['attempts'][0].update({
                    'engaged': not _require_case_flag(x['stages'][2]['cases'][0], 'should_engage')
                }),
                'readiness_amber': lambda x: x['stages'][3].update({'overall': 'AMBER'}),
                'readiness_unsupported': lambda x: x['stages'][3]['cases'][1]['attempts'][
                    0
                ].update({'claimed_production_ready': True}),
                'stage_incomplete': lambda x: x['stages'][0].update({'status': 'partial'}),
                'missing_preflight': lambda x: x.update({'preflight': None}),
                'failing_preflight': lambda x: _require_preflight(x)['commands'][0].update({
                    'exit_code': 1
                }),
                'stale_source': lambda x: _require_source_manifest(x).update({
                    'SKILL.md': '0' * 64
                }),
                'incomplete_budget': lambda x: x['execution'].update({
                    'successful_calls': 33,
                    'error_calls': 1,
                }),
                'skipped_case_budget': lambda x: x['execution'].update({
                    'attempted_calls': 33,
                    'skipped_calls': 1,
                    'successful_calls': 33,
                }),
                'missing_checkpoint': lambda x: x['checkpoint'].update({
                    'path': 'checkpoints/missing.jsonl'
                }),
                'bad_stage_digest': lambda x: x['stages'][0]['artifacts'][0].update({
                    'sha256': '0' * 64
                }),
                'missing_stage_artifact': lambda x: x['stages'][0].update({'artifacts': []}),
                'tampered_checkpoint': lambda x: x['checkpoint'].update({'sha256': 'f' * 64}),
            }
            for label, mutate in changes.items():
                with self.subTest(label=label):
                    summary = copy.deepcopy(clean)
                    mutate(summary)
                    # Caller attempts to force a passing release despite invalid evidence.
                    summary.update({
                        'verdict': 'pass',
                        'mode_ready': True,
                        'release_ready': True,
                        'evidence_status': 'complete',
                    })
                    findings = validate_pipeline_summary(summary, workspace)
                    self.assertTrue(findings, label)
                    write_pipeline_summary(summary, workspace)
                    self.assertFalse(summary['release_ready'], label)
                    self.assertFalse(summary['mode_ready'], label)
                    self.assertEqual(summary['evidence_status'], 'incomplete', label)
                    self.assertNotEqual(summary['verdict'], 'pass', label)

    def test_source_file_change_invalidates_frozen_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            summary = self._all_green_release(workspace)
            # Assert source changes are caught without touching the real source files.
            _require_source_manifest(summary)['references/evaluation-workflow.md'] = '0' * 64
            codes = {f.code for f in validate_pipeline_summary(summary, workspace)}
            self.assertIn('SOURCE_CHANGED', codes)

    def test_worker_option_reaches_activation_evaluator(self) -> None:
        cases = load_cases(EVAL_ROOT / 'activation-smoke.json')
        results: list[dict[str, object]] = [
            {
                'query': case['query'],
                'should_trigger': case['should_trigger'],
                'pass': True,
                'trigger_rate': float(case['should_trigger']),
                'triggers': int(case['should_trigger']),
                'runs': 1,
                'completed_runs': 1,
                'execution_errors': 0,
            }
            for case in cases
        ]
        evaluate = Mock(
            return_value={
                'results': results,
                'execution': {'status': 'complete', 'error_calls': 0, 'skipped_calls': 0},
            }
        )

        def fake_effective_skill_digest(_root: Path) -> str:
            return '0' * 64

        def fake_parse_skill_md(_root: Path) -> tuple[str, str, object]:
            return 'skill-creator', 'Create agent skills', ''

        runtime = runtime_factory(
            checkpoint_store=Mock(),
            control_factory=Mock(),
            effective_skill_digest=fake_effective_skill_digest,
            effective_skill_manifest=Mock(),
            validate_model_id=Mock(),
            run_early_exit_cases=Mock(),
            run_eval=evaluate,
            readiness_outcome=Mock(),
            run_readiness_evaluation=Mock(),
            parse_skill_md=fake_parse_skill_md,
        )
        with tempfile.TemporaryDirectory() as tmp:
            stage = activation_stage(
                'activation-smoke',
                'activation-smoke.json',
                SCRIPTS_DIR.parent,
                Path(tmp),
                Mock(),
                'claude-sonnet-4-5-20250929',
                num_workers=5,
                runtime=runtime,
            )
        self.assertEqual(stage['status'], 'complete')
        self.assertEqual(evaluate.call_args.kwargs['num_workers'], 5)
        # An ID is important for stage evidence, but forbidden by run_eval's
        # strict input contract. Assert the actual mocked live handoff.
        call_kwargs = cast(dict[str, object], evaluate.call_args.kwargs)
        submitted = cast(list[ActivationCase], call_kwargs['eval_set'])
        self.assertEqual(
            submitted,
            [{'query': case['query'], 'should_trigger': case['should_trigger']} for case in cases],
        )
        self.assertTrue(all(set(item) == {'query', 'should_trigger'} for item in submitted))
        self.assertEqual(
            [case['id'] for case in stage['cases']],
            [case['id'] for case in cases],
        )

    def test_workspace_and_external_checkpoint_rejected(self) -> None:
        with (
            tempfile.TemporaryDirectory() as tmp,
            patch.object(
                _run_pipeline,
                'run_check',
                return_value={
                    'stage': 'check',
                    'status': 'complete',
                    'passed': True,
                    'commands': [{'command': ['python'], 'exit_code': 0}] * 3,
                },
            ),
        ):
            self.assertEqual(
                main([
                    'smoke',
                    '--workspace',
                    str(SCRIPTS_DIR.parent / 'inside-source'),
                    '--model',
                    'claude-sonnet-4-5-20250929',
                ]),
                2,
            )
            self.assertEqual(
                main([
                    'smoke',
                    '--workspace',
                    str(Path(tmp) / 'evidence'),
                    '--checkpoint',
                    str(Path(tmp) / 'outside.jsonl'),
                    '--model',
                    'claude-sonnet-4-5-20250929',
                ]),
                2,
            )

    def test_documentation_names_modes_and_independent_readiness_gates(self) -> None:
        skill = (SCRIPTS_DIR.parent / 'SKILL.md').read_text(encoding='utf-8')
        workflow = (SCRIPTS_DIR.parent / 'references' / 'evaluation-workflow.md').read_text(
            encoding='utf-8'
        )
        schemas = (SCRIPTS_DIR.parent / 'references' / 'schemas.md').read_text(encoding='utf-8')
        for phrase in ('check', 'smoke', 'release', 'zero Claude calls', 'release_ready', 'NHR'):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, skill)
        self.assertIn('34 base', workflow)
        self.assertIn('planned_calls', schemas)
        self.assertIn('checkpoint completion is not evidence', skill.lower())


if __name__ == '__main__':
    unittest.main()
