#!/usr/bin/env python3
"""Shared call-budget, checkpoint, and circuit-breaker primitives."""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from collections.abc import Callable, Mapping

CHECKPOINT_SCHEMA_VERSION = 1
_MODEL_RE = re.compile(r"^claude-[a-z0-9-]*\d[a-z0-9-]*$")
_OUTCOMES = {
    "trigger", "no_trigger", "engaged", "not_engaged",
    "red_complete", "green_complete", "description",
}
_SPEC_FIELDS = {
    "kind", "query", "run_index", "skill_name", "skill_content_sha256",
    "model", "claude_version", "distractor_sha256", "harness_version",
}
_RECORD_FIELDS = {
    "schema_version", "attempt_key", "kind", "spec", "status", "outcome",
    "value", "payload", "artifacts", "error_status", "error_message",
    "invalidation_reason", "recorded_at",
}


class ClaudeCliError(RuntimeError):
    """A typed error returned by Claude's CLI protocol."""

    def __init__(self, status: int | None = None, message: str = "") -> None:
        self.status = status
        self.message = str(message)
        super().__init__(self.message)

    def __reduce__(self) -> tuple[type[ClaudeCliError], tuple[int | None, str]]:
        return (type(self), (self.status, self.message))


class CacheValidationError(RuntimeError):
    """A checkpoint validator raised instead of rejecting a cached result."""


class CheckpointFormatError(ValueError):
    """A checkpoint line is malformed or semantically inconsistent."""


def validate_model_id(value: str) -> str:
    """Accept only an explicit, lowercase, versioned Claude model identifier."""
    if not isinstance(value, str) or not _MODEL_RE.fullmatch(value):
        raise ValueError("model must be a lowercase versioned claude-* identifier")
    return value


@dataclass(frozen=True, slots=True)
class AttemptSpec:
    kind: str
    query: str
    run_index: int
    skill_name: str
    skill_content_sha256: str
    model: str
    claude_version: str
    distractor_sha256: str
    harness_version: int = 1

    def to_dict(self) -> dict[str, object]:
        return asdict(self)

    def key(self) -> str:
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class ArtifactEvidence:
    relative_path: str
    sha256: str

    def to_dict(self) -> dict[str, str]:
        return {"relative_path": self.relative_path, "sha256": self.sha256}


@dataclass(frozen=True, slots=True)
class CachedResult:
    outcome: str
    value: str | None = None
    payload: dict[str, object] | None = None
    artifacts: tuple[ArtifactEvidence, ...] = ()

    def to_dict(self) -> dict[str, object]:
        return {
            "outcome": self.outcome,
            "value": self.value,
            "payload": self.payload,
            "artifacts": [artifact.to_dict() for artifact in self.artifacts],
        }

    @classmethod
    def from_record(cls, record: Mapping[str, object]) -> CachedResult:
        outcome = record.get("outcome")
        if not isinstance(outcome, str) or outcome not in _OUTCOMES:
            raise CheckpointFormatError("success record has an unknown outcome")
        value = record.get("value")
        if value is not None and not isinstance(value, str):
            raise CheckpointFormatError("value must be a string or null")
        if outcome == "description" and not value:
            raise CheckpointFormatError("description success requires a non-empty value")
        payload = record.get("payload")
        if payload is not None and not isinstance(payload, dict):
            raise CheckpointFormatError("payload must be an object or null")
        raw_artifacts = record.get("artifacts")
        if not isinstance(raw_artifacts, list):
            raise CheckpointFormatError("artifacts must be a list")
        artifacts: list[ArtifactEvidence] = []
        for raw in raw_artifacts:
            if not isinstance(raw, dict) or set(raw) != {"relative_path", "sha256"}:
                raise CheckpointFormatError("invalid artifact evidence")
            path, digest = raw["relative_path"], raw["sha256"]
            if not isinstance(path, str) or not isinstance(digest, str):
                raise CheckpointFormatError("artifact fields must be strings")
            artifacts.append(ArtifactEvidence(path, digest))
        return cls(outcome, value, payload, tuple(artifacts))


@dataclass(frozen=True, slots=True)
class CounterSnapshot:
    planned_calls: int
    attempted_calls: int
    resumed_calls: int
    successful_calls: int
    error_calls: int
    skipped_calls: int


