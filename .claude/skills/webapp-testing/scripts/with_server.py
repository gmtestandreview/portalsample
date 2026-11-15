#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

Usage:
    # Single server
    python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py
    python scripts/with_server.py --server "npm start" --port 3000 -- python test.py

    # Multiple servers
    python scripts/with_server.py \
      --server "cd backend && python server.py" --port 3000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- python test.py
"""

from __future__ import annotations

import argparse
import tempfile
from typing import IO
import os
import re
import shlex
import signal
import shutil
import socket
import subprocess
import sys
import time

# Shell punctuation that must never reach an executed command. `&&` is the only
# operator supported, and only to chain `cd DIR && ...` prefixes.
_SHELL_PUNCTUATION = set("();<>|&")


def _split_segments(command: str) -> list[list[str]]:
    """Tokenise `command` into `&&`-separated segments, rejecting every other operator."""
    lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    if os.name == "nt":
        lexer.escape = ""  # backslashes are path separators on Windows, not escapes
    segments: list[list[str]] = [[]]
    for part in lexer:
        if part == "&&":
            segments.append([])
        elif set(part) <= _SHELL_PUNCTUATION:
            raise ValueError(f"Unsupported shell operator in server command: {part!r}")
        elif "$(" in part or "`" in part:
            raise ValueError("Command substitution is not supported in server commands")
        else:
            segments[-1].append(part)
    if any(not segment for segment in segments):
        raise ValueError("Server command is empty or has an empty '&&' segment")
    return segments


def _apply_cd_prefixes(prefixes: list[list[str]], base: str | None) -> str | None:
    """Resolve successive `cd DIR` prefixes to one working directory."""
    cwd: str | None = None
    for prefix in prefixes:
        if len(prefix) != 2 or prefix[0] != "cd":
            raise ValueError("Only 'cd DIR' may precede '&&' in a server command")
        target = os.path.join(cwd or base or os.getcwd(), prefix[1])
        if not os.path.isdir(target):
            raise ValueError(f"cd target is not a directory: {prefix[1]!r}")
        cwd = target
    return cwd


def parse_server_command(
    command: str, base: str | None = None
) -> tuple[str | None, list[str]]:
    """Turn a `[cd DIR && ]... COMMAND ARGS` string into (cwd, argv) without a shell.

    Anything else a shell would interpret (`;`, `|`, `||`, `&`, redirects, `$(...)`,
    backticks) is rejected instead of executed. Quoted text is passed as data.
    """
    *prefixes, argv = _split_segments(command)
    if argv[0] == "cd":
        raise ValueError("A server command cannot end with 'cd'")
    return _apply_cd_prefixes(prefixes, base), argv


# cmd.exe re-parses the arguments of .cmd/.bat targets even with shell=False, so
# only a conservative character set may reach them.
_BATCH_SUFFIXES = (".cmd", ".bat")
_SAFE_BATCH_ARGUMENT = re.compile(r"[A-Za-z0-9_@+=:,./\\ -]*")


def resolve_executable(name: str) -> str:
    """Resolve `name` through PATH, refusing a bare name found only in the current directory.

    Windows searches the current directory before PATH; a planted `npm.cmd` there must
    not win. A name containing a path separator is an explicit operator choice.
    """
    if os.path.dirname(name):
        return name
    found = shutil.which(name)
    if found is None:
        # Never hand a bare name to CreateProcess, which may search the current directory.
        raise FileNotFoundError(f"Executable not found on PATH: {name!r}")
    here = os.path.normcase(os.path.realpath(os.getcwd()))
    parent = os.path.normcase(os.path.realpath(os.path.dirname(found)))
    on_path = {
        os.path.normcase(os.path.realpath(entry or os.getcwd()))
        for entry in os.environ.get("PATH", "").split(os.pathsep)
    }
    if parent == here and here not in on_path:
        raise ValueError(f"Refusing to run {name!r} from the current directory")
    return found


def prepare_argv(argv: list[str]) -> list[str]:
    """Resolve argv[0] and validate arguments passed to batch-file targets."""
    argv = [resolve_executable(argv[0]), *argv[1:]]
    if argv[0].lower().endswith(_BATCH_SUFFIXES):
        for argument in argv[1:]:
            if not _SAFE_BATCH_ARGUMENT.fullmatch(argument):
                raise ValueError(
                    f"Argument {argument!r} is not allowed for batch-file target {argv[0]!r}"
                )
    return argv


def start_server(
    command: str, base: str | None = None, log: IO[bytes] | None = None
) -> subprocess.Popen[bytes]:
    """Start one server process directly (shell=False) from a validated command.

    Output goes to `log` (stderr merged into stdout) or is discarded. It is never piped
    to this process, because nothing drains a pipe and a chatty server would block once
    the OS pipe buffer fills.
    """
    cwd, argv = parse_server_command(command, base=base)
    argv = prepare_argv(argv)
    output = log if log is not None else subprocess.DEVNULL
    # Own process group/session so stop_server can end the whole tree.
    if os.name == "nt":
        return subprocess.Popen(
            argv,
            cwd=cwd,
            shell=False,
            stdout=output,
            stderr=subprocess.STDOUT,
            creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
        )
    return subprocess.Popen(
        argv,
        cwd=cwd,
        shell=False,
        stdout=output,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )


def _taskkill_path() -> str:
    """Absolute taskkill.exe path from the OS (not from SYSTEMROOT/WINDIR/PATH)."""
    import ctypes

    buffer = ctypes.create_unicode_buffer(260)
    if not ctypes.windll.kernel32.GetSystemWindowsDirectoryW(buffer, 260):
        raise OSError("Cannot determine the Windows system directory")
    return os.path.join(buffer.value, "System32", "taskkill.exe")


def _kill_tree(process: subprocess.Popen[bytes]) -> None:
    if os.name == "nt":
        subprocess.run(
            [_taskkill_path(), "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def stop_server(process: subprocess.Popen[bytes]) -> None:
    """Stop a server and its descendants.

    POSIX: SIGTERM the process group, then SIGKILL whatever remains. Windows: console
    servers cannot be asked to exit, and descendants are only reachable while their
    parent is alive, so the tree is force-killed first.

    A process that had already exited and been reaped on entry is not signalled: its PID
    (and process-group id) may have been reused by an unrelated process.
    """
    if process.poll() is None:
        if os.name != "nt":
            try:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=5)
            except (ProcessLookupError, PermissionError, subprocess.TimeoutExpired):
                pass
        _kill_tree(process)
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def is_server_ready(port, timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('localhost', port), timeout=1):
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    return False


def main():
    parser = argparse.ArgumentParser(description='Run command with one or more servers')
    parser.add_argument('--server', action='append', dest='servers', required=True, help='Server command (can be repeated)')
    parser.add_argument('--port', action='append', dest='ports', type=int, required=True, help='Port for each server (must match --server count)')
    parser.add_argument('--timeout', type=int, default=30, help='Timeout in seconds per server (default: 30)')
    parser.add_argument('command', nargs=argparse.REMAINDER, help='Command to run after server(s) ready')

    args = parser.parse_args()

    # Remove the '--' separator if present
    if args.command and args.command[0] == '--':
        args.command = args.command[1:]

    if not args.command:
        print("Error: No command specified to run")
        sys.exit(1)

    # Parse server configurations
    if len(args.servers) != len(args.ports):
        print("Error: Number of --server and --port arguments must match")
        sys.exit(1)

    servers = []
    for cmd, port in zip(args.servers, args.ports):
        servers.append({'cmd': cmd, 'port': port})

    server_processes = []
    logs = []

    try:
        # Start all servers
        for i, server in enumerate(servers):
            print(f"Starting server {i+1}/{len(servers)}: {server['cmd']}")

            # No shell: `cd DIR &&` prefixes become cwd; other operators are rejected.
            # Output goes to a temp file (never an undrained pipe) kept for diagnostics.
            log = tempfile.TemporaryFile()
            logs.append(log)
            process = start_server(server['cmd'], log=log)
            server_processes.append(process)

            # Wait for this server to be ready
            print(f"Waiting for server on port {server['port']}...")
            if not is_server_ready(server['port'], timeout=args.timeout):
                log.seek(0, os.SEEK_END)
                log.seek(max(0, log.tell() - 2000))
                print(log.read().decode("utf-8", errors="replace"))
                raise RuntimeError(f"Server failed to start on port {server['port']} within {args.timeout}s")

            print(f"Server ready on port {server['port']}")

        print(f"\nAll {len(servers)} server(s) ready")

        # Run the command
        print(f"Running: {' '.join(args.command)}\n")
        result = subprocess.run(prepare_argv(args.command), shell=False)
        sys.exit(result.returncode)

    finally:
        # Clean up all servers
        print(f"\nStopping {len(server_processes)} server(s)...")
        for i, process in enumerate(server_processes):
            stop_server(process)
            print(f"Server {i+1} stopped")
        for log in logs:
            log.close()
        print("All servers stopped")


if __name__ == '__main__':
    main()