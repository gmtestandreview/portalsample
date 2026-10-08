# pre_tool_use.py Guard Fixes Implementation Plan

**Goal:** Remove the false positives, latency, fail-closed breakage and
 log defects in `scripts/pre_tool_use.py` that block sonar and
  other tool calls, without weakening protection against real destructive
   commands and secret-file access.

**Architecture:** Replace whole-string regex matching with a small
 quote-aware tokenizer.
 Rules then inspect only the command verb and its arguments
  (recursing into `bash -c`, `pwsh -Command` and `$(...)`).
 Recursive deletes are allowed only on an artefact allowlist;
 `.env` is matched by filename.
 Logging becomes append-only JSONL under the script's own project root.
 The settings wrapper fails open on guard crashes.

**Tech Stack:** Python 3 stdlib only (`json`, `os`, `re`, `sys`, `time`),
subprocess behaviour-matrix test (`tests/hooks/test_pre_tool_use.py`),
`.claude/settings.json` shell wrapper, `.claude/settings.local.json` env.

## Source Inputs

- Audit findings 1-7 from this session (architecture-audit of `scripts/pre_tool_use.py`).
- Relevant files inspected:
  - `scripts/pre_tool_use.py`: current guard (regex over full text,
   JSON-array log, cwd-relative log path).
  - `tests/hooks/test_pre_tool_use.py`: existing matrix, already extended this
   session with RED cases.
  - `.claude/settings.json:215-233`: PreToolUse wrapper (fail-closed on
   exit code other than 0/2, relative script path) and tokensave hook.
  - `.claude/settings.local.json:125-135`:
   gitignored `env` block (target for GateGuard variables).
  - `~/.claude/plugins/cache/ecc/ecc/2.2.1/scripts/hooks/gateguard-fact-force.js`:
  confirms `GATEGUARD_BASH_ROUTINE_DISABLED` (line 164) and
   `GATEGUARD_EXEMPT_GLOBS` (line 117).
  - `.gitignore:94,110`: `.claude/settings.local.json` and
   `.agent-sync/logs/` are ignored.

## Assumptions and Unknowns

- Assumption: `python -I -S` runs the guard (stdlib only). Verified by Task 4's
 test run.
- Assumption: settings `env` values reach hook subprocesses;
 effective from the next session start.
- Assumption: the old `.agent-sync/logs/pre_tool_use.json` (970 KB) is left in place;
 deleting it is the owner's call.
- Blocking ambiguity: none. GateGuard cannot be scoped to "sonar only"
 (it is per-session), so Task 6 uses its narrowest switches.

## Requirement Traceability

| Finding | Requirement | Task(s) |
| --- | --- | --- |
| 1 HIGH | Quoted strings, heredocs and search patterns are data, not commands | 1, 2 |
| 2 HIGH | Scanner/build artefact cleanup allowed; root/home/glob deletes still blocked | 2 |
| 3 HIGH | `.env` matched by filename, not substring | 3 |
| 4 MED | Wrapper fails open on guard crash, resolves script by project dir | 5 (automated in `test_wrapper.py`) |
| 5 MED | Lower per-call latency | 4, 5 |
| 6 MED | Append-only, bounded, redacted log that records blocks | 4 |
| 7 LOW | English messages with rule id; nested-shell/subshell bypasses closed | 1, 2, 3 |
| GateGuard | Disable first-command/first-edit fact forcing for the sonar workflow | 6 |

## Framework Fit

Traceability, test-first, vertical slices: used. Threat modelling: light (guard
 is a security control; bypass cases are tests). DDD, C4, ADR, migration: not needed.

## Files and Responsibilities

| Path | Action | Responsibility |
| --- | --- | --- |
| `tests/hooks/test_pre_tool_use.py` | Modify (RED cases already added) | Behaviour matrix, false positives, log and robustness checks |
| `scripts/pre_tool_use.py` | Modify | Tokenizer, delete rule, env rule, logging, English messages |
| `tests/hooks/test_wrapper.py` | Create (RED already added) | Wrapper behaviour: fail-open on crash or missing guard, exit-code pass-through, block |
| `.claude/settings.json` | Modify | Wrapper: project-dir path, `-I -S`, fail-open on crash |
| `.claude/settings.local.json` | Modify | GateGuard env variables |

## Baseline RED state

