#!/usr/bin/env python3
"""Run trigger evaluation for a skill description.

Tests whether a skill description causes Claude to trigger (read the skill) for
representative queries. Results distinguish completed probes from execution
failures; unavailable trigger-rate evidence is never converted to a numeric zero.
"""

from __future__ import annotations

import argparse
import contextlib
import json
import math
import os
import queue
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from collections.abc import Callable, Mapping, Sequence
from concurrent.futures import Future, ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import IO, TYPE_CHECKING, Literal, TypedDict, cast

if TYPE_CHECKING:
    from scripts.utils import parse_skill_md
else:
    try:
        from scripts.utils import parse_skill_md
    except ModuleNotFoundError as exc:
        if exc.name not in {"scripts", "scripts.utils"}:
            raise
        from utils import parse_skill_md


MAX_SKILL_NAME_LENGTH = 64
MAX_GENERATED_SKILL_NAME_LENGTH = 64
GENERATED_SUFFIX_LENGTH = len("-skill-") + 8
STDERR_TAIL_BYTES = 32 * 1024
EXIT_DRAIN_GRACE_SECONDS = 0.25
SKILL_FILENAME = "SKILL.md"
QUERY_FILENAME = "query.txt"
# Windows caps ProcessPoolExecutor at 61 workers (WaitForMultipleObjects limit).
MAX_POOL_WORKERS = 61 if os.name == "nt" else sys.maxsize
_SAFE_MODEL_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:/\[\]-]*")
# Characters YAML treats as line breaks or forbids raw in a scalar.
_YAML_ESCAPE_RE = re.compile("[\x7f-\x9f﻿￾￿]")


class EvalItem(TypedDict):
    """Validated evaluation input."""

    query: str
    should_trigger: bool


class QueryResult(TypedDict):
    """Result for one eval query across repeated probes."""

    query: str
    should_trigger: bool
    trigger_rate: float | None
    triggers: int
    runs: int
    completed_runs: int
    execution_errors: int
    error_messages: list[str]
    pass_: bool


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


@dataclass
class _StreamState:
    """Mutable state for one streamed tool-use block."""

    pending_tool_name: str | None = None
    accumulated_json: str = ""


@dataclass(frozen=True, slots=True)
class _Attempt:
    """Identity of one repeated probe for deterministic result placement."""

    item_index: int
    run_index: int


_EventDecision = Literal["continue", "trigger", "no_trigger"]
_WaitResult = Literal["trigger", "no_trigger", "eof", "timeout"]
_QueueReadStatus = Literal["line", "retry", "eof"]


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


def _iter_mapping_list(value: object) -> list[dict[str, object]]:
    if not isinstance(value, list):
        return []
    result: list[dict[str, object]] = []
    for raw in cast(list[object], value):
        item = _string_key_mapping(raw)
        if item is not None:
            result.append(item)
    return result


def _reject_non_standard_json_constant(value: str) -> object:
    raise ValueError(f"non-standard JSON numeric constant: {value}")


def _event_mapping(line: str) -> dict[str, object] | None:
    """Parse one strict CLI JSON line and require a JSON object root."""
    try:
        raw: object = json.loads(
            line,
            parse_constant=_reject_non_standard_json_constant,
        )
    except ValueError:
        return None
    return _string_key_mapping(raw)


def _read_path_triggers(file_path: str, clean_name: str) -> bool:
    """Match an exact generated skill directory in a Read path."""
    normalized = file_path.replace("\\", "/")
    parts = [part for part in normalized.split("/") if part]
    for index, part in enumerate(parts):
        if part != "skills" or index + 2 >= len(parts):
            continue
        if parts[index + 1] == clean_name and parts[index + 2] == SKILL_FILENAME:
            return True
    return False


def _tool_input_triggers(
    tool_name: str,
    tool_input: Mapping[str, object],
    clean_name: str,
) -> bool:
    """Return whether one normalized tool input activates the generated skill."""
    if tool_name == "Skill":
        return _get_str(tool_input, "skill") == clean_name
    if tool_name == "Read":
        return _read_path_triggers(_get_str(tool_input, "file_path"), clean_name)
    return False


