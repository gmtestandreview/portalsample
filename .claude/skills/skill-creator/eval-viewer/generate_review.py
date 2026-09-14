#!/usr/bin/env python3
"""Generate and serve a review page for eval results.

Reads the workspace directory, discovers runs (directories with outputs/),
embeds all output data into a self-contained HTML page, and serves it via
a tiny HTTP server. Feedback auto-saves to feedback.json in the workspace.

Usage:
    python generate_review.py <workspace-path> [--port PORT] [--skill-name NAME]
    python generate_review.py <workspace-path> --previous-workspace /path/to/old/workspace

No dependencies beyond the Python stdlib are required.
"""

import argparse
import base64
import json
import mimetypes
import sys
from socket import socket
from socketserver import BaseServer
import webbrowser
from functools import partial
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import TypedDict, cast



TRANSCRIPT_FILE = "transcript.md"
ERROR_READING_FILE = "(Error reading file)"
EMBEDDED_DATA_MARKER = "/*__EMBEDDED_DATA__*/"


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
    eval_id: int | None
    outputs: list[EmbeddedFile]
    grading: object | None


class PreviousRun(TypedDict):
    feedback: str
    outputs: list[EmbeddedFile]


def _read_json_object(path: Path) -> dict[str, object] | None:
    """Read a JSON object, returning None for missing/invalid/non-object data."""
    try:
        value: object = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    return _as_object_dict(value)


def _extract_prompt(text: str) -> str:
    """Extract the Eval Prompt section without relying on a complex regex."""
    marker = "## Eval Prompt\n\n"
    start = text.find(marker)
    if start < 0:
        return ""
    body = text[start + len(marker) :]
    end = body.find("\n##")
    return (body if end < 0 else body[:end]).strip()


def _coerce_eval_id(value: object) -> int | None:
    """Accept integer eval IDs while rejecting booleans and malformed values."""
    return value if isinstance(value, int) and not isinstance(value, bool) else None


def _as_object_dict(value: object) -> dict[str, object] | None:
    """Narrow an unknown JSON object to a string-keyed mapping at the boundary."""
    if not isinstance(value, dict):
        return None
    mapping = cast(dict[object, object], value)
    if not all(isinstance(key, str) for key in mapping):
        return None
    return {key: item for key, item in mapping.items() if isinstance(key, str)}


def _load_feedback_map(path: Path) -> dict[str, str]:
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
        if isinstance(run_id, str) and isinstance(text, str) and text.strip():
            feedback[run_id] = text
    return feedback


def _load_optional_json_object(path: Path | None) -> dict[str, object] | None:
    return _read_json_object(path) if path is not None else None


# Files to exclude from output listings
METADATA_FILES = {TRANSCRIPT_FILE, "user_notes.md", "metrics.json"}

# Extensions we render as inline text
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

# Extensions we render as inline images
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}

