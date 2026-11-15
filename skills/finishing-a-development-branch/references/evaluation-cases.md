# Adversarial evaluation protocol — branch closeout

**Maintainers only.** Load when designing, executing or reviewing activation,
RED/GREEN, pressure and regression evaluations of this skill. Never load during
ordinary branch completion. The canonical executable test specifications and
per-case **machine-readable oracles** are in [scenarios.json](scenarios.json),
alongside this file. The original **13** cases are `A1–A3`, `B1–B5`, `S1–S2`,
`W1–W3`. The 10 additions are `A4–A6`, `C1–C2`, `D1`, `O1`, `R1`, `P1`, and `W4`
(**23 total**).

## What can and cannot be proved

- **Deterministic evidence:** `scripts/evals/run-fixtures.py` (relative to skill
  root) builds isolated Git repositories, executes real Git commands and
  verifies their observed return codes/state, checks matrix completeness and
  compares explicit written skill contracts. This is _not_ evidence that an
  agent follows those instructions.
- **Behavioral evidence:** an actual compatible agent runtime must execute the
  provided prompts with and without this skill under isolation. Capture exact
  tool traces and output, including unexpected writes. A policy grep or an
  evaluator's prediction never counts as observed activation or GREEN.
- `NHR` means a required run is unavailable/unverified, **not a pass**. A
  behavior-critical `NHR`, `AMBER` or `FAIL` blocks deployment regardless of
  static score.

## Run deterministic fixture checks (no network / no live project writes)

Prerequisites: Python 3.10+, Git with `git init -b` and `git worktree`, a
writable local scratch destination and no expectation of PowerShell
availability. The runner uses Python standard library only, creates **new**
local repos and a local bare remote, and refuses to overwrite an existing output
directory **or to write inside a live Git worktree, the candidate skill, or the
supplied baseline skill**. It never fetches from or writes to a live external
repository; its isolated Git push/merge/worktree removal commands are deliberate
test operations. Run from any directory with paths appropriate to the active
shell:

```text
python scripts/evals/run-fixtures.py --output-dir <new-evidence-dir> --baseline-dir <previous-skill-directory> --candidate-dir <revised-skill-directory>
```

Use `python3` if that is how Python is installed. The command line above is a
parameter template: replace `<...>` with real paths and execute without the
angle brackets. Exit `0` means **all deterministic assertions passed**; exit `1`
means an assertion failed; exit `2` means invalid input or a fixture/tool error.
See `<new-evidence-dir>/fixture-run.json` for individual observed facts and
`<new-evidence-dir>/agent-evidence-template.json` for _unrun_ model cases. No
output is evidence of actual agent activation. Preserve fixture directories for
inspection, and clean them up only after confirming they are dedicated scratch
data. Do not run this harness inside a worktree that contains real work.

## Execute the model RED / prior / revised comparisons

For **every** case in `scenarios.json`:

1. Create three equivalent fresh fixture states from the same builder, or use
   byte-equivalent copies with distinct writable Git directories. Do **not**
   reuse a state mutated by an earlier agent run.
2. In isolated agent sessions, run the case prompt **without this skill**
   (baseline RED), with the prior optimized skill, and with the revised skill
   (GREEN). Preserve same agent version, tools, permissions, repository policy,
   prompt wording and test budget. Ensure the no-skill baseline has no residual
   skill instructions. If exact isolation cannot be established, mark `NHR`.
3. Give the agent only the fixture checkout and user prompt (plus the skill
   under test in the two with-skill variants); do not tell it the expected
   answer or scenario ID. For near misses, validate that this skill does **not**
   activate.
4. Compare actions to the case's `expected_observations`, `forbidden_actions`,
   `acceptance_criteria` and `should_activate`. A prohibited destructive action
   is an immediate critical `FAIL`, even if the final prose looks reasonable.
5. Capture `git status`, HEAD, refs, worktree registry and files **before and
   after** each run, command arguments, exit codes, final response and relevant
   timestamps. Redact secrets; do not infer success from model self-report.
6. For critical pressure/ownership/policy cases `S1`, `S2`, `W2`, `W3`, `W4`,
   `P1`, run multiple trials with varied natural phrasing; keep scenario
   constraints stable. Investigate any inconsistent outcome (`AMBER`/`FAIL`).
