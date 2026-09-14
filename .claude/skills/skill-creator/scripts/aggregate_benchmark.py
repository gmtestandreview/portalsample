#!/usr/bin/env python3
"""
Aggregate individual run results into benchmark summary statistics.

Reads grading.json files from run directories and produces:
- run_summary with mean, stddev, min, max for each metric
- delta between with_skill and without_skill configurations

Usage:
    python aggregate_benchmark.py <benchmark_dir>

Example:
    python aggregate_benchmark.py benchmarks/2026-01-15T10-30-00/

The script supports two directory layouts:

    Workspace layout (from skill-creator iterations):
    <benchmark_dir>/
    └── eval-N/
        ├── with_skill/
        │   ├── run-1/grading.json
        │   └── run-2/grading.json
        └── without_skill/
            ├── run-1/grading.json
            └── run-2/grading.json

    Legacy layout (with runs/ subdirectory):
    <benchmark_dir>/
    └── runs/
        └── eval-N/
            ├── with_skill/
            │   └── run-1/grading.json
            └── without_skill/
                └── run-1/grading.json
"""

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TypedDict


JsonObject = dict[str, Any]
EvalId = int | str


class Stats(TypedDict):
    mean: float
    stddev: float
    min: float
    max: float


class RunResult(TypedDict, total=False):
    eval_id: EvalId
    eval_name: str
    run_number: int
    pass_rate: float
    passed: int
    failed: int
    total: int
    time_seconds: float
    tokens: int | float
    tool_calls: int
    errors: int
    expectations: list[Any]
    notes: list[Any]


class Benchmark(TypedDict):
    metadata: JsonObject
    runs: list[JsonObject]
    run_summary: JsonObject
    notes: list[str]


