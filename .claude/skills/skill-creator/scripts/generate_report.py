#!/usr/bin/env python3
"""Generate an HTML report from run_loop.py output.

Takes the JSON output from run_loop.py and generates a visual HTML report
showing each description attempt with check/x for each test case.
Distinguishes between train and test queries.
"""

# ruff: noqa: E501

import argparse
import html
import json
import sys
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union, cast


class Arguments(argparse.Namespace):
    """Typed command-line namespace populated by argparse."""

    input: str
    output: Optional[str]
    skill_name: str


@dataclass(frozen=True)
class QueryResult:
    """Validated result for one trigger query."""

    query: str
    should_trigger: bool = True
    passed: bool = False
    triggers: int = 0
    runs: int = 0


@dataclass(frozen=True)
class IterationRecord:
    """Validated optimization iteration."""

    iteration: Union[int, str] = "?"
    description: str = ""
    train_results: tuple[QueryResult, ...] = ()
    test_results: tuple[QueryResult, ...] = ()


# Compatibility alias for any callers that imported the previous internal model name.
Iteration = IterationRecord


@dataclass(frozen=True)
class ReportData:
    """Validated subset of run_loop.py output consumed by this renderer."""

    history: tuple[IterationRecord, ...] = ()
    original_description: str = "N/A"
    best_description: str = "N/A"
    best_score: object = "N/A"
    has_best_test_score: bool = False
    iterations_run: object = 0
    train_size: object = "?"
    test_size: object = "?"


def _mapping(value: object, *, context: str) -> dict[str, object]:
    if not isinstance(value, Mapping):
        raise ValueError(f"{context} must be a JSON object")
    raw = cast(Mapping[object, object], value)
    result: dict[str, object] = {}
    for key, item in raw.items():
        if not isinstance(key, str):
            raise ValueError(f"{context} contains a non-string key")
        result[key] = item
    return result


def _sequence(value: object, *, context: str) -> Sequence[object]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes, bytearray)):
        raise ValueError(f"{context} must be a JSON array")
    return cast(Sequence[object], value)


def _optional_str(data: Mapping[str, object], key: str, default: str) -> str:
    value = data.get(key, default)
    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string")
    return value


def _optional_bool(data: Mapping[str, object], key: str, default: bool) -> bool:
    value = data.get(key, default)
    if not isinstance(value, bool):
        raise ValueError(f"{key} must be a boolean")
    return value


def _optional_nonnegative_int(data: Mapping[str, object], key: str, default: int) -> int:
    value = data.get(key, default)
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{key} must be a non-negative integer")
    return value


def _parse_result(value: object, *, context: str) -> QueryResult:
    item = _mapping(value, context=context)
    query = item.get("query")
    if not isinstance(query, str):
        raise ValueError(f"{context}.query must be a string")

    runs = _optional_nonnegative_int(item, "runs", 0)
    triggers = _optional_nonnegative_int(item, "triggers", 0)
    if triggers > runs:
        raise ValueError(f"{context}.triggers cannot exceed runs")

    return QueryResult(
        query=query,
        should_trigger=_optional_bool(item, "should_trigger", True),
        passed=_optional_bool(item, "pass", False),
        triggers=triggers,
        runs=runs,
    )


def _parse_results(value: object, *, context: str) -> tuple[QueryResult, ...]:
    results = tuple(
        _parse_result(item, context=f"{context}[{index}]")
        for index, item in enumerate(_sequence(value, context=context))
    )

    seen_queries: set[str] = set()
    for result in results:
        if result.query in seen_queries:
            raise ValueError(f"{context} contains duplicate query {result.query!r}")
        seen_queries.add(result.query)
    return results


def _parse_iteration(value: object, *, index: int) -> IterationRecord:
    item = _mapping(value, context=f"history[{index}]")
    iteration_value = item.get("iteration", "?")
    if isinstance(iteration_value, bool) or not isinstance(iteration_value, (int, str)):
        raise ValueError(f"history[{index}].iteration must be an integer or string")

    train_source = item.get("train_results", item.get("results", ()))
    test_source = item.get("test_results", ())
    return IterationRecord(
        iteration=iteration_value,
        description=_optional_str(item, "description", ""),
        train_results=_parse_results(train_source, context=f"history[{index}].train_results"),
        test_results=_parse_results(test_source, context=f"history[{index}].test_results"),
    )


