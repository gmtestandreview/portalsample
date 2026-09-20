#!/usr/bin/env python3
"""Generate and serve a review page for eval results.

The viewer is an evidence-presentation layer. It discovers current run evidence,
embeds task-relevant outputs into a self-contained HTML page, optionally adds a
benchmark and previous-iteration context, and persists explicit human feedback.

The module is stdlib-only and supports Python 3.10+.
"""

from __future__ import annotations

import argparse
import base64
import errno
import hashlib
import json
import mimetypes
import os
import secrets
import sys
import tempfile
import threading
import webbrowser
from dataclasses import dataclass
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from socket import socket
from socketserver import BaseServer
from typing import TypeAlias, TypedDict, cast
from urllib.parse import urlsplit

TEXT_ENCODING = "utf-8"
JSON_CONTENT_TYPE = "application/json"
TRANSCRIPT_FILE = "transcript.md"
OUTPUTS_DIR_NAME = "outputs"
GRADING_FILE = "grading.json"
TIMING_FILE = "timing.json"
FEEDBACK_FILE = "feedback.json"
ERROR_READING_FILE = "(Error reading file)"
UNSAFE_PATH_MESSAGE = "(Skipped path that resolves outside the workspace)"
FILE_TOO_LARGE_MESSAGE = "(File too large to embed)"
EMBEDDED_DATA_MARKER = "/*__EMBEDDED_DATA__*/"
CSP_NONCE_MARKER = "__CSP_NONCE__"

MAX_FEEDBACK_BYTES = 1_000_000
MAX_EMBED_FILE_BYTES = 50 * 1024 * 1024
REQUEST_TIMEOUT_SECONDS = 15.0
SUPPORTED_FEEDBACK_STATUSES = frozenset({"in_progress", "complete"})
SKIP_DIRECTORIES = frozenset({"node_modules", ".git", "__pycache__", "skill", "inputs"})
METADATA_FILES = frozenset({TRANSCRIPT_FILE, "user_notes.md", "metrics.json"})

EvalId: TypeAlias = int | str

_feedback_write_lock = threading.Lock()


class EmbeddedFile(TypedDict, total=False):
    name: str
    type: str
    content: str
    mime: str
    data_uri: str
    data_b64: str


class Run(TypedDict):
    id: str
    prompt: str
    eval_id: EvalId | None
    outputs: list[EmbeddedFile]
    grading: dict[str, object] | None


class PreviousRun(TypedDict):
    feedback: str
    outputs: list[EmbeddedFile]


@dataclass(frozen=True, slots=True)
class CliOptions:
    workspace: Path
    port: int
    skill_name: str | None
    previous_workspace: Path | None
    benchmark: Path | None
    static_path: Path | None


TEXT_EXTENSIONS = {
    ".txt",
    ".md",
    ".json",
    ".csv",
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".yaml",
    ".yml",
    ".xml",
    ".html",
    ".css",
    ".sh",
    ".rb",
    ".go",
    ".rs",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".sql",
    ".r",
    ".toml",
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}

