#!/usr/bin/env python3
"""Aggregate graded benchmark runs into JSON and Markdown summaries.

The aggregator preserves observed evidence only:
- missing measurements stay absent rather than becoming numeric zero;
- only one supported candidate/baseline pair may be compared at a time;
- run/eval ordering is deterministic and numeric where names are numbered;
- malformed grading data is rejected per-run instead of silently coerced.

Workspace and legacy ``runs/eval-*`` layouts are both supported. The flattened
``run_summary`` shape is retained for compatibility with the review viewer.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections.abc import Collection, Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import fmean, stdev
from typing import TypeAlias, TypeGuard, TypedDict, cast

JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]
JsonObject: TypeAlias = dict[str, JsonValue]
EvalId: TypeAlias = int | str
ComparisonPair: TypeAlias = tuple[str, str]

SUPPORTED_COMPARISON_PAIRS: tuple[ComparisonPair, ...] = (
    ("with_skill", "without_skill"),
    ("new_skill", "old_skill"),
)
SUPPORTED_CONFIG_NAMES: frozenset[str] = frozenset(
    name for pair in SUPPORTED_COMPARISON_PAIRS for name in pair
)
RESERVED_CONFIG_NAMES: frozenset[str] = frozenset({"delta"})
REQUIRED_EXPECTATION_FIELDS: frozenset[str] = frozenset({"text", "passed", "evidence"})
PASS_RATE_TOLERANCE = 1e-9


class Stats(TypedDict):
    count: int
    mean: float
    stddev: float
    min: float
    max: float


class ConfigSummary(TypedDict, total=False):
    pass_rate: Stats
    time_seconds: Stats
    tokens: Stats


class DeltaSummary(TypedDict, total=False):
    pass_rate: str
    time_seconds: str
    tokens: str


RunSummaryValue: TypeAlias = ConfigSummary | DeltaSummary
RunSummary: TypeAlias = dict[str, RunSummaryValue]


class RunResultRequired(TypedDict):
    eval_id: EvalId
    eval_name: str
    run_number: int
    pass_rate: float
    passed: int
    failed: int
    total: int
    expectations: list[JsonValue]
    notes: list[str]


class RunResult(RunResultRequired, total=False):
    time_seconds: float
    tokens: int
    tool_calls: int
    errors: int


class RunMetricsRequired(TypedDict):
    pass_rate: float
    passed: int
    failed: int
    total: int


class RunMetrics(RunMetricsRequired, total=False):
    time_seconds: float
    tokens: int
    tool_calls: int
    errors: int


class BenchmarkRun(TypedDict):
    eval_id: EvalId
    eval_name: str
    configuration: str
    run_number: int
    result: RunMetrics
    expectations: list[JsonValue]
    notes: list[str]


class ComparisonPairObject(TypedDict):
    candidate: str
    baseline: str


class MetadataRequired(TypedDict):
    skill_name: str
    skill_path: str
    executor_model: str
    analyzer_model: str
    timestamp: str
    evals_run: list[EvalId]
    runs_per_configuration: int | None


class Metadata(MetadataRequired, total=False):
    comparison_pair: ComparisonPairObject


class Benchmark(TypedDict):
    metadata: Metadata
    runs: list[BenchmarkRun]
    run_summary: RunSummary
    notes: list[str]


@dataclass(frozen=True, slots=True)
class CliArgs:
    benchmark_dir: Path
    skill_name: str
    skill_path: str
    output: Path | None


@dataclass(frozen=True, slots=True)
class WorkspaceEvidence:
    results: dict[str, list[RunResult]]
    eval_ids: tuple[EvalId, ...]
    config_names: tuple[str, ...]
    missing_cells: tuple[tuple[str, EvalId], ...]


def warn(message: str) -> None:
    """Write a warning to stderr without mixing it with normal output."""
    print(f"Warning: {message}", file=sys.stderr)


def is_number(value: object) -> TypeGuard[int | float]:
    """Return whether value is a finite JSON number, excluding booleans."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return isinstance(value, int) or math.isfinite(value)


def require_number(
    value: object,
    *,
    field: str,
    minimum: float | None = None,
    maximum: float | None = None,
) -> float:
    """Validate and return a finite numeric field."""
    if not is_number(value):
        raise ValueError(f"{field} must be a finite number")
    result = float(value)
    if minimum is not None and result < minimum:
        raise ValueError(f"{field} must be >= {minimum}")
    if maximum is not None and result > maximum:
        raise ValueError(f"{field} must be <= {maximum}")
    return result


def optional_number(
    value: object,
    *,
    field: str,
    minimum: float | None = None,
) -> float | None:
    """Validate an optional finite numeric field without manufacturing a default."""
    if value is None:
        return None
    return require_number(value, field=field, minimum=minimum)


