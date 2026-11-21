from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ..eval_control import (
    AttemptSpec,
    CachedResult,
    CacheValidationError,
    CheckpointFormatError,
    CheckpointStore,
    ClaudeCliError,
    EvaluationControl,
    effective_skill_digest,
    parse_checkpoint_record,
    validate_model_id,
)


def make_spec(
    *,
    kind: str = 'activation:train',
    query: str = 'Create an Agent Skill',
    run_index: int = 0,
    skill_name: str = 'skill-creator',
    skill_content_sha256: str = 'a' * 64,
    model: str = 'claude-sonnet-4-6',
    claude_version: str = 'claude 1.2.3',
    distractor_sha256: str = 'b' * 64,
    harness_version: int = 1,
) -> AttemptSpec:
    return AttemptSpec(
        kind=kind,
        query=query,
        run_index=run_index,
        skill_name=skill_name,
        skill_content_sha256=skill_content_sha256,
        model=model,
        claude_version=claude_version,
        distractor_sha256=distractor_sha256,
        harness_version=harness_version,
    )


def result(outcome: str = 'trigger') -> CachedResult:
    return CachedResult(outcome=outcome)


class EvaluationControlTests(unittest.TestCase):
    def test_effective_source_digest_invalidates_changed_reference(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'SKILL.md').write_text('unchanged', encoding='utf-8')
            (root / 'references').mkdir()
            ref = root / 'references' / 'details.md'
            ref.write_text('before', encoding='utf-8')
            first = effective_skill_digest(root)
            ref.write_text('after', encoding='utf-8')
            second = effective_skill_digest(root)
            self.assertNotEqual(first, second)
            (root / '__pycache__').mkdir()
            (root / '__pycache__' / 'ignored.pyc').write_bytes(b'runtime')
            self.assertEqual(second, effective_skill_digest(root))

    def test_permits_are_bounded_and_accounted(self) -> None:
        control = EvaluationControl(
            max_calls=2, planned_calls=3, checkpoint=None, deadline_seconds=None
        )
        first, second, third = (make_spec(run_index=index) for index in range(3))
        self.assertTrue(control.reserve_call(first))
        self.assertTrue(control.reserve_call(second))
        self.assertFalse(control.reserve_call(third))
        self.assertEqual(control.attempted_calls, 2)
        self.assertEqual(control.stop_reason, 'budget_exhausted')
        control.record_success(first, result())
        control.record_success(second, result('no_trigger'))
        control.mark_skipped(1)
        self.assertEqual(control.snapshot().successful_calls, 2)
        self.assertEqual(
            control.planned_calls,
            control.resumed_calls + control.attempted_calls + control.skipped_calls,
        )

    def test_deadline_rejects_without_mutating_attempts(self) -> None:
        values = iter((0.0, 10.0))

        def clock() -> float:
            return next(values)

        control = EvaluationControl(
            max_calls=2,
            planned_calls=1,
            checkpoint=None,
            deadline_seconds=1.0,
            clock=clock,
        )
        self.assertFalse(control.reserve_call(make_spec()))
        self.assertEqual(control.stop_reason, 'deadline_exceeded')
        self.assertEqual(control.attempted_calls, 0)

    def test_rate_limit_opens_circuit_and_upgrades_stop_reason(self) -> None:
        control = EvaluationControl(
            max_calls=3, planned_calls=2, checkpoint=None, deadline_seconds=None
        )
        spec = make_spec()
        self.assertTrue(control.reserve_call(spec))
        control.record_error(spec, ClaudeCliError(status=429, message="You've hit your limit"))
        self.assertTrue(control.circuit_open)
        self.assertEqual(control.stop_reason, 'rate_limited')
        self.assertFalse(control.reserve_call(make_spec(run_index=1)))

    def test_attempt_key_changes_for_all_identity_fields(self) -> None:
        base = make_spec()
        self.assertEqual(base.key(), make_spec().key())
        variants: dict[str, AttemptSpec] = {
            'kind': make_spec(kind=base.kind + 'x'),
            'model': make_spec(model=base.model + 'x'),
            'claude_version': make_spec(claude_version=base.claude_version + 'x'),
            'query': make_spec(query=base.query + 'x'),
            'run_index': make_spec(run_index=base.run_index + 1),
            'skill_content_sha256': make_spec(skill_content_sha256=base.skill_content_sha256 + 'x'),
            'distractor_sha256': make_spec(distractor_sha256=base.distractor_sha256 + 'x'),
            'harness_version': make_spec(harness_version=base.harness_version + 1),
        }
        for field, candidate in variants.items():
            with self.subTest(field=field):
                self.assertNotEqual(base.key(), candidate.key())

    def test_checkpoint_records_resume_errors_and_invalidations(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = CheckpointStore(Path(tmp) / 'checkpoint.jsonl')
            spec = make_spec()
            key = spec.key()
            store.append_success(spec, result())
            self.assertEqual(store.lookup(key), result())
            store.append_error(spec, RuntimeError('broken'))
            self.assertEqual(store.lookup(key), result())
            store.append_invalidation(spec, 'artifact changed')
            self.assertIsNone(store.lookup(key))
            with Path(tmp, 'checkpoint.jsonl').open('a', encoding='utf-8') as handle:
                handle.write('{"schema_version":')
            self.assertIsNone(store.lookup(key))

    def test_conflicting_successes_fail_closed_and_duplicate_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            checkpoint_path = Path(tmp, 'checkpoint.jsonl')
            store = CheckpointStore(checkpoint_path)
            spec = make_spec()
            key = spec.key()
            store.append_success(spec, result())
            store.append_success(spec, result())
            self.assertEqual(store.lookup(key), result())
            record = json.loads(checkpoint_path.read_text(encoding='utf-8').splitlines()[0])
            record['outcome'] = 'no_trigger'
            with checkpoint_path.open('a', encoding='utf-8') as handle:
                handle.write(json.dumps(record) + '\n')
            with self.assertRaises(CheckpointFormatError):
                store.lookup(key)

    def test_cache_validator_controls_resumed_accounting(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = CheckpointStore(Path(tmp) / 'checkpoint.jsonl')
            spec = make_spec()
            store.append_success(spec, result())
            control = EvaluationControl(
                max_calls=1, planned_calls=1, checkpoint=store, deadline_seconds=None
            )
            self.assertIsNone(control.consume_cached(spec, lambda _: 'bad'))
            self.assertEqual(control.resumed_calls, 0)
            self.assertTrue(control.reserve_call(spec))
            control.record_success(spec, result())

            def broken_validator(_: CachedResult) -> str | None:
                raise ValueError('validator broke')

            with self.assertRaises(CacheValidationError):
                control.consume_cached(spec, broken_validator)
            self.assertEqual(control.resumed_calls, 0)

    def test_cancelled_reservation_becomes_skipped(self) -> None:
        control = EvaluationControl(
            max_calls=2, planned_calls=2, checkpoint=None, deadline_seconds=None
        )
        spec = make_spec()
        self.assertTrue(control.reserve_call(spec))
        control.cancel_reserved(spec)
        self.assertEqual(control.attempted_calls, 0)
        self.assertEqual(control.skipped_calls, 1)
        with self.assertRaises(RuntimeError):
            control.cancel_reserved(spec)

    def test_invalid_model_ids_are_rejected(self) -> None:
        for value in (
            'sonnet',
            'opus',
            'haiku',
            'Claude-sonnet-4-6',
            'claude-sonnet',
            'claude-sonnet-x',
        ):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_model_id(value)
        self.assertEqual(validate_model_id('claude-sonnet-4-6'), 'claude-sonnet-4-6')

    def test_parser_rejects_invalid_records(self) -> None:
        spec = make_spec()
        good: dict[str, object] = {
            'schema_version': 1,
            'attempt_key': spec.key(),
            'kind': spec.kind,
            'spec': spec.to_dict(),
            'status': 'success',
            'outcome': 'trigger',
            'value': None,
            'payload': None,
            'artifacts': [],
            'error_status': None,
            'error_message': None,
            'invalidation_reason': None,
            'recorded_at': '2026-09-25T00:00:00Z',
        }
        for key in ('attempt_key', 'spec', 'status', 'outcome'):
            bad = dict(good)
            bad.pop(key)
            with self.subTest(key=key), self.assertRaises(CheckpointFormatError):
                parse_checkpoint_record(bad)

        bad_error = dict(good, status='error', outcome=None, error_message=None)
        with self.assertRaises(CheckpointFormatError):
            parse_checkpoint_record(bad_error)

    def test_cache_validation_exception_does_not_invalidate_or_start_work(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'checkpoint.jsonl'
            store = CheckpointStore(path)
            spec = make_spec()
            store.append_success(spec, result())
            before = path.read_text(encoding='utf-8')
            control = EvaluationControl(
                max_calls=1, planned_calls=1, checkpoint=store, deadline_seconds=None
            )

            def broken_validator(_: CachedResult) -> str | None:
                raise ValueError('no')

            with (
                patch.object(store, 'append_invalidation') as invalidate,
                self.assertRaises(CacheValidationError),
            ):
                control.consume_cached(spec, broken_validator)
            invalidate.assert_not_called()
            self.assertEqual(path.read_text(encoding='utf-8'), before)
            self.assertEqual(control.resumed_calls, 0)


if __name__ == '__main__':
    unittest.main()