- `python tests\hooks\test_pre_tool_use.py` currently reports 47/60 passing.
Failing: `grep reads .env` (expect BLOCK);
- `scanner workdir cleanup` (pwsh and bash) and `node_modules cache cleanup`
(expect ALLOW);
- false positives for `Select-String 'import.meta.env'`,
- a `Select-String` pattern naming `rm -rf|Remove-Item`,
- `cat ... | grep process.env`,
- a `git commit -m` message naming the flag and `.env`,
- a bash heredoc, a PowerShell here-string,
- `Read process.env.d.ts`, `Grep .environment-notes.md`; and
- `blocked calls are not logged`.

## Prototype verification (executed 2026-10-05)

Every Python snippet in Tasks 1-4 was extracted from this plan into a
 throwaway prototype outside the repository and run unmodified:

- `tests/hooks/test_guard_parser.py` (Task 1 test): `9/9 passed`
- `tests/hooks/test_pre_tool_use.py` (60-case matrix, including log and robustness checks): `60/60 passed`
- `tests/hooks/test_wrapper.py` against the Task 5 wrapper and that prototype:
 `5/5 passed`

The same suites fail against the current repository code as recorded in
 each task's RED step, so the tests are shown to discriminate.

## Tasks

### Task 1: Quote-aware command parser (findings 1, 7)

`Files`

- Create: `tests/hooks/test_guard_parser.py`
- Modify: `scripts/pre_tool_use.py`

- [ ] **Step 1: Write the failing parser test**

`tests/hooks/test_guard_parser.py` (run as a script, same style as the matrix; imports the guard by path):

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import pre_tool_use as g

CASES = [
    # (command, expected list of (verb, args))
    ("cat a | grep b", [("cat", ["a"]), ("grep", ["b"])]),
    ("echo 'rm -r" + "f /'", [("echo", ["rm -r" + "f /"])]),          # quoted text is one arg
    ("sudo rm -r a; ls", [("rm", ["-r", "a"]), ("ls", [])]),           # wrapper skipped
    ("bash -c 'rm x'", [("bash", ["-c", "rm x"]), ("rm", ["x"])]),    # nested shell recursed
    ("echo $(rm y)", [("rm", ["y"]), ("echo", ["$(rm", "y)"])]),      # substitution first
    ("python - <<'EOF'\ncat x\nEOF", [("python", ["-"])]),             # heredoc body + operator dropped
    ("$s = @'\ncat x\n'@\n$s | python -", [("$s", ["="]), ("$s", []), ("python", ["-"])]),
    ("echo hi >.out", [("echo", ["hi", ">", ".out"])]),               # redirect tokens kept
    ("Remove-Item C:\\temp\\x", [("remove-item", ["C:\\temp\\x"])]),  # backslash literal
]
bad = [c for c, want in CASES if g.commands(c) != want]
for c in bad:
    print("FAIL", repr(c), "->", g.commands(c))
print(f"{len(CASES) - len(bad)}/{len(CASES)} passed")
sys.exit(1 if bad else 0)
```

Result order is fixed: commands found inside `$(...)`/backticks come first,
 then the segment commands in text order, each nested
 `-c`/`-Command` payload directly after its parent.
 The here-string case yields `$s` twice because a newline ends the first segment;
  the property under test is that the body (`cat x`) never appears.

- [ ] **Step 2: Verify the test fails**

Run: `python tests\hooks\test_guard_parser.py`
Expected: `AttributeError: module 'pre_tool_use' has no attribute 'commands'`

- [ ] **Step 3: Implement**

In `scripts/pre_tool_use.py` add, replacing the regex tables over time:

```python
_WRAPPERS = {"sudo", "command", "env", "time", "nohup", "exec", "xargs", "call", "&"}
_SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
_PS_SHELLS = {"pwsh", "powershell"}
_HEREDOC = re.compile(r"<<-?\s*['\"]?(\w+)['\"]?")
_SUBST = re.compile(r"\$\(([^()]*)\)|`([^`]*)`")
_MAX_DEPTH = 3

def _strip_blocks(text):
    out, closer = [], None
    for line in text.split("\n"):
        if closer is not None:
            if (closer[0] == "h" and line.strip() == closer[1]) or \
               (closer[0] == "p" and line.startswith(closer[1])):
                closer = None
            continue
        m = _HEREDOC.search(line)
        if m:
            closer = ("h", m.group(1))
            line = line[: m.start()] + line[m.end():]
        elif line.rstrip().endswith(("@'", '@"')):
            closer = ("p", "'@" if line.rstrip().endswith("@'") else '"@')
            line = line.rstrip()[:-2]
        out.append(line)
    return "\n".join(out)

