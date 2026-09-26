#!/usr/bin/env bash
# Shared helpers for a-team orchestration scripts.
# Source this, do not execute it:  . "$(dirname "$0")/lib/common.sh"

set -euo pipefail

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'
else
  C_RESET=''; C_BOLD=''; C_DIM=''
  C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''
fi

info()  { printf '%s\n' "${C_BLUE}==>${C_RESET} $*"; }
ok()    { printf '%s\n' "${C_GREEN} ok ${C_RESET} $*"; }
warn()  { printf '%s\n' "${C_YELLOW}warn${C_RESET} $*" >&2; }
err()   { printf '%s\n' "${C_RED}fail${C_RESET} $*" >&2; }
note()  { printf '%s\n' "${C_DIM}     $*${C_RESET}"; }
die()   { err "$*"; exit 1; }

heading() {
  local text="$*"
  printf '\n%s\n' "${C_BOLD}${text}${C_RESET}"
  printf '%s\n' "${C_DIM}$(printf '%*s' "${#text}" '' | tr ' ' '-')${C_RESET}"
}

# ---------------------------------------------------------------------------
# Repo location
# ---------------------------------------------------------------------------

# Absolute path to the repository root, whether or not .git exists.
# Falls back to the parent of a-team/ so the scripts still work in a
# snapshot export that has had its .git directory stripped.
repo_root() {
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  if git -C "$here" rev-parse --show-toplevel >/dev/null 2>&1; then
    git -C "$here" rev-parse --show-toplevel
  else
    printf '%s\n' "$here"
  fi
}

REPO_ROOT="$(repo_root)"
ATEAM_DIR="$REPO_ROOT/a-team"
DOCS_DIR="$REPO_ROOT/docs"

# ---------------------------------------------------------------------------
# Capability probes
#
# Every a-team agent role is required to preflight before acting. These are the
# probes that make that check mechanical instead of assumed.
# ---------------------------------------------------------------------------

has_cmd()      { command -v "$1" >/dev/null 2>&1; }
has_git()      { [ -d "$REPO_ROOT/.git" ] && has_cmd git; }
has_remote()   { has_git && git -C "$REPO_ROOT" remote get-url origin >/dev/null 2>&1; }
has_node_mods() { [ -d "$REPO_ROOT/node_modules" ]; }

require_cmd() {
  has_cmd "$1" || die "required command not found: $1"
}

current_branch() {
  has_git || { printf '%s\n' '(no git)'; return; }
  git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || printf '%s\n' '(detached)'
}

working_tree_dirty() {
  has_git || return 1
  [ -n "$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)" ]
}

# ---------------------------------------------------------------------------
# Sprint helpers
# ---------------------------------------------------------------------------

# Highest N for which docs/sprint-N/ exists. Prints 0 when there are none.
latest_sprint() {
  local max=0 dir n
  for dir in "$DOCS_DIR"/sprint-*; do
    [ -d "$dir" ] || continue
    n="${dir##*/sprint-}"
    case "$n" in
      ''|*[!0-9]*) continue ;;
    esac
    [ "$n" -gt "$max" ] && max="$n"
  done
  printf '%s\n' "$max"
}

sprint_dir() {
  [ $# -eq 1 ] || die 'sprint_dir requires a sprint number'
  printf '%s\n' "$DOCS_DIR/sprint-$1"
}

validate_sprint_number() {
  case "${1:-}" in
    ''|*[!0-9]*) die "sprint number must be a positive integer, got: '${1:-}'" ;;
  esac
  [ "$1" -gt 0 ] || die 'sprint number must be greater than zero'
}

# ---------------------------------------------------------------------------
# Confirmation (skipped when --yes / ATEAM_ASSUME_YES is set)
# ---------------------------------------------------------------------------

confirm() {
  local prompt="${1:-Continue?}"
  if [ "${ATEAM_ASSUME_YES:-0}" = "1" ]; then
    note "$prompt  (auto-confirmed)"
    return 0
  fi
  if [ ! -t 0 ]; then
    die "$prompt  (refusing to assume yes in a non-interactive shell; re-run with --yes)"
  fi
  printf '%s [y/N] ' "$prompt"
  local reply
  read -r reply
  case "$reply" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}
