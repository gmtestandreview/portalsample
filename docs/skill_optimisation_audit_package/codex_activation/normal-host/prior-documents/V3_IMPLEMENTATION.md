# V3 repository implementation — 17 October 2026

Current follow-up: the [scanner-policy continuation](V3_POLICY_CONTINUATION.md)
verifies two complete natural Codex activation runs under a prepared exact-path
policy, one F04/F05 pressure sample, and 43 fresh local evidence-validator
tests. External specialist benchmark aggregation is N/A for this noncomparative
scope. Recommendation: **deploy**, scoped to the tested primary Codex
environment and its execution prerequisite; no installation occurred. The
completed [collection/Python repair](V3_COLLECTION_FIX.md) remains unchanged:
203 tests passed on Python 3.13.11 and 3.14.7.

## Scope and execution contract

Implement the evidence-backed gaps in F01–F19, preserving the historical audit.
Baseline: `191002463906329ba8fe7bdcfe2bbff15f77f891`; isolated branch:
`fix/skill-v3-closeout-20261017`. The user authorized review and implementation;
installation, publishing, hook repair, and merging skills are outside this task.

`writing-skills` owns methodology and the final evidence decision; the
duplication skill owns classification; `skill-creator` provides only available
specialist capabilities. The human skill owner decides release acceptance. No
new numeric quality target was requested. Historical 82/100 and 18/18 are not
current scores.

## Bounded plan

1. Inspect current controls and preserve candidate/oracle/rubric identity.
   Record all F01–F19 dispositions in a separate implementation matrix.
2. Add `skills/writing-skills/references/bounded-optimisation.md`, route it from
   the entrypoint/index and scoring/evaluation references. Keep operational
   detail conditional. Cover F01–F06 and F08–F19 without a second controller.
3. Add a read-only `skills-ref validate-evidence` preflight in
   `skills_ref/evidence.py` with CLI integration and behavioral tests in
   `tests/test_evidence.py`. Before implementing, run tests exposing the missing
   command. Check immutable hashes, raw proof, grading arithmetic, exact score
   comparison, runtime gate separation, and optional-dispatch budget/checkpoint
   rules. Do not build an agent runner.
4. Correct F07 reference/oracle drift. Archive the original oracle, keep
   original prompts, separate missing-evidence classification from merge holds,
   and test format-only subset, hub, missing evidence and confirmed handoff
   behavior.
5. Run scoped tests, Ruff, Pyright, skill validation, Markdown/link/diff checks,
   one focused GREEN, and one independent implementation review. Persist raw
   evidence before reporting. Update the checkpoint and final gate table.

## Stop and rollback

At most two evaluation waves (focused behavior then review), with delivery
reserved before any optional work. Stop at a complete change/disposition report;
do not chase a score. Unavailable natural host activation remains NHR/HOLD. The
clean baseline and worktree preserve rollback: discard only task changes or
restore named files from the baseline; never reset the user's working tree.

## Baseline evidence

- Scoped skills-ref tests: **111 passed**.
- Existing full suite: collection fails in `test_prompt.py` and
  `test_render_graphs.py` because `defusedxml.ElementTree.Element` is not a
  runtime attribute under Python 3.13.11. This unrelated pre-existing issue is
  excluded.
- Baseline CLI Pyright: **0 errors, 0 warnings**, worktree interpreter.
- Current target v1.2 already owns subset/hub/handoff semantics. Its reference
  and oracle contain three concrete inconsistencies recorded by independent
  review; those are the target changes, rather than a new classification engine.

Implementation and verification results are appended below before closeout.

## Implemented result

The review and repository changes are complete. All 19 recommendations have a
current disposition in [fix matrix](v3_implementation_controls.csv), with
[current controls](v3_implementation_control_status.csv) and
[18 regression dispositions](v3_implementation_tests.csv). F04/F05 retain
explicit controller judgment, now exercised by one focused pressure sample,
rather than claiming automated enforcement of evaluator usefulness. F16 now
passes for isolated primary Codex acceptance. The local preflight is enforced
when invoked; an automatic agent runner or provider-budget monitor was not
added.

