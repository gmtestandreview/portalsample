#!/usr/bin/env python3.14
"""
A Team PreToolUse safety guard.
Blocks destructive commands and .env file access before any tool fires.
Exit 2 = block + show error to Claude. Exit 0 = allow.
"""

import getopt
import json
import os
import re
import sys
import time
from typing import Protocol, cast

type JsonObject = dict[str, object]


class _FcntlApi(Protocol):
    LOCK_EX: int
    LOCK_NB: int
    LOCK_UN: int

    def flock(self, descriptor: int, operation: int) -> object: ...


_WRAPPER_OPTIONS: dict[str, tuple[str, list[str]]] = {
    # Fixed-arity subset only. Unsupported shell/expansion modes and optional
    # arguments fail closed rather than guessing where the child command starts.
    "sudo": (
        "AbBEHkKnNPSVvu:g:p:C:D:R:T:r:t:",
        [
            "askpass",
            "background",
            "bell",
            "set-home",
            "reset-timestamp",
            "remove-timestamp",
            "non-interactive",
            "no-update",
            "preserve-groups",
            "stdin",
            "version",
            "validate",
            "help",
            "user=",
            "group=",
            "host=",
            "prompt=",
            "close-from=",
            "chdir=",
            "chroot=",
            "command-timeout=",
            "role=",
            "type=",
        ],
    ),
    "env": (
        "i0vu:C:a:",
        [
            "ignore-environment",
            "null",
            "debug",
            "unset=",
            "chdir=",
            "argv0=",
            "help",
            "version",
        ],
    ),
    "time": (
        "apqvo:f:",
        [
            "append",
            "portability",
            "quiet",
            "verbose",
            "output=",
            "format=",
            "help",
            "version",
        ],
    ),
    "command": ("pvV", []),
    "nohup": ("", ["help", "version"]),
    "exec": ("cla:", []),
    "xargs": (
        "0prtxn:P:L:d:E:",
        [
            "null",
            "interactive",
            "no-run-if-empty",
            "verbose",
            "exit",
            "max-args=",
            "max-procs=",
            "delimiter=",
            "help",
            "version",
        ],
    ),
    "call": ("", []),
}
_WRAPPERS = set(_WRAPPER_OPTIONS)
_WRAPPER_LOCATIONS = {
    "env": {"-C", "--chdir"},
    "sudo": {"-D", "--chdir", "-R", "--chroot"},
}
_SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
_PS_SHELLS = {"pwsh", "powershell"}
_EVAL_VERBS = {"eval", "iex", "invoke-expression"}
_MAX_DEPTH = 8
_PARSER_LIMIT = "__parser_limit__"
_HEREDOC = re.compile(r"<<(-?)\s*(['\"]?)([\w-]+)\2")


def _escape_character(shell: str) -> str:
    if shell == "PowerShell":
        return "`"
    if shell == "CMD":
        return "^"
    return "\\"


def _skip_nested_substitution_escape(
    text: str, index: int, quote: str | None, shell: str
) -> int | None:
    if text[index] == "\\" and quote != "'" and shell != "PowerShell":
        return index + 2
    return None


def _skip_substitution_escape(text: str, index: int, quote: str | None, shell: str) -> int | None:
    if _skip_nested_substitution_escape(text, index, quote, shell) is not None:
        return index + 2
    if text[index] == "`" and shell == "PowerShell" and quote != "'":
        return index + 2
    return None


def _scan_dollar_substitution(text: str, start: int, shell: str) -> tuple[str, int]:
    index, balance, quote = start, 1, None
    while index < len(text) and balance:
        index, quote, balance = _scan_dollar_character(text, index, quote, balance, shell)
    payload = text[start : index - 1] if not balance else _PARSER_LIMIT
    return payload, index


def _scan_dollar_character(
    text: str,
    index: int,
    quote: str | None,
    balance: int,
    shell: str,
) -> tuple[int, str | None, int]:
    skipped = _skip_nested_substitution_escape(text, index, quote, shell)
    if skipped is not None:
        return skipped, quote, balance
    char = text[index]
    if char in "'\"" and (quote is None or quote == char):
        return index + 1, None if quote else char, balance
    if quote is not None:
        return index + 1, quote, balance
    if char == "(":
        balance += 1
    elif char == ")":
        balance -= 1
    return index + 1, quote, balance


