#!/usr/bin/env python3
"""Run trigger evaluation for a skill description.

Tests whether a skill's description causes Claude to trigger (read the skill)
for a set of queries. Outputs results as JSON.
"""

import argparse
import json
import os
import select
import shutil
import subprocess
import sys
import time
import uuid
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from scripts.utils import parse_skill_md


def find_project_root() -> Path:
    """Find the project root by walking up from cwd looking for .claude/.

    Mimics how Claude Code discovers its project root, so the command file
    we create ends up where claude -p will look for it.
    """
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def run_single_query(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    project_root: str,
    model: str | None = None,
) -> bool:
    """Run a single query and return whether the skill was triggered.

    Creates a command file in .claude/commands/ so it appears in Claude's
    available_skills list, then runs `claude -p` with the raw query.
    Uses --include-partial-messages to detect triggering early from
    stream events (content_block_start) rather than waiting for the
    full assistant message, which only arrives after tool execution.
    """
    unique_id = uuid.uuid4().hex[:8]
    clean_name = f"{skill_name}-skill-{unique_id}"
    project_commands_dir = Path(project_root) / ".claude" / "commands"
    command_file = project_commands_dir / f"{clean_name}.md"

    try:
        project_commands_dir.mkdir(parents=True, exist_ok=True)
        # Use YAML block scalar to avoid breaking on quotes in description
        indented_desc = "\n  ".join(skill_description.split("\n"))
        command_content = (
            f"---\n"
            f"description: |\n"
            f"  {indented_desc}\n"
            f"---\n\n"
            f"# {skill_name}\n\n"
            f"This skill handles: {skill_description}\n"
        )
        command_file.write_text(command_content)

        cmd = [
            "claude",
            "-p",
            query,
            "--output-format",
            "stream-json",
            "--verbose",
            "--include-partial-messages",
        ]
        if model:
            cmd.extend(["--model", model])

        # Remove CLAUDECODE env var to allow nesting claude -p inside a
        # Claude Code session. The guard is for interactive terminal conflicts;
        # programmatic subprocess usage is safe.
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            cwd=project_root,
            env=env,
        )

        triggered = False
        start_time = time.time()
        buffer = ""
        # Track state for stream event detection
        pending_tool_name = None
        accumulated_json = ""

        timed_out = False
        try:
            while time.time() - start_time < timeout:
                if process.poll() is not None:
                    remaining = process.stdout.read()
                    if remaining:
                        buffer += remaining.decode("utf-8", errors="replace")
                    break

                ready, _, _ = select.select([process.stdout], [], [], 1.0)
                if not ready:
                    continue

                chunk = os.read(process.stdout.fileno(), 8192)
                if not chunk:
                    break
                buffer += chunk.decode("utf-8", errors="replace")

                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Early detection via stream events
                    if event.get("type") == "stream_event":
                        se = event.get("event", {})
                        se_type = se.get("type", "")

                        if se_type == "content_block_start":
                            # A message may use unrelated tools before consulting a skill.
                            # Ignore those blocks instead of treating them as a non-trigger.
                            pending_tool_name = None
                            accumulated_json = ""
                            cb = se.get("content_block", {})
                            if cb.get("type") == "tool_use":
                                tool_name = cb.get("name", "")
                                if tool_name in ("Skill", "Read"):
                                    pending_tool_name = tool_name

                        elif se_type == "content_block_delta" and pending_tool_name:
                            delta = se.get("delta", {})
                            if delta.get("type") == "input_json_delta":
                                accumulated_json += delta.get("partial_json", "")
                                if clean_name in accumulated_json:
                                    return True

                        elif se_type in ("content_block_stop", "message_stop"):
                            if pending_tool_name:
                                if clean_name in accumulated_json:
                                    return True
                                pending_tool_name = None
                                accumulated_json = ""
                            if se_type == "message_stop":
                                return False

                    # Fallback: full assistant message
                    elif event.get("type") == "assistant":
                        message = event.get("message", {})
                        for content_item in message.get("content", []):
                            if content_item.get("type") != "tool_use":
                                continue
                            tool_name = content_item.get("name", "")
                            tool_input = content_item.get("input", {})
                            if tool_name == "Skill" and clean_name in tool_input.get("skill", ""):
                                return True
                            if tool_name == "Read" and clean_name in tool_input.get(
                                "file_path", ""
                            ):
                                return True
                        return False

                    elif event.get("type") == "result":
                        if event.get("is_error"):
                            raise RuntimeError("claude CLI reported an error result")
                        return triggered
            timed_out = process.poll() is None
        finally:
            # Clean up process on any exit path (return, exception, timeout).
            if process.poll() is None:
                process.kill()
                process.wait()

        if timed_out:
            raise TimeoutError(f"trigger evaluation exceeded {timeout}s")
        if process.returncode not in (0, None):
            raise RuntimeError(f"claude CLI exited with status {process.returncode}")
        return triggered
    finally:
        if command_file.exists():
            command_file.unlink()