Changes:

- Conditional bounded optimisation reference and entrypoint/index/scoring/eval
  routing: one controller, utility-based waves, closeout reserve, scoped
  loading, immutable evidence, provenance, independent gates and honest
  telemetry.
- Read-only `skills-ref validate-evidence` with `--dispatch`: current file
  hashes, required raw/checkpoint artifacts, exact case sets and counts, literal
  Boolean grades, exact Decimal thresholds, malformed-input handling and runtime
  holds.
- Target v1.3 reference/oracle corrections: format-only subset, known
  contradictions versus missing evidence, exhaustive missing-scope
  classification and eligible hub handoff. Both old oracle revisions remain
  archived.
- Preserved [review evidence](v3_review_evidence.md),
  [reviewer handbacks](v3_review_raw.md) and
  [focused behavior results](../../skills/skill-duplication-audit/evals/results/2026-10-17-v1.3-focused.md).

## Final acceptance gates

| Gate                                          | Result       | Evidence and limit                                                                                          |
| --------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Repository review and requested dispositions  | PASS         | All 19 fixes and 13 controls inspected against current sources                                              |
| Deterministic regression                      | PASS scoped  | 154 tests, including 43 new preflight cases                                                                 |
| Static analyzers                              | PASS scoped  | Ruff 0.16.7; Pyright 1.1.414, two source files, Python 3.13.11; editor equivalence unknown                  |
| Skill structure                               | PASS         | Both entrypoints validated by local skills-ref                                                              |
| Markdown and diff integrity                   | PASS scoped  | Changed Markdown lint and git diff checks                                                                   |
| Synthetic behavior                            | PASS scoped  | Eight unaffected cases plus fresh S3; one sample each, no statistical claim                                 |
| Natural discovery/loading/application/runtime | PASS scoped  | Two fresh complete Codex runs under exact-path scanner/read policy; see current continuation                |
| F04/F05 controller process decisions          | PASS scoped  | Five assertions in one independent pressure sample; no actual child dispatch or automatic enforcement claim |
| External specialist aggregation               | N/A          | No comparative arms, aggregated benchmark statistics or winner claim; local arithmetic remains required     |
| Full skills-ref suite                         | PASS         | Follow-up: 203 pass on Python 3.13.11 and 3.14.7; see collection repair evidence                            |
| Provider token efficiency                     | NOT VERIFIED | Counters unavailable; no measured savings claim                                                             |
| Final repository delivery                     | PASS         | Current artifacts, hashes, limitations and checkpoint saved                                                 |

Exact subprocess outputs are retained in
[verification record](v3_implementation_verification.json). Current artifact
identities and grades are in [preflight record](v3_implementation_run.json). The
frozen source/oracle comparison records remain separate; changed oracle identity
invalidated only S3, which was rerun without exposing expected answers.

No new numeric quality score was requested or assigned. The historical auditor
82/100 and GREEN 18/18 remain historical. TokenSave reported an estimated 726
tokens avoided in one retrieval; this tool estimate is not provider telemetry.

## Release and restart decision

Recommendation: **deploy**, scoped to the tested primary Codex
candidate/environment with the prepared scanner/read policy as an execution
prerequisite. Greg decides release acceptance. The original scanner blocker and
F04/F05 evidence gaps are resolved within that scope; external specialist
benchmark aggregation is inapplicable. Normal installed-client operation,
controller natural discovery and Claude Code were not tested or claimed.
Whole-session provider efficiency remains unverified and is not a required
acceptance gate. No install, publish, actual skill merge, hook change, commit or
push was performed.

The single restart point is
[continuation checkpoint](V3_CONTINUATION_CHECKPOINT.md). Resume only a named
remaining gate; do not repeat the completed optimisation.