def _toggle_substitution_quote(
    char: str, quote: str | None, literal_body: bool
) -> tuple[bool, str | None]:
    if literal_body or char not in "'\"" or (quote is not None and quote != char):
        return False, quote
    return True, None if quote else char


def _backtick_substitution(text: str, index: int, quote: str | None) -> tuple[str, int] | None:
    if text[index] != "`" or quote == "'":
        return None
    end = text.find("`", index + 1)
    payload = text[index + 1 : end] if end >= 0 else _PARSER_LIMIT
    next_index = end + 1 if end >= 0 else len(text)
    return payload, next_index


def _substitutions(text: str, shell: str = "", *, literal_body: bool = False) -> list[str]:
    """Extract executable substitutions, respecting literal quotes and escapes."""
    found: list[str] = []
    quote: str | None = None
    index = 0
    while index < len(text):
        char = text[index]
        skipped = _skip_substitution_escape(text, index, quote, shell)
        if skipped is not None:
            index = skipped
            continue
        quote_handled, quote = _toggle_substitution_quote(char, quote, literal_body)
        if quote_handled:
            index += 1
            continue
        if quote != "'" and text.startswith("$(", index):
            payload, index = _scan_dollar_substitution(text, index + 2, shell)
            found.append(payload)
            continue
        backtick = _backtick_substitution(text, index, quote)
        if backtick is not None:
            payload, index = backtick
            found.append(payload)
            continue
        index += 1
    return found


def _consume_block_line(
    line: str,
    closers: list[tuple[str, bool, bool]],
    shell: str,
    substitutions: list[str],
) -> bool:
    if not closers:
        return False
    closer, expands, tabs = closers[0]
    if (line.lstrip("\t") if tabs else line) == closer:
        closers.pop(0)
    elif expands:
        # Bodies are data, but unquoted heredocs still execute expansions.
        substitutions.extend(_substitutions(line, shell, literal_body=True))
    return True


def _update_line_quote(
    line: str,
    index: int,
    char: str,
    quote: str | None,
    quotes: str,
    kept: list[str],
    closers: list[tuple[str, bool, bool]],
) -> tuple[str | None, bool]:
    if char not in quotes or (quote is not None and quote != char):
        return quote, False
    if quote is None and index and line[index - 1] == "@" and not line[index + 1 :].strip():
        kept.pop()
        closers.append((char + "@", char == '"', False))
        return quote, True
    return (None if quote else char), False


def _strip_line(
    line: str,
    shell: str,
    closers: list[tuple[str, bool, bool]],
) -> str:
    quote: str | None = None
    index = 0
    kept: list[str] = []
    quotes = '"' if shell == "CMD" else "'\""
    escape = _escape_character(shell)
    while index < len(line):
        char = line[index]
        if char == escape and quote != "'" and index + 1 < len(line):
            kept.extend(line[index : index + 2])
            index += 2
            continue
        if (
            char == "#"
            and quote is None
            and shell != "CMD"
            and (index == 0 or line[index - 1].isspace() or line[index - 1] in ";|&")
        ):
            break
        quote, block_started = _update_line_quote(line, index, char, quote, quotes, kept, closers)
        if block_started:
            break
        match = _HEREDOC.match(line, index) if quote is None else None
        if match is not None:
            closers.append((match[3], not match[2], bool(match[1])))
            index = match.end()
            continue
        kept.append(char)
        index += 1
    return "".join(kept)


def _strip_blocks(text: str, shell: str = "") -> tuple[str, list[str]]:
    out: list[str] = []
    substitutions: list[str] = []
    closers: list[tuple[str, bool, bool]] = []
    for line in text.split("\n"):
        if _consume_block_line(line, closers, shell, substitutions):
            continue
        out.append(_strip_line(line, shell, closers))
    return "\n".join(out), substitutions


