# Audit Scoring for Agent Skills

Use this reference when assigning a numeric quality score, severity, QAQ/RMI result, or final audit verdict to a `SKILL.md` or skill directory.

This file defines **how to score**. Use `best-practices-evaluations.md` for **what good looks like**, the current Agent Skills specification for mandatory compliance, and `SKILL-testing-checklist.md` for final validation.

Do not let a numeric score override a mandatory specification failure, unresolved high-impact safety issue, missing authorization, or required human review.

## 1. Authority and evidence

Apply this precedence when sources conflict:

`safety/trust/permissions > mandatory current spec > explicit user requirements > applicable skill/project/domain requirements > current audit policy > best-practice defaults > examples/legacy material`

Treat legacy Doctor rubrics or score bands as historical evidence only when they conflict with the current rubric below.

Score only from evidence that is actually available.

Evidence states: **Verified** = directly confirmed by inspection/validation/execution; **Supported** = directly supported by the artifact but not behaviorally executed; **Unverified / Needs Human Review** = missing or inaccessible evidence/tooling/judgment; **Failed** = evidence contradicts an applicable requirement or criterion.

Never convert `Unverified` into a pass.

## 2. Classify artifact completeness before scoring

Classify the supplied artifact as exactly one of:

1. **Complete skill directory**
2. **Complete `SKILL.md`**
3. **Body/frontmatter excerpt**
4. **Unknown**

Rules: score a complete directory from its supplied resources; do not assume unprovided files for a complete `SKILL.md`; score excerpts only where evidence exists; for unknown completeness, do not deduct for unproven absence. Missing evidence is not non-compliance and is never a reason to use `N/A`.

## 3. Quick Triage versus full audit

### Quick Triage

Use only when explicitly requested. Label it **Preliminary**, report highest-risk findings first, exclude final validation and definitive production-readiness scoring, and label any explicitly requested number `Preliminary estimate` with unverified criteria identified.

### Full audit

A full audit classifies completeness, sets applicability, scores every applicable criterion, records evidence/deductions, runs QAQ/RMI for critical mappings, separates specification from local/best-practice failures, names `Needs Human Review` items, and ends with one recommendation.

## 4. Current 100-point rubric

| Criterion | Weight |
| --- | ---: |
| Specification compliance | 10 |
| Activation description | 8 |
| Scope control | 8 |
| Completeness | 8 |
| Procedural clarity | 8 |
| Related-skill consistency | 6 |
| Agent usability | 8 |
| Context efficiency | 7 |
| Tool/script/reference/asset handling | 7 |
| Safety/destructive controls | 8 |
| Edge cases/gotchas | 6 |
| Merge quality | 6 |
| Testability/validation readiness | 6 |
| Maintainability | 4 |
| **Total** | **100** |

Score bands:

- **96-100** - production-ready
- **85-95** - targeted fixes
- **70-84** - gaps
- **50-69** - major revisions
- **<50** - not ready

A score band describes quality. It does **not** automatically authorize `deploy`.

## 5. Applicability and N/A normalization

Mark a criterion `N/A` only when it is genuinely outside the artifact/task scope.

Common `N/A` cases: `Merge quality` for non-merge work; `Tool/script/reference/asset handling` when no such resources exist; `Related-skill consistency` when no interaction/context is relevant; environment-specific subchecks outside that environment.

Do **not** use `N/A` for incomplete/unknown artifacts, absent evidence, missing referenced files, unavailable execution, or pending human judgment. Those are `Unverified / Needs Human Review`.

### Normalization formula

For applicable criteria:

```text
normalized_score =
    (earned_applicable_points / maximum_applicable_points) * 100
```

Round only the final normalized result to the nearest whole number.

Report both values when normalization occurs:

```text
Raw applicable score: 82/88
Normalized score: 93/100
N/A: Merge quality (6), Related-skill consistency (6)
```

A normalized score cannot erase blocking failures or `Needs Human Review`.

## 6. Deduction anchors

Score each criterion from its full weight downward.

Use these anchors consistently:

