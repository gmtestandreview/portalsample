#!/usr/bin/env python3
"""Aggregate individual benchmark run results into JSON and Markdown summaries.

The script supports both workspace and legacy benchmark layouts and preserves the
existing flattened ``run_summary`` JSON schema for compatibility. The synthetic
``delta`` entry is reserved and may not be used as a configuration directory name.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections.abc import Collection, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from statistics import fmean, stdev
from typing import Literal, TypeAlias, TypeGuard, TypedDict, cast

JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]
JsonObject: TypeAlias = dict[str, JsonValue]
EvalId: TypeAlias = int | str
RequiredMetric: TypeAlias = Literal["pass_rate", "time_seconds"]
ComparisonPair: TypeAlias = tuple[str, str]

SUPPORTED_COMPARISON_PAIRS: tuple[ComparisonPair, ...] = (
    ("with_skill", "without_skill"),
    ("new_skill", "old_skill"),
)
RESERVED_CONFIG_NAMES: frozenset[str] = frozenset({"delta"})
REQUIRED_EXPECTATION_FIELDS: frozenset[str] = frozenset({"text", "passed", "evidence"})


class Stats(TypedDict):
    mean: float
    stddev: float
    min: float
    max: float


class ConfigSummary(TypedDict):
    pass_rate: Stats
    time_seconds: Stats
    tokens: Stats | None


class DeltaSummary(TypedDict):
    pass_rate: str
    time_seconds: str
    tokens: str | None


RunSummaryValue: TypeAlias = ConfigSummary | DeltaSummary
RunSummary: TypeAlias = dict[str, RunSummaryValue]


class RunResult(TypedDict):
    eval_id: EvalId
    eval_name: str
    run_number: int
    pass_rate: float
    passed: int
    failed: int
    total: int
    time_seconds: float
    tokens: int | float | None
    tool_calls: int
    errors: int
    expectations: list[JsonValue]
    notes: list[JsonValue]


class RunMetrics(TypedDict):
    pass_rate: float
    passed: int
    failed: int
    total: int
    time_seconds: float
    tokens: int | float | None
    tool_calls: int
    errors: int


class BenchmarkRun(TypedDict):
    eval_id: EvalId
    eval_name: str
    configuration: str
    run_number: int
    result: RunMetrics
    expectations: list[JsonValue]
    notes: list[JsonValue]


class Metadata(TypedDict):
    skill_name: str
    skill_path: str
    executor_model: str
    analyzer_model: str
    timestamp: str
    evals_run: list[EvalId]
    runs_per_configuration: int | None


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


def warn(message: str) -> None:
    """Write a diagnostic warning to stderr without mixing it with normal CLI output."""
    print(f"Warning: {message}", file=sys.stderr)


def calculate_stats(values: Sequence[float]) -> Stats:
    """Calculate sample statistics for a sequence of finite values."""
    if not values:
        return {"mean": 0.0, "stddev": 0.0, "min": 0.0, "max": 0.0}

    mean: float = fmean(values)
    stddev: float = stdev(values) if len(values) > 1 else 0.0
    return {
        "mean": round(mean, 4),
        "stddev": round(stddev, 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
    }


def is_number(value: object) -> TypeGuard[int | float]:
    """Return whether *value* is a finite JSON-style number, excluding booleans."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return isinstance(value, int) or math.isfinite(value)


def as_object(value: object) -> JsonObject:
    """Return a JSON object or an empty object for a non-object value."""
    return cast(JsonObject, value) if isinstance(value, dict) else {}


def as_float(value: object, default: float = 0.0) -> float:
    """Return a finite numeric value as float, otherwise *default*."""
    return float(value) if is_number(value) else default


def as_int(value: object, default: int = 0) -> int:
    """Return an integral numeric value as int without silently truncating fractions."""
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float) and math.isfinite(value) and value.is_integer():
        return int(value)
    return default


def has_eval_dirs(path: Path) -> bool:
    """Return whether *path* contains at least one eval-* directory."""
    return any(candidate.is_dir() for candidate in path.glob("eval-*"))


def find_search_dir(benchmark_dir: Path) -> Path | None:
    """Return the directory containing eval-* folders, if present."""
    runs_dir: Path = benchmark_dir / "runs"
    if runs_dir.is_dir() and has_eval_dirs(runs_dir):
        return runs_dir
    if has_eval_dirs(benchmark_dir):
        return benchmark_dir
    return None


