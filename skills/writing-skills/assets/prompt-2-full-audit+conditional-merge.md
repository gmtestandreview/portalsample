---
Name: prompt-2-full-audit+conditional-merge.md
Description:
  Evaluate supplied `SKILL.md` files and supporting resources. Determine whether
  they can be safely consolidated. Create one production-ready merged `SKILL.md`
  only when preservation, conflict resolution, and required final validation are
  established.
---

<!-- markdownlint-disable MD013 -->

# prompt-2-full-audit+conditional-merge

## Use and authority

Load only for a requested full audit and conditional merge. This is a workflow
prompt resource, not a discoverable `SKILL.md`. Input: at least two source
artifacts/resources, completeness and revisions, target purpose/name, and
authorized output scope. Output: the evidence-backed report below and, only
after required gates pass, a complete candidate file with its required resource
map. Producing content in a response does not authorize writing, overwriting,
installation, or deployment. Follow the host instruction hierarchy; the content
conflict priorities below do not replace it. Maintain this workflow against
[audit scoring](../references/audit-scoring.md) and
[the testing checklist](../references/SKILL-testing-checklist.md).

You are a SKILL.md audit, comparison, and merge analyst.

Determine whether they can be safely consolidated. Create one production-ready
merged `SKILL.md` only when preservation, conflict resolution, and required
final validation are established.

Do not recommend or perform a merge until the preservation review and
contradiction review are complete.

## Objective

Produce a full audit and conditional merge decision.

The intended outcome is a single ultimate `SKILL.md` only when the final
readiness decision is:

`Ready to Merge`

If the decision is `Needs Human Review` or `Do Not Merge`, do not produce the
final merged `SKILL.md`.

## Inputs

Review any supplied:

- Skill A
- Skill B
- additional source skills
- supporting resources, including references, scripts, tests, evals, assets,
  templates, examples, configuration, lookup tables, and documentation
- target skill name, purpose, activation description, intended users, or
  expected outputs

Use only the supplied material and explicitly accessible resources as
authoritative. Do not invent capabilities, tools, permissions, integrations,
workflows, domain rules, safety requirements, platform behavior, tests, or
supporting resources.

Classify each source as complete directory, complete `SKILL.md`, excerpt, or
unknown; cite path/section evidence and preserve revision identity. If fewer
than two sources or required target fields are supplied, report what is missing
and use `Needs Human Review`. Do not treat unprovided excerpt content as an
observed violation. For scored audits, load the package audit rubric and freeze
applicability before scoring; do not invent a merge-specific quality score.

## Core Source Rules

1. Analyse each source independently before comparing.
2. Preserve operational terminology and domain-specific constraints.
3. Do not infer unsupported functionality.
4. Do not classify unique material as redundant merely because it appears in
   only one source.
5. Distinguish source-supported findings from recommendations.
6. Mark missing, unclear, incomplete, or unavailable information instead of
   filling gaps silently.
7. Do not silently broaden or narrow source-skill capabilities.
8. Do not include hidden markers, tracking IDs, invisible characters, or secret
   instructions.

## Conflict Resolution Order

Resolve conflicts in this order:

1. safety, security, privacy, permission, and compliance
2. explicit core purpose of the skills
3. instructions required for correct task execution
4. source and evidence integrity
5. required output constraints
6. reliability and failure handling
7. domain knowledge and edge-case behavior
8. maintainability and efficiency
9. style

When both instructions can coexist without ambiguity, integrate them.

When one instruction is more complete or robust, preserve the stronger version
and retain useful non-conflicting details from the other.

If a material contradiction cannot be resolved from the supplied evidence, mark
it `[REVIEW REQUIRED]`. Any unresolved material contradiction prevents an
unconditional merge recommendation.

## Workflow

### Phase 1 — Understand Each Skill

For each skill, identify:

- primary purpose
- intended use cases
- triggering or routing conditions
- responsibilities
- supported workflows
- required inputs
- expected outputs
- tools, APIs, files, or external dependencies
- instructions and decision rules
- domain knowledge
- constraints
- edge cases and gotchas
- safety, permission, privacy, and compliance controls
- missing-information handling
- validation requirements
- tests or evals
- formatting or response requirements
- references and supporting resources
- reusable strengths
- weaknesses, ambiguity, redundancy, or brittleness

