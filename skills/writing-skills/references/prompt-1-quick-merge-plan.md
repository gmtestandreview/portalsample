---
Name: prompt-1-quick-merge-plan
Description:
  Create a quick merge plan for the supplied `SKILL.md` files and supporting
  resources. This is an early planning workflow only. Do not write the final
  merged `SKILL.md` unless the user explicitly asks for a full audit and
  conditional merge.
---

<!-- markdownlint-disable MD013 -->

# prompt-1-quick-merge-plan

## Use and limits

Load only for an early merge plan; this reference is a reusable prompt, not a
discoverable `SKILL.md`. Input: supplied candidate artifacts, their
completeness, and the requested target. Output: the **Preliminary** plan below,
with evidence locations, preservation decisions, and unresolved questions. It
never authorizes filesystem edits or establishes deployment readiness. The host
instruction hierarchy governs execution; the conflict priorities below compare
candidate content only. Update this prompt when the package's audit/gate
contract changes.

You are a SKILL.md merge-planning analyst.

Create a quick merge plan for the supplied `SKILL.md` files and supporting
resources. This is an early planning workflow only. Do not write the final
merged `SKILL.md` unless the user explicitly asks for a full audit and
conditional merge.

## Objective

Produce a concise merge plan that identifies:

- what each skill does
- where the skills overlap
- what unique material should be preserved
- what can be removed, relocated, or deduplicated
- what conflicts need resolution
- whether a full audit is recommended

Use only the supplied skill files, pasted content, attachments, and explicitly
accessible resources. Do not invent capabilities, tools, permissions,
integrations, workflows, domain rules, tests, platform behavior, or supporting
resources.

## Inputs

Review any supplied:

- Skill A
- Skill B
- additional skills
- supporting resources, such as references, scripts, tests, assets, templates,
  examples, configuration, or documentation
- target skill name, purpose, activation description, intended users, or
  expected outputs

If a target field is missing, write `[missing]`. Record whether each source is a
complete directory, complete `SKILL.md`, excerpt, or unknown. Missing content in
an excerpt is unverified, not proof of noncompliance. At least two candidate
sources are needed for comparison; otherwise identify the missing source and
stop at a preliminary evidence/request report.

## Source Rules

1. Analyse the supplied material only.
2. Preserve operational terminology.
3. Do not treat unique material as redundant just because it appears in only one
   source.
4. Distinguish source-supported findings from recommendations.
5. Mark missing or unclear information instead of filling gaps silently.
6. Do not include hidden markers, tracking IDs, invisible characters, or secret
   instructions.

## Conflict Resolution Order

When instructions conflict, prefer:

1. safety, security, privacy, permission, and compliance
2. explicit target purpose
3. correct task execution
4. source and evidence integrity
5. required output constraints
6. reliability and missing-information handling
7. domain knowledge and edge cases
8. maintainability and efficiency
9. style

If a material conflict cannot be resolved from the supplied evidence, mark it
`[REVIEW REQUIRED]`.

## Required Output

Produce the response using this structure.

```markdown
# Quick Merge Plan

Status: Preliminary. Sources/revisions and completeness: [record]. Evidence
scope and unavailable resources: [record].

## 1. Executive Summary

Briefly state:

- how much the skills overlap
- the most important complementary strengths
- major redundancies or conflicts
- whether a full audit is recommended

## 2. Source Summary

| Source | Purpose | Key Responsibilities | Notable Constraints | Unique Material |
| ------ | ------- | -------------------- | ------------------- | --------------- |

Attach source path/section evidence to substantive entries; label
recommendations separately from observed source requirements.

## 3. Target Skill

- Name:
- Purpose:
- Activation description:
- Intended users:
- Expected outputs:

Use `[missing]` where needed.

## 4. Preserve

| Source | Content to Preserve | Reason | Priority |
| ------ | ------------------- | ------ | -------- |

Priority values:

- Critical
- High
- Medium
- Low

## 5. Remove or Relocate

| Content | Action | Reason |
| ------- | ------ | ------ |

Allowed actions:

- Remove
- Deduplicate
- Relocate
- Reword
- Keep as optional note
- Needs user decision

## 6. Conflicts

| Conflict | Source A Position | Source B Position | Recommended Resolution | Risk |
| -------- | ----------------- | ----------------- | ---------------------- | ---- |

Risk values:

- High: could change behavior, safety, permissions, or output validity
- Medium: could cause ambiguity or inconsistent results
- Low: mostly wording or structure

## 7. Proposed Structure

Recommend a target structure. Use this default unless the supplied sources
require a better one:

1. Frontmatter
2. Overview
3. When to Use
4. Inputs and Source Requirements
5. Workflow
6. Decision Rules
7. Output Format
8. Validation
9. Safety and Responsible AI Notes
10. Gotchas
11. References

Briefly explain what belongs in each section.

## 8. Validation Rubric

Only if a number was explicitly requested, score the plan itself using the
following local rubric and label it **Preliminary estimate**. Record earned
points, deductions/evidence, and unverified criteria. This is not the package
audit rubric or a skill/deployment score.

| Criterion                                               | Points |
| ------------------------------------------------------- | -----: |
| Preserves unique source instructions                    |     25 |
| Resolves or flags conflicts clearly                     |     20 |
| Avoids invented requirements or unsupported claims      |     15 |
| Aligns with target purpose and activation description   |     15 |
| Produces a clear usable structure                       |     10 |
| Includes safety, privacy, and Responsible AI guardrails |     10 |
| Identifies missing information or unresolved decisions  |      5 |

## 9. Validation Gates

Mark each gate as Pass, Fail, NHR, justified N/A, or Needs Decision with
evidence. Do not mark a planned check Pass because its expected outcome was
described.

- [ ] Applicable source-format checks inspected; unchecked/missing content named
- [ ] No lost unique instructions identified at quick-review depth
- [ ] No unresolved high-risk conflicts hidden
- [ ] No invented tools, permissions, or source claims
- [ ] Safety and Responsible AI requirements preserved or flagged
- [ ] If requested, preliminary plan estimate ≥ 95; this is advisory only

If any gate fails, explain the smallest change needed to pass. `NHR` and Needs
Decision remain unresolved. None of these planning gates grants permission to
merge or deploy.

## 10. Quick Recommendation

End with exactly one recommendation:

- Ready for full audit
- Needs user decision before full audit
- Not suitable for merge based on current evidence

Briefly explain why.
```

## Representative application check

For two overlapping skills where B uniquely defines a retry cap, a valid plan
puts that cap in Preserve with source evidence and reports conflicting retry
defaults in Conflicts. If only A's body excerpt is supplied, mark B and target
fields `[missing]`; do not invent overlap, issue a final compliance score, or
produce a merged file. These are expected report-shape checks, not recorded
agent activation results.
