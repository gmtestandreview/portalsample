#!/usr/bin/env bash
# Persisted tests for scripts/task-brief, scripts/sdd-workspace and
# scripts/review-package. Self-contained: builds a throwaway git repo under
# mktemp, never touches the real working tree, removes everything on exit.
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

T=$(mktemp -d) || exit 2
N=$(mktemp -d) || exit 2
trap 'rm -rf "$T" "$N"' EXIT

export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.invalid
export GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.invalid

cd "$T" || exit 2
git init -q . || exit 2
git config core.autocrlf false
mkdir -p docs/alpha docs/beta sub

printf '%s\n' '# Plan' '## Task 1: A' 'text a' '```' '### Task 2 fake' '```' \
  '## Task 2: B' 'text b' '### Task 5.1: C' 'text c' '## Task 5: D' 'text d' \
  '## Task 10: E' 'text e' > docs/alpha/plan.md
printf '%s\n' '## Task 1: B-plan' 'text' > docs/beta/plan.md
echo one > f
git add -A && git commit -qm one
BASE=$(git rev-parse HEAD)
echo two >> f
git commit -qam two
HEAD_SHA=$(git rev-parse HEAD)
# A commit on a diverged history: not a descendant of HEAD_SHA, but the range
# HEAD_SHA..SIDE is non-empty, so only the ancestor guard can reject it.
SIDE=$(git commit-tree -p "$BASE" -m side "$(git rev-parse "$BASE^{tree}")")

echo "== syntax"
for s in sdd-workspace task-brief review-package; do
  bash -n "$S/$s"
  verdict "bash -n $s" $?
done

echo "== sdd-workspace"
W=$(bash "$S/sdd-workspace" docs/alpha/plan.md)
[[ -d "$W" ]]
verdict "creates workspace" $? "$W"
[[ "$W" == */.agent-sync/sdd/plan ]]
verdict "workspace path is under .agent-sync/sdd/<slug>" $? "$W"
expect_eq "plan-path marker is repo-relative" "$(cat "$W/plan-path")" "docs/alpha/plan.md"
expect_eq "idempotent for the same plan" "$(bash "$S/sdd-workspace" docs/alpha/plan.md)" "$W"
W2=$(bash "$S/sdd-workspace" docs/beta/plan.md)
[[ "$W2" != "$W" ]]
verdict "same basename, different plan gets a distinct workspace" $? "$W2"
expect_eq "same workspace from a subdirectory" "$(cd sub && bash "$S/sdd-workspace" ../docs/alpha/plan.md)" "$W"
expect_eq "root comes from the plan, not the cwd" "$(cd "$N" && bash "$S/sdd-workspace" "$T/docs/alpha/plan.md")" "$W"

printf 'custom\n' > .agent-sync/sdd/.gitignore
bash "$S/sdd-workspace" docs/alpha/plan.md > /dev/null
expect_eq ".gitignore is create-only" "$(cat .agent-sync/sdd/.gitignore)" "custom"
rm -f .agent-sync/sdd/.gitignore
bash "$S/sdd-workspace" docs/alpha/plan.md > /dev/null
expect_eq ".gitignore is created when absent" "$(cat .agent-sync/sdd/.gitignore)" "*"

expect_rc "usage error without args" 2 -- bash "$S/sdd-workspace"
expect_rc "missing plan file" 2 -- bash "$S/sdd-workspace" nope.md
printf '## Task 1\n' > "$N/p.md"
# GIT_CEILING_DIRECTORIES stops git walking up into a parent repo of the temp dir.
expect_rc "plan outside any git repo exits 2" 2 -- \
  env GIT_CEILING_DIRECTORIES="$(dirname "$N")" bash "$S/sdd-workspace" "$N/p.md"
expect_contains "non-repo message names the problem" "$out" "not inside a git repository"

echo "== task-brief"
bash "$S/task-brief" docs/alpha/plan.md 1 > /dev/null
expect_eq "N=1 keeps a fenced fake heading, stops at Task 2" "$(heads "$W/task-1-brief.md")" "## Task 1: A|### Task 2 fake|"
bash "$S/task-brief" docs/alpha/plan.md 2 > /dev/null
expect_eq "N=2 is only Task 2" "$(heads "$W/task-2-brief.md")" "## Task 2: B|"
bash "$S/task-brief" docs/alpha/plan.md 5 > /dev/null
expect_eq "N=5 does not capture Task 5.1" "$(heads "$W/task-5-brief.md")" "## Task 5: D|"
bash "$S/task-brief" docs/alpha/plan.md 5.1 > /dev/null
expect_eq "N=5.1 is only Task 5.1" "$(heads "$W/task-5.1-brief.md")" "### Task 5.1: C|"
bash "$S/task-brief" docs/alpha/plan.md 10 > /dev/null
expect_eq "N=10 is not captured by N=1" "$(heads "$W/task-10-brief.md")" "## Task 10: E|"
expect_rc "unknown task exits 3" 3 -- bash "$S/task-brief" docs/alpha/plan.md 99
expect_rc "usage error with one arg" 2 -- bash "$S/task-brief" docs/alpha/plan.md
expect_rc "missing plan file" 2 -- bash "$S/task-brief" nope.md 1

echo "== review-package"
expect_rc "valid range exits 0" 0 -- bash "$S/review-package" docs/alpha/plan.md "$BASE" "$HEAD_SHA"
pkg=$(printf '%s' "$out" | sed -n 's/^wrote \(.*\): [0-9]* commit.*/\1/p')
if [[ -n "$pkg" && -f "$pkg" ]]; then
  ok "package file is written"
  expect_contains "package lists commits" "$(cat "$pkg")" "## Commits"
  expect_contains "package contains the diff" "$(cat "$pkg")" "## Diff"
else
  bad "package file is written" "$out"
fi
expect_rc "empty range exits 3" 3 -- bash "$S/review-package" docs/alpha/plan.md "$HEAD_SHA" "$HEAD_SHA"
expect_rc "HEAD not a descendant of BASE exits 3" 3 -- bash "$S/review-package" docs/alpha/plan.md "$HEAD_SHA" "$BASE"
expect_rc "diverged HEAD (non-empty range, not a descendant) exits 3" 3 -- bash "$S/review-package" docs/alpha/plan.md "$HEAD_SHA" "$SIDE"
expect_rc "bad BASE exits 2" 2 -- bash "$S/review-package" docs/alpha/plan.md nope "$HEAD_SHA"
expect_rc "bad HEAD exits 2" 2 -- bash "$S/review-package" docs/alpha/plan.md "$BASE" nope
expect_rc "usage error" 2 -- bash "$S/review-package" docs/alpha/plan.md

echo
echo "passed: $pass  failed: $fail"
((fail == 0))