| Condition | Typical credit |
| --- | ---: |
| Fully satisfies criterion with direct evidence | 100% |
| Minor, low-risk defect; behavior remains clear | 75-90% |
| Material gap, ambiguity, or weak evidence | 50-74% |
| Major defect affecting reliable execution | 25-49% |
| Criterion substantially absent or contradicted | 0-24% |

Use the smallest deduction justified by evidence.

Do not double-deduct the same defect unless it independently harms multiple criteria. When one root cause affects several criteria, explain each distinct effect.

Examples:

- An over-broad description can reduce **Activation description** and **Scope control** because it independently harms discovery and boundary control.
- A missing referenced script can reduce **Tool/script/reference/asset handling** and **Testability** if it both breaks execution and prevents validation.
- Verbosity alone should not reduce **Completeness**; it belongs primarily under **Context efficiency**.

## 7. Severity

Assign severity to findings independently of point loss.

### Critical

Use when the issue:

- violates a mandatory specification requirement that prevents a valid skill;
- creates a credible destructive/high-impact safety risk;
- causes severe activation outside intended scope;
- makes the core workflow unsafe or unusable;
- loses essential unique guidance during a merge.

Critical findings block `deploy`.

### High

Use when the issue:

- materially breaks a primary workflow;
- causes likely false positives/false negatives in important activation paths;
- creates unresolved contradictions;
- breaks required resources, scripts, or paths;
- leaves a behavior-critical skill without necessary controls.

High findings normally require `revise`, `split`, `merge`, or `hold`.

### Medium

Use when the issue:

- reduces reliability, clarity, testability, or maintainability;
- affects a secondary branch or edge case;
- creates avoidable context cost with meaningful execution impact;
- weakens validation without making the main workflow unusable.

### Low

Use when the issue:

- is localized and low-risk;
- affects wording, organization, naming consistency, or minor duplication;
- has little impact on correct execution.

Severity is risk-based. Point loss is criterion-based. They may differ.

## 8. Criterion scoring anchors

### 8.1 Specification compliance - 10

Full credit requires all mandatory current-spec checks that can be verified to pass.

Deduct for: invalid or missing required frontmatter when completeness is known; invalid `name`/`description` constraints; unsupported frontmatter presented as specification-valid; specification-required structural violations..
Rules:

- Local or provider-specific conventions do not reduce this criterion unless the current specification requires them.
- If completeness is unknown, mark the unresolved check `Unverified`; do not invent a failure.
- Any confirmed mandatory-spec failure prevents a production-ready verdict even if the normalized score is high.

### 8.2 Activation description - 8

Full credit requires a description that states what the skill does and when to use it, with direct mapping to intended requests.

Deduct for: vague or implementation-only wording; missing important trigger vocabulary; over-broad activation; legitimate use cases omitted from the activation contract; contradiction between description and actual body scope..
For critical activation boundaries, run QAQ/RMI. Unresolved critical activation mapping prevents full credit.

### 8.3 Scope control - 8

Full credit requires a coherent capability with explicit boundaries.

Deduct for: unrelated workflows bundled together; unnecessary fragmentation; one-off project policy masquerading as reusable skill logic; scope broader or narrower than the activation description; silent activation expansion during revision/merge..

### 8.4 Completeness - 8

Score completeness relative to the declared purpose and known artifact completeness.

Full credit requires all instructions/resources necessary for the claimed workflow.

Deduct for: missing required decision branches; missing failure/recovery behavior; missing required resources when the directory is known complete; workflow gaps that force the agent to guess..
Do not deduct for content outside an excerpt or unknown artifact boundary; mark it `Unverified`.

### 8.5 Procedural clarity - 8

Full credit requires clear, active, atomic instructions with explicit sequence and decision conditions where needed.

Deduct for: vague verbs such as “handle appropriately” without decision guidance; ambiguous sequencing; undefined branch conditions; contradictory instructions; unclear completion criteria; menus of options without a justified default..

### 8.6 Related-skill consistency - 6

