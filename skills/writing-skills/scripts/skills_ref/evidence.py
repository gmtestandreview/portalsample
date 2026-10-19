"""Read-only preflight for frozen skill evaluation evidence, not a grader."""

import hashlib
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path

STATUSES = ("PASS", "AMBER", "FAIL", "NHR", "N/A")
GATES = (
    "static",
    "behavioral",
    "discovery",
    "loading",
    "application",
    "artifact",
    "runtime",
    "delivery",
)
KINDS = ("static", "lifecycle", "comparative", "behavioral", "runtime", "process")


def _mapping(value: object, label: str) -> dict[str, object]:
    if not isinstance(value, dict) or any(not isinstance(k, str) for k in value):
        raise ValueError(f"{label}: expected an object")
    return {str(k): v for k, v in value.items()}


def _items(value: object, label: str) -> list[object]:
    if not isinstance(value, list):
        raise ValueError(f"{label}: expected a list")
    return list(value)


def _text(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label}: expected nonempty text")
    return value


def _number(value: object, label: str) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise ValueError(f"{label}: expected a finite nonnegative number")
    number = value if isinstance(value, Decimal) else Decimal(str(value))
    if not number.is_finite() or number < 0:
        raise ValueError(f"{label}: expected a finite nonnegative number")
    return number


def _integer(value: object, label: str) -> int:
    if type(value) is not int or value < 0:
        raise ValueError(f"{label}: expected a nonnegative integer")
    return value


def _unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _artifacts(record: dict[str, object], root: Path) -> dict[str, str]:
    roles: dict[str, str] = {}
    for item in _items(record.get("artifacts"), "artifacts"):
        artifact = _mapping(item, "artifact")
        key = _text(artifact.get("id"), "artifact.id")
        role = _text(artifact.get("role"), "artifact.role")
        if key in roles:
            raise ValueError(f"duplicate artifact id: {key}")
        path = (root / _text(artifact.get("path"), "artifact.path")).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f"artifact {key}: missing file or path outside root")
        expected = _text(artifact.get("sha256"), "artifact.sha256")
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f"artifact {key}: hash mismatch; evidence is stale")
        if path.stat().st_size == 0:
            raise ValueError(f"artifact {key}: empty evidence")
        roles[key] = role
    missing = {"candidate", "oracle", "rubric", "raw", "checkpoint"} - set(roles.values())
    if missing:
        raise ValueError(f"artifacts: missing roles {sorted(missing)}")
    return roles


def _evaluation(record: dict[str, object], roles: dict[str, str]) -> Counter[str]:
    evaluation = _mapping(record.get("evaluation"), "evaluation")
    _text(evaluation.get("evaluator"), "evaluation.evaluator")
    if evaluation.get("kind") not in KINDS:
        raise ValueError("evaluation.kind: unsupported score/evidence kind")
    expected = [
        _text(v, "case id")
        for v in _items(evaluation.get("expected_case_ids"), "expected_case_ids")
    ]
    if not expected or len(expected) != len(set(expected)):
        raise ValueError("expected_case_ids: empty or duplicate IDs")
    seen: set[str] = set()
    counts: Counter[str] = Counter()
    for item in _items(evaluation.get("cases"), "cases"):
        case = _mapping(item, "case")
        key = _text(case.get("id"), "case.id")
        status = _text(case.get("status"), "case.status")
        if key in seen or status not in STATUSES:
            raise ValueError(f"case {key}: duplicate ID or invalid status")
        seen.add(key)
        passed = case.get("passed")
        if "passed" not in case or (
            (status == "PASS" and passed is not True)
            or (status == "FAIL" and passed is not False)
            or (status in ("AMBER", "NHR", "N/A") and passed is not None)
        ):
            raise ValueError(f"case {key}: status and Boolean passed disagree")
        if roles.get(_text(case.get("evidence"), "case.evidence")) != "raw":
            raise ValueError(f"case {key}: raw evidence reference missing")
        counts[status] += 1
    if seen != set(expected):
        raise ValueError("cases: IDs do not match frozen expected_case_ids")
    summary = _mapping(record.get("summary"), "summary")
    if set(summary) != set(STATUSES) or any(
        _integer(summary.get(status), f"summary.{status}") != counts[status] for status in STATUSES
    ):
        raise ValueError("summary: counts disagree with case results")
    return counts