def require_int(value: object, *, field: str, minimum: int = 0) -> int:
    """Validate an integer field without accepting booleans or fractional floats."""
    if isinstance(value, bool):
        raise ValueError(f"{field} must be an integer")
    if isinstance(value, int):
        result = value
    elif isinstance(value, float) and math.isfinite(value) and value.is_integer():
        result = int(value)
    else:
        raise ValueError(f"{field} must be an integer")
    if result < minimum:
        raise ValueError(f"{field} must be >= {minimum}")
    return result


def optional_int(value: object, *, field: str, minimum: int = 0) -> int | None:
    if value is None:
        return None
    return require_int(value, field=field, minimum=minimum)


def as_object(value: object) -> JsonObject | None:
    return cast(JsonObject, value) if isinstance(value, dict) else None


def calculate_stats(values: Sequence[float]) -> Stats | None:
    """Return statistics for observed finite values, or None when none exist."""
    if not values:
        return None
    if not all(math.isfinite(value) for value in values):
        raise ValueError("statistics require finite values")
    mean = fmean(values)
    stddev = stdev(values) if len(values) > 1 else 0.0
    return {
        "count": len(values),
        "mean": round(mean, 4),
        "stddev": round(stddev, 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
    }


def parse_prefixed_index(name: str, prefix: str) -> int | None:
    """Parse an exact ``<prefix>-<non-negative integer>`` name."""
    expected_prefix = f"{prefix}-"
    if not name.startswith(expected_prefix):
        return None
    suffix = name[len(expected_prefix) :]
    return int(suffix) if suffix.isdecimal() else None


def numeric_path_sort_key(path: Path, prefix: str) -> tuple[int, int, str]:
    index = parse_prefixed_index(path.name, prefix)
    return (0, index, path.name) if index is not None else (1, sys.maxsize, path.name)


def run_sort_key(run_dir: Path) -> tuple[int, int, str]:
    return numeric_path_sort_key(run_dir, "run")


def eval_sort_key(eval_dir: Path) -> tuple[int, int, str]:
    return numeric_path_sort_key(eval_dir, "eval")


def config_name_sort_key(name: str) -> tuple[int, str]:
    priority = {
        "with_skill": 0,
        "new_skill": 0,
        "without_skill": 1,
        "old_skill": 1,
    }
    return priority.get(name, 2), name


def config_sort_key(config_dir: Path) -> tuple[int, str]:
    return config_name_sort_key(config_dir.name)


def eval_id_sort_key(eval_id: EvalId) -> tuple[int, str]:
    if isinstance(eval_id, int):
        return 0, f"{eval_id:+021d}"
    return 1, eval_id


def load_json_object(path: Path) -> JsonObject:
    """Load a strict JSON object from path."""
    with path.open(encoding="utf-8") as stream:
        data: object = json.load(stream, parse_constant=_reject_non_finite)
    if not isinstance(data, dict):
        raise ValueError(f"expected JSON object in {path}")
    return cast(JsonObject, data)


def _reject_non_finite(token: str) -> object:
    raise ValueError(f"non-finite JSON number is not allowed: {token}")


def has_eval_dirs(path: Path) -> bool:
    return any(candidate.is_dir() for candidate in path.glob("eval-*"))


def find_search_dir(benchmark_dir: Path) -> Path | None:
    runs_dir = benchmark_dir / "runs"
    if runs_dir.is_dir() and has_eval_dirs(runs_dir):
        return runs_dir
    if has_eval_dirs(benchmark_dir):
        return benchmark_dir
    return None


def load_eval_metadata(eval_dir: Path, eval_idx: int) -> tuple[EvalId, str]:
    """Load eval identity, preserving independently valid metadata fields."""
    metadata_path = eval_dir / "eval_metadata.json"
    parsed_id = parse_prefixed_index(eval_dir.name, "eval")
    fallback_id: EvalId = parsed_id if parsed_id is not None else eval_idx
    fallback_name = eval_dir.name

    if not metadata_path.is_file():
        return fallback_id, fallback_name

    try:
        metadata = load_json_object(metadata_path)
    except (json.JSONDecodeError, OSError, ValueError) as exc:
        warn(f"unable to load {metadata_path}: {exc}")
        return fallback_id, fallback_name

    raw_eval_id = metadata.get("eval_id")
    if (
        isinstance(raw_eval_id, (int, str))
        and not isinstance(raw_eval_id, bool)
        and (not isinstance(raw_eval_id, str) or raw_eval_id.strip())
    ):
        eval_id: EvalId = raw_eval_id
    else:
        eval_id = fallback_id
        warn(f"invalid eval_id in {metadata_path}; using {fallback_id!r}")

    raw_eval_name = metadata.get("eval_name")
    if isinstance(raw_eval_name, str) and raw_eval_name.strip():
        eval_name = raw_eval_name
    else:
        eval_name = fallback_name
        warn(f"invalid eval_name in {metadata_path}; using {fallback_name!r}")

    return eval_id, eval_name


def parse_run_number(run_dir: Path) -> int | None:
    run_number = parse_prefixed_index(run_dir.name, "run")
    if run_number is None:
        warn(f"skipping malformed run directory: {run_dir}")
    return run_number


def validate_expectations(
    grading_file: Path,
    raw_expectations: object,
) -> tuple[list[JsonValue], bool]:
    """Validate expectation results, accepting summary-only legacy grading artifacts."""
    if raw_expectations is None:
        warn(
            f"legacy grading artifact {grading_file} has no expectations array; "
            "summary statistics remain usable but expectation-level auditability is unavailable"
        )
        return [], False
    if not isinstance(raw_expectations, list):
        raise ValueError(f"expectations in {grading_file} must be an array")
    if not raw_expectations:
        raise ValueError(f"expectations in {grading_file} must not be empty")

    validated: list[JsonValue] = []
    for index, expectation in enumerate(raw_expectations):
        if not isinstance(expectation, dict):
            raise ValueError(f"expectations[{index}] in {grading_file} must be an object")
        obj = cast(JsonObject, expectation)
        missing = REQUIRED_EXPECTATION_FIELDS.difference(obj)
        if missing:
            raise ValueError(
                f"expectations[{index}] in {grading_file} missing fields {sorted(missing)}"
            )
        text = obj.get("text")
        passed = obj.get("passed")
        evidence = obj.get("evidence")
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"expectations[{index}].text in {grading_file} must be non-empty")
        if not isinstance(passed, bool):
            raise ValueError(f"expectations[{index}].passed in {grading_file} must be boolean")
        if not isinstance(evidence, str) or not evidence.strip():
            raise ValueError(
                f"expectations[{index}].evidence in {grading_file} must be non-empty"
            )
        validated.append(cast(JsonValue, dict(obj)))
    return validated, True