def _split_escape_end(text: str, index: int, shell: str, quote: str | None) -> int | None:
    if index + 1 >= len(text) or text[index] != _escape_character(shell) or quote == "'":
        return None
    following = text[index + 1]
    if (
        shell in ("PowerShell", "CMD")
        or (shell == "Bash" and (quote != '"' or following in '$`"\\\n'))
        or (not shell and following in "'\";|& \t\n$`")
    ):
        return index + 2
    return None


def _flush_token(tokens: list[str], current: list[str]) -> None:
    if current:
        tokens.append("".join(current))
        current.clear()


def _end_segment(segments: list[list[str]], tokens: list[str], current: list[str]) -> None:
    _flush_token(tokens, current)
    if tokens:
        segments.append(list(tokens))
        tokens.clear()


def _split_character(
    char: str,
    shell: str,
    quote: str | None,
    segments: list[list[str]],
    tokens: list[str],
    current: list[str],
) -> str | None:
    if quote:
        if char == quote:
            return None
        current.append(char)
        return quote
    if char in ('"' if shell == "CMD" else "'\""):
        return char
    if char in ";|&\n":
        _end_segment(segments, tokens, current)
    elif char in "<>":
        _flush_token(tokens, current)
        tokens.append(char)
    elif char in " \t":
        _flush_token(tokens, current)
    else:
        current.append(char)
    return None


def _split(text: str, shell: str = "") -> list[list[str]]:
    segments: list[list[str]] = []
    tokens: list[str] = []
    current: list[str] = []
    quote: str | None = None
    index = 0
    while index < len(text):
        char = text[index]
        escape_end = _split_escape_end(text, index, shell, quote)
        if escape_end is not None:
            if text[index + 1] != "\n":
                current.append(text[index + 1])
            index = escape_end
            continue
        quote = _split_character(char, shell, quote, segments, tokens, current)
        index += 1
    _end_segment(segments, tokens, current)
    return segments


def _verb_name(token: str) -> str:
    name = token.replace("\\", "/").rsplit("/", 1)[-1].lower().lstrip("({")
    for extension in (".exe", ".cmd", ".bat"):
        if name.endswith(extension):
            name = name[: -len(extension)]
    return name


_CONTROL_TOKENS = {"(", "{", "}", ")", "then", "do", "else", "if", "while", "until", "!"}


def _parse_wrapper_options(tokens: list[str], index: int, wrapper: str) -> tuple[int, bool] | None:
    short, long = _WRAPPER_OPTIONS[wrapper]
    try:
        options, remaining = getopt.getopt(tokens[index:], short, long)
    except getopt.GetoptError:
        return None
    index = len(tokens) - len(remaining)
    # GNU env accepts a lone '-' after its options as ignore-environment.
    if wrapper == "env" and index < len(tokens) and tokens[index] == "-":
        index += 1
    assignment_start = index
    if wrapper in {"env", "sudo"}:
        # These utilities accept NAME=value operands beyond shell identifier
        # syntax, including option-looking names after '-' or '--'.
        while index < len(tokens) and "=" in tokens[index]:
            index += 1
    if index > assignment_start and index < len(tokens) and tokens[index].startswith("-"):
        return None  # Unsupported options interspersed after assignments.
    locations = _WRAPPER_LOCATIONS.get(wrapper, set())
    return index, any(option in locations for option, _value in options)


def _command_prefix(tokens: list[str]) -> tuple[int | None, bool] | None:
    """Locate the child command and its location state from one option parse."""
    index = 0
    changes_directory = False
    wrapped_assignment = False
    wrapped = False
    while index < len(tokens):
        token = tokens[index]
        if token in _CONTROL_TOKENS or re.match(r"^[A-Za-z_][\w]*=", token):
            wrapped_assignment = wrapped_assignment or wrapped
            index += 1
            continue
        if wrapped_assignment and token.startswith("-"):
            return None  # Do not guess at options interspersed after assignments.
        wrapper = _verb_name(token)
        if wrapper not in _WRAPPERS:
            return index, changes_directory
        parsed = _parse_wrapper_options(tokens, index + 1, wrapper)
        if parsed is None:
            return None
        index, location = parsed
        changes_directory = changes_directory or location
        wrapped = True
    return None, changes_directory