def _split(text):
    segs, toks, cur, quote = [], [], [], None
    def flush():
        if cur: toks.append("".join(cur)); cur.clear()
    def end():
        flush()
        if toks: segs.append(list(toks)); toks.clear()
    for ch in text:
        if quote:
            if ch == quote: quote = None
            else: cur.append(ch)
        elif ch in "'\"": quote = ch
        elif ch in ";|&\n": end()
        elif ch in "<>":
            flush(); toks.append(ch)
        elif ch in " \t": flush()
        else: cur.append(ch)
    end()
    return segs

def _verb_index(toks):
    for i, t in enumerate(toks):
        if "=" in t and t.split("=")[0].replace("_", "").isalnum() and not t.startswith("-"):
            continue
        if t.lower() in _WRAPPERS:
            continue
        return i
    return None

def _verb_name(tok):
    name = tok.replace("\\", "/").rsplit("/", 1)[-1].lower()
    for ext in (".exe", ".cmd", ".bat"):
        if name.endswith(ext): name = name[: -len(ext)]
    return name

def commands(text, depth=0):
    """Return [(verb, args)] for every command in `text`, recursing into nested shells."""
    found = []
    body = _strip_blocks(text)
    for m in _SUBST.finditer(body):
        if depth < _MAX_DEPTH: found += commands(m.group(1) or m.group(2), depth + 1)
    for toks in _split(body):
        i = _verb_index(toks)
        if i is None: continue
        verb, args = _verb_name(toks[i]), toks[i + 1:]
        found.append((verb, args))
        payload = _nested_payload(verb, args)
        if payload and depth < _MAX_DEPTH: found += commands(payload, depth + 1)
    return found

def _nested_payload(verb, args):
    low = [a.lower() for a in args]
    if verb in _SHELLS:
        for k, a in enumerate(args[:-1]):
            if a.startswith("-") and not a.startswith("--") and a.endswith("c"): return args[k + 1]
    if verb in _PS_SHELLS:
        for k, a in enumerate(low[:-1]):
            if a in ("-c", "-command") or (a.startswith("-co") and "command".startswith(a[1:])):
                return " ".join(args[k + 1:])
    if verb == "cmd":
        for k, a in enumerate(low[:-1]):
            if a in ("/c", "/k"): return " ".join(args[k + 1:])
    return None
```

The result order is the one documented under the test in Step 1.

- [ ] **Step 4: Verify the test passes**

Run: `python tests\hooks\test_guard_parser.py`
Expected: `9/9 passed`

- [ ] **Step 5: Regression**

Run: `python tests\hooks\test_pre_tool_use.py`
Expected: pass count not lower than the 47/60 baseline (parser is added, not yet wired in).

- [ ] **Step 6: Commit**

```bash
git add scripts/pre_tool_use.py tests/hooks/test_guard_parser.py
git commit -m "refactor: add quote-aware command parser to pre-tool-use guard"
```

### Task 2: Target-aware delete rule (findings 1, 2, 7)

`Files`

- Modify: `scripts/pre_tool_use.py` (replace `_RM_*` tables, `_is_destructive`,
 `_has_recursive_rm`, `_DANGEROUS_PATHS_RE`)
- Test: `tests/hooks/test_pre_tool_use.py` (cases already present)

- [ ] **Step 1: Tests exist** (RED cases added this session: scanner/node_modules
 ALLOW, `dist/../src` and `*` BLOCK, nested `bash -c`,
 `pwsh -Command`, `$(...)` BLOCK, quoted-pattern false positives).

- [ ] **Step 2: Verify RED**

Run: `python tests\hooks\test_pre_tool_use.py`
Expected: `47/60 passed` (13 failing, as in Baseline).

- [ ] **Step 3: Implement**

```python
_REMOVERS = {"rm", "remove-item", "ri", "rmdir", "rd", "del", "erase"}
_ALWAYS_BAD = {"format-volume", "clear-disk"}
_SAFE_ROOTS = {".scannerwork", ".sonar", "node_modules", "dist", "coverage", "storybook-static"}
_ROOTISH = {"/", "~", "*", ".", "..", "/*", "~/*", "./*"}