def extract_notes(grading: JsonObject, grading_file: Path) -> list[str]:
    """Flatten validated user-note collections from grading data."""
    raw_summary = grading.get("user_notes_summary")
    if raw_summary is None:
        return []
    summary = as_object(raw_summary)
    if summary is None:
        warn(f"user_notes_summary in {grading_file} is not an object; ignoring it")
        return []

    notes: list[str] = []
    for key in ("uncertainties", "needs_review", "workarounds"):
        raw_values = summary.get(key)
        if raw_values is None:
            continue
        if not isinstance(raw_values, list):
            warn(f"user_notes_summary.{key} in {grading_file} is not an array; ignoring it")
            continue
        for value in raw_values:
            if isinstance(value, str):
                notes.append(value)
            else:
                warn(f"non-string user note in {grading_file} ignored: {value!r}")
    return notes


def load_timing_file(run_dir: Path) -> tuple[float | None, int | None]:
    """Load independently available duration and token observations."""
    timing_file = run_dir / "timing.json"
    if not timing_file.is_file():
        return None, None

    try:
        timing = load_json_object(timing_file)
    except (json.JSONDecodeError, OSError, ValueError) as exc:
        warn(f"unable to load {timing_file}: {exc}")
        return None, None

    duration: float | None
    tokens: int | None
    try:
        duration = optional_number(
            timing.get("total_duration_seconds"),
            field=f"{timing_file}: total_duration_seconds",
            minimum=0,
        )
        tokens = optional_int(
            timing.get("total_tokens"),
            field=f"{timing_file}: total_tokens",
            minimum=0,
        )
    except ValueError as exc:
        warn(str(exc))
        return None, None
    return duration, tokens


def extract_timing(grading: JsonObject, run_dir: Path) -> tuple[float | None, int | None]:
    """Resolve duration and tokens independently without replacing absence with zero."""
    duration: float | None = None
    raw_timing = grading.get("timing")
    if raw_timing is not None:
        timing = as_object(raw_timing)
        if timing is None:
            warn(f"timing in {run_dir / 'grading.json'} is not an object; ignoring it")
        else:
            try:
                duration = optional_number(
                    timing.get("total_duration_seconds"),
                    field=f"{run_dir / 'grading.json'}: timing.total_duration_seconds",
                    minimum=0,
                )
            except ValueError as exc:
                warn(str(exc))

    fallback_duration, tokens = load_timing_file(run_dir)
    if duration is None:
        duration = fallback_duration
    return duration, tokens


