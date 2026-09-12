# Plan Document Reviewer Prompt Template

Use after the implementation plan is complete, self-reviewed, and known blockers are fixed. Use an independent reviewer/subagent only when the environment supports one; otherwise apply this as a manual review checklist.

## Review standard

Approve only if the plan:

- scores 96/100 or higher;
- has zero critical failures;
- can be executed by a skilled engineer with no prior context beyond the plan and source material;
- uses exact file paths, commands, expected outputs, and concrete code or patch guidance;
- uses bite-sized, independently reviewable and testable tasks;
- uses behavior-first tests or acceptance tests for behavior changes;
- contains no unresolved placeholders, vague instructions, undefined references, or contradictory assumptions;
- applies only the smallest useful planning framework;
- includes Source Inputs, Assumptions and Unknowns, Requirement Traceability, Framework Fit, Files and Responsibilities, Tasks, Safety/Rollback/Verification, Final Validation, and Execution Handoff.

## Critical failures

The plan automatically fails if it:

- contains unresolved placeholders or vague implementation instructions;
- references files, functions, classes, methods, routes, commands, types, schemas, fixtures, or helpers that are never defined;
- omits tests for user-visible behavior or business logic changes;
- includes code-changing steps without concrete code, exact edits, or sufficient patch guidance;
- uses vague paths instead of exact file paths;
- requires destructive, data-changing, migration, deployment, auth, billing, permission-sensitive, or security-sensitive work without verification and rollback;
- has contradictory steps, inconsistent naming, or invalid task ordering;
- cannot be executed from the plan and source material alone.

## 100-point rubric

| Category | Points | Full-credit standard |
| --- | ---: | --- |
| Spec Coverage | 15 | Every requirement maps to tasks; no major scope gap or creep. |
| File and Ownership Clarity | 10 | Every created, modified, or tested file has an exact path and responsibility. |
| Task Granularity | 8 | Tasks are small, independently reviewable, and produce testable outcomes. |
| TDD and Test Quality | 15 | Behavior changes start with failing tests/acceptance tests, exact commands, expected failure, implementation, and passing checks. |
| Implementation Specificity | 10 | Code-changing steps include concrete code, exact edits, commands, or sufficient patch guidance. |
| Sequencing and Dependencies | 10 | Setup, schemas, helpers, fixtures, and interfaces exist before use. |
| Safety, Rollback, and Verification | 10 | Risky work has backups/checkpoints, dry runs where useful, rollback, verification, and approval gates when needed. |
| Developer Usability | 10 | An engineer can act without asking what file, code, command, output, or next step is intended. |
| Framework Fit | 7 | Uses the smallest appropriate framework; adds DDD/C4/ADR-lite/threat/migration planning only when justified. |
| Minimality and YAGNI | 5 | Every task directly supports the source, tests, safety, rollback, or required integration. |
| **Total** | **100** | |

## Devil's advocate review

Try to prove the plan will fail. Check:

1. spec mismatch;
2. missing setup, fixtures, imports, commands, or hidden context;
3. undefined references;
4. TDD gaps;
5. sequence errors;
6. safety gaps;
7. framework misuse;
8. overengineering;
9. buildability friction;
10. inconsistent naming, paths, commands, signatures, or environment assumptions.

Only block on issues that would cause wrong implementation, inability to execute, skipped required tests, or unsafe work. Put wording/style preferences under recommendations.

If a finding depends on unavailable judgment, mark it `Needs Human Judgment`, state the missing information, and say whether implementation can safely proceed.

## Output

```markdown
## Plan Review

**Status:** Approved | Issues Found
**Score:** NN/100
**Critical Failures:** None | Present
**Ready for Implementation:** Yes | No

## Rubric Breakdown

| Category | Score | Notes |
|---|---:|---|

## Blocking Issues

- [Task/Step] **Category:** ...
  **Critical Failure:** Yes | No
  **Issue:** ...
  **Evidence:** ...
  **Why it matters:** ...
  **Smallest fix:** ...

## Needs Human Judgment

- [Location] ...
  **Missing information:** ...
  **Can proceed safely?:** Yes | No
  **Reason:** ...

## Recommendations

- ...

## Final Devil's Advocate Verdict

The most likely way this plan could fail is: ...
```

If there are no blocking issues, human-judgment items, or recommendations, write `None.` in the corresponding section.
