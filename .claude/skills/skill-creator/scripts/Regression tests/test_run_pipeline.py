from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import run_pipeline


class PipelineTests(unittest.TestCase):
    def test_execution_plans_have_smoke_and_release_budgets(self) -> None:
        smoke = run_pipeline.build_execution_plan("smoke")
        release = run_pipeline.build_execution_plan("release")
        self.assertEqual(smoke["base_calls"], 4)
        self.assertEqual(release["base_calls"], 34)
        self.assertEqual(release["maximum_calls"], 40)
        self.assertEqual([stage["planned_calls"] for stage in release["stages"]], [20, 8, 4, 2])

    def test_dry_run_needs_no_workspace_or_model(self) -> None:
        self.assertEqual(run_pipeline.main(["smoke", "--dry-run"]), 0)

    def test_check_stops_after_first_failed_gate(self) -> None:
        failed = run_pipeline.subprocess.CompletedProcess([], 1, "out", "err")
        with patch.object(run_pipeline.subprocess, "run", return_value=failed) as run:
            result = run_pipeline.run_check(Path("."))
        self.assertFalse(result["passed"])
        run.assert_called_once()

    def test_summary_validator_finds_counter_and_partial_readiness_errors(self) -> None:
        summary = run_pipeline.build_pipeline_summary(
            "release",
            execution_status="partial",
            verdict="pass",
        )
        summary["execution"]["planned_calls"] = 34
        summary["execution"]["attempted_calls"] = 1
        summary["release_ready"] = True
        findings = run_pipeline.validate_pipeline_summary(summary)
        codes = {finding.code for finding in findings}
        self.assertIn("COUNTER_INVARIANT", codes)
        self.assertIn("PARTIAL_RELEASE", codes)

    def test_documentation_names_modes_and_independent_readiness_gates(self) -> None:
        skill = (SCRIPTS_DIR.parent / "SKILL.md").read_text(encoding="utf-8")
        workflow = (SCRIPTS_DIR.parent / "references" / "evaluation-workflow.md").read_text(encoding="utf-8")
        schemas = (SCRIPTS_DIR.parent / "references" / "schemas.md").read_text(encoding="utf-8")
        for phrase in ("check", "smoke", "release", "zero Claude calls", "release_ready", "NHR"):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, skill)
        self.assertIn("34 base", workflow)
        self.assertIn("planned_calls", schemas)
        self.assertIn("checkpoint completion is not evidence", skill.lower())


if __name__ == "__main__":
    unittest.main()
