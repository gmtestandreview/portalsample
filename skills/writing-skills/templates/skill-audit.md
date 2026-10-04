# Skill Audit: [Skill Name]

<!-- Optional report template. Load for a requested formal audit. Replace bracket
placeholders with observed data; unknown values remain explicitly unverified.
The governing audit rubric owns scoring and gates, not this template. -->

Use [audit scoring](../references/audit-scoring.md) for whole-skill scoring or
[the file rubric](../references/file-review-rubric.md) for a file-level package
review. Keep the selected rubric/threshold frozen. Input: artifacts, scope,
revision, observations, and findings. Output: a traceable report with one
recommendation. Update fields when the governing report contract changes.

## Scope and provenance

- Artifact classification: [complete directory / complete SKILL.md / excerpt /
  unknown]
- Reviewed files and exclusions: [inventory and reason]
- Revision/hash and review date: [identity and date]
- Governing rubric / requested threshold: [path/version and threshold]
- Validation environment and freshness: [runtime/tools, candidate revision]
- Authority and authorization scope: [applicable requirements; audit or
  remediation]

## Verdict

[quality band] / [readiness with blockers assessed independently]

Quick Triage, if requested, is **Preliminary** and cannot give final readiness.

## Score

[normalized score]/100. Raw applicable score: [earned]/[applicable maximum].
N/A: [criteria and scope rationale, or none]. Missing evidence is not N/A.

## Blocking issues and Needs Human Review

| Gate / requirement | Required?         | Outcome                   | Evidence / limitation                     | Next action                 |
| ------------------ | ----------------- | ------------------------- | ----------------------------------------- | --------------------------- |
| [requirement]      | [yes/no + reason] | [PASS/AMBER/FAIL/NHR/N/A] | [observed result or unavailable evidence] | [smallest correction/check] |

Required unresolved AMBER, FAIL, or NHR blocks deploy regardless of score.

## Findings

| ID   | Severity        | Criterion          | Finding / location                  | Evidence       | Deduction | Fix / status                  |
| ---- | --------------- | ------------------ | ----------------------------------- | -------------- | --------: | ----------------------------- |
| [ID] | [risk severity] | [rubric criterion] | [observable defect and consequence] | [source/trace] |  [points] | [bounded correction / status] |

## Rubric breakdown

| Criterion   |   Weight | Applicable max |   Earned | Evidence state                  | Notes / finding IDs    |
| ----------- | -------: | -------------: | -------: | ------------------------------- | ---------------------- |
| [criterion] | [weight] |          [max] | [points] | [Verified/Supported/Failed/NHR] | [scope and deductions] |

## QAQ/RMI and validation results

| Case / mapping | Input / near-miss        | Expected behavior    | Actual observation / revision | Outcome                   | Required?         |
| -------------- | ------------------------ | -------------------- | ----------------------------- | ------------------------- | ----------------- |
| [case]         | [representative request] | [falsifiable result] | [command/trace or NHR reason] | [PASS/AMBER/FAIL/NHR/N/A] | [yes/no + reason] |

For critical mappings identify the governing instruction and reverse-map the
behavior to its intended request class. Include relevant format, resource,
activation/application, regression, and safety checks. A checklist or expected
result is not execution evidence.

## Recommended fix plan

1. [Finding → smallest authorized fix → verifier → expected observable result]

## Final recommendation

[exactly one: deploy / revise / split / merge / deprecate / hold]

[Evidence-backed reason, unresolved limitations, and required next action.]

## Illustrative filled check

This synthetic fixture checks report use; it is not a real audit result:
`excerpt`, whole-skill rubric, static scope evidence only, activation required
but unrun. Gate row:
`activation | yes | NHR | no loading trace | run observable activation cases`.
Verdict: readiness blocked; recommendation: `hold`. Numeric score, if requested,
must report the excerpt's applicable/evidenced criteria and must not invent
failures for unprovided content or a passing activation result. For a file
review with an observed broken link, record its criterion deduction, location
and fresh link check after repair; do not reuse a whole-skill average.
