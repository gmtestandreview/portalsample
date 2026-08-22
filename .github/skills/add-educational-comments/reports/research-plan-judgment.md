# Research, Plan, and Judgment Criteria

## Research Findings

- Agent Skills recommends keeping `SKILL.md` under 500 lines and 5,000 tokens, moving detailed material into `references/` with explicit load triggers.
- Agent Skills recommends concise, stepwise guidance rather than exhaustive documentation.
- For fragile workflows, prescriptive instructions and validation loops are appropriate.
- Evals should compare a skill against a baseline or previous version and record grading results.
- Skill frontmatter supports an optional `compatibility` field for environment requirements.

## Implementation Plan

1. Snapshot the previous packaged skill as the baseline.
2. Rewrite `SKILL.md` as a lean core under 500 lines.
3. Move examples, extended validation, regression details, Fetch List handling, file classification, and language gotchas into `references/`.
4. Move the final report template into `assets/final-report-template.md`.
5. Add explicit load triggers in `SKILL.md`.
6. Add a `compatibility` frontmatter field.
7. Clarify validation command safety with a static-first hierarchy.
8. Add `evals/trigger-evals.json` with should-trigger and should-not-trigger prompts.
9. Run offline package evals comparing the previous and revised versions.
10. Package all revised files and eval results.

## Judgment Criteria

| Criterion | Pass Standard |
|---|---|
| SKILL.md size | Fewer than 500 lines. |
| Progressive disclosure | Examples, extended validation, regression details, and long gotchas live outside `SKILL.md`. |
| Explicit load triggers | `SKILL.md` says exactly when to read each reference or asset. |
| Validation safety | Uses strict static-first hierarchy and blocks unsafe commands by default. |
| Evals | Includes regression evals, trigger evals, grading, and old-vs-new benchmark results. |
| Trigger coverage | Includes positive triggers and near-miss negatives: review comments, write docs, explain in chat, TODO comments, format code. |
| Compatibility | Includes a short `compatibility` frontmatter field. |
| Final report asset | Template lives in `assets/final-report-template.md`. |
