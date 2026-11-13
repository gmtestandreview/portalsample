# Code Quality Reviewer Prompt Template

Use this template only when you need a quality review by a different model than
the spec review; otherwise use `./task-reviewer-prompt.md`.

**Purpose:** Verify the implementation is well-built (clean, tested,
maintainable). **Only dispatch after the spec compliance review passes.**

```text
Subagent (general-purpose):
  description: "Review code quality for Task N"
  model: [MODEL — REQUIRED: choose per SKILL.md Model selection; an omitted
         model silently inherits the session's most expensive one]
  prompt: |
    You are reviewing one task's implementation for code quality. Spec
    compliance has already passed; do not re-litigate it.

    Read the task brief for context: [BRIEF_FILE]
    Read the implementer's report: [REPORT_FILE] (unverified claims)

    **Base:** [BASE_SHA]  **Head:** [HEAD_SHA]
    **Diff file:** [DIFF_FILE] (read it once; it is your view of the change)

    Your review is read-only on this checkout. Do not mutate the working tree,
    the index, HEAD, or branch state. Never spawn a subagent: do all of this
    review yourself. Do not re-run the implementer's suite; run only a focused
    test if reading the code raises a specific doubt.

    ## What to check

    **Code quality:** separation of concerns, error handling (no swallowed
    errors), DRY without premature abstraction, edge cases handled.

    **Tests:** do the new and changed tests verify real behavior, not mocks?
    Are the task's edge cases covered? Is test output pristine? Does any test
    assert nothing?

    **Structure:** one clear responsibility per file with a well-defined
    interface; units decomposed so they can be understood and tested
    independently; the plan's file structure followed; new files that are
    already large, or large growth in existing files, contributed by this change.

    ## Calibration

    Categorize by actual severity. Important means this task cannot be trusted
    until fixed: incorrect or fragile behavior, a missed requirement, or
    maintainability damage you would block a merge over (verbatim duplication of
    a logic block, swallowed errors, tests that assert nothing). "Coverage could
    be broader" and polish are Minor. Acknowledge what was done well first.

    ## Output

    Your final message is the report, with no preamble and a `file:line` for
    every finding:

    ### Strengths
    ### Issues
    #### Critical (Must Fix)
    #### Important (Should Fix)
    #### Minor (Nice to Have)
    ### Assessment
    **Task quality:** Approved | Needs fixes — with 1-2 sentences of reasoning.
```

**Placeholders:** `[MODEL]` (required), `[BRIEF_FILE]`, `[REPORT_FILE]`,
`[DIFF_FILE]` (from `scripts/review-package.sh`), `[BASE_SHA]`, `[HEAD_SHA]`, as
in `./task-reviewer-prompt.md`.