def _norm(t):
    t = t.replace("\\", "/")
    while t.startswith("./"):
        t = t[2:]
    return t.rstrip("/") or "/"

def _is_safe_target(t):
    n = _norm(t)
    if n.startswith(("/", "~", "$")) or re.match(r"[A-Za-z]:", n) or ".." in n.split("/"):
        return False
    return n.split("/")[0] in _SAFE_ROOTS

def _is_dangerous_target(t):
    n = _norm(t).lower()
    return (n in _ROOTISH or re.fullmatch(r"[a-z]:/?\*?", n) is not None
            or n.startswith(("$home", "$env:userprofile")) or re.fullmatch(r"/[^/]+", n) is not None)

def _remove_flags(args):
    rec = force = False
    targets, i = [], 0
    while i < len(args):
        a, low = args[i], args[i].lower()
        if a in ("<", ">"):
            i += 2; continue
        if low in ("-path", "-literalpath", "-lp") and i + 1 < len(args):
            targets.append(args[i + 1]); i += 2; continue
        if low == "/s": rec = True
        elif low in ("/f", "/q"): force = True
        elif low.startswith("--"):
            rec = rec or low == "--recursive"; force = force or low == "--force"
        elif a.startswith("-") and len(a) > 1:
            name = low[1:].split(":")[0]
            if name and "recurse".startswith(name): rec = True
            elif name and "force".startswith(name): force = True
            elif len(name) <= 4 and set(name) <= set("rfvid"):
                rec = rec or "r" in name; force = force or "f" in name
        else:
            targets.append(a)
        i += 1
    return rec, force, targets

def _is_destructive(command):
    for verb, args in commands(command):
        if verb in _ALWAYS_BAD:
            return "destructive-verb"
        if verb == "format" and any(re.fullmatch(r"[A-Za-z]:", a) for a in args):
            return "format-drive"
        if verb in _REMOVERS:
            rec, force, targets = _remove_flags(args)
            if rec and (any(_is_dangerous_target(t) for t in targets)
                        or (force and not (targets and all(_is_safe_target(t) for t in targets)))):
                return "recursive-delete"
    return None
```

`main()` prints `Rule: <id>` using the returned id (see Task 4 for the final messages).

- [ ] **Step 4: Verify**

Run: `python tests\hooks\test_pre_tool_use.py`
Expected: 8 failing: `grep reads .env`, `Select-String 'import.meta.env'`,
 `cat ... | grep process.env`, heredoc, here-string, `Read process.env.d.ts`,
  `Grep .environment-notes.md`, `blocked calls are not logged`
   (all fixed by Tasks 3-4).
   No remaining delete-rule failures.

- [ ] **Step 5: Regression**: same command; every pre-existing `BLOCK` delete case (`rm -rf /`, `rm -fr ~`, `Remove-Item -Recurse -Force .`, reverse order `C:\`, `ri -r -fo ./build`, `rm -Recurse -Force ~`, `-Confirm:$false`, `Format-Volume`) must still print `[pass]`.

- [ ] **Step 6: Commit**

```bash
git add scripts/pre_tool_use.py
git commit -m "fix: scope pre-tool-use delete guard to targets and allow scanner  cleanup"
```

### Task 3: Filename-based env rule (findings 3, 7)

`Files`

- Modify: `scripts/pre_tool_use.py` (replace `_is_sensitive_env_value`, `_has_env_command_access`, `_ENV_*_PATTERNS`)
- Test: `tests/hooks/test_pre_tool_use.py` (cases already present)

- [ ] **Step 1: Tests exist** (`grep reads .env.local`, redirect into the file, `*.env*` glob BLOCK; `ls .env.local`, `Select-String 'import.meta.env'`, `process.env.d.ts`, `.environment-notes.md`, heredoc and here-string text ALLOW).

- [ ] **Step 2: Verify RED**: `python tests\hooks\test_pre_tool_use.py`; Expected: 8 failing (list in Task 2 Step 4).

- [ ] **Step 3: Implement**

```python
_ENV_NAME = re.compile(r"^\*{0,2}\.env([.*?].*)?$", re.IGNORECASE)
_ENV_EXEMPT_VERBS = {"echo", "printf", "write-output", "write-host", "ls", "dir", "gci",
                     "get-childitem", "test-path", "test", "stat", "git"}

