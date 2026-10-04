#!/usr/bin/env python3
"""
A Team PreToolUse safety guard.
Blocks destructive commands and .env file access before any tool fires.
Exit 2 = block + show error to Claude. Exit 0 = allow.
"""
import json
import re
import sys
from collections.abc import Mapping
from contextlib import suppress
from pathlib import Path
from typing import Final, cast

JsonObject = dict[str, object]

# ---------------------------------------------------------------------------
# Tools that carry a shell command. PowerShell is the primary shell on Windows
# hosts, so guarding only Bash leaves the main execution path uninspected.
# ---------------------------------------------------------------------------

_COMMAND_TOOLS = ("Bash", "PowerShell")

# ---------------------------------------------------------------------------
# Destructive command patterns — POSIX, Windows and PowerShell
# ---------------------------------------------------------------------------

_RM_POSIX = [
    # (?<!\S) requires the flag's leading '-' to sit at a token boundary
    # (start of string or preceded by whitespace) rather than mid-word, so a
    # path segment like "...-formik-..." (hyphen, then a word that happens to
    # spell out r-then-f letters) is never mistaken for a combined -rf flag.
    r"\brm\s+.*(?<!\S)-[a-z]*r[a-z]*f\b",       # rm -rf, rm -Rf, rm -fr, etc.
    r"\brm\s+.*(?<!\S)-[a-z]*f[a-z]*r\b",        # rm -fr variations
    r"\brm\s+--recursive\s+--force",
    r"\brm\s+--force\s+--recursive",
    r"\brm\s+-r\b.*-f\b",
    r"\brm\s+-f\b.*-r\b",
]

_RM_WINDOWS = [
    r"\bdel\b.*/[fFsS]",                # del /f /s
    r"\brd\b.*/[sS]",                   # rd /s
    r"\brmdir\b.*/[sS]",               # rmdir /s
    r"\bformat\s+[a-zA-Z]:",           # format c:
]

# PowerShell removal takes cmdlet form rather than POSIX switches, and accepts
# any unambiguous prefix of a parameter name (-Recurse / -Rec / -R, -Force / -F).
# `del`, `rd`, `rmdir`, `ri` and `rm` are all aliases of Remove-Item there, so
# the switch spelling — not the verb — is what distinguishes these from the
# CMD forms already covered by _RM_WINDOWS. The `[^|;]*` spans keep a match
# inside one pipeline segment, so a later unrelated command cannot supply the
# second switch.
_PS_REMOVE = r"(?:remove-item|ri|rmdir|rd|del|erase|rm)"
_PS_RECURSE = r"-r(?:ec(?:urse)?)?\b"
_PS_FORCE = r"-f(?:o(?:rce)?)?\b"

_RM_POWERSHELL = [
    rf"\b{_PS_REMOVE}\b[^|;]*{_PS_RECURSE}[^|;]*{_PS_FORCE}",
    rf"\b{_PS_REMOVE}\b[^|;]*{_PS_FORCE}[^|;]*{_PS_RECURSE}",
    r"\bformat-volume\b",
    r"\bclear-disk\b",
]

_DANGEROUS_PATHS_RE = re.compile(
    r"(?:/\*?$|~/?|\\*\.?\*|"
    r"\$HOME|/\s*$|^\s*/[^/\s]*\s*/?\s*$)"
)

_POSIX_PATTERNS = [re.compile(p) for p in _RM_POSIX]
_WINDOWS_PATTERNS = [re.compile(p, re.IGNORECASE) for p in _RM_WINDOWS]
_POWERSHELL_PATTERNS = [re.compile(p) for p in _RM_POWERSHELL]


def _is_destructive(command: str) -> bool:
    normalized = " ".join(command.lower().split())

    for pat in _POSIX_PATTERNS:
        if pat.search(normalized):
            return True

    # Recursive POSIX rm against dangerous paths
    if _has_recursive_rm(normalized) and _DANGEROUS_PATHS_RE.search(normalized):
        return True

    for pat in _WINDOWS_PATTERNS:
        if pat.search(command):
            return True

    # PowerShell patterns are written lowercase and matched against `normalized`.
    return any(pat.search(normalized) for pat in _POWERSHELL_PATTERNS)


def _has_recursive_rm(command: str) -> bool:
    tokens = command.split()
    for index, token in enumerate(tokens):
        if token == "rm":
            return any(
                option.startswith("-")
                and not option.startswith("--")
                and option[1:].endswith("r")
                for option in tokens[index + 1 :]
            )
    return False


# ---------------------------------------------------------------------------
# .env file access guard
# ---------------------------------------------------------------------------

_ENV_SAFE_SUFFIXES = (".env.sample", ".env.example", ".env.example.local", ".env.template")

