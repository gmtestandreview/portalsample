#!/usr/bin/env python3.14
"""
Secret Scanner Hook
Detects hardcoded secrets before git commits
"""

import json
import os
import re
import subprocess
import sys
from typing import TypedDict


class Finding(TypedDict):
    file: str
    line: int
    description: str
    severity: str
    match: str


# Secret detection patterns with descriptions
DETECTION_PATTERNS = [
    # AWS Keys
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID", "high"),
    (
        r'(?i)aws[_\-\s]*secret[_\-\s]*access[_\-\s]*key[\'"\s]*[=:][\'"\s]*[A-Za-z0-9/+=]{40}',
        "AWS Secret Access Key",
        "high",
    ),
    # Anthropic (Claude) API Keys
    (r"sk-ant-api\d{2}-[A-Za-z0-9\-_]{20,}", "Anthropic API Key", "high"),
    # OpenAI API Keys
    (r"sk-[a-zA-Z0-9]{48,}", "OpenAI API Key", "high"),
    (r"sk-proj-[a-zA-Z0-9\-_]{32,}", "OpenAI Project API Key", "high"),
    # Google API Keys & Service Accounts
    (r"AIza[0-9A-Za-z\-_]{35}", "Google API Key", "high"),
    (r"ya29\.[0-9A-Za-z\-_]+", "Google OAuth Access Token", "high"),
    # Stripe API Keys
    (r"sk_live_[0-9a-zA-Z]{24,}", "Stripe Live Secret Key", "critical"),
    (r"sk_test_[0-9a-zA-Z]{24,}", "Stripe Test Secret Key", "medium"),
    (r"rk_live_[0-9a-zA-Z]{24,}", "Stripe Live Restricted Key", "high"),
    (r"pk_live_[0-9a-zA-Z]{24,}", "Stripe Live Publishable Key", "medium"),
    # GitHub Tokens
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token", "high"),
    (r"gho_[0-9a-zA-Z]{36}", "GitHub OAuth Token", "high"),
    (r"ghs_[0-9a-zA-Z]{36}", "GitHub App Secret", "high"),
    (r"ghr_[0-9a-zA-Z]{36}", "GitHub Refresh Token", "high"),
    (r"github_pat_[0-9a-zA-Z_]{22,}", "GitHub Fine-Grained PAT", "high"),
    # GitLab Tokens
    (r"glpat-[0-9a-zA-Z\-_]{20,}", "GitLab Personal Access Token", "high"),
    # Vercel Tokens
    (r"vercel_[0-9a-zA-Z_\-]{24,}", "Vercel Token", "high"),
    # Supabase Keys
    (r"sbp_[0-9a-f]{40}", "Supabase Service Key", "high"),
    (r"sb_publishable_[A-Za-z0-9\-_]{20,}", "Supabase Publishable Key", "medium"),
    (r"sb_secret_[A-Za-z0-9\-_]{20,}", "Supabase Secret Key", "high"),
    # Hugging Face Tokens
    (r"hf_[a-zA-Z0-9]{34,}", "Hugging Face Token", "high"),
    # Replicate API Tokens
    (r"r8_[a-zA-Z0-9]{38,}", "Replicate API Token", "high"),
    # Groq API Keys
    (r"gsk_[a-zA-Z0-9]{48,}", "Groq API Key", "high"),
    # Databricks Personal Access Tokens
    (r"dapi[0-9a-f]{32}", "Databricks Access Token", "high"),
    # Azure Keys
    (
        r'(?i)azure[_\-\s]*(?:key|secret|token)[\'"\s]*[=:][\'"\s]*[A-Za-z0-9+/=]{32,}',
        "Azure Key",
        "high",
    ),
    # Cloudflare API Tokens
    (r"(?:cf|cloudflare)[_\-]?[A-Za-z0-9_\-]{37,}", "Cloudflare API Token", "medium"),
    # DigitalOcean Tokens
    (r"dop_v1_[0-9a-f]{64}", "DigitalOcean Personal Access Token", "high"),
    (r"doo_v1_[0-9a-f]{64}", "DigitalOcean OAuth Token", "high"),
    # Linear API Keys
    (r"lin_api_[a-zA-Z0-9]{40,}", "Linear API Key", "high"),
    # Notion API Keys
    (r"ntn_[0-9a-zA-Z]{40,}", "Notion Integration Token", "high"),
    (r"secret_[0-9a-zA-Z]{43}", "Notion API Key (legacy)", "high"),
    # Figma Access Tokens
    (r"figd_[0-9a-zA-Z\-_]{40,}", "Figma Access Token", "high"),
    # npm Tokens
    (r"npm_[0-9a-zA-Z]{36,}", "npm Access Token", "high"),
    # PyPI API Tokens
    (r"pypi-[A-Za-z0-9\-_]{16,}", "PyPI API Token", "high"),
    # Generic API Keys
    (
        r'(?i)(api[_\-\s]*key|apikey)[\'"\s]*[=:][\'"\s]*[\'"][0-9a-zA-Z\-_]{20,}[\'"]',
        "Generic API Key",
        "medium",
    ),
    (
        r'(?i)(secret[_\-\s]*key|secretkey)[\'"\s]*[=:][\'"\s]*[\'"][0-9a-zA-Z\-_]{20,}[\'"]',
        "Generic Secret Key",
        "medium",
    ),
    (
        r'(?i)(access[_\-\s]*token|accesstoken)[\'"\s]*[=:][\'"\s]*[\'"][0-9a-zA-Z\-_]{20,}[\'"]',
        "Generic Access Token",
        "medium",
    ),
    # Passwords
    (r'(?i)password[\'"\s]*[=:][\'"\s]*[\'"][^\'"\s]{8,}[\'"]', "Hardcoded Password", "high"),
    (r'(?i)passwd[\'"\s]*[=:][\'"\s]*[\'"][^\'"\s]{8,}[\'"]', "Hardcoded Password", "high"),
    # Private Keys
    (r"-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----", "Private Key", "critical"),
    (r"-----BEGIN OPENSSH PRIVATE KEY-----", "OpenSSH Private Key", "critical"),
    # Database Connection Strings
    (
        r'(?i)(mysql|postgresql|postgres|mongodb)://[^\s\'"\)]+:[^\s\'"\)]+@',
        "Database Connection String",
        "high",
    ),
    (
        r"(?i)Server=[^;]+;Database=[^;]+;User Id=[^;]+;Password=[^;]+",
        "SQL Server Connection String",
        "high",
    ),
    # JWT Tokens
    (r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", "JWT Token", "medium"),
    # Slack Tokens
    (r"xox[baprs]-[0-9a-zA-Z\-]{10,}", "Slack Token", "high"),
    # Telegram Bot Tokens
    (r"[0-9]{8,10}:[A-Za-z0-9_\-]{35}", "Telegram Bot Token", "medium"),
    # Discord Webhooks
    (r"https://discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_\-]+", "Discord Webhook URL", "medium"),
    # Twilio API Keys
    (r"SK[0-9a-fA-F]{32}", "Twilio API Key", "high"),
    # SendGrid API Keys
    (r"SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}", "SendGrid API Key", "high"),
    # Mailgun API Keys
    (r"key-[0-9a-zA-Z]{32}", "Mailgun API Key", "medium"),
    # Heroku API Keys
    (
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        "Potential API Key (UUID format)",
        "low",
    ),
]

# Files to exclude from scanning
EXCLUDED_FILES = [
    ".env.example",
    ".env.sample",
    ".env.template",
    "package-lock.json",
    "yarn.lock",
    "poetry.lock",
    "Pipfile.lock",
    "Cargo.lock",
    "go.sum",
    ".gitignore",
]

# Directories to exclude
EXCLUDED_DIRS = [
    "node_modules/",
    "vendor/",
    ".git/",
    "dist/",
    "build/",
    "__pycache__/",
    ".pytest_cache/",
    "venv/",
    "env/",
]


def should_skip_file(file_path: str) -> bool:
    """Check if file should be skipped"""
    # Skip if file doesn't exist (might be deleted)
    if not os.path.exists(file_path):
        return True

    # Skip excluded files
    filename = os.path.basename(file_path)
    if filename in EXCLUDED_FILES:
        return True

    # Skip excluded directories
    for excluded_dir in EXCLUDED_DIRS:
        if excluded_dir in file_path:
            return True

    # Skip binary files
    try:
        with open(file_path, "rb") as f:
            chunk = f.read(1024)
            if b"\0" in chunk:
                return True
    except OSError:
        return True

    return False


def get_staged_files() -> list[str]:
    """Get list of staged files"""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True,
            text=True,
            check=True,
        )
        return [f.strip() for f in result.stdout.split("\n") if f.strip()]
    except subprocess.CalledProcessError:
        return []


