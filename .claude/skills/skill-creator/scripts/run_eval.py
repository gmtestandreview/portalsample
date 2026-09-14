#!/usr/bin/env python3
"""Run trigger evaluation for a skill description.

Tests whether a skill's description causes Claude to trigger (read the skill)
for a set of queries. Outputs results as JSON.
"""

from __future__ import annotations

import argparse
import json
import os
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from collections.abc import Mapping
from concurrent.futures import Future, ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import IO, Literal, TypedDict, cast

try:
    from scripts.utils import parse_skill_md
except ModuleNotFoundError:
    from utils import parse_skill_md


class EvalItem(TypedDict):
    """Validated evaluation input."""

    query: str
    should_trigger: bool


class EvalSummary(TypedDict):
    """Aggregate evaluation result counts."""

    total: int
    passed: int
    failed: int


class EvalOutput(TypedDict):
    """Top-level evaluation output."""

    skill_name: str
    description: str
    results: list[dict[str, object]]
    summary: EvalSummary


def find_project_root() -> Path:
    """Find the project root by walking up from cwd looking for .claude/."""
    current = Path.cwd()
    for parent in (current, *current.parents):
        if (parent / ".claude").is_dir():
            return parent
    return current


def _string_key_mapping(value: object) -> dict[str, object] | None:
    """Validate and normalize an unknown mapping to string keys."""
    if not isinstance(value, dict):
        return None
    raw = cast(dict[object, object], value)
    if not all(isinstance(key, str) for key in raw):
        return None
    return {cast(str, key): item for key, item in raw.items()}


def _get_mapping(mapping: Mapping[str, object], key: str) -> dict[str, object] | None:
    return _string_key_mapping(mapping.get(key))


def _get_str(mapping: Mapping[str, object], key: str, default: str = "") -> str:
    value = mapping.get(key)
    return value if isinstance(value, str) else default


def _get_bool(mapping: Mapping[str, object], key: str, default: bool = False) -> bool:
    value = mapping.get(key)
    return value if isinstance(value, bool) else default


def _iter_mapping_list(value: object) -> list[dict[str, object]]:
    if not isinstance(value, list):
        return []
    raw_items = cast(list[object], value)
    result: list[dict[str, object]] = []
    for raw in raw_items:
        item = _string_key_mapping(raw)
        if item is not None:
            result.append(item)
    return result


def _event_mapping(line: str) -> dict[str, object] | None:
    """Parse one CLI JSON line and require a JSON object root."""
    try:
        raw: object = json.loads(line)
    except json.JSONDecodeError:
        return None
    return _string_key_mapping(raw)


def _tool_use_triggers(content_item: Mapping[str, object], clean_name: str) -> bool:
    if _get_str(content_item, "type") != "tool_use":
        return False

    tool_name = _get_str(content_item, "name")
    tool_input = _get_mapping(content_item, "input")
    if tool_input is None:
        return False
    if tool_name == "Skill":
        return clean_name in _get_str(tool_input, "skill")
    if tool_name == "Read":
        return clean_name in _get_str(tool_input, "file_path")
    return False




@dataclass
class _StreamState:
    """Mutable state for one streamed tool-use block."""

    pending_tool_name: str | None = None
    accumulated_json: str = ""


_EventDecision = Literal["continue", "trigger", "no_trigger"]


def _process_stream_event(
    stream_event: Mapping[str, object],
    stream_type: str,
    state: _StreamState,
    clean_name: str,
) -> bool:
    """Process one normalized stream event; return whether it triggers."""
    if stream_type == "content_block_start":
        state.pending_tool_name = None
        state.accumulated_json = ""
        content_block = _get_mapping(stream_event, "content_block")
        if (
            content_block is not None
            and _get_str(content_block, "type") == "tool_use"
        ):
            tool_name = _get_str(content_block, "name")
            if tool_name in {"Skill", "Read"}:
                state.pending_tool_name = tool_name
        return False

    if stream_type == "content_block_delta" and state.pending_tool_name:
        delta = _get_mapping(stream_event, "delta")
        if delta is not None and _get_str(delta, "type") == "input_json_delta":
            state.accumulated_json += _get_str(delta, "partial_json")
            return clean_name in state.accumulated_json
        return False

    if stream_type in {"content_block_stop", "message_stop"}:
        triggered = bool(
            state.pending_tool_name and clean_name in state.accumulated_json
        )
        state.pending_tool_name = None
        state.accumulated_json = ""
        return triggered

    return False


