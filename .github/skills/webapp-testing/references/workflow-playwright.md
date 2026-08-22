# Playwright Workflow Reference

## Local browser verification workflow

1. Install project dependencies: `pnpm install`.
2. Install chromium browser: `npx playwright install chromium`.
3. Start local app with repository script (`npm run dev`).
4. Run e2e suite: `npm run test:e2e`.
5. If failures mention timeout on first route load, rerun the failed test after warm-up.
6. For visual checks, run the snapshot-focused tests and compare route-by-route.

## Failure triage order

1. Confirm route is reachable manually.
2. Confirm locator strategy (`getByRole` before brittle text selectors when possible).
3. Confirm whether failure is timeout vs assertion mismatch.
4. Check browser console logs for script/runtime errors.
5. Re-run with reduced concurrency if machine resource pressure is high.

## Project-specific notes

- Locale-prefixed routes can be slower during cold compilation.
- Keep imports strict in visual tests:
  - `expect`/`test` from `@playwright/test`
  - `takeSnapshot` from `@chromatic-com/playwright`
- When touching tests, run both `npm run lint` and `npm run check:types`.
