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


if __name__ == "__main__":
    unittest.main()
