# Regression Evaluations

Run these after every substantive behavioral fix. Passing the newly fixed case alone is not sufficient.

Use the shared record format in `../evaluation-schema.md`.

## REG-001 — Failed-case rerun after smallest-defect fix

**Applies to:** every REFACTOR prompted by a behavioral failure.

**Objective:** prove that the specific observed defect is corrected by the smallest justified change.

**Setup parameters**

- `{failed_case_id}` — prior case that produced FAIL or blocking AMBER.
- `{observed_defect}` — exact error, rationalization, trigger miss, boundary defect, or precedence problem.
- `{fix}` — smallest instruction/trigger/branch/boundary change made.

**Procedure**

Rerun `{failed_case_id}` under conditions materially identical to the original failure.

**Blocking success criteria**

- the original defect no longer occurs;
- the evidence demonstrates the effect of `{fix}` rather than an easier scenario;
- no unrelated wording change is credited as the fix without evidence;
- the case reaches PASS before the defect is considered closed.

If the result remains AMBER or FAIL, continue REFACTOR; do not declare the defect resolved.

---

## REG-002 — Positive and near-miss boundary preservation

**Applies to:** any fix touching the description, trigger, scope, branch selection, or load conditions.

**Objective:** detect a common regression where fixing a false negative creates false positives, or fixing a false positive creates new false negatives.

**Setup parameters**

- `{positive_cases}` — previously passing direct/indirect/in-scope activation cases.
- `{near_miss_cases}` — previously passing adjacent/out-of-scope cases.

**Procedure**

Rerun all materially relevant `{positive_cases}` and `{near_miss_cases}` after the change.

**Blocking success criteria**

- previous positives still activate and execute correctly;
- previous near-misses still remain outside scope;
- the fix does not broaden activation merely to make the failed case pass;
- no new material false negative is introduced.

**FAIL condition**

Any required previously passing boundary case that regresses is FAIL even when the originally failed case now passes.

---

## REG-003 — Prior-fix, resource-load, and behavior preservation

**Applies to:** mature skills with previous corrections, supporting resources, or multiple branches.

**Objective:** prove that the latest change does not reintroduce old defects or alter unrelated load/execution behavior.

**Setup parameters**

- `{prior_fixed_cases}` — previously closed failures/rationalizations.
- `{resource_load_cases}` — cases that establish when supporting files should and should not load.
- `{unrelated_branch_cases}` — stable behavior outside the changed branch.

**Procedure**

Rerun the subset materially at risk from the new change.

**Blocking success criteria**

- prior fixed cases remain PASS;
- supporting resources load only when their documented conditions apply;
- unrelated branches preserve expected behavior;
- no new safety, authorization, or completion-integrity failure appears;
- context growth or new always-loaded material is justified by execution value.

**Outcome guidance**

A new non-blocking inconsistency may be AMBER, but any regression of a required prior fix or safety boundary is FAIL.
