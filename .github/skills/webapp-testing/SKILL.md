---
name: webapp-testing
description: 'Toolkit for testing local web applications with Playwright in this repository. Use when asked to verify frontend functionality, debug UI behavior, capture screenshots, investigate browser console/network issues, or check visual regressions on routes like /, /about, /portfolio, and locale paths such as /fr.'
license: Apache-2.0
---

# Playwright Webapp Testing Skill

Use this skill to run reliable browser-based verification and debugging workflows for this project.

## When to Use This Skill

- User asks to test UI behavior in a real browser.
- User asks for screenshot capture or visual regression checks.
- User reports flaky page load, navigation, or timing behavior.
- User wants browser console/network evidence for frontend failures.
- User asks to validate localized pages (for example `/fr`).

## Prerequisites

- Install dependencies: `pnpm install`
- Ensure Playwright browsers are installed: `npx playwright install chromium`
- Use the repository test commands:
  - `npm run test:e2e`
  - `npm run storybook:test`

## Step-by-Step Workflows

### Verify core pages quickly

1. Ensure no stale Node processes are running before startup checks on Windows.
2. Start the app with the repository script (`npm run dev`).
3. Open and verify critical routes: `/`, `/about`, `/portfolio`, `/fr`.
4. Confirm key visible content is present using role/text locators.
5. Record failures with exact locator and URL context.

### Capture visual snapshots

1. Use Playwright tests under `tests/e2e/` for deterministic snapshots.
2. Use `takeSnapshot` from `@chromatic-com/playwright` only for snapshot capture.
3. Use `expect` and `test` from `@playwright/test` for matcher typing correctness.
4. Capture routes one-by-one to isolate visual drift.

### Investigate flaky local runs

1. Treat first-load locale routes as potentially slower due to cold compilation.
2. Re-run the failing test with reduced concurrency.
3. Check whether failure is timeout-first, then diagnose downstream errors.
4. Re-test with warmed server to separate cold-start vs logic regressions.

## Gotchas

- **Do not mix test runner imports** for assertions: use `expect`/`test` from `@playwright/test`; keep `takeSnapshot` from `@chromatic-com/playwright`.
- **Cold-start timing matters** for localized routes (`/fr`) and can mimic functional failures.
- **Type-aware lint can fail when `tsc` passes**; validate both when touching test files.
- **Avoid out-of-range numeric literals** in tests; prefer safe numeric expressions.

## Troubleshooting

| Issue                                  | Solution                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------- |
| E2E times out on first route load      | Warm the app once, then rerun; if needed reduce worker count for local runs |
| Snapshot test type errors on `expect`  | Import `expect` from `@playwright/test`                                     |
| Visual regression appears only locally | Re-run with same viewport/browser and compare after server warm-up          |
| Browser startup fails on local machine | Reinstall browser binary with `npx playwright install chromium`             |

## References

- Detailed workflows: [workflow-playwright.md](./references/workflow-playwright.md)
- Project test specs: [tests/e2e](../../../tests/e2e)
- Playwright config: [playwright.config.ts](../../../playwright.config.ts)
