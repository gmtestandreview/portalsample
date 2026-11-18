from __future__ import annotations

import importlib
import json
import sys
import tempfile
import unittest
from collections.abc import Callable
from pathlib import Path
from typing import Protocol, TypedDict, cast
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


class EarlyExitCase(TypedDict):
    id: str
    query: str
    should_engage: bool


class _ExecutionSummary(TypedDict):
    status: str


class _RunCasesResult(TypedDict):
    results: list[dict[str, object]]
    execution: _ExecutionSummary


class _EvaluationControl(Protocol):
    @property
    def skipped_calls(self) -> int: ...


class _EvaluationControlFactory(Protocol):
    def __call__(
        self,
        *,
        max_calls: int,
        planned_calls: int,
        checkpoint: object | None,
        deadline_seconds: float | None,
    ) -> _EvaluationControl: ...


class _RunEarlyExitEval(Protocol):
    def main(self) -> int: ...

    def _validated_cases(self, cases: object) -> list[EarlyExitCase]: ...

    def _engaged_from_run_data(self, run_data: object) -> bool | None: ...

    def run_cases(
        self,
        cases: list[EarlyExitCase],
        *,
        skill_root: Path,
        output_dir: Path,
        model: str,
        control: _EvaluationControl,
    ) -> _RunCasesResult: ...


run_early_exit_eval = cast(
    _RunEarlyExitEval,
    importlib.import_module('run_early_exit_eval'),
)
EvaluationControl = cast(
    _EvaluationControlFactory,
    importlib.import_module('eval_control').EvaluationControl,
)
validated_cases = cast(
    'Callable[[object], list[EarlyExitCase]]',
    getattr(run_early_exit_eval, '_validated_cases'),
)
engaged_from_run_data = cast(
    'Callable[[object], bool | None]',
    getattr(run_early_exit_eval, '_engaged_from_run_data'),
)


class EarlyExitControlTests(unittest.TestCase):
    def test_case_set_rejects_missing_boolean_empty_and_duplicate(self) -> None:
        empty_cases: list[object] = []
        non_boolean_cases: list[object] = [{'id': 'one', 'query': 'q', 'should_engage': 'false'}]
        duplicate_id_cases: list[object] = [
            {'id': 'one', 'query': 'q', 'should_engage': True},
            {'id': 'one', 'query': 'q2', 'should_engage': False},
        ]
        empty_query_cases: list[object] = [{'id': 'one', 'query': '', 'should_engage': True}]
        duplicate_query_cases: list[object] = [
            {'id': 'one', 'query': 'q', 'should_engage': True},
            {'id': 'two', 'query': 'q', 'should_engage': False},
        ]
        invalid_cases: tuple[tuple[list[object], str], ...] = (
            (empty_cases, 'non-empty JSON array'),
            (non_boolean_cases, 'boolean'),
            (duplicate_id_cases, 'duplicate'),
            (empty_query_cases, 'non-empty query'),
            (duplicate_query_cases, 'duplicate'),
        )

        for cases, message in invalid_cases:
            with self.subTest(message=message), self.assertRaisesRegex(ValueError, message):
                validated_cases(cases)

    def test_case_cli_fails_closed_before_invoking_model(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'SKILL.md').write_text('test', encoding='utf-8')
            data = root / 'cases.json'
            data.write_text(
                json.dumps([{'id': 'x', 'query': 'prompt', 'should_engage': None}]),
                encoding='utf-8',
            )
            argv = [
                'run_early_exit_eval',
                '--cases',
                str(data),
                '--skill-root',
                str(root),
                '--output-dir',
                str(root / 'evidence'),
                '--model',
                'claude-sonnet-4-6',
                '--max-model-calls',
                '1',
            ]
            with (
                patch.object(sys, 'argv', argv),
                patch.object(run_early_exit_eval, 'run_claude') as claude,
                self.assertRaises(SystemExit) as exc,
            ):
                run_early_exit_eval.main()

            self.assertEqual(exc.exception.code, 2)
            claude.assert_not_called()

    def test_unobserved_or_failed_probe_is_not_a_negative_result(self) -> None:
        classify = engaged_from_run_data
        no_events: dict[str, object] = {'exit_code': 0, 'events': []}
        failed_events: list[dict[str, object]] = [{'type': 'result', 'result': 'false'}]
        failed_probe: dict[str, object] = {'exit_code': 1, 'events': failed_events}
        error_events: list[dict[str, object]] = [
            {'type': 'result', 'is_error': True, 'result': 'false'}
        ]
        error_probe: dict[str, object] = {'exit_code': 0, 'events': error_events}
        false_events: list[dict[str, object]] = [{'type': 'result', 'result': 'false'}]
        false_probe: dict[str, object] = {'exit_code': 0, 'events': false_events}
        true_events: list[dict[str, object]] = [{'type': 'result', 'result': 'true'}]
        true_probe: dict[str, object] = {'exit_code': 0, 'events': true_events}

        self.assertIsNone(classify(no_events))
        self.assertIsNone(classify(failed_probe))
        self.assertIsNone(classify(error_probe))
        self.assertIs(classify(false_probe), False)
        self.assertIs(classify(true_probe), True)

    def test_successful_cases_are_accounted_and_stop_at_budget(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'SKILL.md').write_text('skill', encoding='utf-8')
            control = EvaluationControl(
                max_calls=1,
                planned_calls=2,
                checkpoint=None,
                deadline_seconds=None,
            )
            cases: list[EarlyExitCase] = [
                {'id': 'one', 'query': 'one', 'should_engage': True},
                {'id': 'two', 'query': 'two', 'should_engage': False},
            ]
            with patch.object(run_early_exit_eval, 'run_claude', return_value={'engaged': True}):
                result = run_early_exit_eval.run_cases(
                    cases,
                    skill_root=root,
                    output_dir=root / 'evidence',
                    model='claude-sonnet-4-6',
                    control=control,
                )

        self.assertEqual(len(result['results']), 1)
        self.assertEqual(result['execution']['status'], 'partial')
        self.assertEqual(control.skipped_calls, 1)


if __name__ == '__main__':
    unittest.main()
