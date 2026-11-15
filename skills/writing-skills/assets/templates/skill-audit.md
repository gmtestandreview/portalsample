# Skill Audit: [Skill Name]

> Template only: placeholders do not constitute verified findings. Use the
> user-supplied rubric when applicable; use `references/audit-scoring.md` only
> for the default skill-wide methodology.

## Scope, authority and baseline

- Artifact completeness: [complete directory / complete SKILL.md / excerpt /
  unknown]
- Baseline revision and SHA-256: [value or NHR]
- Reviewer, assessment date and intended environment: [values]
- Applicable rubric and numeric threshold: [source and literal comparison]
- Examined file count / excluded generated files: [counts]

## Verdict

- Design quality: [score]/100 — [reason]
- Required readiness gates: [PASS / AMBER / FAIL / NHR / N/A, each evidenced]
- Final recommendation: [deploy / revise / split / merge / deprecate / hold]

## Top findings and preservation requirements

| Severity | ID / source path:line | Finding / counterexample       | Preservation constraint | Fix / disposition |
| -------- | --------------------- | ------------------------------ | ----------------------- | ----------------- |
| [level]  | [ID and evidence]     | [observable defect and attack] | [unchanged invariant]   | [action]          |

## Rubric breakdown — before and after

| Criterion / maximum  |  Before |   After | Evidence and deduction |
| -------------------- | ------: | ------: | ---------------------- |
| [criterion / points] | [score] | [score] | [source and test]      |

For atomic reviews, attach one row **per first-party file** with its role,
criterion scores, finding, counterexample, evidence, and baseline/final total.
Report the minimum individual score; the mean does not override a low file.

## Checks performed

| Command or scenario | Target / revision | Expected result | Observed status       | Evidence  |
| ------------------- | ----------------- | --------------- | --------------------- | --------- |
| [exact command]     | [file/hash]       | [predeclared]   | [PASS/AMBER/FAIL/NHR] | [raw log] |

## Unexecuted tests and release blockers

- [ ] Specification and frontmatter
- [ ] Resource links and script/assets paths
- [ ] Direct/indirect positive and near-miss activation
- [ ] Invalid/edge/pressure and behavioral RED/GREEN comparisons
- [ ] Regressions after the latest revision
- [ ] Authorization, backup/rollback for high-impact operations

Unrun work is `NHR`, not PASS. State what evidence would resolve each blocker.

## Delivery

- Candidate artifact(s): [verified location]
- Changed files, hashes and rollback baseline: [paths]
- Remaining blockers and decision owner: [items]