def scan_file(file_path: str) -> list[Finding]:
    """Scan a single file for secrets"""
    findings: list[Finding] = []

    if should_skip_file(file_path):
        return findings

    try:
        with open(file_path, encoding="utf-8", errors="ignore") as f:
            content = f.read()

        for line_num, line in enumerate(content.split("\n"), 1):
            for pattern, description, severity in DETECTION_PATTERNS:
                matches = re.finditer(pattern, line)
                for _match in matches:
                    # Skip if it looks like a comment or example
                    line_stripped = line.strip()
                    if line_stripped.startswith(("#", "//")) and (
                        "example" in line_stripped.lower() or "placeholder" in line_stripped.lower()
                    ):
                        continue

                    findings.append(
                        {
                            "file": file_path,
                            "line": line_num,
                            "description": description,
                            "severity": severity,
                            "match": "[REDACTED]",
                        }
                    )
    except OSError:
        # Skip files that can't be read
        pass

    return findings


def print_findings(findings: list[Finding]) -> None:
    """Print findings in a formatted way"""
    if not findings:
        return

    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings.sort(key=lambda x: (severity_order.get(x["severity"], 4), x["file"], x["line"]))

    print("", file=sys.stderr)
    print("🚨 SECRET SCANNER: Potential secrets detected!", file=sys.stderr)
    print("", file=sys.stderr)

    critical_count = sum(1 for f in findings if f["severity"] == "critical")
    high_count = sum(1 for f in findings if f["severity"] == "high")
    medium_count = sum(1 for f in findings if f["severity"] == "medium")
    low_count = sum(1 for f in findings if f["severity"] == "low")

    print(f"Found {len(findings)} potential secret(s):", file=sys.stderr)
    if critical_count > 0:
        print(f"  🔴 Critical: {critical_count}", file=sys.stderr)
    if high_count > 0:
        print(f"  🟠 High: {high_count}", file=sys.stderr)
    if medium_count > 0:
        print(f"  🟡 Medium: {medium_count}", file=sys.stderr)
    if low_count > 0:
        print(f"  🔵 Low: {low_count}", file=sys.stderr)
    print("", file=sys.stderr)

    severity_icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵"}
    for finding in findings:
        icon = severity_icons.get(finding["severity"], "⚪")
        label: str = finding["description"]
        print(f"{icon} {label}", file=sys.stderr)
        print(f"   File: {finding['file']}:{finding['line']}", file=sys.stderr)
        print("", file=sys.stderr)

    print("❌ COMMIT BLOCKED: Remove secrets before committing", file=sys.stderr)
    print("", file=sys.stderr)
    print("How to fix:", file=sys.stderr)
    print("  1. Move secrets to environment variables:", file=sys.stderr)
    print("     • Create/update .env file (ensure it's in .gitignore)", file=sys.stderr)
    print(
        '     • Use process.env.SECRET_NAME (Node.js) or os.environ.get("SECRET_NAME") (Python)',
        file=sys.stderr,
    )
    print("", file=sys.stderr)
    print("  2. Use a secrets management service:", file=sys.stderr)
    print("     • AWS Secrets Manager, Google Secret Manager, Azure Key Vault", file=sys.stderr)
    print("     • HashiCorp Vault, Doppler, 1Password", file=sys.stderr)
    print("", file=sys.stderr)
    print("  3. For false positives:", file=sys.stderr)
    print('     • Add comments with "example" or "placeholder" to skip detection', file=sys.stderr)
    print("     • Disable hook temporarily: remove from .claude/hooks.json", file=sys.stderr)
    print("", file=sys.stderr)