def _is_env_file(path):
    base = path.replace("\\", "/").rsplit("/", 1)[-1]
    return bool(_ENV_NAME.match(base)) and not base.endswith(_ENV_SAFE_SUFFIXES)

def _env_args(verb, args):
    """Arguments that can name a file: drop Select-String's search pattern."""
    if verb in ("select-string", "sls"):
        low = [a.lower() for a in args]
        if "-pattern" in low:
            k = low.index("-pattern"); return args[:k] + args[k + 2:]
        positional = [i for i, a in enumerate(args) if not a.startswith("-")]
        return [a for i, a in enumerate(args) if not positional or i != positional[0]]
    return args

def _has_env_command_access(tool_name, tool_input):
    if tool_name not in _COMMAND_TOOLS:
        return False
    command = tool_input.get("command")
    if not isinstance(command, str):
        return False
    for verb, args in commands(command):
        for k, a in enumerate(args):
            if a in (">", "<") and k + 1 < len(args) and _is_env_file(args[k + 1]) and a == ">":
                return True
        if verb in _ENV_EXEMPT_VERBS:
            continue
        if any(_is_env_file(a) for a in _env_args(verb, args)):
            return True
    return False
```

Replace the path and combined checks, keeping `_COMMAND_TOOLS`, `_ENV_SAFE_SUFFIXES` and `_ENV_PATH_FIELDS` unchanged:

```python
def _has_env_path_access(tool_name, tool_input):
    return any(isinstance(tool_input.get(f), str) and _is_env_file(tool_input[f])
               for f in _ENV_PATH_FIELDS.get(tool_name, ()))

def _is_env_access(tool_name, tool_input):
    return _has_env_path_access(tool_name, tool_input) or _has_env_command_access(tool_name, tool_input)
```

Remove the now-unused `_ENV_BASH_PATTERNS`, `_ENV_PS_PATTERNS`, `_ENV_COMMAND_PATTERNS`, `_as_json_object`, `_is_sensitive_env_value`.

- [ ] **Step 4: Verify**: `python tests\hooks\test_pre_tool_use.py`; Expected: 1 failing (`blocked calls are not logged`).

- [ ] **Step 5: Regression**: `python tests\hooks\test_guard_parser.py`; Expected `9/9 passed`.

- [ ] **Step 6: Commit**

```bash
git add scripts/pre_tool_use.py
git commit -m "fix: match secret env files by filename in pre-tool-use guard"
```

### Task 4: Append-only redacted log, English messages, lighter imports (findings 5, 6, 7)

`Files`

- Modify: `scripts/pre_tool_use.py` (`_log`, `main`, imports, messages)
- Test: `tests/hooks/test_pre_tool_use.py` (`check_log`, `check_fail_open_wrapper` already present)

- [ ] **Step 1: Tests exist** (`check_log`: valid JSONL, block records present, secret and Write body absent; `check_fail_open_wrapper`: malformed stdin exits 0; `invoke` already runs the guard as `python -I -S` with `CLAUDE_PROJECT_DIR` set to a temp dir).

- [ ] **Step 2: Verify RED**

Run: `python tests\hooks\test_pre_tool_use.py`
Expected: `blocked calls are not logged` failing (59/60 after Task 3).

- [ ] **Step 3: Implement**

Imports become `json, os, re, sys, time` only (drop `pathlib`, `typing`, `contextlib`, `collections.abc`, `cast`; use builtin generics). Replace the logging section and `main`:

```python
_LOG_MAX_BYTES = 512 * 1024
_SUMMARY_MAX = 200
_SUMMARY_FIELDS = ("command", "file_path", "notebook_path", "path", "pattern", "glob")
_REDACT = re.compile(r"(?i)((?:token|password|passwd|secret|api[_-]?key|authorization)\S*?[=:]\s*)\S+")

def _project_root():
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _summary(tool_input):
    for field in _SUMMARY_FIELDS:
        value = tool_input.get(field)
        if isinstance(value, str):
            return _REDACT.sub(r"\1[REDACTED]", value)[:_SUMMARY_MAX]
    return ""

