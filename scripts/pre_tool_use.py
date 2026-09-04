#!/usr/bin/env python3
"""
A Team PreToolUse safety guard.
Blocks destructive commands and .env file access before any tool fires.
Exit 2 = block + show error to Claude. Exit 0 = allow.
"""
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Tools that carry a shell command. PowerShell is the primary shell on Windows
# hosts, so guarding only Bash leaves the main execution path uninspected.
# ---------------------------------------------------------------------------

_COMMAND_TOOLS = ("Bash", "PowerShell")

# ---------------------------------------------------------------------------
# Destructive command patterns — POSIX, Windows and PowerShell
# ---------------------------------------------------------------------------

_RM_POSIX = [
    r"\brm\s+.*-[a-z]*r[a-z]*f",       # rm -rf, rm -Rf, rm -fr, etc.
    r"\brm\s+.*-[a-z]*f[a-z]*r",        # rm -fr variations
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
    if re.search(r"\brm\s+.*-[a-z]*r", normalized):
        if _DANGEROUS_PATHS_RE.search(normalized):
            return True

    for pat in _WINDOWS_PATTERNS:
        if pat.search(command):
            return True

    # PowerShell patterns are written lowercase and matched against `normalized`.
    for pat in _POWERSHELL_PATTERNS:
        if pat.search(normalized):
            return True

    return False


# ---------------------------------------------------------------------------
# .env file access guard
# ---------------------------------------------------------------------------

_ENV_SAFE_SUFFIXES = (".env.sample", ".env.example", ".env.example.local", ".env.template")

_ENV_BASH_PATTERNS = [
    re.compile(r"(?:cat|head|tail|less|more)\s+.*\.env\b"),
    re.compile(r"echo\s+.*>\s*\.env\b"),
    re.compile(r"(?:cp|mv|touch)\s+.*\.env\b"),
]

# PowerShell equivalents of the read/write/copy verbs above, including aliases.
_ENV_PS_PATTERNS = [
    re.compile(r"(?:get-content|gc|type|select-string|sls)\s+[^|;]*\.env\b", re.IGNORECASE),
    re.compile(r"(?:set-content|add-content|out-file)\s+[^|;]*\.env\b", re.IGNORECASE),
    re.compile(r"(?:copy-item|move-item|cpi|mi)\s+[^|;]*\.env\b", re.IGNORECASE),
]

_ENV_COMMAND_PATTERNS = _ENV_BASH_PATTERNS + _ENV_PS_PATTERNS

# Which input fields name a file, per tool. Search tools reach file *contents*
# without ever supplying a file_path, so omitting them let `.env` be read in
# full through Grep. Note Grep's own `pattern` is deliberately absent: it is
# what is searched FOR, not what is searched IN, and grepping the source for
# the text ".env" is legitimate work. Glob's `pattern` IS the file selector,
# so there it is inspected.
_ENV_PATH_FIELDS = {
    "Read": ("file_path",),
    "Edit": ("file_path",),
    "MultiEdit": ("file_path",),
    "Write": ("file_path",),
    "NotebookEdit": ("notebook_path",),
    "Grep": ("path", "glob"),
    "Glob": ("pattern", "path"),
}


def _is_env_access(tool_name: str, tool_input: dict) -> bool:
    for field in _ENV_PATH_FIELDS.get(tool_name, ()):
        value = tool_input.get(field) or ""
        if ".env" in value and not any(value.endswith(s) for s in _ENV_SAFE_SUFFIXES):
            return True

    if tool_name in _COMMAND_TOOLS:
        cmd = tool_input.get("command", "")
        if ".env" in cmd and not any(s in cmd for s in _ENV_SAFE_SUFFIXES):
            for pat in _ENV_COMMAND_PATTERNS:
                if pat.search(cmd):
                    return True

    return False


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def _log(data: dict) -> None:
    try:
        log_dir = Path.cwd() / ".agent-sync" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "pre_tool_use.json"
        existing = []
        if log_path.exists():
            try:
                existing = json.loads(log_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, ValueError):
                pass
        existing.append(data)
        log_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    if _is_env_access(tool_name, tool_input):
        print("BLOQUEADO: acesso a ficheiros .env com dados sensíveis não é permitido.", file=sys.stderr)
        print("Usa .env.sample para templates.", file=sys.stderr)
        sys.exit(2)

    if tool_name in _COMMAND_TOOLS:
        cmd = tool_input.get("command", "")
        if _is_destructive(cmd):
            print("BLOQUEADO: comando destrutivo detectado e cancelado.", file=sys.stderr)
            print(f"Comando: {cmd[:120]}", file=sys.stderr)
            sys.exit(2)

    _log(data)
    sys.exit(0)


if __name__ == "__main__":
    main()
