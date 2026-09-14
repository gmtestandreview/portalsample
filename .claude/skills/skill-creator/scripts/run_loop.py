#!/usr/bin/env python3
"""Run the eval + improve loop until all pass or max iterations reached.

Combines run_eval.py and improve_description.py in a loop, tracking history
and returning the best description found. Supports a train/holdout split where
holdout data is evaluated only after the best training candidate is frozen.
"""

import argparse
import hashlib
import json
import sys
import tempfile
import time
import webbrowser
from pathlib import Path
from typing import TYPE_CHECKING, TypedDict, cast


class EvalCase(TypedDict):
    """Fields consumed by this orchestration module."""

    query: str
    should_trigger: bool


if TYPE_CHECKING:
    # Local interface shims contain partially typed neighboring modules so strict
    # checking of this file does not inherit their Unknown-heavy signatures.
    def generate_html(
        data: dict[str, object], auto_refresh: bool = False, skill_name: str = ""
    ) -> str: ...

    def improve_description(
        *,
        skill_name: str,
        skill_content: str,
        current_description: str,
        eval_results: dict[str, object],
        history: list[dict[str, object]],
        model: str | None,
        test_results: dict[str, object] | None = None,
        log_dir: Path | None = None,
        iteration: int | None = None,
    ) -> str: ...

    def find_project_root() -> Path: ...

    def run_eval(
        *,
        eval_set: list[EvalCase],
        skill_name: str,
        description: str,
        num_workers: int,
        timeout: int,
        project_root: Path,
        runs_per_query: int,
        trigger_threshold: float,
        model: str | None,
    ) -> object: ...

    def parse_skill_md(skill_path: Path) -> tuple[str, str, str]: ...
else:
    try:
        from scripts.generate_report import generate_html
        from scripts.improve_description import improve_description
        from scripts.run_eval import find_project_root, run_eval
        from scripts.utils import parse_skill_md
    except ModuleNotFoundError:
        from generate_report import generate_html
        from improve_description import improve_description
        from run_eval import find_project_root, run_eval
        from utils import parse_skill_md


class EvalSummary(TypedDict):
    passed: int
    failed: int
    total: int


def _validate_eval_case(value: object, index: int) -> EvalCase:
    if not isinstance(value, dict):
        raise ValueError(f"eval_set[{index}] must be an object")

    mapping = cast(dict[object, object], value)
    query = mapping.get("query")
    should_trigger = mapping.get("should_trigger")
    if not isinstance(query, str) or not query:
        raise ValueError(f"eval_set[{index}].query must be a non-empty string")
    if not isinstance(should_trigger, bool):
        raise ValueError(f"eval_set[{index}].should_trigger must be a boolean")

    # Preserve any extra keys expected by run_eval while validating the fields
    # this module relies on.
    return cast(EvalCase, value)


def _validate_eval_set_identity(eval_set: list[EvalCase]) -> None:
    """Reject empty or ambiguous eval sets before any evaluation is attempted."""
    if not eval_set:
        raise ValueError("eval set must contain at least one evaluation case")

    queries = [item["query"] for item in eval_set]
    if len(set(queries)) != len(queries):
        raise ValueError(
            "eval-set query strings must be unique because run_eval results are keyed by query"
        )


def load_eval_set(path: Path) -> list[EvalCase]:
    """Load and validate the eval-set boundary used by this module."""
    try:
        raw: object = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Unable to read eval set {path}: {exc}") from exc

    if not isinstance(raw, list):
        raise ValueError("eval set root must be a JSON array")

    raw_items = cast(list[object], raw)
    eval_set = [_validate_eval_case(item, index) for index, item in enumerate(raw_items)]
    _validate_eval_set_identity(eval_set)
    return eval_set


