"""Behaviour tests for the cross-platform PostToolUse hook."""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / "scripts" / "post_tool_use.py"
CLAUDE_SETTINGS = ROOT / ".claude" / "settings.json"
REMINDER = (
    "[A Team] File modified. Use code-reviewer agent before committing. "
    "Use verification-before-completion before claiming done."
)


def invoke(payload: object) -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory(prefix="posttooluse-") as directory:
        return subprocess.run(
            [sys.executable, str(HOOK)],
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            timeout=30,
            cwd=directory,
        )


def test_successful_edit_is_acknowledged() -> None:
    result = invoke(
        {
            "tool_name": "Edit",
            "tool_input": {"file_path": "ClientApp/src/example.tsx"},
        }
    )

    assert result.returncode == 0
    assert json.loads(result.stdout) == {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": REMINDER,
        }
    }


def test_camel_case_write_payload_is_supported() -> None:
    result = invoke(
        {
            "toolName": "Write",
            "toolArgs": {"path": "ClientApp/src/example.tsx"},
            "toolResult": {"resultType": "success"},
        }
    )

    assert result.returncode == 0
    assert json.loads(result.stdout)["hookSpecificOutput"]["additionalContext"] == REMINDER


def test_failed_or_unrelated_tools_are_ignored() -> None:
    failed_edit = invoke(
        {
            "tool_name": "Edit",
            "tool_input": {"file_path": "ClientApp/src/example.tsx"},
            "tool_result": {"resultType": "error"},
        }
    )
    read = invoke(
        {
            "tool_name": "Read",
            "tool_input": {"file_path": "ClientApp/src/example.tsx"},
        }
    )

    assert failed_edit.returncode == 0
    assert failed_edit.stdout == ""
    assert read.returncode == 0
    assert read.stdout == ""


def test_claude_code_failed_tool_response_is_ignored() -> None:
    result = invoke(
        {
            "tool_name": "Edit",
            "tool_input": {"file_path": "ClientApp/src/example.tsx"},
            "tool_response": {"resultType": "error"},
        }
    )

    assert result.returncode == 0
    assert result.stdout == ""


def test_malformed_input_fails_open() -> None:
    result = subprocess.run(
        [sys.executable, str(HOOK)],
        input="not-json",
        capture_output=True,
        text=True,
        timeout=30,
    )

    assert result.returncode == 0
    assert result.stdout == ""


def test_claude_settings_registers_the_cross_platform_hook() -> None:
    if not CLAUDE_SETTINGS.is_file():
        pytest.skip("local .claude/settings.json is not available")
    settings = json.loads(CLAUDE_SETTINGS.read_text(encoding="utf-8"))
    registration = settings["hooks"]["PostToolUse"][0]

    assert registration["matcher"] == "Write|Edit|MultiEdit"
    assert registration["hooks"][0]["command"] == "python scripts/post_tool_use.py"


@pytest.mark.parametrize("payload", [None, [], "Edit", 0, {}, {"tool_name": []}])
def test_wrong_payload_shape_fails_open(payload: object) -> None:
    result = invoke(payload)
    assert result.returncode == 0
    assert result.stdout == ""


@pytest.mark.parametrize("result_type", ["error", "failure", "denied"])
@pytest.mark.parametrize(
    "result_key", ["tool_response", "toolResponse", "tool_result", "toolResult"]
)
def test_failed_results_never_emit_a_review_reminder(result_key: str, result_type: str) -> None:
    result = invoke({"tool_name": "Edit", result_key: {"resultType": result_type}})
    assert result.returncode == 0
    assert result.stdout == ""


@pytest.mark.parametrize("tool", ["Write", "Edit", "MultiEdit"])
def test_all_file_tools_emit_the_post_tool_use_event(tool: str) -> None:
    result = invoke({"tool_name": tool})
    assert result.returncode == 0
    assert json.loads(result.stdout) == {
        "hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": REMINDER}
    }
