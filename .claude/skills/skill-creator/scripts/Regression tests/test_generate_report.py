"""Regression coverage for optimization-history reporting contracts."""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import unittest
from collections.abc import Mapping
from pathlib import Path
from types import ModuleType
from typing import Protocol, TypedDict, cast
from unittest.mock import patch

SKILL_ROOT = Path(__file__).resolve().parents[2]


class EvalCase(TypedDict):
    query: str
    should_trigger: bool


class ReportModule(Protocol):
    def generate_html(
        self, data: Mapping[str, object], auto_refresh: bool = False, skill_name: str = ""
    ) -> str: ...

    def main(self) -> int: ...


class OptimizationModule(Protocol):
    def run_loop(
        self,
        eval_set: list[EvalCase],
        skill_path: Path,
        description_override: str | None,
        num_workers: int,
        timeout: int,
        max_iterations: int,
        runs_per_query: int,
        trigger_threshold: float,
        holdout: float,
        model: str | None,
        verbose: bool,
        live_report_path: Path | None = None,
        log_dir: Path | None = None,
    ) -> dict[str, object]: ...


def _load_module(name: str) -> ModuleType:
    """Load the local script regardless of the test runner's package context."""
    spec = importlib.util.spec_from_file_location(
        f"{name}_report_regression", SKILL_ROOT / "scripts" / f"{name}.py"
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load local script {name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


# These structural interfaces describe the public APIs exercised below. Explicit
# file loading avoids shadowing by the repository's unrelated scripts package.
sys.path.insert(0, str(SKILL_ROOT / "scripts"))
generate_report = cast(ReportModule, _load_module("generate_report"))
run_loop = cast(OptimizationModule, _load_module("run_loop"))


def _result(query: str, *, passed: bool, should_trigger: bool = True) -> dict[str, object]:
    return {
        "query": query,
        "should_trigger": should_trigger,
        "pass": passed,
        "triggers": int(passed == should_trigger),
        "runs": 1,
    }


def _optimize(root: Path, *, live_report_path: Path | None = None) -> dict[str, object]:
    """Exercise public orchestration with model responses replaced by evidence."""
    (root / "SKILL.md").write_text(
        "---\nname: example\ndescription: first candidate\n---\nExample skill.\n",
        encoding="utf-8",
    )
    verdicts = iter((False, True, False))

    def evaluate(*, eval_set: list[EvalCase], **_options: object) -> dict[str, object]:
        passed = next(verdicts)
        total = len(eval_set)
        return {
            "results": [
                _result(case["query"], passed=passed, should_trigger=case["should_trigger"])
                for case in eval_set
            ],
            "summary": {
                "passed": total if passed else 0,
                "failed": 0 if passed else total,
                "total": total,
            },
        }

    with (
        patch.object(run_loop, "run_eval", side_effect=evaluate),
        patch.object(run_loop, "improve_description", return_value="training winner"),
        patch.object(run_loop, "find_project_root", return_value=root),
    ):
        return run_loop.run_loop(
            eval_set=[
                {"query": "first query", "should_trigger": True},
                {"query": "second query", "should_trigger": True},
                {"query": "first negative query", "should_trigger": False},
                {"query": "second negative query", "should_trigger": False},
            ],
            skill_path=root,
            description_override=None,
            num_workers=1,
            timeout=1,
            max_iterations=2,
            runs_per_query=1,
            trigger_threshold=0.5,
            holdout=0.5,
            model=None,
            verbose=False,
            live_report_path=live_report_path,
        )


class GenerateReportTests(unittest.TestCase):
    def test_live_report_accepts_pending_holdout_from_producer(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report_path = Path(tmp) / "live.html"
            _optimize(Path(tmp), live_report_path=report_path)
            rendered = report_path.read_text(encoding="utf-8")
            self.assertIn('http-equiv="refresh"', rendered)
            self.assertIn("training winner", rendered)
            self.assertIn("Not evaluated", rendered)
            self.assertNotIn("0/0", rendered)

    def test_best_row_uses_training_even_when_selected_holdout_fails(self) -> None:
        data: dict[str, object] = {
            "history": [
                {
                    "iteration": 1,
                    "description": "first candidate",
                    "train_results": [_result("train", passed=False)],
                    "test_results": [],
                },
                {
                    "iteration": 2,
                    "description": "training winner",
                    "train_results": [_result("train", passed=True)],
                    "test_results": [_result("holdout", passed=False)],
                },
            ],
        }
        rendered = generate_report.generate_html(data)
        best_rows = re.findall(r'<tr class="best-row">(.*?)</tr>', rendered, re.DOTALL)
        self.assertEqual(len(best_rows), 1)
        self.assertIn("training winner", best_rows[0])

    def test_final_output_renders_frozen_holdout_without_testing_other_rows(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = _optimize(Path(tmp))
        rendered = generate_report.generate_html(output)
        self.assertIn("0/2 (test)", rendered)
        self.assertIn("Not evaluated", rendered)
        self.assertNotIn("0/0", rendered)
        history = cast(list[dict[str, object]], output["history"])
        self.assertIsNone(history[0]["test_results"])
        best_rows = re.findall(r'<tr class="best-row">(.*?)</tr>', rendered, re.DOTALL)
        self.assertEqual(len(best_rows), 1)
        self.assertIn("training winner", best_rows[0])

    def test_missing_query_is_neutral_and_observed_failure_remains_failure(self) -> None:
        data: dict[str, object] = {
            "history": [
                {"description": "unobserved", "train_results": []},
                {
                    "description": "observed",
                    "train_results": [_result("later query", passed=False)],
                },
            ],
        }
        rendered = generate_report.generate_html(data)
        self.assertIn("Not evaluated", rendered)
        self.assertNotIn("0/0", rendered)
        self.assertEqual(rendered.count("✗"), 1)

    def test_training_ties_do_not_use_holdout_as_tiebreaker(self) -> None:
        history: list[dict[str, object]] = [
            {
                "iteration": 1,
                "description": "first training tie",
                "train_results": [_result("train", passed=True)],
                "test_results": [_result("holdout", passed=False)],
            },
            {
                "iteration": 1,
                "description": "second training tie",
                "train_results": [_result("train", passed=True)],
                "test_results": [_result("holdout", passed=True)],
            },
        ]
        rendered = generate_report.generate_html({"history": history})
        best_rows = re.findall(r'<tr class="best-row">(.*?)</tr>', rendered, re.DOTALL)
        self.assertEqual(len(best_rows), 1)
        self.assertIn("first training tie", best_rows[0])

    def test_legacy_results_and_negative_query_counts_remain_supported(self) -> None:
        rendered = generate_report.generate_html(
            {
                "history": [
                    {"results": [_result("negative", passed=True, should_trigger=False)]},
                ],
            }
        )
        self.assertIn("✓", rendered)
        self.assertIn("1/1", rendered)
        self.assertIn("0/1", rendered)

    def test_external_display_values_are_escaped(self) -> None:
        payload = '<script>alert("x")</script>'
        data: dict[str, object] = {
            "original_description": payload,
            "best_description": payload,
            "best_score": payload,
            "history": [
                {
                    "iteration": payload,
                    "description": payload,
                    "train_results": [_result(payload, passed=True)],
                },
            ],
        }
        rendered = generate_report.generate_html(data, skill_name=payload)
        self.assertNotIn("<script>", rendered)
        self.assertIn("&lt;script&gt;", rendered)

    def test_invalid_result_fields_are_rejected(self) -> None:
        invalid_fields: tuple[dict[str, object], ...] = (
            {"should_trigger": "yes"},
            {"pass": 1},
            {"runs": True},
            {"runs": -1},
            {"triggers": 2},
            {"query": None},
        )
        for changes in invalid_fields:
            with self.subTest(changes=changes):
                result = _result("query", passed=True)
                result.update(changes)
                with self.assertRaises(ValueError):
                    generate_report.generate_html({"history": [{"train_results": [result]}]})

    def test_only_null_holdout_is_normalized(self) -> None:
        invalid_values: tuple[tuple[str, object], ...] = (
            ("test_results", {}),
            ("test_results", "invalid"),
            ("test_results", False),
            ("train_results", None),
        )
        for field, value in invalid_values:
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                generate_report.generate_html({"history": [{field: value}]})

    def test_invalid_summary_values_are_rejected(self) -> None:
        invalid_values: tuple[tuple[str, object], ...] = (
            ("best_score", float("nan")),
            ("best_score", float("inf")),
            ("best_score", []),
            ("best_score", True),
            ("best_test_score", {}),
            ("iterations_run", -1),
            ("train_size", True),
            ("test_size", "three"),
        )
        for field, value in invalid_values:
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                generate_report.generate_html({field: value})

    def test_duplicate_and_changed_query_semantics_are_rejected(self) -> None:
        result = _result("same", passed=True)
        histories = (
            [{"train_results": [result, result]}],
            [
                {"train_results": [result]},
                {"train_results": [_result("same", passed=True, should_trigger=False)]},
            ],
        )
        for history in histories:
            with self.subTest(history=history), self.assertRaises(ValueError):
                generate_report.generate_html({"history": history})

    def test_cli_stdin_file_and_errors(self) -> None:
        script = SKILL_ROOT / "scripts/generate_report.py"
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "input.json"
            target = Path(tmp) / "report.html"
            source.write_text(json.dumps({"history": []}), encoding="utf-8")
            for input_path, stdin in ((str(source), None), ("-", '{"history": []}')):
                with self.subTest(input_path=input_path):
                    result = subprocess.run(
                        [sys.executable, str(script), input_path, "-o", str(target)],
                        input=stdin,
                        capture_output=True,
                        text=True,
                        encoding="utf-8",
                        timeout=10,
                        check=False,
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertIn("<!DOCTYPE html>", target.read_text(encoding="utf-8"))
            for payload in ("{", "[]", '{"history": "invalid"}'):
                with self.subTest(payload=payload):
                    result = subprocess.run(
                        [sys.executable, str(script), "-"],
                        input=payload,
                        capture_output=True,
                        text=True,
                        encoding="utf-8",
                        timeout=10,
                        check=False,
                    )
                    self.assertEqual(result.returncode, 2)
                    self.assertIn("error:", result.stderr)
                    self.assertNotIn("Traceback", result.stderr)

    def test_cli_reports_missing_input_without_traceback(self) -> None:
        with patch.object(sys, "argv", ["generate_report.py", "missing-input.json"]):
            self.assertEqual(generate_report.main(), 2)


if __name__ == "__main__":
    unittest.main()
