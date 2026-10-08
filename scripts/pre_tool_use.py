#!/usr/bin/env python3
"""
A Team PreToolUse safety guard.
Blocks destructive commands and .env file access before any tool fires.
Exit 2 = block + show error to Claude. Exit 0 = allow.
"""

import json
import os
import re
import sys
import time
from typing import cast

JsonObject = dict[str, object]

_WRAPPERS = {"sudo", "command", "env", "time", "nohup", "exec", "xargs", "call"}
_WRAPPER_VALUES = {
    "sudo": {
        "-u",
        "-g",
        "-h",
        "-p",
        "-C",
        "-T",
        "-r",
        "-t",
        "--user",
        "--group",
        "--host",
        "--prompt",
        "--close-from",
        "--command-timeout",
        "--role",
        "--type",
    },
    "env": {"-u", "--unset", "-C", "--chdir"},
    "time": {"-f", "--format", "-o", "--output"},
    "exec": {"-a"},
    "xargs": {
        "-n",
        "-I",
        "-P",
        "-L",
        "-d",
        "-E",
        "--max-args",
        "--replace",
        "--max-procs",
        "--max-lines",
        "--delimiter",
        "--eof",
    },
}
_SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
_PS_SHELLS = {"pwsh", "powershell"}
_EVAL_VERBS = {"eval", "iex", "invoke-expression"}
_MAX_DEPTH = 8
_PARSER_LIMIT = "__parser_limit__"
_HEREDOC = re.compile(r"<<(-?)\s*(['\"]?)([\w-]+)\2")


def _substitutions(text: str, shell: str = "", *, literal_body: bool = False) -> list[str]:
    """Extract executable substitutions, respecting literal quotes and escapes."""
    found: list[str] = []
    quote: str | None = None
    i = 0
    while i < len(text):
        char = text[i]
        if char == "\\" and quote != "'" and shell != "PowerShell":
            i += 2
            continue
        if char == "`" and shell == "PowerShell" and quote != "'":
            i += 2
            continue
        if not literal_body and char in "'\"" and (quote is None or quote == char):
            quote = None if quote else char
            i += 1
            continue
        if quote != "'" and text.startswith("$(", i):
            start = i + 2
            j, balance, inner_quote = start, 1, None
            while j < len(text) and balance:
                current = text[j]
                if current == "\\" and inner_quote != "'" and shell != "PowerShell":
                    j += 2
                    continue
                if current in "'\"" and (inner_quote is None or inner_quote == current):
                    inner_quote = None if inner_quote else current
                elif inner_quote is None:
                    if current == "(":
                        balance += 1
                    elif current == ")":
                        balance -= 1
                j += 1
            found.append(text[start : j - 1] if not balance else _PARSER_LIMIT)
            i = j
            continue
        if char == "`" and quote != "'":
            end = text.find("`", i + 1)
            found.append(text[i + 1 : end] if end >= 0 else _PARSER_LIMIT)
            i = end + 1 if end >= 0 else len(text)
            continue
        i += 1
    return found


def _strip_blocks(text: str, shell: str = "") -> tuple[str, list[str]]:
    out: list[str] = []
    substitutions: list[str] = []
    closers: list[tuple[str, bool, bool]] = []
    for line in text.split("\n"):
        if closers:
            closer, expands, tabs = closers[0]
            if (line.lstrip("\t") if tabs else line) == closer:
                closers.pop(0)
            elif expands:
                # Bodies are data, but unquoted heredocs still execute expansions.
                substitutions.extend(_substitutions(line, shell, literal_body=True))
            continue
        quote: str | None = None
        i = 0
        kept: list[str] = []
        while i < len(line):
            char = line[i]
            escape = "`" if shell == "PowerShell" else "^" if shell == "CMD" else "\\"
            if char == escape and quote != "'" and i + 1 < len(line):
                kept.extend(line[i : i + 2])
                i += 2
                continue
            if (
                char == "#"
                and quote is None
                and shell != "CMD"
                and (i == 0 or line[i - 1].isspace() or line[i - 1] in ";|&")
            ):
                break
            quotes = '"' if shell == "CMD" else "'\""
            if char in quotes and (quote is None or quote == char):
                if quote is None and i and line[i - 1] == "@" and not line[i + 1 :].strip():
                    kept.pop()
                    closers.append((char + "@", char == '"', False))
                    break
                quote = None if quote else char
            match = _HEREDOC.match(line, i) if quote is None else None
            if match is not None:
                closers.append((match[3], not match[2], bool(match[1])))
                i = match.end()
                continue
            kept.append(char)
            i += 1
        out.append("".join(kept))
    return "\n".join(out), substitutions


