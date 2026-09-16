from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from collections.abc import Callable
from concurrent.futures import Future
from pathlib import Path
from types import TracebackType
from typing import Literal
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
MODULE_PATH = SCRIPTS_DIR / "run_eval.py"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
SPEC = importlib.util.spec_from_file_location("run_eval_candidate", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
run_eval = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = run_eval
SPEC.loader.exec_module(run_eval)


class FakeExecutor:
    errors: list[BaseException | bool] = []

    def __init__(self, max_workers: int) -> None:
        self.max_workers = max_workers
        self.index = 0

    def __enter__(self) -> FakeExecutor:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> Literal[False]:
        return False

    def submit(
        self,
        _fn: Callable[..., bool],
        *_args: object,
    ) -> Future[bool]:
        future: Future[bool] = Future()
        value = self.errors[self.index]
        self.index += 1
        if isinstance(value, BaseException):
            future.set_exception(value)
        else:
            future.set_result(value)
        return future


class RunEvalOptimizedTests(unittest.TestCase):
    def test_compatibility_validator_alias(self) -> None:
        with self.assertRaises(ValueError):
            run_eval._validate_eval_set(
                [{"query": "x", "should_trigger": "yes"}],
                runs_per_query=1,
                trigger_threshold=0.5,
            )

    def test_empty_eval_set_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "at least one"):
            run_eval._parse_eval_set([], 1, 0.5)

    def test_unexpected_eval_fields_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "unexpected"):
            run_eval._parse_eval_set(
                [{"query": "x", "should_trigger": True, "extra": 1}],
                1,
                0.5,
            )

    def test_nonfinite_threshold_rejected(self) -> None:
        for value in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(value=value), self.assertRaises(ValueError):
                run_eval._parse_eval_set(
                    [{"query": "x", "should_trigger": True}],
                    1,
                    value,
                )

    def test_generated_skill_name_stays_valid_and_bounded(self) -> None:
        name = "a" * 64
        with patch.object(
            run_eval.uuid,
            "uuid4",
            return_value=type("U", (), {"hex": "1234567890abcdef"})(),
        ):
            generated = run_eval._generated_skill_name(name)
        self.assertLessEqual(len(generated), 64)
        self.assertTrue(run_eval._is_valid_skill_component(generated))

    def test_exact_skill_tool_match_avoids_substring_false_positive(self) -> None:
        clean = "example-skill-12345678"
        self.assertFalse(
            run_eval._tool_use_triggers(
                {
                    "type": "tool_use",
                    "name": "Skill",
                    "input": {"skill": clean + "-other"},
                },
                clean,
            )
        )
        self.assertTrue(
            run_eval._tool_use_triggers(
                {
                    "type": "tool_use",
                    "name": "Skill",
                    "input": {"skill": clean},
                },
                clean,
            )
        )

    def test_read_path_requires_exact_skill_directory_segment(self) -> None:
        clean = "example-skill-12345678"
        self.assertTrue(
            run_eval._read_path_triggers(
                f"C:\\tmp\\.claude\\skills\\{clean}\\SKILL.md",
                clean,
            )
        )
        self.assertFalse(
            run_eval._read_path_triggers(
                f"/tmp/.claude/skills/{clean}-other/SKILL.md",
                clean,
            )
        )

    def test_malformed_stream_json_is_execution_error(self) -> None:
        state = run_eval._StreamState()
        run_eval._process_stream_event(
            {
                "content_block": {
                    "type": "tool_use",
                    "name": "Skill",
                    "input": {},
                }
            },
            "content_block_start",
            state,
            "example-skill-12345678",
        )
        run_eval._process_stream_event(
            {
                "delta": {
                    "type": "input_json_delta",
                    "partial_json": '{"skill":',
                }
            },
            "content_block_delta",
            state,
            "example-skill-12345678",
        )
        with self.assertRaisesRegex(RuntimeError, "malformed JSON"):
            run_eval._process_stream_event(
                {},
                "content_block_stop",
                state,
                "example-skill-12345678",
            )

    def test_non_json_stdout_is_not_silent_no_trigger(self) -> None:
        state = run_eval._StreamState()
        with self.assertRaisesRegex(RuntimeError, "malformed stream-json"):
            run_eval._raw_line_decision(
                b"not-json\n",
                state,
                "example-skill-12345678",
            )

    def test_all_execution_failures_have_unavailable_trigger_rate(self) -> None:
        FakeExecutor.errors = [RuntimeError("run-1 failed"), RuntimeError("run-2 failed")]
        with (
            patch.object(run_eval, "ProcessPoolExecutor", FakeExecutor),
            patch.object(run_eval, "_require_claude_cli", return_value="/usr/bin/claude"),
        ):
            output = run_eval.run_eval(
                eval_set=[{"query": "q", "should_trigger": True}],
                skill_name="example",
                description="Use for examples.",
                num_workers=2,
                timeout=5,
                project_root=Path("."),
                runs_per_query=2,
                trigger_threshold=0.5,
            )

        result = output["results"][0]
        self.assertIsNone(result["trigger_rate"])
        self.assertEqual(result["completed_runs"], 0)
        self.assertEqual(result["execution_errors"], 2)
        self.assertFalse(result["pass"])
        self.assertEqual(
            result["error_messages"],
            ["run-1 failed", "run-2 failed"],
        )

    def test_partial_execution_keeps_rate_over_completed_but_fails_query(self) -> None:
        FakeExecutor.errors = [True, RuntimeError("run-2 failed"), False]
        with (
            patch.object(run_eval, "ProcessPoolExecutor", FakeExecutor),
            patch.object(run_eval, "_require_claude_cli", return_value="/usr/bin/claude"),
        ):
            output = run_eval.run_eval(
                eval_set=[{"query": "q", "should_trigger": True}],
                skill_name="example",
                description="Use for examples.",
                num_workers=3,
                timeout=5,
                project_root=Path("."),
                runs_per_query=3,
                trigger_threshold=0.5,
            )
        result = output["results"][0]
        self.assertEqual(result["trigger_rate"], 0.5)
        self.assertEqual(result["completed_runs"], 2)
        self.assertEqual(result["execution_errors"], 1)
        self.assertFalse(result["pass"])

    def test_strict_eval_json_rejects_nan(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "eval.json"
            path.write_text('[{"query":"x","should_trigger":true,"x":NaN}]', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "invalid eval JSON"):
                run_eval._load_eval_json(path)

    def test_eof_without_result_is_not_no_trigger(self) -> None:
        class FakeStdout:
            def __init__(self) -> None:
                self.lines = [b'{"type":"assistant","message":{"content":[]}}\n', b""]

            def readline(self) -> bytes:
                return self.lines.pop(0)

        class FakeProcess:
            stdout = FakeStdout()
            stderr = None
            returncode = 0

            def poll(self) -> int:
                return 0

            def wait(self, timeout: float | None = None) -> int:
                del timeout
                self.returncode = 0
                return 0

        process = FakeProcess()
        with self.assertRaisesRegex(RuntimeError, "terminal result event"):
            run_eval._evaluate_process(
                process,
                "example-skill-12345678",
                timeout=1,
            )


if __name__ == "__main__":
    unittest.main()
