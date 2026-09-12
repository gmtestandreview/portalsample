# Deterministic Implementation Plan Mode

Load this reference only when the user or target system requires a rigid, machine-readable implementation-plan format, explicit identifier prefixes, or fixed case-sensitive sections.

This mode consolidates the supplied create/update implementation-plan formats. It does not replace the default `writing-plans` output.

## Create vs update

- **Create mode:** create a new plan from the supplied requirements and repository evidence.
- **Update mode:** edit an existing plan in place, preserving valid requirements, identifiers, decisions, and sections unless the new requirements supersede them. Update affected metadata such as `last_updated` when that field exists.
- Do not silently renumber stable identifiers in update mode unless the target format requires it.

Use the user's/project's path convention. If the target system explicitly requires the legacy deterministic convention, use `/plan/[purpose]-[component]-[version].md` with one of these purpose prefixes: `upgrade`, `refactor`, `feature`, `data`, `infrastructure`, `process`, `architecture`, `design`.

## Deterministic rules

- Use explicit, unambiguous language.
- Keep phases atomic and give each phase measurable completion criteria.
- Declare dependencies between phases/tasks.
- Include exact file paths, function/type names, code references, and validation criteria where supported by evidence.
- Use identifier prefixes consistently: `REQ-`, `SEC-`, `CON-`, `GUD-`, `PAT-`, `GOAL-`, `TASK-`, `ALT-`, `DEP-`, `FILE-`, `TEST-`, `RISK-`, `ASSUMPTION-`.
- Populate every required section.
- Remove every drafting placeholder before finalization.

## Fixed template

```markdown
---
goal: <concise plan goal>
version: <version or date if used>
date_created: <YYYY-MM-DD>
last_updated: <YYYY-MM-DD when updating, if used>
owner: <team or individual if known>
status: 'Completed'|'In progress'|'Planned'|'Deprecated'|'On Hold'
tags: [<relevant tags if used>]
---

# Introduction

<Concise introduction and goal.>

## 1. Requirements & Constraints

- **REQ-001**: <requirement>
- **SEC-001**: <security requirement when applicable>
- **CON-001**: <constraint>
- **GUD-001**: <guideline>
- **PAT-001**: <pattern to follow>

## 2. Implementation Steps

### Implementation Phase 1

- **GOAL-001**: <measurable phase goal>

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-001 | <specific actionable task> |  |  |

## 3. Alternatives

- **ALT-001**: <alternative and why not chosen>

## 4. Dependencies

- **DEP-001**: <dependency and ordering impact>

## 5. Files

- **FILE-001**: `<path>` — <create/modify/delete and responsibility>

## 6. Testing

- **TEST-001**: <test, exact command, and expected result>

## 7. Risks & Assumptions

- **RISK-001**: <risk and mitigation/rollback>
- **ASSUMPTION-001**: <supported assumption>

## 8. Related Specifications / Further Reading

- <source spec or relevant documentation>
```

The source format included a status badge in the introduction. Preserve it when the target system specifically requires that legacy presentation; otherwise the status frontmatter is sufficient.