def split_eval_set(
    eval_set: list[EvalCase], holdout: float, seed: int = 42
) -> tuple[list[EvalCase], list[EvalCase]]:
    """Split evals into fixed, stratified train/holdout sets without emptying a class."""
    if holdout <= 0.0 or holdout >= 1.0:
        raise ValueError("holdout must be between 0 and 1 when enabled")

    trigger = [item for item in eval_set if item["should_trigger"]]
    no_trigger = [item for item in eval_set if not item["should_trigger"]]

    if len(trigger) < 2 or len(no_trigger) < 2:
        raise ValueError(
            "holdout evaluation requires at least 2 should-trigger and "
            "2 should-not-trigger queries"
        )

    def stable_order(item: EvalCase) -> bytes:
        payload = f"{seed}\0{item['query']}".encode("utf-8")
        return hashlib.sha256(payload).digest()

    trigger.sort(key=stable_order)
    no_trigger.sort(key=stable_order)

    def test_count(group: list[EvalCase]) -> int:
        return min(len(group) - 1, max(1, round(len(group) * holdout)))

    trigger_test_count = test_count(trigger)
    no_trigger_test_count = test_count(no_trigger)

    test_set = trigger[:trigger_test_count] + no_trigger[:no_trigger_test_count]
    train_set = trigger[trigger_test_count:] + no_trigger[no_trigger_test_count:]
    return train_set, test_set


def _validate_result(value: object, index: int) -> dict[str, object]:
    if not isinstance(value, dict):
        raise ValueError(f"run_eval results[{index}] must be an object")

    mapping = cast(dict[object, object], value)
    required_types: tuple[tuple[str, type[object]], ...] = (
        ("query", str),
        ("should_trigger", bool),
        ("triggers", int),
        ("runs", int),
        ("pass", bool),
    )
    for key, expected_type in required_types:
        field = mapping.get(key)
        if not isinstance(field, expected_type):
            raise ValueError(
                f"run_eval results[{index}].{key} must be {expected_type.__name__}"
            )

    triggers = mapping["triggers"]
    runs = mapping["runs"]
    if isinstance(triggers, bool) or isinstance(runs, bool):
        raise ValueError(f"run_eval results[{index}] counts must be integers, not booleans")
    if cast(int, triggers) < 0 or cast(int, runs) <= 0:
        raise ValueError(
            f"run_eval results[{index}] counts must satisfy 0 <= triggers and runs > 0"
        )
    if cast(int, triggers) > cast(int, runs):
        raise ValueError(f"run_eval results[{index}].triggers cannot exceed runs")

    return cast(dict[str, object], value)


def _extract_results(raw_output: object) -> list[dict[str, object]]:
    if not isinstance(raw_output, dict):
        raise ValueError("run_eval must return an object")

    output_mapping = cast(dict[object, object], raw_output)
    raw_results = output_mapping.get("results")
    if not isinstance(raw_results, list):
        raise ValueError("run_eval output must contain a results array")

    result_items = cast(list[object], raw_results)
    return [_validate_result(item, index) for index, item in enumerate(result_items)]


def _validate_result_identity(
    all_results: list[dict[str, object]],
    expected_cases: list[EvalCase],
) -> None:
    """Validate one-to-one result coverage and immutable eval identity fields."""
    expected = {case["query"]: case["should_trigger"] for case in expected_cases}
    seen: set[str] = set()

    for result in all_results:
        query = cast(str, result["query"])
        if query in seen:
            raise ValueError(f"run_eval returned duplicate result for query {query!r}")
        seen.add(query)

        if query not in expected:
            raise ValueError(f"run_eval returned result for unknown query {query!r}")
        expected_should_trigger = expected[query]

        actual_should_trigger = cast(bool, result["should_trigger"])
        if actual_should_trigger != expected_should_trigger:
            raise ValueError(
                "run_eval result changed should_trigger for "
                f"query {query!r}: expected {expected_should_trigger}, "
                f"got {actual_should_trigger}"
            )

    missing = set(expected) - seen
    if missing:
        missing_list = ", ".join(repr(query) for query in sorted(missing))
        raise ValueError(f"run_eval omitted results for query/queries: {missing_list}")


def _summarize(results: list[dict[str, object]]) -> EvalSummary:
    passed = sum(1 for result in results if cast(bool, result["pass"]))
    total = len(results)
    return {"passed": passed, "failed": total - passed, "total": total}