def _nested_payload(verb: str, args: list[str]) -> str | None:
    for index, arg in enumerate(args[:-1]):
        low = arg.lower()
        if verb in _SHELLS and arg.startswith("-") and not arg.startswith("--") and "c" in arg[1:]:
            return args[index + 1]
        if verb in _PS_SHELLS and low in {
            "-c",
            "-command",
            "-co",
            "-com",
            "-comm",
            "-comma",
            "-comman",
        }:
            return " ".join(args[index + 1 :])
        if verb == "cmd" and low in {"/c", "/k"}:
            return " ".join(args[index + 1 :])
    return None


def _nested_shell(verb: str) -> str:
    if verb in _PS_SHELLS:
        return "PowerShell"
    if verb in _SHELLS:
        return "Bash"
    return "CMD"


def _recursive_commands(payloads: list[str], depth: int, shell: str) -> list[tuple[str, list[str]]]:
    found: list[tuple[str, list[str]]] = []
    for payload in payloads:
        found.extend(commands(payload, depth + 1, shell))
    return found


def _command_segment(tokens: list[str], depth: int, shell: str) -> list[tuple[str, list[str]]]:
    prefix = _command_prefix(tokens)
    if prefix is None:
        return [(_PARSER_LIMIT, [])]
    index, changes_directory = prefix
    if index is None:
        return []
    verb, args = _verb_name(tokens[index]), tokens[index + 1 :]
    found: list[tuple[str, list[str]]] = []
    if changes_directory:
        found.append(("__location_change__", []))
    found.append((verb, args))
    payload = _nested_payload(verb, args)
    if payload is not None:
        found.extend(commands(payload, depth + 1, _nested_shell(verb)))
    elif verb in _EVAL_VERBS and args:
        # eval/iex execute their joined arguments as a command line.
        found.extend(commands(" ".join(args), depth + 1, shell))
    return found


def commands(text: str, depth: int = 0, shell: str = "") -> list[tuple[str, list[str]]]:
    """Parse bounded literal commands; substitutions precede their parent segments."""
    if depth > _MAX_DEPTH or len(text) > 32768:
        return [(_PARSER_LIMIT, [])]
    body, expansions = _strip_blocks(text, shell)
    found = _recursive_commands([*expansions, *_substitutions(body, shell)], depth, shell)
    for tokens in _split(body, shell):
        found.extend(_command_segment(tokens, depth, shell))
    return found


# ---------------------------------------------------------------------------
# Tools that carry a shell command. PowerShell is the primary shell on Windows
# hosts, so guarding only Bash leaves the main execution path uninspected.
# ---------------------------------------------------------------------------

_COMMAND_TOOLS = ("Bash", "PowerShell")

# ---------------------------------------------------------------------------
# Destructive command patterns — POSIX, Windows and PowerShell
# ---------------------------------------------------------------------------

_REMOVERS = {"rm", "remove-item", "ri", "rmdir", "rd", "del", "erase"}
_ALWAYS_BAD = {"format-volume", "clear-disk"}
_SAFE_ROOTS = {".scannerwork", ".sonar", "node_modules", "dist", "coverage", "storybook-static"}
_ROOTISH = {"/", "~", "*", ".", "..", "/*", "~/*", "./*"}


def _project_root() -> str:
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )


def _norm(target: str) -> str:
    target = target.replace("\\", "/")
    while target.startswith("./"):
        target = target[2:]
    return target.rstrip("/") or "/"


def _is_safe_target(target: str) -> bool:
    name = _norm(target)
    if (
        name.startswith(("/", "~", "$"))
        or re.match(r"[A-Za-z]:", name)
        or ".." in name.split("/")
        or any(char in name for char in "*$?[]{}:`")
    ):
        return False
    first = name.split("/")[0]
    if first not in _SAFE_ROOTS:
        return False
    # Existing junctions/symlinks cannot turn an artifact path into an outside target.
    base = os.path.abspath(os.path.join(_project_root(), first))
    real_base = os.path.realpath(base)
    candidate = os.path.realpath(os.path.join(_project_root(), name))
    try:
        return (
            os.path.normcase(base) == os.path.normcase(real_base)
            and os.path.commonpath([real_base, candidate]) == real_base
        )
    except ValueError:
        return False