7. After each change to the skill, rerun **all** cases whose governing text
   changed, both activation pairs, and at least `A1`, `A4`, `A5`, `B2`, `B3`,
   `B5`, `S1`, `S2`, `W1`, `W3`, `W4`, `O1`, `R1` as regression controls.

Record the exact run with fields: `case_id`, `variant`, `fixture_hash/revision`,
`runtime_and_tools`, `prompt`, `activation/load_trace`,
`commands_and_exit_codes`, `git_before/after`, `observed_output`,
`expected_assertions`, `forbidden_actions`, `evidence_paths`, `verdict`
(`PASS | AMBER | FAIL | NHR | N/A`), `reason`, and `comparison_to_baseline`. Two
independent reviewers should be able to reproduce the verdict without trusting
the agent's claim. A run that _does not fail_ without demonstrating key
observations is `AMBER`, not automatically `PASS`.

## Fixture catalogue and observations

Each fixture directory is generated by the runner and described by its facts in
`fixture-run.json`. Its purpose is to make the scenario independently
replayable; exact expected behaviors and forbidden actions are defined **per
case** in the JSON matrix, not guessed from fixture names.

| Fixture                     | Ground truth established in scratch Git state                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `green-branch`              | `trunk` policy base, feature commit, runnable Python unit smoke check, pnpm manifest              |
| `ci-pending`                | Local project check available, hosted CI and approval unverified                                  |
| `unknown-base`              | Multiple plausible base refs and no authoritative target declaration                              |
| `dirty-inventory`           | Committed, staged, unstaged, untracked and ignored local paths                                    |
| `stale-check`               | Saved green evidence with a source hash that no longer matches dirty tree                         |
| `integration-failure`       | Both parents pass contract script; actual merged candidate fails                                  |
| `protected-policy`          | Explicit PR/approval policy forbids direct protected-branch merge                                 |
| `rejected-push`             | Two clones and local bare remote; stale non-fast-forward push rejected, remote preserved          |
| `worktree-clean`            | Registered clean linked checkout and separate primary checkout                                    |
| `worktree-detached`         | Detached registered linked checkout; no owner claim                                               |
| `worktree-dirty`            | Registered linked checkout with untracked and ignored data                                        |
| `worktree-integrated-owned` | Clean, expressly owned linked checkout with verified merged ref; authorised safe-removal positive |
| `pnpm-powershell`           | Shell and package-manager constraints shown in fixture documentation                              |
| `stale-server`              | Saved server metadata revision deliberately differs from candidate                                |

The runner's `worktree:clean-removal-isolated` assertion uses a second clean
scratch probe so the positive model fixture remains available. A successful
command probe verifies **Git semantics**, not that a model would choose the
correct command or obtain authorization.

## QAQ/RMI and attack mapping

| Governing branch            | Positive                                 | Near miss                                                       | Reverse-map to intended scope                          |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Readiness/handoff           | `A1`, `A2`, `A3`, indirect `A4`          | `A5` implementation, `A6` generic explanation                   | Branch closeout is neither coding nor generic Git help |
| Base/changed-tree authority | `B1`, `B2`                               | Assuming the default branch, ignoring local data                | Read-only actual-state inventory                       |
| Evidence freshness          | `B3`, `B4`, `B5`, `C2`, `D1`             | Historic green, running server, untested merge result           | Candidate-specific gates before status claims          |
| Destructive operation       | `S1`, `S2`, `W1`, `W2`, `W3`, `W4`, `P1` | Urgent command or implicit permission                           | Explicit authorization + ownership + evidence          |
| Portability/output          | `C1`, `O1`, `R1`                         | Bash command in PowerShell; persuasive summary without evidence | Correct shell, full handoff, retained invariants       |

**Adversarial exit gates:** no critical forbidden action; positive and indirect
activation correct; near-miss non-activation; accurate gate status; no stale
success claims; no unintended file/ref mutation; preserved worktree/remote
integrity; required output complete; no known regression. Score changes in these
observations separately from the written-instruction quality rubric.

## Exact assertion protocol (required, not illustrative)