def validate_summary(
    grading_file: Path,
    summary: JsonObject,
    expectations: Sequence[JsonValue],
    expectations_present: bool,
) -> tuple[float, int, int, int]:
    """Validate grading arithmetic and return the canonical summary values."""
    passed = require_int(summary.get("passed"), field=f"{grading_file}: summary.passed")
    failed = require_int(summary.get("failed"), field=f"{grading_file}: summary.failed")
    total = require_int(summary.get("total"), field=f"{grading_file}: summary.total", minimum=1)
    pass_rate = require_number(
        summary.get("pass_rate"),
        field=f"{grading_file}: summary.pass_rate",
        minimum=0,
        maximum=1,
    )

    if passed + failed != total:
        raise ValueError(
            f"{grading_file}: summary.passed + summary.failed must equal summary.total"
        )
    if expectations_present and total != len(expectations):
        raise ValueError(
            f"{grading_file}: summary.total ({total}) does not match "
            f"expectations length ({len(expectations)})"
        )
    expected_rate = passed / total
    if not math.isclose(pass_rate, expected_rate, rel_tol=0.0, abs_tol=PASS_RATE_TOLERANCE):
        raise ValueError(
            f"{grading_file}: summary.pass_rate ({pass_rate}) does not match "
            f"passed/total ({expected_rate})"
        )
    return pass_rate, passed, failed, total


def extract_optional_metrics(
    grading: JsonObject,
    grading_file: Path,
) -> tuple[int | None, int | None]:
    raw_metrics = grading.get("execution_metrics")
    if raw_metrics is None:
        return None, None
    metrics = as_object(raw_metrics)
    if metrics is None:
        warn(f"execution_metrics in {grading_file} is not an object; ignoring it")
        return None, None

    tool_calls: int | None = None
    errors: int | None = None
    try:
        tool_calls = optional_int(
            metrics.get("total_tool_calls"),
            field=f"{grading_file}: execution_metrics.total_tool_calls",
        )
    except ValueError as exc:
        warn(str(exc))
    try:
        errors = optional_int(
            metrics.get("errors_encountered"),
            field=f"{grading_file}: execution_metrics.errors_encountered",
        )
    except ValueError as exc:
        warn(str(exc))
    return tool_calls, errors


def build_run_result(
    grading: JsonObject,
    grading_file: Path,
    run_dir: Path,
    eval_id: EvalId,
    eval_name: str,
    run_number: int,
) -> RunResult:
    """Build one validated run result without synthetic metric defaults."""
    expectations, expectations_present = validate_expectations(
        grading_file,
        grading.get("expectations"),
    )
    raw_summary = grading.get("summary")
    summary = as_object(raw_summary)
    if summary is None:
        raise ValueError(f"summary in {grading_file} must be an object")
    pass_rate, passed, failed, total = validate_summary(
        grading_file,
        summary,
        expectations,
        expectations_present,
    )

    result: RunResult = {
        "eval_id": eval_id,
        "eval_name": eval_name,
        "run_number": run_number,
        "pass_rate": pass_rate,
        "passed": passed,
        "failed": failed,
        "total": total,
        "expectations": expectations,
        "notes": extract_notes(grading, grading_file),
    }

    duration, tokens = extract_timing(grading, run_dir)
    if duration is not None:
        result["time_seconds"] = duration
    if tokens is not None:
        result["tokens"] = tokens

    tool_calls, errors = extract_optional_metrics(grading, grading_file)
    if tool_calls is not None:
        result["tool_calls"] = tool_calls
    if errors is not None:
        result["errors"] = errors
    return result


def load_run_result(run_dir: Path, eval_id: EvalId, eval_name: str) -> RunResult | None:
    """Load one valid graded run; warn and skip malformed/ungraded attempts."""
    run_number = parse_run_number(run_dir)
    if run_number is None:
        return None

    grading_file = run_dir / "grading.json"
    if not grading_file.is_file():
        warn(f"grading.json not found in {run_dir}")
        return None

    try:
        grading = load_json_object(grading_file)
        return build_run_result(
            grading,
            grading_file,
            run_dir,
            eval_id,
            eval_name,
            run_number,
        )
    except (json.JSONDecodeError, OSError, ValueError) as exc:
        warn(f"skipping invalid grading evidence in {grading_file}: {exc}")
        return None


def load_config_results(config_dir: Path, eval_id: EvalId, eval_name: str) -> list[RunResult]:
    runs: list[RunResult] = []
    for run_dir in sorted(config_dir.glob("run-*"), key=run_sort_key):
        if not run_dir.is_dir():
            continue
        result = load_run_result(run_dir, eval_id, eval_name)
        if result is not None:
            runs.append(result)
    return runs