def _is_dangerous_target(target: str) -> bool:
    name = _norm(target).lower().rstrip(")}")
    return (
        name in _ROOTISH
        or re.fullmatch(r"[a-z]:/?\*?", name) is not None
        or name.startswith(("$home", "$env:userprofile"))
        or re.fullmatch(r"/[^/]+", name) is not None
    )


def _remove_option(
    arg: str, low: str, next_arg: str | None
) -> tuple[int, bool, bool, list[str]] | None:
    if low in ("-path", "-literalpath", "-lp"):
        targets = next_arg.split(",") if next_arg is not None else []
        return (2 if next_arg is not None else 1, False, False, targets)
    if re.fullmatch(r"(?:/[sfq])+", low):
        return 1, "/s" in low, "/f" in low or "/q" in low, []
    if low.startswith("--"):
        return 1, low == "--recursive", low == "--force", []
    if not arg.startswith("-") or len(arg) <= 1:
        return None
    name = low[1:].split(":")[0]
    if name and "recurse".startswith(name):
        return 1, True, False, []
    if name and "force".startswith(name):
        return 1, False, True, []
    if set(name) <= set("rfvid"):
        return 1, "r" in name, "f" in name, []
    return 1, False, False, []


def _remove_flag_step(
    args: list[str],
    index: int,
    options: bool,
    recursive: bool,
    force: bool,
    targets: list[str],
) -> tuple[int, bool, bool, bool]:
    arg, low = args[index], args[index].lower()
    if arg in ("<", ">"):
        return index + 2, options, recursive, force
    if options and arg == "--":
        return index + 1, False, recursive, force
    if options:
        option = _remove_option(arg, low, args[index + 1] if index + 1 < len(args) else None)
        if option is not None:
            consumed, has_recursive, has_force, option_targets = option
            targets.extend(option_targets)
            return (
                index + consumed,
                options,
                recursive or has_recursive,
                force or has_force,
            )
    targets.extend(arg.split(","))
    return index + 1, options, recursive, force


def _remove_flags(args: list[str]) -> tuple[bool, bool, list[str]]:
    recursive = force = False
    targets: list[str] = []
    options = True
    index = 0
    while index < len(args):
        index, options, recursive, force = _remove_flag_step(
            args, index, options, recursive, force, targets
        )
    return recursive, force, targets


def _cleanup_allowed() -> bool:
    return os.path.normcase(os.path.realpath(os.getcwd())) == os.path.normcase(
        os.path.realpath(_project_root())
    )


def _unsafe_cmd_delete(
    verb: str,
    recursive: bool,
    force: bool,
    targets: list[str],
    cleanup_allowed: bool,
    args: list[str],
) -> bool:
    cmd_delete = any(re.fullmatch(r"(?:/[sfq])+", arg.lower()) for arg in args)
    return (
        cmd_delete
        and (recursive or (force and verb in {"del", "erase"}))
        and (
            not cleanup_allowed
            or not targets
            or not all(_is_safe_target(target) for target in targets)
        )
    )


def _unsafe_recursive_delete(
    recursive: bool,
    targets: list[str],
    cleanup_allowed: bool,
) -> bool:
    if not recursive:
        return False
    dangerous_target = any(_is_dangerous_target(target) for target in targets)
    safe_cleanup = (
        cleanup_allowed and bool(targets) and all(_is_safe_target(target) for target in targets)
    )
    return dangerous_target or not safe_cleanup


def _remover_rule(verb: str, args: list[str], cleanup_allowed: bool) -> str | None:
    recursive, force, targets = _remove_flags(args)
    # Preserve the old CMD force/recursive protection, including /s/q.
    if _unsafe_cmd_delete(verb, recursive, force, targets, cleanup_allowed, args):
        return "recursive-delete"
    if _unsafe_recursive_delete(recursive, targets, cleanup_allowed):
        return "recursive-delete"
    return None