def load_json_object(path: Path) -> JsonObject | None:
    """Load a JSON object from *path*, returning None when the root is not an object."""
    with path.open(encoding="utf-8") as stream:
        data: object = json.load(stream)
    return cast(JsonObject, data) if isinstance(data, dict) else None


def parse_prefixed_index(name: str, prefix: str) -> int | None:
    """Parse an exact ``<prefix>-<non-negative integer>`` name."""
    expected_prefix: str = f"{prefix}-"
    if not name.startswith(expected_prefix):
        return None
    suffix: str = name[len(expected_prefix) :]
    return int(suffix) if suffix.isdecimal() else None


def load_eval_metadata(eval_dir: Path, eval_idx: int) -> tuple[EvalId, str]:
    """Load validated eval metadata, falling back to the directory/index when invalid."""
    metadata_path: Path = eval_dir / "eval_metadata.json"
    fallback_name: str = eval_dir.name

    if metadata_path.is_file():
        try:
            metadata: JsonObject = load_json_object(metadata_path) or {}
        except (json.JSONDecodeError, OSError) as exc:
            warn(f"unable to load {metadata_path}: {exc}")
            return eval_idx, fallback_name

        raw_eval_id: JsonValue | None = metadata.get("eval_id")
        eval_id: EvalId = (
            raw_eval_id
            if isinstance(raw_eval_id, (int, str)) and not isinstance(raw_eval_id, bool)
            else eval_idx
        )
        raw_eval_name: JsonValue | None = metadata.get("eval_name")
        eval_name: str = raw_eval_name if isinstance(raw_eval_name, str) else fallback_name
        return eval_id, eval_name

    parsed_id: int | None = parse_prefixed_index(eval_dir.name, "eval")
    return (parsed_id if parsed_id is not None else eval_idx), fallback_name


def parse_run_number(run_dir: Path) -> int | None:
    """Parse an exact run directory name, warning when malformed."""
    run_number: int | None = parse_prefixed_index(run_dir.name, "run")
    if run_number is None:
        warn(f"skipping malformed run directory: {run_dir}")
    return run_number


def numeric_path_sort_key(path: Path, prefix: str) -> tuple[int, int, str]:
    """Sort exact numeric names naturally, followed by malformed names lexically."""
    index: int | None = parse_prefixed_index(path.name, prefix)
    return (0, index, path.name) if index is not None else (1, sys.maxsize, path.name)


def run_sort_key(run_dir: Path) -> tuple[int, int, str]:
    return numeric_path_sort_key(run_dir, "run")


def eval_sort_key(eval_dir: Path) -> tuple[int, int, str]:
    return numeric_path_sort_key(eval_dir, "eval")


def config_sort_key(config_dir: Path) -> tuple[int, str]:
    """Order known candidates before baselines while keeping other names deterministic."""
    config_priority: dict[str, int] = {
        "with_skill": 0,
        "new_skill": 0,
        "old_skill": 1,
        "without_skill": 1,
    }
    return config_priority.get(config_dir.name, 2), config_dir.name


def load_timing_fallback(run_dir: Path) -> tuple[float, int | float | None]:
    """Load duration/token data from timing.json when available."""
    timing_file: Path = run_dir / "timing.json"
    if not timing_file.is_file():
        return 0.0, None

    try:
        timing_data: JsonObject = load_json_object(timing_file) or {}
    except (json.JSONDecodeError, OSError) as exc:
        warn(f"unable to load {timing_file}: {exc}")
        return 0.0, None

    raw_tokens: JsonValue | None = timing_data.get("total_tokens")
    tokens: int | float | None = raw_tokens if is_number(raw_tokens) else None
    return as_float(timing_data.get("total_duration_seconds")), tokens


def extract_timing(grading: JsonObject, run_dir: Path) -> tuple[float, int | float | None]:
    """Resolve duration and tokens independently, using timing.json for missing fields."""
    timing: JsonObject = as_object(grading.get("timing"))
    raw_duration: JsonValue | None = timing.get("total_duration_seconds")
    raw_tokens: JsonValue | None = timing.get("total_tokens")

    duration: float | None = float(raw_duration) if is_number(raw_duration) else None
    tokens: int | float | None = raw_tokens if is_number(raw_tokens) else None

    if duration is not None and tokens is not None:
        return duration, tokens

    fallback_duration: float
    fallback_tokens: int | float | None
    fallback_duration, fallback_tokens = load_timing_fallback(run_dir)
    return (
        duration if duration is not None else fallback_duration,
        tokens if tokens is not None else fallback_tokens,
    )


