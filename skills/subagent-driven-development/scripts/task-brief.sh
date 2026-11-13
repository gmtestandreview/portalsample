#!/usr/bin/env bash
# Extract one task's full text from an implementation plan into a file the
# implementer reads in one call, so the task text never has to be pasted
# through the controller's context.
#
# Usage: task-brief.sh PLAN_FILE TASK_NUMBER [OUTFILE]
# Default OUTFILE: <repo-root>/.agent-sync/sdd/<plan-basename>/task-<N>-brief.md
# (per plan and per worktree; concurrent runs of the SAME plan in the same
# working tree share it).
set -euo pipefail

if [[ $# -lt 2 ]] || [[ $# -gt 3 ]]; then
  echo "usage: task-brief.sh PLAN_FILE TASK_NUMBER [OUTFILE]" >&2
  exit 2
fi

plan=$1
n=$2
[[ -f "$plan" ]] || { echo "no such plan file: $plan" >&2; exit 2; }

if [[ $# -eq 3 ]]; then
  out=$3
else
  # Invoke via bash rather than direct exec: some extractors strip Unix exec
  # bits when unpacking packages.
  dir=$("${BASH:-bash}" "$(cd "$(dirname "$0")" && pwd)/sdd-workspace.sh" "$plan")
  out="$dir/task-${n}-brief.md"
fi

# Compare the heading's whole task number token (digits with optional dotted
# parts, e.g. 5 or 5.1) to N exactly, so N=5 never captures a "Task 5.1"
# section and N=1 never captures "Task 10".
awk -v n="$n" '
  /^```/ { infence = !infence }
  !infence && /^#+[ \t]+Task[ \t]+[0-9]+/ {
    tok = $0
    sub(/^#+[ \t]+Task[ \t]+/, "", tok)
    match(tok, /^[0-9]+(\.[0-9]+)*/)
    tok = substr(tok, 1, RLENGTH)
    intask = (tok == n)
  }
  intask { print }
' "$plan" > "$out"

if [[ ! -s "$out" ]]; then
  echo "task ${n} not found in ${plan} (no heading matching 'Task ${n}')" >&2
  exit 3
fi

echo "wrote ${out}: $(wc -l < "$out" | tr -d ' ') lines"