def _record_base(spec: AttemptSpec, status: str) -> dict[str, object]:
    return {
        "schema_version": CHECKPOINT_SCHEMA_VERSION,
        "attempt_key": spec.key(),
        "kind": spec.kind,
        "spec": spec.to_dict(),
        "status": status,
        "outcome": None,
        "value": None,
        "payload": None,
        "artifacts": [],
        "error_status": None,
        "error_message": None,
        "invalidation_reason": None,
        "recorded_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def _spec_from_mapping(value: object) -> AttemptSpec:
    if not isinstance(value, dict) or set(value) != _SPEC_FIELDS:
        raise CheckpointFormatError("spec has missing or unknown fields")
    if not isinstance(value["kind"], str) or not isinstance(value["query"], str):
        raise CheckpointFormatError("spec text fields are invalid")
    if not isinstance(value["run_index"], int) or isinstance(value["run_index"], bool):
        raise CheckpointFormatError("run_index must be an integer")
    if not all(isinstance(value[field], str) for field in (
        "skill_name", "skill_content_sha256", "model", "claude_version", "distractor_sha256",
    )):
        raise CheckpointFormatError("spec identity fields are invalid")
    if not isinstance(value["harness_version"], int) or isinstance(value["harness_version"], bool):
        raise CheckpointFormatError("harness_version must be an integer")
    return AttemptSpec(**value)  # type: ignore[arg-type]


def parse_checkpoint_record(raw: object) -> dict[str, object]:
    """Validate one decoded checkpoint object and return a normalized copy."""
    if not isinstance(raw, dict) or set(raw) != _RECORD_FIELDS:
        raise CheckpointFormatError("checkpoint record has missing or unknown fields")
    if raw["schema_version"] != CHECKPOINT_SCHEMA_VERSION:
        raise CheckpointFormatError("unknown checkpoint schema version")
    attempt_key = raw["attempt_key"]
    if not isinstance(attempt_key, str):
        raise CheckpointFormatError("attempt_key must be a string")
    spec = _spec_from_mapping(raw["spec"])
    if spec.key() != attempt_key or raw["kind"] != spec.kind:
        raise CheckpointFormatError("attempt key or kind does not match spec")
    status = raw["status"]
    if status not in {"success", "error", "invalidated"}:
        raise CheckpointFormatError("unknown checkpoint status")
    if not isinstance(raw["recorded_at"], str) or not raw["recorded_at"]:
        raise CheckpointFormatError("recorded_at must be a string")
    if status == "success":
        if raw["error_status"] is not None or raw["error_message"] is not None or raw["invalidation_reason"] is not None:
            raise CheckpointFormatError("success has error or invalidation fields")
        CachedResult.from_record(raw)
    elif status == "error":
        if raw["outcome"] is not None or raw["value"] is not None or raw["payload"] is not None or raw["artifacts"] != []:
            raise CheckpointFormatError("error cannot contain a result")
        if not isinstance(raw["error_message"], str) or not raw["error_message"]:
            raise CheckpointFormatError("error requires an error message")
    else:
        if raw["outcome"] is not None or raw["value"] is not None or raw["payload"] is not None or raw["artifacts"] != []:
            raise CheckpointFormatError("invalidation cannot contain a result")
        if not isinstance(raw["invalidation_reason"], str) or not raw["invalidation_reason"]:
            raise CheckpointFormatError("invalidation requires a reason")
    return dict(raw)


class CheckpointStore:
    """Append-only JSONL storage for typed attempt results."""

    def __init__(self, path: Path) -> None:
        self.path = Path(path)

    def _records(self) -> list[dict[str, object]]:
        if not self.path.exists():
            return []
        lines = self.path.read_text(encoding="utf-8").splitlines(keepends=True)
        records: list[dict[str, object]] = []
        for index, line in enumerate(lines):
            if not line.strip():
                continue
            try:
                raw = json.loads(line)
            except json.JSONDecodeError as exc:
                if index == len(lines) - 1 and not line.endswith(("\n", "\r")):
                    continue
                raise CheckpointFormatError(f"malformed checkpoint line {index + 1}") from exc
            records.append(parse_checkpoint_record(raw))
        return records

    def _append(self, record: dict[str, object]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, sort_keys=True, ensure_ascii=False) + "\n")
            handle.flush()
            os.fsync(handle.fileno())

    def lookup(self, attempt_key: str) -> CachedResult | None:
        active: dict[str, CachedResult] = {}
        for record in self._records():
            key = record["attempt_key"]
            if not isinstance(key, str):
                raise CheckpointFormatError("attempt_key must be a string")
            if record["status"] == "invalidated":
                active.pop(key, None)
            elif record["status"] == "success":
                candidate = CachedResult.from_record(record)
                previous = active.get(key)
                if previous is not None and previous != candidate:
                    raise CheckpointFormatError("conflicting active successes")
                active[key] = candidate
        return active.get(attempt_key)

    def append_success(self, spec: AttemptSpec, result: CachedResult) -> None:
        record = _record_base(spec, "success")
        record.update(result.to_dict())
        self._append(record)

    def append_error(self, spec: AttemptSpec, error: BaseException) -> None:
        record = _record_base(spec, "error")
        status = getattr(error, "status", None)
        record["error_status"] = status if isinstance(status, int) else None
        record["error_message"] = str(error) or type(error).__name__
        self._append(record)

    def append_invalidation(self, spec: AttemptSpec, reason: str) -> None:
        if not reason:
            raise ValueError("invalidation reason must not be empty")
        record = _record_base(spec, "invalidated")
        record["invalidation_reason"] = reason
        self._append(record)


