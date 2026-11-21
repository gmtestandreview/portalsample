#!/usr/bin/env bash
# Persisted tests for scripts/sdd-repo.sh, scripts/task-brief.sh,
# scripts/sdd-workspace.sh and scripts/review-package.sh. Self-contained:
# builds throwaway git repos under mktemp, never touches the real working tree,
# removes everything on exit.
#
# The repository the scripts act on is the CURRENT DIRECTORY's working tree
# (or -C DIR's), never the plan file's location, so every call below runs from
# inside the throwaway repo (cd "$T") or passes -C.
#
# Usage: bash evals/test-scripts.sh      (exit 0 = all pass, 1 = any failure)
# Covers rubric probe T3 in evals/devils-advocate-rubric.md.
set -u

here=$(cd "$(dirname "$0")" && pwd)
S="$here/../scripts"
pass=0
fail=0
out=""

ok() {
  local name=$1
  pass=$((pass + 1))
  printf 'PASS  %s\n' "$name"
}

bad() {
  local name=$1
  local detail=${2:-}
  fail=$((fail + 1))
  printf 'FAIL  %s\n' "$name"
  if [[ -n "$detail" ]]; then
    printf '      %s\n' "$detail"
  fi
}

# verdict NAME RC [DETAIL]: report a test whose result is a command status.
verdict() {
  local name=$1
  local rc=$2
  local detail=${3:-}
  if ((rc == 0)); then
    ok "$name"
  else
    bad "$name" "$detail"
  fi
}

# expect_eq NAME ACTUAL WANT
expect_eq() {
  local name=$1
  local actual=$2
  local want=$3
  if [[ "$actual" == "$want" ]]; then
    ok "$name"
  else
    bad "$name" "got '$actual', wanted '$want'"
  fi
}

# expect_contains NAME HAYSTACK NEEDLE
expect_contains() {
  local name=$1
  local haystack=$2
  local needle=$3
  if [[ "$haystack" == *"$needle"* ]]; then
    ok "$name"
  else
    bad "$name" "missing '$needle' in: $haystack"
  fi
}

# expect_rc NAME WANT_RC -- COMMAND...   (captures combined output in $out)
expect_rc() {
  local name=$1
  local want=$2
  shift 3
  local rc=0
  out=$("$@" 2>&1) || rc=$?
  if ((rc == want)); then
    ok "$name"
  else
    bad "$name" "exit $rc, wanted $want: $out"
  fi
}

# heads FILE: the markdown headings in FILE, '|'-joined.
heads() {
  local file=$1
  grep -E '^#' "$file" | tr '\n' '|'
}

# brief_heads PLAN ID: run task-brief.sh from the current directory with an
# explicit OUTFILE and print that brief's headings ('' when it failed).
brief_heads() {
  local plan=$1
  local id=$2
  local file="$B/brief-$id.md"
  rm -f "$file"
  if bash "$S/task-brief.sh" "$plan" "$id" "$file" > /dev/null 2>&1; then
    heads "$file"
  fi
}

# run_in DIR COMMAND...: run COMMAND from inside DIR, with git unable to walk up
# into a parent repository of the temp dirs (so "outside any repo" is real).
run_in() {
  local dir=$1
  shift
  (cd "$dir" && GIT_CEILING_DIRECTORIES="$CEIL" "$@")
}

# expect_dir NAME PATH: PATH is an existing directory.
expect_dir() {
  local name=$1
  local path=$2
  if [[ -d "$path" ]]; then
    ok "$name"
  else
    bad "$name" "not a directory: $path"
  fi
}

# expect_absent NAME PATH: nothing exists at PATH.
expect_absent() {
  local name=$1
  local path=$2
  if [[ -e "$path" ]]; then
    bad "$name" "unexpectedly exists: $path"
  else
    ok "$name"
  fi
}

# expect_ne NAME A B
expect_ne() {
  local name=$1
  local left=$2
  local right=$3
  if [[ "$left" != "$right" ]]; then
    ok "$name"
  else
    bad "$name" "both are '$left'"
  fi
}

