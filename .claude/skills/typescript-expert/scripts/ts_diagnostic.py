#!/usr/bin/env python3
"""Production diagnostics for a TypeScript 5.9.x project.

The script never downloads tools. It prefers project-local binaries, then an
explicit workspace tool root, then PATH.
It resolves JSONC/extended TSConfig through `tsc --showConfig` instead of parsing
tsconfig files as strict JSON.

Exit codes:
  0: all requested required checks passed
  1: one or more requested required checks failed
  2: invalid invocation or an internal diagnostic error
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Sequence, cast


PASS = "PASS"
WARN = "WARN"
FAIL = "FAIL"
SKIP = "SKIP"

STRICT_TRUE = (
    "strict",
    "noUncheckedIndexedAccess",
    "noImplicitOverride",
    "noPropertyAccessFromIndexSignature",
    "exactOptionalPropertyTypes",
    "noFallthroughCasesInSwitch",
    "forceConsistentCasingInFileNames",
    "noUncheckedSideEffectImports",
)

ALLOWABLE_STRICT_EXCEPTIONS = tuple(name for name in STRICT_TRUE if name != "strict")
RECOMMENDED_TRUE = ("skipLibCheck", "incremental")


@dataclass(frozen=True)
class Result:
    name: str
    status: str
    detail: str
    command: list[str] | None = None
    duration_s: float | None = None
    output: str | None = None


def trim_output(text: str, limit: int = 8000) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[:limit] + f"\n... <truncated {len(text) - limit} chars>"


def as_json_object(value: object) -> dict[str, object] | None:
    """Return `value` as a JSON object, or None for any other JSON value.

    JSON object keys are always strings, so the narrowed type is exact; this is the one place
    that states it instead of letting `dict[Unknown, Unknown]` spread through the module.
    """
    if isinstance(value, dict):
        return cast("dict[str, object]", value)
    return None


def as_text(value: str | bytes | None) -> str:
    """Normalise captured output; `TimeoutExpired` carries bytes even when `text=True`."""
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def run_command(
    command: Sequence[str],
    *,
    cwd: Path,
    timeout: int,
    limit: int | None = 8000,
) -> tuple[int, str, float]:
    env = os.environ.copy()
    env.setdefault("NO_COLOR", "1")
    argv = list(command)
    if os.name == "nt":
        # CreateProcess cannot resolve `.cmd` shims such as npm/pnpm by bare name.
        argv[0] = shutil.which(argv[0]) or argv[0]
    started = time.monotonic()
    try:
        proc = subprocess.run(
            argv,
            cwd=cwd,
            env=env,
            text=True,
            capture_output=True,
            timeout=timeout,
            shell=False,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        elapsed = time.monotonic() - started
        partial = "\n".join(
            part for part in (as_text(exc.stdout), as_text(exc.stderr)) if part
        )
        return 124, trim_output(partial or f"Timed out after {timeout}s"), elapsed
    elapsed = time.monotonic() - started
    output = "\n".join(part for part in (proc.stdout, proc.stderr) if part)
    return proc.returncode, trim_output(output, limit) if limit else output, elapsed


def local_binary(
    root: Path,
    name: str,
    *,
    tool_root: Path | None = None,
) -> str | None:
    suffixes = (".cmd", ".exe", "") if os.name == "nt" else ("",)
    roots = [root]
    if tool_root is not None and tool_root != root:
        roots.append(tool_root)
    for base in roots:
        bindir = base / "node_modules" / ".bin"
        for suffix in suffixes:
            candidate = bindir / f"{name}{suffix}"
            if candidate.is_file():
                return str(candidate)
    return shutil.which(name)


def read_package_json(root: Path) -> dict[str, object]:
    path = root / "package.json"
    if not path.is_file():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Cannot read {path}: {exc}") from exc
    package = as_json_object(value)
    if package is None:
        raise ValueError(f"{path} must contain a JSON object")
    return package


LOCKFILE_PACKAGE_MANAGERS = (
    ("pnpm-lock.yaml", "pnpm"),
    ("yarn.lock", "yarn"),
    ("bun.lockb", "bun"),
    ("bun.lock", "bun"),
    ("package-lock.json", "npm"),
    ("npm-shrinkwrap.json", "npm"),
)
KNOWN_PACKAGE_MANAGERS = {"npm", "pnpm", "yarn", "bun"}


def declared_package_manager(packages: Sequence[dict[str, object]]) -> str | None:
    for candidate_package in packages:
        declared = candidate_package.get("packageManager")
        if isinstance(declared, str) and declared:
            name = declared.split("@", 1)[0]
            if name in KNOWN_PACKAGE_MANAGERS:
                return name
    return None


def lockfile_package_manager(roots: Sequence[Path]) -> str | None:
    for base in roots:
        for filename, name in LOCKFILE_PACKAGE_MANAGERS:
            if (base / filename).exists():
                return name
    return None


def package_manager(
    root: Path,
    package: dict[str, object],
    *,
    tool_root: Path | None = None,
    tool_package: dict[str, object] | None = None,
) -> str | None:
    packages = [package]
    if tool_package is not None and tool_package is not package:
        packages.append(tool_package)
    roots = [root]
    if tool_root is not None and tool_root != root:
        roots.append(tool_root)
    return (
        declared_package_manager(packages)
        or lockfile_package_manager(roots)
        or ("npm" if shutil.which("npm") else None)
    )


def script_command(pm: str, script_name: str) -> list[str]:
    if pm == "npm":
        return ["npm", "run", "-s", script_name]
    if pm == "pnpm":
        return ["pnpm", "run", script_name]
    if pm == "yarn":
        return ["yarn", script_name]
    if pm == "bun":
        return ["bun", "run", script_name]
    raise ValueError(f"Unsupported package manager: {pm}")


def package_scripts(package: dict[str, object]) -> dict[str, str]:
    scripts = as_json_object(package.get("scripts"))
    if scripts is None:
        return {}
    return {name: cmd for name, cmd in scripts.items() if isinstance(cmd, str)}


def parse_ts_version(output: str) -> str | None:
    match = re.search(r"\bVersion\s+(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)", output)
    return match.group(1) if match else None


def check_version(
    tsc: str,
    *,
    root: Path,
    timeout: int,
    expected: str,
) -> tuple[Result, str | None]:
    code, output, elapsed = run_command([tsc, "--version"], cwd=root, timeout=timeout)
    if code != 0:
        return Result(
            "typescript-version",
            FAIL,
            "Unable to execute the TypeScript compiler.",
            [tsc, "--version"],
            elapsed,
            output,
        ), None
    found = parse_ts_version(output)
    if found is None:
        return Result(
            "typescript-version",
            FAIL,
            "Could not parse the TypeScript compiler version.",
            [tsc, "--version"],
            elapsed,
            output,
        ), None
    if found != expected:
        return Result(
            "typescript-version",
            FAIL,
            f"Expected TypeScript {expected}; found {found}.",
            [tsc, "--version"],
            elapsed,
            output,
        ), found
    return Result(
        "typescript-version",
        PASS,
        f"TypeScript {found}.",
        [tsc, "--version"],
        elapsed,
        output,
    ), found


def show_config(
    tsc: str,
    *,
    root: Path,
    tsconfig: Path,
    timeout: int,
) -> tuple[Result, dict[str, object] | None]:
    command = [tsc, "-p", str(tsconfig), "--showConfig"]
    # Parse the full output: a truncated resolved config is never valid JSON.
    code, output, elapsed = run_command(
        command, cwd=root, timeout=timeout, limit=None
    )
    if code != 0:
        return Result(
            "tsconfig-resolution",
            FAIL,
            "TypeScript could not resolve the configured project.",
            command,
            elapsed,
            trim_output(output),
        ), None
    try:
        parsed = json.loads(output)
    except json.JSONDecodeError as exc:
        return Result(
            "tsconfig-resolution",
            FAIL,
            f"`tsc --showConfig` returned non-JSON output: {exc}.",
            command,
            elapsed,
            trim_output(output),
        ), None
    config = as_json_object(parsed)
    if config is None:
        return Result(
            "tsconfig-resolution",
            FAIL,
            "Resolved TSConfig was not a JSON object.",
            command,
            elapsed,
            output,
        ), None
    return Result(
        "tsconfig-resolution",
        PASS,
        f"Resolved {tsconfig.name} through TypeScript (JSONC/extends aware).",
        command,
        elapsed,
        None,
    ), config


def check_strict(
    config: dict[str, object],
    *,
    allowed_exceptions: set[str] | None = None,
) -> list[Result]:
    compiler = as_json_object(config.get("compilerOptions"))
    if compiler is None:
        return [Result("strict-profile", FAIL, "Resolved TSConfig has no compilerOptions.")]

    allowed = allowed_exceptions or set()
    results: list[Result] = []
    missing = [name for name in STRICT_TRUE if compiler.get(name) is not True]
    unapproved = [name for name in missing if name not in allowed]
    approved = [name for name in missing if name in allowed]
    if unapproved:
        results.append(
            Result(
                "strict-profile",
                FAIL,
                "Required strict baseline flags are not all true: "
                + ", ".join(unapproved)
                + (
                    ". Documented exceptions: " + ", ".join(approved)
                    if approved
                    else ""
                ),
            )
        )
    elif approved:
        results.append(
            Result(
                "strict-profile",
                WARN,
                "Documented project exception(s) differ from the strict baseline: "
                + ", ".join(approved)
                + ". This is not a full-baseline PASS.",
            )
        )
    else:
        results.append(
            Result(
                "strict-profile",
                PASS,
                "All required strict baseline flags are enabled.",
            )
        )

    recommended = [name for name in RECOMMENDED_TRUE if compiler.get(name) is not True]
    if recommended:
        results.append(
            Result(
                "strict-performance",
                WARN,
                "Recommended project defaults are not enabled: "
                + ", ".join(recommended),
            )
        )
    else:
        results.append(
            Result(
                "strict-performance",
                PASS,
                "Recommended skipLibCheck/incremental defaults are enabled.",
            )
        )
    return results


def compiler_gate(
    name: str,
    command: list[str],
    *,
    root: Path,
    timeout: int,
    success_detail: str,
) -> Result:
    code, output, elapsed = run_command(command, cwd=root, timeout=timeout)
    status = PASS if code == 0 else FAIL
    detail = success_detail if code == 0 else f"{name} failed with exit code {code}."
    return Result(name, status, detail, command, elapsed, output or None)


TSC_ERROR_LINE = re.compile(r"^(?P<file>.+?)\(\d+,\d+\): error TS\d+:")


def scoped_typecheck_result(
    command: list[str],
    code: int,
    output: str,
    elapsed: float,
    scope: Sequence[str],
) -> Result:
    """Split tsc errors into the requested file scope and everything else.

    A file matches when any `scope` entry is a substring of its slash-normalised path.
    Errors outside the scope are counted but never listed as work: they are reported, not fixed.
    """
    in_scope: list[str] = []
    outside = 0
    for line in output.splitlines():
        match = TSC_ERROR_LINE.match(line)
        if match is None:
            continue
        path = match.group("file").replace("\\", "/")
        if any(entry.replace("\\", "/") in path for entry in scope):
            in_scope.append(line)
        else:
            outside += 1
    if code != 0 and not in_scope and outside == 0:
        # Non-zero exit without parseable diagnostics (config error, crash): never read as clean.
        return Result(
            "tsc-typecheck-scoped",
            FAIL,
            f"tsc exited with code {code} and no parseable diagnostics.",
            command,
            elapsed,
            trim_output(output) or None,
        )
    status = FAIL if in_scope else PASS
    detail = (
        f"{len(in_scope)} error(s) in scope; {outside} outside scope "
        f"(reported, not part of this gate)."
    )
    return Result(
        "tsc-typecheck-scoped",
        status,
        detail,
        command,
        elapsed,
        trim_output("\n".join(in_scope)) or None,
    )


def typecheck_gate(
    tsc: str,
    *,
    root: Path,
    tsconfig: Path,
    timeout: int,
    scope: Sequence[str] = (),
) -> Result:
    command = [tsc, "-p", str(tsconfig), "--noEmit", "--pretty", "false"]
    if scope:
        code, output, elapsed = run_command(
            command, cwd=root, timeout=timeout, limit=None
        )
        return scoped_typecheck_result(command, code, output, elapsed, scope)
    return compiler_gate(
        "tsc-typecheck",
        command,
        root=root,
        timeout=timeout,
        success_detail="TypeScript type check passed.",
    )


def emit_gate(
    tsc: str,
    *,
    root: Path,
    tsconfig: Path,
    config: dict[str, object],
    timeout: int,
) -> Result:
    references = config.get("references")
    if isinstance(references, list) and references:
        return Result(
            "tsc-emit",
            FAIL,
            "Project references detected. A temporary single-project emit would "
            "not validate the reference graph safely; run the repository build "
            "gate or an existing `tsc --build` workflow instead.",
        )

    with tempfile.TemporaryDirectory(prefix="ts-diagnostic-emit-") as tmp:
        tmp_path = Path(tmp)
        override = tmp_path / "tsconfig.emit.json"
        compiler_options = as_json_object(config.get("compilerOptions")) or {}
        emit_options: dict[str, object] = {
            "noEmit": False,
            "emitDeclarationOnly": False,
            "outDir": str(tmp_path / "out"),
            "tsBuildInfoFile": str(tmp_path / "cache.tsbuildinfo"),
        }
        if (
            compiler_options.get("declaration") is True
            or compiler_options.get("composite") is True
        ):
            emit_options["declarationDir"] = str(tmp_path / "types")

        override.write_text(
            json.dumps(
                {
                    "extends": str(tsconfig),
                    "compilerOptions": emit_options,
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        command = [tsc, "-p", str(override), "--pretty", "false"]
        return compiler_gate(
            "tsc-emit",
            command,
            root=root,
            timeout=timeout,
            success_detail="TypeScript emit completed successfully into a temporary directory.",
        )


def run_script_gate(
    gate_name: str,
    script_name: str,
    *,
    root: Path,
    package: dict[str, object],
    pm: str | None,
    timeout: int,
) -> Result:
    scripts = package_scripts(package)
    if script_name not in scripts:
        return Result(
            gate_name,
            FAIL,
            f"Required package script `{script_name}` is not configured.",
        )
    if pm is None or shutil.which(pm) is None:
        return Result(
            gate_name,
            FAIL,
            f"Package manager for `{script_name}` is unavailable.",
        )
    command = script_command(pm, script_name)
    return compiler_gate(
        gate_name,
        command,
        root=root,
        timeout=timeout,
        success_detail=f"`{script_name}` script passed.",
    )


def lint_gate(
    *,
    root: Path,
    package: dict[str, object],
    pm: str | None,
    timeout: int,
    tool_root: Path | None = None,
) -> Result:
    scripts = package_scripts(package)
    if "lint" in scripts:
        return run_script_gate(
            "eslint",
            "lint",
            root=root,
            package=package,
            pm=pm,
            timeout=timeout,
        )

    eslint = local_binary(root, "eslint", tool_root=tool_root)
    if eslint is None:
        return Result(
            "eslint",
            FAIL,
            "No `lint` package script or ESLint executable is available.",
        )

    command = [eslint, ".", "--max-warnings=0"]
    return compiler_gate(
        "eslint",
        command,
        root=root,
        timeout=timeout,
        success_detail="ESLint passed with zero warnings.",
    )


def sonar_gate(
    *,
    root: Path,
    package: dict[str, object],
    pm: str | None,
    timeout: int,
    tool_root: Path | None = None,
) -> Result:
    scripts = package_scripts(package)
    sonar_scripts = [
        (name, command)
        for name, command in scripts.items()
        if "sonar" in name.lower() or "sonar" in command.lower()
    ]

    for name, body in sonar_scripts:
        if "sonar.qualitygate.wait=true" in body.replace(" ", ""):
            if pm is None or shutil.which(pm) is None:
                return Result(
                    "sonarqube",
                    FAIL,
                    f"Sonar script `{name}` exists but its package manager is unavailable.",
                )
            command = script_command(pm, name)
            return compiler_gate(
                "sonarqube",
                command,
                root=root,
                timeout=max(timeout, 300),
                success_detail=(
                    f"Sonar script `{name}` completed with quality-gate waiting enabled; server-side quality-profile assignment was not verified by this check."
                ),
            )

    scanner = local_binary(root, "sonar-scanner", tool_root=tool_root)
    if scanner is not None:
        command = [
            scanner,
            "-Dsonar.qualitygate.wait=true",
            f"-Dsonar.qualitygate.timeout={max(timeout, 300)}",
        ]
        return compiler_gate(
            "sonarqube",
            command,
            root=root,
            timeout=max(timeout, 330),
            success_detail="Sonar analysis and waited quality gate passed; server-side quality-profile assignment was not verified by this check.",
        )

    if sonar_scripts:
        names = ", ".join(name for name, _ in sonar_scripts)
        return Result(
            "sonarqube",
            FAIL,
            "Sonar script(s) exist but do not prove a waited quality gate "
            f"(`sonar.qualitygate.wait=true`): {names}.",
        )

    return Result(
        "sonarqube",
        FAIL,
        "No Sonar scanner or Sonar package script is configured.",
    )


def print_results(results: list[Result]) -> None:
    print("\nTypeScript diagnostic gates")
    print("=" * 78)
    for result in results:
        print(f"{result.status:4}  {result.name:22}  {result.detail}")
        if result.command:
            print("      command:", " ".join(result.command))
        if result.output and result.status != PASS:
            for line in result.output.splitlines()[:20]:
                print(f"      {line}")
    print("=" * 78)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python scripts/ts_diagnostic.py --strict --typecheck --emit --lint\n"
            "  python scripts/ts_diagnostic.py --root packages/api --tool-root . --typecheck\n"
            "  python scripts/ts_diagnostic.py --strict --allow-strict-exception noUncheckedIndexedAccess\n"
            "  python scripts/ts_diagnostic.py --all --format json\n"
            "  python scripts/ts_diagnostic.py --sonar --timeout 300\n"
        ),
    )
    parser.add_argument("--root", default=".", help="Project/package root (default: .)")
    parser.add_argument(
        "--tool-root",
        help="Optional workspace root for hoisted node_modules/package-manager metadata.",
    )
    parser.add_argument("--tsconfig", default="tsconfig.json")
    parser.add_argument("--expect-ts", default="5.9.3")
    parser.add_argument("--timeout", type=int, default=180)
    parser.add_argument("--strict", action="store_true")
    parser.add_argument(
        "--allow-strict-exception",
        action="append",
        default=[],
        choices=ALLOWABLE_STRICT_EXCEPTIONS,
        metavar="FLAG",
        help=(
            "Documented project exception to the strict baseline; repeatable. "
            "Produces WARN, never a full-baseline PASS."
        ),
    )
    parser.add_argument("--typecheck", action="store_true")
    parser.add_argument(
        "--files",
        action="append",
        default=[],
        metavar="PATH",
        help=(
            "With --typecheck: gate only on errors whose file path contains PATH "
            "(repeatable); other errors are counted and reported, not gated."
        ),
    )
    parser.add_argument("--emit", action="store_true")
    parser.add_argument("--lint", action="store_true")
    parser.add_argument("--build", action="store_true")
    parser.add_argument("--test", action="store_true")
    parser.add_argument("--sonar", action="store_true")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run strict, typecheck, emit, lint, build, test, and Sonar gates.",
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format for stdout (default: text).",
    )
    parser.add_argument(
        "--json-report",
        help="Also write the full result list to this JSON path.",
    )
    return parser


def expand_all(args: argparse.Namespace) -> None:
    if args.all:
        args.strict = args.typecheck = args.emit = args.lint = True
        args.build = args.test = args.sonar = True


def argument_error(
    args: argparse.Namespace, root: Path, tool_root: Path, tsconfig: Path
) -> str | None:
    """First invalid-argument message, in the order the CLI has always reported them."""
    if not root.is_dir():
        return f"project root does not exist: {root}"
    if not tool_root.is_dir():
        return f"tool root does not exist: {tool_root}"
    if not tsconfig.is_file():
        return f"TSConfig does not exist: {tsconfig}"
    if args.timeout < 1:
        return "--timeout must be positive"
    if args.files and not args.typecheck:
        return "--files requires --typecheck or --all"
    if args.allow_strict_exception and not args.strict:
        return "--allow-strict-exception requires --strict or --all"
    return None


def compiler_gate_results(
    args: argparse.Namespace,
    *,
    root: Path,
    tool_root: Path,
    tsconfig: Path,
    results: list[Result],
) -> None:
    tsc = local_binary(root, "tsc", tool_root=tool_root)
    if tsc is None:
        results.append(
            Result(
                "typescript-version",
                FAIL,
                "No project-local or PATH `tsc` executable is available. "
                "The diagnostic will not download one.",
            )
        )
        return
    version_result, _ = check_version(
        tsc, root=root, timeout=args.timeout, expected=args.expect_ts
    )
    results.append(version_result)

    config_result, config = show_config(
        tsc, root=root, tsconfig=tsconfig, timeout=args.timeout
    )
    results.append(config_result)
    if config is None:
        return

    if args.strict:
        results.extend(
            check_strict(
                config, allowed_exceptions=set(args.allow_strict_exception)
            )
        )
    if args.typecheck:
        results.append(
            typecheck_gate(
                tsc,
                root=root,
                tsconfig=tsconfig,
                timeout=args.timeout,
                scope=args.files,
            )
        )
    if args.emit:
        results.append(
            emit_gate(
                tsc,
                root=root,
                tsconfig=tsconfig,
                config=config,
                timeout=args.timeout,
            )
        )


def project_gate_results(
    args: argparse.Namespace,
    *,
    root: Path,
    tool_root: Path,
    package: dict[str, object],
    pm: str | None,
    results: list[Result],
) -> None:
    if args.lint:
        results.append(
            lint_gate(
                root=root,
                package=package,
                pm=pm,
                timeout=args.timeout,
                tool_root=tool_root,
            )
        )
    for enabled, name in ((args.build, "build"), (args.test, "test")):
        if enabled:
            results.append(
                run_script_gate(
                    name,
                    name,
                    root=root,
                    package=package,
                    pm=pm,
                    timeout=args.timeout,
                )
            )
    if args.sonar:
        results.append(
            sonar_gate(
                root=root,
                package=package,
                pm=pm,
                timeout=args.timeout,
                tool_root=tool_root,
            )
        )


def run_gates(
    args: argparse.Namespace,
    *,
    root: Path,
    tool_root: Path,
    tsconfig: Path,
    results: list[Result],
) -> None:
    """Append gate results in a fixed order; earlier results survive a later failure."""
    package = read_package_json(root)
    tool_package = package if tool_root == root else read_package_json(tool_root)
    pm = package_manager(
        root, package, tool_root=tool_root, tool_package=tool_package
    )
    compiler_gate_results(
        args, root=root, tool_root=tool_root, tsconfig=tsconfig, results=results
    )
    project_gate_results(
        args,
        root=root,
        tool_root=tool_root,
        package=package,
        pm=pm,
        results=results,
    )


def write_json_report(results: Sequence[Result], report_arg: str, root: Path) -> bool:
    report = Path(report_arg)
    if not report.is_absolute():
        report = root / report
    try:
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(
            json.dumps([asdict(result) for result in results], indent=2),
            encoding="utf-8",
        )
    except OSError as exc:
        print(f"error: cannot write JSON report {report}: {exc}", file=sys.stderr)
        return False
    return True


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = Path(args.root).resolve()
    tool_root = Path(args.tool_root).resolve() if args.tool_root else root
    tsconfig = Path(args.tsconfig)
    if not tsconfig.is_absolute():
        tsconfig = root / tsconfig

    expand_all(args)
    message = argument_error(args, root, tool_root, tsconfig)
    if message is not None:
        print(f"error: {message}", file=sys.stderr)
        return 2

    results: list[Result] = []
    internal_error = False
    try:
        run_gates(
            args, root=root, tool_root=tool_root, tsconfig=tsconfig, results=results
        )
    except (OSError, ValueError) as exc:
        internal_error = True
        results.append(Result("diagnostic-internal", FAIL, str(exc)))

    if args.format == "json":
        print(json.dumps([asdict(result) for result in results], indent=2))
    else:
        print_results(results)

    if args.json_report and not write_json_report(results, args.json_report, root):
        return 2
    if internal_error:
        return 2
    return 1 if any(result.status == FAIL for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
