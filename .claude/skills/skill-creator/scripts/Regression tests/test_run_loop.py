from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import run_loop
from eval_control import EvaluationControl


class RunLoopControlTests(unittest.TestCase):
    def test_evaluate_cases_passes_shared_control_and_partial_is_unavailable(self) -> None:
        control = EvaluationControl(max_calls=2, planned_calls=1, checkpoint=None, deadline_seconds=None)
        partial = {
            "results": [{
                "query": "q",
                "should_trigger": True,
                "trigger_rate": None,
                "triggers": 0,
                "runs": 1,
                "completed_runs": 0,
                "execution_errors": 1,
                "error_messages": ["429"],
                "pass": False,
            }],
            "summary": {"total": 1, "passed": 0, "failed": 1},
            "execution": {"status": "partial"},
        }
        with patch.object(run_loop, "run_eval", return_value=partial) as evaluate:
            output = run_loop._evaluate_cases(
                eval_set=[{"query": "q", "should_trigger": True}],
                skill_name="demo",
                description="Use for demos.",
                num_workers=2,
                timeout=1,
                project_root=Path("."),
                runs_per_query=1,
                trigger_threshold=0.5,
                model="claude-sonnet-4-6",
                control=control,
            )
        evaluate.assert_called_once()
        self.assertIs(evaluate.call_args.kwargs["control"], control)
        self.assertEqual(output[2]["execution"]["status"], "partial")

    def _eval_output(self, passed: bool) -> dict[str, object]:
        return {
            "results": [{
                "query": "q",
                "should_trigger": True,
                "triggers": 1 if passed else 0,
                "runs": 1,
                "pass": passed,
            }],
            "summary": {"total": 1, "passed": int(passed), "failed": int(not passed)},
        }

    def test_same_control_reaches_trigger_and_rewrite(self) -> None:
        control = EvaluationControl(max_calls=4, planned_calls=4, checkpoint=None, deadline_seconds=None)
        with patch.object(run_loop, "find_project_root", return_value=Path(".")), patch.object(
            run_loop,
            "parse_skill_md",
            return_value=("demo", "old", "body"),
        ), patch.object(run_loop, "run_eval", side_effect=[self._eval_output(False), self._eval_output(True)]) as evaluate, patch.object(
            run_loop,
            "improve_description",
            return_value="new",
        ) as improve:
            output = run_loop.run_loop(
                eval_set=[{"query": "q", "should_trigger": True}],
                skill_path=Path("demo"),
                description_override=None,
                num_workers=2,
                timeout=1,
                max_iterations=2,
                runs_per_query=1,
                trigger_threshold=0.5,
                holdout=0,
                model="claude-sonnet-4-6",
                verbose=False,
                control=control,
            )

        self.assertEqual(output["exit_reason"], "all_passed (iteration 2)")
        self.assertIs(evaluate.call_args_list[0].kwargs["control"], control)
        self.assertIs(evaluate.call_args_list[1].kwargs["control"], control)
        self.assertIs(improve.call_args.kwargs["control"], control)

    def test_duplicate_description_stops_before_another_trigger_batch(self) -> None:
        control = EvaluationControl(max_calls=4, planned_calls=4, checkpoint=None, deadline_seconds=None)
        with patch.object(run_loop, "find_project_root", return_value=Path(".")), patch.object(
            run_loop,
            "parse_skill_md",
            return_value=("demo", "old", "body"),
        ), patch.object(run_loop, "run_eval", return_value=self._eval_output(False)) as evaluate, patch.object(
            run_loop,
            "improve_description",
            return_value="old",
        ):
            output = run_loop.run_loop(
                eval_set=[{"query": "q", "should_trigger": True}],
                skill_path=Path("demo"),
                description_override=None,
                num_workers=2,
                timeout=1,
                max_iterations=3,
                runs_per_query=1,
                trigger_threshold=0.5,
                holdout=0,
                model="claude-sonnet-4-6",
                verbose=False,
                control=control,
            )

        self.assertEqual(output["exit_reason"], "duplicate_description")
        evaluate.assert_called_once()

    def test_patience_stops_after_non_improving_evaluation(self) -> None:
        control = EvaluationControl(max_calls=6, planned_calls=6, checkpoint=None, deadline_seconds=None)
        with patch.object(run_loop, "find_project_root", return_value=Path(".")), patch.object(
            run_loop,
            "parse_skill_md",
            return_value=("demo", "old", "body"),
        ), patch.object(run_loop, "run_eval", return_value=self._eval_output(False)) as evaluate, patch.object(
            run_loop,
            "improve_description",
            return_value="new",
        ):
            output = run_loop.run_loop(
                eval_set=[{"query": "q", "should_trigger": True}],
                skill_path=Path("demo"),
                description_override=None,
                num_workers=2,
                timeout=1,
                max_iterations=3,
                runs_per_query=1,
                trigger_threshold=0.5,
                holdout=0,
                model="claude-sonnet-4-6",
                verbose=False,
                control=control,
                patience=1,
            )

        self.assertEqual(output["exit_reason"], "no_improvement (patience 1)")
        self.assertEqual(evaluate.call_count, 2)


if __name__ == "__main__":
    unittest.main()