Full credit requires clean composition with supplied neighboring skills and library rules.

Deduct for: contradictory precedence; duplicate activation with no boundary; incompatible terminology; broken handoffs; inconsistent shared conventions..
Mark `N/A` only when related-skill context is genuinely irrelevant. If related skills likely exist but were not supplied, use `Unverified`.

### 8.7 Agent usability - 8

Full credit requires the agent to be able to act correctly without unnecessary interpretation.

Deduct for: hidden prerequisites; unclear inputs/outputs; excessive cognitive branching; hard-to-find mandatory guidance; instructions that describe goals but not executable behavior; repeated backtracking caused by poor information architecture..
Behavioral execution evidence should outweigh stylistic preference.

### 8.8 Context efficiency - 7

Full credit requires minimum sufficient always-loaded guidance with progressive disclosure.

Deduct for: duplicated content; generic explanations; long examples/templates that should be references/assets; optional branches always loaded; references with no load condition; fragmentation that forces unnecessary file loading..
Do not reward brevity that removes necessary domain knowledge.

### 8.9 Tool/script/reference/asset handling - 7

Apply when the skill uses supporting resources or executable tools.

Full credit requires:

- correct paths and load conditions;
- clear execute-versus-read intent;
- dependencies/runtime assumptions where needed;
- bounded inputs/outputs and error behavior;
- resources that exist when completeness is known.

Deduct for stale paths, hidden dependencies, unsafe commands, missing required resources, or ambiguous tool usage.

### 8.10 Safety/destructive controls - 8

Full credit requires controls proportional to actual risk.

Deduct for missing:

- authorization boundaries;
- backup/snapshot/checkpoint for high-impact changes;
- validation before destructive execution;
- staged changes where staging materially reduces risk;
- rollback/recovery;
- clear precedence for safety over convenience.

If the skill truly contains no material destructive/high-impact behavior, score based on whether that low-risk scope is clear or mark `N/A` only when the criterion has no meaningful application.

Unresolved critical safety issues block `deploy`.

### 8.11 Edge cases/gotchas - 6

Full credit requires important non-obvious failure modes to be actionable.

Deduct for: predictable boundary conditions left undefined; known gotchas stated without corrective action; silent failure cases; missing escalation/human-review condition where judgment is unavoidable.
Do not reward exhaustive hypothetical edge-case lists.

### 8.12 Merge quality - 6

Apply to merged skills or merge candidates.

Full credit requires:

- unique guidance preserved;
- duplication removed safely;
- contradictions resolved;
- activation boundaries preserved or intentionally redesigned;
- resource/path/load conditions reconciled;
- source provenance and rollback considered where relevant.

A merge with unresolved contradictions cannot receive full credit and should not be recommended for deployment.

### 8.13 Testability/validation readiness - 6

Full credit requires falsifiable success criteria and a practical validation path.

Deduct for: instructions that cannot be tested; missing positive/near-miss cases for critical triggers; missing validation after consequential changes; behavior claims without evidence; inability to distinguish `PASS`, `AMBER`, `FAIL`, and `Needs Human Review` outcomes.
For behavior-critical skills, unresolved required `AMBER`, `FAIL`, or `NHR` outcomes, or unresolved required RED/GREEN/applicable pressure evidence, materially limit this criterion.

### 8.14 Maintainability - 4

Full credit requires durable terminology, discoverable references, low duplication, and clear update boundaries.

Deduct for: stale/legacy rules mixed with current guidance; inconsistent terminology; duplicated rules likely to drift; unexplained magic thresholds; hard-coded paths or versions without justification; reference structure that obscures ownership or update points.

## 9. QAQ/RMI scoring

Run QAQ/RMI for every **critical instruction, trigger, branch, or load condition**.

For each item:

1. Define a realistic positive request.
2. Define a realistic near-miss.
3. Map the positive request to its governing instruction and expected behavior.
4. Verify the near-miss does not activate it.
5. Reverse-map the behavior to the intended request class.
6. Fail unresolved conflicts.
7. Pass only when mappings are direct, unambiguous, and scope-consistent.