# MIME type overrides for common types
MIME_OVERRIDES = {
    ".svg": "image/svg+xml",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


def get_mime_type(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in MIME_OVERRIDES:
        return MIME_OVERRIDES[ext]
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "application/octet-stream"


def find_runs(workspace: Path) -> list[Run]:
    """Recursively find directories that contain an outputs/ subdirectory."""
    runs: list[Run] = []
    _find_runs_recursive(workspace, workspace, runs)
    runs.sort(
        key=lambda run: (
            run["eval_id"] is None,
            run["eval_id"] if run["eval_id"] is not None else 0,
            run["id"],
        )
    )
    return runs


def _find_runs_recursive(root: Path, current: Path, runs: list[Run]) -> None:
    if not current.is_dir():
        return

    outputs_dir = current / "outputs"
    if outputs_dir.is_dir():
        run = build_run(root, current)
        if run:
            runs.append(run)
        return

    skip = {"node_modules", ".git", "__pycache__", "skill", "inputs"}
    for child in sorted(current.iterdir()):
        if child.is_dir() and child.name not in skip:
            _find_runs_recursive(root, child, runs)


def _load_prompt_and_eval_id(run_dir: Path) -> tuple[str, int | None]:
    for candidate in (run_dir / "eval_metadata.json", run_dir.parent / "eval_metadata.json"):
        metadata = _read_json_object(candidate)
        if metadata is None:
            continue
        prompt_value = metadata.get("prompt")
        prompt = prompt_value if isinstance(prompt_value, str) else ""
        eval_id = _coerce_eval_id(metadata.get("eval_id"))
        if prompt:
            return prompt, eval_id

    for candidate in (run_dir / TRANSCRIPT_FILE, run_dir / "outputs" / TRANSCRIPT_FILE):
        try:
            prompt = _extract_prompt(candidate.read_text(encoding="utf-8"))
        except OSError:
            continue
        if prompt:
            return prompt, None

    return "(No prompt found)", None


def _collect_output_files(outputs_dir: Path) -> list[EmbeddedFile]:
    if not outputs_dir.is_dir():
        return []
    return [
        embed_file(path)
        for path in sorted(outputs_dir.iterdir())
        if path.is_file() and path.name not in METADATA_FILES
    ]


def _load_grading(run_dir: Path) -> object | None:
    for candidate in (run_dir / "grading.json", run_dir.parent / "grading.json"):
        data = _read_json_object(candidate)
        if data:
            return data
    return None


def build_run(root: Path, run_dir: Path) -> Run:
    """Build a typed run record with prompt, outputs, and grading data."""
    prompt, eval_id = _load_prompt_and_eval_id(run_dir)
    return {
        "id": str(run_dir.relative_to(root)).replace("/", "-").replace("\\", "-"),
        "prompt": prompt,
        "eval_id": eval_id,
        "outputs": _collect_output_files(run_dir / "outputs"),
        "grading": _load_grading(run_dir),
    }


def _error_file(path: Path) -> EmbeddedFile:
    return {"name": path.name, "type": "error", "content": ERROR_READING_FILE}


def _read_base64(path: Path) -> str | None:
    try:
        return base64.b64encode(path.read_bytes()).decode("ascii")
    except OSError:
        return None


def embed_file(path: Path) -> EmbeddedFile:
    """Read a file and return an embedded representation."""
    ext = path.suffix.lower()
    mime = get_mime_type(path)

    if ext in TEXT_EXTENSIONS:
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            content = ERROR_READING_FILE
        return {"name": path.name, "type": "text", "content": content}

    b64 = _read_base64(path)
    if b64 is None:
        return _error_file(path)

    if ext in IMAGE_EXTENSIONS:
        return {
            "name": path.name,
            "type": "image",
            "mime": mime,
            "data_uri": f"data:{mime};base64,{b64}",
        }
    if ext == ".pdf":
        return {
            "name": path.name,
            "type": "pdf",
            "data_uri": f"data:{mime};base64,{b64}",
        }
    if ext == ".xlsx":
        return {"name": path.name, "type": "xlsx", "data_b64": b64}

    return {
        "name": path.name,
        "type": "binary",
        "mime": mime,
        "data_uri": f"data:{mime};base64,{b64}",
    }


def load_previous_iteration(workspace: Path) -> dict[str, PreviousRun]:
    """Load previous iteration feedback and embedded outputs."""
    feedback_map = _load_feedback_map(workspace / "feedback.json")
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
    """Serialize JSON so embedded data cannot terminate the surrounding <script>."""
    return (
        json.dumps(data)
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
    """Generate the complete standalone HTML page with embedded data."""
    template_path = Path(__file__).parent / "viewer.html"
    template = template_path.read_text(encoding="utf-8")

    previous_feedback: dict[str, str] = {}
    previous_outputs: dict[str, list[EmbeddedFile]] = {}
    if previous:
        for run_id, data in previous.items():
            if data["feedback"]:
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

    data_json = _json_for_script(embedded)
    return template.replace(
        EMBEDDED_DATA_MARKER,
        f"const EMBEDDED_DATA = {data_json};",
    )



# ---------------------------------------------------------------------------
# HTTP server (stdlib only, zero dependencies)
# ---------------------------------------------------------------------------


class ReviewHandler(BaseHTTPRequestHandler):
    """Serve the review HTML and persist local feedback."""

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

    def _send_bytes(
        self,
        content: bytes,
        *,
        content_type: str,
        status: int = 200,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_json(self, payload: dict[str, object], *, status: int = 200) -> None:
        content = json.dumps(payload).encode("utf-8")
        self._send_bytes(content, content_type="application/json", status=status)

    def do_GET(self) -> None:
        if self.path in {"/", "/index.html"}:
            benchmark = _load_optional_json_object(self.benchmark_path)
            html = generate_html(
                find_runs(self.workspace),
                self.skill_name,
                self.previous,
                benchmark,
            )
            self._send_bytes(
                html.encode("utf-8"),
                content_type="text/html; charset=utf-8",
            )
            return

        if self.path == "/api/feedback":
            try:
                data = self.feedback_path.read_bytes() if self.feedback_path.is_file() else b"{}"
            except OSError as exc:
                self._send_json({"error": str(exc)}, status=500)
                return
            self._send_bytes(data, content_type="application/json")
            return

        self.send_error(404)

    def do_POST(self) -> None:
        if self.path != "/api/feedback":
            self.send_error(404)
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0:
                raise ValueError("Content-Length must be non-negative")
            body = self.rfile.read(length)
            raw: object = json.loads(body)
            data = _as_object_dict(raw)
            if data is None or not isinstance(data.get("reviews"), list):
                raise ValueError("Expected JSON object with a 'reviews' list")
            self.feedback_path.write_text(
                json.dumps(data, indent=2) + "\n",
                encoding="utf-8",
            )
        except (OSError, ValueError) as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json({"ok": True})

    def log_message(self, format: str, *args: object) -> None:
        """Suppress request logging to keep terminal output focused."""



def _port_number(value: str) -> int:
    try:
        port = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("port must be an integer") from exc
    if not 0 <= port <= 65535:
        raise argparse.ArgumentTypeError("port must be between 0 and 65535")
    return port


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and serve eval review")
    parser.add_argument("workspace", type=Path, help="Path to workspace directory")
    parser.add_argument("--port", "-p", type=_port_number, default=3117, help="Server port (default: 3117)")
    parser.add_argument("--skill-name", "-n", type=str, default=None, help="Skill name for header")
    parser.add_argument(
        "--previous-workspace",
        type=Path,
        default=None,
        help="Path to previous iteration's workspace (shows old outputs and feedback as context)",
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
    args = parser.parse_args()

    workspace_arg = cast(Path, args.workspace)
    skill_name_arg = cast(str | None, args.skill_name)
    previous_workspace = cast(Path | None, args.previous_workspace)
    benchmark_arg = cast(Path | None, args.benchmark)
    static_path = cast(Path | None, args.static)
    port = cast(int, args.port)

    workspace = workspace_arg.resolve()
    if not workspace.is_dir():
        print(f"Error: {workspace} is not a directory", file=sys.stderr)
        return 1

    runs = find_runs(workspace)
    if not runs:
        print(f"No runs found in {workspace}", file=sys.stderr)
        return 1

    skill_name = skill_name_arg or workspace.name.replace("-workspace", "")
    feedback_path = workspace / "feedback.json"

    previous: dict[str, PreviousRun] = {}
    if previous_workspace is not None:
        previous = load_previous_iteration(previous_workspace.resolve())

    benchmark_path = benchmark_arg.resolve() if benchmark_arg is not None else None
    benchmark = _load_optional_json_object(benchmark_path)

    if static_path is not None:
        html = generate_html(runs, skill_name, previous, benchmark)
        static_path.parent.mkdir(parents=True, exist_ok=True)
        static_path.write_text(html, encoding="utf-8")
        print(f"\n  Static viewer written to: {static_path}\n")
        return 0

    # Never terminate an existing listener. Fall back to an ephemeral port if needed.
    handler = partial(ReviewHandler, workspace, skill_name, feedback_path, previous, benchmark_path)
    try:
        server = HTTPServer(("127.0.0.1", port), handler)
    except OSError:
        # Port still in use after kill attempt — find a free one
        server = HTTPServer(("127.0.0.1", 0), handler)
        port = cast(tuple[str, int], server.server_address)[1]

    url = f"http://localhost:{port}"
    print("\n  Eval Viewer")
    print("  ─────────────────────────────────")
    print(f"  URL:       {url}")
    print(f"  Workspace: {workspace}")
    print(f"  Feedback:  {feedback_path}")
    if previous:
        print(f"  Previous:  {previous_workspace} ({len(previous)} runs)")
    if benchmark_path:
        print(f"  Benchmark: {benchmark_path}")
    print("\n  Press Ctrl+C to stop.\n")

    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