# expect_match NAME VALUE GLOB: VALUE matches the glob pattern GLOB.
expect_match() {
  local name=$1
  local value=$2
  local pattern=$3
  # shellcheck disable=SC2254 # the pattern is meant to be a glob
  case $value in
    $pattern) ok "$name" ;;
    *) bad "$name" "'$value' does not match '$pattern'" ;;
  esac
}

T=$(mktemp -d) || exit 2
N=$(mktemp -d) || exit 2
E=$(mktemp -d) || exit 2
X=$(mktemp -d) || exit 2
B=$(mktemp -d) || exit 2
trap 'cd / && git -C "$T" worktree prune 2>/dev/null; rm -rf "$T" "$N" "$E" "$X" "$B"' EXIT

export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.invalid
export GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.invalid
# GIT_CEILING_DIRECTORIES stops git walking up into a parent repo of the temp
# dirs, so "outside any repo" really is outside one.
CEIL="$(dirname "$N")"

cd "$T" || exit 2
git init -q . || exit 2
git config core.autocrlf false
mkdir -p docs/alpha docs/beta docs/ids sub

printf '%s\n' '# Plan' '## Task 1: A' 'text a' '```' '### Task 2 fake' '```' \
  '## Task 2: B' 'text b' '### Task 5.1: C' 'text c' '## Task 5: D' 'text d' \
  '## Task 10: E' 'text e' > docs/alpha/plan.md
printf '%s\n' '## Task 1: B-plan' 'text' > docs/beta/plan.md
printf '%s\n' '# Plan' '## Task 6: six' 'text 6' '## Task 6b: six-b' 'text 6b' \
  '## Task 1: one' 'text 1' '## Task 1.1: one-one' 'text 1.1' \
  '### Task 7: seven' 'text 7' '#### Task 7a: seven-a' 'text 7a' \
  '### Task 8: eight' 'text 8' '## Task Overview' 'overview' \
  '## Task A1: a-one' 'text a1' > docs/ids/ids.md
printf '%s\n' '## Task 1: a' '```bash' 'echo hi' '## Task 2: b' 'text b' > docs/ids/fence.md
printf '%s\n' '## Task 1: a' 'text a' '```' > docs/ids/stray.md
printf '%s\n' '# Plan' '## Tarea 1: uno' 'texto' '## Tarea 2: dos' 'texto' > docs/ids/tarea.md
echo one > f
git add -A && git commit -qm one
BASE=$(git rev-parse HEAD)
echo two >> f
git commit -qam two
HEAD_SHA=$(git rev-parse HEAD)
# A commit on a diverged history: not a descendant of HEAD_SHA, but the range
# HEAD_SHA..SIDE is non-empty, so only the ancestor guard can reject it.
SIDE=$(git commit-tree -p "$BASE" -m side "$(git rev-parse "$BASE^{tree}")")
TOP=$(git rev-parse --show-toplevel)

# A repository with no commit yet.
git -C "$E" init -q . || exit 2
printf '## Task 1\n' > "$N/p.md"

echo "== syntax"
for s in sdd-repo.sh sdd-workspace.sh task-brief.sh review-package.sh; do
  bash -n "$S/$s"
  verdict "bash -n $s" $?
done

echo "== sdd-repo"
expect_eq "prints the current directory's toplevel" "$(bash "$S/sdd-repo.sh")" "$TOP"
expect_eq "prints the toplevel from a subdirectory" "$(cd sub && bash "$S/sdd-repo.sh")" "$TOP"
expect_eq "--with-commit prints the toplevel in a repo with commits" "$(bash "$S/sdd-repo.sh" --with-commit)" "$TOP"
expect_rc "outside any repo exits 2" 2 -- run_in "$N" bash "$S/sdd-repo.sh"
expect_contains "outside-repo message names the fix" "$out" "SDD scripts must run from inside the git working tree"
expect_contains "outside-repo message quotes git" "$out" "git said:"
expect_rc "no commit yet: plain call still prints the toplevel" 0 -- run_in "$E" bash "$S/sdd-repo.sh"
expect_rc "no commit yet: --with-commit exits 2" 2 -- run_in "$E" bash "$S/sdd-repo.sh" --with-commit
expect_contains "no-commit message names the fix" "$out" "with at least one commit"
expect_rc "usage error with an extra arg" 2 -- bash "$S/sdd-repo.sh" extra
expect_contains "usage names sdd-repo.sh" "$out" "usage: sdd-repo.sh [--with-commit]"
expect_rc "usage error with --with-commit and an extra arg" 2 -- bash "$S/sdd-repo.sh" --with-commit extra