def validate_expectations(grading_file: Path, expectations: Sequence[JsonValue]) -> None:
    """Warn when an expectation does not contain the required fields/types."""
    for expectation in expectations:
        if not isinstance(expectation, dict):
            warn(
                f"expectation in {grading_file} must be an object with fields "
                f"{sorted(REQUIRED_EXPECTATION_FIELDS)}: {expectation!r}"
            )
            continue

        expectation_object: JsonObject = cast(JsonObject, expectation)
        missing: frozenset[str] = REQUIRED_EXPECTATION_FIELDS.difference(expectation_object)
        if missing:
            warn(
                f"expectation in {grading_file} missing required fields "
                f"{sorted(missing)}: {expectation!r}"
            )
            continue

        if not isinstance(expectation_object["text"], str):
            warn(f"expectation in {grading_file} has non-string text: {expectation!r}")
        if not isinstance(expectation_object["passed"], bool):
            warn(f"expectation in {grading_file} has non-boolean passed value: {expectation!r}")


def extract_notes(grading: JsonObject) -> list[JsonValue]:
    """Flatten supported user-note collections from grading data."""
    notes_summary: JsonObject = as_object(grading.get("user_notes_summary"))
    notes: list[JsonValue] = []
    for key in ("uncertainties", "needs_review", "workarounds"):
        values: JsonValue | None = notes_summary.get(key)
        if isinstance(values, list):
            notes.extend(cast(list[JsonValue], values))
    return notes


def build_run_result(
    grading: JsonObject,
    grading_file: Path,
    run_dir: Path,
    eval_id: EvalId,
    eval_name: str,
    run_number: int,
) -> RunResult:
    """Build a strongly typed run result from validated JSON boundaries."""
    summary: JsonObject = as_object(grading.get("summary"))
    metrics: JsonObject = as_object(grading.get("execution_metrics"))
    raw_expectations: JsonValue = grading.get("expectations", [])
    expectations: list[JsonValue] = (
        cast(list[JsonValue], raw_expectations) if isinstance(raw_expectations, list) else []
    )
    validate_expectations(grading_file, expectations)

    time_seconds: float
    tokens: int | float | None
    time_seconds, tokens = extract_timing(grading, run_dir)

    return {
        "eval_id": eval_id,
        "eval_name": eval_name,
        "run_number": run_number,
        "pass_rate": as_float(summary.get("pass_rate")),
        "passed": as_int(summary.get("passed")),
        "failed": as_int(summary.get("failed")),
        "total": as_int(summary.get("total")),
        "time_seconds": time_seconds,
        "tokens": tokens,
        "tool_calls": as_int(metrics.get("total_tool_calls")),
        "errors": as_int(metrics.get("errors_encountered")),
        "expectations": expectations,
        "notes": extract_notes(grading),
    }


def load_run_result(
    run_dir: Path,
    eval_id: EvalId,
    eval_name: str,
) -> RunResult | None:
    """Load one run result, returning None for malformed or unavailable run data."""
    run_number: int | None = parse_run_number(run_dir)
    if run_number is None:
        return None

    grading_file: Path = run_dir / "grading.json"
    if not grading_file.is_file():
        warn(f"grading.json not found in {run_dir}")
        return None

    try:
        grading: JsonObject | None = load_json_object(grading_file)
    except (json.JSONDecodeError, OSError) as exc:
        warn(f"unable to load {grading_file}: {exc}")
        return None

    if grading is None:
        warn(f"expected JSON object in {grading_file}")
        return None

    return build_run_result(grading, grading_file, run_dir, eval_id, eval_name, run_number)


def load_config_results(config_dir: Path, eval_id: EvalId, eval_name: str) -> list[RunResult]:
    """Load run results for one configuration in natural run-number order."""
    runs: list[RunResult] = []
    run_dirs: list[Path] = sorted(config_dir.glob("run-*"), key=run_sort_key)
    for run_dir in run_dirs:
        result: RunResult | None = load_run_result(run_dir, eval_id, eval_name)
        if result is not None:
            runs.append(result)
    return runs


def load_eval_results(eval_dir: Path, eval_idx: int) -> dict[str, list[RunResult]]:
    """Load every configuration for one eval directory."""
    eval_id: EvalId
    eval_name: str
    eval_id, eval_name = load_eval_metadata(eval_dir, eval_idx)

    eval_results: dict[str, list[RunResult]] = {}
    config_dirs: list[Path] = [path for path in eval_dir.iterdir() if path.is_dir()]
    config_dirs.sort(key=config_sort_key)

    for config_dir in config_dirs:
        if not any(config_dir.glob("run-*")):
            continue
        eval_results[config_dir.name] = load_config_results(config_dir, eval_id, eval_name)
    return eval_results