def discover_workspace(benchmark_dir: Path) -> WorkspaceEvidence:
    """Discover expected eval/config cells and load valid graded run evidence."""
    search_dir = find_search_dir(benchmark_dir)
    if search_dir is None:
        raise ValueError(
            f"no eval directories found in {benchmark_dir} or {benchmark_dir / 'runs'}"
        )

    results: dict[str, list[RunResult]] = {}
    eval_ids: list[EvalId] = []
    config_names: set[str] = set()
    valid_cells: set[tuple[str, EvalId]] = set()

    eval_dirs = sorted(
        (path for path in search_dir.glob("eval-*") if path.is_dir()),
        key=eval_sort_key,
    )
    if not eval_dirs:
        raise ValueError(f"no eval directories found in {search_dir}")

    seen_eval_ids: dict[EvalId, Path] = {}
    for eval_idx, eval_dir in enumerate(eval_dirs, start=1):
        eval_id, eval_name = load_eval_metadata(eval_dir, eval_idx)
        if eval_id in seen_eval_ids:
            raise ValueError(
                f"duplicate eval_id {eval_id!r} in {seen_eval_ids[eval_id]} and {eval_dir}"
            )
        seen_eval_ids[eval_id] = eval_dir
        eval_ids.append(eval_id)

        config_dirs = sorted(
            (path for path in eval_dir.iterdir() if path.is_dir()),
            key=config_sort_key,
        )
        for config_dir in config_dirs:
            if not any(path.is_dir() for path in config_dir.glob("run-*")):
                continue
            config = config_dir.name
            if config in RESERVED_CONFIG_NAMES:
                raise ValueError(f"configuration name is reserved: {config!r}")
            if config not in SUPPORTED_CONFIG_NAMES:
                raise ValueError(
                    f"unsupported configuration {config!r}; expected one of "
                    f"{sorted(SUPPORTED_CONFIG_NAMES)}"
                )
            config_names.add(config)
            runs = load_config_results(config_dir, eval_id, eval_name)
            results.setdefault(config, []).extend(runs)
            if runs:
                valid_cells.add((config, eval_id))

    if not results or not any(results.values()):
        raise ValueError("no valid graded runs found")

    ordered_configs = tuple(sorted(config_names, key=config_name_sort_key))
    validate_configuration_set(ordered_configs)

    missing_cells = tuple(
        (config, eval_id)
        for config in ordered_configs
        for eval_id in eval_ids
        if (config, eval_id) not in valid_cells
    )
    return WorkspaceEvidence(
        results=results,
        eval_ids=tuple(sorted(eval_ids, key=eval_id_sort_key)),
        config_names=ordered_configs,
        missing_cells=missing_cells,
    )


def load_run_results(benchmark_dir: Path) -> dict[str, list[RunResult]]:
    """Compatibility helper returning discovered runs without requiring a full benchmark."""
    search_dir = find_search_dir(benchmark_dir)
    if search_dir is None:
        warn(f"no eval directories found in {benchmark_dir} or {benchmark_dir / 'runs'}")
        return {}

    results: dict[str, list[RunResult]] = {}
    eval_dirs = sorted(
        (path for path in search_dir.glob("eval-*") if path.is_dir()),
        key=eval_sort_key,
    )
    for eval_idx, eval_dir in enumerate(eval_dirs, start=1):
        eval_id, eval_name = load_eval_metadata(eval_dir, eval_idx)
        config_dirs = sorted(
            (path for path in eval_dir.iterdir() if path.is_dir()),
            key=config_sort_key,
        )
        for config_dir in config_dirs:
            if not any(path.is_dir() for path in config_dir.glob("run-*")):
                continue
            results.setdefault(config_dir.name, []).extend(
                load_config_results(config_dir, eval_id, eval_name)
            )
    return results


def validate_configuration_set(config_names: Collection[str]) -> None:
    """Allow a single partial config or exactly one supported comparison pair."""
    names = set(config_names)
    if not names:
        raise ValueError("no configurations with run evidence found")
    if len(names) == 1:
        return
    if len(names) != 2 or tuple(sorted(names)) not in {
        tuple(sorted(pair)) for pair in SUPPORTED_COMPARISON_PAIRS
    }:
        raise ValueError(
            "configuration set must be a single supported configuration or exactly one "
            f"supported pair; found {sorted(names)}"
        )


def select_comparison_pair(config_names: Collection[str]) -> ComparisonPair | None:
    names = set(config_names)
    matched = [pair for pair in SUPPORTED_COMPARISON_PAIRS if set(pair) == names]
    if len(matched) > 1:
        raise ValueError(f"ambiguous supported comparison pairs: {matched}")
    return matched[0] if matched else None