def _read_command() -> str:
    """Read the command from Claude Code's hook input."""
    try:
        input_data = json.load(sys.stdin)
    except ValueError:
        # If no valid JSON on stdin, allow the action
        return ""

    tool_input = input_data.get("tool_input", {})
    return tool_input.get("command", "")


def _existing_files(lines: list[str], prefix_length: int = 0) -> list[str]:
    """Return existing file paths from git output lines."""
    files: list[str] = []
    for line in lines:
        if len(line) <= prefix_length:
            continue
        file_path = line[prefix_length:].strip()
        if os.path.isfile(file_path):
            files.append(file_path)
    return files


def _auto_staged_files(command: str) -> list[str]:
    """Find files that ``git commit -a`` would stage."""
    commit_match = re.search(r"git\s+commit\s+(.+)", command)
    if not commit_match or not re.search(r"-\w*a", commit_match.group(1)):
        return []

    result = subprocess.run(["git", "diff", "--name-only"], capture_output=True, text=True)
    return _existing_files(result.stdout.strip().split("\n"))


def _all_added_files() -> list[str]:
    """Find files that ``git add .`` would add."""
    result = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    return _existing_files(result.stdout.strip().split("\n"), prefix_length=3)


def _explicitly_added_files(args: str) -> list[str]:
    """Find existing paths from an explicit ``git add`` command."""
    return [token for token in args.split() if not token.startswith("-") and os.path.isfile(token)]


def _added_files(command: str) -> list[str]:
    """Find files from a chained ``git add`` command."""
    files: list[str] = []
    for part in re.split(r"&&|;", command):
        add_match = re.match(r"git\s+add\s+(.+)", part.strip())
        if not add_match:
            continue

        args = add_match.group(1).strip()
        if args in (".", "-A", "--all"):
            files.extend(_all_added_files())
        else:
            files.extend(_explicitly_added_files(args))
    return files


def _files_to_scan(command: str) -> list[str]:
    """Resolve staged files, including files implied by the pending command."""
    staged_files = get_staged_files()
    if staged_files:
        return staged_files

    return _auto_staged_files(command) + _added_files(command)


def _scan_files(file_paths: list[str]) -> list[Finding]:
    """Scan each resolved file and combine its findings."""
    findings: list[Finding] = []
    for file_path in file_paths:
        findings.extend(scan_file(file_path))
    return findings


def main() -> None:
    command = _read_command()

    # Only act on git commit commands
    if not re.search(r"git\s+commit", command):
        sys.exit(0)

    staged_files = _files_to_scan(command)
    if not staged_files:
        sys.exit(0)

    all_findings = _scan_files(staged_files)
    if all_findings:
        print_findings(all_findings)
        sys.exit(2)

    # No secrets found, allow commit
    sys.exit(0)


if __name__ == "__main__":
    main()