def _tool_use_triggers(content_item: Mapping[str, object], clean_name: str) -> bool:
    if _get_str(content_item, "type") != "tool_use":
        return False
    tool_name = _get_str(content_item, "name")
    tool_input = _get_mapping(content_item, "input")
    return bool(
        tool_input is not None
        and tool_name in {"Skill", "Read"}
        and _tool_input_triggers(tool_name, tool_input, clean_name)
    )


def _parse_stream_tool_input(
    tool_name: str,
    partial_json: str,
    clean_name: str,
) -> bool | None:
    """Return trigger status for complete streamed tool input, or None if incomplete."""
    if not partial_json:
        return False
    try:
        raw: object = json.loads(
            partial_json,
            parse_constant=_reject_non_standard_json_constant,
        )
    except json.JSONDecodeError:
        return None
    except ValueError as exc:
        raise RuntimeError(f"invalid streamed tool input: {exc}") from exc

    tool_input = _string_key_mapping(raw)
    if tool_input is None:
        raise RuntimeError("streamed tool input must be a JSON object")
    return _tool_input_triggers(tool_name, tool_input, clean_name)



def _stream_block_start(
    stream_event: Mapping[str, object],
    state: _StreamState,
    clean_name: str,
) -> bool:
    state.pending_tool_name = None
    state.accumulated_json = ""
    content_block = _get_mapping(stream_event, "content_block")
    if content_block is None or _get_str(content_block, "type") != "tool_use":
        return False

    tool_name = _get_str(content_block, "name")
    if tool_name not in {"Skill", "Read"}:
        return False

    state.pending_tool_name = tool_name
    tool_input = _get_mapping(content_block, "input")
    return bool(
        tool_input is not None
        and _tool_input_triggers(tool_name, tool_input, clean_name)
    )


def _stream_block_delta(
    stream_event: Mapping[str, object],
    state: _StreamState,
    clean_name: str,
) -> bool:
    tool_name = state.pending_tool_name
    if tool_name is None:
        return False

    delta = _get_mapping(stream_event, "delta")
    if delta is None or _get_str(delta, "type") != "input_json_delta":
        return False

    state.accumulated_json += _get_str(delta, "partial_json")
    parsed = _parse_stream_tool_input(tool_name, state.accumulated_json, clean_name)
    return parsed is True


def _stream_block_stop(state: _StreamState, clean_name: str) -> bool:
    tool_name = state.pending_tool_name
    accumulated = state.accumulated_json
    state.pending_tool_name = None
    state.accumulated_json = ""
    if tool_name is None or not accumulated:
        return False

    parsed = _parse_stream_tool_input(tool_name, accumulated, clean_name)
    if parsed is None:
        raise RuntimeError("claude CLI ended a tool-use block with malformed JSON input")
    return parsed


def _process_stream_event(
    stream_event: Mapping[str, object],
    stream_type: str,
    state: _StreamState,
    clean_name: str,
) -> bool:
    """Process one normalized stream event; return whether it triggers."""
    if stream_type == "content_block_start":
        return _stream_block_start(stream_event, state, clean_name)
    if stream_type == "content_block_delta":
        return _stream_block_delta(stream_event, state, clean_name)
    if stream_type == "content_block_stop":
        return _stream_block_stop(state, clean_name)
    return False


def _normalize_stream_event(
    event: Mapping[str, object],
) -> tuple[dict[str, object] | None, str]:
    event_type = _get_str(event, "type")
    if event_type == "stream_event":
        stream_event = _get_mapping(event, "event")
        stream_type = _get_str(stream_event, "type") if stream_event is not None else ""
        return stream_event, stream_type

    if event_type in {
        "content_block_start",
        "content_block_delta",
        "content_block_stop",
        "message_stop",
    }:
        return dict(event), event_type

    return None, ""



