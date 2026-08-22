#!/usr/bin/env python3
"""
validate_codebase_docs.py — Lightweight validator for acquire-codebase-knowledge outputs.

Run from the target project root after docs/codebase/ has been populated.

Usage:
  python3 scripts/validate_codebase_docs.py
  python3 /path/to/skill/scripts/validate_codebase_docs.py --project-root . --docs-dir docs/codebase
  python3 /path/to/skill/scripts/validate_codebase_docs.py --json

Exit codes:
  0  All checks passed
  1  One or more validation errors found
  2  Usage error
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple


REQUIRED_DOCS: Sequence[str] = (
    "STACK.md",
    "STRUCTURE.md",
    "ARCHITECTURE.md",
    "CONVENTIONS.md",
    "INTEGRATIONS.md",
    "TESTING.md",
    "CONCERNS.md",
)

ALLOWED_HIDDEN_ARTIFACTS = {".codebase-scan.txt"}

REQUIRED_HEADINGS: Dict[str, Sequence[str]] = {
    "STACK.md": (
        "# Technology Stack",
        "### 1) Runtime Summary",
        "### 2) Production Frameworks and Dependencies",
        "### 3) Development Toolchain",
        "### 4) Key Commands",
        "### 5) Environment and Config",
        "### 6) Evidence",
    ),
    "STRUCTURE.md": (
        "# Codebase Structure",
        "### 1) Top-Level Map",
        "### 2) Entry Points",
        "### 3) Module Boundaries",
        "### 4) Naming and Organization Rules",
        "### 5) Evidence",
    ),
    "ARCHITECTURE.md": (
        "# Architecture",
        "### 1) Architectural Style",
        "### 2) System Flow",
        "### 3) Layer/Module Responsibilities",
        "### 4) Reused Patterns",
        "### 5) Known Architectural Risks",
        "### 6) Evidence",
    ),
    "CONVENTIONS.md": (
        "# Coding Conventions",
        "### 1) Naming Rules",
        "### 2) Formatting and Linting",
        "### 3) Import and Module Conventions",
        "### 4) Error and Logging Conventions",
        "### 5) Testing Conventions",
        "### 6) Evidence",
    ),
    "INTEGRATIONS.md": (
        "# External Integrations",
        "### 1) Integration Inventory",
        "### 2) Data Stores",
        "### 3) Secrets and Credentials Handling",
        "### 4) Reliability and Failure Behavior",
        "### 5) Observability for Integrations",
        "### 6) Evidence",
    ),
    "TESTING.md": (
        "# Testing Patterns",
        "### 1) Test Stack and Commands",
        "### 2) Test Layout",
        "### 3) Test Scope Matrix",
        "### 4) Mocking and Isolation Strategy",
        "### 5) Coverage and Quality Signals",
        "### 6) Evidence",
    ),
    "CONCERNS.md": (
        "# Codebase Concerns",
        "### 1) Top Risks",
        "### 2) Technical Debt",
        "### 3) Security Concerns",
        "### 4) Performance and Scaling Concerns",
        "### 5) Fragile/High-Churn Areas",
        "### 6) `[ASK USER]` Questions",
        "### 7) Evidence",
    ),
}

# Template placeholders that should be resolved, replaced with [TODO], or converted to [ASK USER].
PLACEHOLDER_RE = re.compile(
    r"\[(?!TODO\]|ASK USER\]|REDACTED\])"
    r"(?:VALUE|FILE_PATH|FILE|RULE|EXAMPLE|NAME|COMMANDS?|TOOLS?|VERSION|"
    r"ROLE|PURPOSE|EVIDENCE|NOTE|NOTES|SUMMARY|SHORT SUMMARY|LIST FILES|"
    r"TODO|PATH|SOURCE|STORE|RISK|ISSUE|ACTION|SYSTEM|AUTH|TYPE|"
    r"high/med/low|yes/no|implemented/none/partial|.*?\bor\b.*?|.*?etc.*?)"
    r"\]",
    re.IGNORECASE,
)

# Credential-like values. These are intentionally conservative and should not match plain env var names.
SECRET_PATTERNS: Sequence[Tuple[str, re.Pattern]] = (
    (
        "private key material",
        re.compile(r"-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----"),
    ),
    (
        "AWS access key",
        re.compile(r"\bA(?:KIA|SIA)[0-9A-Z]{16}\b"),
    ),
    (
        "GitHub token",
        re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{30,}\b"),
    ),
    (
        "Slack token",
        re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"),
    ),
    (
        "JWT-like token",
        re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"),
    ),
    (
        "bearer token",
        re.compile(r"(?i)\bbearer\s+(?!\[REDACTED\])[A-Za-z0-9._~+/=-]{20,}\b"),
    ),
    (
        "credential-bearing URL",
        re.compile(r"://[^/\s:@]{2,}:(?!\[REDACTED\])[^@\s/]{4,}@"),
    ),
    (
        "secret assignment",
        re.compile(
            r"(?i)\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|"
            r"password|passwd|pwd|client[_-]?secret|database_url|db_url|"
            r"connection[_-]?string)\b\s*[:=]\s*"
            r"(?!\[REDACTED\]|\[TODO\]|\[ASK USER\]|TODO|UNKNOWN|NONE|NULL)"
            r"['\"]?[^'\"\s`|]{8,}"
        ),
    ),
)


@dataclass
class Finding:
    severity: str
    file: str
    message: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate docs/codebase outputs produced by the acquire-codebase-knowledge skill."
    )
    parser.add_argument(
        "--project-root",
        default=".",
        help="Project root used for relative evidence paths. Default: current directory.",
    )
    parser.add_argument(
        "--docs-dir",
        default="docs/codebase",
        help="Documentation directory to validate. Default: docs/codebase.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON instead of text.",
    )
    return parser.parse_args()


def rel_name(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def add(findings: List[Finding], severity: str, file: str, message: str) -> None:
    findings.append(Finding(severity=severity, file=file, message=message))


def iter_public_files(docs_dir: Path) -> Iterable[Path]:
    return (p for p in docs_dir.iterdir() if p.is_file() and not p.name.startswith("."))


def line_no(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def has_evidence_content(text: str) -> bool:
    """Return true if an Evidence heading has at least one non-placeholder item below it."""
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if re.match(r"^#{2,6}\s+.*Evidence\b", line.strip(), re.IGNORECASE):
            for later in lines[i + 1 :]:
                stripped = later.strip()
                if re.match(r"^#{1,6}\s+", stripped):
                    break
                if not stripped:
                    continue
                if stripped.startswith("-") and "path/to/" not in stripped and "[" not in stripped:
                    return True
                if stripped.startswith("-") and "[TODO]" in stripped:
                    return True
            return False
    return False


def validate_docs_dir(project_root: Path, docs_dir: Path) -> List[Finding]:
    findings: List[Finding] = []
    if not docs_dir.exists():
        add(findings, "error", str(docs_dir), "docs directory does not exist")
        return findings
    if not docs_dir.is_dir():
        add(findings, "error", str(docs_dir), "docs path exists but is not a directory")
        return findings

    required = set(REQUIRED_DOCS)
    public_names = {p.name for p in iter_public_files(docs_dir)}

    missing = sorted(required - public_names)
    extra = sorted(public_names - required)

    for name in missing:
        add(findings, "error", name, "required public documentation file is missing")
    for name in extra:
        add(findings, "error", name, "unexpected public file in docs/codebase")

    for p in docs_dir.iterdir():
        if p.name.startswith(".") and p.name not in ALLOWED_HIDDEN_ARTIFACTS:
            add(findings, "error", p.name, "unexpected hidden workflow artifact")

    for doc_name in REQUIRED_DOCS:
        path = docs_dir / doc_name
        if not path.exists():
            continue
        validate_file(project_root, docs_dir, path, findings)

    return findings


def validate_file(project_root: Path, docs_dir: Path, path: Path, findings: List[Finding]) -> None:
    doc_name = path.name
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        add(findings, "error", doc_name, "file is not valid UTF-8")
        return

    if not text.strip():
        add(findings, "error", doc_name, "file is empty")
        return

    for heading in REQUIRED_HEADINGS.get(doc_name, ()):
        if heading not in text:
            add(findings, "error", doc_name, f"missing required heading: {heading}")

    if not has_evidence_content(text):
        add(findings, "error", doc_name, "Evidence section is missing or contains only unresolved placeholders")

    # Detect unresolved template placeholders, while allowing [TODO], [ASK USER], and [REDACTED].
    for match in PLACEHOLDER_RE.finditer(text):
        add(
            findings,
            "error",
            doc_name,
            f"unresolved template placeholder near line {line_no(text, match.start())}: {match.group(0)}",
        )

    # [ASK USER] must include a question or actionable prompt on the same line.
    for idx, line in enumerate(text.splitlines(), start=1):
        marker = "[ASK USER]"
        if marker in line:
            after = line.split(marker, 1)[1].strip()
            if len(after) < 8:
                add(findings, "error", doc_name, f"[ASK USER] item at line {idx} has no actionable question")

    # Secret-like raw values must not be present in generated docs.
    for label, pattern in SECRET_PATTERNS:
        for match in pattern.finditer(text):
            add(
                findings,
                "error",
                doc_name,
                f"possible unredacted {label} near line {line_no(text, match.start())}",
            )


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    docs_dir_arg = Path(args.docs_dir)
    docs_dir = docs_dir_arg if docs_dir_arg.is_absolute() else project_root / docs_dir_arg

    findings = validate_docs_dir(project_root, docs_dir)
    error_count = sum(1 for finding in findings if finding.severity == "error")

    result = {
        "ok": error_count == 0,
        "error_count": error_count,
        "required_docs": list(REQUIRED_DOCS),
        "allowed_hidden_artifacts": sorted(ALLOWED_HIDDEN_ARTIFACTS),
        "findings": [asdict(finding) for finding in findings],
    }

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        if result["ok"]:
            print("PASS: docs/codebase output passed lightweight validation.")
        else:
            print(f"FAIL: {error_count} validation error(s) found.")
            for finding in findings:
                print(f"- {finding.severity.upper()} {finding.file}: {finding.message}")

    return 0 if result["ok"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        raise SystemExit(1)