echo "== sdd-workspace"
W=$(bash "$S/sdd-workspace.sh" docs/alpha/plan.md)
expect_dir "creates workspace" "$W"
expect_match "workspace path is under .agent-sync/sdd/<slug>" "$W" "*/.agent-sync/sdd/plan"
expect_eq "plan-path marker is repo-relative" "$(cat "$W/plan-path")" "docs/alpha/plan.md"
expect_eq "idempotent for the same plan" "$(bash "$S/sdd-workspace.sh" docs/alpha/plan.md)" "$W"
W2=$(bash "$S/sdd-workspace.sh" docs/beta/plan.md)
expect_ne "same basename, different plan gets a distinct workspace" "$W2" "$W"
expect_match "slug collision is disambiguated with the parent dir" "$W2" "*/.agent-sync/sdd/plan-beta"
expect_eq "colliding workspace marker names its own plan" "$(cat "$W2/plan-path")" "docs/beta/plan.md"
expect_eq "same workspace from a subdirectory" "$(cd sub && bash "$S/sdd-workspace.sh" ../docs/alpha/plan.md)" "$W"
expect_eq "absolute plan path from inside the repo" "$(bash "$S/sdd-workspace.sh" "$T/docs/alpha/plan.md")" "$W"

# The repository is the cwd's, never the plan's: a cwd outside any repo must
# stop even though the plan itself sits inside one.
expect_rc "cwd outside any repo exits 2 (plan inside a repo)" 2 -- \
  run_in "$N" bash "$S/sdd-workspace.sh" "$T/docs/alpha/plan.md"
expect_contains "cwd-outside message is sdd-repo's" "$out" "SDD scripts must run from inside the git working tree"
expect_rc "cwd outside any git repo exits 2 (plan outside too)" 2 -- \
  run_in "$N" bash "$S/sdd-workspace.sh" "$N/p.md"
expect_contains "non-repo message is sdd-repo's" "$out" "SDD scripts must run from inside the git working tree"
expect_absent "nothing is written outside a repo" "$N/.agent-sync"
expect_eq "-C DIR acts on DIR's repo from anywhere" \
  "$(cd "$N" && GIT_CEILING_DIRECTORIES="$CEIL" bash "$S/sdd-workspace.sh" -C "$T" docs/alpha/plan.md)" "$W"
expect_rc "bad -C directory exits 2" 2 -- bash "$S/sdd-workspace.sh" -C "$N/missing" docs/alpha/plan.md
expect_contains "bad -C message" "$out" "bad -C directory:"

# A linked worktree with an absolute path to the plan in the main checkout:
# the workspace belongs to the worktree, and the marker is absolute.
WT="$X/wt"
if git worktree add -q --detach "$WT" HEAD 2> /dev/null; then
  WW=$(cd "$WT" && bash "$S/sdd-workspace.sh" "$T/docs/alpha/plan.md")
  WT_TOP=$(cd "$WT" && git rev-parse --show-toplevel)
  expect_eq "worktree cwd + main-checkout plan: workspace is in the worktree" "$WW" "$WT_TOP/.agent-sync/sdd/plan"
  expect_eq "worktree marker is the plan's absolute path" "$(cat "$WW/plan-path")" "$(cd "$T" && pwd -P)/docs/alpha/plan.md"
else
  bad "git worktree add" "could not create a linked worktree"
fi

printf 'custom\n' > .agent-sync/sdd/.gitignore
bash "$S/sdd-workspace.sh" docs/alpha/plan.md > /dev/null
expect_eq ".gitignore is create-only" "$(cat .agent-sync/sdd/.gitignore)" "custom"
rm -f .agent-sync/sdd/.gitignore
bash "$S/sdd-workspace.sh" docs/alpha/plan.md > /dev/null
expect_eq ".gitignore is created when absent" "$(cat .agent-sync/sdd/.gitignore)" "*"

