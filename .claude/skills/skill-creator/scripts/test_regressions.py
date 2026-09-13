"""Regression tests for skill-creator helper scripts."""

from __future__ import annotations

import ast
import unittest
from pathlib import Path

from scripts import run_eval

SCRIPTS_DIR = Path(__file__).resolve().parent


class CompatibilityTests(unittest.TestCase):
    def test_aggregate_benchmark_uses_python_310_compatible_utc(self) -> None:
        tree = ast.parse((SCRIPTS_DIR / "aggregate_benchmark.py").read_text(encoding="utf-8"))

        datetime_imports = [
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom) and node.module == "datetime"
            for alias in node.names
        ]

        self.assertNotIn("UTC", datetime_imports)
        self.assertIn("timezone", datetime_imports)


class RunEvalValidationTests(unittest.TestCase):
    def test_invalid_should_trigger_is_reported_as_value_error(self) -> None:
        eval_set = [{"query": "Create a useful skill", "should_trigger": "yes"}]

        with self.assertRaises(ValueError):
            run_eval._validate_eval_set(eval_set, runs_per_query=1, trigger_threshold=0.5)


if __name__ == "__main__":
    unittest.main()