MIME_OVERRIDES = {
    ".svg": "image/svg+xml",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


def _reject_non_standard_json_constant(value: str) -> object:
    """Reject Python json's non-standard NaN/Infinity extensions."""
    raise ValueError(f"non-standard JSON numeric constant: {value}")


def _as_object_dict(value: object) -> dict[str, object] | None:
    """Narrow an unknown JSON value to a string-keyed object."""
    if not isinstance(value, dict):
        return None
    mapping = cast(dict[object, object], value)
    if not all(isinstance(key, str) for key in mapping):
        return None
    return {cast(str, key): item for key, item in mapping.items()}


def _read_json_object(path: Path) -> dict[str, object] | None:
    """Read a strict JSON object, returning None for invalid or unavailable data."""
    try:
        value: object = json.loads(
            path.read_text(encoding=TEXT_ENCODING),
            parse_constant=_reject_non_standard_json_constant,
        )
    except (OSError, ValueError):
        return None
    return _as_object_dict(value)


def _read_required_json_object(path: Path, *, label: str) -> dict[str, object]:
    """Read a required strict JSON object with a controlled error."""
    if not path.is_file():
        raise ValueError(f"{label} not found or not a file: {path}")
    data = _read_json_object(path)
    if data is None:
        raise ValueError(f"{label} must contain a valid JSON object: {path}")
    return data


def _extract_prompt(text: str) -> str:
    """Extract the Eval Prompt section without a complex regular expression."""
    marker = "## Eval Prompt\n\n"
    start = text.find(marker)
    if start < 0:
        return ""
    body = text[start + len(marker) :]
    end = body.find("\n##")
    return (body if end < 0 else body[:end]).strip()


def _coerce_eval_id(value: object) -> EvalId | None:
    """Accept schema-supported eval IDs while rejecting booleans/empty strings."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value:
        return value
    return None


def _is_within(path: Path, boundary: Path, *, strict: bool = True) -> bool:
    """Return whether *path* resolves inside *boundary*."""
    try:
        resolved_path = path.resolve(strict=strict)
        resolved_boundary = boundary.resolve(strict=True)
        resolved_path.relative_to(resolved_boundary)
    except (OSError, ValueError):
        return False
    return True


def _iter_ancestors_to_root(path: Path, root: Path) -> list[Path]:
    """Return path and ancestors up to root, nearest first."""
    result: list[Path] = []
    current = path
    while True:
        result.append(current)
        if current == root or current.parent == current:
            break
        current = current.parent
    return result


def _metadata_prompt(metadata: dict[str, object]) -> str | None:
    value = metadata.get("prompt")
    return value if isinstance(value, str) and value.strip() else None


def _load_metadata_fields(root: Path, run_dir: Path) -> tuple[str | None, EvalId | None]:
    prompt: str | None = None
    eval_id: EvalId | None = None
    for directory in _iter_ancestors_to_root(run_dir, root):
        metadata = _read_json_object(directory / "eval_metadata.json")
        if metadata is None:
            continue
        if prompt is None:
            prompt = _metadata_prompt(metadata)
        if eval_id is None:
            eval_id = _coerce_eval_id(metadata.get("eval_id"))
        if prompt is not None and eval_id is not None:
            break
    return prompt, eval_id


def _load_transcript_prompt(root: Path, run_dir: Path) -> str | None:
    candidates = (
        run_dir / TRANSCRIPT_FILE,
        run_dir / OUTPUTS_DIR_NAME / TRANSCRIPT_FILE,
    )
    for candidate in candidates:
        if not candidate.is_file() or not _is_within(candidate, root):
            continue
        try:
            extracted = _extract_prompt(candidate.read_text(encoding=TEXT_ENCODING))
        except OSError:
            continue
        if extracted:
            return extracted
    return None


def _load_prompt_and_eval_id(root: Path, run_dir: Path) -> tuple[str, EvalId | None]:
    """Load prompt and eval ID independently from metadata/transcript fallbacks."""
    prompt, eval_id = _load_metadata_fields(root, run_dir)
    if prompt is None:
        prompt = _load_transcript_prompt(root, run_dir)
    return prompt or "(No prompt found)", eval_id


def get_mime_type(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in MIME_OVERRIDES:
        return MIME_OVERRIDES[ext]
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "application/octet-stream"


def _error_file(name: str, message: str = ERROR_READING_FILE) -> EmbeddedFile:
    return {"name": name, "type": "error", "content": message}


def _safe_file_size(path: Path) -> int | None:
    try:
        return path.stat().st_size
    except OSError:
        return None


def _read_base64(path: Path) -> str | None:
    size = _safe_file_size(path)
    if size is None or size > MAX_EMBED_FILE_BYTES:
        return None
    try:
        return base64.b64encode(path.read_bytes()).decode("ascii")
    except OSError:
        return None


def _make_data_uri(mime: str, b64: str) -> str:
    return f"data:{mime};base64,{b64}"


def embed_file(
    path: Path,
    *,
    display_name: str | None = None,
    allowed_root: Path | None = None,
) -> EmbeddedFile:
    """Read a file and return an embedded representation."""
    name = display_name or path.name

    if allowed_root is not None and not _is_within(path, allowed_root):
        return _error_file(name, UNSAFE_PATH_MESSAGE)

    size = _safe_file_size(path)
    if size is None:
        return _error_file(name)
    if size > MAX_EMBED_FILE_BYTES:
        return _error_file(name, FILE_TOO_LARGE_MESSAGE)

    ext = path.suffix.lower()
    mime = get_mime_type(path)

    if ext in TEXT_EXTENSIONS:
        try:
            content = path.read_text(encoding=TEXT_ENCODING, errors="replace")
        except OSError:
            return _error_file(name)
        return {"name": name, "type": "text", "content": content}

    b64 = _read_base64(path)
    if b64 is None:
        return _error_file(name)

    if ext in IMAGE_EXTENSIONS:
        return {
            "name": name,
            "type": "image",
            "mime": mime,
            "data_uri": _make_data_uri(mime, b64),
        }
    if ext == ".pdf":
        return {
            "name": name,
            "type": "pdf",
            "data_uri": _make_data_uri(mime, b64),
        }
    if ext == ".xlsx":
        return {"name": name, "type": "xlsx", "data_b64": b64}

    return {
        "name": name,
        "type": "binary",
        "mime": mime,
        "data_uri": _make_data_uri(mime, b64),
    }


def _sorted_children(directory: Path, *, reverse: bool = False) -> list[Path]:
    try:
        return sorted(directory.iterdir(), key=lambda path: path.name, reverse=reverse)
    except OSError:
        return []


def _relative_output_name(child: Path, outputs_dir: Path) -> str | None:
    try:
        return child.relative_to(outputs_dir).as_posix()
    except ValueError:
        return None


def _symlink_output_entry(
    child: Path,
    display_name: str,
    workspace_root: Path,
) -> tuple[Path, str, str | None] | None:
    if not _is_within(child, workspace_root):
        return child, display_name, UNSAFE_PATH_MESSAGE
    try:
        resolved = child.resolve(strict=True)
    except OSError:
        return child, display_name, ERROR_READING_FILE
    if resolved.is_dir():
        # Never recurse through directory symlinks: avoids cycles and preserves
        # discovery rooted in the physical workspace tree.
        return None
    return child, display_name, None


def _visit_output_child(
    child: Path,
    *,
    outputs_dir: Path,
    workspace_root: Path,
    stack: list[Path],
) -> tuple[Path, str, str | None] | None:
    display_name = _relative_output_name(child, outputs_dir)
    if display_name is None:
        return None
    if child.name in METADATA_FILES and child.parent == outputs_dir:
        return None
    if child.is_symlink():
        return _symlink_output_entry(child, display_name, workspace_root)
    if child.is_dir():
        if _is_within(child, workspace_root):
            stack.append(child)
        return None
    if child.is_file():
        return child, display_name, None
    return None


def _walk_output_entries(
    outputs_dir: Path,
    workspace_root: Path,
) -> list[tuple[Path, str, str | None]]:
    """Return safe output files plus explicit entries for unsafe/unreadable paths."""
    if not outputs_dir.is_dir() or not _is_within(outputs_dir, workspace_root):
        return []

    entries: list[tuple[Path, str, str | None]] = []
    stack: list[Path] = [outputs_dir]
    while stack:
        directory = stack.pop()
        for child in _sorted_children(directory):
            entry = _visit_output_child(
                child,
                outputs_dir=outputs_dir,
                workspace_root=workspace_root,
                stack=stack,
            )
            if entry is not None:
                entries.append(entry)

    entries.sort(key=lambda item: item[1])
    return entries


def _collect_output_files(outputs_dir: Path, workspace_root: Path) -> list[EmbeddedFile]:
    files: list[EmbeddedFile] = []
    for path, display_name, error in _walk_output_entries(outputs_dir, workspace_root):
        if error is not None:
            files.append(_error_file(display_name, error))
        else:
            files.append(
                embed_file(
                    path,
                    display_name=display_name,
                    allowed_root=workspace_root,
                )
            )
    return files


def _load_grading(run_dir: Path) -> dict[str, object] | None:
    """Load grading from the run first, with one legacy parent fallback."""
    for candidate in (run_dir / GRADING_FILE, run_dir.parent / GRADING_FILE):
        data = _read_json_object(candidate)
        if data is not None:
            return data
    return None


def _parse_prefixed_index(name: str, prefix: str) -> int | None:
    expected = f"{prefix}-"
    if not name.startswith(expected):
        return None
    suffix = name[len(expected) :]
    return int(suffix) if suffix.isdecimal() else None


def _looks_like_run_dir(path: Path) -> bool:
    """Recognize normal run-N directories and legacy evidence directories."""
    if _parse_prefixed_index(path.name, "run") is not None:
        return True
    return (
        (path / OUTPUTS_DIR_NAME).is_dir()
        or (path / TRANSCRIPT_FILE).is_file()
        or (path / GRADING_FILE).is_file()
        or (path / TIMING_FILE).is_file()
    )


def _is_discoverable_directory(path: Path, root: Path) -> bool:
    return (
        path.is_dir()
        and path.name not in SKIP_DIRECTORIES
        and not path.is_symlink()
        and _is_within(path, root)
    )


def _discover_run_dirs(root: Path) -> list[Path]:
    """Discover run directories without following directory symlinks."""
    discovered: list[Path] = []
    stack: list[Path] = [root]

    while stack:
        current = stack.pop()
        if not current.is_dir() or not _is_within(current, root):
            continue
        if current != root and _looks_like_run_dir(current):
            discovered.append(current)
            continue
        stack.extend(
            child
            for child in _sorted_children(current, reverse=True)
            if _is_discoverable_directory(child, root)
        )

    return discovered


def _base_run_id(root: Path, run_dir: Path) -> str:
    """Preserve the historical flattened ID for ordinary non-colliding paths."""
    relative = run_dir.relative_to(root)
    return str(relative).replace("/", "-").replace("\\", "-")


def _assign_run_ids(root: Path, run_dirs: list[Path]) -> dict[Path, str]:
    """Preserve legacy IDs unless deterministic disambiguation is necessary."""
    by_base: dict[str, list[Path]] = {}
    for run_dir in run_dirs:
        by_base.setdefault(_base_run_id(root, run_dir), []).append(run_dir)

    assigned: dict[Path, str] = {}
    used: set[str] = set()

    for base in sorted(by_base):
        paths = sorted(by_base[base], key=lambda path: path.relative_to(root).as_posix())
        if len(paths) == 1 and base not in used:
            assigned[paths[0]] = base
            used.add(base)
            continue

        for path in paths:
            relative = path.relative_to(root).as_posix()
            digest = hashlib.sha256(relative.encode(TEXT_ENCODING)).hexdigest()[:12]
            candidate = f"{base}--{digest}"
            counter = 2
            while candidate in used:
                candidate = f"{base}--{digest}-{counter}"
                counter += 1
            assigned[path] = candidate
            used.add(candidate)

    return assigned


def build_run(
    root: Path,
    run_dir: Path,
    *,
    run_id: str | None = None,
) -> Run:
    """Build one viewer run while preserving independent evidence fallbacks."""
    prompt, eval_id = _load_prompt_and_eval_id(root, run_dir)
    return {
        "id": run_id if run_id is not None else _base_run_id(root, run_dir),
        "prompt": prompt,
        "eval_id": eval_id,
        "outputs": _collect_output_files(run_dir / OUTPUTS_DIR_NAME, root),
        "grading": _load_grading(run_dir),
    }


def _eval_id_sort_key(eval_id: EvalId | None) -> tuple[int, object]:
    if isinstance(eval_id, int):
        return 0, eval_id
    if isinstance(eval_id, str):
        return 1, eval_id
    return 2, ""


def _config_sort_key(name: str) -> tuple[int, str]:
    priority = {
        "with_skill": 0,
        "new_skill": 0,
        "without_skill": 1,
        "old_skill": 1,
    }
    return priority.get(name, 2), name


def _run_sort_key(root: Path, run_dir: Path, run: Run) -> tuple[object, ...]:
    relative = run_dir.relative_to(root)
    parts = relative.parts
    config = run_dir.parent.name if len(parts) >= 2 else ""
    run_number = _parse_prefixed_index(run_dir.name, "run")
    return (
        *_eval_id_sort_key(run["eval_id"]),
        *_config_sort_key(config),
        run_number is None,
        run_number if run_number is not None else 0,
        relative.as_posix(),
    )


def find_runs(workspace: Path) -> list[Run]:
    """Discover viewer runs deterministically, including failed run-N directories."""
    root = workspace.resolve()
    if not root.is_dir():
        return []

    run_dirs = _discover_run_dirs(root)
    run_ids = _assign_run_ids(root, run_dirs)

    entries: list[tuple[Path, Run]] = [
        (run_dir, build_run(root, run_dir, run_id=run_ids[run_dir]))
        for run_dir in run_dirs
    ]
    entries.sort(key=lambda item: _run_sort_key(root, item[0], item[1]))
    return [run for _, run in entries]


def _load_feedback_map(path: Path) -> dict[str, str]:
    """Return only explicit non-blank feedback from an existing artifact."""
    data = _read_json_object(path)
    if data is None:
        return {}

    reviews = data.get("reviews")
    if not isinstance(reviews, list):
        return {}

    feedback: dict[str, str] = {}
    for item in cast(list[object], reviews):
        review = _as_object_dict(item)
        if review is None:
            continue
        run_id = review.get("run_id")
        text = review.get("feedback")
        if isinstance(run_id, str) and run_id and isinstance(text, str) and text.strip():
            feedback[run_id] = text
    return feedback


def load_previous_iteration(workspace: Path) -> dict[str, PreviousRun]:
    """Load previous outputs and explicit prior feedback as historical context."""
    feedback_map = _load_feedback_map(workspace / FEEDBACK_FILE)
    result: dict[str, PreviousRun] = {}

    for run in find_runs(workspace):
        result[run["id"]] = {
            "feedback": feedback_map.get(run["id"], ""),
            "outputs": run["outputs"],
        }

    for run_id, feedback in feedback_map.items():
        result.setdefault(run_id, {"feedback": feedback, "outputs": []})

    return result


def _json_for_script(data: object) -> str:
    """Serialize JSON so data cannot terminate the surrounding script element."""
    return (
        json.dumps(data, allow_nan=False)
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


def generate_html(
    runs: list[Run],
    skill_name: str,
    previous: dict[str, PreviousRun] | None = None,
    benchmark: dict[str, object] | None = None,
) -> str:
    """Generate a self-contained review page from the viewer template."""
    template_path = Path(__file__).parent / "viewer.html"
    template = template_path.read_text(encoding=TEXT_ENCODING)

    marker_count = template.count(EMBEDDED_DATA_MARKER)
    if marker_count != 1:
        raise ValueError(
            f"viewer template must contain exactly one {EMBEDDED_DATA_MARKER!r}; "
            f"found {marker_count}"
        )

    previous_feedback: dict[str, str] = {}
    previous_outputs: dict[str, list[EmbeddedFile]] = {}
    if previous:
        for run_id, data in previous.items():
            if data["feedback"].strip():
                previous_feedback[run_id] = data["feedback"]
            if data["outputs"]:
                previous_outputs[run_id] = data["outputs"]

    embedded: dict[str, object] = {
        "skill_name": skill_name,
        "runs": runs,
        "previous_feedback": previous_feedback,
        "previous_outputs": previous_outputs,
    }
    if benchmark is not None:
        embedded["benchmark"] = benchmark

    nonce = secrets.token_urlsafe(16)
    return template.replace(CSP_NONCE_MARKER, nonce).replace(
        EMBEDDED_DATA_MARKER,
        f"const EMBEDDED_DATA = {_json_for_script(embedded)};",
    )


def _parse_iso_datetime(value: str) -> bool:
    """Validate an ISO-8601 date-time string without adding dependencies."""
    from datetime import datetime

    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return False
    return parsed.tzinfo is not None


def _utc_now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _feedback_status(data: dict[str, object]) -> str:
    status = data.get("status", "in_progress")
    if not isinstance(status, str) or status not in SUPPORTED_FEEDBACK_STATUSES:
        raise ValueError("feedback status must be 'in_progress' or 'complete'")
    return status


def _feedback_timestamp(value: object) -> str:
    if value is None:
        return _utc_now_iso()
    if not isinstance(value, str) or not _parse_iso_datetime(value):
        raise ValueError("review.timestamp must be an offset-aware ISO-8601 date-time")
    return value


def _normalize_feedback_review(
    item: object,
    *,
    allowed_run_ids: set[str] | None,
    seen_run_ids: set[str],
) -> dict[str, object]:
    review = _as_object_dict(item)
    if review is None:
        raise ValueError("each feedback review must be a JSON object")

    unexpected = set(review).difference({"run_id", "feedback", "timestamp"})
    if unexpected:
        raise ValueError(f"unexpected review fields: {sorted(unexpected)}")

    run_id = review.get("run_id")
    feedback = review.get("feedback")
    if not isinstance(run_id, str) or not run_id:
        raise ValueError("review.run_id must be a non-empty string")
    if run_id in seen_run_ids:
        raise ValueError(f"duplicate review.run_id: {run_id}")
    if allowed_run_ids is not None and run_id not in allowed_run_ids:
        raise ValueError(f"unknown review.run_id for this workspace: {run_id}")
    if not isinstance(feedback, str):
        raise ValueError("review.feedback must be a string")

    seen_run_ids.add(run_id)
    return {
        "run_id": run_id,
        "feedback": feedback,
        "timestamp": _feedback_timestamp(review.get("timestamp")),
    }


def _normalize_feedback_payload(
    data: dict[str, object],
    *,
    allowed_run_ids: set[str] | None,
) -> dict[str, object]:
    """Validate feedback and normalize legacy omissions conservatively."""
    unexpected = set(data).difference({"reviews", "status"})
    if unexpected:
        raise ValueError(f"unexpected feedback fields: {sorted(unexpected)}")

    reviews_value = data.get("reviews")
    if not isinstance(reviews_value, list):
        raise ValueError("feedback must contain a 'reviews' list")

    seen_run_ids: set[str] = set()
    normalized_reviews = [
        _normalize_feedback_review(
            item,
            allowed_run_ids=allowed_run_ids,
            seen_run_ids=seen_run_ids,
        )
        for item in cast(list[object], reviews_value)
    ]
    return {"reviews": normalized_reviews, "status": _feedback_status(data)}


def _default_feedback_payload() -> dict[str, object]:
    return {"reviews": [], "status": "in_progress"}


def _atomic_write_json(path: Path, data: dict[str, object]) -> None:
    """Atomically replace a JSON file so concurrent readers never see a partial write."""
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, indent=2, allow_nan=False) + "\n"

    temp_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding=TEXT_ENCODING,
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as stream:
            temp_name = stream.name
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        Path(temp_name).replace(path)
    finally:
        if temp_name is not None:
            try:
                Path(temp_name).unlink(missing_ok=True)
            except OSError:
                pass


def _origin_allowed(origin: str | None) -> bool:
    """Allow same-machine browser origins; reject cross-site localhost POSTs."""
    if origin is None:
        return True
    try:
        parsed = urlsplit(origin)
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and parsed.hostname in {
        "localhost",
        "127.0.0.1",
        "::1",
    }


def _load_benchmark(path: Path | None) -> dict[str, object] | None:
    if path is None:
        return None
    data = _read_required_json_object(path, label="benchmark")
    # Minimal shape check: keep the renderer permissive for legacy benchmark fields,
    # but reject a wrong-root or unrelated JSON object supplied as --benchmark.
    for required in ("metadata", "runs", "run_summary"):
        if required not in data:
            raise ValueError(f"benchmark missing required field: {required}")
    if not isinstance(data["runs"], list):
        raise ValueError("benchmark.runs must be a list")
    if not isinstance(data["metadata"], dict) or not isinstance(data["run_summary"], dict):
        raise ValueError("benchmark metadata/run_summary must be JSON objects")
    return data


class ReviewHandler(BaseHTTPRequestHandler):
    """Serve review HTML and persist explicit feedback on loopback."""

    def __init__(
        self,
        workspace: Path,
        skill_name: str,
        feedback_path: Path,
        previous: dict[str, PreviousRun],
        benchmark_path: Path | None,
        request: socket,
        client_address: tuple[str, int],
        server: BaseServer,
    ) -> None:
        self.workspace = workspace
        self.skill_name = skill_name
        self.feedback_path = feedback_path
        self.previous = previous
        self.benchmark_path = benchmark_path
        super().__init__(request, client_address, server)

    def setup(self) -> None:
        super().setup()
        self.connection.settimeout(REQUEST_TIMEOUT_SECONDS)

    def _send_bytes(
        self,
        content: bytes,
        *,
        content_type: str,
        status: int = 200,
    ) -> None:
        try:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
        except (BrokenPipeError, ConnectionResetError, TimeoutError):
            return

    def _send_json(self, payload: dict[str, object], *, status: int = 200) -> None:
        content = json.dumps(payload, allow_nan=False).encode(TEXT_ENCODING)
        self._send_bytes(content, content_type=JSON_CONTENT_TYPE, status=status)

    def do_GET(self) -> None:
        if self.path in {"/", "/index.html"}:
            try:
                benchmark = _load_benchmark(self.benchmark_path)
                html = generate_html(
                    find_runs(self.workspace),
                    self.skill_name,
                    self.previous,
                    benchmark,
                )
            except (OSError, ValueError) as exc:
                self._send_json({"error": str(exc)}, status=500)
                return
            self._send_bytes(
                html.encode(TEXT_ENCODING),
                content_type="text/html; charset=utf-8",
            )
            return

        if self.path == "/api/feedback":
            try:
                allowed_run_ids = {run["id"] for run in find_runs(self.workspace)}
                if self.feedback_path.is_file():
                    data = _read_required_json_object(
                        self.feedback_path,
                        label="feedback",
                    )
                    normalized = _normalize_feedback_payload(
                        data,
                        allowed_run_ids=allowed_run_ids,
                    )
                else:
                    normalized = _default_feedback_payload()
                content = json.dumps(
                    normalized,
                    allow_nan=False,
                ).encode(TEXT_ENCODING)
            except ValueError as exc:
                self._send_json({"error": str(exc)}, status=500)
                return
            self._send_bytes(content, content_type=JSON_CONTENT_TYPE)
            return

        self.send_error(404)

    def do_POST(self) -> None:
        if self.path != "/api/feedback":
            self.send_error(404)
            return

        if not _origin_allowed(self.headers.get("Origin")):
            self._send_json({"error": "Origin is not allowed"}, status=403)
            return

        if self.headers.get_content_type() != JSON_CONTENT_TYPE:
            self._send_json(
                {"error": "Content-Type must be application/json"},
                status=415,
            )
            return

        raw_length = self.headers.get("Content-Length")
        if raw_length is None:
            self._send_json({"error": "Content-Length is required"}, status=411)
            return

        try:
            length = int(raw_length)
        except ValueError:
            self._send_json({"error": "Invalid Content-Length"}, status=400)
            return

        if length < 0:
            self._send_json({"error": "Content-Length must be non-negative"}, status=400)
            return
        if length > MAX_FEEDBACK_BYTES:
            self._send_json({"error": "Feedback payload is too large"}, status=413)
            return

        try:
            body = self.rfile.read(length)
            raw: object = json.loads(
                body,
                parse_constant=_reject_non_standard_json_constant,
            )
            data = _as_object_dict(raw)
            if data is None:
                raise ValueError("feedback payload must be a JSON object")

            allowed_run_ids = {run["id"] for run in find_runs(self.workspace)}
            normalized = _normalize_feedback_payload(
                data,
                allowed_run_ids=allowed_run_ids,
            )
            with _feedback_write_lock:
                _atomic_write_json(self.feedback_path, normalized)
        except (OSError, ValueError) as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json({"ok": True})

    def log_message(self, format: str, *args: object) -> None:
        """Suppress normal request logging to keep CLI output focused."""


class ReviewHTTPServer(ThreadingHTTPServer):
    """Loopback review server that does not block shutdown on client threads."""

    daemon_threads = True


def _port_number(value: str) -> int:
    try:
        port = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("port must be an integer") from exc
    if not 0 <= port <= 65535:
        raise argparse.ArgumentTypeError("port must be between 0 and 65535")
    return port


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate and serve eval review")
    parser.add_argument("workspace", type=Path, help="Path to workspace directory")
    parser.add_argument(
        "--port",
        "-p",
        type=_port_number,
        default=3117,
        help="Server port (default: 3117; 0 asks the OS for an ephemeral port)",
    )
    parser.add_argument(
        "--skill-name",
        "-n",
        type=str,
        default=None,
        help="Skill name for header",
    )
    parser.add_argument(
        "--previous-workspace",
        type=Path,
        default=None,
        help="Previous iteration workspace used only as historical context",
    )
    parser.add_argument(
        "--benchmark",
        type=Path,
        default=None,
        help="Path to benchmark.json to show in the Benchmark tab",
    )
    parser.add_argument(
        "--static",
        "-s",
        type=Path,
        default=None,
        help="Write standalone HTML to this path instead of starting a server",
    )
    return parser


def _parse_cli_options(argv: list[str] | None = None) -> CliOptions:
    args = _build_parser().parse_args(argv)
    return CliOptions(
        workspace=cast(Path, args.workspace),
        port=cast(int, args.port),
        skill_name=cast(str | None, args.skill_name),
        previous_workspace=cast(Path | None, args.previous_workspace),
        benchmark=cast(Path | None, args.benchmark),
        static_path=cast(Path | None, args.static),
    )


def _load_previous_workspace(path: Path | None) -> tuple[Path | None, dict[str, PreviousRun]]:
    if path is None:
        return None, {}
    resolved = path.resolve()
    if not resolved.is_dir():
        raise ValueError(f"previous workspace is not a directory: {resolved}")
    return resolved, load_previous_iteration(resolved)


def _write_static_viewer(
    path: Path,
    runs: list[Run],
    skill_name: str,
    previous: dict[str, PreviousRun],
    benchmark: dict[str, object] | None,
) -> int:
    try:
        html = generate_html(runs, skill_name, previous, benchmark)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding=TEXT_ENCODING)
    except (OSError, ValueError) as exc:
        print(f"Error writing static viewer: {exc}", file=sys.stderr)
        return 1

    print(f"\n  Static viewer written to: {path}\n")
    return 0


def _create_server(
    workspace: Path,
    skill_name: str,
    feedback_path: Path,
    previous: dict[str, PreviousRun],
    benchmark_path: Path | None,
    port: int,
) -> ReviewHTTPServer:
    handler = partial(
        ReviewHandler,
        workspace,
        skill_name,
        feedback_path,
        previous,
        benchmark_path,
    )
    try:
        return ReviewHTTPServer(("127.0.0.1", port), handler)
    except OSError as exc:
        if exc.errno not in {errno.EADDRINUSE, errno.EACCES}:
            raise
        print(
            f"Warning: unable to bind requested port {port}; using an ephemeral port",
            file=sys.stderr,
        )
        return ReviewHTTPServer(("127.0.0.1", 0), handler)


def _print_server_banner(
    *,
    url: str,
    workspace: Path,
    feedback_path: Path,
    previous_workspace: Path | None,
    previous_count: int,
    benchmark_path: Path | None,
) -> None:
    print("\n  Eval Viewer")
    print("  ─────────────────────────────────")
    print(f"  URL:       {url}")
    print(f"  Workspace: {workspace}")
    print(f"  Feedback:  {feedback_path}")
    if previous_workspace is not None:
        print(f"  Previous:  {previous_workspace} ({previous_count} runs)")
    if benchmark_path is not None:
        print(f"  Benchmark: {benchmark_path}")
    print("\n  Press Ctrl+C to stop.\n")


def _serve_review(
    workspace: Path,
    skill_name: str,
    feedback_path: Path,
    previous: dict[str, PreviousRun],
    previous_workspace: Path | None,
    benchmark_path: Path | None,
    port: int,
) -> int:
    try:
        server = _create_server(
            workspace,
            skill_name,
            feedback_path,
            previous,
            benchmark_path,
            port,
        )
    except OSError as exc:
        print(f"Unable to start review server: {exc}", file=sys.stderr)
        return 1

    bound_address = cast(tuple[str, int], server.server_address)
    bound_port = bound_address[1]
    url = f"http://localhost:{bound_port}"

    _print_server_banner(
        url=url,
        workspace=workspace,
        feedback_path=feedback_path,
        previous_workspace=previous_workspace,
        previous_count=len(previous),
        benchmark_path=benchmark_path,
    )
    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


def main(argv: list[str] | None = None) -> int:
    options = _parse_cli_options(argv)
    workspace = options.workspace.resolve()
    if not workspace.is_dir():
        print(f"Error: {workspace} is not a directory", file=sys.stderr)
        return 1

    runs = find_runs(workspace)
    if not runs:
        print(f"No runs found in {workspace}", file=sys.stderr)
        return 1

    skill_name = options.skill_name or workspace.name.replace("-workspace", "")
    feedback_path = workspace / FEEDBACK_FILE

    try:
        previous_workspace, previous = _load_previous_workspace(
            options.previous_workspace
        )
        benchmark_path = (
            options.benchmark.resolve()
            if options.benchmark is not None
            else None
        )
        benchmark = _load_benchmark(benchmark_path)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if options.static_path is not None:
        return _write_static_viewer(
            options.static_path,
            runs,
            skill_name,
            previous,
            benchmark,
        )

    return _serve_review(
        workspace,
        skill_name,
        feedback_path,
        previous,
        previous_workspace,
        benchmark_path,
        options.port,
    )


if __name__ == "__main__":
    raise SystemExit(main())