expect_rc "usage error without args" 2 -- bash "$S/sdd-workspace.sh"
expect_contains "usage names sdd-workspace.sh" "$out" "usage: sdd-workspace.sh [-C DIR] PLAN_FILE"
expect_rc "missing plan file" 2 -- bash "$S/sdd-workspace.sh" nope.md

echo "== task-brief"
bash "$S/task-brief.sh" docs/alpha/plan.md 1 > /dev/null
expect_eq "N=1 keeps a fenced fake heading, stops at Task 2" "$(heads "$W/task-1-brief.md")" "## Task 1: A|### Task 2 fake|"
bash "$S/task-brief.sh" docs/alpha/plan.md 2 > /dev/null
expect_eq "N=2 is only Task 2" "$(heads "$W/task-2-brief.md")" "## Task 2: B|"
bash "$S/task-brief.sh" docs/alpha/plan.md 5 > /dev/null
expect_eq "N=5 does not capture Task 5.1" "$(heads "$W/task-5-brief.md")" "## Task 5: D|"
bash "$S/task-brief.sh" docs/alpha/plan.md 5.1 > /dev/null
expect_eq "N=5.1 is only Task 5.1" "$(heads "$W/task-5.1-brief.md")" "### Task 5.1: C|"
bash "$S/task-brief.sh" docs/alpha/plan.md 10 > /dev/null
expect_eq "N=10 is not captured by N=1" "$(heads "$W/task-10-brief.md")" "## Task 10: E|"

# 7.0.2 hardening: letter/dot IDs compared as whole strings, sub-tasks, and
# headings without a digit that are not task boundaries.
expect_eq "N=6 does not capture Task 6b" "$(brief_heads docs/ids/ids.md 6)" "## Task 6: six|"
expect_eq "N=6b is only Task 6b" "$(brief_heads docs/ids/ids.md 6b)" "## Task 6b: six-b|"
expect_eq "N=1 does not capture Task 1.1" "$(brief_heads docs/ids/ids.md 1)" "## Task 1: one|"
expect_eq "N=1.1 is only Task 1.1" "$(brief_heads docs/ids/ids.md 1.1)" "## Task 1.1: one-one|"
expect_eq "deeper Task 7a stays inside the Task 7 brief" "$(brief_heads docs/ids/ids.md 7)" "### Task 7: seven|#### Task 7a: seven-a|"
expect_eq "N=7a is only Task 7a" "$(brief_heads docs/ids/ids.md 7a)" "#### Task 7a: seven-a|"
expect_eq "'## Task Overview' is not a boundary" "$(brief_heads docs/ids/ids.md 8)" "### Task 8: eight|## Task Overview|"
expect_eq "letter-first ID A1 is a task" "$(brief_heads docs/ids/ids.md A1)" "## Task A1: a-one|"
expect_rc "a regex-looking ID is not a regex" 3 -- bash "$S/task-brief.sh" docs/ids/ids.md '6.' "$B/dot.md"

rm -f "$B/fence1.md"
expect_rc "unclosed fence hiding a later Task while capturing exits 4" 4 -- \
  bash "$S/task-brief.sh" docs/ids/fence.md 1 "$B/fence1.md"
expect_contains "exit-4 message names the open fence" "$out" "the code fence opened at line 2 of docs/ids/fence.md never closes"
expect_absent "exit 4 removes the partial brief" "$B/fence1.md"
expect_rc "Task heading hidden by an unclosed fence is not found (exit 3)" 3 -- \
  bash "$S/task-brief.sh" docs/ids/fence.md 2 "$B/fence2.md"
expect_contains "hidden-heading message explains the fence" "$out" "so no Task heading after it can be seen"
expect_rc "stray trailing fence hiding no Task still briefs" 0 -- \
  bash "$S/task-brief.sh" docs/ids/stray.md 1 "$B/stray.md"
expect_contains "stray fence prints a warning" "$out" "it hides no Task heading, so this brief is complete"