def _normalize_stream_event(
    event: Mapping[str, object],
) -> tuple[dict[str, object] | None, str]:
    event_type = _get_str(event, "type")
    if event_type == "stream_event":
        stream_event = _get_mapping(event, "event")
        stream_type = (
            _get_str(stream_event, "type") if stream_event is not None else ""
        )
        return stream_event, stream_type

    if event_type in {
        "content_block_start",
        "content_block_delta",
        "content_block_stop",
        "message_stop",
    }:
        return dict(event), event_type

    return None, ""


def _process_event(
    event: Mapping[str, object],
    state: _StreamState,
    clean_name: str,
) -> _EventDecision:
    """Inspect one validated CLI event and return a decisive result if present."""
    stream_event, stream_type = _normalize_stream_event(event)
    if stream_event is not None and stream_type:
        return (
            "trigger"
            if _process_stream_event(stream_event, stream_type, state, clean_name)
            else "continue"
        )

    event_type = _get_str(event, "type")
    if event_type == "assistant":
        message = _get_mapping(event, "message")
        if message is None:
            return "continue"
        if any(
            _tool_use_triggers(content_item, clean_name)
            for content_item in _iter_mapping_list(message.get("content"))
        ):
            return "trigger"
        return "continue"

    if event_type != "result":
        return "continue"

    if _get_bool(event, "is_error"):
        status = event.get("api_error_status")
        message = event.get("result") or event.get("subtype") or "unknown error"
        prefix = f"claude CLI error {status}" if status else "claude CLI error"
        raise RuntimeError(f"{prefix}: {message}")
    return "no_trigger"


def _validate_skill_name(skill_name: str) -> str:
    """Validate a skill name before using it in YAML or a filesystem path."""
    if not skill_name or skill_name != skill_name.strip():
        raise ValueError("skill_name must be non-empty with no leading/trailing whitespace")
    if len(skill_name) > 128:
        raise ValueError("skill_name must be at most 128 characters")
    if any(ord(char) < 32 or ord(char) == 127 for char in skill_name):
        raise ValueError("skill_name must not contain control characters")
    if any(char in skill_name for char in '/\\<>:"|?*'):
        raise ValueError("skill_name contains characters unsafe for portable filenames")
    if skill_name in {".", ".."}:
        raise ValueError("skill_name must not be '.' or '..'")
    return skill_name


def _create_eval_project(
    skill_name: str,
    skill_description: str,
) -> tuple[Path, str]:
    """Create an isolated temporary Claude project containing one skill."""
    validated_name = _validate_skill_name(skill_name)
    clean_name = f"{validated_name}-skill-{uuid.uuid4().hex[:8]}"
    eval_project_root = Path(tempfile.mkdtemp(prefix="skill-activation-eval-"))
    skill_dir = eval_project_root / ".claude" / "skills" / clean_name
    skill_dir.mkdir(parents=True, exist_ok=False)

    indented_desc = "\n  ".join(skill_description.split("\n"))
    skill_content = (
        "---\n"
        f"name: {json.dumps(clean_name, ensure_ascii=False)}\n"
        "description: |\n"
        f"  {indented_desc}\n"
        "---\n\n"
        f"# {skill_name}\n\n"
        f"This skill handles: {skill_description}\n"
    )
    (skill_dir / "SKILL.md").write_text(skill_content, encoding="utf-8")
    return eval_project_root, clean_name


def _build_claude_command(query: str, model: str | None) -> list[str]:
    """Build the Claude CLI command for one trigger probe."""
    command = [
        "claude",
        "-p",
        query,
        "--output-format",
        "stream-json",
        "--verbose",
        "--include-partial-messages",
        "--setting-sources",
        "project",
    ]
    if model:
        command.extend(["--model", model])
    return command


def _launch_claude(
    query: str,
    model: str | None,
    eval_project_root: Path,
) -> subprocess.Popen[bytes]:
    """Launch Claude in the isolated project."""
    env = {key: value for key, value in os.environ.items() if key != "CLAUDECODE"}
    return subprocess.Popen(
        _build_claude_command(query, model),
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        cwd=eval_project_root,
        env=env,
        shell=(os.name == "nt"),
    )


def _pump_stdout(
    stdout: IO[bytes],
    line_queue: queue.Queue[bytes | None],
) -> None:
    """Move complete stdout lines into a queue for portable timed reads."""
    try:
        for raw_line in iter(stdout.readline, b""):
            line_queue.put(raw_line)
    finally:
        line_queue.put(None)


def _raw_line_decision(
    raw_line: bytes,
    stream_state: _StreamState,
    clean_name: str,
) -> _EventDecision:
    """Convert one raw stdout line into an event decision."""
    line = raw_line.decode("utf-8", errors="replace").strip()
    if not line:
        return "continue"

    event = _event_mapping(line)
    if event is None:
        return "continue"
    return _process_event(event, stream_state, clean_name)