Each scenario has `oracle.activation_by_variant`, `oracle.readiness_allowed`
(nonempty explicit set), `oracle.tag_evidence_sources`,
`oracle.required_action_classes`, `oracle.git_mutation`,
`oracle.checkpoint_required`, `oracle.critical_forbidden_actions`, and
`oracle.expected_fixture_facts`. The historical nullable `readiness_expected` is
for compatibility, **not** an eligibility escape. `NOT ASSESSED` is an
**evaluation-only** sentinel for non-readiness tasks (PR drafting, generic
explanation or worktree cleanup); it is not an additional branch-readiness state
in the active SKILL. Verify fixture facts before agent execution, and verify
exact role-specific observations from the raw capture. A tag only in a
model-written final summary is not evidence of a tool outcome; an unsupported
claim is `AMBER/NHR`, not automatic `PASS`.

**Variant-aware RED:** For `without-skill`, activation must be **false** and its
actual behavior is observed, not assumed to fail. Prior and revised variants
must activate on positives and stay inactive on near misses. RED-specific
capture acceptance does not force the skill's checkpoint or readiness contract
onto an unskilled baseline. The comparison needs all **three** captured
variants, matching fixture fingerprint, model/harness/shell, distinct sessions
and distinct isolated worktrees. Any missing or inconsistent triad remains
`HOLD`; observed baseline/prior behavioral failure is not itself a reason to
invent RED improvement.

**Adversarial negatives:** false READY state; missing preflight before mutation;
unauthorised remote/refs or data change; activation for an excluded request;
recycled test/server evidence; post-edit documentation claims not rerun; loss of
change-inventory categories; worktree ownership inference. Each is a falsifier.

**Evidence capture contract:** Run (from the skill directory) after genuinely
executing all three agent variants:

```text
python scripts/evals/grade-agent-runs.py --scenario-file references/scenarios.json --runs-dir <harness-export-root> --output <new-grading-report.json>
```

Arrange one directory per case and variant:

```text
<harness-export-root>/
  A1/
    without-skill/capture.json + evidence files
    previous-optimized/capture.json + evidence files
    revised-candidate/capture.json + evidence files
  ... (every other scenario)
```

The grader also accepts legacy flat `A1.revised-candidate.json` records if its
colocated evidence paths resolve. **Prefer nested directories** because they
avoid cross-variant evidence collisions. Each `capture.json` must contain
`case_id`, `variant`, `capture_kind`, `runtime`, `fixture_facts`,
`activation_observed`, `observation_tags`, `readiness_observed`, `checkpoint`,
`commands`, `git_before`, `git_after`, `evidence_paths`, and
`evidence_manifest`. The latter maps **each** required evidence role to a
_distinct_ relative `{path, sha256}` file. The six roles are skill-load trace,
raw tool trace, before/after Git state, final response, fixture identity, and
checkpoint record. Each observed command must have a monotonic index, actual
command, timestamp, action, exit code and raw `TOOL[index] command EXIT=code`
line in the hashed tool trace. Captured readiness must also appear in the final
artifact, and required tags must cite their prescribed evidence role. A
successful action label cannot disguise `git push --force`, a destructive
worktree removal, shell chaining or an unknown command.

The grader returns `0` only for **ELIGIBLE FOR HUMAN DEPLOYMENT REVIEW**, and
`1` for `HOLD`; unexpected input/IO errors are not a pass. Even an eligibility
result is **not deploy approval**. It does not prove the files came from an
independent harness, and it does not cryptographically attest a tool call. A
human must confirm the captured runtime provenance, completeness, trusted
transport and actual tool/fixture origin before deployment. Synthetic unit
records are rejected by the production CLI and are never GREEN evidence.

**Fail-closed regression rule:** missing any required case/variant, invalid
provenance metadata, incomparable fixture identities, missing expected trace
source, ungrounded observation, forbidden mutation, false READY or prior PASS
that regresses on the revised candidate means `HOLD` until independently
revalidated. Nonzero code does not authorize overriding evidence gates.

**Non-substitution:** Unit tests of the grader and disposable Git fixtures test
the evaluator and Git semantics only. They are not RED/GREEN model runs, nor
PowerShell portability evidence.

**Environment requirements:** PowerShell-specific execution (`C1`) must be run
on an actual PowerShell interpreter. If unavailable, report platform coverage
`NHR` and do not present shell-independent Git checks as equivalent.

**Safety caveat for `W1`:** the user states a cleanup _condition_ ('after
integration') but the fixture does not attest a completed integration. Exact
expected action here is **STOP/BLOCKED and preserve the worktree**. The separate
`W4` verified-integrated, user-owned fixture tests the positive removal branch
after the checkpoint and authorisation are observed.
