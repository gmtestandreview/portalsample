# Storybook Coverage Workflow Trace

This document records the end-to-end workflow used to complete and close Storybook BDD coverage in this workspace.

## INTAKE

- Request captured: complete end-to-end Storybook coverage including newly added stories.
- Scope expanded from single/few failing scenarios to full `@storybook` suite.

## TRIAGE

- Primary failures identified as Story ID mismatches and assertion mismatches.
- Secondary reliability issues identified around router context and portal-rendered content.

## PLAN

- Correct story IDs against Storybook manifest entries.
- Stabilize assertions where raw text checks were brittle.
- Regenerate Playwright-BDD specs after each feature update.
- Re-run full Storybook-tagged suite until fully green.

## DESIGN_REVIEW

- Confirmed global data-router provider is required for route stories using router APIs.
- Confirmed local/nested `MemoryRouter` wrappers should be removed when global providers exist.
- Confirmed root-only assertions are insufficient for portal content; page assertions needed.

## IMPLEMENTING

- Updated Storybook feature files for components, forms, and routes to correct slugs and expectations.
- Updated shared steps to support both root and page-level assertions.
- Removed conflicting router wrapper usage from Storybook harness patterns where applicable.

## VERIFYING

- Regeneration command executed: `npx bddgen`.
- Verification command executed: `npx playwright test --grep "@storybook" --reporter=list`.
- Final validated result: `129 passed (1.5m)`.

## REMEDIATING

- Iterative remediation performed for each failing scenario from Playwright output.
- Replaced brittle text checks with role/accessible-name assertions where needed.
- Corrected expectations for route story output text where exact copy differed.

## FINAL_REVIEW

- Confirmed Storybook migration/readiness documentation reflects final passing status.
- Confirmed test and conventions docs include Storybook BDD workflow and guardrails.
- Confirmed tours docs reflect actual `.tour.json` filenames and validation commands.

## CLOSED_SUCCESS

- Closure state: `CLOSED_SUCCESS`.
- Exit criteria met: full Storybook tagged suite passing and documentation updated.

## Workflow States Not Taken

- `BLOCKED_NEEDS_INPUT`: not required.
- `CLOSED_FAILED`: not applicable.
- `CLOSED_ABORTED_POLICY`: not applicable.
- `ROLLED_BACK`: not required.