def _score(record: dict[str, object]) -> bool:
    if record.get("score") is None:
        return True
    score = _mapping(record["score"], "score")
    if score.get("kind") not in KINDS:
        raise ValueError("score.kind: unsupported score kind")
    value = _number(score.get("value"), "score.value")
    threshold = _number(score.get("threshold"), "score.threshold")
    if value > 100 or threshold > 100:
        raise ValueError("score: normalized values must be at most 100")
    operator = score.get("operator")
    if operator == ">":
        return value > threshold
    if operator == ">=":
        return value >= threshold
    raise ValueError("score.operator: use literal > or >=")


def _budget(record: dict[str, object], dispatch: bool) -> None:
    budget = _mapping(record.get("budget"), "budget")
    waves = _integer(budget.get("optional_waves"), "budget.optional_waves")
    cap = _integer(budget.get("max_optional_waves"), "budget.max_optional_waves")
    reserve = _number(budget.get("closeout_reserve"), "budget.closeout_reserve")
    remaining = budget.get("remaining_capacity")
    if reserve == 0 or cap == 0:
        raise ValueError("budget: reserve and wave cap must be positive")
    if remaining is not None:
        _number(remaining, "budget.remaining_capacity")
    if dispatch:
        if remaining is None or _number(remaining, "capacity") <= reserve or waves >= cap:
            raise ValueError("dispatch: capacity unknown/reserved or optional wave cap reached")
        _text(budget.get("uncertainty"), "dispatch.uncertainty")
        _text(budget.get("acceptance_impact"), "dispatch.acceptance_impact")


def validate_evidence(path: Path, root: Path | None = None, dispatch: bool = False) -> str:
    """Raise ValueError/OSError on invalid evidence; return the recorded disposition."""
    record = _mapping(
        json.loads(
            path.read_text(encoding="utf-8"), object_pairs_hook=_unique_object, parse_float=Decimal
        ),
        "run",
    )
    for field in ("run_id", "target", "acceptance_owner", "revision"):
        _text(record.get(field), field)
    if record.get("controller") != "writing-skills":
        raise ValueError("controller: writing-skills must be the single methodology owner")
    if "winner" in record:
        raise ValueError("winner: unsupported claim; provide a separately validated comparison")
    roles = _artifacts(record, (root or path.parent).resolve())
    counts = _evaluation(record, roles)
    meets_threshold = _score(record)
    environment = _mapping(record.get("environment"), "environment")
    for field in ("host", "interpreter", "tool", "tool_version", "config", "rules"):
        _text(environment.get(field), f"environment.{field}")
    if _integer(environment.get("file_count"), "environment.file_count") == 0:
        raise ValueError("environment.file_count: zero files cannot establish coverage")
    gates = _mapping(record.get("gates"), "gates")
    if set(gates) != set(GATES) or any(gates[g] not in STATUSES for g in gates):
        raise ValueError("gates: record each independent readiness dimension")
    recommendation = _text(record.get("recommendation"), "recommendation")
    if recommendation not in ("deploy", "revise", "split", "merge", "deprecate", "hold"):
        raise ValueError("recommendation: unsupported disposition")
    if recommendation == "deploy" and (
        not meets_threshold
        or any(gates[g] != "PASS" for g in gates)
        or any(counts[s] for s in ("AMBER", "FAIL", "NHR"))
    ):
        raise ValueError("deploy: numeric threshold, case outcomes or independent gates block it")
    _budget(record, dispatch)
    telemetry = _mapping(record.get("telemetry"), "telemetry")
    for field in ("tokens", "cached_tokens"):
        if field not in telemetry:
            raise ValueError(f"telemetry.{field}: use null when counters are unavailable")
        if telemetry[field] is not None:
            _integer(telemetry[field], f"telemetry.{field}")
    _integer(telemetry.get("agent_invocations"), "telemetry.agent_invocations")
    _number(telemetry.get("elapsed_seconds"), "telemetry.elapsed_seconds")
    return recommendation