def _parse_report_data(data: Mapping[str, object]) -> ReportData:
    history_value = data.get("history", ())
    history = tuple(
        _parse_iteration(item, index=index)
        for index, item in enumerate(_sequence(history_value, context="history"))
    )
    return ReportData(
        history=history,
        original_description=_optional_str(data, "original_description", "N/A"),
        best_description=_optional_str(data, "best_description", "N/A"),
        best_score=data.get("best_score", "N/A"),
        has_best_test_score=data.get("best_test_score") is not None,
        iterations_run=data.get("iterations_run", 0),
        train_size=data.get("train_size", "?"),
        test_size=data.get("test_size", "?"),
    )


def _escape_display(value: object) -> str:
    return html.escape(str(value), quote=True)


def _aggregate_runs(results: Sequence[QueryResult]) -> tuple[int, int]:
    correct = 0
    total = 0
    for result in results:
        total += result.runs
        correct += (
            result.triggers
            if result.should_trigger
            else result.runs - result.triggers
        )
    return correct, total


def _score_class(correct: int, total: int) -> str:
    if total > 0:
        ratio = correct / total
        if ratio >= 0.8:
            return "score-good"
        if ratio >= 0.5:
            return "score-ok"
    return "score-bad"


def _collect_query_catalog(
    history: Sequence[IterationRecord], *, use_test_results: bool
) -> tuple[QueryResult, ...]:
    """Collect first-seen query definitions and verify stable query semantics."""
    queries: dict[str, QueryResult] = {}
    result_set_name = "test_results" if use_test_results else "train_results"

    for index, item in enumerate(history):
        results = item.test_results if use_test_results else item.train_results
        for result in results:
            existing = queries.get(result.query)
            if existing is None:
                queries[result.query] = result
                continue
            if existing.should_trigger != result.should_trigger:
                raise ValueError(
                    f"history[{index}].{result_set_name} changes should_trigger "
                    f"for query {result.query!r}"
                )

    return tuple(queries.values())


def _passed_count(results: Sequence[QueryResult]) -> int:
    return sum(1 for result in results if result.passed)


def _best_history_index(
    history: Sequence[IterationRecord], *, use_test_results: bool
) -> Optional[int]:
    """Return the stable row index with the highest canonical pass count."""
    if not history:
        return None

    def pass_count(item: IterationRecord) -> int:
        results = item.test_results if use_test_results else item.train_results
        return _passed_count(results)

    return max(range(len(history)), key=lambda index: pass_count(history[index]))