def _split(text: str, shell: str = "") -> list[list[str]]:
    segments: list[list[str]] = []
    tokens: list[str] = []
    current: list[str] = []
    quote: str | None = None

    def flush() -> None:
        if current:
            tokens.append("".join(current))
            current.clear()

    def end() -> None:
        flush()
        if tokens:
            segments.append(list(tokens))
            tokens.clear()

    i = 0
    while i < len(text):
        char = text[i]
        escape = "`" if shell == "PowerShell" else "^" if shell == "CMD" else "\\"
        if char == escape and quote != "'" and i + 1 < len(text):
            following = text[i + 1]
            if (
                shell in ("PowerShell", "CMD")
                or (shell == "Bash" and (quote != '"' or following in '$`"\\\n'))
                or (not shell and following in "'\";|& \t\n$`")
            ):
                if following != "\n":
                    current.append(following)
                i += 2
                continue
        if quote:
            if char == quote:
                quote = None
            else:
                current.append(char)
        elif char in ('"' if shell == "CMD" else "'\""):
            quote = char
        elif char in ";|&\n":
            end()
        elif char in "<>":
            flush()
            tokens.append(char)
        elif char in " \t":
            flush()
        else:
            current.append(char)
        i += 1
    end()
    return segments


def _verb_name(token: str) -> str:
    name = token.replace("\\", "/").rsplit("/", 1)[-1].lower().lstrip("({")
    for extension in (".exe", ".cmd", ".bat"):
        if name.endswith(extension):
            name = name[: -len(extension)]
    return name


def _verb_index(tokens: list[str]) -> int | None:
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token in {"(", "{", "}", ")", "then", "do", "else", "if", "while", "until", "!"}:
            i += 1
            continue
        if re.match(r"^[A-Za-z_][\w]*=", token):
            i += 1
            continue
        wrapper = _verb_name(token)
        if wrapper in _WRAPPERS:
            i += 1
            while i < len(tokens) and tokens[i].startswith("-"):
                option = tokens[i]
                if wrapper == "env" and option in {"-S", "--split-string"}:
                    return i  # unsupported expanding wrapper is blocked by commands()
                takes_value = option in _WRAPPER_VALUES.get(wrapper, set())
                i += 2 if takes_value else 1
            continue
        return i
    return None


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


def commands(text: str, depth: int = 0, shell: str = "") -> list[tuple[str, list[str]]]:
    """Parse bounded literal commands; substitutions precede their parent segments."""
    if depth > _MAX_DEPTH or len(text) > 32768:
        return [(_PARSER_LIMIT, [])]
    found: list[tuple[str, list[str]]] = []
    body, expansions = _strip_blocks(text, shell)
    for payload in [*expansions, *_substitutions(body, shell)]:
        found.extend(commands(payload, depth + 1, shell))
    for tokens in _split(body, shell):
        index = _verb_index(tokens)
        if index is None:
            continue
        verb, args = _verb_name(tokens[index]), tokens[index + 1 :]
        if tokens[index] in {"-S", "--split-string"}:
            verb = _PARSER_LIMIT
        found.append((verb, args))
        payload = _nested_payload(verb, args)
        if payload is not None:
            nested_shell = (
                "PowerShell" if verb in _PS_SHELLS else "Bash" if verb in _SHELLS else "CMD"
            )
            found.extend(commands(payload, depth + 1, nested_shell))
        elif verb in _EVAL_VERBS and args:
            # eval/iex execute their joined arguments as a command line.
            found.extend(commands(" ".join(args), depth + 1, shell))
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


def _remove_flags(args: list[str]) -> tuple[bool, bool, list[str]]:
    recursive = force = False
    targets: list[str] = []
    options = True
    index = 0
    while index < len(args):
        arg, low = args[index], args[index].lower()
        if arg in ("<", ">"):
            index += 2
            continue
        if options and arg == "--":
            options = False
        elif options and low in ("-path", "-literalpath", "-lp") and index + 1 < len(args):
            targets.extend(args[index + 1].split(","))
            index += 2
            continue
        elif options and re.fullmatch(r"(?:/[sfq])+", low):
            recursive = recursive or "/s" in low
            force = force or "/f" in low or "/q" in low
        elif options and low.startswith("--"):
            recursive = recursive or low == "--recursive"
            force = force or low == "--force"
        elif options and arg.startswith("-") and len(arg) > 1:
            name = low[1:].split(":")[0]
            if name and "recurse".startswith(name):
                recursive = True
            elif name and "force".startswith(name):
                force = True
            elif set(name) <= set("rfvid"):
                recursive = recursive or "r" in name
                force = force or "f" in name
        else:
            targets.extend(arg.split(","))
        index += 1
    return recursive, force, targets