def _result_event_decision(event: Mapping[str, object]) -> _EventDecision:
    is_error = event.get("is_error")
    if is_error is not None and not isinstance(is_error, bool):
        raise RuntimeError("claude CLI result event has non-boolean is_error")
    if is_error is not True:
        return "no_trigger"

    status = event.get("api_error_status")
    message = event.get("result") or event.get("subtype") or "unknown error"
    prefix = f"claude CLI error {status}" if status else "claude CLI error"
    raise RuntimeError(f"{prefix}: {message}")


def _process_event(
    event: Mapping[str, object],
    state: _StreamState,
    clean_name: str,
) -> _EventDecision:
    """Inspect one validated CLI event and return a decisive result if present."""
    stream_event, stream_type = _normalize_stream_event(event)
    if stream_event is not None and stream_type:
        triggered = _process_stream_event(stream_event, stream_type, state, clean_name)
        return "trigger" if triggered else "continue"

    event_type = _get_str(event, "type")
    if event_type == "assistant":
        message = _get_mapping(event, "message")
        if message is None:
            return "continue"
        triggered = any(
            _tool_use_triggers(content_item, clean_name)
            for content_item in _iter_mapping_list(message.get("content"))
        )
        return "trigger" if triggered else "continue"

    if event_type == "result":
        return _result_event_decision(event)
    return "continue"


def _is_valid_skill_component(name: str) -> bool:
    if not 1 <= len(name) <= MAX_SKILL_NAME_LENGTH:
        return False
    if name.startswith("-") or name.endswith("-") or "--" in name:
        return False
    for char in name:
        if char == "-":
            continue
        if not char.isalnum():
            return False
        if char.isalpha() and char != char.lower():
            return False
    return True


def _validate_skill_name(skill_name: object) -> str:
    """Validate against the deployable skill name contract."""
    if not isinstance(skill_name, str) or not _is_valid_skill_component(skill_name):
        raise ValueError(
            "skill_name must be 1-64 lowercase alphanumeric/hyphen characters, "
            "without leading/trailing hyphens or consecutive hyphens"
        )
    return skill_name


def _validate_description(description: object) -> str:
    if not isinstance(description, str) or not description.strip():
        raise ValueError("description must be a non-empty string")
    if "\x00" in description:
        raise ValueError("description must not contain NUL characters")
    return description


def _validate_query(query: object, index: int) -> str:
    if not isinstance(query, str) or not query.strip():
        raise ValueError(f"eval item {index} has an invalid query")
    if "\x00" in query:
        raise ValueError(f"eval item {index} query must not contain NUL characters")
    return query


def _validate_model(model: object) -> str | None:
    if model is None:
        return None
    if not isinstance(model, str) or not model.strip():
        raise ValueError("model must be a non-empty string when provided")
    if "\x00" in model:
        raise ValueError("model must not contain NUL characters")
    if _SAFE_MODEL_RE.fullmatch(model) is None:
        raise ValueError("model contains characters outside [A-Za-z0-9._:/[]-]")
    return model


def _generated_skill_name(validated_name: str) -> str:
    """Build a unique, valid temporary skill name within the 64-char contract."""
    max_prefix = MAX_GENERATED_SKILL_NAME_LENGTH - GENERATED_SUFFIX_LENGTH
    prefix = validated_name[:max_prefix].rstrip("-")
    if not prefix:
        prefix = "eval"
    return f"{prefix}-skill-{uuid.uuid4().hex[:8]}"


def _yaml_double_quoted(value: str) -> str:
    """Render text as a YAML double-quoted scalar that cannot span or break lines."""
    quoted = json.dumps(value, ensure_ascii=False)
    return _YAML_ESCAPE_RE.sub(lambda match: f"\\u{ord(match.group()):04x}", quoted)