def _render_page_start(*, title_prefix: str, refresh_tag: str) -> str:
    """Render the document head and opening explanatory content."""
    return (
        """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
"""
        + refresh_tag
        + """    <title>"""
        + title_prefix
        + """Skill Description Optimization</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Lora', Georgia, serif;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
            background: #faf9f5;
            color: #141413;
        }
        h1 { font-family: 'Poppins', sans-serif; color: #141413; }
        .explainer {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border: 1px solid #e8e6dc;
            color: #b0aea5;
            font-size: 0.875rem;
            line-height: 1.6;
        }
        .summary {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border: 1px solid #e8e6dc;
        }
        .summary p { margin: 5px 0; }
        .best { color: #788c5d; font-weight: bold; }
        .table-container {
            overflow-x: auto;
            width: 100%;
        }
        table {
            border-collapse: collapse;
            background: white;
            border: 1px solid #e8e6dc;
            border-radius: 6px;
            font-size: 12px;
            min-width: 100%;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #e8e6dc;
            white-space: normal;
            word-wrap: break-word;
        }
        th {
            font-family: 'Poppins', sans-serif;
            background: #141413;
            color: #faf9f5;
            font-weight: 500;
        }
        th.test-col {
            background: #6a9bcc;
        }
        th.query-col { min-width: 200px; }
        td.description {
            font-family: monospace;
            font-size: 11px;
            word-wrap: break-word;
            max-width: 400px;
        }
        td.result {
            text-align: center;
            font-size: 16px;
            min-width: 40px;
        }
        td.test-result {
            background: #f0f6fc;
        }
        .pass { color: #788c5d; }
        .fail { color: #c44; }
        .rate {
            font-size: 9px;
            color: #b0aea5;
            display: block;
        }
        tr:hover { background: #faf9f5; }
        .score {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
        }
        .score-good { background: #eef2e8; color: #788c5d; }
        .score-ok { background: #fef3c7; color: #d97706; }
        .score-bad { background: #fceaea; color: #c44; }
        .train-label { color: #b0aea5; font-size: 10px; }
        .test-label { color: #6a9bcc; font-size: 10px; font-weight: bold; }
        .best-row { background: #f5f8f2; }
        th.positive-col { border-bottom: 3px solid #788c5d; }
        th.negative-col { border-bottom: 3px solid #c44; }
        th.test-col.positive-col { border-bottom: 3px solid #788c5d; }
        th.test-col.negative-col { border-bottom: 3px solid #c44; }
        .legend { font-family: 'Poppins', sans-serif; display: flex; gap: 20px; margin-bottom: 10px; font-size: 13px; align-items: center; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-swatch { width: 16px; height: 16px; border-radius: 3px; display: inline-block; }
        .swatch-positive { background: #141413; border-bottom: 3px solid #788c5d; }
        .swatch-negative { background: #141413; border-bottom: 3px solid #c44; }
        .swatch-test { background: #6a9bcc; }
        .swatch-train { background: #141413; }
    </style>
</head>
<body>
    <h1>"""
        + title_prefix
        + """Skill Description Optimization</h1>
    <div class="explainer">
        <strong>Optimizing your skill's description.</strong> This page updates automatically as Claude tests different versions of your skill's description. Each row is an iteration — a new description attempt. The columns show test queries: green checkmarks mean the skill triggered correctly (or correctly didn't trigger), red crosses mean it got it wrong. The "Train" score shows performance on queries used to improve the description; the "Test" score shows performance on held-out queries the optimizer hasn't seen. When it's done, Claude will apply the best-performing description to your skill.
    </div>
"""
    )


def _render_summary(report: ReportData) -> str:
    """Render the report summary using only escaped display values."""
    score_source = "(test)" if report.has_best_test_score else "(train)"
    return f"""
    <div class="summary">
        <p><strong>Original:</strong> {html.escape(report.original_description, quote=True)}</p>
        <p class="best"><strong>Best:</strong> {html.escape(report.best_description, quote=True)}</p>
        <p><strong>Best Score:</strong> {_escape_display(report.best_score)} {score_source}</p>
        <p><strong>Iterations:</strong> {_escape_display(report.iterations_run)} | <strong>Train:</strong> {_escape_display(report.train_size)} | <strong>Test:</strong> {_escape_display(report.test_size)}</p>
    </div>
"""


def _render_legend() -> str:
    """Render the static query-column legend."""
    return """
    <div class="legend">
        <span style="font-weight:600">Query columns:</span>
        <span class="legend-item"><span class="legend-swatch swatch-positive"></span> Should trigger</span>
        <span class="legend-item"><span class="legend-swatch swatch-negative"></span> Should NOT trigger</span>
        <span class="legend-item"><span class="legend-swatch swatch-train"></span> Train</span>
        <span class="legend-item"><span class="legend-swatch swatch-test"></span> Test</span>
    </div>
"""


def _render_query_header(query: QueryResult, *, is_test: bool) -> str:
    polarity = "positive-col" if query.should_trigger else "negative-col"
    class_name = f"test-col {polarity}" if is_test else polarity
    return f'                <th class="{class_name}">{html.escape(query.query)}</th>\n'


def _render_table_header(
    train_queries: Sequence[QueryResult],
    test_queries: Sequence[QueryResult],
) -> str:
    """Render the table opening and all stable query columns."""
    parts = ["""
    <div class="table-container">
    <table>
        <thead>
            <tr>
                <th>Iter</th>
                <th>Train</th>
                <th>Test</th>
                <th class="query-col">Description</th>
"""]
    parts.extend(_render_query_header(query, is_test=False) for query in train_queries)
    parts.extend(_render_query_header(query, is_test=True) for query in test_queries)
    parts.append("""            </tr>
        </thead>
        <tbody>
""")
    return "".join(parts)