def _command_rule(verb: str, args: list[str], cleanup_allowed: bool) -> str | None:
    if verb == _PARSER_LIMIT:
        return "command-parser-limit"
    if verb in _ALWAYS_BAD:
        return "destructive-verb"
    if verb == "format" and any(re.fullmatch(r"[A-Za-z]:", arg) for arg in args):
        return "format-drive"
    if verb in _REMOVERS:
        return _remover_rule(verb, args, cleanup_allowed)
    return None


def _is_destructive(command: str, shell: str = "") -> str | None:
    cleanup_allowed = _cleanup_allowed()
    for command_index, (verb, args) in enumerate(commands(command, shell=shell)):
        # A prior command can replace an approved directory with a symlink or
        # junction before the recursive delete runs. Do not authorize a safe
        # cleanup path after any earlier command in the same tool call.
        if command_index:
            cleanup_allowed = False
        if verb in {"cd", "chdir", "pushd", "popd", "set-location", "sl", "__location_change__"}:
            cleanup_allowed = False
        rule = _command_rule(verb, args, cleanup_allowed)
        if rule:
            return rule
    return None


# ---------------------------------------------------------------------------
# .env file access guard
# ---------------------------------------------------------------------------

_ENV_SAFE_SUFFIXES = (".env.sample", ".env.example", ".env.example.local", ".env.template")

