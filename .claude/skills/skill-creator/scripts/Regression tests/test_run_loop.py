from __future__ import annotations

# This test is executed from a nested directory that is not the Pylance
# workspace root.  Imports are made resolvable at runtime by the sys.path
# bootstrap below; keep analysis quiet when the editor's workspace is higher.
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

# The test directory is ``scripts/Regression tests``. Import the production
# modules under their canonical ``scripts.*`` names, avoiding duplicate module
# identities when another test also imports them as a package.
SKILL_ROOT = Path(__file__).resolve().parents[2]
if str(SKILL_ROOT) not in sys.path:
    sys.path.insert(0, str(SKILL_ROOT))

# Pylance must analyze this test with the skill-creator directory as its
# workspace/import root; it does not execute the sys.path bootstrap above.
from scripts.eval_control import EvaluationControl  # noqa: E402

from scripts import run_loop  # noqa: E402


class RunLoopControlTests(unittest.TestCase):
    def test_split_is_stratified_and_frozen(self) -> None:
        cases: list[run_loop.EvalCase] = [
            {'query': f'positive-{i}', 'should_trigger': True} for i in range(4)
        ] + [{'query': f'negative-{i}', 'should_trigger': False} for i in range(4)]
        before = [item.copy() for item in cases]
        first_train, first_holdout = run_loop.split_eval_set(cases, 0.5)
        second_train, second_holdout = run_loop.split_eval_set(cases, 0.5)
        self.assertEqual(cases, before)
        self.assertEqual((first_train, first_holdout), (second_train, second_holdout))
        self.assertFalse(
            {item['query'] for item in first_train} & {item['query'] for item in first_holdout}
        )
        self.assertEqual(sum(x['should_trigger'] for x in first_holdout), 2)
        self.assertEqual(sum(not x['should_trigger'] for x in first_holdout), 2)

    def test_partial_holdout_is_nhr_not_a_measured_score(self) -> None:
        control = EvaluationControl(
            max_calls=4, planned_calls=4, checkpoint=None, deadline_seconds=None
        )
        best: dict[str, object] = {
            'description': 'candidate',
            'train_passed': 2,
            'train_total': 2,
            'iteration': 1,
            'test_passed': None,
            'test_total': None,
            'test_evidence_status': 'not_run',
        }
        result: tuple[list[dict[str, object]], run_loop.EvalSummary, dict[str, object], float] = (
            [{'query': 'holdout', 'should_trigger': True, 'pass': False}],
            {'passed': 0, 'failed': 1, 'total': 1},
            {'execution': {'status': 'partial', 'stop_reason': 'rate_limited'}},
            0.1,
        )
        with patch.object(run_loop, '_evaluate_cases', return_value=result):
            run_loop._evaluate_frozen_holdout(
                best=best,
                test_set=[{'query': 'holdout', 'should_trigger': True}],
                skill_name='demo',
                num_workers=1,
                timeout=1,
                project_root=Path('.'),
                runs_per_query=1,
                trigger_threshold=0.5,
                model='claude-sonnet-4-6',
                verbose=False,
                control=control,
            )
        self.assertEqual(best['test_evidence_status'], 'NHR')
        self.assertIsNone(best['test_passed'])
        output = run_loop._build_loop_output(
            exit_reason='max_iterations',
            original_description='old',
            current_description='candidate',
            history=[best],
            holdout=0.5,
            train_set=[{'query': 'train', 'should_trigger': True}],
            test_set=[{'query': 'holdout', 'should_trigger': True}],
            verbose=False,
            control=control,
            call_plan={'worst_case_calls': 4, 'max_trigger_probes': 4, 'max_rewrite_calls': 0},
        )
        self.assertEqual(output['best_score'], 'NHR')
        self._assert_partial_execution(output['execution'])
        self.assertEqual(output['holdout_evidence_status'], 'NHR')

    def test_evaluate_cases_passes_shared_control_and_partial_is_unavailable(self) -> None:
        control = EvaluationControl(
            max_calls=2, planned_calls=1, checkpoint=None, deadline_seconds=None
        )
        partial: dict[str, object] = {
            'results': [
                {
                    'query': 'q',
                    'should_trigger': True,
                    'trigger_rate': None,
                    'triggers': 0,
                    'runs': 1,
                    'completed_runs': 0,
                    'execution_errors': 1,
                    'error_messages': ['429'],
                    'pass': False,
                }
            ],
            'summary': {'total': 1, 'passed': 0, 'failed': 1},
            'execution': {'status': 'partial'},
        }
        with patch.object(run_loop, 'run_eval', return_value=partial) as evaluate:
            output = run_loop._evaluate_cases(
                eval_set=[{'query': 'q', 'should_trigger': True}],
                skill_name='demo',
                description='Use for demos.',
                num_workers=2,
                timeout=1,
                project_root=Path('.'),
                runs_per_query=1,
                trigger_threshold=0.5,
                model='claude-sonnet-4-6',
                control=control,
            )
        evaluate.assert_called_once()
        self.assertIs(evaluate.call_args.kwargs['control'], control)
        self._assert_partial_execution(output[2]['execution'])

    def _eval_output(self, passed: bool) -> dict[str, object]:
        return {
            'results': [
                {
                    'query': 'q',
                    'should_trigger': True,
                    'triggers': 1 if passed else 0,
                    'runs': 1,
                    'pass': passed,
                }
            ],
            'summary': {'total': 1, 'passed': int(passed), 'failed': int(not passed)},
        }

    def _assert_partial_execution(self, value: object) -> None:
        """Require an observed partial execution, not an unknown/missing value."""
        match value:
            case {'status': 'partial'}:
                return
            case _:
                self.fail(f'expected partial execution evidence, got {value!r}')

    @staticmethod
    def _options(
        control: EvaluationControl,
        *,
        max_iterations: int,
        patience: int = 1,
    ) -> run_loop.RunLoopOptions:
        return run_loop.RunLoopOptions(
            description_override=None,
            num_workers=2,
            timeout=1,
            max_iterations=max_iterations,
            runs_per_query=1,
            trigger_threshold=0.5,
            holdout=0,
            model='claude-sonnet-4-6',
            verbose=False,
            control=control,
            patience=patience,
        )

    def test_same_control_reaches_trigger_and_rewrite(self) -> None:
        control = EvaluationControl(
            max_calls=4, planned_calls=4, checkpoint=None, deadline_seconds=None
        )
        with (
            patch.object(run_loop, 'find_project_root', return_value=Path('.')),
            patch.object(
                run_loop,
                'parse_skill_md',
                return_value=('demo', 'old', 'body'),
            ),
            patch.object(
                run_loop,
                'run_eval',
                side_effect=[self._eval_output(False), self._eval_output(True)],
            ) as evaluate,
            patch.object(
                run_loop,
                'improve_description',
                return_value='new',
            ) as improve,
        ):
            output = run_loop.run_loop(
                eval_set=[{'query': 'q', 'should_trigger': True}],
                skill_path=Path('demo'),
                options=self._options(control, max_iterations=2),
            )

        self.assertEqual(output['exit_reason'], 'all_passed (iteration 2)')
        self.assertIs(evaluate.call_args_list[0].kwargs['control'], control)
        self.assertIs(evaluate.call_args_list[1].kwargs['control'], control)
        self.assertIs(improve.call_args.kwargs['control'], control)

    def test_duplicate_description_stops_before_another_trigger_batch(self) -> None:
        control = EvaluationControl(
            max_calls=4, planned_calls=4, checkpoint=None, deadline_seconds=None
        )
        with (
            patch.object(run_loop, 'find_project_root', return_value=Path('.')),
            patch.object(
                run_loop,
                'parse_skill_md',
                return_value=('demo', 'old', 'body'),
            ),
            patch.object(run_loop, 'run_eval', return_value=self._eval_output(False)) as evaluate,
            patch.object(
                run_loop,
                'improve_description',
                return_value='old',
            ),
        ):
            output = run_loop.run_loop(
                eval_set=[{'query': 'q', 'should_trigger': True}],
                skill_path=Path('demo'),
                options=self._options(control, max_iterations=3),
            )

        self.assertEqual(output['exit_reason'], 'duplicate_description')
        evaluate.assert_called_once()

    def test_patience_stops_after_non_improving_evaluation(self) -> None:
        control = EvaluationControl(
            max_calls=6, planned_calls=6, checkpoint=None, deadline_seconds=None
        )
        with (
            patch.object(run_loop, 'find_project_root', return_value=Path('.')),
            patch.object(
                run_loop,
                'parse_skill_md',
                return_value=('demo', 'old', 'body'),
            ),
            patch.object(run_loop, 'run_eval', return_value=self._eval_output(False)) as evaluate,
            patch.object(
                run_loop,
                'improve_description',
                return_value='new',
            ),
        ):
            output = run_loop.run_loop(
                eval_set=[{'query': 'q', 'should_trigger': True}],
                skill_path=Path('demo'),
                options=self._options(control, max_iterations=3, patience=1),
            )

        self.assertEqual(output['exit_reason'], 'no_improvement (patience 1)')
        self.assertEqual(evaluate.call_count, 2)


if __name__ == '__main__':
    unittest.main()