def _create_eval_project(
    skill_name: str,
    skill_description: str,
) -> tuple[Path, str]:
    """Create an isolated temporary Claude project containing one valid skill."""
    validated_name = _validate_skill_name(skill_name)
    validated_description = _validate_description(skill_description)
    clean_name = _generated_skill_name(validated_name)
    eval_project_root = Path(tempfile.mkdtemp(prefix="skill-activation-eval-"))
    skill_dir = eval_project_root / ".claude" / "skills" / clean_name
    skill_dir.mkdir(parents=True, exist_ok=False)

    skill_content = (
        "---\n"
        f"name: {json.dumps(clean_name, ensure_ascii=False)}\n"
        f"description: {_yaml_double_quoted(validated_description)}\n"
        "---\n\n"
        f"# {validated_name}\n\n"
        f"This skill handles: {validated_description}\n"
    )
    (skill_dir / SKILL_FILENAME).write_text(skill_content, encoding="utf-8")
    return eval_project_root, clean_name


def _build_claude_command(
    model: str | None,
    executable: str = "claude",
) -> list[str]:
    """Build the Claude CLI command for one trigger probe.

    The query is deliberately absent: it is delivered on stdin so that no
    shell (cmd.exe for Windows npm shims) ever parses external text.
    """
    command = [
        executable,
        "-p",
        "--output-format",
        "stream-json",
        "--verbose",
        "--include-partial-messages",
        "--setting-sources",
        "project",
    ]
    if model is not None:
        command.extend(["--model", model])
    return command


