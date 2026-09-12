# Copilot Instructions — NMI Customer Portal (source-map snapshot)

This workspace is a **source-map capture snapshot** of portal.measurement.gov.au captured via source maps. A root `package.json` exists with validation and test scripts; run commands from the workspace root.

## Key validation commands

- `npm run type-check` — TypeScript type checking
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run test:unit` — Unit tests (Vitest)
- `npm run test:ci` — Full CI gate
- `npm run test:e2e:app` — App Playwright-BDD suite
- `npm run test:e2e:storybook` — Storybook Playwright-BDD suite

**Playwright-BDD Fix with AI:** both BDD configs enable `aiFix.promptAttachment`. To generate an AI-fix prompt, run a failing BDD suite with `npm run test:e2e:app` or `npm run test:e2e:storybook`, then open the corresponding HTML report in `reports/playwright/app` or `reports/playwright/storybook` and copy the AI prompt attachment into Copilot, Codex, Claude, or another coding assistant.

## What to edit

| Edit | Path |
|---|---|
| Application source | `ClientApp/src/**/*.ts`, `ClientApp/src/**/*.tsx` |
| Styles | `ClientApp/src/styles/**/*.scss` |

**Never edit:** `ClientApp/src/api/web-api-client.ts`, `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/source-map-http-downloads/**`, `ClientApp/src/external/**`, `ClientApp/webpack/**`

## Critical conventions

- **Env vars** come from `window.*` at runtime. Import from `ClientApp/src/env.ts`, never `process.env`.
- **Yup custom validators** (`.allowedFormat()`, `.maxLength()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.postcode()`) live in `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`. Any schema file using them **must** add: `import '../../validationSchemas/yupExtensions';`
- **Auth guard**: protect routes with `<AuthenticatedElement>` from `ClientApp/src/authentication/AuthenticatedElement.tsx`.
- **Account state**: use hooks in `ClientApp/src/authentication/hooks.tsx`; do not import `AccountContext` directly.
- **Unsaved form prompts**: use `<UnsavedFormPrompt>` — do not re-implement `RouteLeavingGuard`.

## Key architecture

See [AGENTS.md](../AGENTS.md) for the full architecture map, tech-stack table, edit boundaries, and validation guidance.