def _print_eval_stats(label: str, results: list[dict[str, object]], elapsed: float) -> None:
    positives = [result for result in results if cast(bool, result["should_trigger"])]
    negatives = [result for result in results if not cast(bool, result["should_trigger"])]

    true_positives = sum(cast(int, result["triggers"]) for result in positives)
    positive_runs = sum(cast(int, result["runs"]) for result in positives)
    false_negatives = positive_runs - true_positives

    false_positives = sum(cast(int, result["triggers"]) for result in negatives)
    negative_runs = sum(cast(int, result["runs"]) for result in negatives)
    true_negatives = negative_runs - false_positives

    total = true_positives + true_negatives + false_positives + false_negatives
    precision_denominator = true_positives + false_positives
    recall_denominator = true_positives + false_negatives
    precision = true_positives / precision_denominator if precision_denominator else 1.0
    recall = true_positives / recall_denominator if recall_denominator else 1.0
    accuracy = (true_positives + true_negatives) / total if total else 0.0

    print(
        f"{label}: {true_positives + true_negatives}/{total} correct, "
        f"precision={precision:.0%} recall={recall:.0%} "
        f"accuracy={accuracy:.0%} ({elapsed:.1f}s)",
        file=sys.stderr,
    )
    for result in results:
        status = "PASS" if cast(bool, result["pass"]) else "FAIL"
        triggers = cast(int, result["triggers"])
        runs = cast(int, result["runs"])
        expected = cast(bool, result["should_trigger"])
        query = cast(str, result["query"])
        print(
            f"  [{status}] rate={triggers}/{runs} expected={expected}: {query[:60]}",
            file=sys.stderr,
        )


def _validate_options(
    *,
    num_workers: int,
    timeout: int,
    max_iterations: int,
    runs_per_query: int,
    trigger_threshold: float,
    holdout: float,
) -> None:
    if num_workers < 1:
        raise ValueError("num_workers must be at least 1")
    if timeout < 1:
        raise ValueError("timeout must be at least 1 second")
    if max_iterations < 1:
        raise ValueError("max_iterations must be at least 1")
    if runs_per_query < 1:
        raise ValueError("runs_per_query must be at least 1")
    if not 0.0 <= trigger_threshold <= 1.0:
        raise ValueError("trigger_threshold must be between 0 and 1")
    if not 0.0 <= holdout < 1.0:
        raise ValueError("holdout must be in [0, 1)")


def _prepare_eval_sets(
    eval_set: list[EvalCase], holdout: float, verbose: bool
) -> tuple[list[EvalCase], list[EvalCase]]:
    if not holdout:
        return list(eval_set), []

    train_set, test_set = split_eval_set(eval_set, holdout)
    if verbose:
        print(
            f"Split: {len(train_set)} train, {len(test_set)} holdout (holdout={holdout})",
            file=sys.stderr,
        )
    return train_set, test_set


def _print_iteration_header(
    iteration: int, max_iterations: int, current_description: str
) -> None:
    print(f"\n{'=' * 60}", file=sys.stderr)
    print(f"Iteration {iteration}/{max_iterations}", file=sys.stderr)
    print(f"Description: {current_description}", file=sys.stderr)
    print(f"{'=' * 60}", file=sys.stderr)


def _evaluate_cases(
    *,
    eval_set: list[EvalCase],
    skill_name: str,
    description: str,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int,
    trigger_threshold: float,
    model: str | None,
) -> tuple[list[dict[str, object]], EvalSummary, dict[str, object], float]:
    """Evaluate one fixed set and validate one-to-one result coverage."""
    start = time.perf_counter()
    raw_output = run_eval(
        eval_set=eval_set,
        skill_name=skill_name,
        description=description,
        num_workers=num_workers,
        timeout=timeout,
        project_root=project_root,
        runs_per_query=runs_per_query,
        trigger_threshold=trigger_threshold,
        model=model,
    )
    elapsed = time.perf_counter() - start

    result_list = _extract_results(raw_output)
    _validate_result_identity(result_list, eval_set)
    summary = _summarize(result_list)
    results: dict[str, object] = {
        "results": result_list,
        "summary": summary,
    }
    return result_list, summary, results, elapsed