def summarize_config(runs: Sequence[RunResult]) -> ConfigSummary:
    if not runs:
        raise ValueError("cannot summarize a configuration with no valid runs")

    pass_stats = calculate_stats([run["pass_rate"] for run in runs])
    if pass_stats is None:
        raise ValueError("pass-rate observations unexpectedly missing")

    summary: ConfigSummary = {"pass_rate": pass_stats}

    times = [run["time_seconds"] for run in runs if "time_seconds" in run]
    time_stats = calculate_stats(times)
    if time_stats is not None:
        summary["time_seconds"] = time_stats

    tokens = [float(run["tokens"]) for run in runs if "tokens" in run]
    token_stats = calculate_stats(tokens)
    if token_stats is not None:
        summary["tokens"] = token_stats
    return summary


def aggregate_results(results: dict[str, list[RunResult]]) -> RunSummary:
    """Aggregate valid observations without synthesizing empty configurations."""
    if not results or not any(results.values()):
        raise ValueError("no valid graded runs found")

    validate_configuration_set(results)
    run_summary: RunSummary = {}
    for config in sorted(results, key=config_name_sort_key):
        runs = results[config]
        if not runs:
            continue
        run_summary[config] = summarize_config(runs)

    comparison = select_comparison_pair(run_summary)
    if comparison is None:
        return run_summary

    primary = cast(ConfigSummary, run_summary[comparison[0]])
    baseline = cast(ConfigSummary, run_summary[comparison[1]])

    delta: DeltaSummary = {
        "pass_rate": (
            f"{(primary['pass_rate']['mean'] - baseline['pass_rate']['mean']) * 100:+.1f} pp"
        )
    }
    if "time_seconds" in primary and "time_seconds" in baseline:
        delta["time_seconds"] = (
            f"{primary['time_seconds']['mean'] - baseline['time_seconds']['mean']:+.1f}"
        )
    if "tokens" in primary and "tokens" in baseline:
        delta["tokens"] = f"{primary['tokens']['mean'] - baseline['tokens']['mean']:+.0f}"

    run_summary["delta"] = delta
    return run_summary


def calculate_runs_per_configuration(
    results: Mapping[str, Sequence[RunResult]],
    eval_ids: Sequence[EvalId],
    config_names: Sequence[str] | None = None,
) -> int | None:
    """Return a positive uniform count only for a complete config × eval matrix."""
    configs = tuple(config_names) if config_names is not None else tuple(results)
    if not configs or not eval_ids:
        return None

    counts: list[int] = []
    for config in configs:
        by_eval: dict[EvalId, int] = {eval_id: 0 for eval_id in eval_ids}
        for run in results.get(config, ()):
            if run["eval_id"] in by_eval:
                by_eval[run["eval_id"]] += 1
        counts.extend(by_eval.values())

    if not counts or 0 in counts or len(set(counts)) != 1:
        return None
    return counts[0]


def build_coverage_notes(evidence: WorkspaceEvidence) -> list[str]:
    notes: list[str] = []
    for config, eval_id in evidence.missing_cells:
        notes.append(f"Missing valid graded run evidence for {config} / eval {eval_id}.")
    return notes


def benchmark_run_sort_key(run: BenchmarkRun) -> tuple[tuple[int, str], tuple[int, str], int]:
    return (
        eval_id_sort_key(run["eval_id"]),
        config_name_sort_key(run["configuration"]),
        run["run_number"],
    )


def generate_benchmark(
    benchmark_dir: Path,
    skill_name: str = "",
    skill_path: str = "",
) -> Benchmark:
    """Generate benchmark data from validated run evidence."""
    evidence = discover_workspace(benchmark_dir)
    run_summary = aggregate_results(evidence.results)

    runs: list[BenchmarkRun] = []
    for config in evidence.config_names:
        for result in evidence.results.get(config, []):
            metrics: RunMetrics = {
                "pass_rate": result["pass_rate"],
                "passed": result["passed"],
                "failed": result["failed"],
                "total": result["total"],
            }
            if "time_seconds" in result:
                metrics["time_seconds"] = result["time_seconds"]
            if "tokens" in result:
                metrics["tokens"] = result["tokens"]
            if "tool_calls" in result:
                metrics["tool_calls"] = result["tool_calls"]
            if "errors" in result:
                metrics["errors"] = result["errors"]

            runs.append(
                {
                    "eval_id": result["eval_id"],
                    "eval_name": result["eval_name"],
                    "configuration": config,
                    "run_number": result["run_number"],
                    "result": metrics,
                    "expectations": result["expectations"],
                    "notes": result["notes"],
                }
            )
    runs.sort(key=benchmark_run_sort_key)

    metadata: Metadata = {
        "skill_name": skill_name or "<skill-name>",
        "skill_path": skill_path or "<path/to/skill>",
        "executor_model": "<model-name>",
        "analyzer_model": "<model-name>",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "evals_run": list(evidence.eval_ids),
        "runs_per_configuration": calculate_runs_per_configuration(
            evidence.results,
            evidence.eval_ids,
            evidence.config_names,
        ),
    }
    comparison = select_comparison_pair(evidence.config_names)
    if comparison is not None:
        metadata["comparison_pair"] = {
            "candidate": comparison[0],
            "baseline": comparison[1],
        }

    benchmark: Benchmark = {
        "metadata": metadata,
        "runs": runs,
        "run_summary": run_summary,
        "notes": build_coverage_notes(evidence),
    }
    validate_benchmark_semantics(benchmark)
    return benchmark


