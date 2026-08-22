---
agent: 'agent'
description: 'Run a focused WCAG 2.2 AA accessibility review for relevant web UI changes in this repository, using AGDS-first patterns and practical engineering fixes.'
---

Canonical command reference: see [.github/docs/COMMAND_CANON.md](../docs/COMMAND_CANON.md) for repo-standard validation, build, lint, and test commands.

# Accessibility Review

Use this prompt when you want a focused accessibility review for web UI behavior, markup, and interactions.

## Inputs

Provide:

- target file paths, components, pages, routes, or diffs
- user flows to review or test (keyboard, focus, forms, dialogs, navigation, announcements)
- known issues, constraints, or areas of concern

If the provided scope is too broad or missing, first state the minimum scope assumptions you are using before reviewing.

## Goal

Review the relevant code, UI, or change for accessibility issues using WCAG 2.2 AA as the working standard.

Focus on practical engineering findings and fixes, not generic accessibility theory.

## Repository context

- This workspace uses AGDS-first component patterns.
- Prefer existing AGDS accessibility patterns and layout behavior already used in the repo.
- Treat runtime keyboard behavior, focus behavior, error handling, and announcements as first-class evidence in addition to static code checks.

## Scope

- Review only the files, components, pages, flows, or diffs relevant to the task.
- Do not rewrite unrelated code.
- Do not change repository policy, linting, formatting, or workflows unless explicitly asked.
- Do not give legal advice. You may mention WCAG 2.2 AA as the review target, but keep the output technical and implementation-focused.

## Audit areas

Audit for issues in these areas where relevant:

- semantic HTML and landmark structure
- heading hierarchy
- labels, instructions, and error messaging
- keyboard access and focus order
- focus visibility and focus return
- skip links and bypass blocks
- link/button purpose and accessible names
- ARIA misuse
- icon-only controls
- live regions and status/error announcements
- dialogs, menus, tabs, and interactive widgets
- form accessibility
- color contrast and non-color indicators
- responsive reflow and zoom behavior
- reduced motion handling
- image alt text
- media captions/transcripts
- SPA/page title and route-change announcement behavior

## React and Next.js review guidance

When reviewing React / Next.js code in this repo:

- Prefer native HTML over custom ARIA where possible.
- Watch for common JSX accessibility mistakes.
- Ensure page/title patterns remain accessible.
- Prefer AGDS-supported accessible patterns over custom widget implementations.

## Audit process

1. Review the provided scope and identify the relevant files, flows, or UI states.
2. Check the implementation for WCAG 2.2 AA issues in the relevant audit areas.
3. Distinguish code-confirmed issues from runtime-dependent issues that need manual verification.
4. Prioritize findings by severity and user impact.
5. Propose minimal fixes that preserve existing behavior and align with AGDS/repo patterns.
6. Recommend validation with relevant repo commands and manual verification steps.
7. Report evidence, uncertainties, and any residual risk honestly.

## Finding labels

For each finding, clearly label whether it is:

- Code-confirmed from static review, or
- Runtime-dependent and requires manual verification

## Output format

1. Summary
   - overall accessibility risk level
   - highest-priority findings

2. Findings
   For each finding include:
   - severity: Critical / Important / Suggestion
   - finding type: Code-confirmed or Runtime-dependent
   - WCAG reference if applicable
   - what is wrong
   - why it matters for users
   - exact file/component/area affected
   - recommended fix

3. Validation gaps
   - what cannot be confirmed from static review alone
   - what should be tested manually

4. Suggested verification
   - keyboard checks
   - screen-reader or announcement checks
   - focus/error-state checks
   - any relevant repo commands

## Severity guidance

- Critical = users may be blocked from access or core task completion
- Important = meaningful barrier that should be fixed promptly
- Suggestion = worthwhile improvement, but not a likely blocker

## Review rules

- Prefer actionable fixes over vague advice.
- Prefer native elements over custom ARIA constructs where possible.
- Do not flag speculative issues without explaining the uncertainty.
- If something depends on runtime behavior, say that clearly.
- If no material issues are found, say so explicitly and list any remaining validation gaps.

## Recommended validation

If the command canon reference is unavailable, fall back to the repository commands explicitly listed in this prompt and say that you did so.

When relevant, recommend validating with:

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm build-storybook`