def _make_history_entry(
    *,
    iteration: int,
    description: str,
    train_result_list: list[dict[str, object]],
    train_summary: EvalSummary,
) -> dict[str, object]:
    """Record training evidence; holdout fields stay blinded until selection freezes."""
    return {
        "iteration": iteration,
        "description": description,
        "train_passed": train_summary["passed"],
        "train_failed": train_summary["failed"],
        "train_total": train_summary["total"],
        "train_results": train_result_list,
        "test_passed": None,
        "test_failed": None,
        "test_total": None,
        "test_results": None,
        # Backward compatibility with report generator.
        "passed": train_summary["passed"],
        "failed": train_summary["failed"],
        "total": train_summary["total"],
        "results": train_result_list,
    }


def _attach_holdout_result(
    entry: dict[str, object],
    result_list: list[dict[str, object]],
    summary: EvalSummary,
) -> None:
    """Attach one post-selection holdout evaluation to the frozen best entry."""
    entry["test_passed"] = summary["passed"]
    entry["test_failed"] = summary["failed"]
    entry["test_total"] = summary["total"]
    entry["test_results"] = result_list


def _write_live_report(
    *,
    live_report_path: Path | None,
    original_description: str,
    current_description: str,
    holdout: float,
    train_set: list[EvalCase],
    test_set: list[EvalCase],
    history: list[dict[str, object]],
    skill_name: str,
) -> None:
    if live_report_path is None:
        return

    partial_output: dict[str, object] = {
        "original_description": original_description,
        "best_description": current_description,
        "best_score": "in progress",
        "iterations_run": len(history),
        "holdout": holdout,
        "train_size": len(train_set),
        "test_size": len(test_set),
        "history": history,
    }
    live_report_path.write_text(
        generate_html(partial_output, auto_refresh=True, skill_name=skill_name),
        encoding="utf-8",
    )


def _report_iteration_stats(
    *,
    verbose: bool,
    train_result_list: list[dict[str, object]],
    eval_elapsed: float,
) -> None:
    if verbose:
        _print_eval_stats("Train", train_result_list, eval_elapsed)


def _report_holdout_stats(
    *,
    verbose: bool,
    result_list: list[dict[str, object]],
    elapsed: float,
) -> None:
    if verbose:
        _print_eval_stats("Holdout", result_list, elapsed)


def _termination_reason(
    *, train_summary: EvalSummary, iteration: int, max_iterations: int
) -> str | None:
    if train_summary["failed"] == 0:
        return f"all_passed (iteration {iteration})"
    if iteration == max_iterations:
        return f"max_iterations ({max_iterations})"
    return None


def _report_termination(reason: str, iteration: int, verbose: bool) -> None:
    if not verbose:
        return
    if reason.startswith("all_passed"):
        print(f"\nAll train queries passed on iteration {iteration}!", file=sys.stderr)
    else:
        print(f"\nMax iterations reached ({iteration}).", file=sys.stderr)


def _improve_current_description(
    *,
    skill_name: str,
    skill_content: str,
    current_description: str,
    train_results: dict[str, object],
    history: list[dict[str, object]],
    model: str | None,
    log_dir: Path | None,
    iteration: int,
    verbose: bool,
) -> str:
    if verbose:
        print("\nImproving description...", file=sys.stderr)

    blinded_history: list[dict[str, object]] = [
        {key: value for key, value in entry.items() if not key.startswith("test_")}
        for entry in history
    ]
    start = time.perf_counter()
    new_description = improve_description(
        skill_name=skill_name,
        skill_content=skill_content,
        current_description=current_description,
        eval_results=train_results,
        history=blinded_history,
        model=model,
        log_dir=log_dir,
        iteration=iteration,
    )
    improve_elapsed = time.perf_counter() - start

    if verbose:
        print(f"Proposed ({improve_elapsed:.1f}s): {new_description}", file=sys.stderr)
    return new_description


def _best_history_entry(history: list[dict[str, object]]) -> dict[str, object]:
    """Select only from training evidence; holdout must not influence selection."""

    def score(entry: dict[str, object]) -> int:
        return cast(int, entry["train_passed"])

    return max(history, key=score)


