from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import improve_description
from eval_control import CheckpointStore, EvaluationControl


class ImproveDescriptionControlTests(unittest.TestCase):
    def _response(self, text: str) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(["claude"], 0, text, "")

    def test_rewrite_and_shortening_use_distinct_permits(self) -> None:
        over_limit = "x" * 1025
        responses = [
            self._response(f"<new_description>{over_limit}</new_description>"),
            self._response("<new_description>short description</new_description>"),
        ]
        with tempfile.TemporaryDirectory() as directory, patch.object(
            improve_description.subprocess,
            "run",
            side_effect=responses,
        ) as run:
            control = EvaluationControl(
                max_calls=2,
                planned_calls=2,
                checkpoint=CheckpointStore(Path(directory) / "checkpoint.jsonl"),
                deadline_seconds=None,
            )
            result = improve_description.improve_description(
                skill_name="demo",
                skill_content="body",
                current_description="old",
                eval_results={
                    "description": "old",
                    "summary": {"passed": 0, "failed": 1, "total": 1},
                    "results": [],
                },
                history=[],
                model="claude-sonnet-4-6",
                iteration=1,
                control=control,
            )

        self.assertEqual(result, "short description")
        self.assertEqual(run.call_count, 2)
        self.assertEqual(control.attempted_calls, 2)
        self.assertEqual(control.successful_calls, 2)

    def test_cap_one_blocks_shortening_before_launch(self) -> None:
        over_limit = "x" * 1025
        with tempfile.TemporaryDirectory() as directory, patch.object(
            improve_description.subprocess,
            "run",
            return_value=self._response(f"<new_description>{over_limit}</new_description>"),
        ) as run:
            control = EvaluationControl(
                max_calls=1,
                planned_calls=2,
                checkpoint=CheckpointStore(Path(directory) / "checkpoint.jsonl"),
                deadline_seconds=None,
            )
            with self.assertRaisesRegex(RuntimeError, "budget_exhausted"):
                improve_description.improve_description(
                    skill_name="demo",
                    skill_content="body",
                    current_description="old",
                    eval_results={
                        "description": "old",
                        "summary": {"passed": 0, "failed": 1, "total": 1},
                        "results": [],
                    },
                    history=[],
                    model="claude-sonnet-4-6",
                    iteration=1,
                    control=control,
                )

        self.assertEqual(run.call_count, 1)
        self.assertEqual(control.attempted_calls, 1)
        self.assertEqual(control.successful_calls, 1)

    def test_cached_rewrite_skips_claude_and_counts_as_resumed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            checkpoint = CheckpointStore(Path(directory) / "checkpoint.jsonl")
            first = EvaluationControl(
                max_calls=1,
                planned_calls=1,
                checkpoint=checkpoint,
                deadline_seconds=None,
            )
            with patch.object(
                improve_description.subprocess,
                "run",
                return_value=self._response("<new_description>cached result</new_description>"),
            ) as first_run:
                first_result = improve_description.improve_description(
                    skill_name="demo",
                    skill_content="body",
                    current_description="old",
                    eval_results={
                        "description": "old",
                        "summary": {"passed": 0, "failed": 1, "total": 1},
                        "results": [],
                    },
                    history=[],
                    model="claude-sonnet-4-6",
                    iteration=1,
                    control=first,
                )
            second = EvaluationControl(
                max_calls=1,
                planned_calls=1,
                checkpoint=checkpoint,
                deadline_seconds=None,
            )
            with patch.object(improve_description.subprocess, "run") as second_run:
                second_result = improve_description.improve_description(
                    skill_name="demo",
                    skill_content="body",
                    current_description="old",
                    eval_results={
                        "description": "old",
                        "summary": {"passed": 0, "failed": 1, "total": 1},
                        "results": [],
                    },
                    history=[],
                    model="claude-sonnet-4-6",
                    iteration=1,
                    control=second,
                )

        self.assertEqual(first_result, "cached result")
        self.assertEqual(second_result, "cached result")
        self.assertEqual(first_run.call_count, 1)
        self.assertEqual(second_run.call_count, 0)
        self.assertEqual(second.resumed_calls, 1)


if __name__ == "__main__":
    unittest.main()