_WaitResult = Literal["trigger", "no_trigger", "exited", "timeout"]


def _wait_for_trigger(
    process: subprocess.Popen[bytes],
    line_queue: queue.Queue[bytes | None],
    clean_name: str,
    deadline: float,
) -> _WaitResult:
    """Wait for a decisive stream event, process exit, or timeout."""
    stream_state = _StreamState()

    while time.monotonic() < deadline:
        remaining = max(0.0, deadline - time.monotonic())
        try:
            raw_line = line_queue.get(timeout=min(1.0, remaining))
        except queue.Empty:
            if process.poll() is not None:
                return "exited"
            continue

        if raw_line is None:
            if process.poll() is not None:
                return "exited"
            continue

        decision = _raw_line_decision(raw_line, stream_state, clean_name)
        if decision != "continue":
            return decision

    return "timeout" if process.poll() is None else "exited"


def _evaluate_process(
    process: subprocess.Popen[bytes],
    clean_name: str,
    timeout: int,
) -> bool:
    """Consume Claude output and return whether the skill was triggered."""
    stdout = process.stdout
    if stdout is None:
        _terminate_process_tree(process)
        raise RuntimeError("claude CLI stdout pipe was not created")

    line_queue: queue.Queue[bytes | None] = queue.Queue()
    reader = threading.Thread(
        target=_pump_stdout,
        args=(stdout, line_queue),
        daemon=True,
    )
    reader.start()

    try:
        result = _wait_for_trigger(
            process,
            line_queue,
            clean_name,
            time.monotonic() + timeout,
        )
    finally:
        _terminate_process_tree(process)
        reader.join(timeout=1.0)

    if result == "trigger":
        return True
    if result == "no_trigger":
        return False
    if result == "timeout":
        raise TimeoutError(f"trigger evaluation exceeded {timeout}s")
    if process.returncode not in (0, None):
        raise RuntimeError(f"claude CLI exited with status {process.returncode}")
    return False


def run_single_query(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    project_root: str,
    model: str | None = None,
) -> bool:
    """Run one query and return whether the isolated skill was triggered.

    ``project_root`` is retained for call compatibility. The actual evaluation
    deliberately runs in its own temporary project.
    """
    del project_root

    eval_project_root, clean_name = _create_eval_project(
        skill_name,
        skill_description,
    )
    try:
        process = _launch_claude(query, model, eval_project_root)
        return _evaluate_process(process, clean_name, timeout)
    finally:
        _remove_temp_tree(eval_project_root)


def _remove_temp_tree(path: Path) -> None:
    """Remove a temporary project, tolerating transient Windows file locks."""
    for attempt in range(5):
        try:
            shutil.rmtree(path)
            return
        except FileNotFoundError:
            return
        except PermissionError:
            if attempt == 4:
                shutil.rmtree(path, ignore_errors=True)
                return
            time.sleep(0.2)
        except OSError:
            shutil.rmtree(path, ignore_errors=True)
            return


def _parse_eval_set(
    value: object,
    runs_per_query: int,
    trigger_threshold: float,
) -> list[EvalItem]:
    """Validate external eval JSON and convert it to typed internal values."""
    if runs_per_query < 1:
        raise ValueError("runs_per_query must be >= 1")
    if not 0 < trigger_threshold <= 1:
        raise ValueError("trigger_threshold must be in (0, 1]")
    if not isinstance(value, list):
        raise ValueError("eval set must be a JSON array")

    raw_items = cast(list[object], value)
    validated: list[EvalItem] = []
    seen: set[str] = set()

    for index, raw_item in enumerate(raw_items):
        item = _string_key_mapping(raw_item)
        if item is None:
            raise ValueError(f"eval item {index} must be an object with string keys")

        query = item.get("query")
        should_trigger = item.get("should_trigger")
        if not isinstance(query, str) or not query.strip():
            raise ValueError(f"eval item {index} has an invalid query")
        if query in seen:
            raise ValueError(f"duplicate eval query: {query!r}")
        if not isinstance(should_trigger, bool):
            raise ValueError(f"eval item {index} should_trigger must be boolean")

        seen.add(query)
        validated.append({"query": query, "should_trigger": should_trigger})

    return validated


def _require_claude_cli() -> str:
    """Return the claude executable path or raise a clear prerequisite error."""
    path = shutil.which("claude")
    if not path:
        raise RuntimeError(
            "claude CLI not found on PATH; trigger evaluation is unavailable in this runtime"
        )
    return path