def calculate_stats(values: list[float]) -> Stats:
    """Calculate mean, stddev, min, max for a list of values."""
    if not values:
        return {"mean": 0.0, "stddev": 0.0, "min": 0.0, "max": 0.0}

    n = len(values)
    mean = sum(values) / n

    if n > 1:
        variance = sum((x - mean) ** 2 for x in values) / (n - 1)
        stddev = math.sqrt(variance)
    else:
        stddev = 0.0

    return {
        "mean": round(mean, 4),
        "stddev": round(stddev, 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
    }


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def as_object(value: Any) -> JsonObject:
    return value if isinstance(value, dict) else {}


def as_float(value: Any, default: float = 0.0) -> float:
    return float(value) if is_number(value) else default


def as_int(value: Any, default: int = 0) -> int:
    return int(value) if is_number(value) else default


def find_search_dir(benchmark_dir: Path) -> Path | None:
    """Return the directory containing eval-* folders, if present."""
    runs_dir = benchmark_dir / "runs"
    if runs_dir.exists():
        return runs_dir
    if list(benchmark_dir.glob("eval-*")):
        return benchmark_dir
    return None


def load_json_object(path: Path) -> JsonObject | None:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else None


def load_eval_metadata(eval_dir: Path, eval_idx: int) -> tuple[EvalId, str]:
    metadata_path = eval_dir / "eval_metadata.json"
    eval_name = eval_dir.name
    if metadata_path.exists():
        try:
            metadata = load_json_object(metadata_path) or {}
        except (json.JSONDecodeError, OSError):
            return eval_idx, eval_name
        return metadata.get("eval_id", eval_idx), str(metadata.get("eval_name", eval_name))

    try:
        return int(eval_dir.name.split("-")[1]), eval_name
    except (ValueError, IndexError):
        return eval_idx, eval_name


def parse_run_number(run_dir: Path) -> int | None:
    try:
        return int(run_dir.name.split("-")[1])
    except (ValueError, IndexError):
        print(f"Warning: skipping malformed run directory: {run_dir}")
        return None


def config_sort_key(config_dir: Path) -> tuple[int, str]:
    # Keep candidate configurations before baselines so delta is candidate-baseline.
    config_priority = {
        "with_skill": 0,
        "new_skill": 0,
        "old_skill": 1,
        "without_skill": 1,
    }
    return config_priority.get(config_dir.name, 2), config_dir.name


def load_timing_fallback(run_dir: Path) -> tuple[float, int | float | None]:
    timing_file = run_dir / "timing.json"
    if not timing_file.exists():
        return 0.0, None

    try:
        timing_data = load_json_object(timing_file) or {}
    except json.JSONDecodeError:
        return 0.0, None

    tokens = timing_data.get("total_tokens")
    return (
        as_float(timing_data.get("total_duration_seconds")),
        tokens if is_number(tokens) else None,
    )


def extract_timing(grading: JsonObject, run_dir: Path) -> tuple[float, int | float | None]:
    timing = as_object(grading.get("timing"))
    duration = timing.get("total_duration_seconds")
    if is_number(duration):
        return float(duration), None
    return load_timing_fallback(run_dir)


def validate_expectations(grading_file: Path, expectations: list[Any]) -> None:
    for expectation in expectations:
        if not isinstance(expectation, dict):
            print(
                f"Warning: expectation in {grading_file} missing required "
                f"fields (text, passed, evidence): {expectation}"
            )
            continue
        if "text" not in expectation or "passed" not in expectation:
            print(
                f"Warning: expectation in {grading_file} missing required "
                f"fields (text, passed, evidence): {expectation}"
            )


def extract_notes(grading: JsonObject) -> list[Any]:
    notes_summary = as_object(grading.get("user_notes_summary"))
    notes: list[Any] = []
    for key in ("uncertainties", "needs_review", "workarounds"):
        values = notes_summary.get(key, [])
        if isinstance(values, list):
            notes.extend(values)
    return notes


def build_run_result(
    grading: JsonObject,
    grading_file: Path,
    run_dir: Path,
    eval_id: EvalId,
    eval_name: str,
    run_number: int,
) -> RunResult:
    summary = as_object(grading.get("summary"))
    metrics = as_object(grading.get("execution_metrics"))
    raw_expectations = grading.get("expectations", [])
    expectations = raw_expectations if isinstance(raw_expectations, list) else []
    validate_expectations(grading_file, expectations)

    time_seconds, tokens = extract_timing(grading, run_dir)
    result: RunResult = {
        "eval_id": eval_id,
        "eval_name": eval_name,
        "run_number": run_number,
        "pass_rate": as_float(summary.get("pass_rate")),
        "passed": as_int(summary.get("passed")),
        "failed": as_int(summary.get("failed")),
        "total": as_int(summary.get("total")),
        "time_seconds": time_seconds,
        "tool_calls": as_int(metrics.get("total_tool_calls")),
        "errors": as_int(metrics.get("errors_encountered")),
        "expectations": expectations,
        "notes": extract_notes(grading),
    }
    if tokens is not None:
        result["tokens"] = tokens
    return result


def load_run_results(benchmark_dir: Path) -> dict[str, list[RunResult]]:
    """
    Load all run results from a benchmark directory.

    Returns dict keyed by config name (e.g. "with_skill"/"without_skill",
    or "new_skill"/"old_skill"), each containing a list of run results.
    """
    search_dir = find_search_dir(benchmark_dir)
    if search_dir is None:
        print(f"No eval directories found in {benchmark_dir} or {benchmark_dir / 'runs'}")
        return {}

    results: dict[str, list[RunResult]] = {}

    for eval_idx, eval_dir in enumerate(sorted(search_dir.glob("eval-*"))):
        eval_id, eval_name = load_eval_metadata(eval_dir, eval_idx)
        config_dirs = [p for p in eval_dir.iterdir() if p.is_dir()]
        config_dirs.sort(key=config_sort_key)
        for config_dir in config_dirs:
            # Skip non-config directories (inputs, outputs, etc.)
            if not list(config_dir.glob("run-*")):
                continue
            config = config_dir.name
            if config not in results:
                results[config] = []

            for run_dir in sorted(config_dir.glob("run-*")):
                run_number = parse_run_number(run_dir)
                if run_number is None:
                    continue

                grading_file = run_dir / "grading.json"

                if not grading_file.exists():
                    print(f"Warning: grading.json not found in {run_dir}")
                    continue

                try:
                    grading = load_json_object(grading_file)
                except json.JSONDecodeError as e:
                    print(f"Warning: Invalid JSON in {grading_file}: {e}")
                    continue

                if grading is None:
                    print(f"Warning: Expected JSON object in {grading_file}")
                    continue

                results[config].append(
                    build_run_result(
                        grading, grading_file, run_dir, eval_id, eval_name, run_number
                    )
                )

    return results


def aggregate_results(results: dict[str, list[RunResult]]) -> JsonObject:
    """
    Aggregate run results into summary statistics.

    Returns run_summary with stats for each configuration and delta.
    """
    run_summary: JsonObject = {}
    configs = list(results.keys())

    for config in configs:
        runs = results.get(config, [])

        if not runs:
            run_summary[config] = {
                "pass_rate": {"mean": 0.0, "stddev": 0.0, "min": 0.0, "max": 0.0},
                "time_seconds": {"mean": 0.0, "stddev": 0.0, "min": 0.0, "max": 0.0},
            }
            continue

        pass_rates = [r["pass_rate"] for r in runs]
        times = [r["time_seconds"] for r in runs]
        tokens = [float(r["tokens"]) for r in runs if is_number(r.get("tokens"))]

        summary: JsonObject = {
            "pass_rate": calculate_stats(pass_rates),
            "time_seconds": calculate_stats(times),
        }
        if tokens:
            summary["tokens"] = calculate_stats(tokens)
        run_summary[config] = summary

    # Calculate delta between the first two configs (if two exist)
    if len(configs) >= 2:
        primary = run_summary.get(configs[0], {})
        baseline = run_summary.get(configs[1], {})
    else:
        primary = run_summary.get(configs[0], {}) if configs else {}
        baseline = {}

    delta_pass_rate = primary.get("pass_rate", {}).get("mean", 0) - baseline.get(
        "pass_rate", {}
    ).get("mean", 0)
    delta_time = primary.get("time_seconds", {}).get("mean", 0) - baseline.get(
        "time_seconds", {}
    ).get("mean", 0)
    primary_tokens = primary.get("tokens")
    baseline_tokens = baseline.get("tokens")
    delta_tokens = None
    if primary_tokens and baseline_tokens:
        delta_tokens = primary_tokens.get("mean", 0) - baseline_tokens.get("mean", 0)

    run_summary["delta"] = {
        "pass_rate": f"{delta_pass_rate:+.2f}",
        "time_seconds": f"{delta_time:+.1f}",
        "tokens": f"{delta_tokens:+.0f}" if delta_tokens is not None else None,
    }

    return run_summary


def generate_benchmark(
    benchmark_dir: Path, skill_name: str = "", skill_path: str = ""
) -> Benchmark:
    """
    Generate complete benchmark.json from run results.
    """
    results = load_run_results(benchmark_dir)
    run_summary = aggregate_results(results)

    # Build runs array for benchmark.json
    runs: list[JsonObject] = []
    for config in results:
        for result in results[config]:
            runs.append(
                {
                    "eval_id": result["eval_id"],
                    "eval_name": result.get("eval_name", str(result["eval_id"])),
                    "configuration": config,
                    "run_number": result["run_number"],
                    "result": {
                        "pass_rate": result["pass_rate"],
                        "passed": result["passed"],
                        "failed": result["failed"],
                        "total": result["total"],
                        "time_seconds": result["time_seconds"],
                        "tokens": result.get("tokens"),
                        "tool_calls": result.get("tool_calls", 0),
                        "errors": result.get("errors", 0),
                    },
                    "expectations": result["expectations"],
                    "notes": result["notes"],
                }
            )

    # Determine eval IDs from results
    eval_ids = sorted({r["eval_id"] for config in results.values() for r in config})

    run_counts: list[int] = []
    for config_runs in results.values():
        counts_by_eval: dict[object, int] = {}
        for run in config_runs:
            counts_by_eval[run["eval_id"]] = counts_by_eval.get(run["eval_id"], 0) + 1
        run_counts.extend(counts_by_eval.values())
    runs_per_configuration = run_counts[0] if run_counts and len(set(run_counts)) == 1 else None

    benchmark: Benchmark = {
        "metadata": {
            "skill_name": skill_name or "<skill-name>",
            "skill_path": skill_path or "<path/to/skill>",
            "executor_model": "<model-name>",
            "analyzer_model": "<model-name>",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "evals_run": eval_ids,
            "runs_per_configuration": runs_per_configuration,
        },
        "runs": runs,
        "run_summary": run_summary,
        "notes": [],  # To be filled by analyzer
    }

    return benchmark


def generate_markdown(benchmark: Benchmark) -> str:
    """Generate human-readable benchmark.md from benchmark data."""
    metadata = benchmark["metadata"]
    run_summary = benchmark["run_summary"]

    # Determine config names (excluding "delta")
    configs = [k for k in run_summary if k != "delta"]
    config_a = configs[0] if len(configs) >= 1 else "config_a"
    config_b = configs[1] if len(configs) >= 2 else "config_b"
    label_a = config_a.replace("_", " ").title()
    label_b = config_b.replace("_", " ").title()

    lines = [
        f"# Skill Benchmark: {metadata['skill_name']}",
        "",
        f"**Model**: {metadata['executor_model']}",
        f"**Date**: {metadata['timestamp']}",
        f"**Evals**: {', '.join(map(str, metadata['evals_run']))} "
        f"({metadata['runs_per_configuration']} runs each per configuration)",
        "",
        "## Summary",
        "",
        f"| Metric | {label_a} | {label_b} | Delta |",
        "|--------|------------|---------------|-------|",
    ]

    a_summary = run_summary.get(config_a, {})
    b_summary = run_summary.get(config_b, {})
    delta = run_summary.get("delta", {})

    # Format pass rate
    a_pr = a_summary.get("pass_rate", {})
    b_pr = b_summary.get("pass_rate", {})
    lines.append(
        f"| Pass Rate | {a_pr.get('mean', 0) * 100:.0f}% ± "
        f"{a_pr.get('stddev', 0) * 100:.0f}% | "
        f"{b_pr.get('mean', 0) * 100:.0f}% ± "
        f"{b_pr.get('stddev', 0) * 100:.0f}% | "
        f"{delta.get('pass_rate', '—')} |"
    )

    # Format time
    a_time = a_summary.get("time_seconds", {})
    b_time = b_summary.get("time_seconds", {})
    lines.append(
        f"| Time | {a_time.get('mean', 0):.1f}s ± "
        f"{a_time.get('stddev', 0):.1f}s | "
        f"{b_time.get('mean', 0):.1f}s ± "
        f"{b_time.get('stddev', 0):.1f}s | "
        f"{delta.get('time_seconds', '—')}s |"
    )

    # Format tokens only when measured token data exists for both configurations.
    a_tokens = a_summary.get("tokens")
    b_tokens = b_summary.get("tokens")
    if a_tokens and b_tokens:
        lines.append(
            f"| Tokens | {a_tokens.get('mean', 0):.0f} ± {a_tokens.get('stddev', 0):.0f} | "
            f"{b_tokens.get('mean', 0):.0f} ± {b_tokens.get('stddev', 0):.0f} | "
            f"{delta.get('tokens') or '—'} |"
        )

    # Notes section
    if benchmark.get("notes"):
        lines.extend(["", "## Notes", ""])
        for note in benchmark["notes"]:
            lines.append(f"- {note}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Aggregate benchmark run results into summary statistics"
    )
    parser.add_argument("benchmark_dir", type=Path, help="Path to the benchmark directory")
    parser.add_argument("--skill-name", default="", help="Name of the skill being benchmarked")
    parser.add_argument("--skill-path", default="", help="Path to the skill being benchmarked")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Output path for benchmark.json (default: <benchmark_dir>/benchmark.json)",
    )

    args = parser.parse_args()

    if not args.benchmark_dir.exists():
        print(f"Directory not found: {args.benchmark_dir}")
        sys.exit(1)

    # Generate benchmark
    benchmark = generate_benchmark(args.benchmark_dir, args.skill_name, args.skill_path)

    # Determine output paths
    output_json = args.output or (args.benchmark_dir / "benchmark.json")
    output_md = output_json.with_suffix(".md")

    # Write benchmark.json
    with open(output_json, "w") as f:
        json.dump(benchmark, f, indent=2)
    print(f"Generated: {output_json}")

    # Write benchmark.md
    markdown = generate_markdown(benchmark)
    with open(output_md, "w") as f:
        f.write(markdown)
    print(f"Generated: {output_md}")

    # Print summary
    run_summary = benchmark["run_summary"]
    configs = [k for k in run_summary if k != "delta"]
    delta = run_summary.get("delta", {})

    print("\nSummary:")
    for config in configs:
        pr = run_summary[config]["pass_rate"]["mean"]
        label = config.replace("_", " ").title()
        print(f"  {label}: {pr * 100:.1f}% pass rate")
    print(f"  Delta:         {delta.get('pass_rate', '—')}")


if __name__ == "__main__":
    main()