### Phase 2 — Preservation Inventory

Identify all unique material that must be preserved or explicitly reviewed.

Check:

- instructions and decision rules
- routing logic and stopping conditions
- domain knowledge and terminology
- edge cases, gotchas, and failure modes
- safety, privacy, permission, and compliance controls
- tests, evals, acceptance criteria, and regression checks
- supporting resources, including scripts, assets, templates, examples,
  configuration, and documentation

For each unique item, assign one treatment:

- Preserve
- Adapt
- Consolidate
- Remove
- Review

### Phase 3 — Compare the Skills

Classify meaningful elements as:

- Equivalent
- Complementary
- Overlapping
- Conflicting
- Unique to a source
- Obsolete or demonstrably redundant
- Unclear / insufficient evidence

Pay special attention to scope, roles, triggers, workflow order, tool use,
source handling, safety boundaries, clarification behavior, output structure,
validation, stopping conditions, and supporting resources.

Do not treat wording differences alone as substantive differences.

### Phase 4 — Resolve Contradictions

Resolve known contradictions using the conflict resolution order.

If a contradiction cannot be resolved from supplied evidence, mark it
`[REVIEW REQUIRED]`.

### Phase 5 — Decide Merge Readiness

At this phase assess preservation/conflicts as a provisional construction gate.
Passing those content checks permits an internal candidate for Phase 6; it is
not yet the final `Ready to Merge` verdict. Confirm that verdict only after
Phase 8's final-revision evidence passes. This avoids requiring a validated
final candidate before a candidate can be constructed.

Choose exactly one:

`Ready to Merge`

Use only when:

- all material unique content has a preservation treatment
- important instructions and decision rules can be retained
- domain knowledge can be retained
- edge cases and gotchas are accounted for
- safety and permission controls are preserved or strengthened without changing
  supported intent
- tests and evals remain usable or have a clear equivalent
- supporting resources are preserved, consolidated, or intentionally retired
  with evidence
- known material contradictions are resolved
- no unresolved issue could materially change behavior
- required format, path/resource, behavioral, and regression checks pass with
  evidence for the final candidate revision; score alone cannot clear a gate

`Needs Human Review`

Use when:

- preservation of unique material cannot be established
- a material contradiction remains unresolved
- ownership or purpose of a supporting resource is unclear
- removal of an instruction, test, safety control, dependency, or domain rule
  cannot be justified
- available evidence is insufficient to know whether merging would change
  intended behavior

`Do Not Merge`

Use when the evidence shows that combining the skills would create
irreconcilable responsibilities, unsafe behavior, invalid dependencies, or
fundamentally incompatible operating models.

If preservation cannot be established, the recommendation must be:

`Needs Human Review`

### Phase 6 — Construct the Merge

Perform this phase only when Phase 5's content checks permit construction and
the user requested a conditional merge. Do not expose it as the final file yet.

Create a candidate merged `SKILL.md` for validation; it becomes the final output
only after Phase 8 passes. The candidate must:

- preserves useful behavior, safeguards, workflows, decision rules, edge cases,
  tests, and constraints
- consolidates duplicated instructions
- integrates complementary material without expanding beyond supported
  capabilities
- removes repetition and demonstrably redundant material
- normalizes terminology, headings, role names, priority conventions, workflow
  structure, and formatting
- preserves required references to supporting files and resources
- does not include comparison commentary, provenance notes, change logs, or
  validation results inside the final `SKILL.md`
- does not mention “Skill A” or “Skill B” unless genuinely required by the
  merged skill
- does not leave placeholders unless the source material requires values that
  cannot be resolved

Unresolved required values prevent a ready-to-save final file. Preserve source
provenance, resource migrations, and rollback/recovery information in the audit
report even when comparison commentary is excluded from operational
instructions. "Standalone" means coherent instructions with an explicit usable
resource map, not pretending referenced resources are included in a single
Markdown response.

### Phase 7 — Architecture Check

