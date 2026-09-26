#!/usr/bin/env bash
#
# validate.sh — run this repository's real quality gates.
#
# The a-team playbooks say "validate after each phase" without naming commands,
# and the workflow README lists a set of commands that predates this snapshot's
# package.json. This script is the single place where gate names map to the
# scripts that actually exist.
#
# Usage:
#   a-team/scripts/validate.sh --list
#   a-team/scripts/validate.sh                       # dev gate set (default)
#   a-team/scripts/validate.sh --role qa
#   a-team/scripts/validate.sh --gate type-check --gate unit
#   a-team/scripts/validate.sh --role closure --fail-fast
#   a-team/scripts/validate.sh --role dev --dry-run
#
# Exit codes:
#   0  every requested gate passed
#   1  at least one gate failed
#   2  bad usage

. "$(cd "$(dirname "$0")" && pwd)/lib/common.sh"

# gate name -> npm script. Keep in sync with package.json.
gate_script() {
  case "$1" in
    type-check)      printf '%s\n' 'type-check' ;;
    lint)            printf '%s\n' 'lint' ;;
    lint-mdx)        printf '%s\n' 'lint:mdx' ;;
    unit)            printf '%s\n' 'test:unit' ;;
    storybook)       printf '%s\n' 'test:storybook' ;;
    regression)      printf '%s\n' 'test:quality:regression' ;;
    e2e)             printf '%s\n' 'test:e2e' ;;
    build)           printf '%s\n' 'build' ;;
    storybook-build) printf '%s\n' 'build-storybook' ;;
    ci)              printf '%s\n' 'test:ci' ;;
    migration)       printf '%s\n' 'migration-check' ;;
    *) return 1 ;;
  esac
}

# Some gates need a config or fixture that may not be present in a clean clone.
# Report those as unavailable with the reason, rather than as an opaque failure.
gate_requires() {
  case "$1" in
    regression) printf '%s\n' 'quality/vitest.regression.config.ts' ;;
    ci)         printf '%s\n' 'quality/vitest.regression.config.ts' ;;
    migration)  printf '%s\n' '' ;;
    *)          printf '%s\n' '' ;;
  esac
}

ALL_GATES='type-check lint lint-mdx unit storybook regression e2e build storybook-build ci migration'

# Role gate sets. Deliberately cheap for dev (fast inner loop), broader for QA,
# and the full closure gate for sprint sign-off.
role_gates() {
  case "$1" in
    dev)      printf '%s\n' 'type-check lint unit' ;;
    qa)       printf '%s\n' 'unit storybook' ;;
    producer) printf '%s\n' 'type-check' ;;
    closure)  printf '%s\n' 'type-check lint unit storybook storybook-build' ;;
    *) return 1 ;;
  esac
}

ROLE=''
GATES=()
FAIL_FAST=0
DRY_RUN=0

usage() { sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --gate) GATES+=("${2:-}"); shift 2 ;;
    --gate=*) GATES+=("${1#*=}"); shift ;;
    --role) ROLE="${2:-}"; shift 2 ;;
    --role=*) ROLE="${1#*=}"; shift ;;
    --fail-fast) FAIL_FAST=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --list)
      heading 'Gates'
      for g in $ALL_GATES; do printf '  %-16s npm run %s\n' "$g" "$(gate_script "$g")"; done
      heading 'Role gate sets'
      for r in dev qa producer closure; do printf '  %-16s %s\n' "$r" "$(role_gates "$r")"; done
      exit 0 ;;
    -h|--help) usage; exit 0 ;;
    *) err "unknown argument: $1"; usage >&2; exit 2 ;;
  esac
done

if [ "${#GATES[@]}" -eq 0 ]; then
  ROLE="${ROLE:-dev}"
  # role_gates runs in a subshell under $( ), so its failure must be checked
  # here rather than with `|| die` inside the substitution.
  if ! role_gate_list="$(role_gates "$ROLE")"; then
    die "unknown role: $ROLE (expected dev, qa, producer, or closure)"
  fi
  read -r -a GATES <<< "$role_gate_list"
elif [ -n "$ROLE" ]; then
  die '--role and --gate are mutually exclusive; pick one'
fi

for g in "${GATES[@]}"; do
  gate_script "$g" >/dev/null || { err "unknown gate: $g"; note "known gates: $ALL_GATES"; exit 2; }
done

require_cmd npm
if ! has_node_mods; then
  die 'node_modules/ missing — run `npm ci` first'
fi

heading "Validating: ${GATES[*]}"

PASSED=(); FAILED=(); UNAVAILABLE=()

for g in "${GATES[@]}"; do
  script="$(gate_script "$g")"
  needs="$(gate_requires "$g")"
  if [ -n "$needs" ] && [ ! -e "$REPO_ROOT/$needs" ]; then
    warn "gate $g unavailable — required file missing: $needs"
    UNAVAILABLE+=("$g")
    continue
  fi
  info "gate $g  ->  npm run $script"
  if [ "$DRY_RUN" -eq 1 ]; then
    note 'dry run, not executed'
    PASSED+=("$g")
    continue
  fi
  if (cd "$REPO_ROOT" && npm run --silent "$script"); then
    ok "$g"
    PASSED+=("$g")
  else
    err "$g"
    FAILED+=("$g")
    if [ "$FAIL_FAST" -eq 1 ]; then
      err 'stopping on first failure (--fail-fast)'
      break
    fi
  fi
done

heading 'Summary'
if [ "${#PASSED[@]}" -gt 0 ]; then
  ok "passed: ${PASSED[*]}"
fi
if [ "${#UNAVAILABLE[@]}" -gt 0 ]; then
  warn "unavailable: ${UNAVAILABLE[*]}"
  note 'These gates were requested but could not run. That is not a pass.'
fi
if [ "${#FAILED[@]}" -gt 0 ]; then
  err "failed: ${FAILED[*]}"
  note 'A failing gate is a real defect until proven otherwise. Do not skip or'
  note 'quarantine a test to get to green — fix the cause or file an issue.'
  exit 1
fi
if [ "${#UNAVAILABLE[@]}" -gt 0 ]; then
  err 'some requested gates could not run — treat this as unproven, not green'
  exit 1
fi

ok 'all requested gates passed'