def _log(tool_name, tool_input, decision, rule=None):
    try:
        folder = os.path.join(_project_root(), ".agent-sync", "logs")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, "pre_tool_use.jsonl")
        if os.path.exists(path) and os.path.getsize(path) > _LOG_MAX_BYTES:
            os.replace(path, path + ".1")
        record = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "tool": tool_name,
                  "decision": decision, "rule": rule, "summary": _summary(tool_input)}
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\n")
    except OSError as err:
        print(f"[pre_tool_use] log write failed: {err}", file=sys.stderr)

def _block(tool_name, tool_input, rule, message):
    _log(tool_name, tool_input, "block", rule)
    print(f"BLOCKED: {message} (rule: {rule})", file=sys.stderr)
    print(f"Input: {_summary(tool_input)}", file=sys.stderr)
    sys.exit(2)

def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        return
    if not isinstance(data, dict) or not isinstance(data.get("tool_name"), str):
        return
    tool_name = data["tool_name"]
    tool_input = data.get("tool_input") if isinstance(data.get("tool_input"), dict) else {}
    if _is_env_access(tool_name, tool_input):
        _block(tool_name, tool_input, "secret-file-access",
               "access to .env secret files is not allowed; use .env.sample for templates")
    if tool_name in _COMMAND_TOOLS and isinstance(tool_input.get("command"), str):
        rule = _is_destructive(tool_input["command"])
        if rule:
            _block(tool_name, tool_input, rule, "destructive command detected")
    _log(tool_name, tool_input, "allow")
    sys.exit(0)
