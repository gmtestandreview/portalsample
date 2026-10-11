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

import eval_control


def make_spec(**changes: object) -> eval_control.AttemptSpec:
    values: dict[str, object] = {
        "kind": "activation:train",
        "query": "Create an Agent Skill",
        "run_index": 0,
        "skill_name": "skill-creator",
        "skill_content_sha256": "a" * 64,
        "model": "claude-sonnet-4-6",
        "claude_version": "claude 1.2.3",
        "distractor_sha256": "b" * 64,
        "harness_version": 1,
    }
    values.update(changes)
    return eval_control.AttemptSpec(**values)  # type: ignore[arg-type]


def result(outcome: str = "trigger", **kwargs: object) -> eval_control.CachedResult:
    return eval_control.CachedResult(outcome=outcome, **kwargs)


class EvaluationControlTests(unittest.TestCase):
    def test_permits_are_bounded_and_accounted(self) -> None:
        control = eval_control.EvaluationControl(max_calls=2, planned_calls=3, checkpoint=None, deadline_seconds=None)
        first, second, third = (make_spec(run_index=index) for index in range(3))
        self.assertTrue(control.reserve_call(first))
        self.assertTrue(control.reserve_call(second))
        self.assertFalse(control.reserve_call(third))
        self.assertEqual(control.attempted_calls, 2)
        self.assertEqual(control.stop_reason, "budget_exhausted")
        control.record_success(first, result())
        control.record_success(second, result("no_trigger"))
        control.mark_skipped(1)
        self.assertEqual(control.snapshot().successful_calls, 2)
        self.assertEqual(control.planned_calls, control.resumed_calls + control.attempted_calls + control.skipped_calls)

    def test_deadline_rejects_without_mutating_attempts(self) -> None:
        values = iter((0.0, 10.0))
        clock = lambda: next(values)
        control = eval_control.EvaluationControl(max_calls=2, planned_calls=1, checkpoint=None, deadline_seconds=1.0, clock=clock)
        self.assertFalse(control.reserve_call(make_spec()))
        self.assertEqual(control.stop_reason, "deadline_exceeded")
        self.assertEqual(control.attempted_calls, 0)

    def test_rate_limit_opens_circuit_and_upgrades_stop_reason(self) -> None:
        control = eval_control.EvaluationControl(max_calls=3, planned_calls=2, checkpoint=None, deadline_seconds=None)
        spec = make_spec()
        self.assertTrue(control.reserve_call(spec))
        control.record_error(spec, eval_control.ClaudeCliError(status=429, message="You've hit your limit"))
        self.assertTrue(control.circuit_open)
        self.assertEqual(control.stop_reason, "rate_limited")
        self.assertFalse(control.reserve_call(make_spec(run_index=1)))

    def test_attempt_key_changes_for_all_identity_fields(self) -> None:
        base = make_spec()
        self.assertEqual(base.key(), make_spec().key())
        fields = (
            "kind", "model", "claude_version", "query", "run_index",
            "skill_content_sha256", "distractor_sha256", "harness_version",
        )
        for field in fields:
            value = getattr(base, field)
            changed = (value + "x") if isinstance(value, str) else value + 1
            self.assertNotEqual(base.key(), make_spec(**{field: changed}), field)

    def test_checkpoint_records_resume_errors_and_invalidations(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = eval_control.CheckpointStore(Path(tmp) / "checkpoint.jsonl")
            spec = make_spec()
            store.append_success(spec, result())
            self.assertEqual(store.lookup(spec.key()), result())
            store.append_error(spec, RuntimeError("broken"))
            self.assertEqual(store.lookup(spec.key()), result())
            store.append_invalidation(spec, "artifact changed")
            self.assertIsNone(store.lookup(spec.key()))
            with Path(tmp, "checkpoint.jsonl").open("a", encoding="utf-8") as handle:
                handle.write('{"schema_version":')
            self.assertIsNone(store.lookup(spec.key()))

    def test_conflicting_successes_fail_closed_and_duplicate_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = eval_control.CheckpointStore(Path(tmp) / "checkpoint.jsonl")
            spec = make_spec()
            store.append_success(spec, result())
            store.append_success(spec, result())
            self.assertEqual(store.lookup(spec.key()), result())
            record = json.loads(Path(tmp, "checkpoint.jsonl").read_text(encoding="utf-8").splitlines()[0])
            record["outcome"] = "no_trigger"
            with Path(tmp, "checkpoint.jsonl").open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record) + "\n")
            with self.assertRaises(eval_control.CheckpointFormatError):
                store.lookup(spec.key())

    def test_cache_validator_controls_resumed_accounting(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = eval_control.CheckpointStore(Path(tmp) / "checkpoint.jsonl")
            spec = make_spec()
            store.append_success(spec, result())
            control = eval_control.EvaluationControl(max_calls=1, planned_calls=1, checkpoint=store, deadline_seconds=None)
            self.assertIsNone(control.consume_cached(spec, lambda _: "bad"))
            self.assertEqual(control.resumed_calls, 0)
            self.assertTrue(control.reserve_call(spec))
            control.record_success(spec, result())
            with self.assertRaises(eval_control.CacheValidationError):
                control.consume_cached(spec, lambda _: (_ for _ in ()).throw(ValueError("validator broke")))
            self.assertEqual(control.resumed_calls, 0)

    def test_cancelled_reservation_becomes_skipped(self) -> None:
        control = eval_control.EvaluationControl(max_calls=2, planned_calls=2, checkpoint=None, deadline_seconds=None)
        spec = make_spec()
        self.assertTrue(control.reserve_call(spec))
        control.cancel_reserved(spec)
        self.assertEqual(control.attempted_calls, 0)
        self.assertEqual(control.skipped_calls, 1)
        with self.assertRaises(RuntimeError):
            control.cancel_reserved(spec)

    def test_invalid_model_ids_are_rejected(self) -> None:
        for value in ("sonnet", "opus", "haiku", "Claude-sonnet-4-6", "claude-sonnet", "claude-sonnet-x"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                eval_control.validate_model_id(value)
        self.assertEqual(eval_control.validate_model_id("claude-sonnet-4-6"), "claude-sonnet-4-6")

    def test_parser_rejects_invalid_records(self) -> None:
        spec = make_spec()
        good = {
            "schema_version": 1,
            "attempt_key": spec.key(),
            "kind": spec.kind,
            "spec": spec.to_dict(),
            "status": "success",
            "outcome": "trigger",
            "value": None,
            "payload": None,
            "artifacts": [],
            "error_status": None,
            "error_message": None,
            "invalidation_reason": None,
            "recorded_at": "2026-09-25T00:00:00Z",
        }
        for key in ("attempt_key", "spec", "status", "outcome"):
            bad = dict(good)
            bad.pop(key)
            with self.subTest(key=key), self.assertRaises(eval_control.CheckpointFormatError):
                eval_control.parse_checkpoint_record(bad)
        bad = dict(good, status="error", outcome=None, error_message=None)
        with self.assertRaises(eval_control.CheckpointFormatError):
            eval_control.parse_checkpoint_record(bad)

    def test_cache_validation_exception_does_not_invalidate_or_start_work(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "checkpoint.jsonl"
            store = eval_control.CheckpointStore(path)
            spec = make_spec()
            store.append_success(spec, result())
            before = path.read_text(encoding="utf-8")
            control = eval_control.EvaluationControl(max_calls=1, planned_calls=1, checkpoint=store, deadline_seconds=None)
            with patch.object(store, "append_invalidation") as invalidate:
                with self.assertRaises(eval_control.CacheValidationError):
                    control.consume_cached(spec, lambda _: (_ for _ in ()).throw(ValueError("no")))
            invalidate.assert_not_called()
            self.assertEqual(path.read_text(encoding="utf-8"), before)
            self.assertEqual(control.resumed_calls, 0)


if __name__ == "__main__":
    unittest.main()