# Which input fields name a file, per tool. Search tools reach file *contents*
# without ever supplying a file_path, so omitting them let `.env` be read in
# full through Grep. Note Grep's own `pattern` is deliberately absent: it is
# what is searched FOR, not what is searched IN, and grepping the source for
# the text ".env" is legitimate work. Glob's `pattern` IS the file selector,
# so there it is inspected.
_ENV_PATH_FIELDS: dict[str, tuple[str, ...]] = {
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


_ENV_NAME = re.compile(r"^(?:\*{0,2}\.env(?:[.*?\[{].*)?|.+\.env|\.envrc)$", re.IGNORECASE)
_ENV_EXEMPT_VERBS = {
    "echo",
    "printf",
    "write-output",
    "write-host",
    "ls",
    "dir",
    "gci",
    "get-childitem",
    "test-path",
    "test",
    "stat",
}
_INLINE_CODE_OPTIONS: dict[str, frozenset[str]] = {
    "node": frozenset({"-e", "--eval", "-p", "--print"}),
    "nodejs": frozenset({"-e", "--eval", "-p", "--print"}),
    "py": frozenset({"-c"}),
    "python": frozenset({"-c"}),
    "python3": frozenset({"-c"}),
}


def _is_env_file(path: str) -> bool:
    # Every segment counts: files below a `.env/` directory are secrets too.
    segments = path.replace("\\", "/").lower().split("/")
    return any(
        _ENV_NAME.fullmatch(segment) and segment not in _ENV_SAFE_SUFFIXES for segment in segments
    )


def _search_arg(args: list[str], index: int, low: str) -> tuple[int, list[str]] | None:
    if low.startswith(("--regexp=", "-pattern:")):
        return 1, []
    if low in {"-f", "--file"} and index + 1 < len(args):
        return 2, [args[index + 1]]
    if low.startswith("--file="):
        return 1, [args[index].split("=", 1)[1]]
    if low in {"-pattern", "-e", "--regexp"}:
        return 2, []
    return None


def _path_arg(args: list[str], index: int, low: str) -> tuple[int, list[str]] | None:
    if low in {"-path", "-literalpath", "-lp"} and index + 1 < len(args):
        return 2, args[index + 1].split(",")
    return None


def _git_message_arg(low: str) -> int | None:
    if low in {"-m", "--message"}:
        return 2
    if low.startswith("--message="):
        return 1
    return None


def _env_arg_step(
    verb: str,
    args: list[str],
    index: int,
    pattern_pending: bool,
    candidates: list[str],
) -> tuple[int, bool]:
    arg, low = args[index], args[index].lower()
    if verb in {"select-string", "sls", "grep", "rg"}:
        search_arg = _search_arg(args, index, low)
        if search_arg is not None:
            consumed, values = search_arg
            candidates.extend(values)
            return index + consumed, False
    path_arg = _path_arg(args, index, low)
    if path_arg is not None:
        consumed, values = path_arg
        candidates.extend(values)
        return index + consumed, pattern_pending
    if verb == "git":
        message_arg = _git_message_arg(low)
        if message_arg is not None:
            return index + message_arg, pattern_pending
    if not arg.startswith("-"):
        if pattern_pending:
            return index + 1, False
        candidates.extend(arg.split(","))
    elif "=" in arg:
        candidates.append(arg.split("=", 1)[1])
    elif low.startswith(("-path:", "-literalpath:")):
        candidates.extend(arg.split(":", 1)[1].split(","))
    return index + 1, pattern_pending


def _env_args(verb: str, args: list[str]) -> list[str]:
    candidates: list[str] = []
    search = verb in {"select-string", "sls", "grep", "rg"}
    pattern_pending = search
    index = 0
    while index < len(args):
        index, pattern_pending = _env_arg_step(verb, args, index, pattern_pending, candidates)
    if verb == "git":
        # Git object selectors can name a file without a filesystem path.
        candidates = [arg.rsplit(":", 1)[-1] for arg in candidates]
    return candidates


def _has_env_path_access(tool_name: str, tool_input: dict[str, object]) -> bool:
    for field in _ENV_PATH_FIELDS.get(tool_name, ()):
        value = tool_input.get(field)
        if isinstance(value, str) and _is_env_file(value):
            return True
    return False


def _inline_code_options(verb: str) -> frozenset[str]:
    options = _INLINE_CODE_OPTIONS.get(verb)
    if options is not None:
        return options
    if re.fullmatch(r"python3?(?:\.\d+)?", verb):
        return frozenset({"-c"})
    return frozenset()


def _has_inline_code_access(verb: str, args: list[str]) -> bool:
    options = _inline_code_options(verb)
    if not options:
        return False
    for arg in args:
        low = arg.lower()
        if low in options:
            return True
        if any(low.startswith(option) for option in options if len(option) == 2):
            return True
        if low.startswith(("--eval=", "--print=")):
            return True
    return False


def _has_env_loader_access(verb: str, args: list[str]) -> bool:
    if verb not in {"node", "nodejs"}:
        return False
    for index, arg in enumerate(args):
        low = arg.lower()
        if low.startswith(("-r", "--require=")) and "dotenv" in low:
            return True
        if (
            low in {"-r", "--require"}
            and index + 1 < len(args)
            and "dotenv" in args[index + 1].lower()
        ):
            return True
    return False


def _has_env_command_access(tool_name: str, tool_input: dict[str, object]) -> bool:
    command = tool_input.get("command")
    if tool_name not in _COMMAND_TOOLS or not isinstance(command, str):
        return False
    for verb, args in commands(command, shell=tool_name):
        # Inline interpreter code is opaque to this lexical parser and can
        # construct secret paths dynamically, so it must fail closed.
        if _has_inline_code_access(verb, args) or _has_env_loader_access(verb, args):
            return True
        for index, arg in enumerate(args[:-1]):
            if arg in {"<", ">"} and _is_env_file(args[index + 1]):
                return True
        if verb not in _ENV_EXEMPT_VERBS and any(
            _is_env_file(arg) for arg in _env_args(verb, args)
        ):
            return True
    return False


def _is_env_access(tool_name: str, tool_input: dict[str, object]) -> bool:
    return _has_env_path_access(tool_name, tool_input) or _has_env_command_access(
        tool_name, tool_input
    )


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------


_LOG_MAX_BYTES = 512 * 1024
_SUMMARY_MAX = 200
_SUMMARY_FIELDS = ("command", "file_path", "notebook_path", "path", "pattern", "glob")


def _summary(tool_input: dict[str, object]) -> str:
    # Arbitrary arguments, paths and search patterns may themselves contain secrets.
    # Record field names only rather than relying on an incomplete credential regex.
    return ", ".join(field + " supplied" for field in _SUMMARY_FIELDS if field in tool_input)[
        :_SUMMARY_MAX
    ]


def _lock_descriptor(descriptor: int, release: bool) -> None:
    if os.name == "nt":
        import msvcrt

        os.lseek(descriptor, 0, os.SEEK_SET)
        mode = msvcrt.LK_UNLCK if release else msvcrt.LK_NBLCK
        msvcrt.locking(descriptor, mode, 1)
        return
    import fcntl

    # Some type-checker platforms omit fcntl's POSIX-only names. Cast the
    # runtime module to the API available in this branch.
    posix_fcntl = cast(_FcntlApi, fcntl)
    mode = posix_fcntl.LOCK_UN if release else posix_fcntl.LOCK_EX | posix_fcntl.LOCK_NB
    posix_fcntl.flock(descriptor, mode)


def _audit_lock(descriptor: int, *, release: bool = False) -> None:
    """Use OS locks so a crashed writer cannot leave a stale lock behind."""
    deadline = time.monotonic() + 1
    while True:
        try:
            _lock_descriptor(descriptor, release)
            return
        except OSError:
            if release or time.monotonic() >= deadline:
                raise
            time.sleep(0.005)


def _log(
    tool_name: str, tool_input: dict[str, object], decision: str, rule: str | None = None
) -> None:
    try:
        folder = os.path.abspath(os.path.join(_project_root(), ".agent-sync", "logs"))
        if os.path.normcase(os.path.realpath(folder)) != os.path.normcase(folder):
            raise OSError("audit directory redirects outside its intended location")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, "pre_tool_use.jsonl")
        if any(os.path.islink(name) for name in (path, path + ".1", path + ".lock")):
            raise OSError("audit file must not be a symbolic link")
        known_tool = tool_name if tool_name in {*_COMMAND_TOOLS, *_ENV_PATH_FIELDS} else "Other"
        record: JsonObject = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "tool": known_tool,
            "decision": decision,
            "rule": rule,
            "summary": _summary(tool_input),
        }
        line = json.dumps(record) + "\n"
        with open(path + ".lock", "a+b") as lock:
            if os.fstat(lock.fileno()).st_size == 0:
                lock.write(b"\0")
                lock.flush()
            _audit_lock(lock.fileno())
            try:
                if (
                    os.path.exists(path)
                    and os.path.getsize(path) + len(line.encode("utf-8")) > _LOG_MAX_BYTES
                ):
                    os.replace(path, path + ".1")
                with open(path, "a", encoding="utf-8", newline="\n") as handle:
                    handle.write(line)
            finally:
                _audit_lock(lock.fileno(), release=True)
    except OSError:
        print("[pre_tool_use] audit log write failed", file=sys.stderr)


def _block(tool_name: str, tool_input: dict[str, object], rule: str, message: str) -> None:
    _log(tool_name, tool_input, "block", rule)
    print(f"BLOCKED: {message} (rule: {rule})", file=sys.stderr)
    print(f"Input: {_summary(tool_input)}", file=sys.stderr)
    raise SystemExit(2)


def main() -> None:
    try:
        raw_data: object = json.load(sys.stdin)
    except json.JSONDecodeError, UnicodeDecodeError, OSError:
        return
    data = _as_json_object(raw_data)
    if data is None:
        return
    tool_name = data.get("tool_name")
    if not isinstance(tool_name, str):
        return
    tool_input = _as_json_object(data.get("tool_input")) or {}
    if _is_env_access(tool_name, tool_input):
        _block(
            tool_name,
            tool_input,
            "secret-file-access",
            "access to .env secret files is not allowed; use .env.sample for templates",
        )
    command = tool_input.get("command")
    if tool_name in _COMMAND_TOOLS and isinstance(command, str):
        rule = _is_destructive(command, tool_name)
        if rule:
            _block(tool_name, tool_input, rule, "destructive command detected")
    _log(tool_name, tool_input, "allow")


if __name__ == "__main__":
    main()