def _terminate_process_tree(process: subprocess.Popen[bytes]) -> None:
    """Terminate a subprocess and its children before deleting its cwd."""
    if process.poll() is not None:
        return

    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        process.kill()

    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def run_eval(
    eval_set: object,
    skill_name: str,
    description: str,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int = 1,
    trigger_threshold: float = 0.5,
    model: str | None = None,
) -> EvalOutput:
    """Run the full eval set and return deterministic, typed results."""
    if num_workers < 1:
        raise ValueError("num_workers must be >= 1")
    if timeout < 1:
        raise ValueError("timeout must be >= 1")

    items = _parse_eval_set(eval_set, runs_per_query, trigger_threshold)
    _require_claude_cli()

    query_outcomes: dict[str, list[bool | None]] = {
        item["query"]: [] for item in items
    }
    query_errors: dict[str, list[str]] = {item["query"]: [] for item in items}

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_item: dict[Future[bool], EvalItem] = {}
        for item in items:
            for _ in range(runs_per_query):
                future = executor.submit(
                    run_single_query,
                    item["query"],
                    skill_name,
                    description,
                    timeout,
                    str(project_root),
                    model,
                )
                future_to_item[future] = item

        for future in as_completed(future_to_item):
            item = future_to_item[future]
            query = item["query"]
            try:
                query_outcomes[query].append(future.result())
            except (OSError, RuntimeError) as exc:
                print(f"Warning: query execution failed: {exc}", file=sys.stderr)
                query_outcomes[query].append(None)
                query_errors[query].append(str(exc))

    results: list[dict[str, object]] = []
    for item in items:
        query = item["query"]
        outcomes = query_outcomes[query]
        valid = [value for value in outcomes if value is not None]
        execution_errors = len(outcomes) - len(valid)
        trigger_count = sum(valid)
        trigger_rate = trigger_count / len(valid) if valid else 0.0
        should_trigger = item["should_trigger"]

        did_pass = (
            execution_errors == 0
            and (
                trigger_rate >= trigger_threshold
                if should_trigger
                else trigger_rate < trigger_threshold
            )
        )

        results.append(
            {
                "query": query,
                "should_trigger": should_trigger,
                "trigger_rate": trigger_rate,
                "triggers": trigger_count,
                "runs": len(outcomes),
                "execution_errors": execution_errors,
                "error_messages": query_errors[query],
                "pass": did_pass,
            }
        )

    passed = sum(1 for result in results if result.get("pass") is True)
    total = len(results)
    return {
        "skill_name": skill_name,
        "description": description,
        "results": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
        },
    }


def _load_eval_json(path: Path) -> object:
    """Read an eval file as external JSON data."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise ValueError(f"cannot read eval set {path}: {exc}") from exc

    try:
        raw: object = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid eval JSON in {path}: {exc}") from exc
    return raw


def main() -> int:
    parser = argparse.ArgumentParser(description="Run trigger evaluation for a skill description")
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--description", default=None, help="Override description to test")
    parser.add_argument("--num-workers", type=int, default=10, help="Number of parallel workers")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout per query in seconds")
    parser.add_argument("--runs-per-query", type=int, default=3, help="Number of runs per query")
    parser.add_argument(
        "--trigger-threshold",
        type=float,
        default=0.5,
        help="Trigger rate threshold",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model to use for claude -p (default: user's configured model)",
    )
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    args = parser.parse_args()

    eval_path = Path(cast(str, args.eval_set))
    skill_path = Path(cast(str, args.skill_path))
    skill_file = skill_path / "SKILL.md"
    if not skill_file.is_file():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        return 1

    try:
        raw_eval_set = _load_eval_json(eval_path)
        name, original_description, _content = parse_skill_md(skill_path)
        override_description = cast(str | None, args.description)
        description = override_description or original_description
        output = run_eval(
            eval_set=raw_eval_set,
            skill_name=name,
            description=description,
            num_workers=cast(int, args.num_workers),
            timeout=cast(int, args.timeout),
            project_root=find_project_root(),
            runs_per_query=cast(int, args.runs_per_query),
            trigger_threshold=cast(float, args.trigger_threshold),
            model=cast(str | None, args.model),
        )
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    if cast(bool, args.verbose):
        summary = output["summary"]
        print(f"Evaluating: {description}", file=sys.stderr)
        print(f"Results: {summary['passed']}/{summary['total']} passed", file=sys.stderr)
        for result in output["results"]:
            status = "PASS" if result.get("pass") is True else "FAIL"
            triggers = result.get("triggers")
            runs = result.get("runs")
            expected = result.get("should_trigger")
            query = result.get("query")
            query_text = query if isinstance(query, str) else ""
            print(
                f"  [{status}] rate={triggers}/{runs} "
                f"expected={expected}: {query_text[:70]}",
                file=sys.stderr,
            )

    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