def load_run_results(benchmark_dir: Path) -> dict[str, list[RunResult]]:
    """Load all run results, grouped by configuration name."""
    search_dir: Path | None = find_search_dir(benchmark_dir)
    if search_dir is None:
        warn(f"no eval directories found in {benchmark_dir} or {benchmark_dir / 'runs'}")
        return {}

    results: dict[str, list[RunResult]] = {}
    eval_dirs: list[Path] = sorted(search_dir.glob("eval-*"), key=eval_sort_key)
    for eval_idx, eval_dir in enumerate(eval_dirs):
        for config, runs in load_eval_results(eval_dir, eval_idx).items():
            results.setdefault(config, []).extend(runs)
    return results


def empty_config_summary() -> ConfigSummary:
    """Return an empty configuration summary."""
    return {
        "pass_rate": calculate_stats(()),
        "time_seconds": calculate_stats(()),
        "tokens": None,
    }


def empty_delta_summary() -> DeltaSummary:
    """Return an explicitly unavailable delta without fabricating a baseline."""
    return {"pass_rate": "—", "time_seconds": "—", "tokens": None}


def is_config_summary(value: RunSummaryValue) -> TypeGuard[ConfigSummary]:
    return isinstance(value["pass_rate"], dict)


def is_delta_summary(value: RunSummaryValue) -> TypeGuard[DeltaSummary]:
    return isinstance(value["pass_rate"], str)


def get_config_summary(run_summary: RunSummary, config: str) -> ConfigSummary:
    """Return a typed config summary, using an empty summary for a missing config."""
    value: RunSummaryValue | None = run_summary.get(config)
    if value is None:
        return empty_config_summary()
    if is_config_summary(value):
        return value
    raise ValueError(f"{config!r} does not contain a configuration summary")


def get_delta_summary(run_summary: RunSummary) -> DeltaSummary:
    """Return the typed synthetic delta entry, or an unavailable delta when absent."""
    value: RunSummaryValue | None = run_summary.get("delta")
    if value is None:
        return empty_delta_summary()
    if is_delta_summary(value):
        return value
    raise ValueError("'delta' does not contain a delta summary")


def mean_delta(primary: ConfigSummary, baseline: ConfigSummary, metric: RequiredMetric) -> float:
    """Return the difference between configuration means for a required metric."""
    return primary[metric]["mean"] - baseline[metric]["mean"]


def select_comparison_pair(config_names: Collection[str]) -> ComparisonPair | None:
    """Select one supported candidate/baseline pair or reject ambiguous input."""
    matched: list[ComparisonPair] = [
        pair
        for pair in SUPPORTED_COMPARISON_PAIRS
        if pair[0] in config_names and pair[1] in config_names
    ]
    if len(matched) > 1:
        raise ValueError(f"ambiguous supported comparison pairs: {matched}")
    return matched[0] if matched else None


def aggregate_results(results: dict[str, list[RunResult]]) -> RunSummary:
    """Aggregate run results while preserving the existing flattened output schema."""
    reserved: frozenset[str] = RESERVED_CONFIG_NAMES.intersection(results)
    if reserved:
        raise ValueError(f"configuration name is reserved: {sorted(reserved)}")

    config_summaries: dict[str, ConfigSummary] = {}
    for config, runs in results.items():
        if not runs:
            config_summaries[config] = empty_config_summary()
            continue

        pass_rates: list[float] = [run["pass_rate"] for run in runs]
        times: list[float] = [run["time_seconds"] for run in runs]
        token_values: list[float] = [
            float(run["tokens"]) for run in runs if is_number(run["tokens"])
        ]
        config_summaries[config] = {
            "pass_rate": calculate_stats(pass_rates),
            "time_seconds": calculate_stats(times),
            "tokens": calculate_stats(token_values) if token_values else None,
        }

    delta: DeltaSummary = empty_delta_summary()
    comparison: ComparisonPair | None = select_comparison_pair(config_summaries)
    if comparison is not None:
        primary: ConfigSummary = config_summaries[comparison[0]]
        baseline: ConfigSummary = config_summaries[comparison[1]]
        delta_pass_rate_pp: float = mean_delta(primary, baseline, "pass_rate") * 100
        delta_time: float = mean_delta(primary, baseline, "time_seconds")

        primary_tokens: Stats | None = primary["tokens"]
        baseline_tokens: Stats | None = baseline["tokens"]
        delta_tokens: float | None = None
        if primary_tokens is not None and baseline_tokens is not None:
            delta_tokens = primary_tokens["mean"] - baseline_tokens["mean"]

        delta = {
            "pass_rate": f"{delta_pass_rate_pp:+.1f} pp",
            "time_seconds": f"{delta_time:+.1f}",
            "tokens": f"{delta_tokens:+.0f}" if delta_tokens is not None else None,
        }

    run_summary: RunSummary = {}
    for config, summary in config_summaries.items():
        run_summary[config] = summary
    run_summary["delta"] = delta
    return run_summary