expect_rc "translated headings: not found exits 3" 3 -- bash "$S/task-brief.sh" docs/ids/tarea.md 1 "$B/tarea.md"
expect_contains "not-found hint names the English word" "$out" 'Task headings must use the English word "Task"'
expect_contains "not-found hint lists task-shaped headings" "$out" "  ## Tarea 1: uno"
expect_contains "not-found hint lists every task-shaped heading" "$out" "  ## Tarea 2: dos"
expect_contains "then the plain not-found error" "$out" "task 1 not found in docs/ids/tarea.md (no heading matching 'Task 1')"

expect_rc "unknown task exits 3" 3 -- bash "$S/task-brief.sh" docs/alpha/plan.md 99
expect_rc "usage error with one arg" 2 -- bash "$S/task-brief.sh" docs/alpha/plan.md
expect_contains "usage names task-brief.sh" "$out" "usage: task-brief.sh [-C DIR] PLAN_FILE TASK_NUMBER [OUTFILE]"
expect_rc "missing plan file" 2 -- bash "$S/task-brief.sh" nope.md 1
rm -f "$W/task-2-brief.md"
expect_rc "-C DIR writes into DIR's workspace from anywhere" 0 -- \
  run_in "$N" bash "$S/task-brief.sh" -C "$T" docs/alpha/plan.md 2
expect_eq "-C brief content" "$(heads "$W/task-2-brief.md")" "## Task 2: B|"
expect_rc "task-brief from outside any repo exits 2" 2 -- \
  run_in "$N" bash "$S/task-brief.sh" "$T/docs/alpha/plan.md" 1

echo "== review-package"
expect_rc "valid range exits 0" 0 -- bash "$S/review-package.sh" docs/alpha/plan.md "$BASE" "$HEAD_SHA"
pkg=$(printf '%s' "$out" | sed -n 's/^wrote \(.*\): [0-9]* commit.*/\1/p')
if [[ -n "$pkg" && -f "$pkg" ]]; then
  ok "package file is written"
  expect_contains "package lists commits" "$(cat "$pkg")" "## Commits"
  expect_contains "package contains the diff" "$(cat "$pkg")" "## Diff"
  expect_match "package is in the plan workspace, named per range" "$pkg" "$W/review-*..*.diff"
else
  bad "package file is written" "$out"
fi
expect_rc "empty range exits 3" 3 -- bash "$S/review-package.sh" docs/alpha/plan.md "$HEAD_SHA" "$HEAD_SHA"
expect_rc "HEAD not a descendant of BASE exits 3" 3 -- bash "$S/review-package.sh" docs/alpha/plan.md "$HEAD_SHA" "$BASE"
expect_rc "diverged HEAD (non-empty range, not a descendant) exits 3" 3 -- bash "$S/review-package.sh" docs/alpha/plan.md "$HEAD_SHA" "$SIDE"
expect_contains "diverged message" "$out" "HEAD is not a descendant of BASE"
expect_rc "bad BASE exits 2" 2 -- bash "$S/review-package.sh" docs/alpha/plan.md nope "$HEAD_SHA"
expect_rc "bad HEAD exits 2" 2 -- bash "$S/review-package.sh" docs/alpha/plan.md "$BASE" nope
expect_rc "usage error" 2 -- bash "$S/review-package.sh" docs/alpha/plan.md
expect_contains "usage names review-package.sh" "$out" "usage: review-package.sh [-C DIR] PLAN_FILE BASE HEAD [OUTFILE]"
expect_rc "-C DIR packages DIR's repo from anywhere" 0 -- \
  run_in "$N" bash "$S/review-package.sh" -C "$T" docs/alpha/plan.md "$BASE" "$HEAD_SHA" "$B/pkg.diff"
expect_contains "-C package has the commits" "$(cat "$B/pkg.diff" 2> /dev/null)" "## Commits"
expect_rc "review-package from outside any repo exits 2" 2 -- \
  run_in "$N" bash "$S/review-package.sh" "$T/docs/alpha/plan.md" "$BASE" "$HEAD_SHA"
expect_contains "outside-repo review message is sdd-repo's" "$out" "SDD scripts must run from inside the git working tree"
printf '## Task 1\n' > "$E/p.md"
expect_rc "review-package in a repo with no commit exits 2" 2 -- \
  run_in "$E" bash "$S/review-package.sh" p.md HEAD HEAD

echo
echo "passed: $pass  failed: $fail"
((fail == 0))