def _evaluate_frozen_holdout(
    *,
    best: dict[str, object],
    test_set: list[EvalCase],
    skill_name: str,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int,
    trigger_threshold: float,
    model: str | None,
    verbose: bool,
) -> None:
    """Evaluate the selected description on holdout exactly once."""
    if not test_set:
        return

    description = cast(str, best["description"])
    result_list, summary, _, elapsed = _evaluate_cases(
        eval_set=test_set,
        skill_name=skill_name,
        description=description,
        num_workers=num_workers,
        timeout=timeout,
        project_root=project_root,
        runs_per_query=runs_per_query,
        trigger_threshold=trigger_threshold,
        model=model,
    )
    _attach_holdout_result(best, result_list, summary)
    _report_holdout_stats(
        verbose=verbose,
        result_list=result_list,
        elapsed=elapsed,
    )


def _build_loop_output(
    *,
    exit_reason: str,
    original_description: str,
    current_description: str,
    history: list[dict[str, object]],
    holdout: float,
    train_set: list[EvalCase],
    test_set: list[EvalCase],
    verbose: bool,
) -> dict[str, object]:
    best = _best_history_entry(history)
    best_score = (
        f"{best['test_passed']}/{best['test_total']}"
        if test_set
        else f"{best['train_passed']}/{best['train_total']}"
    )

    if verbose:
        print(f"\nExit reason: {exit_reason}", file=sys.stderr)
        print(f"Best score: {best_score} (iteration {best['iteration']})", file=sys.stderr)

    return {
        "exit_reason": exit_reason,
        "original_description": original_description,
        "best_description": best["description"],
        "best_score": best_score,
        "best_train_score": f"{best['train_passed']}/{best['train_total']}",
        "best_test_score": (
            f"{best['test_passed']}/{best['test_total']}" if test_set else None
        ),
        "final_description": current_description,
        "iterations_run": len(history),
        "holdout": holdout,
        "train_size": len(train_set),
        "test_size": len(test_set),
        "history": history,
    }


