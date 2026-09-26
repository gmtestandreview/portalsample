#!/usr/bin/env bash
#
# new-sprint.sh — scaffold docs/sprint-N/ from a-team/templates/.
#
# Creates plan.md, progress.md, and done.md for a sprint. Refuses to overwrite
# an existing artifact unless --force is given, so re-running it on a live
# sprint cannot destroy a progress tracker.
#
# Usage:
#   a-team/scripts/new-sprint.sh 2
#   a-team/scripts/new-sprint.sh 2 --name "Story coverage"
#   a-team/scripts/new-sprint.sh --next --name "Story coverage"
#   a-team/scripts/new-sprint.sh 2 --force
#
# Exit codes:
#   0  scaffolded (or already complete and nothing to do)
#   1  refused — an artifact exists and --force was not given
#   2  bad usage

. "$(cd "$(dirname "$0")" && pwd)/lib/common.sh"

TEMPLATE_DIR="$ATEAM_DIR/templates"
SPRINT=''
SPRINT_NAME=''
FORCE=0

usage() { sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --next) SPRINT=$(( $(latest_sprint) + 1 )); shift ;;
    --name) SPRINT_NAME="${2:-}"; shift 2 ;;
    --name=*) SPRINT_NAME="${1#*=}"; shift ;;
    --force|-f) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) err "unknown argument: $1"; usage >&2; exit 2 ;;
    *) SPRINT="$1"; shift ;;
  esac
done

[ -n "$SPRINT" ] || { err 'sprint number required (or use --next)'; usage >&2; exit 2; }
validate_sprint_number "$SPRINT"
[ -d "$TEMPLATE_DIR" ] || die "template directory missing: $TEMPLATE_DIR"

SPRINT_NAME="${SPRINT_NAME:-Unnamed}"
TARGET="$(sprint_dir "$SPRINT")"
TODAY="$(date -u +%Y-%m-%d)"

heading "Sprint $SPRINT — $SPRINT_NAME"
note "target: ${TARGET#"$REPO_ROOT"/}"

# Render a template, substituting the {{N}}, {{SPRINT_NAME}} and {{DATE}}
# placeholders. Every other {{...}} placeholder is left in place on purpose —
# they mark the fields a human or agent still has to fill in.
render() {
  local src="$1" dest="$2"
  sed \
    -e "s|{{N}}|$SPRINT|g" \
    -e "s|{{SPRINT_NAME}}|$SPRINT_NAME|g" \
    -e "s|{{DATE}}|$TODAY|g" \
    "$src" > "$dest"
}

mkdir -p "$TARGET"

CREATED=0 SKIPPED=0
for artifact in plan progress done; do
  src="$TEMPLATE_DIR/$artifact.md"
  dest="$TARGET/$artifact.md"
  [ -f "$src" ] || die "missing template: ${src#"$REPO_ROOT"/}"

  if [ -f "$dest" ] && [ "$FORCE" -eq 0 ]; then
    warn "exists, not overwritten: ${dest#"$REPO_ROOT"/}"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  render "$src" "$dest"
  ok "wrote ${dest#"$REPO_ROOT"/}"
  CREATED=$((CREATED + 1))
done

if [ "$SKIPPED" -gt 0 ] && [ "$CREATED" -eq 0 ]; then
  warn "sprint $SPRINT already scaffolded — pass --force to regenerate"
  exit 1
fi

heading 'Next steps'
note "1. Producer fills in docs/sprint-$SPRINT/plan.md (tasks, owners, success criteria)"
note "2. Producer files the GitHub Issues the plan references"
note "3. Dev runs: a-team/scripts/preflight.sh --role dev"
note "4. Dev branches: git checkout -b feature/sprint-$SPRINT"
note "5. At close: a-team/scripts/handoff.sh $SPRINT"
