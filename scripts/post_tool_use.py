#!/usr/bin/env python3
"""Fail-open PostToolUse acknowledgement for file-writing tools.

Claude Code sends hook input as one JSON object on stdin.  This hook deliberately
does not depend on a shell-specific syntax or an undocumented environment
variable, and it does not mutate the repository.  PostToolUse is advisory, so
malformed input and non-successful tool results are ignored with exit code 0.
"""

from __future__ import annotations

import json
import sys
from collections.abc import Mapping
from typing import cast

FILE_TOOLS = {"edit", "write", "multiedit"}
SUCCESS_RESULTS = {"ok", "success", "succeeded"}
REMINDER = (
    "[A Team] File modified. Use code-reviewer agent before committing. "
    "Use verification-before-completion before claiming done."
)


def _read_payload() -> dict[str, object] | None:
    try:
        payload: object = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError, TypeError):
        return None
    if not isinstance(payload, dict):
        return None
    return cast(dict[str, object], payload)


def _first(payload: Mapping[str, object], *keys: str) -> object | None:
    for key in keys:
        if key in payload:
            return payload[key]
    return None


def _as_object(value: object) -> Mapping[str, object] | None:
    if not isinstance(value, dict):
        return None
    return cast(dict[str, object], value)


def _is_successful_file_tool(payload: Mapping[str, object]) -> bool:
    tool_name = _first(payload, "tool_name", "toolName")
    if not isinstance(tool_name, str) or tool_name.casefold() not in FILE_TOOLS:
        return False

    result = _as_object(
        _first(payload, "tool_response", "toolResponse", "tool_result", "toolResult")
    )
    if result is not None:
        error_flag = _first(result, "is_error", "isError")
        if error_flag is True:
            return False

        result_type = _first(result, "resultType", "result_type", "status")
        if (
            isinstance(result_type, str)
            and result_type.casefold() not in SUCCESS_RESULTS
        ):
            return False

    return True


def main() -> None:
    payload = _read_payload()
    if payload is None or not _is_successful_file_tool(payload):
        return

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": REMINDER,
                }
            }
        )
    )


if __name__ == "__main__":
    main()