Record:

```text
QAQ/RMI: PASS | FAIL | NHR
Positive:
Near-miss:
Governing instruction:
Expected behavior:
Reverse mapping:
Evidence:
```

Scoring effects:

- A failed critical activation QAQ/RMI must reduce **Activation description** and/or **Scope control** as supported by the failure.
- A failed critical branch/load QAQ/RMI must reduce the criterion governing that branch and usually **Agent usability**.
- `NHR` does not earn pass credit.

## 10. Blocking conditions versus numeric score

The following block `deploy` regardless of score: unresolved mandatory-spec failure; Critical safety finding; core-behavior contradiction; known loss of essential unique merge guidance; missing authorization for requested destructive/high-impact implementation; or any required behavior-critical evaluation with an unresolved `AMBER`, `FAIL`, or `NHR` outcome. Outcome and requiredness are separate axes: `FAIL` records a material expectation violation; whether that failure blocks deployment depends on whether the case is required.

Report the numeric score anyway, but state the blocker separately.

Example:

```text
Score: 97/100
Band: production-ready by score
Deployment status: BLOCKED
Reason: required script path is unverified after the final edit.
Recommendation: hold
```

## 11. Verdict and recommendation

After scoring, choose exactly one recommendation: **deploy** (blocking gates pass), **revise** (targeted fixes suffice), **split** (materially different purposes should separate), **merge** (substantial overlap justifies consolidation), **deprecate** (obsolete after preserving unique value), or **hold** (required evidence/authorization/tooling/conflict resolution/human judgment is missing).

The recommendation is not mechanically derived from the score band.

## 12. Audit report requirements

For each full audit, report:

```markdown
## Verdict
[band / readiness]

## Score
[normalized score]/100
Raw applicable score: [earned]/[applicable maximum]
N/A: [criteria or none]

## Artifact classification
[complete directory | complete SKILL.md | excerpt | unknown]

## Blocking issues
- ...

## Top findings
| Severity | Criterion | Finding | Evidence | Deduction | Fix |
|---|---|---|---|---:|---|

## Rubric breakdown
| Criterion | Weight | Applicable max | Earned | Evidence state | Notes |
|---|---:|---:|---:|---|---|

## QAQ/RMI
- ...

## Needs Human Review
- ...

## Final recommendation
deploy | revise | split | merge | deprecate | hold
```

Use `templates/skill-audit.md` only as an output-shape template when requested; this file governs scoring mechanics.

## 13. Rescoring and optimization

When optimization/remediation is requested:

1. Score the baseline candidate.
2. Map each deduction to the smallest fix.
3. Apply only authorized changes.
4. Rerun affected tests and regressions.
5. Rescore from fresh evidence.
6. Preserve prior scores for comparison.

Do not raise a score merely because text changed. Raise it only when the evidence supporting the failed criterion improves.

Stop after at most three optimization iterations, or earlier for no improvement, repeated material failure, missing authorization, unsafe/conflicting requirements, missing context/tooling, unresolved specification conflict, or required human judgment.

If the score remains below 96, document the remaining deficiencies and required human actions.

## 14. Scoring sanity checks

Before finalizing:

- [ ] Rubric weights total 100.
- [ ] Every applicable criterion has evidence.
- [ ] Every `N/A` is justified by scope, not missing evidence.
- [ ] Every `Unverified` item is surfaced as `Needs Human Review`.
- [ ] Deductions are not duplicated without distinct effects.
- [ ] Severity matches risk rather than point size.
- [ ] Specification failures are separated from best-practice/local-policy failures.
- [ ] QAQ/RMI was run for critical mappings.
- [ ] Final score was normalized only after applicability was set.
- [ ] Score band and deployment recommendation are reported separately.
- [ ] Final recommendation is exactly one of: `deploy`, `revise`, `split`, `merge`, `deprecate`, `hold`.

The scoring system succeeds when two reviewers using the same evidence produce materially similar deductions, expose the same blockers, and can trace every point loss to an observable criterion failure.
