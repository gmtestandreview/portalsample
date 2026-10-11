from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import run_early_exit_eval
from eval_control import EvaluationControl


class EarlyExitControlTests(unittest.TestCase):
    def test_successful_cases_are_accounted_and_stop_at_budget(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "SKILL.md").write_text("skill", encoding="utf-8")
            control = EvaluationControl(
                max_calls=1,
                planned_calls=2,
                checkpoint=None,
                deadline_seconds=None,
            )
            cases = [
                {"id": "one", "query": "one", "should_engage": True},
                {"id": "two", "query": "two", "should_engage": False},
            ]
            with patch.object(run_early_exit_eval, "run_claude", return_value={"engaged": True}):
                result = run_early_exit_eval.run_cases(
                    cases,
                    skill_root=root,
                    output_dir=root / "evidence",
                    model="claude-sonnet-4-6",
                    control=control,
                )

        self.assertEqual(len(result["results"]), 1)
        self.assertEqual(result["execution"]["status"], "partial")
        self.assertEqual(control.skipped_calls, 1)


if __name__ == "__main__":
    unittest.main()