def _launch_claude(
    query: str,
    model: str | None,
    eval_project_root: Path,
    executable: str = "claude",
) -> subprocess.Popen[bytes]:
    """Launch Claude in the isolated project with bounded, inspectable pipes."""
    # REMEMBER_NESTED_SUMMARIZER makes the Remember plugin's hooks no-op in this
    # throwaway session, so parallel evals do not contend for its save lock.
    env = {
        **{key: value for key, value in os.environ.items() if key != "CLAUDECODE"},
        "REMEMBER_NESTED_SUMMARIZER": "1",
    }

    # Resolve npm shims (claude.cmd) to a full path so no shell is needed.
    command = _build_claude_command(model, shutil.which(executable) or executable)
    query_file = eval_project_root / QUERY_FILENAME
    query_file.write_text(query, encoding="utf-8")
    with query_file.open("rb") as stdin:
        if os.name == "nt":
            return subprocess.Popen(
                command,
                stdin=stdin,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=eval_project_root,
                env=env,
                shell=False,
                creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
            )

        return subprocess.Popen(
            command,
            stdin=stdin,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=eval_project_root,
            env=env,
            shell=False,
            start_new_session=True,
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


def _pump_stderr(stderr: IO[bytes], buffer: bytearray) -> None:
    """Capture only the tail of stderr so diagnostics cannot grow without bound."""
    while True:
        chunk = stderr.read(4096)
        if not chunk:
            return
        buffer.extend(chunk)
        if len(buffer) > STDERR_TAIL_BYTES:
            del buffer[:-STDERR_TAIL_BYTES]


def _stderr_text(buffer: bytearray) -> str:
    return bytes(buffer).decode("utf-8", errors="replace").strip()


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
        preview = line[:200]
        raise RuntimeError(f"claude CLI emitted malformed stream-json output: {preview!r}")
    return _process_event(event, stream_state, clean_name)


def _empty_queue_status(
    process: subprocess.Popen[bytes],
    exited_at: float | None,
) -> tuple[_QueueReadStatus, float | None]:
    """Classify an empty stdout queue while allowing a short post-exit drain."""
    if process.poll() is None:
        return "retry", exited_at

    now = time.monotonic()
    if exited_at is None:
        return "retry", now
    if now - exited_at >= EXIT_DRAIN_GRACE_SECONDS:
        return "eof", exited_at
    return "retry", exited_at


def _read_stream_queue(
    process: subprocess.Popen[bytes],
    line_queue: queue.Queue[bytes | None],
    wait_time: float,
    exited_at: float | None,
) -> tuple[_QueueReadStatus, bytes | None, float | None]:
    """Read one queued stdout line or classify the temporary absence of output."""
    try:
        return "line", line_queue.get(timeout=wait_time), exited_at
    except queue.Empty:
        status, next_exited_at = _empty_queue_status(process, exited_at)
        return status, None, next_exited_at


def _wait_for_trigger(
    process: subprocess.Popen[bytes],
    line_queue: queue.Queue[bytes | None],
    clean_name: str,
    deadline: float,
) -> _WaitResult:
    """Wait for a decisive event, EOF, or timeout without dropping buffered output."""
    stream_state = _StreamState()
    exited_at: float | None = None

    while True:
        now = time.monotonic()
        if now >= deadline:
            return "timeout" if process.poll() is None else "eof"

        status, raw_line, exited_at = _read_stream_queue(
            process,
            line_queue,
            min(0.25, deadline - now),
            exited_at,
        )
        if status == "retry":
            continue
        if status == "eof" or raw_line is None:
            return "eof"

        decision = _raw_line_decision(raw_line, stream_state, clean_name)
        if decision != "continue":
            return decision


def _format_process_error(
    message: str,
    stderr_buffer: bytearray,
) -> RuntimeError:
    stderr = _stderr_text(stderr_buffer)
    if stderr:
        return RuntimeError(f"{message}; stderr: {stderr}")
    return RuntimeError(message)



def _close_process_streams(
    stdout: IO[bytes],
    stderr: IO[bytes] | None,
    stdout_reader: threading.Thread,
    stderr_reader: threading.Thread | None,
) -> None:
    for stream in (stdout, stderr):
        close = getattr(stream, "close", None)
        if not callable(close):
            continue
        with contextlib.suppress(OSError):
            close()
    stdout_reader.join(timeout=1.0)
    if stderr_reader is not None:
        stderr_reader.join(timeout=1.0)


def _resolve_wait_result(
    result: _WaitResult,
    process: subprocess.Popen[bytes],
    timeout: int,
    stderr_buffer: bytearray,
) -> bool:
    if result == "trigger":
        return True
    if result == "no_trigger":
        return False
    if result == "timeout":
        stderr_text = _stderr_text(stderr_buffer)
        suffix = f"; stderr: {stderr_text}" if stderr_text else ""
        raise TimeoutError(f"trigger evaluation exceeded {timeout}s{suffix}")

    returncode = process.returncode
    if returncode not in (0, None):
        raise _format_process_error(
            f"claude CLI exited with status {returncode}",
            stderr_buffer,
        )
    raise _format_process_error(
        "claude CLI ended before emitting a terminal result event",
        stderr_buffer,
    )


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
    stdout_reader = threading.Thread(
        target=_pump_stdout,
        args=(stdout, line_queue),
        daemon=True,
    )
    stdout_reader.start()

    stderr_buffer = bytearray()
    stderr_reader: threading.Thread | None = None
    stderr = process.stderr
    if stderr is not None:
        stderr_reader = threading.Thread(
            target=_pump_stderr,
            args=(stderr, stderr_buffer),
            daemon=True,
        )
        stderr_reader.start()

    wait_error: RuntimeError | None = None
    try:
        result = _wait_for_trigger(
            process,
            line_queue,
            clean_name,
            time.monotonic() + timeout,
        )
    except RuntimeError as exc:
        result = "eof"
        wait_error = exc
    finally:
        _terminate_process_tree(process)
        _close_process_streams(stdout, stderr, stdout_reader, stderr_reader)

    if wait_error is not None:
        raise _format_process_error(str(wait_error), stderr_buffer)
    if stdout_reader.is_alive() or (stderr_reader is not None and stderr_reader.is_alive()):
        raise _format_process_error(
            "claude CLI stream reader did not shut down cleanly",
            stderr_buffer,
        )
    return _resolve_wait_result(result, process, timeout, stderr_buffer)



def _validate_positive_int(value: object, name: str) -> int:
    """Validate a dynamically supplied positive integer without accepting bool."""
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ValueError(f"{name} must be an integer >= 1")
    return value


def run_single_query(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    project_root: str,
    model: str | None = None,
    claude_executable: str = "claude",
) -> bool:
    """Run one query and return whether the isolated skill was triggered.

    ``project_root`` is retained for call compatibility. The actual evaluation
    deliberately runs in its own temporary project.
    """
    del project_root

    _validate_positive_int(timeout, "timeout")
    _validate_query(query, 0)
    _validate_skill_name(skill_name)
    _validate_description(skill_description)
    _validate_model(model)

    eval_project_root, clean_name = _create_eval_project(
        skill_name,
        skill_description,
    )
    try:
        process = _launch_claude(
            query,
            model,
            eval_project_root,
            executable=claude_executable,
        )
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


def _validate_eval_parameters(
    runs_per_query: object,
    trigger_threshold: object,
) -> None:
    _validate_positive_int(runs_per_query, "runs_per_query")

    if (
        isinstance(trigger_threshold, bool)
        or not isinstance(trigger_threshold, (int, float))
        or not math.isfinite(float(trigger_threshold))
        or not 0 < float(trigger_threshold) <= 1
    ):
        raise ValueError("trigger_threshold must be a finite number in (0, 1]")


def _parse_eval_set(
    value: object,
    runs_per_query: int,
    trigger_threshold: float,
) -> list[EvalItem]:
    """Validate external eval JSON and convert it to typed internal values."""
    _validate_eval_parameters(runs_per_query, trigger_threshold)

    if not isinstance(value, list):
        raise ValueError("eval set must be a JSON array")
    raw_items = cast(list[object], value)
    if not raw_items:
        raise ValueError("eval set must contain at least one query")

    validated: list[EvalItem] = []
    seen: set[str] = set()

    for index, raw_item in enumerate(raw_items):
        item = _string_key_mapping(raw_item)
        if item is None:
            raise ValueError(f"eval item {index} must be an object with string keys")

        unexpected = set(item).difference({"query", "should_trigger"})
        if unexpected:
            raise ValueError(
                f"eval item {index} has unexpected fields: {sorted(unexpected)}"
            )

        query = _validate_query(item.get("query"), index)
        should_trigger = item.get("should_trigger")
        if query in seen:
            raise ValueError(f"duplicate eval query: {query!r}")
        if not isinstance(should_trigger, bool):
            raise ValueError(f"eval item {index} should_trigger must be boolean")

        seen.add(query)
        validated.append({"query": query, "should_trigger": should_trigger})

    return validated


def _validate_eval_set(
    value: object,
    runs_per_query: int,
    trigger_threshold: float,
) -> list[EvalItem]:
    """Compatibility wrapper for callers of the former private helper name."""
    return _parse_eval_set(value, runs_per_query, trigger_threshold)


def _require_claude_cli() -> str:
    """Return the resolved claude executable or raise a clear prerequisite error."""
    path = shutil.which("claude")
    if not path:
        raise RuntimeError(
            "claude CLI not found on PATH; trigger evaluation is unavailable in this runtime"
        )
    return path



def _terminate_windows_process_tree(process: subprocess.Popen[bytes]) -> None:
    subprocess.run(
        ["taskkill", "/PID", str(process.pid), "/T", "/F"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


_GetProcessGroup = Callable[[int], int]
_KillProcessGroup = Callable[[int, int], None]
_POSIX_SIGKILL = 9


def _posix_getpgid() -> _GetProcessGroup | None:
    """Resolve the POSIX-only os.getpgid API without exposing platform-stub Unknown."""
    candidate = getattr(os, "getpgid", None)
    return cast(_GetProcessGroup, candidate) if callable(candidate) else None


def _posix_killpg() -> _KillProcessGroup | None:
    """Resolve the POSIX-only os.killpg API without exposing platform-stub Unknown."""
    candidate = getattr(os, "killpg", None)
    return cast(_KillProcessGroup, candidate) if callable(candidate) else None


def _process_group_id(process: subprocess.Popen[bytes]) -> int | None:
    getpgid = _posix_getpgid()
    if getpgid is None:
        return None

    pid = process.pid
    try:
        pgid = getpgid(pid)
    except OSError:
        return None
    return pgid if pgid == pid else None


def _signal_process_group(pgid: int, sig: int) -> bool:
    killpg = _posix_killpg()
    if killpg is None:
        return False
    try:
        killpg(pgid, sig)
    except OSError:
        return False
    return True


def _terminate_process_directly(process: subprocess.Popen[bytes]) -> None:
    try:
        process.terminate()
    except (AttributeError, OSError):
        with contextlib.suppress(OSError):
            process.kill()


def _terminate_posix_process_tree(process: subprocess.Popen[bytes]) -> None:
    pgid = _process_group_id(process)
    if pgid is not None and not _signal_process_group(pgid, int(signal.SIGTERM)):
        pgid = None

    if pgid is None:
        _terminate_process_directly(process)

    try:
        process.wait(timeout=2)
        return
    except subprocess.TimeoutExpired:
        pass

    try:
        if pgid is not None:
            _signal_process_group(pgid, _POSIX_SIGKILL)
        else:
            process.kill()
    except OSError:
        pass

    with contextlib.suppress(subprocess.TimeoutExpired):
        process.wait(timeout=5)


def _terminate_process_tree(process: subprocess.Popen[bytes]) -> None:
    """Terminate the launched CLI and descendants with bounded shutdown."""
    if process.poll() is not None:
        return
    if os.name == "nt":
        _terminate_windows_process_tree(process)
        return
    _terminate_posix_process_tree(process)


def _validate_run_eval_inputs(
    skill_name: object,
    description: object,
    num_workers: object,
    timeout: object,
    runs_per_query: object,
    trigger_threshold: object,
    model: object,
) -> None:
    _validate_skill_name(skill_name)
    _validate_description(description)
    _validate_model(model)
    _validate_eval_parameters(runs_per_query, trigger_threshold)

    _validate_positive_int(num_workers, "num_workers")
    _validate_positive_int(timeout, "timeout")


def _result_error_message(exc: BaseException) -> str:
    message = str(exc).strip()
    return message or exc.__class__.__name__


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
    """Run the full eval set and return deterministic, evidence-safe results."""
    _validate_run_eval_inputs(
        skill_name,
        description,
        num_workers,
        timeout,
        runs_per_query,
        trigger_threshold,
        model,
    )
    items = _validate_eval_set(eval_set, runs_per_query, trigger_threshold)
    claude_executable = _require_claude_cli()

    outcomes: list[list[bool | None]] = [
        [None] * runs_per_query for _ in items
    ]
    errors: list[list[str | None]] = [
        [None] * runs_per_query for _ in items
    ]

    max_workers = min(num_workers, len(items) * runs_per_query, MAX_POOL_WORKERS)
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        future_to_attempt: dict[Future[bool], _Attempt] = {}
        for item_index, item in enumerate(items):
            for run_index in range(runs_per_query):
                future = executor.submit(
                    run_single_query,
                    item["query"],
                    skill_name,
                    description,
                    timeout,
                    str(project_root),
                    model,
                    claude_executable,
                )
                future_to_attempt[future] = _Attempt(item_index, run_index)

        for future in as_completed(future_to_attempt):
            attempt = future_to_attempt[future]
            try:
                outcomes[attempt.item_index][attempt.run_index] = future.result()
            except (OSError, RuntimeError, subprocess.SubprocessError, ValueError) as exc:
                message = _result_error_message(exc)
                print(
                    f"Warning: query execution failed "
                    f"(item={attempt.item_index}, run={attempt.run_index + 1}): {message}",
                    file=sys.stderr,
                )
                errors[attempt.item_index][attempt.run_index] = message

    results: list[dict[str, object]] = []
    threshold = float(trigger_threshold)

    for item_index, item in enumerate(items):
        query_outcomes = outcomes[item_index]
        valid = [value for value in query_outcomes if value is not None]
        execution_errors = len(query_outcomes) - len(valid)
        trigger_count = sum(1 for value in valid if value is True)
        trigger_rate: float | None = (
            trigger_count / len(valid) if valid else None
        )
        should_trigger = item["should_trigger"]

        did_pass = bool(
            execution_errors == 0
            and trigger_rate is not None
            and (
                trigger_rate >= threshold
                if should_trigger
                else trigger_rate < threshold
            )
        )

        error_messages = [
            message for message in errors[item_index] if message is not None
        ]
        results.append(
            {
                "query": item["query"],
                "should_trigger": should_trigger,
                "trigger_rate": trigger_rate,
                "triggers": trigger_count,
                "runs": runs_per_query,
                "completed_runs": len(valid),
                "execution_errors": execution_errors,
                "error_messages": error_messages,
                "pass": did_pass,
            }
        )

    passed = sum(1 for result in results if result["pass"] is True)
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
    """Read an eval file as strict external JSON data."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise ValueError(f"cannot read eval set {path}: {exc}") from exc

    try:
        return json.loads(
            text,
            parse_constant=_reject_non_standard_json_constant,
        )
    except ValueError as exc:
        raise ValueError(f"invalid eval JSON in {path}: {exc}") from exc


def _positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("must be an integer") from exc
    if number < 1:
        raise argparse.ArgumentTypeError("must be >= 1")
    return number


def _trigger_threshold(value: str) -> float:
    try:
        number = float(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("must be a number") from exc
    if not math.isfinite(number) or not 0 < number <= 1:
        raise argparse.ArgumentTypeError("must be a finite number in (0, 1]")
    return number


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run trigger evaluation for a skill description"
    )
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--description", default=None, help="Override description to test")
    parser.add_argument(
        "--num-workers",
        type=_positive_int,
        default=10,
        help="Number of parallel workers",
    )
    parser.add_argument(
        "--timeout",
        type=_positive_int,
        default=30,
        help="Timeout per query in seconds",
    )
    parser.add_argument(
        "--runs-per-query",
        type=_positive_int,
        default=3,
        help="Number of runs per query",
    )
    parser.add_argument(
        "--trigger-threshold",
        type=_trigger_threshold,
        default=0.5,
        help="Trigger rate threshold",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model to use for claude -p (default: user's configured model)",
    )
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    return parser



def _emit_verbose_results(output: EvalOutput, description: str) -> None:
    summary = output["summary"]
    print(f"Evaluating: {description}", file=sys.stderr)
    print(
        f"Results: {summary['passed']}/{summary['total']} passed",
        file=sys.stderr,
    )
    for result in output["results"]:
        status = "PASS" if result.get("pass") is True else "FAIL"
        completed = result.get("completed_runs")
        rate_text = (
            f"{result.get('triggers')}/{completed}"
            if isinstance(completed, int) and completed > 0
            else "unavailable"
        )
        query = result.get("query")
        query_text = query if isinstance(query, str) else ""
        print(
            f"  [{status}] rate={rate_text} attempts={result.get('runs')} "
            f"expected={result.get('should_trigger')}: {query_text[:70]}",
            file=sys.stderr,
        )


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    eval_path = Path(cast(str, args.eval_set))
    skill_path = Path(cast(str, args.skill_path))
    skill_file = skill_path / SKILL_FILENAME
    if not skill_file.is_file():
        print(f"Error: No {SKILL_FILENAME} found at {skill_path}", file=sys.stderr)
        return 1

    try:
        raw_eval_set = _load_eval_json(eval_path)
        name, original_description, _content = parse_skill_md(skill_path)
        override_description = cast(str | None, args.description)
        description = (
            override_description
            if override_description is not None
            else original_description
        )
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
        _emit_verbose_results(output, description)

    print(json.dumps(output, indent=2, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
