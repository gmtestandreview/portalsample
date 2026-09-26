#!/usr/bin/env bash
#
# handoff.sh — verify a sprint's handoff artifacts before the chat closes.
#
# The single most damaging anti-pattern in this model is closing a chat without
# a handoff: the next chat starts blind and duplicates or overwrites work. The
# protocol is prose in PROJECT_BRIEF.md; this script checks it.
#
# Checks, per sprint N:
#   1. docs/sprint-N/progress.md exists and has been filled in
#   2. docs/sprint-N/done.md exists and has been filled in
#   3. PROJECT_BRIEF.md current-state section mentions this sprint
#   4. Unfilled {{placeholder}} markers are reported
#   5. Working tree is committed (git only)
#
# Usage:
#   a-team/scripts/handoff.sh 1
#   a-team/scripts/handoff.sh --latest
#   a-team/scripts/handoff.sh 1 --strict     # placeholders become failures
#
# Exit codes:
#   0  handoff is complete
#   1  handoff is incomplete — do not close the chat
#   2  bad usage

. "$(cd "$(dirname "$0")" && pwd)/lib/common.sh"

SPRINT=''
STRICT=0

usage() { sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --latest) SPRINT="$(latest_sprint)"; shift ;;
    --strict) STRICT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) err "unknown argument: $1"; usage >&2; exit 2 ;;
    *) SPRINT="$1"; shift ;;
  esac
done

[ -n "$SPRINT" ] || { err 'sprint number required (or use --latest)'; usage >&2; exit 2; }
validate_sprint_number "$SPRINT"

TARGET="$(sprint_dir "$SPRINT")"
[ -d "$TARGET" ] || die "no such sprint directory: ${TARGET#"$REPO_ROOT"/}"

FAILURES=0
fail() { err "$1"; FAILURES=$((FAILURES + 1)); }

heading "Handoff check — sprint $SPRINT"

# --- 1 & 2: required artifacts, non-trivially filled ------------------------
#
# "Exists" is not enough: a freshly scaffolded file passes an existence check
# while telling the next chat nothing. Require real content.

MIN_LINES=12

for artifact in progress done; do
  path="$TARGET/$artifact.md"
  rel="${path#"$REPO_ROOT"/}"
  if [ ! -f "$path" ]; then
    fail "missing: $rel"
    continue
  fi
  lines="$(grep -cve '^[[:space:]]*$' "$path" || true)"
  if [ "$lines" -lt "$MIN_LINES" ]; then
    fail "$rel has only $lines non-blank lines — looks unfilled (expected >= $MIN_LINES)"
  else
    ok "$rel ($lines non-blank lines)"
  fi
done

# --- 3: PROJECT_BRIEF.md reflects this sprint -------------------------------

BRIEF="$REPO_ROOT/PROJECT_BRIEF.md"
if [ ! -f "$BRIEF" ]; then
  fail 'PROJECT_BRIEF.md missing — recreate it from the orchestration skill templates'
elif grep -qiE "sprint[ -]?$SPRINT\b" "$BRIEF"; then
  ok "PROJECT_BRIEF.md references sprint $SPRINT"
else
  fail "PROJECT_BRIEF.md does not mention sprint $SPRINT — update its current-state section"
fi

# --- 4: leftover placeholders ----------------------------------------------

PLACEHOLDERS=0
for artifact in plan progress done; do
  path="$TARGET/$artifact.md"
  [ -f "$path" ] || continue
  count="$(grep -co '{{[^}]*}}' "$path" || true)"
  if [ "$count" -gt 0 ]; then
    PLACEHOLDERS=$((PLACEHOLDERS + count))
    if [ "$STRICT" -eq 1 ]; then
      fail "${path#"$REPO_ROOT"/} still has $count unfilled placeholder line(s)"
    else
      warn "${path#"$REPO_ROOT"/} still has $count unfilled placeholder line(s)"
    fi
  fi
done
if [ "$PLACEHOLDERS" -eq 0 ]; then
  ok 'no unfilled template placeholders'
fi

# --- 5: committed ----------------------------------------------------------

if has_git; then
  if working_tree_dirty; then
    fail 'working tree has uncommitted changes — commit before closing the chat'
    note 'uncommitted:'
    git -C "$REPO_ROOT" status --porcelain | sed 's/^/       /' | head -20
  else
    ok 'working tree is clean'
  fi
else
  note 'no git — skipping the commit check'
fi

# --- Summary ---------------------------------------------------------------

heading 'Result'

if [ "$FAILURES" -gt 0 ]; then
  err "$FAILURES handoff problem(s) — the sprint is not ready to hand off"
  note 'Fix these before the chat closes. The repo is the only shared memory;'
  note 'anything left in conversation is lost.'
  exit 1
fi

ok "sprint $SPRINT handoff is complete"
note "Recovery prompt for the next chat:"
printf '\n'
printf '    Read a-team/INIT.md, PROJECT_BRIEF.md, and docs/sprint-%s/progress.md.\n' "$SPRINT"
printf '    Continue from where it left off.\n\n'
exit 0