def run_loop(
    eval_set: list[EvalCase],
    skill_path: Path,
    description_override: str | None,
    num_workers: int,
    timeout: int,
    max_iterations: int,
    runs_per_query: int,
    trigger_threshold: float,
    holdout: float,
    model: str | None,
    verbose: bool,
    live_report_path: Path | None = None,
    log_dir: Path | None = None,
) -> dict[str, object]:
    """Run the eval + improvement loop."""
    _validate_options(
        num_workers=num_workers,
        timeout=timeout,
        max_iterations=max_iterations,
        runs_per_query=runs_per_query,
        trigger_threshold=trigger_threshold,
        holdout=holdout,
    )
    _validate_eval_set_identity(eval_set)

    project_root = find_project_root()
    name, original_description, content = parse_skill_md(skill_path)
    current_description = description_override or original_description
    train_set, test_set = _prepare_eval_sets(eval_set, holdout, verbose)
    history: list[dict[str, object]] = []
    exit_reason = "unknown"

    for iteration in range(1, max_iterations + 1):
        if verbose:
            _print_iteration_header(iteration, max_iterations, current_description)

        train_result_list, train_summary, train_results, eval_elapsed = _evaluate_cases(
            eval_set=train_set,
            skill_name=name,
            description=current_description,
            num_workers=num_workers,
            timeout=timeout,
            project_root=project_root,
            runs_per_query=runs_per_query,
            trigger_threshold=trigger_threshold,
            model=model,
        )

        history.append(
            _make_history_entry(
                iteration=iteration,
                description=current_description,
                train_result_list=train_result_list,
                train_summary=train_summary,
            )
        )
        _write_live_report(
            live_report_path=live_report_path,
            original_description=original_description,
            current_description=current_description,
            holdout=holdout,
            train_set=train_set,
            test_set=test_set,
            history=history,
            skill_name=name,
        )
        _report_iteration_stats(
            verbose=verbose,
            train_result_list=train_result_list,
            eval_elapsed=eval_elapsed,
        )

        reason = _termination_reason(
            train_summary=train_summary,
            iteration=iteration,
            max_iterations=max_iterations,
        )
        if reason is not None:
            exit_reason = reason
            _report_termination(reason, iteration, verbose)
            break

        current_description = _improve_current_description(
            skill_name=name,
            skill_content=content,
            current_description=current_description,
            train_results=train_results,
            history=history,
            model=model,
            log_dir=log_dir,
            iteration=iteration,
            verbose=verbose,
        )

    best = _best_history_entry(history)
    _evaluate_frozen_holdout(
        best=best,
        test_set=test_set,
        skill_name=name,
        num_workers=num_workers,
        timeout=timeout,
        project_root=project_root,
        runs_per_query=runs_per_query,
        trigger_threshold=trigger_threshold,
        model=model,
        verbose=verbose,
    )

    return _build_loop_output(
        exit_reason=exit_reason,
        original_description=original_description,
        current_description=current_description,
        history=history,
        holdout=holdout,
        train_set=train_set,
        test_set=test_set,
        verbose=verbose,
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run eval + improve loop")
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--description", default=None, help="Override starting description")
    parser.add_argument("--num-workers", type=int, default=10, help="Number of parallel workers")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout per query in seconds")
    parser.add_argument("--max-iterations", type=int, default=5, help="Max improvement iterations")
    parser.add_argument("--runs-per-query", type=int, default=3, help="Number of runs per query")
    parser.add_argument(
        "--trigger-threshold", type=float, default=0.5, help="Trigger rate threshold"
    )
    parser.add_argument(
        "--holdout",
        type=float,
        default=0.4,
        help="Fraction of eval set to hold out for testing (0 to disable)",
    )
    parser.add_argument("--model", default=None, help="Model override")
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    parser.add_argument(
        "--report",
        default="auto",
        help="Generate HTML report at this path ('auto' or 'none' supported)",
    )
    parser.add_argument(
        "--results-dir",
        default=None,
        help="Save outputs to a timestamped subdirectory here",
    )
    return parser


def main() -> int:
    args = _build_parser().parse_args()

    try:
        eval_set = load_eval_set(Path(args.eval_set))
        skill_path = Path(args.skill_path)
        skill_file = skill_path / "SKILL.md"
        if not skill_file.is_file():
            raise ValueError(f"No SKILL.md found at {skill_path}")

        _validate_options(
            num_workers=args.num_workers,
            timeout=args.timeout,
            max_iterations=args.max_iterations,
            runs_per_query=args.runs_per_query,
            trigger_threshold=args.trigger_threshold,
            holdout=args.holdout,
        )

        name, _, _ = parse_skill_md(skill_path)

        live_report_path: Path | None
        if args.report != "none":
            if args.report == "auto":
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                live_report_path = (
                    Path(tempfile.gettempdir())
                    / f"skill_description_report_{skill_path.name}_{timestamp}.html"
                )
            else:
                live_report_path = Path(args.report)
                live_report_path.parent.mkdir(parents=True, exist_ok=True)

            live_report_path.write_text(
                "<html><body><h1>Starting optimization loop...</h1>"
                "<meta http-equiv='refresh' content='5'></body></html>",
                encoding="utf-8",
            )
            webbrowser.open(live_report_path.resolve().as_uri())
        else:
            live_report_path = None

        results_dir: Path | None
        if args.results_dir:
            timestamp = time.strftime("%Y-%m-%d_%H%M%S")
            results_dir = Path(args.results_dir) / timestamp
            results_dir.mkdir(parents=True, exist_ok=True)
        else:
            results_dir = None

        log_dir = results_dir / "logs" if results_dir else None
        output = run_loop(
            eval_set=eval_set,
            skill_path=skill_path,
            description_override=args.description,
            num_workers=args.num_workers,
            timeout=args.timeout,
            max_iterations=args.max_iterations,
            runs_per_query=args.runs_per_query,
            trigger_threshold=args.trigger_threshold,
            holdout=args.holdout,
            model=args.model,
            verbose=args.verbose,
            live_report_path=live_report_path,
            log_dir=log_dir,
        )

        json_output = json.dumps(output, indent=2, allow_nan=False)
        print(json_output)

        if results_dir:
            (results_dir / "results.json").write_text(json_output, encoding="utf-8")

        if live_report_path:
            live_report_path.write_text(
                generate_html(output, auto_refresh=False, skill_name=name),
                encoding="utf-8",
            )
            print(f"\nReport: {live_report_path}", file=sys.stderr)

        if results_dir and live_report_path:
            (results_dir / "report.html").write_text(
                generate_html(output, auto_refresh=False, skill_name=name),
                encoding="utf-8",
            )

        if results_dir:
            print(f"Results saved to: {results_dir}", file=sys.stderr)
        return 0
    except (OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