def _is_destructive(command: str, shell: str = "") -> str | None:
    cleanup_allowed = os.path.normcase(os.path.realpath(os.getcwd())) == os.path.normcase(
        os.path.realpath(_project_root())
    )
    for verb, args in commands(command, shell=shell):
        if verb in {"cd", "chdir", "pushd", "popd", "set-location", "sl"}:
            cleanup_allowed = False
        if verb == _PARSER_LIMIT:
            return "command-parser-limit"
        if verb in _ALWAYS_BAD:
            return "destructive-verb"
        if verb == "format" and any(re.fullmatch(r"[A-Za-z]:", arg) for arg in args):
            return "format-drive"
        if verb in _REMOVERS:
            recursive, force, targets = _remove_flags(args)
            # Preserve the old CMD force/recursive protection, including /s/q.
            cmd_delete = any(re.fullmatch(r"(?:/[sfq])+", arg.lower()) for arg in args)
            if (
                cmd_delete
                and (recursive or (force and verb in {"del", "erase"}))
                and (
                    not cleanup_allowed
                    or not targets
                    or not all(_is_safe_target(target) for target in targets)
                )
            ):
                return "recursive-delete"
            if recursive and (
                any(_is_dangerous_target(target) for target in targets)
                or (
                    force
                    and not (
                        cleanup_allowed
                        and targets
                        and all(_is_safe_target(target) for target in targets)
                    )
                )
            ):
                return "recursive-delete"
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


def _is_env_file(path: str) -> bool:
    # Every segment counts: files below a `.env/` directory are secrets too.
    segments = path.replace("\\", "/").lower().split("/")
    return any(
        _ENV_NAME.fullmatch(segment) and segment not in _ENV_SAFE_SUFFIXES
        for segment in segments
    )


def _env_args(verb: str, args: list[str]) -> list[str]:
    candidates: list[str] = []
    search = verb in {"select-string", "sls", "grep", "rg"}
    pattern_pending = search
    index = 0
    while index < len(args):
        arg, low = args[index], args[index].lower()
        if search and low.startswith(("--regexp=", "-pattern:")):
            pattern_pending = False
            index += 1
            continue
        if search and low in {"-f", "--file"} and index + 1 < len(args):
            candidates.append(args[index + 1])
            pattern_pending = False
            index += 2
            continue
        if search and low.startswith("--file="):
            candidates.append(arg.split("=", 1)[1])
            pattern_pending = False
            index += 1
            continue
        if search and low in {"-pattern", "-e", "--regexp"}:
            pattern_pending = False
            index += 2
            continue
        if low in {"-path", "-literalpath", "-lp"} and index + 1 < len(args):
            candidates.extend(args[index + 1].split(","))
            index += 2
            continue
        if verb == "git" and low in {"-m", "--message"}:
            index += 2
            continue
        if verb == "git" and low.startswith("--message="):
            index += 1
            continue
        if not arg.startswith("-"):
            if pattern_pending:
                pattern_pending = False
            else:
                candidates.extend(arg.split(","))
        elif "=" in arg:
            candidates.append(arg.split("=", 1)[1])
        elif low.startswith(("-path:", "-literalpath:")):
            candidates.extend(arg.split(":", 1)[1].split(","))
        index += 1
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


def _has_env_command_access(tool_name: str, tool_input: dict[str, object]) -> bool:
    command = tool_input.get("command")
    if tool_name not in _COMMAND_TOOLS or not isinstance(command, str):
        return False
    for verb, args in commands(command, shell=tool_name):
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


def _audit_lock(descriptor: int, *, release: bool = False) -> None:
    """Use OS locks so a crashed writer cannot leave a stale lock behind."""
    deadline = time.monotonic() + 1
    while True:
        try:
            if os.name == "nt":
                import msvcrt

                os.lseek(descriptor, 0, os.SEEK_SET)
                msvcrt.locking(descriptor, msvcrt.LK_UNLCK if release else msvcrt.LK_NBLCK, 1)
            else:
                import fcntl

                fcntl.flock(descriptor, fcntl.LOCK_UN if release else fcntl.LOCK_EX | fcntl.LOCK_NB)
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
        record = {
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
    except (json.JSONDecodeError, UnicodeDecodeError, OSError):
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
