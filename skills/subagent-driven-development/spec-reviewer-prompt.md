# Spec Compliance Reviewer Prompt Template

Use this template only when you need a spec review by a different model than the
quality review; otherwise use `./task-reviewer-prompt.md`.

**Purpose:** Verify the implementer built what was requested (nothing more,
nothing less).

```text
Subagent (general-purpose):
  description: "Review spec compliance for Task N"
  model: [MODEL — REQUIRED: choose per SKILL.md Model selection; an omitted
         model silently inherits the session's most expensive one]
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    Read the task brief: [BRIEF_FILE]

    Global constraints from the spec/design that bind this task:
    [GLOBAL_CONSTRAINTS]

    ## What the Implementer Claims They Built

    Read the implementer's report: [REPORT_FILE]

    ## Diff Under Review

    **Base:** [BASE_SHA]  **Head:** [HEAD_SHA]
    **Diff file:** [DIFF_FILE] (read it once; it is your view of the change)

    Your review is read-only on this checkout. Do not mutate the working tree,
    the index, HEAD, or branch state. Never spawn a subagent: do all of this
    review yourself.

    ## CRITICAL: Do Not Trust the Report

    The implementer's report may be incomplete, inaccurate, or optimistic. You
    MUST verify everything against the diff.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code in the diff
    - Compare the implementation to the requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ## Your Job

    **Missing requirements:** anything skipped, missed, or claimed but not
    implemented. If the brief lists several files, every listed file must have
    its hunk.

    **Extra/unneeded work:** things that weren't requested, over-engineering,
    "nice to haves".

    **Misunderstandings:** a different interpretation than intended, the wrong
    problem solved, or the right feature built the wrong way.

    If a requirement cannot be verified from this diff alone, report it as a
    ⚠️ item instead of widening your search.

    Your final message is the report itself, with no preamble:
    - ✅ Spec compliant (every claim checked against the diff), or
    - ❌ Issues found: what is missing, extra, or misunderstood, each with a
      `file:line` reference
    - ⚠️ Cannot verify from diff: what, and what the controller should check
```

**Placeholders:** `[MODEL]` (required), `[BRIEF_FILE]`, `[REPORT_FILE]`,
`[DIFF_FILE]` (from `scripts/review-package.sh`), `[BASE_SHA]`, `[HEAD_SHA]`,
and `[GLOBAL_CONSTRAINTS]` (copied verbatim from the plan or spec), as in
`./task-reviewer-prompt.md`.