class EvaluationControl:
    """Parent-process accounting and permit controller for evaluator calls."""

    def __init__(
        self,
        *,
        max_calls: int,
        planned_calls: int,
        checkpoint: CheckpointStore | None,
        deadline_seconds: float | None,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_calls < 0 or planned_calls < 0:
            raise ValueError("call counts cannot be negative")
        if deadline_seconds is not None and deadline_seconds < 0:
            raise ValueError("deadline must not be negative")
        self.max_calls = max_calls
        self._planned_calls = planned_calls
        self.checkpoint = checkpoint
        self.deadline_seconds = deadline_seconds
        self._clock = clock
        self._started_at = clock()
        self._attempted = 0
        self._resumed = 0
        self._successful = 0
        self._errors = 0
        self._skipped = 0
        self._launched = 0
        self._stop_reason: str | None = None
        self._circuit_open = False
        self._outstanding: dict[str, AttemptSpec] = {}

    @property
    def planned_calls(self) -> int: return self._planned_calls
    @property
    def attempted_calls(self) -> int: return self._attempted
    @property
    def resumed_calls(self) -> int: return self._resumed
    @property
    def successful_calls(self) -> int: return self._successful
    @property
    def error_calls(self) -> int: return self._errors
    @property
    def skipped_calls(self) -> int: return self._skipped
    @property
    def stop_reason(self) -> str | None: return self._stop_reason
    @property
    def circuit_open(self) -> bool: return self._circuit_open

    def snapshot(self) -> CounterSnapshot:
        return CounterSnapshot(
            self.planned_calls, self.attempted_calls, self.resumed_calls,
            self.successful_calls, self.error_calls, self.skipped_calls,
        )

    def _set_stop(self, reason: str) -> None:
        if self._stop_reason is None or reason == "rate_limited":
            self._stop_reason = reason

    def _ensure_accounting(self) -> None:
        accounted = self._resumed + self._attempted + self._skipped
        if accounted > self._planned_calls:
            raise RuntimeError("evaluation accounting exceeds planned calls")
        if self._successful + self._errors > self._attempted:
            raise RuntimeError("settled calls exceed attempted calls")

    def consume_cached(self, spec: AttemptSpec, validator: Callable[[CachedResult], str | None]) -> CachedResult | None:
        if self.checkpoint is None:
            return None
        cached = self.checkpoint.lookup(spec.key())
        if cached is None:
            return None
        try:
            reason = validator(cached)
        except Exception as exc:
            raise CacheValidationError(str(exc)) from exc
        if reason is None:
            self._resumed += 1
            self._ensure_accounting()
            return cached
        self.checkpoint.append_invalidation(spec, reason)
        return None

    def extend_plan(self, additional_calls: int) -> None:
        if additional_calls <= 0:
            raise ValueError("additional calls must be positive")
        self._planned_calls += additional_calls

    def reserve_call(self, spec: AttemptSpec) -> bool:
        key = spec.key()
        if key in self._outstanding:
            raise RuntimeError("attempt is already reserved")
        if self._circuit_open:
            self._set_stop("rate_limited")
            return False
        if self.deadline_seconds is not None and self._clock() - self._started_at >= self.deadline_seconds:
            self._set_stop("deadline_exceeded")
            return False
        if self._launched >= self.max_calls:
            self._set_stop("budget_exhausted")
            return False
        if self._resumed + self._attempted + self._skipped >= self._planned_calls:
            self._set_stop("budget_exhausted")
            return False
        self._launched += 1
        self._attempted += 1
        self._outstanding[key] = spec
        self._ensure_accounting()
        return True

    def cancel_reserved(self, spec: AttemptSpec) -> None:
        key = spec.key()
        if key not in self._outstanding:
            raise RuntimeError("attempt is not an unsettled reservation")
        del self._outstanding[key]
        self._attempted -= 1
        self._skipped += 1
        self._ensure_accounting()

    def record_success(self, spec: AttemptSpec, result: CachedResult) -> None:
        key = spec.key()
        if key not in self._outstanding:
            raise RuntimeError("attempt is not an unsettled reservation")
        if self.checkpoint is not None:
            self.checkpoint.append_success(spec, result)
        del self._outstanding[key]
        self._successful += 1
        self._ensure_accounting()

    def record_error(self, spec: AttemptSpec, error: BaseException) -> None:
        key = spec.key()
        if key not in self._outstanding:
            raise RuntimeError("attempt is not an unsettled reservation")
        if self.checkpoint is not None:
            self.checkpoint.append_error(spec, error)
        del self._outstanding[key]
        self._errors += 1
        if isinstance(error, ClaudeCliError) and error.status == 429:
            self._circuit_open = True
            self._set_stop("rate_limited")
        self._ensure_accounting()

    def mark_skipped(self, count: int) -> None:
        if count < 0 or count > self._planned_calls - self._resumed - self._attempted - self._skipped:
            raise RuntimeError("skipped count exceeds unaccounted planned calls")
        self._skipped += count
        self._ensure_accounting()

