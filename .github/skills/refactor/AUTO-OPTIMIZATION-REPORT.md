# Refactor Skill Auto-Optimization Report

## Outcome

- Baseline: uploaded `SKILL(20261114-060202).md`.
- Optimized artifact: complete `refactor/` skill directory.
- Classification: **Technique**.
- Iterations used: **1 of 3**.
- Baseline score: **64/100** (raw 52/81; N/A: Related-skill consistency,
  Tool/script/reference/asset handling, Merge quality).
- Iteration 1 score: **97/100** (raw 85/88; N/A: Related-skill consistency,
  Merge quality).
- Numeric target: **met** (>96).
- Deployment status: **BLOCKED** by required behavioral evidence that remains
  `NHR`.
- Final recommendation: **hold**.

## Baseline findings

The baseline was structurally coherent but context-heavy (653 lines) and mixed
the core procedure with long generic examples. The description covered
refactoring broadly but did not sharply exclude feature work, bug-fix behavior
changes, rewrites, and migrations. The workflow required tests absolutely
without a characterization fallback, used generic thresholds such as “functions
< 50 lines,” and did not explicitly cover behavior-sensitive traps such as async
ordering, mutation/identity, serialization, or exception timing.

## Iteration 1 changes

- Rewrote the frontmatter description as a bounded activation contract.
- Made behavior preservation the explicit invariant and separated behavior
  changes from refactoring.
- Added inputs/preconditions, characterization-test fallback, reversible
  checkpoints, stop rules, fresh final validation, and evidence-aware completion
  reporting.
- Replaced generic hard thresholds with project conventions and observable
  contracts.
- Added explicit high-risk behavior-preservation checks for evaluation order,
  mutation/identity, concurrency, transactions, exceptions, serialization,
  framework conventions, numeric/nullability semantics, and contractual
  performance.
- Moved the long smell/pattern material into `references/refactoring-catalog.md`
  with a direct conditional load rule.
- Preserved the baseline's distinctive smell/transformation coverage while
  removing verbose code examples.
- Added `evals/evals.json` with direct, indirect, near-miss, no-tests, and
  pressure cases. These are test definitions, not executed behavioral evidence.

## Final rubric

| Criterion                            | Weight | Earned | Evidence                                                                                                                             |
| ------------------------------------ | -----: | -----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Specification compliance             |     10 |     10 | Static checks pass in deployment-shaped `refactor/` directory.                                                                       |
| Activation description               |      8 |      7 | Direct and bounded; actual activation execution is NHR.                                                                              |
| Scope control                        |      8 |      8 | Behavior-preserving structural work is explicit; feature/bug-fix/rewrite/migration boundaries are explicit.                          |
| Completeness                         |      8 |      8 | Preconditions, invariant, workflow, failure/stop paths, verification, and completion output are present.                             |
| Procedural clarity                   |      8 |      8 | Ordered invariant → transformation → reversible steps → risk checks → final validation workflow.                                     |
| Related-skill consistency            |      6 |    N/A | No neighboring skill/library contract was supplied or required.                                                                      |
| Agent usability                      |      8 |      8 | Inputs, decisions, fallbacks, stop conditions, and output expectations are explicit.                                                 |
| Context efficiency                   |      7 |      7 | Main body is 128 lines; long examples moved to a conditional reference.                                                              |
| Tool/script/reference/asset handling |      7 |      7 | Reference resolves and has a load condition; eval JSON parses and matches skill name.                                                |
| Safety/destructive controls          |      8 |      8 | Reversible checkpoint, narrow changes, diff inspection, rollback/reassess behavior, and no unsupported success claims.               |
| Edge cases/gotchas                   |      6 |      6 | Covers missing tests, unclear contracts, async/state/serialization/error/performance traps, scope drift, and unavailable validation. |
| Merge quality                        |      6 |    N/A | No merge performed.                                                                                                                  |
| Testability/validation readiness     |      6 |      4 | Falsifiable eval cases exist; required behavioral runs/regressions remain NHR.                                                       |
| Maintainability                      |      4 |      4 | Durable terminology, one focused reference, no hard-coded tooling or generic numeric thresholds.                                     |

Raw applicable score: **85/88**. Normalized score: **97/100**.

## Checks actually run after the edit

Static validation: **18/18 PASS**.

- YAML/frontmatter parses and uses supported fields.
- `name`/`description` satisfy static constraints.
- Parent directory `refactor` matches `name: refactor`.
- Description length: 344 characters.
- Main body: 128 lines; rough size ≈ 1248 tokens.
- Local Markdown reference resolves and has an explicit conditional load rule.
- Eval JSON exists, parses, matches the skill name, and uses unique case IDs.
- Preservation scan found all 17 baseline concept families in the optimized
  main/reference content.

These checks do **not** demonstrate runtime behavior preservation or skill
activation.

## QAQ/RMI

### Activation boundary

- Positive: “Refactor this 180-line function into smaller units without changing
  its API or behavior.”
- Near-miss: “Add OAuth login and redesign the authentication flow.”
- Governing instruction: frontmatter description + `Scope`.
- Static mapping: direct and scope-consistent.
- Behavioral activation outcome: **NHR**.

### No-tests branch

- Positive: “Clean up this legacy parser; there are no tests.”
- Near-miss: “Fix the parser so invalid input is accepted.”
- Governing instruction: `Inputs and Preconditions` step 3 and `Scope`.
- Static mapping: refactoring uses characterization evidence; intended behavior
  change is outside the refactor invariant.
- Behavioral outcome: **NHR**.

### Mixed-change pressure branch

- Positive: “Refactor this and also change error messages/retry timing; skip
  tests.”
- Near-miss: “Rename these private helpers with behavior unchanged.”
- Governing instruction: `Scope`, `Refactor in reversible steps`, and
  `Finish with fresh validation`.
- Static mapping: behavior changes must be separated; unsupported preservation
  claims are prohibited.
- Pressure outcome: **NHR**.

## Blockers

The final checklist requires representative positive/near-miss activation
evidence, with-skill behavior, applicable edge/pressure evidence, and
regressions after the final behavior-relevant edit. Those runs were not
available here, so the required behavioral outcomes remain **NHR**. Numeric
score cannot override that blocker.

No further text-only iteration is justified: the score target is already met,
and the remaining blocker requires behavioral execution evidence rather than
additional wording changes.

## Final recommendation

**hold**