```

Also add the redirect simplification in Task 3's loop: `if a == ">" and k + 1 < len(args) and _is_env_file(args[k + 1]): return True`.

- [ ] **Step 4: Verify**

Run: `python tests\hooks\test_pre_tool_use.py` then `python tests\hooks\test_guard_parser.py`
Expected: `60/60 passed` + `guard behaviour holds`; `9/9 passed`.

- [ ] **Step 5: Measure latency (finding 5)**

Run: `(Measure-Command { 1..20 | % { '{"tool_name":"Read","tool_input":{"file_path":"a.ts"}}' | python -I -S scripts\pre_tool_use.py } }).TotalMilliseconds / 20`
Expected: below the 248 ms/call baseline measured before the change (record both numbers in the commit body; no fixed threshold because interpreter startup dominates).

- [ ] **Step 6: Commit**

```bash
git add scripts/pre_tool_use.py tests/hooks/test_pre_tool_use.py
git commit -m "fix: append-only redacted JSONL log and lighter startup for pre-tool-use guard"
```

### Task 5: Fail-open, project-dir-relative wrapper (findings 4, 5)

`Files`

- Modify: `.claude/settings.json:221` (the `command` string of the first PreToolUse hook)
- Test: `tests/hooks/test_wrapper.py` (RED already added; needs `sh`, so run it from Git Bash)

- [ ] **Step 1: Verify RED**

Run (Git Bash, repo root): `python tests/hooks/test_wrapper.py`
Expected: `3/5 passed`, with `[FAIL] exit 2  guard crash fails open` and `[FAIL] exit 2  real guard blocks a secret file` (measured 2026-10-05 against the current wrapper; the second fails because the old guard prints no rule id).

- [ ] **Step 2: Replace the command with**

```sh
G="${CLAUDE_PROJECT_DIR:-.}/scripts/pre_tool_use.py"; if ! test -f "$G"; then echo '[A Team] WARNING: security gate inactive (guard script missing)' >&2; exit 0; fi; PY=; for c in python python3 py; do if command -v "$c" >/dev/null 2>&1; then PY=$c; break; fi; done; if test -z "$PY"; then echo '[A Team] WARNING: no Python interpreter; security gate skipped' >&2; exit 0; fi; "$PY" -I -S "$G"; rc=$?; if test $rc -ne 0 && test $rc -ne 2; then echo "[A Team] WARNING: security gate crashed (exit $rc); allowing call" >&2; exit 0; fi; exit $rc
```

(JSON-escape the double quotes when editing the string value.)

- [ ] **Step 3: Verify GREEN**

Run (Git Bash, repo root): `python tests/hooks/test_wrapper.py`
Expected: `5/5 passed` (measured 2026-10-05 against the wrapper below plus the Task 1-4 guard). Then run `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"`; Expected: no output (valid JSON).

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json
git commit -m "fix: make pre-tool-use wrapper fail open on guard crash and resolve by project dir"
```

### Task 6: Narrow GateGuard for the sonar workflow

`Files`

- Modify: `.claude/settings.local.json` (`env` block, gitignored; no commit)

- [ ] **Step 1: Glob semantics (confirmed)**: per `gateguard-fact-force.js` lines 106-135, comma-separated globs match the normalized project-relative path (`*` within a segment, `**` across segments, `?` one char), so the globs below are valid as written. There is no deterministic harness for this gate (running the script directly emitted no verdict), so Step 3 stays a manual check.

- [ ] **Step 2: Add to `env`**

```json
"GATEGUARD_BASH_ROUTINE_DISABLED": "1",
"GATEGUARD_EXEMPT_GLOBS": ".scannerwork/**,.sonar/**,sonar-project.properties"
```

`GATEGUARD_BASH_ROUTINE_DISABLED` removes the first-Bash/first-PowerShell fact-forcing prompt while keeping GateGuard's destructive-command checks. GateGuard stays active for first edits to non-sonar files. It cannot be limited to "sonar commands only" because it is a per-session switch.

- [ ] **Step 3: Verify (new session required)**: restart Claude Code, then as the first call run `PowerShell: Get-Date`. Expected: runs without a `[Fact-Forcing Gate]` message. Run `sonar` or `npx sonar-scanner` once; Expected: no gate message.

- [ ] **Step 4: Rollback**: delete the two keys and restart.

## Safety, Rollback, and Verification

- Risk: the guard is a security control; a parser bug could let a destructive command through. Mitigation: every previous BLOCK case stays in the matrix, plus nested-shell, subshell and allowlist-escape (`dist/../src`, `*`) cases.
- Known residual: the guard is still pattern-based. Indirect access (`python -c "open('.en'+'v')"`) is not detected; the plan does not claim otherwise. `settings.json` permission `deny` rules remain the second layer.
- Verification: matrix (60 cases), parser test (9), latency measurement, crash-wrapper check, GateGuard check in a fresh session.
- Checkpoint before Task 1: `git switch -c fix/pre-tool-use-guard`; before Tasks 5-6 copy `.claude/settings.json` and `.claude/settings.local.json` to `*.bak` beside them (delete the copies after Step 3 passes).
- Rollback: one commit per task, so `git revert <sha>` per task; `settings.local.json` keys are removed by hand or restored from the `.bak` copy. The old `.agent-sync/logs/pre_tool_use.json` is untouched.

## Final Validation

Manual application of the 100-point reviewer rubric (self-review; no independent reviewer was available, so this is not independent evidence).

| Category | Score | Notes |
| --- | ---: | --- |
| Spec Coverage | 14/15 | All 7 findings plus GateGuard mapped; GateGuard cannot be limited to sonar only (stated). |
| File and Ownership Clarity | 10/10 | Five files, exact paths and responsibilities. |
| Task Granularity | 7/8 | Task 1 (parser) is the largest slice. |
| TDD and Test Quality | 14/15 | Tasks 1-5 are automated and shown RED then GREEN; only the GateGuard check (Task 6) is manual. |
| Implementation Specificity | 10/10 | Concrete code for every code step, executed unmodified (see Prototype verification). |
| Sequencing and Dependencies | 10/10 | Parser before rules; rules before log; wrapper after guard. |
| Safety, Rollback, Verification | 10/10 | Branch and backup checkpoints, per-task revert, residual bypass risk stated. |
| Developer Usability | 10/10 | Exact commands and measured expected outputs throughout. |
| Framework Fit | 7/7 | Light threat modelling only. |
| Minimality and YAGNI | 4/5 | Nested-shell recursion is the only extra, justified by finding 7. |

- Requirement coverage: PASS
- Exact paths: PASS
- Tests before implementation: PASS (Tasks 1-5); manual check (Task 6)
- Exact commands and expected outputs: PASS
- No placeholders or undefined references: PASS
- Safety and rollback covered where needed: PASS
- Score: 96/100
- Critical failures: None

## Execution Handoff

- Plan path: `docs/plans/2026-10-05-pre-tool-use-guard-fixes.md`
- Blocking unknowns: none. Needs a fresh session to confirm the GateGuard variables take effect.
- Supported execution mode: inline with `executing-plans`, one commit per task. The RED test edits are already in `tests/hooks/test_pre_tool_use.py` (uncommitted); `tests/hooks/test_wrapper.py` is also already added (uncommitted); `tests/hooks/test_guard_parser.py` is created in Task 1.