def eval_id_sort_key(eval_id: EvalId) -> tuple[int, str]:
    """Sort integer IDs numerically before string IDs without cross-type comparisons."""
    if isinstance(eval_id, int):
        return 0, f"{eval_id:+021d}"
    return 1, eval_id


def calculate_runs_per_configuration(
    results: dict[str, list[RunResult]],
    eval_ids: Sequence[EvalId],
) -> int | None:
    """Return the uniform run count across the complete configuration × eval matrix."""
    if not results or not eval_ids:
        return None

    counts: list[int] = []
    for config_runs in results.values():
        counts_by_eval: dict[EvalId, int] = dict.fromkeys(eval_ids, 0)
        for run in config_runs:
            counts_by_eval[run["eval_id"]] = counts_by_eval.get(run["eval_id"], 0) + 1
        counts.extend(counts_by_eval.values())

    return counts[0] if counts and len(set(counts)) == 1 else None


def generate_benchmark(
    benchmark_dir: Path,
    skill_name: str = "",
    skill_path: str = "",
) -> Benchmark:
    """Generate complete benchmark data from run results."""
    results: dict[str, list[RunResult]] = load_run_results(benchmark_dir)
    run_summary: RunSummary = aggregate_results(results)

    runs: list[BenchmarkRun] = []
    for config, config_runs in results.items():
        for result in config_runs:
            metrics: RunMetrics = {
                "pass_rate": result["pass_rate"],
                "passed": result["passed"],
                "failed": result["failed"],
                "total": result["total"],
                "time_seconds": result["time_seconds"],
                "tokens": result["tokens"],
                "tool_calls": result["tool_calls"],
                "errors": result["errors"],
            }
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

    unique_eval_ids: set[EvalId] = {
        run["eval_id"] for config_runs in results.values() for run in config_runs
    }
    eval_ids: list[EvalId] = sorted(unique_eval_ids, key=eval_id_sort_key)
    runs_per_configuration: int | None = calculate_runs_per_configuration(results, eval_ids)

    return {
        "metadata": {
            "skill_name": skill_name or "<skill-name>",
            "skill_path": skill_path or "<path/to/skill>",
            "executor_model": "<model-name>",
            "analyzer_model": "<model-name>",
            "timestamp": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "evals_run": eval_ids,
            "runs_per_configuration": runs_per_configuration,
        },
        "runs": runs,
        "run_summary": run_summary,
        "notes": [],
    }


def select_display_configs(run_summary: RunSummary) -> tuple[str, str | None]:
    """Select the comparison pair for display, falling back to available configs."""
    configs: list[str] = [key for key in run_summary if key != "delta"]
    comparison: ComparisonPair | None = select_comparison_pair(configs)
    if comparison is not None:
        return comparison
    if not configs:
        return "config_a", None
    return configs[0], configs[1] if len(configs) > 1 else None


