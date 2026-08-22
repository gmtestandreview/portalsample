---
description: 'Guidance for Playwright-BDD config in playwright.config.ts. Use when choosing between featuresRoot and explicit features/steps options.'
applyTo: 'playwright.config.ts'
---

# Playwright BDD config rules

Use these rules when editing the Playwright-BDD project config.

## Scope

- Follow `AGENTS.md` first.
- Use `featuresRoot` only when every feature file and every step file for this BDD project share one root directory.
- Keep `features` and `steps` explicit when feature files and step files live under different roots, when step files are shared with another BDD project, or when a narrower feature glob must not change step discovery.
- Do not replace explicit `features` and `steps` with `featuresRoot` just to shorten the config.
- Set `outputDir` explicitly whenever generated tests must be written to a stable folder separate from source.

## Atomic checks

- If all features and steps share one root and no steps are shared elsewhere, prefer `featuresRoot`.
- If step definitions are shared across two BDD projects, keep `features` and `steps` explicit.
- If a narrower feature glob is needed without changing step discovery, keep `features` and `steps` explicit.
- If generated tests must land in a dedicated stable folder, keep `outputDir` explicit.

## Validation

- Preserve the current project layout unless the task explicitly changes it.
- If you change BDD config paths, verify generation still works with `pnpm exec bddgen` and the relevant `pnpm test:e2e -- --project=app-bdd` run.
- Report any config mismatch honestly instead of guessing a new layout.