def _render_result_cell(result: Optional[QueryResult], *, is_test: bool) -> str:
    if result is None:
        did_pass = False
        triggers = 0
        runs = 0
    else:
        did_pass = result.passed
        triggers = result.triggers
        runs = result.runs

    icon = "✓" if did_pass else "✗"
    css_class = "pass" if did_pass else "fail"
    test_class = " test-result" if is_test else ""
    return (
        f'                <td class="result{test_class} {css_class}">'
        f'{icon}<span class="rate">{triggers}/{runs}</span></td>\n'
    )


def _render_result_cells(
    queries: Sequence[QueryResult],
    results: Sequence[QueryResult],
    *,
    is_test: bool,
) -> str:
    by_query = {result.query: result for result in results}
    return "".join(
        _render_result_cell(by_query.get(query.query), is_test=is_test)
        for query in queries
    )


def _render_iteration_row(
    item: IterationRecord,
    *,
    row_index: int,
    best_index: Optional[int],
    train_queries: Sequence[QueryResult],
    test_queries: Sequence[QueryResult],
) -> str:
    """Render one history row; row position is identity, iteration is display-only."""
    train_correct, train_runs = _aggregate_runs(item.train_results)
    test_correct, test_runs = _aggregate_runs(item.test_results)
    row_class = "best-row" if row_index == best_index else ""

    return "".join(
        (
            f"""            <tr class="{row_class}">
                <td>{_escape_display(item.iteration)}</td>
                <td><span class="score {_score_class(train_correct, train_runs)}">{train_correct}/{train_runs}</span></td>
                <td><span class="score {_score_class(test_correct, test_runs)}">{test_correct}/{test_runs}</span></td>
                <td class="description">{html.escape(item.description, quote=True)}</td>
""",
            _render_result_cells(
                train_queries,
                item.train_results,
                is_test=False,
            ),
            _render_result_cells(
                test_queries,
                item.test_results,
                is_test=True,
            ),
            "            </tr>\n",
        )
    )


def _render_table(
    history: Sequence[IterationRecord],
    train_queries: Sequence[QueryResult],
    test_queries: Sequence[QueryResult],
) -> str:
    """Render the query matrix and select the best row from canonical result data."""
    best_index = _best_history_index(
        history,
        use_test_results=bool(test_queries),
    )
    rows = "".join(
        _render_iteration_row(
            item,
            row_index=row_index,
            best_index=best_index,
            train_queries=train_queries,
            test_queries=test_queries,
        )
        for row_index, item in enumerate(history)
    )
    return (
        _render_table_header(train_queries, test_queries)
        + rows
        + """        </tbody>
    </table>
    </div>
"""
    )


def _render_page_end() -> str:
    return """
</body>
</html>
"""


def generate_html(
    data: Mapping[str, object],
    auto_refresh: bool = False,
    skill_name: str = "",
) -> str:
    """Generate an HTML report from validated run_loop output."""
    report = _parse_report_data(data)
    title_prefix = html.escape(f"{skill_name} — ", quote=True) if skill_name else ""
    refresh_tag = '    <meta http-equiv="refresh" content="5">\n' if auto_refresh else ""
    train_queries = _collect_query_catalog(report.history, use_test_results=False)
    test_queries = _collect_query_catalog(report.history, use_test_results=True)

    return "".join(
        (
            _render_page_start(title_prefix=title_prefix, refresh_tag=refresh_tag),
            _render_summary(report),
            _render_legend(),
            _render_table(report.history, train_queries, test_queries),
            _render_page_end(),
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate HTML report from run_loop output")
    parser.add_argument("input", help="Path to JSON output from run_loop.py (or - for stdin)")
    parser.add_argument("-o", "--output", default=None, help="Output HTML file (default: stdout)")
    parser.add_argument(
        "--skill-name", default="", help="Skill name to include in the report title"
    )
    args = Arguments()
    parser.parse_args(namespace=args)

    try:
        raw_data: object = (
            json.load(sys.stdin)
            if args.input == "-"
            else json.loads(Path(args.input).read_text(encoding="utf-8"))
        )
        data = _mapping(raw_data, context="report")
        html_output = generate_html(data, skill_name=args.skill_name)

        if args.output:
            Path(args.output).write_text(html_output, encoding="utf-8")
            print(f"Report written to {args.output}", file=sys.stderr)
        else:
            print(html_output)
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