def _validate_eval_set(eval_set: list[dict], runs_per_query: int, trigger_threshold: float) -> None:
    if runs_per_query < 1:
        raise ValueError("runs_per_query must be >= 1")
    if not 0 < trigger_threshold <= 1:
        raise ValueError("trigger_threshold must be in (0, 1]")

    seen: set[str] = set()
    for index, item in enumerate(eval_set):
        if not isinstance(item, dict):
            raise ValueError(f"eval item {index} must be an object")
        query = item.get("query")
        should_trigger = item.get("should_trigger")
        if not isinstance(query, str) or not query.strip():
            raise ValueError(f"eval item {index} has an invalid query")
        if query in seen:
            raise ValueError(f"duplicate eval query: {query!r}")
        seen.add(query)
        if not isinstance(should_trigger, bool):
            raise ValueError(f"eval item {index} should_trigger must be boolean")


def _require_claude_cli() -> str:
    """Return the claude executable path or raise a clear prerequisite error."""
    path = shutil.which("claude")
    if not path:
        raise RuntimeError(
            "claude CLI not found on PATH; trigger evaluation is unavailable in this runtime"
        )
    return path


def run_eval(
    eval_set: list[dict],
    skill_name: str,
    description: str,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int = 1,
    trigger_threshold: float = 0.5,
    model: str | None = None,
) -> dict:
    """Run the full eval set and return results."""
    _validate_eval_set(eval_set, runs_per_query, trigger_threshold)
    _require_claude_cli()
    results = []

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_info = {}
        for item in eval_set:
            for run_idx in range(runs_per_query):
                future = executor.submit(
                    run_single_query,
                    item["query"],
                    skill_name,
                    description,
                    timeout,
                    str(project_root),
                    model,
                )
                future_to_info[future] = (item, run_idx)

        query_outcomes: dict[str, list[bool | None]] = {}
        query_items: dict[str, dict] = {}
        query_errors: dict[str, list[str]] = {}
        for future in as_completed(future_to_info):
            item, _ = future_to_info[future]
            query = item["query"]
            query_items[query] = item
            query_outcomes.setdefault(query, [])
            query_errors.setdefault(query, [])
            try:
                query_outcomes[query].append(future.result())
            except (OSError, RuntimeError, TimeoutError) as e:
                print(f"Warning: query execution failed: {e}", file=sys.stderr)
                query_outcomes[query].append(None)
                query_errors[query].append(str(e))

    for query, outcomes in query_outcomes.items():
        item = query_items[query]
        valid = [value for value in outcomes if value is not None]
        execution_errors = len(outcomes) - len(valid)
        trigger_rate = (sum(valid) / len(valid)) if valid else 0.0
        should_trigger = item["should_trigger"]

        # Execution failures are evidence failures, not successful non-triggers.
        if execution_errors:
            did_pass = False
        elif should_trigger:
            did_pass = trigger_rate >= trigger_threshold
        else:
            did_pass = trigger_rate < trigger_threshold

        results.append(
            {
                "query": query,
                "should_trigger": should_trigger,
                "trigger_rate": trigger_rate,
                "triggers": sum(valid),
                "runs": len(outcomes),
                "execution_errors": execution_errors,
                "error_messages": query_errors.get(query, []),
                "pass": did_pass,
            }
        )

    passed = sum(1 for r in results if r["pass"])
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


def main():
    parser = argparse.ArgumentParser(description="Run trigger evaluation for a skill description")
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--description", default=None, help="Override description to test")
    parser.add_argument("--num-workers", type=int, default=10, help="Number of parallel workers")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout per query in seconds")
    parser.add_argument("--runs-per-query", type=int, default=3, help="Number of runs per query")
    parser.add_argument(
        "--trigger-threshold", type=float, default=0.5, help="Trigger rate threshold"
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model to use for claude -p (default: user's configured model)",
    )
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    args = parser.parse_args()

    eval_set = json.loads(Path(args.eval_set).read_text())
    skill_path = Path(args.skill_path)

    if not (skill_path / "SKILL.md").exists():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        sys.exit(1)

    name, original_description, _content = parse_skill_md(skill_path)
    description = args.description or original_description
    project_root = find_project_root()

    if args.verbose:
        print(f"Evaluating: {description}", file=sys.stderr)

    try:
        output = run_eval(
            eval_set=eval_set,
            skill_name=name,
            description=description,
            num_workers=args.num_workers,
            timeout=args.timeout,
            project_root=project_root,
            runs_per_query=args.runs_per_query,
            trigger_threshold=args.trigger_threshold,
            model=args.model,
        )
    except (RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc

    if args.verbose:
        summary = output["summary"]
        print(f"Results: {summary['passed']}/{summary['total']} passed", file=sys.stderr)
        for r in output["results"]:
            status = "PASS" if r["pass"] else "FAIL"
            rate_str = f"{r['triggers']}/{r['runs']}"
            print(
                f"  [{status}] rate={rate_str} expected={r['should_trigger']}: {r['query'][:70]}",
                file=sys.stderr,
            )

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