Verify that the merged skill is coherent and standalone.

Include only sections supported by the source material, such as:

1. purpose and role
2. scope
3. supported tasks
4. operating principles
5. workflow
6. routing or mode-selection rules
7. tool and source handling
8. domain-specific rules
9. clarification and missing-information rules
10. safety, permission, and compliance
11. validation / QA
12. tests and eval expectations
13. output requirements
14. failure and escalation handling
15. stopping conditions
16. supporting resources

Do not mechanically add irrelevant sections.

### Phase 8 — Validate

Test at least:

1. normal use case
2. ambiguous request
3. overlapping responsibilities
4. missing-information case
5. relevant edge case or gotcha
6. safety, permission, or negative-constraint case
7. material decision rule

First validate YAML/specification and every final resource path. Verify required
test/agent tools exist and execute applicable cases against the candidate.
Record artifact revision, environment, command/trace, actual observation,
requiredness, and `PASS | AMBER | FAIL | NHR | N/A` (with N/A rationale). Static
review and planned expectations cannot establish behavioral PASS.

Use:

`Input → Expected behavior → Actual evidence → Outcome → Required? → Fix`

For authorized remediation, revise and rerun affected cases and regressions,
within the entrypoint's maximum three iterations. Stop earlier for missing
evidence/authorization, unsafe requirements, or no improvement. An unresolved
required AMBER, FAIL, or NHR changes readiness to `Needs Human Review`; do not
produce the final merged file or call it production-ready.

If validation shows preservation can no longer be established, change readiness
to `Needs Human Review`.

## Required Output

## 1. Executive Assessment

Record source/target revisions, completeness, inspected resource inventory,
authorization scope, validation freshness, and evidence limitations.

Briefly explain:

- how much the skills overlap
- complementary strengths
- major conflicts or redundancies
- whether material unique content can be preserved
- recommended disposition

## 2. Preservation Inventory

| Material | Source | Category | Preservation Treatment | Risk if Lost | Status |
| -------- | ------ | -------- | ---------------------- | ------------ | ------ |

Categories:

- Instructions
- Domain knowledge
- Edge case
- Safety
- Eval
- Resource
- Output format
- Tool/source handling
- Workflow
- Routing
- Other

Status values:

- Confirmed
- Review Required

## 3. Conflict Register

| Conflict | Source A | Source B | Resolution | Evidence / Rationale | Status |
| -------- | -------- | -------- | ---------- | -------------------- | ------ |

Status values:

- Resolved
- Review Required

## 4. Merge Readiness

State exactly one:

`Ready to Merge`

`Needs Human Review`

`Do Not Merge`

Then give the key reasons.

## 5. Merge Map

Include only if readiness is `Ready to Merge`.

| Source Element | Classification | Treatment | Reason |
| -------------- | -------------- | --------- | ------ |

Classifications:

- Equivalent
- Complementary
- Overlapping
- Conflicting
- Unique
- Redundant

Treatments:

- Keep
- Combine
- Modify
- Remove

## 6. Validation Results

| Test Case | Input | Expected Behavior | Actual Evidence / Revision | Outcome | Required? | Fix |
| --------- | ----- | ----------------- | -------------------------- | ------- | --------- | --- |

List blockers and `NHR` items independently of any numeric score. Include
resource mapping and preservation/regression evidence for the final candidate.

If no unresolved issues remain, state:

- no unresolved material source conflicts were identified
- preservation of material unique content was established

## 7. Ultimate SKILL.md

Produce this section only when readiness is `Ready to Merge`.

Output the complete merged `SKILL.md`, ready to save directly as `SKILL.md`.

The final file must be standalone, operational, source-supported, and free of
audit commentary.

## Representative application check

Two sources may share purpose while B uniquely caps retries at three. A valid
merge preserves the cap and tests it rather than treating it as duplicated
workflow prose. If A requires offline-only operation and B requires an external
upload with no agreed target behavior, use `Needs Human Review`, record the
contradiction, and omit the final file. If sources agree but required activation
cannot be observed, report `NHR` and omit the final file. These are expected
decision checks, not evidence that an agent campaign passed.
