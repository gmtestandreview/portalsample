# SWOT Analysis: [Skill A] vs [Skill B]

<!-- Optional comparison template, not a scoring or merge/deployment policy.
Load when SWOT is requested or materially clarifies disposition. Replace bracket
placeholders; use [missing] or NHR rather than inventing evidence. -->

Input: two candidate artifacts/resources, their completeness/revisions, target
purpose, and source evidence. Output: a supported keep/merge/split/deprecate or
companion recommendation with preservation/conflict decisions. Use the
[full merge workflow](../references/prompt-2-full-audit+conditional-merge.md)
for conditional construction and validation; this comparison grants no edit or
deployment permission. Update the template when that decision contract changes.

## Scope and recommendation

- Source A / B revisions and completeness: [record]
- Target purpose and activation boundary: [record or missing]
- Inspected resources / unavailable material: [record]
- Recommendation: [keep separate / merge / split / deprecate / companion / hold]
- Confidence and evidence limits: [record]

Separate source-supported observations from proposed opportunities. Internal
properties belong in Strengths/Weaknesses; external conditions in
Opportunities/Threats. Each substantive entry cites its source or labels itself
a hypothesis; empty evidence cannot justify retirement of unique material.

| Category      | Skill A                | Skill B                | Evidence / consequence   |
| ------------- | ---------------------- | ---------------------- | ------------------------ |
| Strengths     | [internal capability]  | [internal capability]  | [source]                 |
| Weaknesses    | [internal gap]         | [internal gap]         | [source]                 |
| Opportunities | [external possibility] | [external possibility] | [evidence or hypothesis] |
| Threats       | [external risk]        | [external risk]        | [evidence or hypothesis] |

## Preservation and conflicts

| Unique item / conflict | Source         | Treatment / resolution                     | Evidence | Unresolved risk |
| ---------------------- | -------------- | ------------------------------------------ | -------- | --------------- |
| [item]                 | [path/section] | [preserve/adapt/consolidate/remove/review] | [why]    | [risk or none]  |

## Decision gates

| Gate                             | Required?                | Outcome                   | Actual evidence / limitation  | Next action |
| -------------------------------- | ------------------------ | ------------------------- | ----------------------------- | ----------- |
| Purpose/scope alignment          | yes                      | [PASS/FAIL/NHR]           | [source comparison]           | [action]    |
| Unique material preserved        | yes for merge/retirement | [PASS/FAIL/NHR]           | [inventory]                   | [action]    |
| Material contradictions resolved | yes for merge            | [PASS/FAIL/NHR]           | [register]                    | [action]    |
| Final candidate validated        | yes for readiness        | [PASS/AMBER/FAIL/NHR/N/A] | [fresh results or limitation] | [action]    |

An unresolved required gate prevents a merge/readiness claim; recommend `hold`
or a supported separate/split disposition. A hypothesis or high numeric score
cannot clear it. Deployment requires the testing checklist beyond this template.

## Specific actions

1. [Evidence/finding → authorized action or missing decision → verifier]

## Illustrative filled check

Synthetic inputs: A parses CSV; B parses CSV plus a unique offline redaction
rule. Strengths: shared parser and B's redaction rule, each with fixture section
evidence. Opportunity: common parser extraction (proposal). Threat: changed data
handling if redaction is lost. Preservation row:
`offline redaction | B Rules | preserve | unique constraint | loss changes privacy behavior`.
If target ownership is unknown, conflict gate is `NHR`; recommendation `hold`,
action resolve ownership before full merge audit. No runtime PASS is implied by
this filled report-shape check.
