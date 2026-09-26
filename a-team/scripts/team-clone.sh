#!/usr/bin/env bash
#
# team-clone.sh — set up a separate clone for one team.
#
# The orchestration model gives each team its own clone, not a worktree:
# worktrees share one git index, so parallel teams collide on the staging area.
# This script enforces that and derives the right branch name per role.
#
# Usage:
#   a-team/scripts/team-clone.sh dev 2                 # ../portalsample-dev  on feature/sprint-2
#   a-team/scripts/team-clone.sh qa 2                  # ../portalsample-qa   on feature/qa-2
#   a-team/scripts/team-clone.sh devops 2
#   a-team/scripts/team-clone.sh producer              # ../portalsample-producer on main
#   a-team/scripts/team-clone.sh dev 2 --dest /path --no-install --yes
#
# Exit codes:
#   0  clone ready
#   1  blocked (no git, no origin, destination exists)
#   2  bad usage

. "$(cd "$(dirname "$0")" && pwd)/lib/common.sh"

ROLE=''
SPRINT=''
DEST=''
INSTALL=1

usage() { sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="${2:-}"; shift 2 ;;
    --dest=*) DEST="${1#*=}"; shift ;;
    --no-install) INSTALL=0; shift ;;
    --yes|-y) ATEAM_ASSUME_YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) err "unknown argument: $1"; usage >&2; exit 2 ;;
    *)
      if [ -z "$ROLE" ]; then ROLE="$1"
      elif [ -z "$SPRINT" ]; then SPRINT="$1"
      else err "unexpected argument: $1"; usage >&2; exit 2
      fi
      shift ;;
  esac
done

[ -n "$ROLE" ] || { err 'role required'; usage >&2; exit 2; }

has_git    || die 'no .git directory — a separate clone requires a git repository'
has_remote || die 'no origin remote — nothing to clone from'

ORIGIN="$(git -C "$REPO_ROOT" remote get-url origin)"

case "$ROLE" in
  producer)
    BRANCH='main'
    ;;
  dev)
    validate_sprint_number "${SPRINT:-}"
    BRANCH="feature/sprint-$SPRINT"
    ;;
  qa)
    validate_sprint_number "${SPRINT:-}"
    BRANCH="feature/qa-$SPRINT"
    ;;
  devops)
    validate_sprint_number "${SPRINT:-}"
    BRANCH="feature/devops-$SPRINT"
    ;;
  *)
    err "unknown role: $ROLE (expected producer, dev, qa, or devops)"; exit 2 ;;
esac

REPO_NAME="$(basename "$REPO_ROOT")"
DEST="${DEST:-$(dirname "$REPO_ROOT")/$REPO_NAME-$ROLE}"

heading "Team clone: $ROLE"
note "origin: $ORIGIN"
note "dest:   $DEST"
note "branch: $BRANCH"

[ -e "$DEST" ] && die "destination already exists: $DEST"

confirm 'Create this clone?' || { warn 'aborted'; exit 0; }

info 'cloning'
git clone "$ORIGIN" "$DEST"

if [ "$BRANCH" = 'main' ]; then
  info 'staying on main (producer coordinates, does not develop)'
else
  info "creating branch $BRANCH"
  # Reuse the remote branch when it already exists so a second team member
  # joining mid-sprint does not start from a stale base.
  if git -C "$DEST" ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    note 'branch exists on origin — checking it out'
    git -C "$DEST" checkout -B "$BRANCH" --track "origin/$BRANCH"
  else
    git -C "$DEST" checkout -b "$BRANCH"
  fi
fi

if [ "$INSTALL" -eq 1 ]; then
  if has_cmd npm; then
    info 'npm ci'
    (cd "$DEST" && npm ci)
  else
    warn 'npm not found — skipping install'
  fi
else
  note 'skipped install (--no-install)'
fi

heading 'Ready'
note "cd $DEST"
note "a-team/scripts/preflight.sh --role ${ROLE/devops/dev}"
printf '\n'
ok "$ROLE clone ready on $BRANCH"

heading 'Rules for this clone'
note 'Feature branch -> PR -> regular merge. Never push to main directly.'
note 'Never squash. Never rebase a shared feature branch. Never force-push.'
case "$ROLE" in
  producer) note 'Producer writes no application code.' ;;
  qa) note 'QA edits tests/** and docs/qa/** only, never ClientApp/src/**.' ;;
esac
exit 0