_ENV_BASH_PATTERNS = [
    re.compile(r"\b(?:cat|head|tail|less|more)[ \t][^;\r\n]*\.env\b"),
    re.compile(r"\becho\b[^;\r\n]*>[ \t]*\.env\b"),
    re.compile(r"\b(?:cp|mv|touch)[ \t][^;\r\n]*\.env\b"),
]

# PowerShell equivalents of the read/write/copy verbs above, including aliases.
_ENV_PS_PATTERNS = [
    re.compile(
        r"\b(?:get-content|gc|type|select-string|sls)[ \t][^|;\r\n]*\.env\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:set-content|add-content|out-file)[ \t][^|;\r\n]*\.env\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:copy-item|move-item|cpi|mi)[ \t][^|;\r\n]*\.env\b",
        re.IGNORECASE,
    ),
]

_ENV_COMMAND_PATTERNS = _ENV_BASH_PATTERNS + _ENV_PS_PATTERNS

# Which input fields name a file, per tool. Search tools reach file *contents*
# without ever supplying a file_path, so omitting them let `.env` be read in
# full through Grep. Note Grep's own `pattern` is deliberately absent: it is
# what is searched FOR, not what is searched IN, and grepping the source for
# the text ".env" is legitimate work. Glob's `pattern` IS the file selector,
# so there it is inspected.
_ENV_PATH_FIELDS: Final[dict[str, tuple[str, ...]]] = {
    "Read": ("file_path",),
    "Edit": ("file_path",),
    "MultiEdit": ("file_path",),
    "Write": ("file_path",),
    "NotebookEdit": ("notebook_path",),
    "Grep": ("path", "glob"),
    "Glob": ("pattern", "path"),
}


def _as_json_object(value: object) -> JsonObject | None:
    if not isinstance(value, dict):
        return None
    return cast(JsonObject, value)


def _is_sensitive_env_value(value: object) -> bool:
    return (
        isinstance(value, str)
        and ".env" in value
        and not any(value.endswith(suffix) for suffix in _ENV_SAFE_SUFFIXES)
    )


def _has_env_path_access(
    tool_name: str, tool_input: Mapping[str, object]
) -> bool:
    fields = _ENV_PATH_FIELDS.get(tool_name, ())
    return any(_is_sensitive_env_value(tool_input.get(field)) for field in fields)


def _has_env_command_access(
    tool_name: str, tool_input: Mapping[str, object]
) -> bool:
    if tool_name not in _COMMAND_TOOLS:
        return False

    command = tool_input.get("command")
    if not isinstance(command, str):
        return False
    if ".env" not in command:
        return False
    if any(suffix in command for suffix in _ENV_SAFE_SUFFIXES):
        return False
    return any(pattern.search(command) for pattern in _ENV_COMMAND_PATTERNS)


def _is_env_access(tool_name: str, tool_input: Mapping[str, object]) -> bool:
    return _has_env_path_access(tool_name, tool_input) or _has_env_command_access(
        tool_name, tool_input
    )


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def _log(data: JsonObject) -> None:
    try:
        log_dir = Path.cwd() / ".agent-sync" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "pre_tool_use.json"
        existing: list[JsonObject] = []
        if log_path.exists():
            with suppress(json.JSONDecodeError):
                raw_existing: object = json.loads(
                    log_path.read_text(encoding="utf-8")
                )
                if isinstance(raw_existing, list):
                    existing = [
                        cast(JsonObject, item)
                        for item in cast(list[object], raw_existing)
                        if isinstance(item, dict)
                    ]
        existing.append(data)
        log_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    try:
        raw_data: object = json.load(sys.stdin)
    except json.JSONDecodeError:
        return

    data = _as_json_object(raw_data)
    if data is None:
        return

    tool_name = data.get("tool_name", "")
    if not isinstance(tool_name, str):
        return
    tool_input = _as_json_object(data.get("tool_input", {})) or {}

    if _is_env_access(tool_name, tool_input):
        print(
            "BLOQUEADO: acesso a ficheiros .env com dados sensíveis não é permitido.",
            file=sys.stderr,
        )
        print("Usa .env.sample para templates.", file=sys.stderr)
        sys.exit(2)

    if tool_name in _COMMAND_TOOLS:
        cmd = tool_input.get("command", "")
        if isinstance(cmd, str) and _is_destructive(cmd):
            print("BLOQUEADO: comando destrutivo detectado e cancelado.", file=sys.stderr)
            print(f"Comando: {cmd[:120]}", file=sys.stderr)
            sys.exit(2)

    _log(data)
    sys.exit(0)


if __name__ == "__main__":
    main()
