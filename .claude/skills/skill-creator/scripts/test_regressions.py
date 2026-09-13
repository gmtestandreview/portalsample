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


def _find_subprocess_call(filename: str, func_name: str) -> ast.Call:
    tree = ast.parse((SCRIPTS_DIR / filename).read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == func_name
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "subprocess"
        ):
            return node
    raise AssertionError(f"no subprocess.{func_name} call found in {filename}")


class WindowsClaudeCliInvocationTests(unittest.TestCase):
    """npm installs `claude` as claude.cmd/.ps1 on Windows. CreateProcess
    cannot launch those directly, so subprocess.Popen(["claude", ...]) fails
    with WinError 2 even though shutil.which("claude") finds it. Both call
    sites must pass shell= so cmd.exe resolves the shim."""

    def test_run_eval_popen_passes_shell_kwarg(self) -> None:
        call = _find_subprocess_call("run_eval.py", "Popen")
        self.assertIn("shell", {kw.arg for kw in call.keywords})

    def test_improve_description_run_passes_shell_kwarg(self) -> None:
        call = _find_subprocess_call("improve_description.py", "run")
        self.assertIn("shell", {kw.arg for kw in call.keywords})


if __name__ == "__main__":
    unittest.main()