def generate_markdown(benchmark: Benchmark) -> str:
    """Generate human-readable benchmark Markdown."""
    metadata: Metadata = benchmark["metadata"]
    run_summary: RunSummary = benchmark["run_summary"]

    config_a: str
    config_b: str | None
    config_a, config_b = select_display_configs(run_summary)
    label_a: str = config_a.replace("_", " ").title()
    label_b: str = config_b.replace("_", " ").title() if config_b else "Config B"

    run_count: int | None = metadata["runs_per_configuration"]
    run_description: str = (
        f"{run_count} runs each per configuration"
        if run_count is not None
        else "variable runs per configuration"
    )

    lines: list[str] = [
        f"# Skill Benchmark: {metadata['skill_name']}",
        "",
        f"**Model**: {metadata['executor_model']}",
        f"**Date**: {metadata['timestamp']}",
        f"**Evals**: {', '.join(map(str, metadata['evals_run']))} ({run_description})",
        "",
        "## Summary",
        "",
        f"| Metric | {label_a} | {label_b} | Delta |",
        "|--------|------------|---------------|-------|",
    ]

    a_summary: ConfigSummary = get_config_summary(run_summary, config_a)
    b_summary: ConfigSummary = (
        get_config_summary(run_summary, config_b) if config_b else empty_config_summary()
    )
    delta: DeltaSummary = get_delta_summary(run_summary)

    a_pr: Stats = a_summary["pass_rate"]
    b_pr: Stats = b_summary["pass_rate"]
    lines.append(
        f"| Pass Rate | {a_pr['mean'] * 100:.0f}% ± {a_pr['stddev'] * 100:.0f}% | "
        f"{b_pr['mean'] * 100:.0f}% ± {b_pr['stddev'] * 100:.0f}% | "
        f"{delta['pass_rate']} |"
    )

    a_time: Stats = a_summary["time_seconds"]
    b_time: Stats = b_summary["time_seconds"]
    delta_time: str = (
        f"{delta['time_seconds']}s" if delta["time_seconds"] != "—" else "—"
    )
    lines.append(
        f"| Time | {a_time['mean']:.1f}s ± {a_time['stddev']:.1f}s | "
        f"{b_time['mean']:.1f}s ± {b_time['stddev']:.1f}s | {delta_time} |"
    )

    a_tokens: Stats | None = a_summary["tokens"]
    b_tokens: Stats | None = b_summary["tokens"]
    if a_tokens is not None and b_tokens is not None:
        lines.append(
            f"| Tokens | {a_tokens['mean']:.0f} ± {a_tokens['stddev']:.0f} | "
            f"{b_tokens['mean']:.0f} ± {b_tokens['stddev']:.0f} | "
            f"{delta['tokens'] or '—'} |"
        )

    notes: list[str] = benchmark["notes"]
    if notes:
        lines.extend(["", "## Notes", ""])
        lines.extend(f"- {note}" for note in notes)

    return "\n".join(lines)


def parse_cli_args(argv: Sequence[str] | None = None) -> CliArgs:
    """Parse CLI arguments into a typed immutable value object."""
    parser: argparse.ArgumentParser = argparse.ArgumentParser(
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

    namespace: argparse.Namespace = parser.parse_args(argv)
    return CliArgs(
        benchmark_dir=cast(Path, namespace.benchmark_dir),
        skill_name=cast(str, namespace.skill_name),
        skill_path=cast(str, namespace.skill_path),
        output=cast(Path | None, namespace.output),
    )


def main(argv: Sequence[str] | None = None) -> int:
    """Run the benchmark aggregator CLI and return a process exit code."""
    args: CliArgs = parse_cli_args(argv)
    if not args.benchmark_dir.is_dir():
        print(f"Directory not found: {args.benchmark_dir}", file=sys.stderr)
        return 2

    try:
        benchmark: Benchmark = generate_benchmark(
            args.benchmark_dir,
            args.skill_name,
            args.skill_path,
        )
    except ValueError as exc:
        print(f"Unable to aggregate benchmark: {exc}", file=sys.stderr)
        return 2

    output_json: Path = args.output or (args.benchmark_dir / "benchmark.json")
    output_md: Path = output_json.with_suffix(".md")

    try:
        output_json.parent.mkdir(parents=True, exist_ok=True)
        with output_json.open("w", encoding="utf-8", newline="\n") as stream:
            json.dump(benchmark, stream, indent=2, allow_nan=False)
            stream.write("\n")
        print(f"Generated: {output_json}")

        markdown: str = generate_markdown(benchmark)
        output_md.write_text(f"{markdown}\n", encoding="utf-8", newline="\n")
        print(f"Generated: {output_md}")
    except (OSError, ValueError) as exc:
        print(f"Unable to write benchmark output: {exc}", file=sys.stderr)
        return 1

    run_summary: RunSummary = benchmark["run_summary"]
    configs: list[str] = [key for key in run_summary if key != "delta"]
    delta: DeltaSummary = get_delta_summary(run_summary)

    print("\nSummary:")
    for config in configs:
        summary: ConfigSummary = get_config_summary(run_summary, config)
        pass_rate: float = summary["pass_rate"]["mean"]
        label: str = config.replace("_", " ").title()
        print(f"  {label}: {pass_rate * 100:.1f}% pass rate")
    print(f"  Delta:         {delta['pass_rate']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
