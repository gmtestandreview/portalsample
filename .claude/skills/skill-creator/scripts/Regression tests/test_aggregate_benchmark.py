"""Focused regression tests for aggregate_benchmark.py."""

from __future__ import annotations

import ast
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from aggregate_benchmark import RunResult

MODULE_PATH = Path(__file__).resolve().parents[1] / "aggregate_benchmark.py"
SPEC = importlib.util.spec_from_file_location("aggregate_benchmark", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
aggregate_benchmark = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = aggregate_benchmark
SPEC.loader.exec_module(aggregate_benchmark)


def _write_metadata(eval_dir: Path, eval_id: int) -> None:
    (eval_dir / "eval_metadata.json").write_text(
        json.dumps(
            {
                "eval_id": eval_id,
                "eval_name": f"eval-{eval_id}",
                "prompt": "test prompt",
                "expectations": ["expected outcome"],
            }
        ),
        encoding="utf-8",
    )


def _write_grading(
    run_dir: Path,
    *,
    passed: int = 1,
    failed: int = 0,
    duration: float | None = None,
    tokens: int | None = None,
) -> None:
    run_dir.mkdir(parents=True, exist_ok=True)
    total = passed + failed
    data: dict[str, object] = {
        "expectations": [
            {
                "text": f"expectation {index + 1}",
                "passed": index < passed,
                "evidence": "observed evidence",
            }
            for index in range(total)
        ],
        "summary": {
            "passed": passed,
            "failed": failed,
            "total": total,
            "pass_rate": passed / total,
        },
    }
    if duration is not None:
        data["timing"] = {"total_duration_seconds": duration}
    (run_dir / "grading.json").write_text(json.dumps(data), encoding="utf-8")

    if tokens is not None:
        (run_dir / "timing.json").write_text(
            json.dumps(
                {
                    "total_duration_seconds": 12.5,
                    "total_tokens": tokens,
                }
            ),
            encoding="utf-8",
        )


class AggregateBenchmarkOptimizedTests(unittest.TestCase):
    def test_python_310_compatible_timezone_import(self) -> None:
        tree = ast.parse(MODULE_PATH.read_text(encoding="utf-8"))
        imports = [
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom) and node.module == "datetime"
            for alias in node.names
        ]
        self.assertIn("timezone", imports)
        self.assertNotIn("UTC", imports)

    def test_empty_workspace_is_not_reported_as_zero_benchmark(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertEqual(aggregate_benchmark.main([str(root)]), 2)
            self.assertFalse((root / "benchmark.json").exists())

    def test_missing_metrics_remain_absent_and_no_fake_config_b(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            _write_grading(eval_dir / "with_skill" / "run-1")

            benchmark = aggregate_benchmark.generate_benchmark(root)
            result = benchmark["runs"][0]["result"]

            self.assertNotIn("time_seconds", result)
            self.assertNotIn("tokens", result)
            self.assertNotIn("tool_calls", result)
            self.assertNotIn("errors", result)
            self.assertNotIn("delta", benchmark["run_summary"])
            self.assertNotIn("Config B", aggregate_benchmark.generate_markdown(benchmark))

    def test_explicit_zero_duration_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            _write_grading(
                eval_dir / "with_skill" / "run-1",
                duration=0.0,
                tokens=100,
            )

            benchmark = aggregate_benchmark.generate_benchmark(root)
            result = benchmark["runs"][0]["result"]

            self.assertEqual(result["time_seconds"], 0.0)
            self.assertEqual(result["tokens"], 100)

    def test_natural_run_order_is_1_2_10(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            for run_number in (10, 1, 2):
                _write_grading(eval_dir / "with_skill" / f"run-{run_number}")

            benchmark = aggregate_benchmark.generate_benchmark(root)
            self.assertEqual(
                [run["run_number"] for run in benchmark["runs"]],
                [1, 2, 10],
            )

    def test_incomplete_matrix_is_explicit(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for eval_id in (1, 2):
                eval_dir = root / f"eval-{eval_id}"
                eval_dir.mkdir()
                _write_metadata(eval_dir, eval_id)

            _write_grading(root / "eval-1" / "with_skill" / "run-1")
            _write_grading(root / "eval-1" / "without_skill" / "run-1")
            _write_grading(root / "eval-2" / "with_skill" / "run-1")
            (root / "eval-2" / "without_skill" / "run-1").mkdir(parents=True)

            benchmark = aggregate_benchmark.generate_benchmark(root)

            self.assertIsNone(benchmark["metadata"]["runs_per_configuration"])
            self.assertTrue(any("without_skill / eval 2" in note for note in benchmark["notes"]))

    def test_missing_entire_baseline_has_no_fabricated_delta(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            _write_grading(eval_dir / "with_skill" / "run-1")
            (eval_dir / "without_skill" / "run-1").mkdir(parents=True)

            benchmark = aggregate_benchmark.generate_benchmark(root)

            self.assertEqual(
                benchmark["metadata"]["comparison_pair"],
                {"candidate": "with_skill", "baseline": "without_skill"},
            )
            self.assertNotIn("delta", benchmark["run_summary"])
            self.assertEqual(list(benchmark["run_summary"]), ["with_skill"])

    def test_mixed_comparison_pairs_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            _write_grading(eval_dir / "with_skill" / "run-1")
            _write_grading(eval_dir / "old_skill" / "run-1")

            with self.assertRaises(ValueError):
                aggregate_benchmark.generate_benchmark(root)

    def test_non_finite_pass_rate_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            run_dir = eval_dir / "with_skill" / "run-1"
            run_dir.mkdir(parents=True)
            (run_dir / "grading.json").write_text(
                (
                    '{"expectations":[{"text":"e","passed":true,"evidence":"ok"}],'
                    '"summary":{"passed":1,"failed":0,"total":1,"pass_rate":NaN}}'
                ),
                encoding="utf-8",
            )

            with self.assertRaises(ValueError):
                aggregate_benchmark.generate_benchmark(root)

    def test_duplicate_eval_ids_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for dirname in ("eval-1", "eval-2"):
                eval_dir = root / dirname
                eval_dir.mkdir()
                _write_metadata(eval_dir, 1)
                _write_grading(eval_dir / "with_skill" / "run-1")

            with self.assertRaises(ValueError):
                aggregate_benchmark.generate_benchmark(root)

    def test_unsupported_single_configuration_is_rejected(self) -> None:
        run: RunResult = {
            "eval_id": 1,
            "eval_name": "eval-1",
            "run_number": 1,
            "pass_rate": 1.0,
            "passed": 1,
            "failed": 0,
            "total": 1,
            "expectations": [],
            "notes": [],
        }
        with self.assertRaisesRegex(ValueError, "unsupported configuration"):
            aggregate_benchmark.aggregate_results({"bogus": [run]})


class AggregateBenchmarkHostileInputTests(unittest.TestCase):
    def _single_run_root(self, root: Path) -> Path:
        eval_dir = root / "eval-1"
        eval_dir.mkdir()
        _write_metadata(eval_dir, 1)
        _write_grading(eval_dir / "with_skill" / "run-1")
        return eval_dir / "with_skill" / "run-1"

    def test_huge_token_count_does_not_crash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run_dir = self._single_run_root(root)
            (run_dir / "timing.json").write_text(
                '{"total_tokens": 1' + "0" * 400 + "}", encoding="utf-8"
            )

            self.assertEqual(aggregate_benchmark.main([str(root)]), 0)
            benchmark = aggregate_benchmark.generate_benchmark(root)
            self.assertNotIn("tokens", benchmark["runs"][0]["result"])

    def test_huge_grading_number_skips_run_instead_of_crashing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run_dir = self._single_run_root(root)
            grading = json.loads((run_dir / "grading.json").read_text(encoding="utf-8"))
            grading["summary"]["pass_rate"] = 10**400
            (run_dir / "grading.json").write_text(json.dumps(grading), encoding="utf-8")

            self.assertEqual(aggregate_benchmark.main([str(root)]), 2)
            self.assertFalse((root / "benchmark.json").exists())

    def test_statistics_overflow_is_reported_not_raised(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            eval_dir.mkdir()
            _write_metadata(eval_dir, 1)
            for run_number in (1, 2):
                _write_grading(
                    eval_dir / "with_skill" / f"run-{run_number}",
                    duration=1e308,
                )

            self.assertEqual(aggregate_benchmark.main([str(root)]), 2)
            self.assertFalse((root / "benchmark.json").exists())

    def test_markdown_output_path_cannot_overwrite_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._single_run_root(root)
            target = root / "report.md"

            self.assertEqual(aggregate_benchmark.main([str(root), "-o", str(target)]), 2)
            self.assertFalse(target.exists())

    def test_output_path_without_filename_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._single_run_root(root)

            self.assertEqual(aggregate_benchmark.main([str(root), "-o", "."]), 2)

    def test_non_ascii_digit_run_names_are_skipped(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run_dir = self._single_run_root(root)
            _write_grading(run_dir.parent / "run-１")

            benchmark = aggregate_benchmark.generate_benchmark(root)

            self.assertEqual([run["run_number"] for run in benchmark["runs"]], [1])

    def test_oversized_index_suffix_is_malformed_not_fatal(self) -> None:
        self.assertIsNone(aggregate_benchmark.parse_prefixed_index("run-" + "9" * 5000, "run"))
        self.assertEqual(aggregate_benchmark.parse_prefixed_index("run-10", "run"), 10)

    def test_negative_eval_ids_sort_numerically(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for index, eval_id in enumerate((3, -1, 10, -5), start=1):
                eval_dir = root / f"eval-{index}"
                eval_dir.mkdir()
                _write_metadata(eval_dir, eval_id)
                _write_grading(eval_dir / "with_skill" / "run-1")

            benchmark = aggregate_benchmark.generate_benchmark(root)

            self.assertEqual(benchmark["metadata"]["evals_run"], [-5, -1, 3, 10])
            self.assertEqual(
                [run["eval_id"] for run in benchmark["runs"]],
                [-5, -1, 3, 10],
            )


if __name__ == "__main__":
    unittest.main()
