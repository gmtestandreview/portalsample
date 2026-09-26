#!/usr/bin/env bash
#
# preflight.sh — probe what this workspace can actually do before an agent acts.
#
# Every a-team role (Producer, Dev, QA) is required to preflight. The agent
# definitions in .github/agents/workflows/ai-team/ say "verify the workspace
# model" but leave the verification to prose; this script makes it mechanical.
#
# Usage:
#   a-team/scripts/preflight.sh [--role producer|dev|qa] [--quiet]
#
# Exit codes:
#   0  workspace is usable for the requested role
#   1  a hard blocker was found (the role cannot proceed as written)

. "$(cd "$(dirname "$0")" && pwd)/lib/common.sh"

ROLE='any'
QUIET=0

while [ $# -gt 0 ]; do
  case "$1" in
    --role) ROLE="${2:-}"; shift 2 ;;
    --role=*) ROLE="${1#*=}"; shift ;;
    --quiet|-q) QUIET=1; shift ;;
    -h|--help) sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

case "$ROLE" in
  any|producer|dev|qa) ;;
  *) die "unknown role: $ROLE (expected producer, dev, or qa)" ;;
esac

BLOCKERS=0
DEGRADED=()

blocker()  { err "$1"; BLOCKERS=$((BLOCKERS + 1)); }
degraded() { warn "$1"; DEGRADED+=("$1"); }

# ---------------------------------------------------------------------------

[ "$QUIET" -eq 1 ] || heading "Workspace"

note "root:   $REPO_ROOT"
note "role:   $ROLE"

# --- Tooling ---------------------------------------------------------------

[ "$QUIET" -eq 1 ] || heading "Tooling"

if has_cmd node; then
  node_major="$(node --version | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "$node_major" -ge 20 ]; then
    ok "node $(node --version)  (package.json requires >=20)"
  else
    blocker "node $(node --version) is below the >=20 required by package.json engines"
  fi
else
  blocker 'node not found — no validation gate can run'
fi

has_cmd npm && ok "npm $(npm --version)" || blocker 'npm not found'

if has_node_mods; then
  ok 'node_modules/ present'
else
  degraded 'node_modules/ missing — run `npm ci` before any validation gate'
fi

# --- Git / GitHub ----------------------------------------------------------

[ "$QUIET" -eq 1 ] || heading "Git and GitHub"

if has_git; then
  ok "git repository, on branch $(current_branch)"
  if has_remote; then
    ok "origin: $(git -C "$REPO_ROOT" remote get-url origin)"
  else
    degraded 'no origin remote — skip push and PR steps, work locally'
  fi
  if working_tree_dirty; then
    warn 'working tree has uncommitted changes'
  fi
else
  degraded 'no .git directory — skip every pull/branch/push/PR step in the role playbooks'
fi

# --- Repository shape ------------------------------------------------------
#
# The checked-in ai-team agent files were written against a `static/js` layout.
# This repository uses ClientApp/src. Assert the real layout so an agent that
# inherited the stale paths fails loudly here instead of silently editing
# nothing.

[ "$QUIET" -eq 1 ] || heading "Source layout"

for required in \
  'ClientApp/src' \
  'ClientApp/src/styles' \
  'tests/unit' \
  'docs' \
  'PROJECT_BRIEF.md' \
  'CLAUDE.md'
do
  if [ -e "$REPO_ROOT/$required" ]; then
    ok "$required"
  else
    blocker "expected path missing: $required"
  fi
done

if [ -d "$REPO_ROOT/static/js" ]; then
  degraded 'static/js/ exists — check which layout the agent playbooks should target'
else
  note 'static/js/ absent, as expected: the ai-team agent files name stale paths'
  note 'editable surfaces here are ClientApp/src/**/*.{ts,tsx} and ClientApp/src/styles/**/*.scss'
fi

# --- Role-specific ---------------------------------------------------------

case "$ROLE" in
  producer)
    [ "$QUIET" -eq 1 ] || heading "Producer capabilities"
    [ -f "$REPO_ROOT/PROJECT_BRIEF.md" ] \
      && ok 'PROJECT_BRIEF.md present (single source of truth)' \
      || blocker 'PROJECT_BRIEF.md missing — recreate it before relying on it'
    sprint="$(latest_sprint)"
    if [ "$sprint" -gt 0 ]; then
      ok "latest sprint artifacts: docs/sprint-$sprint/"
    else
      degraded 'no docs/sprint-N/ yet — run a-team/scripts/new-sprint.sh 1'
    fi
    note 'Remy writes no application code. Markdown, docs/, and issue drafts only.'
    ;;
  dev)
    [ "$QUIET" -eq 1 ] || heading "Dev capabilities"
    sprint="$(latest_sprint)"
    if [ "$sprint" -gt 0 ] && [ -f "$(sprint_dir "$sprint")/plan.md" ]; then
      ok "plan to execute: docs/sprint-$sprint/plan.md"
    else
      degraded 'no sprint plan found — ask the Producer for one before implementing'
    fi
    if [ -f "$REPO_ROOT/ClientApp/src/api/web-api-client.ts" ]; then
      note 'ClientApp/src/api/web-api-client.ts is generated — never edit it'
    fi
    note 'This snapshot has no backend source. Do not invent Sage/API work.'
    ;;
  qa)
    [ "$QUIET" -eq 1 ] || heading "QA capabilities"
    [ -d "$REPO_ROOT/docs/qa" ] \
      && ok 'docs/qa/ present for sign-off artifacts' \
      || degraded 'docs/qa/ missing — create it before writing a sign-off'
    [ -d "$REPO_ROOT/tests/e2e" ] \
      && ok 'tests/e2e/ present (Playwright BDD)' \
      || degraded 'tests/e2e/ missing'
    note 'Ivy may edit tests/** and docs/qa/** only. Never ClientApp/src/**.'
    ;;
esac

# --- Summary ---------------------------------------------------------------

heading "Result"

if [ "${#DEGRADED[@]}" -gt 0 ]; then
  printf '%s\n' "${C_YELLOW}${#DEGRADED[@]} degraded capability(ies):${C_RESET}"
  for d in "${DEGRADED[@]}"; do note "- $d"; done
fi

if [ "$BLOCKERS" -gt 0 ]; then
  err "$BLOCKERS blocker(s) — do not start role work until these are resolved"
  exit 1
fi

ok "preflight passed for role: $ROLE"
exit 0