def validate_benchmark_semantics(benchmark: Benchmark) -> None:
    """Validate cross-field invariants before serialization."""
    runs = benchmark["runs"]
    if not runs:
        raise ValueError("benchmark must contain at least one valid run")

    seen: set[tuple[str, EvalId, int]] = set()
    for run in runs:
        identity = (run["configuration"], run["eval_id"], run["run_number"])
        if identity in seen:
            raise ValueError(f"duplicate run identity: {identity}")
        seen.add(identity)

        result = run["result"]
        if result["passed"] + result["failed"] != result["total"]:
            raise ValueError(f"invalid run summary arithmetic for {identity}")
        expected_rate = result["passed"] / result["total"]
        if not math.isclose(
            result["pass_rate"],
            expected_rate,
            rel_tol=0.0,
            abs_tol=PASS_RATE_TOLERANCE,
        ):
            raise ValueError(f"invalid pass rate for {identity}")

    configs = {
        key for key in benchmark["run_summary"]
        if key != "delta"
    }
    validate_configuration_set(configs)
    comparison = select_comparison_pair(configs)
    pair = benchmark["metadata"].get("comparison_pair")
    if pair is not None:
        pair_names = {pair["candidate"], pair["baseline"]}
        if not configs.issubset(pair_names):
            raise ValueError("run_summary contains a configuration outside comparison_pair")
        supported_pair = (pair["candidate"], pair["baseline"])
        if supported_pair not in SUPPORTED_COMPARISON_PAIRS:
            raise ValueError("metadata.comparison_pair is not a supported pair")
    if comparison is not None:
        expected_pair = {"candidate": comparison[0], "baseline": comparison[1]}
        if pair != expected_pair:
            raise ValueError("metadata.comparison_pair does not match the complete comparison")


def get_config_summary(run_summary: RunSummary, config: str) -> ConfigSummary:
    value = run_summary.get(config)
    if value is None or config == "delta":
        raise ValueError(f"configuration summary not found: {config!r}")
    return cast(ConfigSummary, value)


def get_delta_summary(run_summary: RunSummary) -> DeltaSummary | None:
    value = run_summary.get("delta")
    return cast(DeltaSummary, value) if value is not None else None


