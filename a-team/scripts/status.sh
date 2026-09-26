#!/usr/bin/env bash
#
# status.sh — one screen of orchestration state, read from the repo.
#
# Context does not survive a chat; files do. This reads the files so a cold
# chat can orient in one command instead of guessing.
#
# Usage:
#   a-team/scripts/status.sh
#   a-team/scripts/status.sh --sprint 1

. "$(cd "$(dirname "$0")" && pwd)/lib/common.sh"

SPRINT=''

while [ $# -gt 0 ]; do
  case "$1" in
    --sprint) SPRINT="${2:-}"; shift 2 ;;
    --sprint=*) SPRINT="${1#*=}"; shift ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

SPRINT="${SPRINT:-$(latest_sprint)}"

heading 'Repository'
note "root:   $REPO_ROOT"
if has_git; then
  note "branch: $(current_branch)"
  if working_tree_dirty; then
    note "tree:   dirty ($(git -C "$REPO_ROOT" status --porcelain | wc -l | tr -d ' ') path(s))"
  else
    note 'tree:   clean'
  fi
  note "head:   $(git -C "$REPO_ROOT" log -1 --pretty='%h %s' 2>/dev/null || echo 'no commits')"
else
  note 'git:    absent — local-only workspace'
fi

heading 'Project brief'
BRIEF="$REPO_ROOT/PROJECT_BRIEF.md"
if [ -f "$BRIEF" ]; then
  ok 'PROJECT_BRIEF.md present'
  # Surface the objective and whichever line records the last update.
  sed -n 's/^## 2\. Objective/&/p' "$BRIEF" >/dev/null 2>&1 || true
  awk '/^## 2\./{f=1;next} /^## 3\./{f=0} f && NF {print "       " $0; exit}' "$BRIEF"
  grep -iE '^\*\*Last Updated:|^> Last updated:' "$BRIEF" | head -1 | sed 's/^/       /' || true
else
  err 'PROJECT_BRIEF.md missing — recreate before relying on it'
fi

heading "Sprint $SPRINT"
if [ "$SPRINT" -eq 0 ]; then
  warn 'no docs/sprint-N/ found — start one with: a-team/scripts/new-sprint.sh 1'
else
  TARGET="$(sprint_dir "$SPRINT")"
  for artifact in plan progress done; do
    path="$TARGET/$artifact.md"
    if [ -f "$path" ]; then
      lines="$(grep -cve '^[[:space:]]*$' "$path" || true)"
      printf '  %-12s %s (%s lines)\n' "$artifact.md" "${C_GREEN}present${C_RESET}" "$lines"
    else
      printf '  %-12s %s\n' "$artifact.md" "${C_YELLOW}missing${C_RESET}"
    fi
  done

  PROGRESS="$TARGET/progress.md"
  if [ -f "$PROGRESS" ]; then
    heading 'Task status (from progress.md)'
    # Two conventions are in use in this repo: the glyph markers that
    # a-team/templates/progress.md scaffolds, and the word statuses that
    # docs/sprint-1 was written with by hand. Count whichever appear.
    shown=0
    for pair in '✅:done' '🔨:in progress' '⬜:not started' '❌:blocked'; do
      glyph="${pair%%:*}"; label="${pair#*:}"
      count="$(grep -c -- "$glyph" "$PROGRESS" || true)"
      if [ "$count" -gt 0 ]; then
        printf '  %-18s %s\n' "$label" "$count"
        shown=1
      fi
    done
    for word in verified partially_verified in_progress todo blocked; do
      count="$(grep -ciE "\\b$word\\b" "$PROGRESS" || true)"
      if [ "$count" -gt 0 ]; then
        printf '  %-18s %s\n' "$word" "$count"
        shown=1
      fi
    done
    if [ "$shown" -eq 0 ]; then
      note 'no recognised status markers — progress.md may be unfilled'
    fi
    # Most recent dated update, if the file keeps a daily log.
    last_update="$(grep -oE '^#+ .*(Daily Update|Update)[^#]*' "$PROGRESS" | tail -1 || true)"
    if [ -n "$last_update" ]; then
      note "latest entry: $last_update"
    fi
  fi
fi

heading 'QA sign-off'
if [ -d "$REPO_ROOT/docs/qa" ]; then
  found=0
  for f in "$REPO_ROOT"/docs/qa/*signoff*.md; do
    [ -f "$f" ] || continue
    note "${f#"$REPO_ROOT"/}"
    found=1
  done
  if [ "$found" -eq 0 ]; then
    note 'docs/qa/ present, no sign-off yet'
  fi
else
  note 'docs/qa/ absent'
fi

heading 'Next command'
if [ "$SPRINT" -eq 0 ]; then
  note 'a-team/scripts/new-sprint.sh 1 --name "..."'
else
  note 'a-team/scripts/preflight.sh --role dev'
  note 'a-team/scripts/validate.sh --role dev'
  note "a-team/scripts/handoff.sh $SPRINT"
fi
