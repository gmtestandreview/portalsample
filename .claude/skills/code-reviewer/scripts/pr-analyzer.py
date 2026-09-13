#!/usr/bin/env python3
"""Analyze a Git diff and suggest a pull-request review approach.

Designed for Python 3.14+ and intentionally dependency-free at runtime.

Examples:
    git diff main...HEAD | python pr-analyzer.py
    python pr-analyzer.py --diff-file change.diff --stats
    git diff main...HEAD | python pr-analyzer.py --json
    python pr-analyzer.py -f change.diff --json -o analysis.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import asdict, dataclass
from pathlib import Path

RISK_NO_TESTS = "NO_TEST_CHANGES"
RISK_TEST_DELETIONS = "TEST_DELETIONS"
DEV_NULL = "/dev/null"


@dataclass(slots=True)
class FileStats:
    """Statistics for a single changed file."""

    filename: str
    additions: int = 0
    deletions: int = 0
    is_test: bool = False
    is_config: bool = False
    language: str = "unknown"

    @property
    def total_changes(self) -> int:
        """Return line churn for the file."""
        return self.additions + self.deletions


@dataclass(slots=True)
class PRAnalysis:
    """Complete pull-request analysis results."""

    total_files: int
    total_additions: int
    total_deletions: int
    files: list[FileStats]
    complexity_score: float
    size_category: str
    estimated_review_time: int
    risk_factors: list[str]
    suggestions: list[str]

    @property
    def total_changes(self) -> int:
        """Return aggregate line churn."""
        return self.total_additions + self.total_deletions


@dataclass(slots=True)
class _DiffParseState:
    current_file: FileStats | None = None
    old_path: str | None = None
    in_hunk: bool = False


_LANGUAGE_BY_EXTENSION = {
    ".py": "Python",
    ".pyi": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript/React",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript/React",
    ".mts": "TypeScript",
    ".cts": "TypeScript",
    ".rs": "Rust",
    ".go": "Go",
    ".c": "C",
    ".h": "C/C++",
    ".cpp": "C++",
    ".hpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".hh": "C++",
    ".hxx": "C++",
    ".java": "Java",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".swift": "Swift",
    ".rb": "Ruby",
    ".php": "PHP",
    ".cs": "C#",
    ".fs": "F#",
    ".fsx": "F#",
    ".razor": "Razor",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".sql": "SQL",
    ".md": "Markdown",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".less": "Less",
    ".html": "HTML",
    ".zig": "Zig",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".erl": "Erlang",
    ".scala": "Scala",
    ".lua": "Lua",
    ".ps1": "PowerShell",
    ".psm1": "PowerShell",
    ".sh": "Shell",
    ".bash": "Shell",
    ".zsh": "Shell",
    ".tf": "Terraform",
    ".tfvars": "Terraform",
    ".proto": "Protocol Buffers",
    ".xml": "XML",
}

_GIT_ESCAPE_BYTES = {
    "a": 0x07,
    "b": 0x08,
    "t": 0x09,
    "n": 0x0A,
    "v": 0x0B,
    "f": 0x0C,
    "r": 0x0D,
    '"': 0x22,
    "\\": 0x5C,
}

_LANGUAGE_REVIEW_SUGGESTIONS = (
    (
        frozenset({"TypeScript", "TypeScript/React"}),
        "Check type safety and avoid unnecessary 'any' usage",
    ),
    (frozenset({"Python"}), "Check exception handling, typing, and boundary-condition coverage"),
    (frozenset({"C#"}), "Check nullable handling, async flow, and API contract changes"),
    (frozenset({"Rust"}), "Check unwrap()/expect() usage and error handling"),
    (
        frozenset({"C", "C++", "C/C++"}),
        "Check memory safety, bounds handling, and undefined-behavior risks",
    ),
    (frozenset({"SQL"}), "Review SQL injection exposure, query plans, and transaction safety"),
)

_KNOWN_CONFIG_NAMES = {
    # Node / frontend
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "yarn.lock",
    ".npmrc",
    ".yarnrc",
    ".yarnrc.yml",
    ".nvmrc",
    "tsconfig.json",
    "jsconfig.json",
    "babel.config.json",
    "babel.config.js",
    "babel.config.cjs",
    "webpack.config.js",
    "webpack.config.ts",
    "rollup.config.js",
    "rollup.config.ts",
    "vite.config.js",
    "vite.config.ts",
    "vite.config.mjs",
    "vite.config.mts",
    "eslint.config.js",
    "eslint.config.mjs",
    "eslint.config.cjs",
    ".eslintrc",
    ".eslintrc.json",
    ".eslintrc.js",
    ".eslintrc.yml",
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.yml",
    ".prettierrc.js",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.js",
    "vitest.config.ts",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.cjs",
    # Python
    "pyproject.toml",
    "poetry.toml",
    "poetry.lock",
    "uv.lock",
    "Pipfile",
    "Pipfile.lock",
    "requirements.txt",
    "setup.cfg",
    "setup.py",
    "tox.ini",
    "pytest.ini",
    "mypy.ini",
    "ruff.toml",
    ".ruff.toml",
    ".python-version",
    # .NET / MSBuild
    "Directory.Build.props",
    "Directory.Build.targets",
    "Directory.Packages.props",
    "global.json",
    "nuget.config",
    # Other build/package ecosystems
    "Cargo.toml",
    "Cargo.lock",
    "go.mod",
    "go.sum",
    "Gemfile",
    "Gemfile.lock",
    "composer.json",
    "composer.lock",
    "Podfile",
    "Package.swift",
    "gradle.properties",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    # Build / tooling / repository
    "docker-compose.yml",
    "docker-compose.yaml",
    "Dockerfile",
    "Makefile",
    "CMakeLists.txt",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    "renovate.json",
    "renovate.json5",
}

_DEPENDENCY_FILENAMES = {
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "pyproject.toml",
    "poetry.lock",
    "uv.lock",
    "Pipfile",
    "Pipfile.lock",
    "requirements.txt",
    "Cargo.toml",
    "Cargo.lock",
    "go.mod",
    "go.sum",
    "Gemfile",
    "Gemfile.lock",
    "composer.json",
    "composer.lock",
    "Directory.Packages.props",
}


def detect_language(filename: str) -> str:
    """Detect a programming or markup language from a filename."""
    return _LANGUAGE_BY_EXTENSION.get(Path(filename).suffix.lower(), "unknown")


def is_test_file(filename: str) -> bool:
    """Return whether a path follows a common automated-test naming convention."""
    normalized = filename.replace("\\", "/")
    test_patterns = (
        r"(?:^|/)test_[^/]+\.py$",
        r"[^/]+_test\.[^/]+$",
        r"[^/]+\.test\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$",
        r"[^/]+\.spec\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$",
        r"(?:^|/)tests?/",
        r"(?:^|/)__tests__/",
        r"(?:^|/)spec/",
    )
    return any(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in test_patterns)


def is_config_file(filename: str) -> bool:
    """Return whether a path is a known configuration, build, or project file."""
    normalized = filename.replace("\\", "/")
    basename = Path(normalized).name
    lower_basename = basename.lower()

    if lower_basename.startswith(".env"):
        return True

    if basename in _KNOWN_CONFIG_NAMES:
        return True

    if re.fullmatch(r"requirements(?:[-_.][^/]+)?\.txt", basename, flags=re.IGNORECASE):
        return True

    if re.fullmatch(r"appsettings(?:\.[^/]+)?\.json", basename, flags=re.IGNORECASE):
        return True

    if Path(basename).suffix.lower() in {".csproj", ".fsproj", ".vbproj", ".sln", ".props", ".targets"}:
        return True

    config_path_patterns = (
        r"(?:^|/)\.github/workflows/[^/]+\.ya?ml$",
        r"(?:^|/)\.github/dependabot\.ya?ml$",
        r"(?:^|/)\.vscode/",
        r"(?:^|/)\.idea/",
        r"(?:^|/)config/",
    )
    if any(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in config_path_patterns):
        return True

    if re.search(r"(?:^|[._-])config\.", lower_basename):
        return True

    return False


def _append_octal_escape(encoded: str, index: int, output: bytearray) -> int:
    end = index
    while end < len(encoded) and end < index + 3 and encoded[end] in "01234567":
        end += 1
    output.append(int(encoded[index:end], 8))
    return end


def _append_git_escape(encoded: str, index: int, output: bytearray) -> int:
    if index >= len(encoded):
        output.append(ord("\\"))
        return index

    escaped = encoded[index]
    if escaped in "01234567":
        return _append_octal_escape(encoded, index, output)

    if escaped in _GIT_ESCAPE_BYTES:
        output.append(_GIT_ESCAPE_BYTES[escaped])
    else:
        output.extend(escaped.encode("utf-8"))
    return index + 1


def _decode_git_path(path: str) -> str:
    """Decode a Git path, including C-style quoted UTF-8 byte escapes."""
    value = path.strip()
    if len(value) < 2 or not (value.startswith('"') and value.endswith('"')):
        return value

    encoded = value[1:-1]
    output = bytearray()
    index = 0
    while index < len(encoded):
        char = encoded[index]
        if char == "\\":
            index = _append_git_escape(encoded, index + 1, output)
        else:
            output.extend(char.encode("utf-8"))
            index += 1

    return output.decode("utf-8", errors="surrogateescape")


def _strip_git_side_prefix(path: str) -> str:
    decoded = _decode_git_path(path)
    if decoded == DEV_NULL:
        return decoded
    if decoded.startswith(("a/", "b/")):
        return decoded[2:]
    return decoded


def _consume_quoted_token(value: str, start: int = 0) -> tuple[str, int] | None:
    """Return one Git-style quoted token and the index after it."""
    if start >= len(value) or value[start] != '"':
        return None

    index = start + 1
    while index < len(value):
        if value[index] == "\\":
            index += 2
            continue
        if value[index] == '"':
            return value[start : index + 1], index + 1
        index += 1
    return None


def _destination_from_diff_header(line: str) -> str | None:
    """Best-effort extraction of the b-side path from a ``diff --git`` header."""
    body = line.removeprefix("diff --git ")

    if body.startswith('"'):
        first = _consume_quoted_token(body)
        if first is None:
            return None
        _, index = first
        while index < len(body) and body[index].isspace():
            index += 1
        if index >= len(body):
            return None
        if body[index] == '"':
            second = _consume_quoted_token(body, index)
            if second is None:
                return None
            token, _ = second
            return _strip_git_side_prefix(token)
        return _strip_git_side_prefix(body[index:])

    same_path = re.fullmatch(r"a/(.+) b/\1", body)
    if same_path:
        return same_path.group(1)

    separator = body.rfind(" b/")
    if separator != -1:
        return _strip_git_side_prefix(body[separator + 1 :])
    return None


def _patch_header_path(line: str) -> str | None:
    """Extract a path from a ``---`` or ``+++`` patch header."""
    if not line.startswith(("--- ", "+++ ")):
        return None
    return _strip_git_side_prefix(line[4:])


def _apply_filename(stats: FileStats, filename: str) -> None:
    """Update filename-derived classifications after a rename/path header."""
    stats.filename = filename
    stats.language = detect_language(filename)
    stats.is_test = is_test_file(filename)
    stats.is_config = is_config_file(filename)


def _new_file_stats(filename: str | None) -> FileStats:
    stats = FileStats(filename=filename or "")
    if filename:
        _apply_filename(stats, filename)
    return stats


def _finish_current_file(files: list[FileStats], state: _DiffParseState) -> None:
    if state.current_file is not None and state.current_file.filename:
        files.append(state.current_file)
    state.current_file = None


def _start_diff_file(files: list[FileStats], state: _DiffParseState, line: str) -> None:
    _finish_current_file(files, state)
    state.current_file = _new_file_stats(_destination_from_diff_header(line))
    state.old_path = None
    state.in_hunk = False


def _count_hunk_line(stats: FileStats, line: str) -> None:
    if line.startswith("+"):
        stats.additions += 1
    elif line.startswith("-"):
        stats.deletions += 1


def _preferred_patch_path(new_path: str | None, old_path: str | None) -> str | None:
    if new_path and new_path != DEV_NULL:
        return new_path
    if old_path and old_path != DEV_NULL:
        return old_path
    return None


def _apply_new_path_header(state: _DiffParseState, line: str) -> None:
    if state.current_file is None:
        return

    filename = _preferred_patch_path(_patch_header_path(line), state.old_path)
    if filename:
        _apply_filename(state.current_file, filename)
    state.in_hunk = False


def _apply_rename_or_copy(state: _DiffParseState, line: str) -> None:
    if state.current_file is None:
        return

    _, _, raw_path = line.partition(" to ")
    _apply_filename(state.current_file, _decode_git_path(raw_path))
    state.in_hunk = False


def parse_diff(diff_content: str) -> list[FileStats]:
    """Parse a standard Git unified diff and return per-file line statistics.

    Counting is hunk-aware so source lines beginning with ``+++`` or ``---`` are
    not mistaken for patch headers. Git C-style quoted UTF-8 paths are decoded.
    """
    files: list[FileStats] = []
    state = _DiffParseState()

    for line in diff_content.splitlines():
        if line.startswith("diff --git "):
            _start_diff_file(files, state, line)
            continue

        if state.current_file is None:
            continue

        # Once a hunk starts, +/- prefixes are source content even when the
        # resulting line text looks exactly like a ---/+++ patch header.
        if state.in_hunk:
            _count_hunk_line(state.current_file, line)
            continue

        if line.startswith("--- "):
            state.old_path = _patch_header_path(line)
            continue

        if line.startswith("+++ "):
            _apply_new_path_header(state, line)
            continue

        if line.startswith("rename to ") or line.startswith("copy to "):
            _apply_rename_or_copy(state, line)
            continue

        if line.startswith("@@"):
            state.in_hunk = True

    _finish_current_file(files, state)
    return files


def calculate_complexity(files: list[FileStats]) -> float:
    """Calculate a review-burden score on a 0.0-1.0 scale."""
    if not files:
        return 0.0

    total_changes = sum(file.total_changes for file in files)
    size_factor = min(total_changes / 1000, 1.0)
    file_factor = min(len(files) / 20, 1.0)

    if total_changes == 0:
        non_test_ratio = 0.0
    else:
        test_lines = sum(file.total_changes for file in files if file.is_test)
        non_test_ratio = 1 - (test_lines / total_changes)

    languages = {file.language for file in files if file.language != "unknown"}
    language_factor = min(len(languages) / 5, 1.0)

    complexity = (
        size_factor * 0.4
        + file_factor * 0.2
        + non_test_ratio * 0.2
        + language_factor * 0.2
    )
    return round(complexity, 2)


def categorize_size(total_changes: int) -> str:
    """Categorize a PR by changed-line count."""
    if total_changes < 50:
        return "XS (Extra Small)"
    if total_changes < 200:
        return "S (Small)"
    if total_changes < 400:
        return "M (Medium)"
    if total_changes < 800:
        return "L (Large)"
    return "XL (Extra Large) - Consider splitting"


def estimate_review_time(files: list[FileStats], complexity: float) -> int:
    """Estimate review time in minutes using changed lines and review burden."""
    total_changes = sum(file.total_changes for file in files)
    base_time = total_changes / 20
    adjusted_time = base_time * (1 + complexity)
    return max(5, min(120, int(adjusted_time)))


def _is_security_sensitive_path(filename: str) -> bool:
    normalized = filename.replace("\\", "/").lower()
    basename = Path(normalized).name
    if basename.startswith(".env"):
        return True

    sensitive_token = re.compile(
        r"(?:^|[./_-])(?:auth|authentication|authorization|security|password|token|secret)(?:$|[./_-])"
    )
    return sensitive_token.search(normalized) is not None


def _is_dependency_file(filename: str) -> bool:
    basename = Path(filename).name
    if basename in _DEPENDENCY_FILENAMES:
        return True
    if re.fullmatch(r"requirements(?:[-_.][^/]+)?\.txt", basename, flags=re.IGNORECASE):
        return True
    return Path(basename).suffix.lower() in {".csproj", ".fsproj", ".vbproj"}


def identify_risk_factors(files: list[FileStats]) -> list[str]:
    """Identify review risks using file type and change-shape heuristics."""
    risks: list[str] = []
    total_changes = sum(file.total_changes for file in files)
    test_additions = sum(file.additions for file in files if file.is_test)
    test_deletions = sum(file.deletions for file in files if file.is_test)
    production_additions = sum(file.additions for file in files if not file.is_test)

    if total_changes > 400:
        risks.append("Large PR (>400 changed lines) - harder to review thoroughly")

    if production_additions > 50 and test_additions == 0:
        risks.append(f"{RISK_NO_TESTS}: Production additions without test additions - verify coverage")

    if test_deletions > 0:
        risks.append(
            f"{RISK_TEST_DELETIONS}: {test_deletions} test line(s) removed - verify coverage was not reduced"
        )

    if production_additions > 100 and test_additions / production_additions < 0.2:
        risks.append("Low test-addition ratio (<20% of production additions) - review coverage")

    security_files = [file.filename for file in files if _is_security_sensitive_path(file.filename)]
    if security_files:
        risks.append(f"Security-sensitive file: {security_files[0]}")

    if any(
        re.search(r"(?:^|/)migrations?(?:/|$)", file.filename.replace("\\", "/"), re.IGNORECASE)
        or file.language == "SQL"
        for file in files
    ):
        risks.append("Database changes detected - review migration safety and rollback")

    config_files = [file for file in files if file.is_config]
    if config_files:
        risks.append(f"Configuration changes in {len(config_files)} file(s)")

    dependency_files = [file for file in files if _is_dependency_file(file.filename)]
    if dependency_files:
        risks.append(f"Dependency/build metadata changes in {len(dependency_files)} file(s)")

    return risks


def _risk_review_suggestions(risks: list[str]) -> list[str]:
    suggestions: list[str] = []
    if any(RISK_NO_TESTS in risk for risk in risks):
        suggestions.append("Request or verify tests for production behavior changes")

    if any(RISK_TEST_DELETIONS in risk for risk in risks):
        suggestions.append("Review removed tests and confirm equivalent coverage remains")
    return suggestions


def _language_review_suggestions(files: list[FileStats]) -> list[str]:
    languages = {file.language for file in files}
    return [
        suggestion
        for language_group, suggestion in _LANGUAGE_REVIEW_SUGGESTIONS
        if language_group & languages
    ]


def generate_suggestions(
    files: list[FileStats], complexity: float, risks: list[str]
) -> list[str]:
    """Generate actionable review suggestions from the analysis."""
    suggestions: list[str] = []
    total_changes = sum(file.total_changes for file in files)

    if total_changes > 800:
        suggestions.append("Consider splitting this PR into smaller, focused changes")

    if complexity > 0.7:
        suggestions.append("High review burden - allocate extra review time")
        suggestions.append("Consider pair reviewing critical sections")

    suggestions.extend(_risk_review_suggestions(risks))
    suggestions.extend(_language_review_suggestions(files))

    if not suggestions:
        suggestions.append("Standard review process should suffice")

    return suggestions


def analyze_pr(diff_content: str) -> PRAnalysis:
    """Perform a complete PR analysis."""
    files = parse_diff(diff_content)
    total_additions = sum(file.additions for file in files)
    total_deletions = sum(file.deletions for file in files)
    total_changes = total_additions + total_deletions
    complexity = calculate_complexity(files)
    risks = identify_risk_factors(files)

    return PRAnalysis(
        total_files=len(files),
        total_additions=total_additions,
        total_deletions=total_deletions,
        files=files,
        complexity_score=complexity,
        size_category=categorize_size(total_changes),
        estimated_review_time=estimate_review_time(files, complexity),
        risk_factors=risks,
        suggestions=generate_suggestions(files, complexity, risks),
    )


def analysis_to_dict(analysis: PRAnalysis) -> dict[str, object]:
    """Convert analysis to a stable JSON-serializable structure."""
    payload = asdict(analysis)
    payload["total_changes"] = analysis.total_changes
    payload["schema_version"] = 1
    return payload


def _file_display_icon(file: FileStats) -> str:
    if file.is_test:
        return "🧪"
    if file.is_config:
        return "⚙️"
    return "📄"


def _append_file_details(lines: list[str], files: list[FileStats]) -> None:
    lines.extend(["", "📁 FILES:"])
    by_language: dict[str, list[FileStats]] = defaultdict(list)
    for file in files:
        by_language[file.language].append(file)

    for language, language_files in sorted(by_language.items()):
        lines.extend(["", f"   [{language}]"])
        for file in language_files:
            prefix = _file_display_icon(file)
            lines.append(f"   {prefix} {file.filename} (+{file.additions}/-{file.deletions})")


def render_text(analysis: PRAnalysis, *, show_files: bool = False) -> str:
    """Render an analysis as human-readable text."""
    lines = [
        "=" * 60,
        "PR ANALYSIS REPORT",
        "=" * 60,
        "",
        "📊 SUMMARY",
        f"   Files changed: {analysis.total_files}",
        f"   Additions: +{analysis.total_additions}",
        f"   Deletions: -{analysis.total_deletions}",
        f"   Total changes: {analysis.total_changes}",
        "",
        f"📏 SIZE: {analysis.size_category}",
        f"   Review-burden score: {analysis.complexity_score}/1.0",
        f"   Estimated review time: ~{analysis.estimated_review_time} minutes",
    ]

    if analysis.risk_factors:
        lines.extend(["", "⚠️  RISK FACTORS:"])
        lines.extend(f"   • {risk}" for risk in analysis.risk_factors)

    lines.extend(["", "💡 SUGGESTIONS:"])
    lines.extend(f"   • {suggestion}" for suggestion in analysis.suggestions)

    if show_files:
        _append_file_details(lines, analysis.files)

    lines.extend(["", "=" * 60])
    return "\n".join(lines)


def print_analysis(analysis: PRAnalysis, show_files: bool = False) -> None:
    """Backward-compatible text printer."""
    print(render_text(analysis, show_files=show_files))


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Analyze Git PR diff size, review burden, risks, and review approach."
    )
    parser.add_argument("--diff-file", "-f", type=Path, help="Read the Git diff from a file")
    parser.add_argument("--stats", "-s", action="store_true", help="Show per-file details")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of text")
    parser.add_argument("--output", "-o", type=Path, help="Write output to a file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Write diagnostics to stderr")
    return parser


def _read_diff(args: argparse.Namespace) -> str:
    if args.diff_file is not None:
        if args.verbose:
            print(f"Reading diff from {args.diff_file}", file=sys.stderr)
        return args.diff_file.read_text(encoding="utf-8", errors="replace")

    if not sys.stdin.isatty():
        if args.verbose:
            print("Reading diff from stdin", file=sys.stderr)
        return sys.stdin.buffer.read().decode("utf-8", errors="replace")

    raise ValueError("No diff provided. Pipe a Git diff on stdin or use --diff-file FILE.")


def main(argv: Sequence[str] | None = None) -> int:
    """CLI entry point. Return a process exit code for testability."""
    parser = _build_parser()
    args = parser.parse_args(argv)

    try:
        diff_content = _read_diff(args)
        if not diff_content.strip():
            raise ValueError("No diff content provided.")

        analysis = analyze_pr(diff_content)
        output = (
            json.dumps(analysis_to_dict(analysis), indent=2, ensure_ascii=False)
            if args.json
            else render_text(analysis, show_files=args.stats)
        )

        if args.output is not None:
            args.output.write_text(output + "\n", encoding="utf-8")
            if args.verbose:
                print(f"Wrote analysis to {args.output}", file=sys.stderr)
        else:
            print(output)

        return 0
    except (OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