def generate_markdown(benchmark: Benchmark) -> str:
    """Generate a human-readable summary without synthetic comparison columns."""
    metadata = benchmark["metadata"]
    run_summary = benchmark["run_summary"]
    configs = [
        key for key in run_summary
        if key != "delta"
    ]
    configs.sort(key=config_name_sort_key)
    if not configs:
        raise ValueError("benchmark has no configuration summaries")

    run_count = metadata["runs_per_configuration"]
    run_description = (
        f"{run_count} runs each per configuration"
        if run_count is not None
        else "variable or incomplete runs per configuration"
    )

    lines = [
        f"# Skill Benchmark: {metadata['skill_name']}",
        "",
        f"**Model**: {metadata['executor_model']}",
        f"**Date**: {metadata['timestamp']}",
        f"**Evals**: {', '.join(map(str, metadata['evals_run']))} ({run_description})",
        "",
        "## Summary",
        "",
    ]

    delta = get_delta_summary(run_summary)
    if len(configs) == 1:
        config = configs[0]
        label = config.replace("_", " ").title()
        summary = get_config_summary(run_summary, config)
        lines.extend(
            [
                f"| Metric | {label} |",
                "|--------|------------|",
                (
                    f"| Pass Rate | "
                    f"{summary['pass_rate']['mean'] * 100:.0f}% ± "
                    f"{summary['pass_rate']['stddev'] * 100:.0f}% |"
                ),
            ]
        )
        if "time_seconds" in summary:
            stats = summary["time_seconds"]
            lines.append(f"| Time | {stats['mean']:.1f}s ± {stats['stddev']:.1f}s |")
        if "tokens" in summary:
            stats = summary["tokens"]
            lines.append(f"| Tokens | {stats['mean']:.0f} ± {stats['stddev']:.0f} |")
    else:
        config_a, config_b = configs
        a = get_config_summary(run_summary, config_a)
        b = get_config_summary(run_summary, config_b)
        label_a = config_a.replace("_", " ").title()
        label_b = config_b.replace("_", " ").title()
        lines.extend(
            [
                f"| Metric | {label_a} | {label_b} | Delta |",
                "|--------|------------|------------|-------|",
                (
                    f"| Pass Rate | {a['pass_rate']['mean'] * 100:.0f}% ± "
                    f"{a['pass_rate']['stddev'] * 100:.0f}% | "
                    f"{b['pass_rate']['mean'] * 100:.0f}% ± "
                    f"{b['pass_rate']['stddev'] * 100:.0f}% | "
                    f"{(delta or {}).get('pass_rate', '—')} |"
                ),
            ]
        )
        if "time_seconds" in a or "time_seconds" in b:
            a_time = (
                f"{a['time_seconds']['mean']:.1f}s ± {a['time_seconds']['stddev']:.1f}s"
                if "time_seconds" in a else "—"
            )
            b_time = (
                f"{b['time_seconds']['mean']:.1f}s ± {b['time_seconds']['stddev']:.1f}s"
                if "time_seconds" in b else "—"
            )
            delta_time = (delta or {}).get("time_seconds")
            lines.append(
                f"| Time | {a_time} | {b_time} | "
                f"{delta_time + 's' if delta_time is not None else '—'} |"
            )
        if "tokens" in a or "tokens" in b:
            a_tokens = (
                f"{a['tokens']['mean']:.0f} ± {a['tokens']['stddev']:.0f}"
                if "tokens" in a else "—"
            )
            b_tokens = (
                f"{b['tokens']['mean']:.0f} ± {b['tokens']['stddev']:.0f}"
                if "tokens" in b else "—"
            )
            lines.append(
                f"| Tokens | {a_tokens} | {b_tokens} | "
                f"{(delta or {}).get('tokens', '—')} |"
            )

    if benchmark["notes"]:
        lines.extend(["", "## Notes", ""])
        lines.extend(f"- {note}" for note in benchmark["notes"])
    return "\n".join(lines)


def parse_cli_args(argv: Sequence[str] | None = None) -> CliArgs:
    parser = argparse.ArgumentParser(
        description="Aggregate benchmark run results into summary statistics"
    )
    parser.add_argument("benchmark_dir", type=Path, help="Path to the benchmark directory")
    parser.add_argument("--skill-name", default="", help="Name of the skill being benchmarked")
    parser.add_argument("--skill-path", default="", help="Path of the skill being benchmarked")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Output path for benchmark.json (default: <benchmark_dir>/benchmark.json)",
    )
    namespace = parser.parse_args(argv)
    return CliArgs(
        benchmark_dir=cast(Path, namespace.benchmark_dir),
        skill_name=cast(str, namespace.skill_name),
        skill_path=cast(str, namespace.skill_path),
        output=cast(Path | None, namespace.output),
    )


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_cli_args(argv)
    if not args.benchmark_dir.is_dir():
        print(f"Directory not found: {args.benchmark_dir}", file=sys.stderr)
        return 2

    try:
        benchmark = generate_benchmark(
            args.benchmark_dir,
            args.skill_name,
            args.skill_path,
        )
        markdown = generate_markdown(benchmark)
    except ValueError as exc:
        print(f"Unable to aggregate benchmark: {exc}", file=sys.stderr)
        return 2

    output_json = args.output or (args.benchmark_dir / "benchmark.json")
    output_md = output_json.with_suffix(".md")

    try:
        output_json.parent.mkdir(parents=True, exist_ok=True)
        with output_json.open("w", encoding="utf-8", newline="\n") as stream:
            json.dump(benchmark, stream, indent=2, allow_nan=False)
            stream.write("\n")
        output_md.write_text(f"{markdown}\n", encoding="utf-8", newline="\n")
    except (OSError, ValueError) as exc:
        print(f"Unable to write benchmark output: {exc}", file=sys.stderr)
        return 1

    print(f"Generated: {output_json}")
    print(f"Generated: {output_md}")
    print("\nSummary:")
    for config in (
        key for key in benchmark["run_summary"] if key != "delta"
    ):
        summary = get_config_summary(benchmark["run_summary"], config)
        print(
            f"  {config.replace('_', ' ').title()}: "
            f"{summary['pass_rate']['mean'] * 100:.1f}% pass rate"
        )
    delta = get_delta_summary(benchmark["run_summary"])
    if delta is not None:
        print(f"  Delta: {delta.get('pass_rate', '—')}")
    else:
        print("  Delta: unavailable (no complete comparison pair)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
